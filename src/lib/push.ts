import "server-only";
import webpush from "web-push";
import { prisma } from "@/lib/prisma";

let configured = false;

function configure() {
  if (configured) return;
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || "mailto:admin@example.com";
  if (!publicKey || !privateKey) {
    throw new Error(
      "VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY ausentes no ambiente. Não é possível enviar push."
    );
  }
  webpush.setVapidDetails(subject, publicKey, privateKey);
  configured = true;
}

export type PushPayload = {
  title: string;
  body?: string;
  url?: string;
  tag?: string;
};

export type StoredSubscription = {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
};

export async function sendPushToSubscription(
  sub: StoredSubscription,
  payload: PushPayload
): Promise<{ ok: true } | { ok: false; status?: number; gone?: boolean; error: string }> {
  configure();
  try {
    await webpush.sendNotification(
      {
        endpoint: sub.endpoint,
        keys: { p256dh: sub.p256dh, auth: sub.auth },
      },
      JSON.stringify(payload),
      { TTL: 60 * 30 }
    );
    return { ok: true };
  } catch (err) {
    const status =
      err && typeof err === "object" && "statusCode" in err
        ? (err as { statusCode: number }).statusCode
        : undefined;
    const gone = status === 404 || status === 410;
    if (gone) {
      await prisma.pushSubscription.update({
        where: { id: sub.id },
        data: { disabledAt: new Date() },
      });
    }
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, status, gone, error: message };
  }
}

export async function activeSubscriptionsFor(personaId: string) {
  return prisma.pushSubscription.findMany({
    where: { personaId, disabledAt: null },
    select: { id: true, endpoint: true, p256dh: true, auth: true },
  });
}
