const CACHE_NAME="barchartapp-v3";
const APP_PREFIX="barchartapp-";
const FILES=["./","./index.html","./manifest.webmanifest","./icon.svg"];
self.addEventListener("install",event=>event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(FILES)).then(()=>self.skipWaiting())));
self.addEventListener("activate",event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith(APP_PREFIX)&&key!==CACHE_NAME).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener("fetch",event=>{
 if(event.request.method!=="GET")return;
 const url=new URL(event.request.url);
 if(url.origin!==self.location.origin)return;
 const isPage=event.request.mode==="navigate"||url.pathname.endsWith("/index.html")||url.pathname.endsWith("/manifest.webmanifest")||url.pathname.endsWith("/sw.js");
 event.respondWith((async()=>{
  if(isPage){
   try{
    const response=await fetch(event.request,{cache:"no-store"});
    if(response.ok){const cache=await caches.open(CACHE_NAME);await cache.put(event.request,response.clone());}
    return response;
   }catch(error){
    const cached=await caches.match(event.request)||await caches.match("./index.html");
    if(cached)return cached;
    return Response.error();
   }
  }
  const cached=await caches.match(event.request);
  if(cached)return cached;
  try{
   const response=await fetch(event.request);
   if(response.ok)(await caches.open(CACHE_NAME)).put(event.request,response.clone());
   return response;
  }catch(error){return Response.error();}
 })());
});
