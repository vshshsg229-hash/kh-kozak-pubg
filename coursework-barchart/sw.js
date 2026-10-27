const CACHE_NAME="barchartapp-v2";
const APP_PREFIX="barchartapp-";
const FILES=["./","./index.html","./manifest.webmanifest","./icon.svg"];
self.addEventListener("install",event=>event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(FILES)).then(()=>self.skipWaiting())));
self.addEventListener("activate",event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith(APP_PREFIX)&&key!==CACHE_NAME).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener("fetch",event=>{
 if(event.request.method!=="GET")return;
 const url=new URL(event.request.url);
 if(url.origin!==self.location.origin)return;
 event.respondWith(caches.match(event.request).then(cached=>{
  if(cached)return cached;
  return fetch(event.request).then(response=>{
   if(response.ok)caches.open(CACHE_NAME).then(cache=>cache.put(event.request,response.clone()));
   return response;
  }).catch(()=>event.request.mode==="navigate"?caches.match("./index.html"):Response.error());
 }));
});
