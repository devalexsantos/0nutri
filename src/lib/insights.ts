import { subDays } from "date-fns";
import { isoDate } from "@/lib/dates";
import { prisma } from "@/lib/prisma";

export type Insight = {
  id: string;
  tone: "positive" | "attention" | "neutral";
  title: string;
  body: string;
};

type InsightContext = {
  personaId: string;
  dailyWaterMl: number;
  initialWeightKg: number | null;
  targetWeightKg: number | null;
  now?: Date;
};

export async function generateInsights(ctx: InsightContext): Promise<Insight[]> {
  const now = ctx.now ?? new Date();
  const todayIso = isoDate(now);
  const insights: Insight[] = [];

  // ---- Dados base ----
  const since30 = subDays(new Date(todayIso), 29);
  const since14 = subDays(new Date(todayIso), 13);
  const since7 = subDays(new Date(todayIso), 6);

  const [weights, waterAggAll, mealLogs] = await Promise.all([
    prisma.weightLog.findMany({
      where: { personaId: ctx.personaId },
      orderBy: { date: "asc" },
    }),
    prisma.$queryRaw<Array<{ d: string; total: number; dow: number }>>`
      SELECT to_char(date, 'YYYY-MM-DD') AS d,
             SUM("amountMl")::int AS total,
             EXTRACT(DOW FROM date)::int AS dow
      FROM "WaterLog"
      WHERE "personaId" = ${ctx.personaId}
      AND date >= ${since30}
      GROUP BY date
      ORDER BY date ASC
    `,
    prisma.dailyMealLog.findMany({
      where: {
        personaId: ctx.personaId,
        date: { gte: since30 },
      },
      include: { meal: true },
    }),
  ]);

  // ---- Insight: perda/ganho desde o início ----
  if (weights.length > 0 && ctx.initialWeightKg !== null) {
    const current = weights[weights.length - 1]!.weightKg;
    const diff = current - ctx.initialWeightKg;
    if (Math.abs(diff) >= 0.3) {
      const lost = diff < 0;
      insights.push({
        id: "weight-since-start",
        tone: lost ? "positive" : "attention",
        title: lost
          ? `Você perdeu ${Math.abs(diff).toFixed(2)}kg desde o início`
          : `Você ganhou ${Math.abs(diff).toFixed(2)}kg desde o início`,
        body: ctx.targetWeightKg
          ? `Meta: ${ctx.targetWeightKg}kg · Atual: ${current.toFixed(2)}kg`
          : `Peso atual: ${current.toFixed(2)}kg.`,
      });
    }
  }

  // ---- Insight: média de água nos últimos 7 dias ----
  const last7Water = waterAggAll.filter((d) => new Date(d.d) >= since7);
  if (last7Water.length > 0) {
    const avg = last7Water.reduce((s, d) => s + Number(d.total), 0) / last7Water.length;
    const ratio = avg / ctx.dailyWaterMl;
    if (ratio >= 0.9) {
      insights.push({
        id: "water-7d-good",
        tone: "positive",
        title: `Sua média de água foi ${(avg / 1000).toFixed(2)}L nos últimos 7 dias`,
        body: `Está em ${(ratio * 100).toFixed(0)}% da sua meta diária. Excelente consistência.`,
      });
    } else if (ratio < 0.6) {
      insights.push({
        id: "water-7d-low",
        tone: "attention",
        title: `Média de água abaixo do esperado`,
        body: `Você consumiu em média ${(avg / 1000).toFixed(2)}L (${(ratio * 100).toFixed(
          0
        )}% da meta). Tente antecipar o consumo pela manhã.`,
      });
    }
  }

  // ---- Insight: água em fins de semana vs dias úteis ----
  if (waterAggAll.length >= 8) {
    const weekendDays = waterAggAll.filter((d) => d.dow === 0 || d.dow === 6);
    const weekDays = waterAggAll.filter((d) => d.dow !== 0 && d.dow !== 6);
    if (weekendDays.length >= 2 && weekDays.length >= 2) {
      const avgWeekend =
        weekendDays.reduce((s, d) => s + Number(d.total), 0) / weekendDays.length;
      const avgWeek = weekDays.reduce((s, d) => s + Number(d.total), 0) / weekDays.length;
      const diff = avgWeekend - avgWeek;
      if (diff < -300) {
        insights.push({
          id: "water-weekend-dip",
          tone: "attention",
          title: "Você costuma beber menos água aos finais de semana",
          body: `Diferença de ~${Math.abs(Math.round(diff))}ml/dia entre dias úteis (${(avgWeek / 1000).toFixed(2)}L) e fim de semana (${(avgWeekend / 1000).toFixed(2)}L).`,
        });
      }
    }
  }

  // ---- Insight: dias hit goal ----
  const last14Water = waterAggAll.filter((d) => new Date(d.d) >= since14);
  if (last14Water.length >= 5) {
    const hit = last14Water.filter((d) => Number(d.total) >= ctx.dailyWaterMl).length;
    if (hit >= 10) {
      insights.push({
        id: "water-14d-streak",
        tone: "positive",
        title: `Você bateu a meta de água em ${hit} dos últimos 14 dias`,
        body: "Consistência aqui ajuda muito retenção, saciedade e energia.",
      });
    }
  }

  // ---- Insight: aderência geral em 14d ----
  const logs14 = mealLogs.filter((l) => l.date >= since14);
  if (logs14.length >= 5) {
    const done = logs14.filter((l) => l.status === "done").length;
    const partial = logs14.filter((l) => l.status === "partial").length;
    const total = logs14.length;
    const adherence = (done + partial * 0.5) / total;
    if (adherence >= 0.8) {
      insights.push({
        id: "adherence-good",
        tone: "positive",
        title: "Aderência alta nas últimas 2 semanas",
        body: `Você cumpriu ${Math.round(adherence * 100)}% das refeições registradas (feitas + parcialmente).`,
      });
    } else if (adherence < 0.5 && total >= 10) {
      insights.push({
        id: "adherence-low",
        tone: "attention",
        title: "Aderência das refeições caindo",
        body: `Você cumpriu ${Math.round(adherence * 100)}% das refeições nos últimos 14 dias. Revisar dieta pode ajudar.`,
      });
    }
  }

  // ---- Insight: refeição mais pulada ----
  const skippedByMeal = new Map<string, { name: string; count: number }>();
  for (const l of mealLogs) {
    if (l.status === "skipped") {
      const existing = skippedByMeal.get(l.mealId);
      if (existing) existing.count++;
      else skippedByMeal.set(l.mealId, { name: l.meal.name, count: 1 });
    }
  }
  const topSkipped = [...skippedByMeal.values()].sort((a, b) => b.count - a.count)[0];
  if (topSkipped && topSkipped.count >= 3) {
    insights.push({
      id: "most-skipped",
      tone: "attention",
      title: `Refeição mais pulada: ${topSkipped.name}`,
      body: `Pulada ${topSkipped.count}x nos últimos 30 dias. Pode valer revisar opções ou horário.`,
    });
  }

  // ---- Insight: melhor dia de aderência (dia da semana) ----
  if (logs14.length >= 7) {
    const byDow = new Array(7).fill(null).map(() => ({ done: 0, total: 0 }));
    for (const l of logs14) {
      const dow = new Date(l.date).getDay();
      byDow[dow]!.total++;
      if (l.status === "done") byDow[dow]!.done++;
    }
    const dowsWithData = byDow
      .map((d, i) => ({ ...d, dow: i, ratio: d.total > 0 ? d.done / d.total : 0 }))
      .filter((d) => d.total >= 2);
    if (dowsWithData.length >= 3) {
      const best = [...dowsWithData].sort((a, b) => b.ratio - a.ratio)[0]!;
      if (best.ratio >= 0.8) {
        const DAY = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];
        insights.push({
          id: "best-dow",
          tone: "positive",
          title: `Seu dia mais consistente é ${DAY[best.dow]}`,
          body: `Aderência de ${Math.round(best.ratio * 100)}% nesse dia. Mantenha a rotina.`,
        });
      }
    }
  }

  return insights;
}
