const CACHE_NAME = "kh-kozak-hub-v8.67.0";
const CORE = ["./", "./index.html", "./style.css?v=8.67.0", "./event-center.css?v=1.0.0", "./app.js?v=8.67.0", "./arcade-100.js?v=1.0.1", "./progression-hub.js?v=1.1.0", "./media.js?v=8.67.0", "./i18n.js?v=8.26.0", "./manifest.webmanifest", "./icon.svg", "./games-3d.js?v=1.3.0", "./event-center.js?v=1.0.0", "./arsenal.css?v=1.0.0", "./arsenal.js?v=1.0.0", "./game-library.css?v=1.1.0", "./game-library.js?v=1.1.0", "./character-lobby.css?v=1.2.1", "./character-lobby.js?v=1.2.1", "./desktop-neon.css?v=1.1.0", "./desktop-tools.js?v=1.0.0", "./bunker.js?v=1.1.0"];
self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith("kh-kozak-hub-") && key !== CACHE_NAME).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET" || new URL(request.url).origin !== self.location.origin) return;
  if (request.mode === "navigate") {
    event.respondWith(fetch(request).then(response => {
      const copy = response.clone();
      caches.open(CACHE_NAME).then(cache => cache.put("./index.html", copy));
      return response;
    }).catch(() => caches.match("./index.html")));
    return;
  }
  event.respondWith(caches.match(request).then(cached => cached || fetch(request).then(response => {
    if (response.ok) {
      const copy = response.clone();
      caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
    }
    return response;
  })));
});
