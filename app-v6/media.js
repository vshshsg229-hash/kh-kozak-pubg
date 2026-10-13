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
try{if(youtubeInput)youtubeInput.value=localStorage.getItem('khkozak_youtube_url')||'';if(tiktokInput){tiktokInput.value=(localStorage.getItem('khkozak_tiktok_url')||'').includes('baggy8364')?'https://www.tiktok.com/@khkozak4':(localStorage.getItem('khkozak_tiktok_url')||'https://www.tiktok.com/@khkozak4');loadTikTok(tiktokInput.value)}}catch{}

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
const musicArtists=['Alan Walker','The Weeknd','Imagine Dragons','Eminem','Drake','Travis Scott','Billie Eilish','Linkin Park','Skillet','NEFFEX','Miyagi & Andy Panda','KALUSH','Okean Elzy','SadSvit','YAKTAK','DOROFEEVA','Jerry Heil','Tember Blanche','Hardwell','David Guetta','Martin Garrix','Avicii','Marshmello','DVRST','Kordhell','INTERWORLD','MoonDeity','LXST CXNTURY','Joji','XXXTENTACION','Post Malone','NF','Twenty One Pilots','Bring Me The Horizon','The Score','BONES','$uicideboy,'Skrillex','The Prodigy','Hans Zimmer'];
const musicMoods=['best songs','hits mix','remix','slowed reverb','sped up','live performance','official music video','lyrics','night drive mix','workout mix','chill mix','best of','popular tracks','instrumental','bass boosted','2026 mix','classic hits','dark mix','epic mix','playlist'];
let musicItems=[];
musicGenres.forEach(g=>g.terms.forEach((term,i)=>musicItems.push({title:term.charAt(0).toUpperCase()+term.slice(1),query:term,genre:g.id,tag:g.name})));
musicArtists.forEach((artist,i)=>musicMoods.forEach((mood,j)=>musicItems.push({title:artist+' — '+mood,query:artist+' '+mood,genre:musicGenres[(i+j)%musicGenres.length].id,tag:musicGenres[(i+j)%musicGenres.length].name})));
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
  const btn=document.createElement('a');btn.className='music-play-btn';btn.href='https://www.youtube.com/results?search_query='+encodeURIComponent(item.query);btn.target='_blank';btn.rel='noopener noreferrer';btn.textContent='▶ СЛУХАТИ';
  row.append(num,info,btn);musicList.append(row);
 });
 if(musicCount)musicCount.textContent=filtered.length+' результатів';
 if(musicStatus)musicStatus.textContent=filtered.length?'Показано '+Math.min(musicShown,filtered.length)+' із '+filtered.length+'. Відтворення відкривається на YouTube.':'Нічого не знайдено — спробуй інший запит.';
 if(musicMore)musicMore.hidden=filtered.length<=musicShown;
}
musicSearch?.addEventListener('input',()=>{musicShown=30;renderMusic()});
musicCategory?.addEventListener('change',()=>{musicShown=30;renderMusic()});
musicMore?.addEventListener('click',()=>{musicShown+=30;renderMusic()});
document.querySelectorAll('[data-music-genre]').forEach(btn=>btn.addEventListener('click',()=>{if(musicCategory)musicCategory.value=btn.dataset.musicGenre;musicShown=30;renderMusic();musicList?.scrollIntoView({behavior:'smooth',block:'start'})}));
renderMusic();

})();