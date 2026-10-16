(()=>{'use strict';
const form=document.getElementById('khYoutubeModeForm');
const input=document.getElementById('khYoutubeModeUrl');
const wrap=document.getElementById('khYoutubeModeFrameWrap');
const message=document.getElementById('khYoutubeModeMessage');
if(!form||!input||!wrap||!message)return;
const allowedHosts=new Set(['youtube.com','www.youtube.com','m.youtube.com','music.youtube.com','youtu.be','www.youtube-nocookie.com']);
function play(raw){
 let url;try{url=new URL(String(raw||'').trim())}catch{message.textContent='Встав коректне посилання на YouTube-відео або плейлист.';return false}
 const host=url.hostname.toLowerCase();
 if(!allowedHosts.has(host)){message.textContent='Підтримуються посилання youtube.com, youtu.be та YouTube Music.';return false}
 const video=host==='youtu.be'?url.pathname.split('/').filter(Boolean)[0]:(url.searchParams.get('v')||url.pathname.match(/\/(?:shorts|embed|live|v)\/([^/?]+)/)?.[1]||'');
 const list=url.searchParams.get('list')||'';
 if(video&&!/^[A-Za-z0-9_-]{6,}$/.test(video)){message.textContent='Не вдалося прочитати ID відео. Перевір посилання.';return false}
 if(!video&&!list){message.textContent='У посиланні не знайдено ID відео або плейлиста.';return false}
 const params=new URLSearchParams({playsinline:'1',rel:'0',autoplay:'1'});
 if(list)params.set('list',list);
 const src=video?'https://www.youtube-nocookie.com/embed/'+encodeURIComponent(video)+'?'+params.toString():'https://www.youtube-nocookie.com/embed/videoseries?'+params.toString();
 const frame=document.createElement('iframe');
 frame.title='YouTube player inside KH Kozak Battle Hub';
 frame.src=src;frame.allow='autoplay; encrypted-media; picture-in-picture; web-share';frame.allowFullscreen=true;frame.referrerPolicy='strict-origin-when-cross-origin';
 wrap.replaceChildren(frame);
 input.value=String(raw).trim();
 message.textContent=list&&!video?'Плейлист завантажено у вбудований плеєр. Натисни ▶, якщо відтворення не почалося.':'Відео завантажено у вбудований плеєр. Натисни ▶, якщо відтворення не почалося.';
 try{localStorage.setItem('khkozak_youtube_mode_last_url',input.value)}catch{}
 return true;
}
form.addEventListener('submit',event=>{event.preventDefault();play(input.value)});
document.querySelectorAll('[data-kh-yt-url]').forEach(button=>button.addEventListener('click',()=>play(button.getAttribute('data-kh-yt-url'))));
try{const saved=localStorage.getItem('khkozak_youtube_mode_last_url');if(saved)input.value=saved}catch{}
})();