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
 q=>'https://pipedapi.adminforge.de/search?q='+encodeURIComponent(q)+'&filter=videos',
 q=>'https://pipedapi.kavin.rocks/search?q='+encodeURIComponent(q)+'&filter=videos'
];
let searchSequence=0,queue=[],currentIndex=-1,player=null,playerReady=false,pending=null,apiPromise=null,autoNext=true,loopQueue=false;\nlet officialKey='';
const text=(el,value)=>{el.textContent=String(value||'')};
function setMessage(value){message.textContent=value}
function ensureOfficialSearchSettings(){\n let details=document.getElementById('khYoutubeOfficialSearchSettings');if(details)return;\n details=document.createElement('details');details.id='khYoutubeOfficialSearchSettings';details.className='youtube-mode-direct';\n const summary=document.createElement('summary');summary.textContent='⚙️ Офіційний пошук YouTube (необов’язково)';\n const row=document.createElement('div');row.className='youtube-mode-input-row';row.style.marginTop='10px';\n const input=document.createElement('input');input.type='password';input.autocomplete='off';input.placeholder='YouTube Data API key';input.setAttribute('aria-label','YouTube Data API key');\n const save=document.createElement('button');save.type='button';save.textContent='Застосувати ключ';\n const note=document.createElement('p');note.className='youtube-mode-search-note';note.textContent='Для офіційного пошуку потрібен власний ключ YouTube Data API v3 з Google Cloud. Ключ зберігається лише в пам’яті цієї вкладки й не надсилається нам.';\n save.addEventListener('click',()=>{officialKey=input.value.trim();setMessage(officialKey?'Офіційний пошук YouTube увімкнено для цієї сесії.':'Ключ очищено; використовуються публічні пошукові джерела.');});\n row.append(input,save);details.append(summary,row,note);searchForm.insertAdjacentElement('afterend',details);\n}\nfunction ensureControls(){
 let bar=document.getElementById('khYoutubePlaybackControls');
 if(bar)return bar;
 bar=document.createElement('div');bar.id='khYoutubePlaybackControls';bar.className='youtube-mode-playback-controls';
 const prev=document.createElement('button');prev.type='button';prev.textContent='⏮ Попереднє';prev.addEventListener('click',()=>playIndex(currentIndex-1,true));
 const next=document.createElement('button');next.type='button';next.textContent='Наступне ⏭';next.addEventListener('click',()=>playIndex(currentIndex+1,true));
 const autoLabel=document.createElement('label');const auto=document.createElement('input');auto.type='checkbox';auto.checked=true;auto.addEventListener('change',()=>{autoNext=auto.checked});autoLabel.append(auto,document.createTextNode(' Автоперехід'));
 const loopLabel=document.createElement('label');const loop=document.createElement('input');loop.type='checkbox';loop.addEventListener('change',()=>{loopQueue=loop.checked});loopLabel.append(loop,document.createTextNode(' Повтор черги'));
 bar.append(prev,next,autoLabel,loopLabel);wrap.insertAdjacentElement('afterend',bar);return bar;
}
function ensureApi(){
 if(window.YT&&window.YT.Player)return Promise.resolve();
 if(apiPromise)return apiPromise;
 apiPromise=new Promise((resolve,reject)=>{
  const previous=window.onYouTubeIframeAPIReady;
  window.onYouTubeIframeAPIReady=()=>{try{if(typeof previous==='function')previous()}catch{}resolve()};
  let script=document.querySelector('script[data-kh-youtube-iframe-api]');
  if(!script){script=document.createElement('script');script.src='https://www.youtube.com/iframe_api';script.async=true;script.dataset.khYoutubeIframeApi='1';script.onerror=()=>reject(new Error('YouTube player API не завантажився'));document.head.appendChild(script)}
  const timeout=setTimeout(()=>reject(new Error('YouTube player API довго не відповідає')),12000);
  apiPromise.then(()=>clearTimeout(timeout)).catch(()=>clearTimeout(timeout));
 });
 return apiPromise;
}
async function ensurePlayer(videoId){
 pending={videoId};
 await ensureApi();
 if(!player){
  wrap.replaceChildren();const mount=document.createElement('div');mount.id='khYoutubePlayer';mount.style.width='100%';mount.style.height='100%';wrap.appendChild(mount);
  player=new YT.Player(mount,{width:'100%',height:'100%',videoId:videoId||'M7lc1UVf-VE',playerVars:{playsinline:1,rel:0,autoplay:1,enablejsapi:1,origin:location.origin},events:{
   onReady:event=>{playerReady=true;if(pending?.videoId)event.target.loadVideoById(pending.videoId);else event.target.pauseVideo()},
   onStateChange:event=>{if(event.data===YT.PlayerState.ENDED)advanceAfterEnd();},
   onError:()=>{setMessage('Це відео не дозволяє вбудоване відтворення або недоступне. Перемикаю на наступне…');setTimeout(()=>playIndex(currentIndex+1,true),500)}
  }});
 }else if(playerReady&&videoId){player.loadVideoById(videoId)}
}
function advanceAfterEnd(){if(!autoNext)return;let next=currentIndex+1;if(next>=queue.length){if(loopQueue)next=0;else{setMessage('Черга завершена. Увімкни «Повтор черги» або вибери інше відео.');return}}playIndex(next,true)}
function videoId(item){
 const direct=item?.videoId;
 if(typeof direct==='string'&&/^[A-Za-z0-9_-]{6,}$/.test(direct))return direct;
 const raw=String(item?.url||item?.id||'');
 let match=raw.match(/[?&]v=([A-Za-z0-9_-]{6,})/)||raw.match(/youtu\.be\/([A-Za-z0-9_-]{6,})/)||raw.match(/\/watch\/([A-Za-z0-9_-]{6,})/)||raw.match(/\/embed\/([A-Za-z0-9_-]{6,})/);
 if(match)return match[1];
 const id=item?.id;
 return typeof id==='string'&&/^[A-Za-z0-9_-]{6,}$/.test(id)?id:'';
}
function thumbnail(item,id){
 const t=item?.videoThumbnails?.find?.(x=>x?.quality==='medium')?.url||item?.thumbnail||item?.thumbnailUrl||item?.thumbnails?.[0]?.url;
 if(typeof t==='string'&&/^https?:\/\//.test(t))return t;
 return id?'https://i.ytimg.com/vi/'+encodeURIComponent(id)+'/mqdefault.jpg':'';
}
function playIndex(index,fromUser=false){
 if(!queue.length)return;
 if(index<0)index=loopQueue?queue.length-1:0;
 if(index>=queue.length){if(loopQueue)index=0;else{setMessage('Кінець результатів. Увімкни «Повтор черги» або вибери інше відео.');return}}
 currentIndex=index;const item=queue[index];const id=videoId(item);if(!id)return;
 results.querySelectorAll('.youtube-mode-result').forEach((el,i)=>el.classList.toggle('is-playing',i===index));
 const title=item.title||'YouTube video';
 setMessage('▶ Відтворюється '+title+' · '+(index+1)+'/'+queue.length);
 wrap.scrollIntoView?.({behavior:'smooth',block:'nearest'});
 ensurePlayer(id).catch(()=>{setMessage('Не вдалося завантажити плеєр YouTube. Перевір інтернет і спробуй ще раз.');});
}
function makeCard(item,index){
 const id=videoId(item);if(!id)return null;
 const card=document.createElement('button');card.type='button';card.className='youtube-mode-result';card.setAttribute('aria-label','Відтворити '+(item.title||'відео'));
 const img=document.createElement('img');img.loading='lazy';img.alt='';img.src=thumbnail(item,id);img.onerror=()=>{img.style.visibility='hidden'};
 const copy=document.createElement('span');copy.className='youtube-mode-result-copy';
 const title=document.createElement('b');text(title,item.title||'YouTube video');
 const author=document.createElement('small');text(author,item.author||item.uploaderName||item.channelName||'YouTube');
 const meta=document.createElement('small');text(meta,item.viewCountText||item.duration||'Відео');
 copy.append(title,author,meta);card.append(img,copy);
 card.addEventListener('click',()=>playIndex(index,true));return card;
}
function normalizeResults(data){
 const items=Array.isArray(data)?data:(data?.items||data?.relatedStreams||data?.results||[]);
 return items.map(item=>{
  if(item.videoId)return item;
  const raw=String(item.url||item.id||'');
  const id=videoId(item);if(!id)return null;
  return {...item,videoId:id,url:raw};
 }).filter(item=>videoId(item));
}
async function requestProvider(endpoint,q){
 const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),5500);
 try{const response=await fetch(endpoint(q),{signal:controller.signal,headers:{Accept:'application/json'}});if(!response.ok)throw new Error('HTTP '+response.status);return await response.json()}finally{clearTimeout(timeout)}
}
async function searchOfficial(q,seq){\n const url=new URL('https://www.googleapis.com/youtube/v3/search');url.search=new URLSearchParams({part:'snippet',type:'video',maxResults:'24',q,videoEmbeddable:'true',key:officialKey}).toString();\n const response=await fetch(url.toString());const data=await response.json();if(!response.ok)throw new Error(data?.error?.message||'YouTube API error');if(seq!==searchSequence)return true;\n queue=(data.items||[]).map(item=>({videoId:item.id?.videoId,title:item.snippet?.title,author:item.snippet?.channelTitle,publishedAt:item.snippet?.publishedAt,thumbnail:item.snippet?.thumbnails?.medium?.url||item.snippet?.thumbnails?.default?.url})).filter(item=>videoId(item));\n if(!queue.length)throw new Error('YouTube не повернув відео для цього запиту');\n results.replaceChildren(...queue.map((item,index)=>makeCard(item,index)).filter(Boolean));ensureControls();setMessage('Офіційний YouTube: знайдено '+queue.length+' відео. Автоперехід увімкнено.');return true;\n}\nasync function search(query){
 const seq=++searchSequence,q=String(query||'').trim();if(q.length<2){setMessage('Введи щонайменше 2 символи для пошуку.');return}
 results.replaceChildren();queue=[];currentIndex=-1;setMessage('Шукаю на YouTube: “'+q+'”…');
 const jobs=searchProviders.map(endpoint=>requestProvider(endpoint,q).then(data=>({data})).catch(error=>({error})));
 for(const job of jobs){
  const result=await job;if(seq!==searchSequence)return;if(result.error)continue;
  const items=normalizeResults(result.data);if(!items.length)continue;
  queue=items.slice(0,24);results.replaceChildren(...queue.map((item,index)=>makeCard(item,index)).filter(Boolean));
  if(!results.childElementCount)continue;
  ensureControls();setMessage('Знайдено '+queue.length+' відео за запитом “'+q+'”. Натисни картку — відео запуститься в плеєрі та автоматично перейде до наступного.');
  return;
 }
 if(seq!==searchSequence)return;
 const fallback=document.createElement('a');fallback.className='youtube-mode-search-fallback';fallback.href='https://www.youtube.com/results?search_query='+encodeURIComponent(q);fallback.target='_blank';fallback.rel='noopener noreferrer';fallback.textContent='Відкрити пошук YouTube ↗';
 const note=document.createElement('p');note.className='youtube-mode-search-note';text(note,'Пошукові сервери не відповідають або блокуються мережею. Для офіційного пошуку YouTube потрібен YouTube Data API key; відкрий пошук YouTube, якщо джерела тимчасово недоступні.');
 results.replaceChildren(note,fallback);setMessage('Не вдалося отримати відео всередині додатка. Спробуй ще раз.');
}
function play(raw,title){
 let url;try{url=new URL(String(raw||'').trim())}catch{setMessage('Встав коректне посилання на YouTube-відео або плейлист.');return false}
 const host=url.hostname.toLowerCase();if(!allowedHosts.has(host)){setMessage('Підтримуються посилання youtube.com, youtu.be та YouTube Music.');return false}
 const video=host==='youtu.be'?url.pathname.split('/').filter(Boolean)[0]:(url.searchParams.get('v')||url.pathname.match(/\/(?:shorts|embed|live|v)\/([^/?]+)/)?.[1]||'');
 const list=url.searchParams.get('list')||'';
 if(video&&!/^[A-Za-z0-9_-]{6,}$/.test(video)){setMessage('Не вдалося прочитати ID відео. Перевір посилання.');return false}
 if(!video&&!list){setMessage('У посиланні не знайдено ID відео або плейлиста.');return false}
 queue=[];currentIndex=-1;
 if(video){queue=[{videoId:video,title:title||'YouTube video',url:'https://www.youtube.com/watch?v='+video}];currentIndex=0;ensurePlayer(video).catch(()=>setMessage('Не вдалося завантажити плеєр YouTube.'))}
 else{ensureApi().then(()=>{if(!player){wrap.replaceChildren();const mount=document.createElement('div');mount.id='khYoutubePlayer';mount.style.width='100%';mount.style.height='100%';wrap.appendChild(mount);player=new YT.Player(mount,{width:'100%',height:'100%',playerVars:{playsinline:1,rel:0,autoplay:1,loop:1,playlist:list,enablejsapi:1,origin:location.origin},events:{onReady:e=>{playerReady=true;e.target.loadPlaylist({listType:'playlist',list});},onStateChange:e=>{if(e.data===YT.PlayerState.ENDED&&autoNext)e.target.nextVideo()}}})}else player.loadPlaylist({listType:'playlist',list})}).catch(()=>setMessage('Не вдалося завантажити YouTube плеєр.'))}
 directInput.value=String(raw).trim();setMessage('Завантажую у вбудований YouTube-плеєр…');try{localStorage.setItem('khkozak_youtube_mode_last_url',directInput.value)}catch{}return true;
}
searchForm.addEventListener('submit',event=>{event.preventDefault();search(queryInput.value)});
form.addEventListener('submit',event=>{event.preventDefault();play(directInput.value)});
document.querySelectorAll('[data-kh-yt-url]').forEach(button=>button.addEventListener('click',()=>play(button.getAttribute('data-kh-yt-url'))));
try{const saved=localStorage.getItem('khkozak_youtube_mode_last_url');if(saved)directInput.value=saved}catch{}
})();