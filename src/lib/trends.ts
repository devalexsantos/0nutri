import { subDays, differenceInDays } from "date-fns";
import { isoDate } from "@/lib/dates";
import { prisma } from "@/lib/prisma";

export type WeightTrendPoint = {
  date: string;
  weightKg: number;
  movingAverage: number | null;
};

export type WeightInsight = {
  current: number | null;
  movingAverage: number | null;
  trendDirection: "down" | "up" | "stable" | "unknown";
  trendMagnitudeKgPerWeek: number | null;
  reassuranceMessage: string | null;
};

/**
 * Calcula média móvel simples de 7 dias para cada ponto.
 * Retorna a série ordenada por data (mais antiga primeiro).
 */
export function withMovingAverage7d(
  points: { date: string; weightKg: number }[]
): WeightTrendPoint[] {
  return points.map((p, i) => {
    const window = points.slice(Math.max(0, i - 6), i + 1);
    const movingAverage =
      window.length >= 3
        ? window.reduce((s, w) => s + w.weightKg, 0) / window.length
        : null;
    return { ...p, movingAverage };
  });
}

export function analyzeWeightTrend(points: WeightTrendPoint[]): WeightInsight {
  const last = points[points.length - 1];
  if (!last) {
    return {
      current: null,
      movingAverage: null,
      trendDirection: "unknown",
      trendMagnitudeKgPerWeek: null,
      reassuranceMessage: null,
    };
  }

  const withAvg = points.filter((p) => p.movingAverage !== null);
  if (withAvg.length < 2) {
    return {
      current: last.weightKg,
      movingAverage: last.movingAverage,
      trendDirection: "unknown",
      trendMagnitudeKgPerWeek: null,
      reassuranceMessage: null,
    };
  }

  const first = withAvg[0]!;
  const recent = withAvg[withAvg.length - 1]!;
  const days = Math.max(1, differenceInDays(new Date(recent.date), new Date(first.date)));
  const deltaPerDay = ((recent.movingAverage ?? 0) - (first.movingAverage ?? 0)) / days;
  const kgPerWeek = deltaPerDay * 7;

  const direction: WeightInsight["trendDirection"] =
    Math.abs(kgPerWeek) < 0.05 ? "stable" : kgPerWeek < 0 ? "down" : "up";

  // Mensagem anti-ansiedade: peso oscilou hoje, mas tendência da média diz outra coisa
  let reassuranceMessage: string | null = null;
  if (withAvg.length >= 4) {
    const previous = withAvg[withAvg.length - 2]!;
    const dailyChange = last.weightKg - previous.weightKg;
    if (dailyChange > 0.3 && direction === "down") {
      reassuranceMessage = `Seu peso subiu ${dailyChange.toFixed(2)}kg hoje, mas a tendência dos últimos dias continua caindo (~${kgPerWeek.toFixed(2)}kg/semana). Provavelmente é oscilação de água/sódio.`;
    } else if (dailyChange < -0.3 && direction === "up") {
      reassuranceMessage = `Hoje caiu ${Math.abs(dailyChange).toFixed(2)}kg, mas a tendência das últimas semanas é de leve subida. Não tire conclusão de um dia só.`;
    }
  }

  return {
    current: last.weightKg,
    movingAverage: last.movingAverage,
    trendDirection: direction,
    trendMagnitudeKgPerWeek: kgPerWeek,
    reassuranceMessage,
  };
}

export type WeeklyStats = {
  rangeLabel: string;
  avgWeightKg: number | null;
  avgWaterMl: number | null;
  adherence: number | null; // 0..1 (refeições não-pulpadas / planejadas)
  daysWithLogs: number;
  daysHitWaterGoal: number;
};

/**
 * Agrega estatísticas semanais entre two dates inclusivas.
 */
