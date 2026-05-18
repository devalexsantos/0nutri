import "server-only";
import { prisma } from "@/lib/prisma";
import { combineDateAndTime, dateKey, todayIsoSp } from "@/lib/dates";
import { getMealsForToday } from "@/lib/meals";
import { getTodayWaterIntake, waterFeedback } from "@/lib/water";
import {
  activeSubscriptionsFor,
  sendPushToSubscription,
  type PushPayload,
} from "@/lib/push";

type Pref = {
  mealsEnabled: boolean;
  waterEnabled: boolean;
  dayCloseEnabled: boolean;
  freeMealEnabled: boolean;
};

const DEFAULT_PREF: Pref = {
  mealsEnabled: true,
  waterEnabled: true,
  dayCloseEnabled: true,
  freeMealEnabled: true,
};

function parseHHmm(s: string): { h: number; m: number } {
  const [h, m] = s.split(":").map((n) => Number.parseInt(n, 10));
  return { h: h || 0, m: m || 0 };
}

function withinDayWindow(now: Date, dayStart: string, dayEnd: string): boolean {
  const minutesOfDay = now.getHours() * 60 + now.getMinutes();
  const s = parseHHmm(dayStart);
  const e = parseHHmm(dayEnd);
  return minutesOfDay >= s.h * 60 + s.m && minutesOfDay <= e.h * 60 + e.m;
}

async function tryDispatchAndSend(
  personaId: string,
  kind: "meal" | "water" | "dayclose" | "freemeal",
  refKey: string,
  payload: PushPayload
): Promise<boolean> {
  const subs = await activeSubscriptionsFor(personaId);
  if (subs.length === 0) return false;

  const created = await prisma.notificationDispatch.createMany({
    data: [{ personaId, kind, refKey, status: "sent" }],
    skipDuplicates: true,
  });
  if (created.count !== 1) return false;

  const results = await Promise.all(subs.map((s) => sendPushToSubscription(s, payload)));
  const anyOk = results.some((r) => r.ok);
  if (!anyOk) {
    const errs = results
      .map((r) => (r.ok ? null : `${r.status ?? "?"} ${r.error}`))
      .filter(Boolean)
      .join(" | ");
    await prisma.notificationDispatch.updateMany({
      where: { personaId, kind, refKey },
      data: { status: "failed", error: errs.slice(0, 500) },
    });
  }
  return anyOk;
}

export type TickResult = {
  ok: true;
  dispatches: number;
  personas: number;
  inWindow: boolean;
};

export async function runTick(now: Date = new Date()): Promise<TickResult> {
  const settings = await prisma.appSettings.findFirst();
  const dayStart = settings?.dayStartTime ?? "06:00";
  const dayEnd = settings?.dayEndTime ?? "23:00";

  if (!withinDayWindow(now, dayStart, dayEnd)) {
    return { ok: true, dispatches: 0, personas: 0, inWindow: false };
  }

  const personas = await prisma.persona.findMany({
    where: { isActive: true },
    include: { notificationPreference: true },
  });

  let dispatches = 0;
  const iso = todayIsoSp(now);
  const minutesOfDay = now.getHours() * 60 + now.getMinutes();

  for (const persona of personas) {
    const pref: Pref = persona.notificationPreference
      ? {
          mealsEnabled: persona.notificationPreference.mealsEnabled,
          waterEnabled: persona.notificationPreference.waterEnabled,
          dayCloseEnabled: persona.notificationPreference.dayCloseEnabled,
          freeMealEnabled: persona.notificationPreference.freeMealEnabled,
        }
      : DEFAULT_PREF;

    if (pref.mealsEnabled) {
      const meals = await getMealsForToday(persona.id, now);
      for (const meal of meals) {
        if (meal.status !== "pending") continue;
        const diffMs = now.getTime() - meal.scheduledDate.getTime();
        const absMin = Math.abs(diffMs) / 60_000;
        if (absMin > 3) continue;
        const refKey = `meal:${meal.id}:${iso}`;
        const sent = await tryDispatchAndSend(persona.id, "meal", refKey, {
          title: `Hora do ${meal.name}`,
          body: `Programado para ${meal.scheduledAt}. Toque para abrir.`,
          url: "/today",
          tag: `meal:${meal.id}`,
        });
        if (sent) dispatches++;
      }
    }

    if (pref.waterEnabled) {
      const consumedMl = await getTodayWaterIntake(persona.id, now);
      const feedback = waterFeedback(consumedMl, persona.dailyWaterMl, now);
      if (feedback.tone === "behind") {
        const bucket = Math.floor(minutesOfDay / 90);
        const refKey = `water:${iso}:${bucket}`;
        const missing = persona.dailyWaterMl - consumedMl;
        const sent = await tryDispatchAndSend(persona.id, "water", refKey, {
          title: "Lembrete de água",
          body:
            missing > 0
              ? `Faltam ${(missing / 1000).toFixed(2)}L pra meta do dia.`
              : "Mantenha o ritmo da hidratação.",
          url: "/water",
          tag: "water",
        });
        if (sent) dispatches++;
      }
    }

    if (pref.dayCloseEnabled) {
      const closeStart = 22 * 60;
      if (minutesOfDay >= closeStart) {
        const summary = await prisma.dailySummary.findUnique({
          where: { personaId_date: { personaId: persona.id, date: dateKey(now) } },
        });
        const missingCheckin =
          !summary ||
          summary.energyLevel == null ||
          summary.moodLevel == null ||
          summary.hungerLevel == null;
        if (missingCheckin) {
          const refKey = `dayclose:${iso}`;
          const sent = await tryDispatchAndSend(persona.id, "dayclose", refKey, {
            title: "Fechar o dia",
            body: "Faltam 30 segundos pra registrar energia, humor e fome.",
            url: "/today/close",
            tag: "dayclose",
          });
          if (sent) dispatches++;
        }
      }
    }

    if (pref.freeMealEnabled) {
      const startMin = parseHHmm(dayStart).h * 60 + parseHHmm(dayStart).m;
      // Notifica refeições livres planejadas no primeiro tick após dayStart (janela de 5min)
      if (minutesOfDay >= startMin && minutesOfDay <= startMin + 5) {
        const freeMeals = await prisma.freeMeal.findMany({
          where: { personaId: persona.id, date: dateKey(now) },
        });
        for (const fm of freeMeals) {
          const refKey = `freemeal:${fm.id}:${iso}`;
          const sent = await tryDispatchAndSend(persona.id, "freemeal", refKey, {
            title: "Refeição livre planejada pra hoje",
            body: fm.description ? `${fm.type} · ${fm.description}` : `${fm.type}`,
            url: "/today",
            tag: `freemeal:${fm.id}`,
          });
          if (sent) dispatches++;
        }
      }
    }
  }

  return { ok: true, dispatches, personas: personas.length, inWindow: true };
}
