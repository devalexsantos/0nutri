"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { zodTextFormat } from "openai/helpers/zod";
import { prisma } from "@/lib/prisma";
import { getOpenAI, isOpenAIConfigured } from "@/lib/openai";
import { aiDietSchema, type AiDietOutput } from "@/schemas/ai-diet";
import { nutritionProfileSchema, type NutritionProfileInput } from "@/schemas/nutrition-profile";

const PROMPT_VERSION = "0nutri.ai-diet.v1";

const SYSTEM_PROMPT = `Você é um assistente que monta planos alimentares brasileiros, simples, realistas e acessíveis.

Regras obrigatórias:
- Sempre retorne JSON no schema solicitado. Nunca texto livre.
- Nunca prometa cura, resultado garantido ou prazo agressivo.
- Não recomende jejum extremo nem cortar grupos alimentares sem necessidade.
- Não indique suplementos como obrigatórios.
- Respeite rigorosamente: alergias, intolerâncias, restrições médicas, alimentos que a persona não gosta.
- Priorize alimentos brasileiros comuns e de fácil acesso na região informada.
- Sempre adicione um warning de que o plano é sugestão de IA e não substitui acompanhamento profissional.
- Quantidades devem ser realistas em g/ml/unidades; quando 'à vontade', deixe quantity null com unit null.
- Gere de 3 a 6 refeições conforme desejado.
- Cada refeição deve ter de 1 a 3 opções.

Estilo:
- Refeições nomeadas em português: 'Café da manhã', 'Lanche da manhã', 'Almoço', etc.
- Horários em HH:mm coerentes com a rotina (acordar/dormir).
- Opções nomeadas como 'Opção 1 — descrição curta'.`;

export async function saveNutritionProfile(personaId: string, input: NutritionProfileInput) {
  const data = nutritionProfileSchema.parse(input);
  await prisma.nutritionProfile.upsert({
    where: { personaId },
    create: { personaId, ...data },
    update: data,
  });
  revalidatePath("/ai-diet");
}

const generateInputSchema = z.object({
  personaId: z.string().min(1),
  profile: nutritionProfileSchema,
});

export async function generateAiDiet(input: z.infer<typeof generateInputSchema>) {
  const parsed = generateInputSchema.parse(input);
  if (!isOpenAIConfigured()) {
    throw new Error(
      "OPENAI_API_KEY não configurada. Adicione a chave no .env para gerar dieta com IA."
    );
  }

  const persona = await prisma.persona.findUnique({ where: { id: parsed.personaId } });
  if (!persona) throw new Error("Persona não encontrada.");

  // Salva o perfil antes de gerar
  await saveNutritionProfile(parsed.personaId, parsed.profile);

  const inputSnapshot = {
    persona: {
      name: persona.name,
      age: persona.age,
      sex: persona.sex,
      heightCm: persona.heightCm,
      initialWeightKg: persona.initialWeightKg,
      targetWeightKg: persona.targetWeightKg,
      dailyWaterMl: persona.dailyWaterMl,
      goal: persona.goal,
      activityLevel: persona.activityLevel,
      region: persona.region,
    },
    profile: parsed.profile,
    promptVersion: PROMPT_VERSION,
  };

  const generation = await prisma.aiDietGeneration.create({
    data: {
      personaId: parsed.personaId,
      promptVersion: PROMPT_VERSION,
      status: "draft",
      inputSnapshot: inputSnapshot as unknown as object,
    },
  });

  try {
    const userPrompt = buildUserPrompt(persona, parsed.profile);
    const openai = getOpenAI();

    const response = await openai.responses.parse({
      model: "gpt-4o-mini",
      input: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      text: {
        format: zodTextFormat(aiDietSchema, "diet_plan"),
      },
    });

    const output = response.output_parsed;
    if (!output) {
      throw new Error("A IA não retornou um plano válido. Tente novamente.");
    }

    await prisma.aiDietGeneration.update({
      where: { id: generation.id },
      data: { outputJson: output as unknown as object },
    });

    return { generationId: generation.id, output };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro desconhecido na IA.";
    await prisma.aiDietGeneration.update({
      where: { id: generation.id },
      data: { status: "error", errorMessage: message },
    });
    throw err;
  }
}

/**
 * Gera uma variante da dieta ATIVA atual: econômica ou rápida de preparar.
 * Usa o mesmo fluxo de AiDietGeneration (preview → import).
 */
const variantSchema = z.object({
  personaId: z.string().min(1),
  variant: z.enum(["economica", "rapida"]),
});

