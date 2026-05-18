"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const prefSchema = z.object({
  personaId: z.string().min(1),
  mealsEnabled: z.boolean().optional(),
  waterEnabled: z.boolean().optional(),
  dayCloseEnabled: z.boolean().optional(),
  freeMealEnabled: z.boolean().optional(),
});

export async function updateNotificationPreferences(input: z.input<typeof prefSchema>) {
  const data = prefSchema.parse(input);
  const { personaId, ...patch } = data;
  await prisma.notificationPreference.upsert({
    where: { personaId },
    create: { personaId, ...patch },
    update: patch,
  });
  revalidatePath("/settings");
}

export async function sendTestPush(personaId: string) {
  const { activeSubscriptionsFor, sendPushToSubscription } = await import("@/lib/push");
  const subs = await activeSubscriptionsFor(personaId);
  if (subs.length === 0) {
    return { ok: false as const, error: "Nenhuma inscrição ativa." };
  }
  const results = await Promise.all(
    subs.map((s) =>
      sendPushToSubscription(s, {
        title: "Teste 0nutri",
        body: "Se você vê isso, push está funcionando.",
        url: "/today",
        tag: "test",
      })
    )
  );
  const okCount = results.filter((r) => r.ok).length;
  return { ok: okCount > 0, sent: okCount, total: results.length };
}

export async function getNotificationPreferences(personaId: string) {
  const pref = await prisma.notificationPreference.findUnique({ where: { personaId } });
  return (
    pref ?? {
      personaId,
      mealsEnabled: true,
      waterEnabled: true,
      dayCloseEnabled: true,
      freeMealEnabled: true,
    }
  );
}
