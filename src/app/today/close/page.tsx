import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CloseDayForm } from "@/components/today/CloseDayForm";
import { isoDate } from "@/lib/dates";
import { getMealsForToday } from "@/lib/meals";
import { getActivePersona } from "@/lib/persona";
import { prisma } from "@/lib/prisma";
import { computeDailyScore, describeScore } from "@/lib/score";
import { getTodayWaterIntake } from "@/lib/water";

export const dynamic = "force-dynamic";

export default async function CloseDayPage() {
  const persona = await getActivePersona();
  if (!persona) {
    return (
      <p className="text-muted-foreground text-sm">
        Selecione uma persona em <Link href="/personas" className="text-primary underline">Personas</Link>.
      </p>
    );
  }

  const now = new Date();
  const dateOnly = new Date(isoDate(now));
  const [meals, consumedMl, summary, weight, score] = await Promise.all([
    getMealsForToday(persona.id, now),
    getTodayWaterIntake(persona.id, now),
    prisma.dailySummary.findUnique({
      where: { personaId_date: { personaId: persona.id, date: dateOnly } },
    }),
    prisma.weightLog.findFirst({
      where: { personaId: persona.id, date: dateOnly },
    }),
    computeDailyScore(persona.id, persona.dailyWaterMl, now),
  ]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-muted-foreground text-xs uppercase tracking-wide">
            Fechamento do dia
          </div>
          <h1 className="text-2xl font-semibold">{isoDate(now)}</h1>
        </div>
        <Button asChild variant="ghost" size="sm">
          <Link href="/today">
            <ChevronLeft className="mr-1 h-4 w-4" /> Voltar
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Como foi o dia</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <Row label="Score consolidado" value={`${score.total}/100 · ${describeScore(score)}`} />
          <Row
            label="Refeições"
            value={`${score.doneMeals} feitas · ${score.partialMeals} parcial · ${score.skippedMeals} puladas`}
          />
          <Row label="Água" value={`${(consumedMl / 1000).toFixed(2)}L de ${(persona.dailyWaterMl / 1000).toFixed(1)}L`} />
          <Row
            label="Peso"
            value={weight ? `${weight.weightKg.toFixed(2)}kg registrado` : "Não registrado hoje"}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Check-in completo</CardTitle>
          <p className="text-muted-foreground text-xs">
            Como você está se sentindo agora? Esses sinais ajudam a identificar padrões com o tempo.
          </p>
        </CardHeader>
        <CardContent>
          <CloseDayForm
            personaId={persona.id}
            initial={{
              energyLevel: summary?.energyLevel ?? null,
              moodLevel: summary?.moodLevel ?? null,
              hungerLevel: summary?.hungerLevel ?? null,
              notes: summary?.notes ?? "",
            }}
            unsatisfiedMeals={meals
              .filter((m) => m.status === "pending")
              .map((m) => m.name)}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground text-xs">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
