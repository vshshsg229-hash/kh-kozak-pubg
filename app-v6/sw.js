const CACHE_NAME = "kh-kozak-hub-v16.39.0";
const CORE = ["./esports-static.css?v=16.23.0", "./control-lab.css?v=1.0.0", "./control-lab.js?v=1.0.0", "./match-report.css?v=1.0.0", "./match-report.js?v=1.0.0", "./pubg-links.css?v=1.0.6", "./global-13.8.css?v=13.8.1", "./interface-refresh.css?v=13.9.2", "./interface-v16.css?v=16.2.0", "./media-tiktok-buttons.css?v=16.1.0", "./interface-recovery-v16.2.css?v=16.4.0", "./cyberpunk-theme-v16.5.css?v=16.9.0", "./cyberpunk-overrides-v16.7.css?v=16.12.0", "./", "./index.html", "./style.css?v=9.5.9-pubg-buttons", "./event-center.css?v=1.0.0", "./app.js?v=16.36.0", "./arcade-100.js?v=1.1.2", "./progression-hub.js?v=1.1.0", "./battle-pass-v16.17.js?v=16.18.0", "./tactical-lab-v16.18.js?v=16.18.0", "./tactical-lab-v16.18.css?v=16.18.1", "./tactical-lab-access-v16.18.1.css?v=16.18.1", "./tactical-lab-access-v16.18.1.js?v=16.18.1", "./media.js?v=16.2.0", "./i18n.js?v=8.26.0", "./manifest.webmanifest", "./icon.svg", "./games-3d.js?v=1.4.0", "./event-center.js?v=1.0.0", "./arsenal.css?v=1.0.0", "./arsenal.js?v=1.0.0", "./tactical-hq.css?v=9.3.0", "./tactical-hq.js?v=9.3.0", "./game-library.css?v=1.1.0", "./game-library.js?v=1.2.0", "./character-lobby.css?v=1.4.1", "./pubg-lobby-mode.css?v=1.0.2", "./character-lobby.js?v=1.4.3", "./pubg-lobby-mode.js?v=1.0.1", "./pubg-lobby-3d.js?v=1.0.1", "./fighter-inventory-v16.12.js?v=16.16.0", "./fighter-inventory-v16.12.css?v=16.16.0", "./home-replica.js?v=1.0.3", "./fighter-upgrade.css?v=1.0.0", "./fighter-upgrade.js?v=1.0.0", "./desktop-neon.css?v=1.1.0", "./global-refresh.css?v=9.0.1", "./global-control-center.js?v=9.2.7", "./desktop-tools.js?v=1.0.0", "./bunker.js?v=1.1.0", "./app-update.css?v=13.9.2", "./app-update.js?v=16.23.0", "./version.json?v=16.23.0", "./battle-world.css?v=1.0.1", "./battle-world.js?v=1.0.1", "./creator-studio.css?v=1.1.0", "./creator-studio.js?v=1.1.0", "./app-management.js?v=16.23.0", "./creator-editor.css?v=1.2.0", "./creator-editor.js?v=1.2.0"];
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
