/* QB LAB public static assets only. Never cache API, RSC, athlete page HTML or media. */
const CACHE = "qb-lab-public-v1";
const OFFLINE = "/qb-lab/offline.html";
const STATIC = [OFFLINE, "/qb-lab/offline.css", "/qb-lab/manifest.webmanifest", "/qb-lab/icon-192.png", "/qb-lab/icon-512.png"];
self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(STATIC)));
});
self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith("qb-lab-public-") && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin || request.headers.has("authorization") || request.headers.has("rsc") || url.search) return;
  if (request.mode === "navigate" && (url.pathname === "/qb-lab" || url.pathname.startsWith("/qb-lab/"))) {
    event.respondWith(fetch(request).catch(async () => (await caches.match(OFFLINE)) || Response.error()));
    return;
  }
  if (!STATIC.includes(url.pathname) && !url.pathname.startsWith("/_next/static/")) return;
  event.respondWith(caches.open(CACHE).then(async cache => {
    const hit = await cache.match(request);
    if (hit) return hit;
    const response = await fetch(request);
    if (response.ok && response.type === "basic" && !/no-store|private/.test(response.headers.get("cache-control") || "")) {
      const keys = await cache.keys();
      // Bound runtime asset storage; explicit offline resources are retained.
      const assets = keys.filter(k => new URL(k.url).pathname.startsWith("/_next/static/"));
      if (assets.length >= 80) await cache.delete(assets[0]);
      await cache.put(request, response.clone());
    }
    return response;
  }));
});
