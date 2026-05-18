"use client";

import { useEffect } from "react";
import { combineDateAndTime } from "@/lib/dates";
import {
  getNotificationPermission,
  scheduleNotifications,
  type ScheduledItem,
} from "@/lib/notifications";

type MealHint = {
  id: string;
  name: string;
  scheduledAt: string; // HH:mm
  status: string;
};

/**
 * Componente client-side que agenda notificações locais para as refeições
 * pendentes do dia. Roda só se o usuário deu permissão.
 */
export function NotificationsManager({ meals }: { meals: MealHint[] }) {
  useEffect(() => {
    if (getNotificationPermission() !== "granted") return;
    const today = new Date();

    const items: ScheduledItem[] = meals
      .filter((m) => m.status === "pending")
      .map((m) => {
        const fireDate = combineDateAndTime(today, m.scheduledAt);
        return {
          id: `meal:${m.id}:${today.toISOString().slice(0, 10)}`,
          fireAt: fireDate.getTime(),
          title: `Hora do ${m.name}`,
          body: `Programado para ${m.scheduledAt}. Abra o 0nutri para marcar.`,
          tag: `meal-${m.id}`,
        };
      });

    scheduleNotifications(items);
  }, [meals]);

  return null;
}
