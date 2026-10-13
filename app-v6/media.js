(()=>{'use strict';
const $=s=>document.querySelector(s);
const youtubeForm=$('#youtubeForm'),youtubeInput=$('#youtubeUrl'),youtubeWrap=$('#youtubeFrameWrap'),youtubeMessage=$('#youtubeMessage');
function playYouTube(raw){
 let u;try{u=new URL(raw.trim())}catch{u=null}
 if(!u||!['youtube.com','www.youtube.com','music.youtube.com','youtu.be','m.youtube.com'].includes(u.hostname.toLowerCase())){if(youtubeMessage)youtubeMessage.textContent='Встав коректне посилання YouTube на відео або плейлист.';return}
 const host=u.hostname.toLowerCase();
 const video=host==='youtu.be'?u.pathname.split('/').filter(Boolean)[0]:(u.searchParams.get('v')||'');
 const list=u.searchParams.get('list')||'';
 if(!video&&!list){if(youtubeMessage)youtubeMessage.textContent='У посиланні не знайдено відео або плейлист.';return}
 const params=new URLSearchParams();params.set('playsinline','1');params.set('rel','0');if(list)params.set('list',list);
 const src=video?'https://www.youtube-nocookie.com/embed/'+encodeURIComponent(video)+'?'+params.toString():'https://www.youtube-nocookie.com/embed/videoseries?'+params.toString();
 if(youtubeWrap)youtubeWrap.innerHTML='<iframe title="YouTube music player" src="'+src+'" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen loading="lazy"></iframe>';
 if(youtubeMessage)youtubeMessage.textContent='Плеєр завантажено. Натисни відтворення всередині відео.';
 try{localStorage.setItem('khkozak_youtube_url',raw.trim())}catch{}
}
youtubeForm?.addEventListener('submit',e=>{e.preventDefault();playYouTube(youtubeInput?.value||'')});
const tiktokForm=$('#tiktokForm'),tiktokInput=$('#tiktokUrl'),tiktokEmbed=$('#tiktokEmbed'),tiktokMessage=$('#tiktokMessage');
function loadTikTok(raw){
 let u;try{u=new URL(raw.trim())}catch{u=null}
 if(!u||!u.hostname.toLowerCase().endsWith('tiktok.com')){if(tiktokMessage)tiktokMessage.textContent='Встав посилання з TikTok.';return}
 const safeUrl=u.href;
 const videoPart=u.pathname.split('/video/')[1]||'';
 const videoId=videoPart.split('/')[0].split('?')[0];
 if(videoId&&/^[0-9]+$/.test(videoId)){
  if(tiktokEmbed)tiktokEmbed.innerHTML='<iframe title="TikTok video" src="https://www.tiktok.com/embed/v2/'+videoId+'" allow="encrypted-media; fullscreen; picture-in-picture" allowfullscreen loading="lazy"></iframe>';
  if(tiktokMessage)tiktokMessage.textContent='Відео завантажується через TikTok. Якщо вбудований перегляд недоступний, відкрий ролик за посиланням.';
 }else if(u.pathname.startsWith('/@')){
  if(tiktokEmbed)tiktokEmbed.innerHTML='<div class="media-empty"><span>♪</span><b>Профіль TikTok</b><a class="btn btn-yellow" href="'+safeUrl.replace(/&/g,'&amp;')+'" target="_blank" rel="noopener">ВІДКРИТИ ПРОФІЛЬ ↗</a></div>';
  if(tiktokMessage)tiktokMessage.textContent='Це посилання на профіль, а не окреме відео. Натисни кнопку, щоб відкрити профіль TikTok.';
 }else{if(tiktokMessage)tiktokMessage.textContent='Посилання не схоже на профіль або відео TikTok.';return}
 try{localStorage.setItem('khkozak_tiktok_url',safeUrl)}catch{}
}
tiktokForm?.addEventListener('submit',e=>{e.preventDefault();loadTikTok(tiktokInput?.value||'')});
try{if(youtubeInput)youtubeInput.value=localStorage.getItem('khkozak_youtube_url')||'';if(tiktokInput)tiktokInput.value=localStorage.getItem('khkozak_tiktok_url')||'https://www.tiktok.com/@baggy8364?_r=1&_t=ZS-99eA5MwIt6r'}catch{}
})();