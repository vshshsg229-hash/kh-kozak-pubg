(()=>{'use strict';
const $=s=>document.querySelector(s);
const form=$('#khTikTokVideoForm'),input=$('#khTikTokVideoUrl'),player=$('#khTikTokVideoPlayer'),status=$('#khTikTokVideoStatus');
const tab=$('#tab-tiktok');
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
 refreshEmbeds(true);
}
form?.addEventListener('submit',event=>{event.preventDefault();playVideo(input?.value||'')});
document.addEventListener('click',event=>{
 const trigger=event.target.closest('[data-tab="tiktok"]');
 if(trigger){window.setTimeout(()=>refreshEmbeds(true),160)}
});
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&isTikTokTabVisible())refreshEmbeds()});
window.addEventListener('pageshow',()=>{if(isTikTokTabVisible())refreshEmbeds()});
window.khTikTokPlayVideo=playVideo;
})();