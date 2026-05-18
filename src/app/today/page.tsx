import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CurrentMealCard } from "@/components/today/CurrentMealCard";
import { DailyChecklist } from "@/components/today/DailyChecklist";
import { DailyCheckinDialog } from "@/components/today/DailyCheckinDialog";
import { DailyConsistencyCard } from "@/components/today/DailyConsistencyCard";
import { FreeMealDialog } from "@/components/today/FreeMealDialog";
import { NextActionCard } from "@/components/today/NextActionCard";
import { NotificationsManager } from "@/components/pwa/NotificationsManager";
import { PlannedFreeMeals } from "@/components/today/PlannedFreeMeals";
import { TodayHeader } from "@/components/today/TodayHeader";
import { UpcomingMealsList } from "@/components/today/UpcomingMealsList";
import { WaterQuickAdd } from "@/components/today/WaterQuickAdd";
import { WeightProgressCard } from "@/components/today/WeightProgressCard";
import {
  describeMealTiming,
  getMealsForToday,
  isMealLate,
  pickCurrentMeal,
} from "@/lib/meals";
import { getActivePersona } from "@/lib/persona";
import { getTodayWaterIntake, waterFeedback } from "@/lib/water";
import { getWeightSummary } from "@/lib/weight";
import { computeDailyScore, describeScore, persistDailyScore } from "@/lib/score";
import { pickNextAction } from "@/lib/next-action";
import { isoDate } from "@/lib/dates";
import { prisma } from "@/lib/prisma";
import { Droplet, Scale, Utensils, ClipboardCheck } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function TodayPage() {
  const persona = await getActivePersona();
  if (!persona) {
    return <EmptyPersonaState />;
  }

  const now = new Date();
  const dateOnly = new Date(isoDate(now));

  const [meals, consumedMl, weightSummary, weightToday, summary, plannedFreeMeals] =
    await Promise.all([
      getMealsForToday(persona.id, now),
      getTodayWaterIntake(persona.id, now),
      getWeightSummary(persona.id, persona.initialWeightKg, persona.targetWeightKg),
      prisma.weightLog.findFirst({
        where: { personaId: persona.id, date: dateOnly },
      }),
      prisma.dailySummary.findUnique({
        where: { personaId_date: { personaId: persona.id, date: dateOnly } },
      }),
      prisma.freeMeal.findMany({
        where: { personaId: persona.id, date: { gte: dateOnly } },
        orderBy: { date: "asc" },
        take: 5,
      }),
    ]);

  const currentMeal = pickCurrentMeal(meals, now);
  const doneMeals = meals.filter((m) => m.status === "done").length;
  const feedback = waterFeedback(consumedMl, persona.dailyWaterMl, now);
  const score = await computeDailyScore(persona.id, persona.dailyWaterMl, now);
  await persistDailyScore(persona.id, score, now);

  const nextAction = pickNextAction({
    meals,
    consumedMl,
    goalMl: persona.dailyWaterMl,
    hasWeightToday: Boolean(weightToday),
    hasCheckin: score.hasCheckin,
    now,
  });

  return (
    <div className="space-y-5">
      <NotificationsManager
        meals={meals.map((m) => ({
          id: m.id,
          name: m.name,
          scheduledAt: m.scheduledAt,
          status: m.status,
        }))}
      />

      <TodayHeader
        personaName={persona.name}
        totalMeals={meals.length}
        doneMeals={doneMeals}
        consumedMl={consumedMl}
      />

      <NextActionCard action={nextAction} />

      <DailyConsistencyCard score={score} message={describeScore(score)} />

      {meals.length === 0 ? (
        <NoDietCard />
      ) : currentMeal ? (
        <CurrentMealCard
          personaId={persona.id}
          meal={currentMeal}
          timing={describeMealTiming(currentMeal, now)}
          late={isMealLate(currentMeal, now)}
        />
      ) : (
        <Card className="border-success/40 bg-success/5">
          <CardContent className="py-6 text-center">
            <p className="text-success text-sm font-medium">
              Todas as refeições do dia já foram registradas. Excelente.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <WaterQuickAdd
          personaId={persona.id}
          consumedMl={consumedMl}
          goalMl={persona.dailyWaterMl}
          feedback={feedback}
        />
        <WeightProgressCard summary={weightSummary} />
      </div>

      <DailyChecklist
        items={[
          {
            label: "Tomar café da manhã",
            done: meals.some((m) =>
              m.name.toLowerCase().includes("café") && (m.status === "done" || m.status === "partial")
            ),
            icon: Utensils,
            hint:
              meals.find((m) => m.name.toLowerCase().includes("café"))?.scheduledAt &&
              `Programado para ${meals.find((m) => m.name.toLowerCase().includes("café"))?.scheduledAt}`,
            href: "/today",
          },
          {
            label: "Bater meta de água",
            done: consumedMl >= persona.dailyWaterMl,
            icon: Droplet,
            hint:
              consumedMl < persona.dailyWaterMl
                ? `Faltam ${(persona.dailyWaterMl - consumedMl) / 1000} L para a meta de ${(persona.dailyWaterMl / 1000).toFixed(1)}L`
                : undefined,
            href: "/water",
          },
          {
            label: "Cumprir todas as refeições",
            done:
              meals.length > 0 &&
              meals.every((m) => m.status !== "pending"),
            icon: Utensils,
            hint: `${doneMeals} feitas · ${score.partialMeals} parcial · ${score.skippedMeals} puladas`,
          },
          {
            label: "Registrar peso",
            done: Boolean(weightToday),
            icon: Scale,
            hint: weightToday
              ? `${weightToday.weightKg.toFixed(2)}kg registrado hoje`
              : "Pesar pela manhã dá leitura mais consistente",
            href: "/weight",
          },
          {
            label: "Check-in do dia",
            done: score.hasCheckin,
            icon: ClipboardCheck,
            hint: "Energia, humor e fome em 3 cliques",
            href: "/today/close",
          },
        ]}
      />

      <DailyCheckinDialog
        personaId={persona.id}
        initial={{
          energyLevel: summary?.energyLevel ?? null,
          moodLevel: summary?.moodLevel ?? null,
          hungerLevel: summary?.hungerLevel ?? null,
          notes: summary?.notes ?? "",
        }}
      />

      <PlannedFreeMeals
        planned={plannedFreeMeals.map((p) => ({
          id: p.id,
          type: p.type,
          description: p.description,
          date: isoDate(p.date),
        }))}
      />

      <UpcomingMealsList meals={meals} currentMealId={currentMeal?.id ?? null} />

      <div className="text-muted-foreground flex flex-wrap items-center justify-center gap-3 pt-2 text-center text-xs">
        <Link href="/today/close" className="hover:underline">
          fechar o dia →
        </Link>
        <span aria-hidden>·</span>
        <Link href="/today/history" className="hover:underline">
          dias anteriores
        </Link>
        <span aria-hidden>·</span>
        <FreeMealDialog personaId={persona.id} />
      </div>
    </div>
  );
}

function NoDietCard() {
  return (
    <Card>
      <CardContent className="space-y-3 py-8 text-center">
        <p className="text-sm">
          Nenhuma dieta ativa para esta persona ainda. Use a IA para montar uma rapidinho ou cadastre manualmente.
        </p>
        <div className="flex justify-center gap-2">
          <Button asChild>
            <Link href="/ai-diet">
              <Sparkles className="mr-2 h-4 w-4" /> Montar com IA
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/diet/edit">Cadastrar manualmente</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyPersonaState() {
  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-semibold">Bem-vindo ao 0nutri</h1>
      <p className="text-muted-foreground text-sm">
        Crie sua primeira persona para começar a usar o painel pessoal de dieta, água, peso e progresso.
      </p>
      <Button asChild>
        <Link href="/personas/new">Criar persona</Link>
      </Button>
    </div>
  );
}
