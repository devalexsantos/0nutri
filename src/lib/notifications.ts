"use client";

/**
 * Helpers para Web Notifications no foreground.
 * Em homelab, sem backend de Web Push, isso só dispara enquanto a aba está aberta
 * ou o PWA está rodando — suficiente para uso diário.
 */

export type NotificationPermissionState = "default" | "granted" | "denied" | "unsupported";

export function getNotificationPermission(): NotificationPermissionState {
  if (typeof window === "undefined") return "unsupported";
  if (typeof Notification === "undefined") return "unsupported";
  return Notification.permission as NotificationPermissionState;
}

export async function requestNotificationPermission(): Promise<NotificationPermissionState> {
  if (typeof window === "undefined" || typeof Notification === "undefined") return "unsupported";
  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied") return "denied";
  const result = await Notification.requestPermission();
  return result as NotificationPermissionState;
}

export async function showNotification(title: string, options?: NotificationOptions) {
  if (getNotificationPermission() !== "granted") return false;
  try {
    // Preferir via service worker (funciona melhor em PWA)
    if ("serviceWorker" in navigator) {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg) {
        await reg.showNotification(title, {
          icon: "/icon.svg",
          badge: "/icon.svg",
          ...options,
        });
        return true;
      }
    }
    // Fallback direto
    new Notification(title, { icon: "/icon.svg", ...options });
    return true;
  } catch (err) {
    console.warn("showNotification falhou:", err);
    return false;
  }
}

export type ScheduledItem = {
  id: string;
  fireAt: number; // epoch ms
  title: string;
  body?: string;
  tag?: string;
};

const STORAGE_KEY = "0nutri.scheduledNotifications";
const FIRED_KEY = "0nutri.firedNotifications";

function readFired(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    return new Set(JSON.parse(localStorage.getItem(FIRED_KEY) ?? "[]"));
  } catch {
    return new Set();
  }
}

function writeFired(set: Set<string>) {
  if (typeof window === "undefined") return;
  // Mantém só os últimos 100
  const arr = [...set].slice(-100);
  localStorage.setItem(FIRED_KEY, JSON.stringify(arr));
}

const timers = new Map<string, number>();

export function clearAllScheduled() {
  for (const id of timers.keys()) {
    const t = timers.get(id);
    if (typeof t === "number") clearTimeout(t);
  }
  timers.clear();
  if (typeof window !== "undefined") {
    localStorage.removeItem(STORAGE_KEY);
  }
}

/**
 * Agenda uma lista de notificações idempotentemente:
 * - Limpa timers antigos
 * - Cria novos timers para itens cujo fireAt ainda não passou
 * - Marca como "fired" para não repetir entre montagens
 */
export function scheduleNotifications(items: ScheduledItem[]) {
  if (typeof window === "undefined") return;
  if (getNotificationPermission() !== "granted") return;

  // Limpa timers antigos
  for (const t of timers.values()) clearTimeout(t);
  timers.clear();

  const fired = readFired();
  const now = Date.now();

  // Persiste a lista para auditoria/debug
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // ignore
  }

  for (const item of items) {
    const delay = item.fireAt - now;
    if (delay <= 0) continue; // já passou
    if (delay > 24 * 60 * 60 * 1000) continue; // só agenda no horizonte de 24h
    if (fired.has(item.id)) continue;
    const handle = window.setTimeout(() => {
      void showNotification(item.title, { body: item.body, tag: item.tag ?? item.id });
      fired.add(item.id);
      writeFired(fired);
    }, delay);
    timers.set(item.id, handle);
  }
}
