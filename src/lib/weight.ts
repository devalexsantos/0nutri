import { prisma } from "@/lib/prisma";

export async function getWeightLogs(personaId: string, limit?: number) {
  return prisma.weightLog.findMany({
    where: { personaId },
    orderBy: { date: "desc" },
    take: limit,
  });
}

export async function getLatestWeight(personaId: string) {
  return prisma.weightLog.findFirst({
    where: { personaId },
    orderBy: { date: "desc" },
  });
}

export type WeightSummary = {
  current: number | null;
  initial: number | null;
  target: number | null;
  diffFromInitial: number | null;
  remainingToTarget: number | null;
  trend7d: number | null; // diferença entre média dos últimos 7 dias e os 7 anteriores
};

export async function getWeightSummary(
  personaId: string,
  initialWeightKg: number | null,
  targetWeightKg: number | null
): Promise<WeightSummary> {
  const logs = await prisma.weightLog.findMany({
    where: { personaId },
    orderBy: { date: "desc" },
    take: 30,
  });

  const current = logs[0]?.weightKg ?? null;
  const last7 = logs.slice(0, 7);
  const prev7 = logs.slice(7, 14);
  const avg = (arr: typeof logs) =>
    arr.length === 0 ? null : arr.reduce((sum, l) => sum + l.weightKg, 0) / arr.length;
  const avgLast = avg(last7);
  const avgPrev = avg(prev7);

  return {
    current,
    initial: initialWeightKg,
    target: targetWeightKg,
    diffFromInitial:
      current !== null && initialWeightKg !== null ? current - initialWeightKg : null,
    remainingToTarget:
      current !== null && targetWeightKg !== null ? current - targetWeightKg : null,
    trend7d: avgLast !== null && avgPrev !== null ? avgLast - avgPrev : null,
  };
}
