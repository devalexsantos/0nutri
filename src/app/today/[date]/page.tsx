import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { isoDate, parseDateKey } from "@/lib/dates";
import { getActiveDietForPersona } from "@/lib/meals";
import { getActivePersona } from "@/lib/persona";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function isValidIsoDate(s: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s));
}

export default async function PastDayPage({
  params,
}: {
  params: Promise<{ date: string }>;
}) {
  const { date } = await params;
  if (!isValidIsoDate(date)) notFound();

  const persona = await getActivePersona();
  if (!persona) {
    return (
      <p className="text-muted-foreground text-sm">
        Selecione uma persona em{" "}
        <Link href="/personas" className="text-primary underline">
          Personas
        </Link>
        .
      </p>
    );
  }

  const dateOnly = parseDateKey(date);
  const today = isoDate(new Date());

  const [diet, summary, mealLogs, waterTotal, weight] = await Promise.all([
    getActiveDietForPersona(persona.id),
    prisma.dailySummary.findUnique({
      where: { personaId_date: { personaId: persona.id, date: dateOnly } },
    }),
    prisma.dailyMealLog.findMany({
      where: { personaId: persona.id, date: dateOnly },
      include: { meal: true, mealOption: true },
    }),
    prisma.waterLog.aggregate({
      where: { personaId: persona.id, date: dateOnly },
      _sum: { amountMl: true },
    }),
    prisma.weightLog.findFirst({
      where: { personaId: persona.id, date: dateOnly },
    }),
  ]);

  const consumedMl = waterTotal._sum.amountMl ?? 0;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-muted-foreground text-xs uppercase tracking-wide">
            {date === today ? "Hoje" : "Dia anterior"}
          </div>
          <h1 className="text-2xl font-semibold">{date}</h1>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/today/history">
            <ChevronLeft className="mr-1 h-4 w-4" /> Histórico
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Score</CardTitle>
        </CardHeader>
        <CardContent className="flex items-baseline gap-4">
          <div className="text-4xl font-semibold tabular-nums">
            {summary?.overallScore ?? 0}
          </div>
          <div className="text-muted-foreground text-sm">
            Refeições: <strong>{summary?.mealsScore ?? 0}/60</strong> · Água:{" "}
            <strong>{summary?.waterScore ?? 0}/30</strong>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Refeições</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {diet?.meals.length ? (
            diet.meals.map((meal) => {
              const log = mealLogs.find((l) => l.mealId === meal.id);
              const status = log?.status ?? "pending";
              return (
                <div
                  key={meal.id}
                  className="border-border/60 flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-medium">{meal.name}</div>
                    <div className="text-muted-foreground text-xs">
                      {meal.scheduledAt}
                      {log?.mealOption ? ` · ${log.mealOption.name}` : ""}
                    </div>
                  </div>
                  <Badge variant={statusVariant(status)}>{statusLabel(status)}</Badge>
                </div>
              );
            })
          ) : (
            <p className="text-muted-foreground text-sm">Sem dieta ativa.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Água</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-semibold tabular-nums">
            {(consumedMl / 1000).toFixed(2)} L
          </div>
          <div className="text-muted-foreground text-xs">
            Meta de {(persona.dailyWaterMl / 1000).toFixed(1)}L
          </div>
        </CardContent>
      </Card>

      {weight && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Peso registrado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold tabular-nums">
              {weight.weightKg.toFixed(2)} kg
            </div>
            {weight.notes && (
              <p className="text-muted-foreground mt-1 text-xs">{weight.notes}</p>
            )}
          </CardContent>
        </Card>
      )}

      {summary && (summary.energyLevel || summary.moodLevel || summary.hungerLevel) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Check-in</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            {summary.energyLevel && <p>Energia: {"⬤".repeat(summary.energyLevel)}{"○".repeat(5 - summary.energyLevel)} ({summary.energyLevel}/5)</p>}
            {summary.moodLevel && <p>Humor: {"⬤".repeat(summary.moodLevel)}{"○".repeat(5 - summary.moodLevel)} ({summary.moodLevel}/5)</p>}
            {summary.hungerLevel && <p>Fome: {"⬤".repeat(summary.hungerLevel)}{"○".repeat(5 - summary.hungerLevel)} ({summary.hungerLevel}/5)</p>}
            {summary.notes && <p className="text-muted-foreground italic">{summary.notes}</p>}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function statusLabel(s: string) {
  return s === "done" ? "Feita" : s === "partial" ? "Parcial" : s === "skipped" ? "Pulada" : "Pendente";
}

function statusVariant(s: string): "default" | "secondary" | "destructive" | "outline" {
  if (s === "done") return "default";
  if (s === "partial") return "secondary";
  if (s === "skipped") return "outline";
  return "outline";
}
