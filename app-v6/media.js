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
 const params=new URLSearchParams();params.set('playsinline','1');params.set('rel','0');if(list)params.set('list',list);
 const src=video?'https://www.youtube-nocookie.com/embed/'+encodeURIComponent(video)+'?'+params.toString():'https://www.youtube-nocookie.com/embed/videoseries?'+params.toString();
 if(youtubeWrap)youtubeWrap.innerHTML='<iframe title="YouTube music player" src="'+src+'" referrerpolicy="strict-origin-when-cross-origin" allow="autoplay; encrypted-media; picture-in-picture; web-share" allowfullscreen loading="lazy"></iframe>';
 if(youtubeMessage)youtubeMessage.textContent='Плеєр завантажено. Натисни ▶ у відео. Якщо відтворення заблоковане, відкрий трек на YouTube.';
 try{localStorage.setItem('khkozak_youtube_url',raw.trim())}catch{}
 return true;
}
youtubeForm?.addEventListener('submit',e=>{e.preventDefault();playYouTube(youtubeInput?.value||'')});
const tiktokForm=$('#tiktokForm'),tiktokInput=$('#tiktokUrl'),tiktokEmbed=$('#tiktokEmbed'),tiktokMessage=$('#tiktokMessage');
const PROFILE_URL='https://www.tiktok.com/@khkozak4';
function loadTikTok(raw){
 let u;try{u=new URL(raw.trim())}catch{u=null}
 if(!u||!/(^|\.)tiktok\.com$/i.test(u.hostname)){if(tiktokMessage)tiktokMessage.textContent='Встав повне посилання з TikTok, наприклад '+PROFILE_URL;return}
 const videoPart=u.pathname.split('/video/')[1]||'';
 const videoId=videoPart.split('/')[0].split('?')[0];
 if(videoId&&/^[0-9]+$/.test(videoId)){
  if(tiktokEmbed)tiktokEmbed.innerHTML='<iframe title="TikTok video" src="https://www.tiktok.com/embed/v2/'+videoId+'" referrerpolicy="strict-origin-when-cross-origin" allow="encrypted-media; fullscreen; picture-in-picture" allowfullscreen loading="lazy"></iframe><p><a class="btn btn-ghost" href="'+u.href.replace(/&/g,'&amp;')+'" target="_self">Якщо відео не завантажилось — відкрити в TikTok ↗</a></p>';
  if(tiktokMessage)tiktokMessage.textContent='Пробую показати ролик тут. Якщо TikTok блокує вбудований перегляд, натисни посилання під ним.';
 }else if(u.pathname.startsWith('/@')){
  const clean='https://www.tiktok.com'+u.pathname;
  if(tiktokEmbed)tiktokEmbed.innerHTML='<div class="media-empty"><span>♪</span><b>Профіль @khkozak4</b><small>Профіль відкриється на TikTok</small><a class="btn btn-yellow" href="'+clean+'" target="_self" rel="noopener">ВІДКРИТИ ПРОФІЛЬ ↗</a></div>';
  if(tiktokMessage)tiktokMessage.textContent='Натисни кнопку, щоб відкрити профіль у браузері або застосунку TikTok.';
 }else{if(tiktokMessage)tiktokMessage.textContent='Не вдалося визначити профіль або ролик. Перевір посилання.';return}
 try{localStorage.setItem('khkozak_tiktok_url',u.href)}catch{}
}
tiktokForm?.addEventListener('submit',e=>{e.preventDefault();loadTikTok(tiktokInput?.value||'')});
if(tiktokInput){tiktokInput.value=PROFILE_URL;loadTikTok(PROFILE_URL)}
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
 if(musicCount)musicCount.textContent=filtered.length+' треків/пошукових варіантів';
 if(musicStatus)musicStatus.textContent=filtered.length?'Показано '+Math.min(musicShown,filtered.length)+' із '+filtered.length+'. Натисни «Знайти трек»; YouTube відкриється у цій вкладці.':'Нічого не знайдено — спробуй інший запит.';
 if(musicMore)musicMore.hidden=filtered.length<=musicShown;
}
musicSearch?.addEventListener('input',()=>{musicShown=30;renderMusic()});
musicCategory?.addEventListener('change',()=>{musicShown=30;renderMusic()});
musicMore?.addEventListener('click',()=>{musicShown+=30;renderMusic()});
document.querySelectorAll('[data-music-genre]').forEach(btn=>btn.addEventListener('click',()=>{if(musicCategory)musicCategory.value=btn.dataset.musicGenre;musicShown=30;renderMusic();musicList?.scrollIntoView({behavior:'smooth',block:'start'})}));
renderMusic();

const khPlaylist=[
['Faded','Alan Walker','60ItHLz5WEA'],['The Nights','Avicii','UtF6Jej8yb4'],['Believer','Imagine Dragons','7wtfhZwyrcc'],['Enemy','Imagine Dragons','D9G1VOjN_84'],['Numb','Linkin Park','kXYiU_JCYtU'],['In the End','Linkin Park','eVTXPUF4Oz4'],['Wake Me Up','Avicii','IcrbM1l_BoI'],['Thunder','Imagine Dragons','fKopy74weus'],['Legends Never Die','Against The Current','4Q46xYqUwZQ'],['On My Way','Alan Walker, Sabrina Carpenter & Farruko','dhYOPzcsbGM'],['Alone','Alan Walker','1-xGerv5FOk'],['Unity','TheFatRat','n8X9_MgEdCg'],['Monody','TheFatRat','B7xai5u_tnk'],['The Spectre','Alan Walker','wJnBTPUQS5A'],['Darkside','Alan Walker','M-P4QBt-FWw'],['Stefania','Kalush Orchestra','Z8Z51no1TD0'],['Обійми','Океан Ельзи','--Wokwe4-i0'],['Погляд','YAKTAK feat. SOBOL','WHQygkIG8xs'],['Хай пишуть','DOROFEEVA','jfKfPfyJRdk'],['Силуети','SadSvit',''],['Murder In My Mind','Kordhell',''],['METAMORPHOSIS','INTERWORLD',''],['NEON BLADE','MoonDeity',''],['Close Eyes','DVRST',''],['RAVE','Dxrk ダーク',''],['Override','KSLV Noh',''],['Scopin','Kordhell','']
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
})();