export async function getWeeklyStats(
  personaId: string,
  start: Date,
  end: Date,
  dailyWaterMl: number
): Promise<WeeklyStats> {
  const startIso = isoDate(start);
  const endIso = isoDate(end);
  const rangeLabel = `${startIso.slice(5)} – ${endIso.slice(5)}`;

  const [weights, waterAgg, mealLogs] = await Promise.all([
    prisma.weightLog.findMany({
      where: { personaId, date: { gte: new Date(startIso), lte: new Date(endIso) } },
    }),
    prisma.$queryRaw<Array<{ d: string; total: number }>>`
      SELECT to_char(date, 'YYYY-MM-DD') AS d, SUM("amountMl")::int AS total
      FROM "WaterLog"
      WHERE "personaId" = ${personaId}
      AND date >= ${new Date(startIso)}
      AND date <= ${new Date(endIso)}
      GROUP BY date
    `,
    prisma.dailyMealLog.findMany({
      where: {
        personaId,
        date: { gte: new Date(startIso), lte: new Date(endIso) },
      },
    }),
  ]);

  const avgWeightKg =
    weights.length === 0
      ? null
      : weights.reduce((s, w) => s + w.weightKg, 0) / weights.length;

  const totalWater = waterAgg.reduce((s, d) => s + Number(d.total), 0);
  const daysWithWater = waterAgg.length;
  const avgWaterMl = daysWithWater === 0 ? null : totalWater / daysWithWater;
  const daysHitWaterGoal = waterAgg.filter((d) => Number(d.total) >= dailyWaterMl).length;

  const done = mealLogs.filter((l) => l.status === "done").length;
  const partial = mealLogs.filter((l) => l.status === "partial").length;
  const skipped = mealLogs.filter((l) => l.status === "skipped").length;
  const totalLogged = done + partial + skipped;
  const adherence =
    totalLogged === 0 ? null : (done + partial * 0.5) / totalLogged;

  const daysWithLogs = new Set(mealLogs.map((l) => isoDate(l.date))).size;

  return {
    rangeLabel,
    avgWeightKg,
    avgWaterMl,
    adherence,
    daysWithLogs,
    daysHitWaterGoal,
  };
}

export function compareWeeks(current: WeeklyStats, previous: WeeklyStats) {
  return {
    weightDelta:
      current.avgWeightKg !== null && previous.avgWeightKg !== null
        ? current.avgWeightKg - previous.avgWeightKg
        : null,
    waterDelta:
      current.avgWaterMl !== null && previous.avgWaterMl !== null
        ? current.avgWaterMl - previous.avgWaterMl
        : null,
    adherenceDelta:
      current.adherence !== null && previous.adherence !== null
        ? current.adherence - previous.adherence
        : null,
  };
}

export async function getCurrentAndPreviousWeek(
  personaId: string,
  dailyWaterMl: number,
  now: Date = new Date()
) {
  const today = new Date(isoDate(now));
  const last7Start = subDays(today, 6);
  const prev7End = subDays(today, 7);
  const prev7Start = subDays(today, 13);
  const [current, previous] = await Promise.all([
    getWeeklyStats(personaId, last7Start, today, dailyWaterMl),
    getWeeklyStats(personaId, prev7Start, prev7End, dailyWaterMl),
  ]);
  return { current, previous, comparison: compareWeeks(current, previous) };
}

/**
 * Maior sequência de dias com refeições completadas (>= 1 done por dia).
 */
export async function getBestStreak(personaId: string): Promise<number> {
  const logs = await prisma.dailyMealLog.findMany({
    where: { personaId, status: "done" },
    select: { date: true },
    orderBy: { date: "asc" },
  });
  const days = Array.from(new Set(logs.map((l) => isoDate(l.date)))).sort();

  let best = 0;
  let current = 0;
  let prev: string | null = null;
  for (const d of days) {
    if (prev === null) {
      current = 1;
    } else {
      const expected = isoDate(subDays(new Date(d), -0)); // identity
      const prevDate = new Date(prev);
      const diffDays = Math.round(
        (new Date(d).getTime() - prevDate.getTime()) / 86400000
      );
      current = diffDays === 1 ? current + 1 : 1;
      void expected;
    }
    best = Math.max(best, current);
    prev = d;
  }
  return best;
}
