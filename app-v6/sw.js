const CACHE_NAME = "kozak-nexus-v18.20.0";
const CORE = ["./control-flow-18.16.js?v=18.20.0","./control-flow-18.16.css?v=18.20.0","./command-deck-ui-18.14.css?v=18.14.0","./global-update-18.02.css?v=18.02.0","./interface-system-18.12.css?v=18.13.1","./anime-hub.css?v=1.1.0","./anime-hub.js?v=1.6.1","./roblox-3d.css?v=1.2.0","./roblox-3d.js?v=1.3.0","./roblox-worlds.css?v=2.0.0","./roblox-worlds.js?v=2.0.0","./device-layouts.css?v=17.82.0","./youtube-mode.css?v=17.71.0","./youtube-mode.js?v=17.76.0","./nexus-ops.css?v=17.81.0","./nexus-ops.js?v=17.81.0","./music-buttons-v16.57.css?v=16.57.0","./battle-hub-3.css?v=17.17.0","./music-sleep-timer.js?v=1.0.2","./background-music.js?v=16.64.0","./responsive-comfort-v16.51.css?v=16.51.0","./esports-static.css?v=16.23.0","./control-lab.css?v=1.0.0","./control-lab.js?v=1.0.0","./match-report.css?v=1.0.0","./match-report.js?v=1.0.0","./pubg-links.css?v=1.0.6","./mission-lab.css?v=16.89.0","./mission-lab.js?v=16.89.0","./command-deck.css?v=16.89.0","./command-deck.js?v=16.89.0","./progress-core.js?v=17.10.0","./player-journey.js?v=17.6.0","./survival-ops.js?v=17.64.0","./repair-bridge.js?v=17.10.0","./global-13.8.css?v=13.8.1","./interface-refresh.css?v=13.9.2","./interface-v16.css?v=16.2.0","./media-tiktok-buttons.css?v=16.1.0","./interface-recovery-v16.2.css?v=16.4.0","./cyberpunk-theme-v16.5.css?v=16.9.0","./cyberpunk-overrides-v16.7.css?v=16.12.0","./","./index.html?v=18.20.0","./kozak-device-assistant.css?v=1.2.0","./kozak-device-assistant.js?v=1.4.0","./home-briefing.js?v=17.5.0","./telegram-battle-hub.svg?v=16.91.0","./style.css?v=17.71.0","./event-center.css?v=1.0.0","./app.js?v=17.71.0","./battle-hub-3.js?v=17.17.0","./arcade-100.js?v=1.1.2","./progression-hub.js?v=17.2.0","./battle-pass-v16.17.js?v=16.18.4","./tactical-lab-v16.18.js?v=16.18.2","./tactical-lab-v16.18.css?v=16.18.1","./tactical-lab-access-v16.18.1.css?v=16.18.1","./tactical-lab-access-v16.18.1.js?v=16.18.1","./media.js?v=17.6.0","./i18n.js?v=8.26.0","./manifest.webmanifest?v=4","./icon.svg?v=4","./games-3d.js?v=1.4.1","./event-center.js?v=17.4.0","./fun-expansion.js?v=17.4.0","./arsenal.css?v=1.0.0","./arsenal.js?v=1.0.0","./tactical-hq.css?v=9.3.0","./tactical-hq.js?v=9.3.0","./game-library.css?v=1.1.0","./game-library.js?v=1.2.0","./fighter-inventory-v16.12.js?v=16.16.0","./fighter-inventory-v16.12.css?v=16.16.0","./home-replica.js?v=1.0.3","./fighter-upgrade.css?v=1.0.0","./fighter-upgrade.js?v=1.0.0","./desktop-neon.css?v=17.51.0","./global-refresh.css?v=9.0.1","./global-control-center.js?v=9.3.0","./pc-companion.js?v=1.2.0","./desktop-tools.js?v=1.0.1","./bunker.js?v=17.64.0","./app-update.css?v=17.82.0","./app-update.js?v=18.20.0","./version.json?v=18.20.0","./battle-world.css?v=1.0.1","./battle-world.js?v=1.0.1","./creator-studio.css?v=1.1.0","./creator-studio.js?v=1.1.0","./app-management.js?v=18.20.0","./creator-editor.css?v=1.2.0","./creator-editor.js?v=1.2.0","./tiktok-hub.css?v=17.40.0","./tiktok-hub.js?v=17.40.0","./kozak-ai-daily-ops.css?v=16.79.0","./kozak-ai-daily-ops.js?v=17.15.0","./battle-hub-3-ops.css?v=16.84.0","./battle-hub-3-ops.js?v=17.12.0","i18n.js?v=8.26.0","media.js?v=17.6.0","background-music.js?v=16.64.0","music-sleep-timer.js?v=1.0.2","app.js?v=17.71.0","bunker.js?v=17.63.0","arcade-100.js?v=1.1.2","progression-hub.js?v=17.2.0","battle-pass-v16.17.js?v=16.18.4","games-3d.js?v=1.4.1","event-center.js?v=17.4.0","arsenal.js?v=1.0.0","tactical-lab-v16.18.js?v=16.18.2","tactical-hq.js?v=9.3.0","game-library.js?v=1.2.0","fighter-inventory-v16.12.js?v=16.16.0","home-replica.js?v=1.0.3","fighter-upgrade.js?v=1.0.0","desktop-tools.js?v=1.0.1","global-control-center.js?v=9.3.0","pc-companion.js?v=1.2.0","battle-hub-3.js?v=17.17.0","battle-hub-3-ops.js?v=17.12.0","mission-lab.js?v=16.89.0","command-deck.js?v=16.89.0","kozak-ai-daily-ops.js?v=17.15.0","tiktok-hub.js?v=17.63.0","app-update.js?v=18.13.0","battle-world.js?v=1.0.1","creator-studio.js?v=1.1.0","app-management.js?v=18.13.0","progress-core.js?v=17.11.0","player-journey.js?v=17.71.0","survival-ops.js?v=17.63.0","repair-bridge.js?v=17.11.0","control-lab.js?v=1.0.0","match-report.js?v=1.0.0","fun-expansion.js?v=17.4.0","home-briefing.js?v=17.5.0","nexus-ops.js?v=17.81.0"];
self.addEventListener("message", event => { if (event.data && event.data.type === "SKIP_WAITING") self.skipWaiting(); });
self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => Promise.all(CORE.map(url => cache.add(url).catch(() => null)))).then(() => self.skipWaiting()));
});
self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => (key.startsWith("kh-kozak-hub-") || key.startsWith("kozak-nexus-")) && key !== CACHE_NAME).map(key => caches.delete(key)))).then(() => self.clients.claim()));
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
  if (new URL(request.url).pathname.endsWith("/nexus-ops.js")) { event.respondWith(fetch(request, {cache:"no-store"})); return; }
  event.respondWith(caches.match(request).then(cached => cached || fetch(request).then(response => {
    if (response.ok) {
      const copy = response.clone();
      caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
    }
    return response;
  })));
});
