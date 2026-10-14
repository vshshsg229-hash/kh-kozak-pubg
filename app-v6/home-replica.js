(()=>{'use strict';
const KEY='khkozak_hub_v6';
const $=s=>document.querySelector(s);
function stateRead(){try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch{return {}}}
function accountName(s){return String(s.name||window.khOnlineUser?.username||'KH么Kozak').trim()||'Гравець'}
function fighterSvg(){return `<svg xmlns="http://www.w3.org/2000/svg" width="520" height="760" viewBox="0 0 520 760">
<defs>
 <linearGradient id="uniform" x1="0" x2="1"><stop stop-color="#17231f"/><stop offset=".45" stop-color="#58634a"/><stop offset="1" stop-color="#202c27"/></linearGradient>
 <linearGradient id="armor" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#46544d"/><stop offset=".5" stop-color="#202a28"/><stop offset="1" stop-color="#101719"/></linearGradient>
 <linearGradient id="skin" x1="0" x2="1"><stop stop-color="#a87553"/><stop offset=".5" stop-color="#d0a07b"/><stop offset="1" stop-color="#80583f"/></linearGradient>
 <linearGradient id="helmet" x1="0" x2="1" y1="0" y2="1"><stop stop-color="#79806a"/><stop offset=".5" stop-color="#353f36"/><stop offset="1" stop-color="#151d1b"/></linearGradient>
 <linearGradient id="metal" x1="0" x2="1"><stop stop-color="#6d7776"/><stop offset=".4" stop-color="#20292d"/><stop offset="1" stop-color="#080d10"/></linearGradient>
 <filter id="shadow" x="-30%" y="-20%" width="160%" height="150%"><feGaussianBlur stdDeviation="12"/></filter>
</defs>
<ellipse cx="265" cy="715" rx="125" ry="20" fill="#000" opacity=".55" filter="url(#shadow)"/>
<!-- backpack -->
<path d="M151 246 Q114 249 111 298 L120 416 167 432 190 283Z" fill="#26372d" stroke="#0a1110" stroke-width="10"/>
<path d="M125 295 163 307 158 355 124 349Z" fill="#536049" stroke="#1a241e" stroke-width="7"/>
<path d="M130 368 162 374 158 402 129 397Z" fill="#18231e" stroke="#66705a" stroke-width="4"/>
<!-- legs -->
<path d="M185 421 265 424 259 567 237 653 183 653 193 552 164 474Z" fill="url(#uniform)" stroke="#0b1110" stroke-width="11" stroke-linejoin="round"/>
<path d="M267 423 334 421 354 540 344 648 291 653 288 555 253 474Z" fill="url(#uniform)" stroke="#0b1110" stroke-width="11" stroke-linejoin="round"/>
<path d="M184 639 239 640 250 677 232 694 163 694 154 682Z" fill="#111819" stroke="#606a60" stroke-width="7"/>
<path d="M292 638 345 637 366 675 352 694 285 694 278 680Z" fill="#111819" stroke="#606a60" stroke-width="7"/>
<path d="M190 484 256 492 250 520 187 512Z M272 489 337 481 344 508 278 520Z" fill="#151e1b" stroke="#77806b" stroke-width="5"/>
<path d="M192 546 245 551 239 567 190 564Z M294 548 345 541 348 560 295 568Z" fill="#303b32" stroke="#8a8d73" stroke-width="4"/>
<!-- torso -->
<path d="M183 235 224 213 293 213 339 240 364 364 329 438 184 438 152 360Z" fill="url(#uniform)" stroke="#0a1110" stroke-width="12" stroke-linejoin="round"/>
<path d="M213 230 258 255 305 230 329 367 305 419 211 419 187 367Z" fill="url(#armor)" stroke="#111817" stroke-width="8"/>
<path d="M205 270 314 270 321 300 198 300Z M202 316 319 316 322 346 198 346Z M207 362 312 362 305 390 211 390Z" fill="#151e1d" stroke="#657064" stroke-width="5"/>
<path d="M220 279h28v13h-28zM270 279h28v13h-28zM220 326h28v13h-28zM270 326h28v13h-28z" fill="#a27d37"/>
<path d="M242 229 258 248 274 229 284 253 258 274 231 253Z" fill="#8d9a82"/>
<!-- arms -->
<path d="M185 247 151 265 120 356 145 379 177 326 208 286Z" fill="url(#uniform)" stroke="#0a1110" stroke-width="11" stroke-linejoin="round"/>
<path d="M338 251 367 270 384 340 358 364 331 315 311 282Z" fill="url(#uniform)" stroke="#0a1110" stroke-width="11" stroke-linejoin="round"/>
<path d="M119 347 146 359 137 389 113 383 104 366Z M357 348 383 335 397 358 383 380 360 372Z" fill="#151d1b" stroke="#788273" stroke-width="6"/>
<!-- neck and face -->
<path d="M231 180 231 226 285 226 284 179Z" fill="url(#skin)" stroke="#111716" stroke-width="7"/>
<path d="M211 125 Q258 98 304 125 L296 187 277 211 240 211 219 186Z" fill="url(#skin)" stroke="#111716" stroke-width="8"/>
<path d="M218 159 240 169 258 165 279 169 298 157 291 186 276 200 241 199 224 185Z" fill="#302c28"/>
<path d="M224 151 247 148M270 148 293 151" stroke="#201d1a" stroke-width="8" stroke-linecap="round"/>
<path d="M231 156h14M272 156h14" stroke="#e2c4a3" stroke-width="4" stroke-linecap="round"/>
<path d="M255 158 249 177 263 179" fill="none" stroke="#7d4d36" stroke-width="5" stroke-linecap="round"/>
<!-- helmet -->
<path d="M196 140 Q184 64 258 57 Q333 63 320 140 L302 157 294 116 221 116 214 157Z" fill="url(#helmet)" stroke="#0b1211" stroke-width="10"/>
<path d="M193 132 Q258 113 323 132 L319 151 Q258 134 197 151Z" fill="#111a19" stroke="#9b9c7d" stroke-width="6"/>
<path d="M223 78 258 66 293 78" fill="none" stroke="#a5ad91" stroke-width="5"/>
<path d="M215 94 301 94" stroke="#27332b" stroke-width="9"/>
<path d="M206 113 310 113" stroke="#0c1312" stroke-width="7"/>
<!-- rifle held across body -->
<g transform="rotate(-12 280 330)" stroke-linejoin="round">
 <path d="M126 304 160 293 190 310 179 335 145 338Z" fill="#171d1e" stroke="#070b0d" stroke-width="8"/>
 <path d="M160 306 254 305 276 318 266 336 178 332Z" fill="url(#metal)" stroke="#070b0d" stroke-width="8"/>
 <path d="M250 306 354 310 354 322 269 322Z" fill="#20292b" stroke="#090d0f" stroke-width="6"/>
 <path d="M348 311 419 313 419 321 350 321Z" fill="#111719" stroke="#707a75" stroke-width="4"/>
 <path d="M193 331 218 332 228 374 208 380Z" fill="#141a1b" stroke="#747a70" stroke-width="5"/>
 <path d="M230 304 240 281 264 283 270 306Z" fill="#293236" stroke="#89908a" stroke-width="4"/>
 <path d="M286 305 298 305 300 318 286 318Z" fill="#d3b253"/>
 <path d="M170 303 185 303 188 329 175 330Z" fill="#3c4545"/>
 <path d="M126 310 110 307 105 315 125 322Z" fill="#89918a"/>
</g>
<!-- hands gripping rifle -->
<path d="M150 343 171 335 190 348 183 367 161 368Z M293 337 314 330 331 344 325 363 304 364Z" fill="url(#skin)" stroke="#141a18" stroke-width="6"/>
<!-- straps, buckles, pouches -->
<path d="M211 235 232 242 204 414 184 405Z M300 235 318 243 344 405 323 414Z" fill="#121918" stroke="#7c866f" stroke-width="4"/>
<path d="M179 384 211 384 210 415 179 415Z M281 386 315 386 316 417 282 417Z" fill="#344036" stroke="#8b947d" stroke-width="5"/>
<path d="M190 393h12v12h-12zM293 395h12v12h-12z" fill="#b08d42"/>
</svg>`}
function render(){const s=stateRead(),name=accountName(s),xp=Math.max(0,Number(s.xp)||0),level=Math.floor(xp/100)+1,within=xp%100,percent=within;
const put=(sel,val)=>{const el=$(sel);if(el)el.textContent=String(val)};
put('#khReplicaTopName',name);put('#khReplicaProfileName',name);put('#khReplicaQuoteName',name);put('#khReplicaLevel',level);put('#khReplicaXP',within+' / 100 XP');put('#khReplicaProgressText',xp+' / '+(level*100)+' XP');put('#khReplicaRankName',level>=50?'Елітний боєць':level>=30?'Ветеран':level>=15?'Боєць':level>=5?'Рекрут':'Новобранець');
const avatar=$('#khReplicaAvatar');if(avatar)avatar.textContent=(name.replace(/[^\p{L}\p{N}]/gu,'').slice(0,2)||'KH').toUpperCase();
const bio=$('#khReplicaBio');if(bio)bio.textContent=window.khOnlineUserId?'Гравець KH么Kozak · онлайн-акаунт':'Звичайний гравець.';
put('#khReplicaKD','—');put('#khReplicaWins',Number(s.games?.pubg)||0);put('#khReplicaTop1',Number(s.played)||0);put('#khReplicaRank',level>1?Math.max(1,100-(level%20)*4):'—');put('#khReplicaGems',Number(s.gems||s.diamonds)||0);
['#khReplicaXPBar','#khReplicaProgressBar'].forEach(sel=>{const el=$(sel);if(el)el.style.width=percent+'%'});
const progress=$('#khReplicaProgressBar');if(progress)progress.style.width=Math.min(100,xp%2000/20)+'%';
const root=$('#khHomeReplica'),slot=$('#khReplicaFighterSlot');
if(slot&&!slot.querySelector('.kh-real-soldier')){const soldier=document.createElement('img');soldier.className='kh-real-soldier';soldier.src='data:image/svg+xml;charset=UTF-8,'+encodeURIComponent(fighterSvg());soldier.alt='3D-стилізований боєць KH么Kozak';soldier.draggable=false;soldier.style.cssText='position:absolute;left:50%;bottom:9%;height:88%;width:auto;max-width:78%;object-fit:contain;transform:translateX(-50%);filter:drop-shadow(0 18px 22px #000b);';slot.appendChild(soldier);}
if(root){root.dataset.account=String(window.khOnlineUserId||'guest');}
}
function attach(){render();document.addEventListener('khkozak-profile-updated',render);document.addEventListener('khkozak-cosmetics-updated',render);window.addEventListener('storage',e=>{if(e.key===KEY)render()});const stage=$('#khReplicaFighterSlot');if(stage){let down=false,startX=0,rot=0;stage.addEventListener('pointerdown',e=>{down=true;startX=e.clientX;stage.setPointerCapture?.(e.pointerId)});stage.addEventListener('pointermove',e=>{if(!down)return;rot=Math.max(-13,Math.min(13,rot+(e.clientX-startX)*.18));startX=e.clientX;const img=stage.querySelector('.kh-real-soldier');if(img)img.style.transform='translateX(-50%) perspective(900px) rotateY('+rot+'deg)'});stage.addEventListener('pointerup',()=>down=false);stage.addEventListener('pointercancel',()=>down=false);}
document.addEventListener('click',e=>{if(e.target.closest('#khReplicaDaily'))$('#claimDaily')?.click();if(e.target.closest('#khReplicaMenu'))document.body.classList.toggle('sidebar-hidden')});}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',attach);else attach();
})();