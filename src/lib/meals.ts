import { isoDate, combineDateAndTime, minutesUntil } from "@/lib/dates";
import { prisma } from "@/lib/prisma";

export type MealStatus = "pending" | "done" | "skipped" | "partial";

export type MealForToday = {
  id: string;
  name: string;
  scheduledAt: string;
  scheduledDate: Date;
  status: MealStatus;
  mealOptionId: string | null;
  options: Array<{
    id: string;
    name: string;
    description: string | null;
    foodItems: Array<{
      id: string;
      name: string;
      quantity: number | null;
      unit: string | null;
      notes: string | null;
    }>;
  }>;
};

export async function getActiveDietForPersona(personaId: string) {
  return prisma.diet.findFirst({
    where: { personaId, isActive: true },
    include: {
      meals: {
        orderBy: { sortOrder: "asc" },
        include: {
          options: {
            orderBy: { sortOrder: "asc" },
            include: { foodItems: { orderBy: { sortOrder: "asc" } } },
          },
        },
      },
    },
  });
}

export async function getMealsForToday(personaId: string, now: Date = new Date()): Promise<MealForToday[]> {
  const diet = await getActiveDietForPersona(personaId);
  if (!diet) return [];

  const dateOnly = new Date(isoDate(now));
  const logs = await prisma.dailyMealLog.findMany({
    where: { personaId, date: dateOnly },
  });
  const logByMeal = new Map(logs.map((l) => [l.mealId, l]));

  return diet.meals.map((meal) => {
    const log = logByMeal.get(meal.id);
    return {
      id: meal.id,
      name: meal.name,
      scheduledAt: meal.scheduledAt,
      scheduledDate: combineDateAndTime(now, meal.scheduledAt),
      status: (log?.status as MealStatus) ?? "pending",
      mealOptionId: log?.mealOptionId ?? null,
      options: meal.options.map((opt) => ({
        id: opt.id,
        name: opt.name,
        description: opt.description,
        foodItems: opt.foodItems.map((f) => ({
          id: f.id,
          name: f.name,
          quantity: f.quantity,
          unit: f.unit,
          notes: f.notes,
        })),
      })),
    };
  });
}

/**
 * Define a refeição "atual" do dia: a próxima pendente cujo horário ainda não
 * passou muito (até 90min após o programado). Se todas estão done/skipped,
 * retorna null.
 */
export function pickCurrentMeal(meals: MealForToday[], now: Date = new Date()) {
  const sorted = [...meals].sort(
    (a, b) => a.scheduledDate.getTime() - b.scheduledDate.getTime()
  );

  // Primeiro, refeição cujo horário é o mais próximo (passado ou futuro) e ainda pendente
  const pending = sorted.filter((m) => m.status === "pending" || m.status === "partial");
  if (pending.length === 0) return null;

  // Próxima futura
  const future = pending.find((m) => m.scheduledDate.getTime() >= now.getTime());
  if (future) {
    // Se a refeição que acabou de passar ainda está pendente, prefira ela (até 60min atrás)
    const recentPast = [...pending]
      .filter((m) => m.scheduledDate.getTime() < now.getTime())
      .pop();
    if (recentPast) {
      const diffMin = (now.getTime() - recentPast.scheduledDate.getTime()) / 60000;
      if (diffMin < 60) return recentPast;
    }
    return future;
  }
  // Todas no passado → última pendente
  return pending[pending.length - 1] ?? null;
}

export function isMealLate(meal: MealForToday, now: Date = new Date()): boolean {
  if (meal.status !== "pending") return false;
  return now.getTime() > meal.scheduledDate.getTime() + 30 * 60 * 1000;
}

export function describeMealTiming(meal: MealForToday, now: Date = new Date()): string {
  const diff = minutesUntil(meal.scheduledAt, now);
  if (Math.abs(diff) < 5) return "agora";
  if (diff > 0 && diff < 60) return `em ${diff}min`;
  if (diff > 0) return `em ${Math.floor(diff / 60)}h${diff % 60 ? ` ${diff % 60}min` : ""}`;
  const past = -diff;
  if (past < 60) return `${past}min atrás`;
  return `${Math.floor(past / 60)}h atrás`;
}