export async function generateDietVariant(input: z.input<typeof variantSchema>) {
  const parsed = variantSchema.parse(input);
  if (!isOpenAIConfigured()) {
    throw new Error("OPENAI_API_KEY não configurada.");
  }

  const persona = await prisma.persona.findUnique({
    where: { id: parsed.personaId },
    include: { nutritionProfile: true },
  });
  if (!persona) throw new Error("Persona não encontrada.");

  const currentDiet = await prisma.diet.findFirst({
    where: { personaId: parsed.personaId, isActive: true },
    include: {
      meals: {
        orderBy: { sortOrder: "asc" },
        include: { options: { include: { foodItems: true } } },
      },
    },
  });
  if (!currentDiet) {
    throw new Error("Nenhuma dieta ativa para gerar variante.");
  }

  const currentSnapshot = currentDiet.meals.map((m) => ({
    name: m.name,
    scheduledAt: m.scheduledAt,
    options: m.options.map((o) => ({
      name: o.name,
      foods: o.foodItems.map((f) => ({
        name: f.name,
        quantity: f.quantity,
        unit: f.unit,
      })),
    })),
  }));

  const variantPrompt =
    parsed.variant === "economica"
      ? `Gere uma VERSÃO ECONÔMICA da dieta atual. Mantenha o aporte funcional (proteína/carbo/etc) mas substitua por opções de menor custo no Brasil: ovo no lugar de whey, sardinha no lugar de salmão, frango no lugar de filé mignon, etc. Priorize alimentos baratos e em embalagens grandes.`
      : `Gere uma VERSÃO COM MENOS TEMPO DE PREPARO. Mantenha o aporte funcional mas substitua por opções mais rápidas: omelete em vez de cozido elaborado, frango grelhado simples, tapioca, iogurte, alimentos prontos saudáveis. Priorize refeições que ficam prontas em até 15 minutos.`;

  const inputSnapshot = {
    persona: {
      name: persona.name,
      age: persona.age,
      sex: persona.sex,
      heightCm: persona.heightCm,
      initialWeightKg: persona.initialWeightKg,
      targetWeightKg: persona.targetWeightKg,
      dailyWaterMl: persona.dailyWaterMl,
      goal: persona.goal,
      region: persona.region,
    },
    variant: parsed.variant,
    currentDiet: { name: currentDiet.name, meals: currentSnapshot },
    profile: persona.nutritionProfile,
    promptVersion: `${PROMPT_VERSION}+variant`,
  };

  const generation = await prisma.aiDietGeneration.create({
    data: {
      personaId: parsed.personaId,
      promptVersion: `${PROMPT_VERSION}+variant`,
      status: "draft",
      inputSnapshot: inputSnapshot as unknown as object,
    },
  });

  try {
    const userPrompt = `${variantPrompt}

Persona: ${persona.name} (${persona.heightCm ?? "—"}cm, peso ${persona.initialWeightKg ?? "—"}kg → meta ${persona.targetWeightKg ?? "—"}kg, objetivo: ${persona.goal ?? "saúde"})
Região: ${persona.region ?? "Brasil"}
Alergias: ${persona.nutritionProfile?.allergies?.join(", ") || "nenhuma"}
Intolerâncias: ${persona.nutritionProfile?.intolerances?.join(", ") || "nenhuma"}
Não gosta: ${persona.nutritionProfile?.dislikedFoods?.join(", ") || "—"}

Dieta atual de referência (preserve estrutura/horários, troque as opções/quantidades):
${JSON.stringify(currentSnapshot, null, 2)}

Devolva a dieta no formato JSON pedido.`;

    const openai = getOpenAI();
    const response = await openai.responses.parse({
      model: "gpt-4o-mini",
      input: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      text: { format: zodTextFormat(aiDietSchema, "diet_plan") },
    });

    const output = response.output_parsed;
    if (!output) {
      throw new Error("A IA não retornou um plano válido.");
    }

    await prisma.aiDietGeneration.update({
      where: { id: generation.id },
      data: { outputJson: output as unknown as object },
    });

    return { generationId: generation.id, output };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro desconhecido na IA.";
    await prisma.aiDietGeneration.update({
      where: { id: generation.id },
      data: { status: "error", errorMessage: message },
    });
    throw err;
  }
}

