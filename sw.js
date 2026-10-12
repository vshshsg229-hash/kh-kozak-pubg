'use strict';
const CACHE = 'kh-kozak-shell-v1';
const CORE = [
  './',
  './index.html',
  './avatars.html',
  './videos.html',
  './community.html',
  './minigames.html',
  './style.css',
  './minigames.css',
  './script.js',
  './community.js',
  './minigames.js',
  './favicon.svg',
  './manifest.webmanifest',
  './kozak-pubg.jpg',
  './avatar-01.jpg',
  './avatar-02.jpg',
  './avatar-03.jpg',
  './avatar-06.jpg',
  './avatar-13.jpg',
  './avatar-14.jpg'
];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;
  event.respondWith(caches.match(request).then(cached => {
    if (cached) return cached;
    return fetch(request).then(response => {
      if (response.ok && response.type === 'basic') {
        const copy = response.clone();
        caches.open(CACHE).then(cache => cache.put(request, copy));
      }
      return response;
    }).catch(() => {
      if (request.mode === 'navigate') return caches.match('./index.html');
      return new Response('', { status: 503, statusText: 'Offline' });
    });
  }));
});