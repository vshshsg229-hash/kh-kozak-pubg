(()=>{'use strict';
const $=s=>document.querySelector(s);
const youtubeForm=$('#youtubeForm'),youtubeInput=$('#youtubeUrl'),youtubeWrap=$('#youtubeFrameWrap'),youtubeMessage=$('#youtubeMessage');
function playYouTube(raw){
 let u;try{u=new URL(raw.trim())}catch{u=null}
 if(!u||!['youtube.com','www.youtube.com','music.youtube.com','youtu.be','m.youtube.com','www.youtube-nocookie.com'].includes(u.hostname.toLowerCase())){if(youtubeMessage)youtubeMessage.textContent='Встав коректне посилання YouTube на відео або плейлист.';return false}
 const host=u.hostname.toLowerCase();
 const video=host==='youtu.be'?u.pathname.split('/').filter(Boolean)[0]:(u.searchParams.get('v')||'');
 const list=u.searchParams.get('list')||'';
 if(!video&&!list){if(youtubeMessage)youtubeMessage.textContent='У посиланні не знайдено відео або плейлист.';return false}
 const params=new URLSearchParams();params.set('playsinline','1');params.set('rel','0');params.set('autoplay','1');params.set('controls','1');if(list)params.set('list',list);
 const src=video?'https://www.youtube-nocookie.com/embed/'+encodeURIComponent(video)+'?'+params.toString():'https://www.youtube-nocookie.com/embed/videoseries?'+params.toString();
 if(youtubeWrap)youtubeWrap.innerHTML='<iframe title="YouTube music player" src="'+src+'" referrerpolicy="strict-origin-when-cross-origin" allow="autoplay; encrypted-media; picture-in-picture; web-share" allowfullscreen loading="lazy"></iframe>';
 if(youtubeMessage)youtubeMessage.textContent='Плеєр завантажено. Натисни ▶ у відео. Якщо відтворення заблоковане, відкрий трек на YouTube.';
 try{localStorage.setItem('khkozak_youtube_url',raw.trim())}catch{}
 return true;
}
youtubeForm?.addEventListener('submit',e=>{e.preventDefault();playYouTube(youtubeInput?.value||'')});
const tiktokForm=$('#tiktokForm'),tiktokInput=$('#tiktokUrl'),tiktokEmbed=$('#tiktokEmbed'),tiktokMessage=$('#tiktokMessage');
const PROFILE_URL='https://www.tiktok.com/@khkozak4';
const tiktokSavedList=$('#tiktokSavedList');
function safeTikTokUrl(raw){
 let u;try{u=new URL((raw||'').trim())}catch{return null}
 if(!/^https?:$/.test(u.protocol)||!/(^|\.)tiktok\.com$/i.test(u.hostname))return null;
 return u;
}
function getTikTokVideoId(u){
 const m=u.pathname.match(/\/video\/(\d+)/);
 return m?m[1]:'';
}
function getSavedTikTok(){
 try{const a=JSON.parse(localStorage.getItem('khkozak_tiktok_videos')||'[]');return Array.isArray(a)?a.filter(x=>typeof x==='string'&&safeTikTokUrl(x)).slice(0,8):[]}catch{return []}
}
function renderSavedTikTok(){
 if(!tiktokSavedList)return;
 tiktokSavedList.innerHTML='';
 const saved=getSavedTikTok();
 if(!saved.length){const empty=document.createElement('div');empty.className='media-empty';empty.innerHTML='<span>♪</span><b>Тут будуть твої ролики</b><small>Встав посилання на відео вище — воно збережеться у цьому браузері.</small>';tiktokSavedList.append(empty);return}
 saved.forEach((href,i)=>{
  const u=safeTikTokUrl(href);if(!u)return;
  const row=document.createElement('div');row.className='kh-playlist-track';
  const n=document.createElement('span');n.className='music-track-number';n.textContent=String(i+1).padStart(2,'0');
  const info=document.createElement('div');info.className='music-track-info';
  const title=document.createElement('b');title.textContent=getTikTokVideoId(u)?'TikTok відео':'TikTok посилання';
  const small=document.createElement('small');small.textContent=u.pathname.length>48?u.pathname.slice(0,45)+'…':u.pathname;
  info.append(title,small);
  const open=document.createElement('a');open.className='music-play-btn';open.href=u.href;open.target='_blank';open.rel='noopener noreferrer';open.textContent='▶ ВІДКРИТИ';
  const remove=document.createElement('button');remove.type='button';remove.className='btn btn-ghost';remove.textContent='×';remove.setAttribute('aria-label','Видалити посилання');
  remove.addEventListener('click',()=>{const next=getSavedTikTok().filter((x,j)=>j!==i);try{localStorage.setItem('khkozak_tiktok_videos',JSON.stringify(next))}catch{}renderSavedTikTok()});
  row.append(n,info,open,remove);tiktokSavedList.append(row);
 });
}
function saveTikTokUrl(url){
 try{const old=getSavedTikTok().filter(x=>x!==url);localStorage.setItem('khkozak_tiktok_videos',JSON.stringify([url,...old].slice(0,8)))}catch{}
 renderSavedTikTok();
}
function loadTikTok(raw){
 const u=safeTikTokUrl(raw);
 if(!u){if(tiktokMessage)tiktokMessage.textContent='Встав повне посилання TikTok, наприклад https://www.tiktok.com/@khkozak4/video/1234567890';return}
 const videoId=getTikTokVideoId(u);
 if(videoId){
  if(tiktokEmbed){
   tiktokEmbed.innerHTML='';
   const iframe=document.createElement('iframe');iframe.title='TikTok video';iframe.src='https://www.tiktok.com/player/v1/'+videoId+'?controls=1&music_info=1&description=1';iframe.referrerPolicy='strict-origin-when-cross-origin';iframe.allow='encrypted-media; fullscreen; picture-in-picture';iframe.allowFullscreen=true;iframe.loading='lazy';
   tiktokEmbed.append(iframe);
   const fallback=document.createElement('p');fallback.className='tiktok-open-fallback';
   const link=document.createElement('a');link.className='btn btn-yellow';link.href=u.href;link.target='_blank';link.rel='noopener noreferrer';link.textContent='▶ ВІДКРИТИ ВІДЕО В TIKTOK';
   fallback.append(link);tiktokEmbed.append(fallback);
  }
  if(tiktokMessage)tiktokMessage.textContent='Відео завантажується у вбудованому плеєрі. Якщо TikTok не показує ролик у браузері, кнопка нижче відкриє його безпосередньо в TikTok.';
 }else if(u.pathname.startsWith('/@')){
  const clean='https://www.tiktok.com'+u.pathname;
  const creatorId=u.pathname.slice(2).split('/')[0];
  if(tiktokEmbed){
   tiktokEmbed.innerHTML='';
   const quote=document.createElement('blockquote');
   quote.className='tiktok-embed';quote.setAttribute('cite',clean);quote.setAttribute('data-unique-id',creatorId);quote.setAttribute('data-embed-type','creator');quote.style.maxWidth='720px';quote.style.minWidth='288px';
   const section=document.createElement('section');const profileLink=document.createElement('a');profileLink.href=clean;profileLink.target='_blank';profileLink.rel='noopener noreferrer';profileLink.textContent='@'+creatorId;section.append(profileLink);quote.append(section);tiktokEmbed.append(quote);
   const script=document.createElement('script');script.async=true;script.src='https://www.tiktok.com/embed.js';
   script.onload=()=>{if(tiktokMessage)tiktokMessage.textContent='Профіль TikTok завантажено. Прокручуй вбудовані ролики та натискай на відео для перегляду.'};
   script.onerror=()=>{if(tiktokMessage)tiktokMessage.textContent='TikTok не дозволив завантажити вбудований профіль у цьому браузері. Скористайся кнопкою нижче.'};
   tiktokEmbed.append(script);
   const fallback=document.createElement('p');fallback.className='tiktok-open-fallback';const link=document.createElement('a');link.className='btn btn-yellow';link.href=clean;link.target='_blank';link.rel='noopener noreferrer';link.textContent='ВІДКРИТИ ПРОФІЛЬ У TIKTOK ↗';fallback.append(link);tiktokEmbed.append(fallback);
  }
  if(tiktokMessage)tiktokMessage.textContent='Завантажую офіційний TikTok-віджет профілю з останніми відео…'; }else{
  if(tiktokEmbed){tiktokEmbed.innerHTML='';const card=document.createElement('div');card.className='media-empty';card.innerHTML='<span>↗</span><b>Коротке посилання TikTok</b><small>Браузер має спершу відкрити це посилання, щоб TikTok перенаправив на ролик.</small>';const link=document.createElement('a');link.className='btn btn-yellow';link.href=u.href;link.target='_blank';link.rel='noopener noreferrer';link.textContent='ВІДКРИТИ ПОСИЛАННЯ ↗';card.append(link);tiktokEmbed.append(card)}
  if(tiktokMessage)tiktokMessage.textContent='Це коротке посилання. Відкрий його кнопкою нижче; після переходу скопіюй повне посилання на відео, якщо хочеш вбудований перегляд.';
 }
 try{localStorage.setItem('khkozak_tiktok_url',u.href)}catch{}
 if(videoId)saveTikTokUrl(u.href);
}
tiktokForm?.addEventListener('submit',e=>{e.preventDefault();loadTikTok(tiktokInput?.value||'')});
if(tiktokInput){let previous='';try{previous=localStorage.getItem('khkozak_tiktok_url')||''}catch{}tiktokInput.value=previous||PROFILE_URL;loadTikTok(tiktokInput.value)}
renderSavedTikTok();
try{if(youtubeInput)youtubeInput.value=localStorage.getItem('khkozak_youtube_url')||''}catch{}

const musicSearch=$('#musicSearch'),musicCategory=$('#musicCategory'),musicList=$('#musicLibraryList'),musicCount=$('#musicCount'),musicStatus=$('#musicLibraryStatus'),musicMore=$('#musicLoadMore');
const musicGenres=[
{id:'phonk',name:'Phonk',terms:['drift phonk','aggressive phonk','Brazilian phonk','cowbell phonk','dark phonk','gym phonk','viral phonk','chill phonk','Memphis phonk','phonk mix']},
{id:'gaming',name:'Gaming / PUBG',terms:['PUBG Mobile music','gaming montage music','clutch music','battle royale soundtrack','gaming EDM','PUBG phonk','FPS montage music','victory music','gaming trap','epic gaming mix']},
{id:'electronic',name:'Електронна',terms:['EDM hits','electro house','future bass','techno mix','trance classics','bass house','dubstep mix','progressive house','hardstyle mix','electronic dance music']},
{id:'ukrainian',name:'Українська',terms:['українська музика хіти','український реп','українська поп музика','українські пісні нові','українська рок музика','український фонк','українська електронна музика','українські ремікси','українська музика 2026','українські народні ремікси']},
{id:'rap',name:'Rap / Hip-hop',terms:['hip hop hits','old school hip hop','trap music','drill rap','melodic rap','rap workout mix','loyalty rap','chill hip hop','boom bap mix','underground rap']},
{id:'chill',name:'Chill / Lo-fi',terms:['lofi hip hop','chill beats','study music','night drive chill','rainy day music','ambient music','sleep music','jazz lofi','relaxing piano','dreamy synthwave']},
{id:'rock',name:'Rock / Metal',terms:['rock classics','metal workout mix','alternative rock','nu metal hits','hard rock mix','punk rock','epic metal','rock ballads','guitar solo mix','modern rock']},
{id:'pop',name:'Pop / Hits',terms:['global pop hits','dance pop hits','2000s pop hits','2010s pop hits','viral pop songs','summer hits','romantic pop','top chart hits','pop remix','night pop mix']},
{id:'anime',name:'Anime',terms:['anime opening songs','anime fight music','anime phonk','Naruto soundtrack','Solo Leveling soundtrack','anime edit music','anime OST mix','dark anime music','anime nightcore','epic anime openings']},
{id:'mix',name:'Мікси та ремікси',terms:['viral remix mix','nightcore mix','slowed reverb songs','sped up songs','2020s remix mix','bass boosted music','car music mix','party remix','nostalgia mix','best music mix']}
];
const musicArtists=['Alan Walker','The Weeknd','Imagine Dragons','Eminem','Drake','Travis Scott','Billie Eilish','Linkin Park','Skillet','NEFFEX','Miyagi & Andy Panda','KALUSH','Okean Elzy','SadSvit','YAKTAK','DOROFEEVA','Jerry Heil','Tember Blanche','Hardwell','David Guetta','Martin Garrix','Avicii','Marshmello','DVRST','Kordhell','INTERWORLD','MoonDeity','LXST CXNTURY','Joji','XXXTENTACION','Post Malone','NF','Twenty One Pilots','Bring Me The Horizon','The Score','BONES','Skrillex','The Prodigy','Hans Zimmer','Rammstein','The Chainsmokers','Oxxxymiron','Skofka','Kavabanga Depo Kolibri','Wellboy','Антитіла','Бумбокс','Без Обмежень','MONATIK','Оля Полякова'];
const musicMoods=['best songs','hits mix','remix','slowed reverb','sped up','live performance','official music video','lyrics','night drive mix','workout mix','chill mix','best of','popular tracks','instrumental','bass boosted','2026 mix','classic hits','dark mix','epic mix','playlist'];
let musicItems=[];
musicGenres.forEach(g=>g.terms.forEach(term=>musicItems.push({title:term.charAt(0).toUpperCase()+term.slice(1),query:term,genre:g.id,tag:g.name})));
musicArtists.forEach((artist,i)=>musicMoods.forEach((mood,j)=>musicItems.push({title:artist+' — '+mood,query:artist+' '+mood,genre:musicGenres[(i+j)%musicGenres.length].id,tag:musicGenres[(i+j)%musicGenres.length].name})));
while(musicItems.length<1000){const g=musicGenres[musicItems.length%musicGenres.length],term=g.terms[Math.floor(musicItems.length/g.terms.length)%g.terms.length];musicItems.push({title:term+' · '+(musicItems.length+1),query:term,genre:g.id,tag:g.name})}
musicItems=musicItems.slice(0,1000);
let musicShown=30;
function renderMusic(){
 if(!musicList)return;
 const q=(musicSearch?.value||'').trim().toLowerCase(),cat=musicCategory?.value||'all';
 const filtered=musicItems.filter(item=>(cat==='all'||item.genre===cat)&&(!q||(item.title+' '+item.query+' '+item.tag).toLowerCase().includes(q)));
 musicList.innerHTML='';
 filtered.slice(0,musicShown).forEach((item,index)=>{
  const row=document.createElement('div');row.className='music-track-row';
  const num=document.createElement('span');num.className='music-track-number';num.textContent=String(index+1).padStart(2,'0');
  const info=document.createElement('div');info.className='music-track-info';
  const title=document.createElement('b');title.textContent=item.title;
  const sub=document.createElement('small');sub.textContent=item.tag+' · YouTube';
  info.append(title,sub);
  const btn=document.createElement('a');btn.className='music-play-btn';btn.href='https://www.youtube.com/results?search_query='+encodeURIComponent(item.query);btn.target='_self';btn.rel='noopener';btn.textContent='▶ ЗНАЙТИ ТРЕК';
  row.append(num,info,btn);musicList.append(row);
 });
 if(musicCount)musicCount.textContent=filtered.length+' пошукових варіантів';
 if(musicStatus)musicStatus.textContent=filtered.length?'Показано '+Math.min(musicShown,filtered.length)+' із '+filtered.length+'. Натисни «Знайти трек»; YouTube відкриється у цій вкладці.':'Нічого не знайдено — спробуй інший запит.';
 if(musicMore)musicMore.hidden=filtered.length<=musicShown;
}
musicSearch?.addEventListener('input',()=>{musicShown=30;renderMusic()});
musicCategory?.addEventListener('change',()=>{musicShown=30;renderMusic()});
musicMore?.addEventListener('click',()=>{musicShown+=30;renderMusic()});
document.querySelectorAll('[data-music-genre]').forEach(btn=>btn.addEventListener('click',()=>{if(musicCategory)musicCategory.value=btn.dataset.musicGenre;musicShown=30;renderMusic();musicList?.scrollIntoView({behavior:'smooth',block:'start'})}));
renderMusic();

const khPlaylist=[
['Faded','Alan Walker','60ItHLz5WEA'],['The Nights','Avicii','UtF6Jej8yb4'],['Believer','Imagine Dragons','7wtfhZwyrcc'],['Enemy','Imagine Dragons','D9G1VOjN_84'],['Numb','Linkin Park','kXYiU_JCYtU'],['In the End','Linkin Park','eVTXPUF4Oz4'],['Wake Me Up','Avicii','IcrbM1l_BoI'],['Thunder','Imagine Dragons','fKopy74weus'],['Legends Never Die','Against The Current','4Q46xYqUwZQ'],['On My Way','Alan Walker, Sabrina Carpenter & Farruko','dhYOPzcsbGM'],['Alone','Alan Walker','1-xGerv5FOk'],['Unity','TheFatRat','n8X9_MgEdCg'],['Monody','TheFatRat','B7xai5u_tnk'],['The Spectre','Alan Walker','wJnBTPUQS5A'],['Darkside','Alan Walker','M-P4QBt-FWw'],['Stefania','Kalush Orchestra','Z8Z51no1TD0'],['Обійми','Океан Ельзи','--Wokwe4-i0'],['Погляд','YAKTAK feat. SOBOL','WHQygkIG8xs'],['Хай пишуть','DOROFEEVA',''],['Силуети','SadSvit',''],['Murder In My Mind','Kordhell',''],['METAMORPHOSIS','INTERWORLD',''],['NEON BLADE','MoonDeity',''],['Close Eyes','DVRST',''],['RAVE','Dxrk ダーク',''],['Override','KSLV Noh',''],['Scopin','Kordhell','']
];
const khUkrainianTracks=[
['Stefania','Kalush Orchestra','Z8Z51no1TD0'],
['Хай пишуть','DOROFEEVA',''],
['Обійми','Океан Ельзи','--Wokwe4-i0'],
['Погляд','YAKTAK feat. SOBOL','WHQygkIG8xs']
];
function playTrack(track){
 const query=track[1]+' '+track[0]+' official audio';
 if(track[2]&&youtubeInput){youtubeInput.value='https://www.youtube.com/watch?v='+track[2];playYouTube(youtubeInput.value);youtubeWrap?.scrollIntoView({behavior:'smooth',block:'center'});}
 else {if(youtubeMessage)youtubeMessage.textContent='Для цього треку відкриваю офіційний пошук YouTube.';window.location.href='https://www.youtube.com/results?search_query='+encodeURIComponent(query);}
}
const khUkrainianList=$('#khUkrainianTracks');
function renderUkrainianTracks(){
 if(!khUkrainianList)return;
 khUkrainianList.innerHTML='';
 khUkrainianTracks.forEach((track,i)=>{
  const row=document.createElement('div');row.className='kh-playlist-track';
  const n=document.createElement('span');n.className='music-track-number';n.textContent=String(i+1).padStart(2,'0');
  const info=document.createElement('div');info.className='music-track-info';
  const title=document.createElement('b');title.textContent=track[0];
  const artist=document.createElement('small');artist.textContent=track[1]+' · Українська музика';
  info.append(title,artist);
  const btn=document.createElement('button');btn.type='button';btn.className='music-play-btn';btn.textContent='▶ СЛУХАТИ';
  btn.addEventListener('click',()=>playTrack(track));
  const fallback=document.createElement('a');fallback.className='music-track-fallback';fallback.href='https://www.youtube.com/results?search_query='+encodeURIComponent(track[1]+' '+track[0]+' official');fallback.target='_self';fallback.textContent='Не грає? Знайти на YouTube ↗';
  row.append(n,info,btn);khUkrainianList.append(row);
 });
}
const khPlaylistTracks=$('#khPlaylistTracks');
function renderKhPlaylist(){
 if(!khPlaylistTracks)return;
 khPlaylistTracks.innerHTML='';
 khPlaylist.forEach((track,i)=>{
  const row=document.createElement('div');row.className='kh-playlist-track';
  const n=document.createElement('span');n.className='music-track-number';n.textContent=String(i+1).padStart(2,'0');
  const info=document.createElement('div');info.className='music-track-info';
  const title=document.createElement('b');title.textContent=track[0];
  const artist=document.createElement('small');artist.textContent=track[1];
  info.append(title,artist);
  const btn=document.createElement('button');btn.type='button';btn.className='music-play-btn';btn.textContent='▶ СЛУХАТИ';
  btn.addEventListener('click',()=>playTrack(track));
  row.append(n,info,btn);khPlaylistTracks.append(row);
 });
}
$('#shuffleKhPlaylist')?.addEventListener('click',()=>{
 const track=khPlaylist[Math.floor(Math.random()*khPlaylist.length)];
 if(track)playTrack(track);
});
renderKhPlaylist();
renderUkrainianTracks();

// Ukrainian archive: 1,400+ songs curated across nine Spotify decade playlists.
const uaMusicPlaylistSelect=$('#uaMusicPlaylistSelect');
const uaMusicEmbed=$('#uaMusicEmbed');
const uaMusicSources={
 youtube:{url:'https://www.youtube-nocookie.com/embed/videoseries?list=PLZo_HKQnItNuvXb0bJ3n4XrgWd4P6r73G&playsinline=1&rel=0',title:'Українські хіти — YouTube'},
 '1920':{url:'https://open.spotify.com/embed/playlist/4NKtCF5tcoVxbCsFG2lfCT?utm_source=generator&theme=0',title:'Українські пісні 1920-х'},
 '1930':{url:'https://open.spotify.com/embed/playlist/4romy12Z4v5bQ8L3jdVgHy?utm_source=generator&theme=0',title:'Українські пісні 1930-х'},
 '1940':{url:'https://open.spotify.com/embed/playlist/2UpIDqXpi0l7WZa7GPuT5X?utm_source=generator&theme=0',title:'Українські пісні 1940-х'},
 '1950':{url:'https://open.spotify.com/embed/playlist/0tENMFDGw46whWLegoZqbs?utm_source=generator&theme=0',title:'Українські пісні 1950-х'},
 '1960':{url:'https://open.spotify.com/embed/playlist/79HclhNvbzXku2hAYQhiJX?utm_source=generator&theme=0',title:'Українські пісні 1960-х'},
 '1970':{url:'https://open.spotify.com/embed/playlist/6y1UH21LyvzttsknxCGcPt?utm_source=generator&theme=0',title:'Українські пісні 1970-х'},
 '1980':{url:'https://open.spotify.com/embed/playlist/3eJ3l9fbIDk8EBN1f6wK4k?utm_source=generator&theme=0',title:'Українські пісні 1980-х'},
 '1990':{url:'https://open.spotify.com/embed/playlist/3XbjPibnpFyJYsPV9Aluwj?utm_source=generator&theme=0',title:'Українські пісні 1990-х'},
 '2000':{url:'https://open.spotify.com/embed/playlist/3aavjJRpn8JXfXjZQZ7s3F?utm_source=generator&theme=0',title:'Українські пісні 2000-х'}
};
function setUaMusicSource(key){
 const source=uaMusicSources[key]||uaMusicSources.youtube;
 if(!uaMusicEmbed)return;
 uaMusicEmbed.src=source.url;
 uaMusicEmbed.title=source.title;
 uaMusicEmbed.dataset.provider=key==='youtube'?'youtube':'spotify';
 try{localStorage.setItem('khkozak_ua_music_source',key)}catch{}
}
uaMusicPlaylistSelect?.addEventListener('change',()=>setUaMusicSource(uaMusicPlaylistSelect.value));
if(uaMusicPlaylistSelect&&uaMusicEmbed){
 let saved='youtube';try{saved=localStorage.getItem('khkozak_ua_music_source')||'youtube'}catch{}
 if(uaMusicSources[saved])uaMusicPlaylistSelect.value=saved;
 setUaMusicSource(uaMusicPlaylistSelect.value);
}
})();