const CACHE_NAME = "kh-kozak-hub-v9.5.4";
const CORE = ["./", "./index.html", "./style.css?v=9.3.0", "./event-center.css?v=1.0.0", "./app.js?v=9.5.3", "./arcade-100.js?v=1.0.2", "./progression-hub.js?v=1.1.0", "./battle-evolution.js?v=1.1.0", "./media.js?v=9.0.0", "./i18n.js?v=8.26.0", "./manifest.webmanifest", "./icon.svg", "./games-3d.js?v=1.3.1", "./event-center.js?v=1.0.0", "./arsenal.css?v=1.0.0", "./arsenal.js?v=1.0.0", "./tactical-hq.css?v=9.3.0", "./tactical-hq.js?v=9.3.0", "./game-library.css?v=1.1.0", "./game-library.js?v=1.1.0", "./character-lobby.css?v=1.4.1", "./character-lobby.js?v=1.4.2", "./home-replica.js?v=1.0.3", "./fighter-upgrade.css?v=1.0.0", "./fighter-upgrade.js?v=1.0.0", "./fighter-loadout.css?v=1.1.0", "./fighter-loadout.js?v=1.1.0", "./desktop-neon.css?v=1.1.0", "./global-refresh.css?v=9.0.1", "./global-control-center.js?v=9.0.1", "./desktop-tools.js?v=1.0.0", "./bunker.js?v=1.1.0", "./app-update.css?v=9.5.3", "./app-update.js?v=9.5.3", "./version.json", "./battle-world.css?v=1.0.1", "./battle-world.js?v=1.0.1", "./creator-studio.css?v=1.1.0", "./creator-studio.js?v=1.1.0", "./creator-editor.css?v=1.2.0", "./creator-editor.js?v=1.2.0", "./creator-feed.js?v=1.0.0", "./creator-feed.css?v=1.0.0"];
self.addEventListener("message", event => { if (event.data && event.data.type === "SKIP_WAITING") self.skipWaiting(); });
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
