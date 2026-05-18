"use server";

import { revalidatePath } from "next/cache";
import { subDays } from "date-fns";
import { z } from "zod";
import { zodTextFormat } from "openai/helpers/zod";
import { dateKey, isoDate } from "@/lib/dates";
import { prisma } from "@/lib/prisma";
import { getOpenAI, isOpenAIConfigured } from "@/lib/openai";
import {
  smartShoppingSchema,
  substitutionsSchema,
  weeklyReviewSchema,
  type SmartShopping,
  type Substitutions,
  type WeeklyReview,
} from "@/schemas/ai-coach";

const MODEL = "gpt-4o-mini";

function assertOpenAI() {
  if (!isOpenAIConfigured()) {
    throw new Error(
      "OPENAI_API_KEY não configurada. Adicione a chave no .env para usar a IA."
    );
  }
}

// ============================================================
// Resumo semanal
// ============================================================
export async function generateWeeklyReview(personaId: string): Promise<WeeklyReview> {
  assertOpenAI();
  const persona = await prisma.persona.findUnique({
    where: { id: personaId },
    include: { nutritionProfile: true },
  });
  if (!persona) throw new Error("Persona não encontrada.");

  const now = new Date();
  const today = dateKey(now);
  const start = subDays(today, 6);

  const [summaries, weights, waterAgg, mealLogs, freeMeals] = await Promise.all([
    prisma.dailySummary.findMany({
      where: { personaId, date: { gte: start, lte: today } },
      orderBy: { date: "asc" },
    }),
    prisma.weightLog.findMany({
      where: { personaId, date: { gte: start, lte: today } },
      orderBy: { date: "asc" },
    }),
    prisma.$queryRaw<Array<{ d: string; total: number }>>`
      SELECT to_char(date, 'YYYY-MM-DD') AS d, SUM("amountMl")::int AS total
      FROM "WaterLog"
      WHERE "personaId" = ${personaId}
      AND date >= ${start}
      AND date <= ${today}
      GROUP BY date
      ORDER BY date ASC
    `,
    prisma.dailyMealLog.findMany({
      where: { personaId, date: { gte: start, lte: today } },
      include: { meal: true },
    }),
    prisma.freeMeal.findMany({
      where: { personaId, date: { gte: start, lte: today } },
    }),
  ]);

  const mealsByDate = new Map<string, { done: number; partial: number; skipped: number }>();
  for (const l of mealLogs) {
    const k = isoDate(l.date);
    const e = mealsByDate.get(k) ?? { done: 0, partial: 0, skipped: 0 };
    if (l.status === "done") e.done++;
    else if (l.status === "partial") e.partial++;
    else if (l.status === "skipped") e.skipped++;
    mealsByDate.set(k, e);
  }

  const inputSnapshot = {
    persona: {
      name: persona.name,
      goal: persona.goal,
      dailyWaterMl: persona.dailyWaterMl,
      targetWeightKg: persona.targetWeightKg,
    },
    period: { start: isoDate(start), end: isoDate(today) },
    days: Array.from({ length: 7 }, (_, i) => {
      const d = isoDate(subDays(today, 6 - i));
      const summary = summaries.find((s) => isoDate(s.date) === d);
      const weight = weights.find((w) => isoDate(w.date) === d);
      const water = waterAgg.find((w) => w.d === d);
      const meals = mealsByDate.get(d) ?? { done: 0, partial: 0, skipped: 0 };
      return {
        date: d,
        weightKg: weight?.weightKg ?? null,
        waterMl: water ? Number(water.total) : 0,
        meals,
        score: summary?.overallScore ?? null,
        energy: summary?.energyLevel ?? null,
        mood: summary?.moodLevel ?? null,
        hunger: summary?.hungerLevel ?? null,
      };
    }),
    freeMeals: freeMeals.map((f) => ({
      date: isoDate(f.date),
      type: f.type,
      impact: f.impact,
    })),
  };

  const system = `Você é um coach pessoal de hábitos saudáveis, com tom acolhedor e direto, em português brasileiro.

Regras:
- Use linguagem motivacional sem ser apelativo nem usar clichês ("não desista").
- Seja específico: refira-se a números, tendências e padrões reais dos dados.
- Não dê diagnóstico médico, nem prometa resultado.
- Tom positivo se a semana foi boa, atenção se houve queda — nunca pessimista.
- Sugestões devem ser acionáveis e específicas (ex: "antecipar 500ml até as 10h"), não genéricas.
- Foco em comportamento, não em peso isolado.
- Resposta sempre em pt-BR.`;

  const user = `Analise a última semana de ${persona.name} e gere um resumo estruturado.

Objetivo: ${persona.goal ?? "saúde geral"}.
Meta de água diária: ${persona.dailyWaterMl}ml.
${persona.targetWeightKg ? `Meta de peso: ${persona.targetWeightKg}kg.` : ""}

Dados crus dos últimos 7 dias (mais antigo → mais recente):
${JSON.stringify(inputSnapshot.days, null, 2)}

${inputSnapshot.freeMeals.length > 0 ? `Refeições livres na semana:\n${JSON.stringify(inputSnapshot.freeMeals, null, 2)}` : "Sem refeições livres registradas."}

Gere a análise.`;

  const openai = getOpenAI();
  const response = await openai.responses.parse({
    model: MODEL,
    input: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    text: { format: zodTextFormat(weeklyReviewSchema, "weekly_review") },
  });

  const output = response.output_parsed;
  if (!output) throw new Error("A IA não retornou um resumo válido.");

  await prisma.aiCoachReport.create({
    data: {
      personaId,
      type: "weekly_review",
      periodStart: start,
      periodEnd: today,
      inputSnapshot: inputSnapshot as unknown as object,
      outputJson: output as unknown as object,
      summary: output.headline,
      model: MODEL,
      tokensIn: response.usage?.input_tokens ?? null,
      tokensOut: response.usage?.output_tokens ?? null,
    },
  });

  revalidatePath("/coach");
  return output;
}