export async function importAiDiet(generationId: string, activate = true) {
  const generation = await prisma.aiDietGeneration.findUnique({
    where: { id: generationId },
  });
  if (!generation || !generation.outputJson) {
    throw new Error("Geração não encontrada ou sem resultado.");
  }
  const output = generation.outputJson as unknown as AiDietOutput;
  const validated = aiDietSchema.parse(output);

  if (activate) {
    await prisma.diet.updateMany({
      where: { personaId: generation.personaId, isActive: true },
      data: { isActive: false },
    });
  }

  const diet = await prisma.diet.create({
    data: {
      personaId: generation.personaId,
      name: validated.dietName,
      description: validated.notes.join(" · ") || null,
      objective: validated.objective,
      isActive: activate,
      startDate: activate ? new Date() : null,
      meals: {
        create: validated.meals.map((meal, mIdx) => ({
          name: meal.name,
          scheduledAt: meal.scheduledAt,
          sortOrder: mIdx,
          options: {
            create: meal.options.map((opt, oIdx) => ({
              name: opt.name,
              calories: opt.calories,
              proteinGrams: opt.proteinGrams,
              carbsGrams: opt.carbsGrams,
              fatGrams: opt.fatGrams,
              sortOrder: oIdx,
              foodItems: {
                create: opt.foodItems.map((f, fIdx) => ({
                  name: f.name,
                  quantity: f.quantity,
                  unit: f.unit,
                  sortOrder: fIdx,
                })),
              },
            })),
          },
        })),
      },
    },
  });

  await prisma.aiDietGeneration.update({
    where: { id: generationId },
    data: { status: "imported", importedDietId: diet.id },
  });

  revalidatePath("/ai-diet");
  revalidatePath("/diet");
  revalidatePath("/today");

  return diet;
}

function buildUserPrompt(
  persona: {
    name: string;
    age: number | null;
    sex: string | null;
    heightCm: number | null;
    initialWeightKg: number | null;
    targetWeightKg: number | null;
    dailyWaterMl: number;
    goal: string | null;
    activityLevel: string | null;
    region: string | null;
  },
  profile: NutritionProfileInput
) {
  const candidates: unknown[] = [
    `Monte um plano alimentar para ${persona.name}.`,
    persona.age && `Idade: ${persona.age}`,
    persona.sex && `Sexo: ${persona.sex}`,
    persona.heightCm && `Altura: ${persona.heightCm}cm`,
    persona.initialWeightKg && `Peso atual: ${persona.initialWeightKg}kg`,
    persona.targetWeightKg && `Meta de peso: ${persona.targetWeightKg}kg`,
    `Meta de água diária: ${persona.dailyWaterMl}ml`,
    persona.goal && `Objetivo: ${persona.goal}`,
    persona.activityLevel && `Nível de atividade: ${persona.activityLevel}`,
    persona.region && `Região: ${persona.region}`,
    profile.wakeTime && `Acorda às: ${profile.wakeTime}`,
    profile.sleepTime && `Dorme às: ${profile.sleepTime}`,
    profile.desiredMealsPerDay && `Quantidade desejada de refeições: ${profile.desiredMealsPerDay}`,
    profile.workRoutine && `Rotina de trabalho: ${profile.workRoutine}`,
    profile.trainingRoutine && `Rotina de treino: ${profile.trainingRoutine}`,
    profile.mainDifficulty && `Maior dificuldade: ${profile.mainDifficulty}`,
    profile.budgetLevel && `Orçamento: ${profile.budgetLevel}`,
    profile.preparationPreference && `Preferência de preparo: ${profile.preparationPreference}`,
    profile.preferredFoods.length > 0 && `Alimentos base preferidos: ${profile.preferredFoods.join(", ")}`,
    profile.foodPreferences.length > 0 && `Outras preferências: ${profile.foodPreferences.join(", ")}`,
    profile.dislikedFoods.length > 0 && `Alimentos que NÃO gosta (evitar): ${profile.dislikedFoods.join(", ")}`,
    profile.allergies.length > 0 && `ALERGIAS (proibido usar): ${profile.allergies.join(", ")}`,
    profile.intolerances.length > 0 && `Intolerâncias (evitar): ${profile.intolerances.join(", ")}`,
    profile.medicalRestrictions && `Restrições médicas: ${profile.medicalRestrictions}`,
    `Mostrar calorias estimadas: ${profile.showCalories ? "sim" : "não"}`,
    `Mostrar macros estimados: ${profile.showMacros ? "sim" : "não"}`,
    `Incluir lista de compras: ${profile.includeShoppingList ? "sim" : "não"}`,
    "",
    "Devolva a dieta no schema JSON com refeições em ordem cronológica, opções intercambiáveis e quantidades realistas.",
  ];
  return candidates.filter((l): l is string => typeof l === "string" && l.length > 0).join("\n");
}
