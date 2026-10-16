(()=>{'use strict';
const form=document.getElementById('khYoutubeModeForm');
const directInput=document.getElementById('khYoutubeModeUrl');
const searchForm=document.getElementById('khYoutubeSearchForm');
const queryInput=document.getElementById('khYoutubeSearchQuery');
const results=document.getElementById('khYoutubeSearchResults');
const wrap=document.getElementById('khYoutubeModeFrameWrap');
const message=document.getElementById('khYoutubeModeMessage');
if(!form||!directInput||!searchForm||!queryInput||!results||!wrap||!message)return;
const allowedHosts=new Set(['youtube.com','www.youtube.com','m.youtube.com','music.youtube.com','youtu.be','www.youtube-nocookie.com']);
const searchProviders=[
 q=>'https://inv.nadeko.net/api/v1/search?q='+encodeURIComponent(q)+'&type=video',
 q=>'https://invidious.nerdvpn.de/api/v1/search?q='+encodeURIComponent(q)+'&type=video',
 q=>'https://inv.tux.pizza/api/v1/search?q='+encodeURIComponent(q)+'&type=video',
 q=>'https://pipedapi.adminforge.de/search?q='+encodeURIComponent(q)+'&filter=videos'
];
let searchSequence=0;
function text(el,value){el.textContent=String(value||'')}
function play(raw,title){
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
 const frame=document.createElement('iframe');frame.title=title||'YouTube player inside KH Kozak Battle Hub';frame.src=src;frame.allow='autoplay; encrypted-media; picture-in-picture; web-share';frame.allowFullscreen=true;frame.referrerPolicy='strict-origin-when-cross-origin';
 wrap.replaceChildren(frame);directInput.value=String(raw).trim();
 message.textContent='Завантажив у вбудований плеєр. Натисни ▶, якщо відтворення не почалося.';
 try{localStorage.setItem('khkozak_youtube_mode_last_url',directInput.value)}catch{}
 return true;
}
function videoId(item){
 const direct=item?.videoId;
 if(typeof direct==='string'&&/^[A-Za-z0-9_-]{6,}$/.test(direct))return direct;
 const url=String(item?.url||item?.id||'');
 const fromUrl=url.match(/(?:v=|youtu\\.be\\/|\\/watch\\/)([A-Za-z0-9_-]{6,})/)?.[1];
 if(fromUrl)return fromUrl;
 const id=item?.id;
 return typeof id==='string'&&/^[A-Za-z0-9_-]{6,}$/.test(id)?id:'';
}
function thumbnail(item,id){
 const t=item?.videoThumbnails?.find?.(x=>x?.quality==='medium')?.url||item?.thumbnail||item?.thumbnailUrl||item?.thumbnails?.[0]?.url;
 if(typeof t==='string'&&/^https:\/\//.test(t))return t;
 return id?'https://i.ytimg.com/vi/'+encodeURIComponent(id)+'/mqdefault.jpg':'';
}
function makeCard(item,provider){
 const id=videoId(item);if(!id)return null;
 const card=document.createElement('button');card.type='button';card.className='youtube-mode-result';card.setAttribute('aria-label','Відтворити '+(item.title||'відео'));
 const img=document.createElement('img');img.loading='lazy';img.alt='';img.src=thumbnail(item,id);img.onerror=()=>{img.style.visibility='hidden'};
 const copy=document.createElement('span');copy.className='youtube-mode-result-copy';
 const title=document.createElement('b');text(title,item.title||'YouTube video');
 const author=document.createElement('small');text(author,item.author||item.uploaderName||item.channelName||'YouTube');
 const meta=document.createElement('small');text(meta,item.viewCountText||item.duration||'Відео');
 copy.append(title,author,meta);card.append(img,copy);
 card.addEventListener('click',()=>{play('https://www.youtube.com/watch?v='+encodeURIComponent(id),item.title||'YouTube video');wrap.scrollIntoView?.({behavior:'smooth',block:'nearest'})});
 return card;
}
async function search(query){
 const seq=++searchSequence;const q=String(query||'').trim();if(q.length<2){message.textContent='Введи щонайменше 2 символи для пошуку.';return}
 results.replaceChildren();message.textContent='Шукаю відео: “'+q+'”…';
 const errors=[];
 for(const endpoint of searchProviders){
  if(seq!==searchSequence)return;
  try{
   const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),6500);
   let response;try{response=await fetch(endpoint(q),{signal:controller.signal,headers:{Accept:'application/json'}})}finally{clearTimeout(timeout)}
   if(!response.ok)throw new Error('HTTP '+response.status);
   const data=await response.json();const items=Array.isArray(data)?data:(data.items||data.relatedStreams||[]);
   const cards=items.slice(0,18).map(item=>makeCard(item)).filter(Boolean);
   if(!cards.length)throw new Error('No video results');
   results.replaceChildren(...cards);message.textContent='Знайдено '+cards.length+' відео за запитом “'+q+'”. Натисни результат для перегляду в плеєрі нижче.';return;
  }catch(e){errors.push(e?.message||'search error')}
 }
 if(seq!==searchSequence)return;
 const fallback=document.createElement('a');fallback.className='youtube-mode-search-fallback';fallback.href='https://www.youtube.com/results?search_query='+encodeURIComponent(q);fallback.target='_blank';fallback.rel='noopener noreferrer';fallback.textContent='Відкрити результати пошуку на YouTube ↗';
 const note=document.createElement('p');note.className='youtube-mode-search-note';text(note,'Зараз публічні пошукові джерела недоступні в цьому браузері. Спробуй ще раз або відкрий пошук YouTube.');
 results.replaceChildren(note,fallback);message.textContent='Не вдалося отримати результати всередині додатка.';
}
searchForm.addEventListener('submit',event=>{event.preventDefault();search(queryInput.value)});
form.addEventListener('submit',event=>{event.preventDefault();play(directInput.value)});
document.querySelectorAll('[data-kh-yt-url]').forEach(button=>button.addEventListener('click',()=>play(button.getAttribute('data-kh-yt-url'))));
try{const saved=localStorage.getItem('khkozak_youtube_mode_last_url');if(saved)directInput.value=saved}catch{}
})();