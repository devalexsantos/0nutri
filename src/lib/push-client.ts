"use client";

export type PushCapability =
  | "unsupported"
  | "needs-install"
  | "insecure-context"
  | "ready";

type IOSNavigator = Navigator & { standalone?: boolean };

function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) && !("MSStream" in window);
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  if (window.matchMedia?.("(display-mode: standalone)").matches) return true;
  return Boolean((navigator as IOSNavigator).standalone);
}

export function detectPushCapability(): PushCapability {
  if (typeof window === "undefined") return "unsupported";
  if (!("Notification" in window)) return "unsupported";
  if (!("serviceWorker" in navigator)) return "unsupported";

  // iOS Safari só expõe PushManager dentro de PWA na tela inicial.
  // Sinalizamos "precisa instalar" antes de declarar unsupported.
  if (isIOS() && !isStandalone()) return "needs-install";

  // Push API exige secure context (HTTPS ou localhost). HTTP em LAN não basta.
  if (!window.isSecureContext) return "insecure-context";

  if (!("PushManager" in window)) return "unsupported";
  return "ready";
}

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

export async function getCurrentSubscription(): Promise<PushSubscription | null> {
  if (!("serviceWorker" in navigator)) return null;
  const reg = await navigator.serviceWorker.ready;
  return reg.pushManager.getSubscription();
}

export async function enablePush(personaId: string): Promise<
  | { ok: true; endpoint: string }
  | { ok: false; reason: "permission" | "no-key" | "subscribe" | "post"; detail?: string }
> {
  if (Notification.permission === "default") {
    const result = await Notification.requestPermission();
    if (result !== "granted") return { ok: false, reason: "permission" };
  } else if (Notification.permission === "denied") {
    return { ok: false, reason: "permission" };
  }

  const keyRes = await fetch("/api/push/vapid-public-key");
  if (!keyRes.ok) return { ok: false, reason: "no-key" };
  const { key } = (await keyRes.json()) as { key: string };

  const reg = await navigator.serviceWorker.ready;
  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    try {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(key) as BufferSource,
      });
    } catch (err) {
      return {
        ok: false,
        reason: "subscribe",
        detail: err instanceof Error ? err.message : String(err),
      };
    }
  }

  const raw = sub.toJSON() as { endpoint?: string; keys?: { p256dh: string; auth: string } };
  if (!raw.endpoint || !raw.keys) {
    return { ok: false, reason: "subscribe", detail: "subscription sem keys" };
  }

  const postRes = await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      personaId,
      endpoint: raw.endpoint,
      keys: raw.keys,
      userAgent: navigator.userAgent,
    }),
  });
  if (!postRes.ok) {
    return { ok: false, reason: "post", detail: await postRes.text() };
  }
  return { ok: true, endpoint: raw.endpoint };
}

export async function disablePush(): Promise<void> {
  if (!("serviceWorker" in navigator)) return;
  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.getSubscription();
  if (!sub) return;
  const endpoint = sub.endpoint;
  await sub.unsubscribe();
  await fetch("/api/push/unsubscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ endpoint }),
  });
}
