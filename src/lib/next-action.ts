import { minutesUntil } from "@/lib/dates";
import type { MealForToday } from "@/lib/meals";

export type NextAction = {
  type: "meal-now" | "meal-soon" | "meal-late" | "water" | "weight" | "checkin" | "all-done";
  title: string;
  description: string;
  href?: string;
};

type Context = {
  meals: MealForToday[];
  consumedMl: number;
  goalMl: number;
  hasWeightToday: boolean;
  hasCheckin: boolean;
  now?: Date;
};

export function pickNextAction(ctx: Context): NextAction {
  const now = ctx.now ?? new Date();
  const minutesOfDay = now.getHours() * 60 + now.getMinutes();

  // 1. Refeição na hora ou atrasada
  const pendingMeals = ctx.meals
    .filter((m) => m.status === "pending" || m.status === "partial")
    .sort((a, b) => a.scheduledDate.getTime() - b.scheduledDate.getTime());

  const dueMeal = pendingMeals.find((m) => {
    const diff = minutesUntil(m.scheduledAt, now);
    return diff <= 15 && diff > -90; // 15 min antes a 90 min depois
  });

  if (dueMeal) {
    const diff = minutesUntil(dueMeal.scheduledAt, now);
    if (diff <= -30) {
      return {
        type: "meal-late",
        title: `Refeição atrasada: ${dueMeal.name}`,
        description: "Marque como feita, parcial ou pulada para manter o registro.",
        href: "/today",
      };
    }
    if (diff <= 0) {
      return {
        type: "meal-now",
        title: `${dueMeal.name} agora`,
        description: `Horário programado: ${dueMeal.scheduledAt}.`,
        href: "/today",
      };
    }
    return {
      type: "meal-soon",
      title: `${dueMeal.name} em ${diff}min`,
      description: `Comece a se preparar. Horário: ${dueMeal.scheduledAt}.`,
      href: "/today",
    };
  }

  // 2. Água atrasada
  if (ctx.goalMl > 0) {
    const dayFraction = Math.min(1, Math.max(0, (minutesOfDay - 6 * 60) / (17 * 60)));
    const expected = ctx.goalMl * dayFraction;
    const missing = expected - ctx.consumedMl;
    if (ctx.consumedMl < ctx.goalMl && missing > 300) {
      return {
        type: "water",
        title: `Beber ~${Math.round(missing)}ml de água`,
        description: "Você está abaixo do ritmo esperado para esse horário.",
        href: "/water",
      };
    }
  }

  // 3. Peso ainda não registrado hoje
  if (!ctx.hasWeightToday && minutesOfDay >= 6 * 60) {
    return {
      type: "weight",
      title: "Registrar peso de hoje",
      description: "Pesagens regulares dão tendência confiável (mais útil que dia isolado).",
      href: "/weight",
    };
  }

  // 4. Check-in do dia (após 19h)
  if (!ctx.hasCheckin && minutesOfDay >= 19 * 60) {
    return {
      type: "checkin",
      title: "Fechar o dia com check-in",
      description: "Energia, humor e fome — 3 cliques.",
      href: "/today/close",
    };
  }

  // 5. Próxima refeição futura
  const nextFuture = pendingMeals[0];
  if (nextFuture) {
    const diff = minutesUntil(nextFuture.scheduledAt, now);
    if (diff > 0) {
      const hh = Math.floor(diff / 60);
      const mm = diff % 60;
      const text = hh > 0 ? `em ${hh}h${mm ? ` ${mm}min` : ""}` : `em ${mm}min`;
      return {
        type: "meal-soon",
        title: `Próxima refeição: ${nextFuture.name} ${text}`,
        description: `Horário programado: ${nextFuture.scheduledAt}.`,
        href: "/today",
      };
    }
  }

  return {
    type: "all-done",
    title: "Você está em dia.",
    description: "Todas as ações importantes do dia estão tratadas. Bom trabalho.",
  };
}
