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
 if(!u||!/(^|\\.)tiktok\\.com$/.test(u.hostname.toLowerCase())||!u.pathname.includes('/video/')){if(tiktokMessage)tiktokMessage.textContent='Встав повне посилання саме на відео TikTok (воно містить /video/).';return}
 const safeUrl=u.href,match=u.pathname.match(/video\\/(\\d+)/),videoId=match?match[1]:'';
 if(tiktokEmbed)tiktokEmbed.innerHTML='<iframe title="TikTok video" src="https://www.tiktok.com/embed/v2/'+videoId+'" allow="encrypted-media; fullscreen; picture-in-picture" allowfullscreen loading="lazy"></iframe>';
 if(tiktokMessage)tiktokMessage.textContent='Відео завантажується через TikTok. Якщо вбудований перегляд недоступний, відкрий ролик за посиланням.';
 try{localStorage.setItem('khkozak_tiktok_url',safeUrl)}catch{}
}
tiktokForm?.addEventListener('submit',e=>{e.preventDefault();loadTikTok(tiktokInput?.value||'')});
try{if(youtubeInput)youtubeInput.value=localStorage.getItem('khkozak_youtube_url')||'';if(tiktokInput)tiktokInput.value=localStorage.getItem('khkozak_tiktok_url')||''}catch{}
})();