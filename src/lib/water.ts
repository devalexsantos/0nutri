import { dateKey } from "@/lib/dates";
import { prisma } from "@/lib/prisma";

export async function getTodayWaterIntake(personaId: string, now: Date = new Date()) {
  const dateOnly = dateKey(now);
  const result = await prisma.waterLog.aggregate({
    where: { personaId, date: dateOnly },
    _sum: { amountMl: true },
  });
  return result._sum.amountMl ?? 0;
}

export async function listWaterLogsForDate(personaId: string, date: Date = new Date()) {
  const dateOnly = dateKey(date);
  return prisma.waterLog.findMany({
    where: { personaId, date: dateOnly },
    orderBy: { loggedAt: "asc" },
  });
}

export function waterProgress(consumedMl: number, goalMl: number) {
  if (goalMl <= 0) return 0;
  return Math.min(1, consumedMl / goalMl);
}

/**
 * Compara consumo atual com a fração esperada do dia (06:00–23:00 por padrão).
 * Retorna mensagem contextual.
 */
export function waterFeedback(
  consumedMl: number,
  goalMl: number,
  now: Date = new Date(),
  dayStart = 6,
  dayEnd = 23,
): { tone: "good" | "behind" | "great" | "neutral"; message: string } {
  if (consumedMl >= goalMl) {
    return { tone: "great", message: "Você bateu sua meta de água hoje. Excelente." };
  }
  const minutesOfDay = now.getHours() * 60 + now.getMinutes();
  const startMin = dayStart * 60;
  const endMin = dayEnd * 60;
  if (minutesOfDay <= startMin) {
    return { tone: "neutral", message: "Comece o dia com um copo de água." };
  }
  const dayFraction = Math.min(1, Math.max(0, (minutesOfDay - startMin) / (endMin - startMin)));
  const expected = goalMl * dayFraction;
  const diff = consumedMl - expected;

  if (diff >= 0) {
    return { tone: "good", message: "Você está no ritmo certo para bater a meta." };
  }
  const missing = Math.round(-diff);
  if (missing < 250) {
    return { tone: "good", message: "Você está bem próximo do ritmo ideal." };
  }
  return {
    tone: "behind",
    message: `Você está um pouco atrás. Tente beber ~${missing}ml até daqui a pouco.`,
  };
}
