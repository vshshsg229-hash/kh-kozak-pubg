/* KOZAK NEXUS · shared foundation API
   Non-destructive utilities for the gradual module migration. */
(()=>{'use strict';
if(window.KozakNexus)return;
const VERSION='1.0.0';
const listeners=new Map();
const safeRead=(key,fallback=null)=>{try{const raw=localStorage.getItem(key);return raw===null?fallback:JSON.parse(raw)}catch(_){return fallback}};
const safeWrite=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value));return true}catch(_){return false}};
const emit=(name,detail={})=>{window.dispatchEvent(new CustomEvent('kozak:nexus:'+name,{detail}));(listeners.get(name)||[]).forEach(fn=>{try{fn(detail)}catch(error){console.error('[NEXUS]',error)}})};
const api=Object.freeze({
 version:VERSION,
 profileKey:'khkozak_hub_v6',
 read:safeRead,
 write:safeWrite,
 on(name,callback){if(typeof callback!=='function')return()=>{};const group=listeners.get(name)||new Set();group.add(callback);listeners.set(name,group);return()=>group.delete(callback)},
 emit,
 getProfile(){return safeRead('khkozak_hub_v6',{})||{}},
 getRoot(){return document.querySelector('.app-shell')||document.body}
});
Object.defineProperty(window,'KozakNexus',{value:api,configurable:false,writable:false});
document.documentElement.dataset.kozakNexus='ready';
document.dispatchEvent(new CustomEvent('kozak:nexus:ready',{detail:{version:VERSION}}));
})();
