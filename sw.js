/* Service worker de la Red Proyecta Más: hace instalable la app y recibe las notificaciones al celular. */
const CACHE = "red-v1";
const BASE = ["/", "/index.html", "/css/red.css", "/css/app.css", "/assets/icon/favicon-192.png"];

self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(BASE)).catch(() => {})); self.skipWaiting(); });
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

/* Siempre se busca lo último en internet; si no hay conexión, se muestra la última versión guardada. */
self.addEventListener("fetch", e => {
  const r = e.request;
  if (r.method !== "GET" || new URL(r.url).origin !== location.origin) return;
  e.respondWith(fetch(r).then(res => {
    if (res.ok) { const copia = res.clone(); caches.open(CACHE).then(c => c.put(r, copia)); }
    return res;
  }).catch(() => caches.match(r).then(m => m || caches.match("/index.html"))));
});

self.addEventListener("push", e => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch { d = { body: e.data && e.data.text() }; }
  e.waitUntil(self.registration.showNotification(d.title || "Red Proyecta Más", {
    body: d.body || "Tenés un aviso nuevo.",
    icon: "/assets/icon/favicon-192.png",
    badge: "/assets/icon/favicon-192.png",
    data: { url: d.url || "/" },
    tag: d.url || "red"
  }));
});

self.addEventListener("notificationclick", e => {
  e.notification.close();
  const url = new URL(e.notification.data && e.notification.data.url || "/", self.location.origin).href;
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(ws => {
    for (const w of ws) { if (new URL(w.url).origin === self.location.origin) { w.focus(); return w.navigate(url); } }
    return self.clients.openWindow(url);
  }));
});