// ============================================================
// Substituições por refeição
// ============================================================
export async function generateMealSubstitutions(
  mealOptionId: string,
  hint?: string
): Promise<Substitutions> {
  assertOpenAI();
  const option = await prisma.mealOption.findUnique({
    where: { id: mealOptionId },
    include: {
      foodItems: { orderBy: { sortOrder: "asc" } },
      meal: { include: { diet: { include: { persona: { include: { nutritionProfile: true } } } } } },
    },
  });
  if (!option) throw new Error("Opção não encontrada.");
  const persona = option.meal.diet.persona;
  const profile = persona.nutritionProfile;

  const inputSnapshot = {
    meal: { name: option.meal.name, scheduledAt: option.meal.scheduledAt },
    currentOption: {
      name: option.name,
      foods: option.foodItems.map((f) => ({
        name: f.name,
        quantity: f.quantity,
        unit: f.unit,
      })),
    },
    persona: {
      goal: persona.goal,
      region: persona.region,
      allergies: profile?.allergies ?? [],
      intolerances: profile?.intolerances ?? [],
      dislikedFoods: profile?.dislikedFoods ?? [],
      preferredFoods: profile?.preferredFoods ?? [],
      budgetLevel: profile?.budgetLevel,
    },
    hint: hint ?? null,
  };

  const system = `Você cria substituições para refeições em planos alimentares brasileiros simples.

Regras:
- Respeite ALERGIAS e intolerâncias rigorosamente (proibido usar).
- Evite alimentos que a persona não gosta.
- Prefira alimentos comuns e fáceis de encontrar no Brasil.
- Mantenha aproximadamente o mesmo aporte calórico e funcional (proteína se café com proteína, carbo se almoço com carbo, etc).
- Quantidades realistas em g/ml/unidades.
- Sempre devolva 3 alternativas diferentes entre si.
- Em rationale, explique em 1 frase por que a substituição funciona.`;

  const user = `Substitua a opção de refeição abaixo por 3 alternativas equivalentes.

Refeição: ${option.meal.name} (horário ${option.meal.scheduledAt})
Opção atual: ${option.name}
${JSON.stringify(inputSnapshot.currentOption.foods, null, 2)}

Contexto da persona:
${JSON.stringify(inputSnapshot.persona, null, 2)}

${hint ? `Pedido extra: ${hint}` : ""}`;

  const openai = getOpenAI();
  const response = await openai.responses.parse({
    model: MODEL,
    input: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    text: { format: zodTextFormat(substitutionsSchema, "substitutions") },
  });
  const output = response.output_parsed;
  if (!output) throw new Error("Sem alternativas geradas.");

  await prisma.aiCoachReport.create({
    data: {
      personaId: persona.id,
      type: "substitutions",
      inputSnapshot: inputSnapshot as unknown as object,
      outputJson: output as unknown as object,
      summary: `Substituições para "${option.name}"`,
      model: MODEL,
      tokensIn: response.usage?.input_tokens ?? null,
      tokensOut: response.usage?.output_tokens ?? null,
    },
  });

  return output;
}

