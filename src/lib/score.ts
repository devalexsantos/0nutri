import { isoDate } from "@/lib/dates";
import { prisma } from "@/lib/prisma";
import { getMealsForToday } from "@/lib/meals";
import { getTodayWaterIntake } from "@/lib/water";

export type DailyScore = {
  total: number;
  meals: number;
  water: number;
  checkin: number;
  mealsRatio: number; // 0..1 de refeições concluídas (parcial conta meio)
  waterRatio: number; // 0..1 de água vs meta
  hasCheckin: boolean;
  totalMeals: number;
  doneMeals: number;
  partialMeals: number;
  skippedMeals: number;
};

const MEALS_WEIGHT = 60;
const WATER_WEIGHT = 30;
const CHECKIN_WEIGHT = 10;

export async function computeDailyScore(
  personaId: string,
  dailyWaterMl: number,
  now: Date = new Date()
): Promise<DailyScore> {
  const dateOnly = new Date(isoDate(now));
  const [meals, consumedMl, summary] = await Promise.all([
    getMealsForToday(personaId, now),
    getTodayWaterIntake(personaId, now),
    prisma.dailySummary.findUnique({
      where: { personaId_date: { personaId, date: dateOnly } },
    }),
  ]);

  const totalMeals = meals.length;
  const doneMeals = meals.filter((m) => m.status === "done").length;
  const partialMeals = meals.filter((m) => m.status === "partial").length;
  const skippedMeals = meals.filter((m) => m.status === "skipped").length;

  // Refeições puladas contam como "tratadas" (decisão consciente), mas valem menos do que feitas.
  // Cada feita = 1, parcial = 0.5, pulada = 0.25. Sem refeições → 0.
  const mealsRaw =
    totalMeals === 0
      ? 0
      : (doneMeals + partialMeals * 0.5 + skippedMeals * 0.25) / totalMeals;
  const mealsRatio = Math.min(1, mealsRaw);

  const waterRatio = dailyWaterMl > 0 ? Math.min(1, consumedMl / dailyWaterMl) : 0;
  const hasCheckin = Boolean(summary?.energyLevel || summary?.moodLevel || summary?.hungerLevel);

  const mealsScore = mealsRatio * MEALS_WEIGHT;
  const waterScore = waterRatio * WATER_WEIGHT;
  const checkinScore = hasCheckin ? CHECKIN_WEIGHT : 0;

  return {
    total: Math.round(mealsScore + waterScore + checkinScore),
    meals: Math.round(mealsScore),
    water: Math.round(waterScore),
    checkin: checkinScore,
    mealsRatio,
    waterRatio,
    hasCheckin,
    totalMeals,
    doneMeals,
    partialMeals,
    skippedMeals,
  };
}

export async function persistDailyScore(personaId: string, score: DailyScore, now: Date = new Date()) {
  const dateOnly = new Date(isoDate(now));
  await prisma.dailySummary.upsert({
    where: { personaId_date: { personaId, date: dateOnly } },
    create: {
      personaId,
      date: dateOnly,
      mealsScore: score.meals,
      waterScore: score.water,
      overallScore: score.total,
    },
    update: {
      mealsScore: score.meals,
      waterScore: score.water,
      overallScore: score.total,
    },
  });
}

export function describeScore(score: DailyScore): string {
  if (score.total >= 90) return "Dia excelente.";
  if (score.total >= 75) return "Bom dia até agora.";
  if (score.total >= 50) return "No caminho — dá para melhorar.";
  if (score.total >= 25) return "Atenção: ainda há tempo de recuperar o dia.";
  return "Dia começando — vamos lá.";
}
