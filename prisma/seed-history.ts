/**
 * Seed de histórico para testar gráficos e insights.
 * Não toca em hoje nem ontem — apenas dias mais antigos.
 * Idempotente: usa upsert/skip quando o registro já existe.
 *
 * Uso: npm run db:seed-history
 */
import "dotenv/config";
import { subDays } from "date-fns";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  const prisma = new PrismaClient({ adapter });

  const alex = await prisma.persona.findFirst({ where: { name: "Alex" } });
  if (!alex) {
    console.error("Alex não encontrado. Rode `npm run db:seed` primeiro.");
    process.exit(1);
  }

  console.log(`📊 Gerando histórico simulado de 28 dias para ${alex.name}…`);

  // Limpa históricos passados (mantém hoje e ontem)
  const cutoff = subDays(new Date(isoDate(new Date())), 2);
  await prisma.waterLog.deleteMany({
    where: { personaId: alex.id, date: { lt: cutoff } },
  });
  await prisma.weightLog.deleteMany({
    where: { personaId: alex.id, date: { lt: cutoff } },
  });
  await prisma.dailyMealLog.deleteMany({
    where: { personaId: alex.id, date: { lt: cutoff } },
  });
  await prisma.dailySummary.deleteMany({
    where: { personaId: alex.id, date: { lt: cutoff } },
  });

  const diet = await prisma.diet.findFirst({
    where: { personaId: alex.id, isActive: true },
    include: { meals: { include: { options: true } } },
  });

  // Tendência de perda: ~0.25kg/semana ≈ 0.036kg/dia, com ruído
  const startWeight = 82.4;
  const dailyTrend = -0.035;

  const rand = mulberry32(42); // seed fixo para reprodutibilidade

  // 28 dias de histórico (de 29 dias atrás até 2 dias atrás)
  for (let i = 29; i >= 2; i--) {
    const day = subDays(new Date(isoDate(new Date())), i);
    const dateOnly = new Date(isoDate(day));
    const dow = day.getDay();
    const isWeekend = dow === 0 || dow === 6;

    // Peso: tendência + ruído
    const noise = (rand() - 0.5) * 0.6;
    const trendOffset = dailyTrend * (29 - i);
    const weight = +(startWeight + trendOffset + noise).toFixed(2);
    await prisma.weightLog.create({
      data: {
        personaId: alex.id,
        weightKg: weight,
        date: dateOnly,
        notes: isWeekend && rand() > 0.7 ? "Final de semana mais livre" : null,
      },
    });

    // Água: dias úteis ficam próximo da meta; fim de semana cai 25-40%
    const goal = alex.dailyWaterMl;
    const dayFactor = isWeekend ? 0.55 + rand() * 0.3 : 0.85 + rand() * 0.2;
    const totalWater = Math.round((goal * dayFactor) / 100) * 100;
    // distribui em 4-6 registros ao longo do dia
    const drinks = 4 + Math.floor(rand() * 3);
    let logged = 0;
    for (let k = 0; k < drinks; k++) {
      const portion = k === drinks - 1 ? totalWater - logged : Math.round(totalWater / drinks);
      logged += portion;
      const hour = 7 + Math.floor((k / drinks) * 14);
      const loggedAt = new Date(day);
      loggedAt.setHours(hour, Math.floor(rand() * 60), 0, 0);
      await prisma.waterLog.create({
        data: {
          personaId: alex.id,
          amountMl: portion,
          loggedAt,
          date: dateOnly,
        },
      });
    }

    // Refeições: marca status com probabilidades realistas
    if (diet) {
      for (const meal of diet.meals) {
        const option = meal.options[0];
        if (!option) continue;
        const r = rand();
        // Café da manhã: 85% feito, jantar 80%, lanches: 60% feito
        let probDone = 0.75;
        if (meal.name.toLowerCase().includes("café")) probDone = 0.85;
        if (meal.name.toLowerCase().includes("jantar")) probDone = 0.8;
        if (meal.name.toLowerCase().includes("lanche")) probDone = 0.55;
        if (meal.name.toLowerCase().includes("ceia")) probDone = 0.5;
        if (isWeekend) probDone -= 0.15;

        let status: "done" | "partial" | "skipped";
        if (r < probDone) status = "done";
        else if (r < probDone + 0.12) status = "partial";
        else status = "skipped";

        await prisma.dailyMealLog.create({
          data: {
            personaId: alex.id,
            mealId: meal.id,
            mealOptionId: status !== "skipped" ? option.id : null,
            date: dateOnly,
            status,
            completedAt: status === "done" ? day : null,
          },
        });
      }
    }

    // DailySummary: score básico + check-in em ~60% dos dias
    const mealLogs = diet
      ? await prisma.dailyMealLog.findMany({
          where: { personaId: alex.id, date: dateOnly },
        })
      : [];
    const totalMeals = diet?.meals.length ?? 0;
    const done = mealLogs.filter((l) => l.status === "done").length;
    const partial = mealLogs.filter((l) => l.status === "partial").length;
    const skipped = mealLogs.filter((l) => l.status === "skipped").length;
    const mealsRatio =
      totalMeals === 0
        ? 0
        : (done + partial * 0.5 + skipped * 0.25) / totalMeals;
    const waterRatio = Math.min(1, totalWater / goal);
    const hasCheckin = rand() < 0.6;
    const mealsScore = Math.round(mealsRatio * 60);
    const waterScore = Math.round(waterRatio * 30);
    const checkinScore = hasCheckin ? 10 : 0;
    const overall = mealsScore + waterScore + checkinScore;

    await prisma.dailySummary.create({
      data: {
        personaId: alex.id,
        date: dateOnly,
        mealsScore,
        waterScore,
        overallScore: overall,
        energyLevel: hasCheckin ? 1 + Math.floor(rand() * 5) : null,
        moodLevel: hasCheckin ? 1 + Math.floor(rand() * 5) : null,
        hungerLevel: hasCheckin ? 1 + Math.floor(rand() * 5) : null,
      },
    });
  }

  console.log("✅ Histórico simulado gerado.");
  await prisma.$disconnect();
}

// PRNG determinístico
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = seed;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

main().catch((err) => {
  console.error("❌ Falhou:", err);
  process.exit(1);
});
