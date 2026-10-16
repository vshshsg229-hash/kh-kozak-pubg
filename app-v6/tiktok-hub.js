(()=>{'use strict';
const $=s=>document.querySelector(s);
const form=$('#khTikTokVideoForm'),input=$('#khTikTokVideoUrl'),player=$('#khTikTokVideoPlayer'),status=$('#khTikTokVideoStatus');
const tab=$('#tab-tiktok');
const WATCH_KEY='khkozak_tiktok_watchlist_v1';
const readWatch=()=>{try{const v=JSON.parse(localStorage.getItem(WATCH_KEY)||'[]');return Array.isArray(v)?v:[]}catch{return []}};
const writeWatch=v=>{try{localStorage.setItem(WATCH_KEY,JSON.stringify(v));return true}catch{return false}};
function renderWatch(){const host=$('#khTikTokSavedList'),count=$('#khTikTokSavedCount');if(!host)return;const list=readWatch();if(count)count.textContent=list.length+' збережено';host.innerHTML=list.length?list.map((v,i)=>'<article style="display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;padding:10px;border:1px solid #293b50;border-radius:8px;background:#101b29"><span style="font-size:12px">♪ @'+safeText(v.user)+' · '+safeText(v.id.slice(-7))+'</span><span style="display:flex;gap:7px"><button type="button" data-khtt-play="'+i+'">▶ ВІДКРИТИ</button><button type="button" data-khtt-remove="'+i+'">ВИДАЛИТИ</button></span></article>').join(''):'<p style="margin:0;color:#9eb3cc;font-size:12px">Тут з’являться збережені відео.</p>';}
let lastEmbedRefresh=0;
function safeText(value){return String(value).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));}
function isTikTokTabVisible(){return !!tab&&!tab.hidden&&getComputedStyle(tab).display!=='none';}
function refreshEmbeds(force=false){
 if(!tab)return;
 const now=Date.now();
 if(!force&&now-lastEmbedRefresh<2500)return;
 lastEmbedRefresh=now;
 if(window.tiktokEmbed&&typeof window.tiktokEmbed.load==='function'){
  try{window.tiktokEmbed.load();return}catch{}
 }
 const old=document.querySelector('script[data-kh-tiktok-embed]');
 const script=document.createElement('script');
 script.async=true;script.src='https://www.tiktok.com/embed.js';script.dataset.khTiktokEmbed='1';
 script.onload=()=>{script.dataset.khLoaded='1';try{window.tiktokEmbed?.load?.()}catch{}};
 if(old)old.replaceWith(script);else document.body.appendChild(script);
}
function parseVideo(raw){
 let url;try{url=new URL(String(raw||'').trim())}catch{return null}
 if(url.protocol!=='https:'||!(url.hostname==='tiktok.com'||url.hostname.endsWith('.tiktok.com')))return null;
 const match=url.pathname.match(/^\/@([A-Za-z0-9._-]+)\/video\/(\d+)/i);
 if(!match)return null;
 return {url:'https://www.tiktok.com/@'+match[1]+'/video/'+match[2],user:match[1],id:match[2]};
}
function playVideo(raw){
 const video=parseVideo(raw);
 if(!video){if(status)status.textContent='Посилання не розпізнано. Встав повний URL виду https://www.tiktok.com/@username/video/123456789…';return}
 if(player)player.innerHTML='<blockquote class="tiktok-embed kh-tiktok-single-embed" cite="'+safeText(video.url)+'" data-video-id="'+safeText(video.id)+'" style="max-width:605px;min-width:288px"><section><a target="_blank" rel="noopener noreferrer" href="'+safeText(video.url)+'">@'+safeText(video.user)+' · Відкрити оригінал ↗</a></section></blockquote>';
 if(input)input.value=video.url;
 if(status)status.textContent='Відео додано до плеєра. Якщо TikTok дозволяє вбудовування, натисни ▶ у відео нижче.';
 let saveButton=$('#khTikTokSaveCurrent');if(!saveButton&&player){saveButton=document.createElement('button');saveButton.type='button';saveButton.id='khTikTokSaveCurrent';saveButton.textContent='★ ЗБЕРЕГТИ В ДОБІРКУ';saveButton.style.cssText='margin:10px 0;padding:10px 14px;border:1px solid #f2c94c;border-radius:8px;background:#182334;color:#f2c94c;font-weight:800';player.prepend(saveButton)}if(saveButton){saveButton.dataset.url=video.url;saveButton.dataset.user=video.user;saveButton.dataset.id=video.id;}
 refreshEmbeds(true);
}
form?.addEventListener('submit',event=>{event.preventDefault();playVideo(input?.value||'')});
document.addEventListener('click',event=>{const save=event.target.closest('#khTikTokSaveCurrent');if(save){const v={url:save.dataset.url,user:save.dataset.user,id:save.dataset.id};if(!v.url)return;const list=readWatch();if(list.some(x=>x.id===v.id)){if(status)status.textContent='Це відео вже є у твоїй добірці.';return}list.unshift(v);if(!writeWatch(list.slice(0,50))){if(status)status.textContent='Не вдалося зберегти посилання. Перевір пам’ять пристрою.';return}renderWatch();if(status)status.textContent='Відео збережено у твоїй добірці.';return}const play=event.target.closest('[data-khtt-play]');if(play){const v=readWatch()[Number(play.dataset.khttPlay)];if(v)playVideo(v.url);return}const remove=event.target.closest('[data-khtt-remove]');if(remove){const list=readWatch();list.splice(Number(remove.dataset.khttRemove),1);writeWatch(list);renderWatch()}});
document.addEventListener('click',event=>{
 const trigger=event.target.closest('[data-tab="tiktok"]');
 if(trigger){window.setTimeout(()=>refreshEmbeds(true),160)}
});
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&isTikTokTabVisible())refreshEmbeds()});
window.addEventListener('pageshow',()=>{if(isTikTokTabVisible())refreshEmbeds()});
window.khTikTokPlayVideo=playVideo;
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',renderWatch,{once:true});else renderWatch();
})();