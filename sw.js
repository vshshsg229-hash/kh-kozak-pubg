'use strict';
const CACHE = 'kh-kozak-shell-v60';
const CORE = [
 './global-v46.css?v=1','./global-v46.js?v=1',
 './','./index.html','./account.html','./account.css?v=1','./account.js?v=2','./supabase-config.js?v=1','./cloud-sync.js?v=1','./community.html','./community.css?v=1','./chat.css?v=1','./community.js?v=2','./community-schema.sql','./chat-schema.sql','./index-v3.html','./avatars.html','./videos.html','./minigames.html','./locker.html','./music.html','./battlehub.html','./assistant.html','./download.html','./assistant.css?v=3','./assistant.js?v=5','./assistant-manifest.webmanifest',
 './navigation-v5.css?v=1','./navigation-v5.js?v=1','./home-quick-v1.css?v=1','./style.css','./script.js','./tab-search.js','./new-home.css','./new-home.js','./site-v4.css','./site-v4.js','./extra-games.css','./extra-games.js','./victor-game.css','./victor-game.js','./quick-tools.css','./quick-tools.js',
 './squad-lab.css','./squad-lab.js','./ai-helper.css','./ai-helper.js','./kh-v3.css','./kh-v3.js',
 './site-i18n.css','./site-i18n.js','./lucky-drop.css','./lucky-drop.js',
 './minigames.css','./minigames.js','./arcade-plus.css','./arcade-plus.js','./firebase-config.js','./firebase-leaderboard.js','./database.rules.json','./locker.css','./locker.js','./music.css','./music.js','./battlehub.css',
 './manifest.webmanifest','./favicon.svg','./app-icon.svg','./privacy.html','./app-shell.css','./app-shell.js','./app-shell.css?v=1','./app-shell.css?v=2','./app-shell.js?v=1','./premium-app.css?v=1','./premium-app.js?v=1',
 './avatar-15.svg','./avatar-16.svg','./avatar-17.svg','./avatar-18.svg','./avatar-19.svg','./avatar-20.svg',
 './avatar-21.svg','./avatar-22.svg','./avatar-23.svg','./avatar-24.svg','./avatar-25.svg','./avatar-26.svg'
];
self.addEventListener('install', event => {
 event.waitUntil(
  caches.open(CACHE).then(async cache => {
   await Promise.all(CORE.map(async url => {
    try {
     const response = await fetch(url, {cache:'reload'});
     if (response.ok) await cache.put(url, response);
    } catch (_) {}
   }));
  }).then(() => self.skipWaiting())
 );
});
self.addEventListener('activate', event => {
 event.waitUntil(
  caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key))))
   .then(() => self.clients.claim())
 );
});
self.addEventListener('fetch', event => {
 const request = event.request;
 if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;
 // Config must be fetched fresh after the owner adds Supabase project details.
 if (new URL(request.url).pathname.endsWith('/supabase-config.js')) {
  event.respondWith(fetch(request, {cache:'no-store'}).catch(() => caches.match(request)));
  return;
 }
 event.respondWith(
  caches.match(request).then(cached => {
   if (cached) return cached;
   return fetch(request).then(response => {
    if (response.ok && response.type === 'basic') {
     const copy = response.clone();
     caches.open(CACHE).then(cache => cache.put(request, copy));
    }
    return response;
   }).catch(() => request.mode === 'navigate' ? caches.match('./index.html') : new Response('', {status:503,statusText:'Offline'}));
  })
 );
});
