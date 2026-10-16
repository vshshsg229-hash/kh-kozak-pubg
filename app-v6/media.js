(()=>{'use strict';
const $=s=>document.querySelector(s);
const youtubeForm=$('#youtubeForm'),youtubeInput=$('#youtubeUrl'),youtubeWrap=$('#youtubeFrameWrap'),youtubeMessage=$('#youtubeMessage');
function playYouTube(raw){
 let u;try{u=new URL(raw.trim())}catch{u=null}
 if(!u||!['youtube.com','www.youtube.com','music.youtube.com','youtu.be','m.youtube.com','www.youtube-nocookie.com'].includes(u.hostname.toLowerCase())){if(youtubeMessage)youtubeMessage.textContent='Встав коректне посилання YouTube на відео або плейлист.';return false}
 const host=u.hostname.toLowerCase();
 const video=host==='youtu.be'?u.pathname.split('/').filter(Boolean)[0]:(u.searchParams.get('v')||u.pathname.match(/\/(?:shorts|embed|live|v)\/([^/?]+)/)?.[1]||'');
 const list=u.searchParams.get('list')||'';
 if(video&&!/^[A-Za-z0-9_-]{6,}$/.test(video)){if(youtubeMessage)youtubeMessage.textContent='Не вдалося розпізнати ID відео YouTube. Встав повне посилання.';return false}
 if(!video&&!list){if(youtubeMessage)youtubeMessage.textContent='У посиланні не знайдено відео або плейлист.';return false}
 const params=new URLSearchParams();params.set('playsinline','1');params.set('rel','0');params.set('autoplay','1');params.set('controls','1');if(list)params.set('list',list);
 const src=video?'https://www.youtube-nocookie.com/embed/'+encodeURIComponent(video)+'?'+params.toString():'https://www.youtube-nocookie.com/embed/videoseries?'+params.toString();
 if(youtubeWrap)youtubeWrap.innerHTML='<iframe title="YouTube music player" src="'+src+'" referrerpolicy="strict-origin-when-cross-origin" allow="autoplay; encrypted-media; picture-in-picture; web-share" allowfullscreen loading="lazy"></iframe>';
 if(youtubeMessage)youtubeMessage.textContent='Плеєр завантажено. Натисни ▶ у відео. Якщо відтворення заблоковане, відкрий трек на YouTube.';
 try{localStorage.setItem('khkozak_youtube_url',raw.trim())}catch{}
 return true;
}
youtubeForm?.addEventListener('submit',e=>{e.preventDefault();playYouTube(youtubeInput?.value||'')});
const musicSearch=$('#musicSearch'),musicCategory=$('#musicCategory'),musicList=$('#musicLibraryList'),musicCount=$('#musicCount'),musicStatus=$('#musicLibraryStatus'),musicMore=$('#musicLoadMore');
const musicFavoritesToggle=$('#musicFavoritesToggle');
const MUSIC_FAVORITES_KEY='khkozak_music_favorites_v1';
let musicFavorites=new Set();
let musicFavoritesOnly=false;
try{const saved=JSON.parse(localStorage.getItem(MUSIC_FAVORITES_KEY)||'[]');if(Array.isArray(saved))musicFavorites=new Set(saved.filter(v=>typeof v==='string'))}catch{}
function musicKey(item){return item.genre+'|'+item.query}
function saveMusicFavorites(){try{localStorage.setItem(MUSIC_FAVORITES_KEY,JSON.stringify([...musicFavorites]))}catch{}}
function updateMusicFavoritesUI(){if(musicFavoritesToggle){musicFavoritesToggle.setAttribute('aria-pressed',String(musicFavoritesOnly));musicFavoritesToggle.style.background=musicFavoritesOnly?'rgba(255,210,55,.22)':'rgba(255,210,55,.08)';musicFavoritesToggle.textContent='★ Обрані ('+musicFavorites.size+')'}}

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
 const filtered=musicItems.filter(item=>(!musicFavoritesOnly||musicFavorites.has(musicKey(item)))&&(cat==='all'||item.genre===cat)&&(!q||(item.title+' '+item.query+' '+item.tag).toLowerCase().includes(q)));
 musicList.innerHTML='';
 filtered.slice(0,musicShown).forEach((item,index)=>{
  const row=document.createElement('div');row.className='music-track-row';
  const num=document.createElement('span');num.className='music-track-number';num.textContent=String(index+1).padStart(2,'0');
  const info=document.createElement('div');info.className='music-track-info';
  const title=document.createElement('b');title.textContent=item.title;
  const sub=document.createElement('small');sub.textContent=item.tag+' · YouTube';
  info.append(title,sub);
  const actions=document.createElement('div');actions.className='music-track-actions';
  const favorite=document.createElement('button');favorite.type='button';favorite.className='music-favorite-btn';favorite.setAttribute('aria-label',musicFavorites.has(musicKey(item))?'Прибрати з обраного':'Додати в обране');favorite.setAttribute('aria-pressed',String(musicFavorites.has(musicKey(item))));favorite.textContent=musicFavorites.has(musicKey(item))?'★':'☆';
  favorite.addEventListener('click',()=>{const key=musicKey(item);if(musicFavorites.has(key))musicFavorites.delete(key);else musicFavorites.add(key);saveMusicFavorites();updateMusicFavoritesUI();renderMusic()});
  const btn=document.createElement('a');btn.className='music-play-btn';btn.href='https://www.youtube.com/results?search_query='+encodeURIComponent(item.query);btn.target='_blank';btn.rel='noopener noreferrer';btn.textContent='▶ ЗНАЙТИ ТРЕК';
  actions.append(favorite,btn);row.append(num,info,actions);musicList.append(row);
 });
 if(musicCount)musicCount.textContent=filtered.length+' пошукових варіантів';
 if(musicStatus)musicStatus.textContent=filtered.length?'Показано '+Math.min(musicShown,filtered.length)+' із '+filtered.length+(musicFavoritesOnly?' обраних':' варіантів')+'. Натисни ★, щоб зберегти трек у своєму списку; обране зберігається на цьому пристрої.':'Нічого не знайдено — спробуй інший запит або вимкни фільтр обраного.';
 if(musicMore)musicMore.hidden=filtered.length<=musicShown;
}
musicSearch?.addEventListener('input',()=>{musicShown=30;renderMusic()});
musicCategory?.addEventListener('change',()=>{musicShown=30;renderMusic()});
musicMore?.addEventListener('click',()=>{musicShown+=30;renderMusic()});
musicFavoritesToggle?.addEventListener('click',()=>{musicFavoritesOnly=!musicFavoritesOnly;musicShown=30;updateMusicFavoritesUI();renderMusic()});
updateMusicFavoritesUI();
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
 if(!track||!track[2]||!youtubeInput){if(youtubeMessage)youtubeMessage.textContent='Для вбудованого відтворення обери трек із доступним відео.';return false;}
 const videoId=String(track[2]).trim();
 if(!/^[A-Za-z0-9_-]{6,}$/.test(videoId)){if(youtubeMessage)youtubeMessage.textContent='Не вдалося перевірити відео цього треку.';return false;}
 youtubeInput.value='https://www.youtube.com/watch?v='+videoId;
 const loaded=playYouTube(youtubeInput.value);
 if(!loaded)return false;
 if(youtubeMessage)youtubeMessage.textContent='▶ Обрано: '+track[0]+' — '+track[1]+'. Відтворення запускається у вбудованому плеєрі нижче.';
 try{window.khMusicMediaSession?.setMetadata(track[0],track[1],'KH Gaming Mix')}catch{}
 youtubeWrap?.scrollIntoView({behavior:'smooth',block:'center'});
 return true;
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
 // Random mode must always use a known video ID so playback stays inside the hub.
 const playableTracks=khPlaylist.filter(track=>track[2]&&/^[A-Za-z0-9_-]{6,}$/.test(String(track[2]).trim()));
 if(!playableTracks.length){if(youtubeMessage)youtubeMessage.textContent='Зараз немає треків із вбудованим відео. Спробуй ще раз пізніше.';return;}
 const track=playableTracks[Math.floor(Math.random()*playableTracks.length)];
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