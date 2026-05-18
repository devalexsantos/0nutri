import Link from "next/link";
import { format, subDays } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InsightCardList } from "@/components/progress/InsightCardList";
import {
  MealsCompletionChart,
  type MealsStackPoint,
} from "@/components/progress/MealsCompletionChart";
import {
  ProgressIcons,
  ProgressOverviewCards,
} from "@/components/progress/ProgressOverviewCards";
import { WaterDailyChart } from "@/components/progress/WaterDailyChart";
import { WeeklyComparisonCard } from "@/components/progress/WeeklyComparisonCard";
import { WeightTrendWithAverage } from "@/components/progress/WeightTrendWithAverage";
import { isoDate } from "@/lib/dates";
import { generateInsights } from "@/lib/insights";
import { getActivePersona } from "@/lib/persona";
import { prisma } from "@/lib/prisma";
import {
  analyzeWeightTrend,
  getBestStreak,
  getCurrentAndPreviousWeek,
  withMovingAverage7d,
} from "@/lib/trends";
import { getWeightSummary } from "@/lib/weight";

export const dynamic = "force-dynamic";

export default async function ProgressPage() {
  const persona = await getActivePersona();
  if (!persona) {
    return (
      <p className="text-muted-foreground text-sm">
        Selecione uma persona em <Link href="/personas" className="text-primary underline">Personas</Link>.
      </p>
    );
  }

  const now = new Date();
  const today = new Date(isoDate(now));
  const last30Start = subDays(today, 29);
  const last14Start = subDays(today, 13);

  const [weights, weeklyData, weightSummary, insights, streak, mealLogs14, waterDaily14] = await Promise.all([
    prisma.weightLog.findMany({
      where: { personaId: persona.id },
      orderBy: { date: "asc" },
    }),
    getCurrentAndPreviousWeek(persona.id, persona.dailyWaterMl, now),
    getWeightSummary(persona.id, persona.initialWeightKg, persona.targetWeightKg),
    generateInsights({
      personaId: persona.id,
      dailyWaterMl: persona.dailyWaterMl,
      initialWeightKg: persona.initialWeightKg,
      targetWeightKg: persona.targetWeightKg,
      now,
    }),
    getBestStreak(persona.id),
    prisma.dailyMealLog.findMany({
      where: { personaId: persona.id, date: { gte: last14Start } },
      orderBy: { date: "asc" },
    }),
    prisma.$queryRaw<Array<{ d: string; total: number }>>`
      SELECT to_char(date, 'YYYY-MM-DD') AS d, SUM("amountMl")::int AS total
      FROM "WaterLog"
      WHERE "personaId" = ${persona.id}
      AND date >= ${last14Start}
      GROUP BY date
      ORDER BY date ASC
    `,
  ]);

  // Peso com média móvel
  const weightSeries = weights.map((w) => ({
    date: isoDate(w.date),
    weightKg: w.weightKg,
  }));
  const weightWithAvg = withMovingAverage7d(weightSeries);
  const weightAnalysis = analyzeWeightTrend(weightWithAvg);

  // Agrupar refeições por data
  const mealsByDate = new Map<string, MealsStackPoint>();
  for (let i = 13; i >= 0; i--) {
    const d = isoDate(subDays(today, i));
    mealsByDate.set(d, { date: d, done: 0, partial: 0, skipped: 0 });
  }
  for (const log of mealLogs14) {
    const d = isoDate(log.date);
    const entry = mealsByDate.get(d);
    if (!entry) continue;
    if (log.status === "done") entry.done++;
    else if (log.status === "partial") entry.partial++;
    else if (log.status === "skipped") entry.skipped++;
  }
  const mealsChart: MealsStackPoint[] = [...mealsByDate.values()];

  // Água diária 14 dias (preencher dias vazios)
  const waterByDate = new Map(waterDaily14.map((d) => [d.d, Number(d.total)]));
  const waterChart = Array.from({ length: 14 }, (_, i) => {
    const d = isoDate(subDays(today, 13 - i));
    return { date: d, ml: waterByDate.get(d) ?? 0 };
  });

  const daysWithDietActivity = await prisma.dailyMealLog.groupBy({
    by: ["date"],
    where: { personaId: persona.id, date: { gte: last30Start } },
    _count: { _all: true },
  });

  const avgWaterLast30 =
    waterDaily14.length > 0
      ? waterDaily14.reduce((s, d) => s + Number(d.total), 0) / waterDaily14.length
      : null;

  const cards = [
    {
      label: "Peso atual",
      value: weightSummary.current !== null ? `${weightSummary.current.toFixed(2)}kg` : "—",
      hint:
        weightSummary.diffFromInitial !== null
          ? `${weightSummary.diffFromInitial > 0 ? "+" : ""}${weightSummary.diffFromInitial.toFixed(2)}kg desde início`
          : "Sem peso inicial",
      icon: ProgressIcons.Scale,
      tone:
        weightSummary.diffFromInitial !== null && weightSummary.diffFromInitial < 0
          ? ("success" as const)
          : ("default" as const),
    },
    {
      label: "Meta",
      value: persona.targetWeightKg ? `${persona.targetWeightKg}kg` : "—",
      hint:
        weightSummary.remainingToTarget !== null && weightSummary.remainingToTarget > 0
          ? `${weightSummary.remainingToTarget.toFixed(2)}kg restantes`
          : weightSummary.remainingToTarget !== null
          ? "Meta alcançada"
          : undefined,
      icon: ProgressIcons.Target,
      tone: "default" as const,
    },
    {
      label: "Dias com dieta",
      value: `${daysWithDietActivity.length}`,
      hint: "Últimos 30 dias",
      icon: ProgressIcons.Calendar,
      tone: "default" as const,
    },
    {
      label: "Melhor sequência",
      value: `${streak} dias`,
      hint: "Dias consecutivos com refeição feita",
      icon: ProgressIcons.Trophy,
      tone: streak >= 5 ? ("success" as const) : ("default" as const),
    },
    {
      label: "Água média (14d)",
      value:
        avgWaterLast30 !== null
          ? `${(avgWaterLast30 / 1000).toFixed(2)}L`
          : "—",
      hint: `Meta ${(persona.dailyWaterMl / 1000).toFixed(1)}L/dia`,
      icon: ProgressIcons.Droplet,
      tone:
        avgWaterLast30 !== null && avgWaterLast30 >= persona.dailyWaterMl * 0.9
          ? ("info" as const)
          : ("default" as const),
    },
    {
      label: "Aderência (7d)",
      value:
        weeklyData.current.adherence !== null
          ? `${Math.round(weeklyData.current.adherence * 100)}%`
          : "—",
      hint: "Refeições feitas ou parciais",
      icon: ProgressIcons.Flame,
      tone:
        weeklyData.current.adherence !== null && weeklyData.current.adherence >= 0.75
          ? ("success" as const)
          : ("default" as const),
    },
    {
      label: "Tendência 7d",
      value:
        weightAnalysis.trendMagnitudeKgPerWeek !== null
          ? `${weightAnalysis.trendMagnitudeKgPerWeek > 0 ? "+" : ""}${weightAnalysis.trendMagnitudeKgPerWeek.toFixed(2)}kg/sem`
          : "—",
      hint:
        weightAnalysis.trendDirection === "down"
          ? "Caindo"
          : weightAnalysis.trendDirection === "up"
          ? "Subindo"
          : weightAnalysis.trendDirection === "stable"
          ? "Estável"
          : undefined,
      icon:
        weightAnalysis.trendDirection === "up"
          ? ProgressIcons.TrendingUp
          : ProgressIcons.TrendingDown,
      tone:
        weightAnalysis.trendDirection === "down"
          ? ("success" as const)
          : weightAnalysis.trendDirection === "up"
          ? ("warning" as const)
          : ("default" as const),
    },
    {
      label: "Hoje",
      value: format(now, "dd/MM"),
      hint: persona.name,
      icon: ProgressIcons.Calendar,
      tone: "default" as const,
    },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Progresso</h1>
        <p className="text-muted-foreground text-sm">
          Visão analítica de {persona.name}. Foque na tendência, não no dia isolado.
        </p>
      </div>

      <ProgressOverviewCards cards={cards} />

      {weightAnalysis.reassuranceMessage && (
        <Card className="border-info/40 bg-info/10">
          <CardContent className="text-info py-3 text-xs">
            {weightAnalysis.reassuranceMessage}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Peso com média móvel de 7 dias</CardTitle>
          <p className="text-muted-foreground text-xs">
            A linha cheia é a média; pontos finos são o peso bruto do dia.
          </p>
        </CardHeader>
        <CardContent>
          <WeightTrendWithAverage data={weightWithAvg} target={persona.targetWeightKg} />
        </CardContent>
      </Card>

      <WeeklyComparisonCard
        current={weeklyData.current}
        previous={weeklyData.previous}
        comparison={weeklyData.comparison}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Água — últimos 14 dias</CardTitle>
          </CardHeader>
          <CardContent>
            <WaterDailyChart data={waterChart} goalMl={persona.dailyWaterMl} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Refeições — últimos 14 dias</CardTitle>
          </CardHeader>
          <CardContent>
            <MealsCompletionChart data={mealsChart} />
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-medium">Insights</h2>
        <InsightCardList insights={insights} />
      </div>

      <div className="text-muted-foreground pt-2 text-center text-xs">
        <Link href="/today/history" className="hover:underline">
          ver histórico diário →
        </Link>
      </div>
    </div>
  );
}