const applySchema = z.object({
  optionId: z.string().min(1),
  newName: z.string().min(1),
  foodItems: z
    .array(
      z.object({
        name: z.string(),
        quantity: z.number().nullable(),
        unit: z.string().nullable(),
      })
    )
    .min(1),
});

export async function applySubstitution(input: z.input<typeof applySchema>) {
  const data = applySchema.parse(input);
  await prisma.$transaction(async (tx) => {
    await tx.foodItem.deleteMany({ where: { mealOptionId: data.optionId } });
    await tx.mealOption.update({
      where: { id: data.optionId },
      data: { name: data.newName },
    });
    await tx.foodItem.createMany({
      data: data.foodItems.map((f, i) => ({
        mealOptionId: data.optionId,
        name: f.name,
        quantity: f.quantity,
        unit: f.unit,
        sortOrder: i,
      })),
    });
  });
  revalidatePath("/diet");
  revalidatePath("/diet/edit");
  revalidatePath("/today");
}

// ============================================================
// Lista de compras semanal com IA
// ============================================================
export async function generateSmartShoppingList(
  personaId: string,
  days: number = 7
): Promise<SmartShopping> {
  assertOpenAI();
  const persona = await prisma.persona.findUnique({
    where: { id: personaId },
    include: { nutritionProfile: true },
  });
  if (!persona) throw new Error("Persona não encontrada.");

  const diet = await prisma.diet.findFirst({
    where: { personaId, isActive: true },
    include: {
      meals: {
        orderBy: { sortOrder: "asc" },
        include: { options: { include: { foodItems: true } } },
      },
    },
  });
  if (!diet) throw new Error("Nenhuma dieta ativa para gerar lista.");

  const dietSnapshot = diet.meals.map((m) => ({
    name: m.name,
    options: m.options.map((o) => ({
      name: o.name,
      foods: o.foodItems.map((f) => ({
        name: f.name,
        quantity: f.quantity,
        unit: f.unit,
      })),
    })),
  }));

  const inputSnapshot = {
    persona: { name: persona.name, region: persona.region, budgetLevel: persona.nutritionProfile?.budgetLevel },
    days,
    diet: dietSnapshot,
  };

  const system = `Você gera listas de compras realistas para planos alimentares brasileiros.

Regras:
- Para cada item, calcule a quantidade necessária para o período usando a dieta como base.
- Use UNIDADES DE EMBALAGEM REAIS (1kg, 1.5kg, 500g, 200g, 12 unidades, 1L, 500ml). Arredonde para cima.
- Considere variação de opções por refeição (ex: se há 3 opções, não some 3x a quantidade — estime que cada opção é usada ~1/3 das vezes).
- Não inclua "água" como item (já é entendido como base).
- Categorize cada item.
- Em rationale, opcionalmente explique a estimativa em 1 frase curta.`;

  const user = `Gere a lista de compras para ${days} dias de ${persona.name}.

Dieta ativa (${diet.meals.length} refeições):
${JSON.stringify(dietSnapshot, null, 2)}

Região: ${persona.region ?? "Brasil"}
Orçamento: ${persona.nutritionProfile?.budgetLevel ?? "normal"}

Gere a lista.`;

  const openai = getOpenAI();
  const response = await openai.responses.parse({
    model: MODEL,
    input: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    text: { format: zodTextFormat(smartShoppingSchema, "smart_shopping") },
  });
  const output = response.output_parsed;
  if (!output) throw new Error("Lista não gerada.");

  await prisma.aiCoachReport.create({
    data: {
      personaId,
      type: "smart_shopping",
      inputSnapshot: inputSnapshot as unknown as object,
      outputJson: output as unknown as object,
      summary: `Lista de compras IA (${days}d)`,
      model: MODEL,
      tokensIn: response.usage?.input_tokens ?? null,
      tokensOut: response.usage?.output_tokens ?? null,
    },
  });

  return output;
}

export async function applySmartShoppingList(
  personaId: string,
  items: SmartShopping["items"]
) {
  // Remove autos não marcados, mantém manual + auto marcado
  await prisma.shoppingItem.deleteMany({
    where: { personaId, source: "auto", checked: false },
  });
  const categoryMap: Record<string, string> = {
    proteina: "proteína",
    carb: "carb",
    verdura: "verdura",
    fruta: "fruta",
    laticinio: "outros",
    outros: "outros",
  };
  await prisma.shoppingItem.createMany({
    data: items.map((i) => ({
      personaId,
      name: i.name,
      quantity: i.quantity,
      category: categoryMap[i.category] ?? "outros",
      source: "auto",
    })),
  });
  revalidatePath("/shopping");
}
