// Food Passport 360 — Service Worker
// Cache shell statique + notifications push in-browser

const CACHE_NAME = "fp360-shell-v1";
const SHELL_URLS = ["/", "/offline"];

// ── Installation : précache le shell ──────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_URLS).catch(() => {}))
  );
  self.skipWaiting();
});

// ── Activation : nettoyage des anciens caches ─────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ── Fetch : network-first pour les routes Next.js ─────────
self.addEventListener("fetch", (event) => {
  // Ne cache que les requêtes GET same-origin
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  // API routes et Supabase toujours network
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/_next/")) return;

  event.respondWith(
    fetch(event.request).catch(() =>
      caches.match(event.request).then((r) => r ?? caches.match("/offline"))
    )
  );
});

// ── Messages depuis la page → notification ────────────────
// Payload attendu : { type: "NOTIFY", title, body, icon?, url? }
self.addEventListener("message", (event) => {
  if (!event.data || event.data.type !== "NOTIFY") return;
  const { title, body, icon = "/icon-192.png", url = "/" } = event.data;

  self.registration.showNotification(title, {
    body,
    icon,
    badge: "/icon-192.png",
    data: { url },
    requireInteraction: false,
    silent: false,
  });
});

// ── Clic sur notification → ouvre / focus l'onglet ────────
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = event.notification.data?.url ?? "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      const existing = clients.find((c) => c.url.includes(target));
      if (existing) return existing.focus();
      return self.clients.openWindow(target);
    })
  );
});
