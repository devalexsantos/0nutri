// Service Worker minimal para 0nutri
// Estratégia:
// - HTML: network-first (sempre tenta rede, cai para cache)
// - Assets estáticos (_next/static, ícones): cache-first
// - Demais: network-first com fallback opcional

const CACHE_VERSION = "0nutri-v2";
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;

const PRECACHE_URLS = [
  "/manifest.json",
  "/icon.svg",
  "/icon-maskable.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => !k.startsWith(CACHE_VERSION))
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Never cache server actions or API mutations
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/_next/data/")) return;

  // Static assets cache-first
  if (url.pathname.startsWith("/_next/static") || PRECACHE_URLS.includes(url.pathname)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // HTML & data: network-first
  event.respondWith(networkFirst(request));
});

async function cacheFirst(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;
  try {
    const fresh = await fetch(request);
    if (fresh.ok) cache.put(request, fresh.clone());
    return fresh;
  } catch (err) {
    return cached ?? Response.error();
  }
}

async function networkFirst(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  try {
    const fresh = await fetch(request);
    if (fresh.ok) cache.put(request, fresh.clone());
    return fresh;
  } catch (err) {
    const cached = await cache.match(request);
    if (cached) return cached;
    throw err;
  }
}

// Web Push — iOS desinscreve push silencioso, então sempre mostramos a notificação.
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (_e) {
    data = { title: "0nutri", body: event.data ? event.data.text() : "" };
  }
  const title = data.title || "0nutri";
  const body = data.body || "";
  const url = data.url || "/today";
  const tag = data.tag || "0nutri";
  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      tag,
      icon: "/icon.svg",
      badge: "/icon.svg",
      data: { url },
      renotify: false,
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.url) || "/today";
  event.waitUntil(
    (async () => {
      const all = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      const existing = all.find((c) => c.url.startsWith(self.location.origin));
      if (existing) {
        await existing.focus();
        try {
          await existing.navigate(target);
        } catch (_e) {
          // navigate pode falhar em SW antigo / iOS — abre em nova janela como fallback
          await self.clients.openWindow(target);
        }
        return;
      }
      await self.clients.openWindow(target);
    })()
  );
});
