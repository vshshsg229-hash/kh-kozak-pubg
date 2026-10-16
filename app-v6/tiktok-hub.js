(()=>{'use strict';
const $=s=>document.querySelector(s);
const form=$('#khTikTokVideoForm'),input=$('#khTikTokVideoUrl'),player=$('#khTikTokVideoPlayer'),status=$('#khTikTokVideoStatus');
const tab=$('#tab-tiktok');
const WATCH_KEY='khkozak_tiktok_watchlist_v1';
const readWatch=()=>{try{const v=JSON.parse(localStorage.getItem(WATCH_KEY)||'[]');return Array.isArray(v)?v:[]}catch{return []}};
const writeWatch=v=>{try{localStorage.setItem(WATCH_KEY,JSON.stringify(v));return true}catch{return false}};
function renderWatch(){const host=$('#khTikTokSavedList'),count=$('#khTikTokSavedCount');if(!host)return;const list=readWatch();if(count)count.textContent=list.length+' збережено';host.innerHTML=list.length?list.map((v,i)=>'<article style="display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;padding:10px;border:1px solid #293b50;border-radius:8px;background:#101b29"><span style="font-size:12px">♪ @'+safeText(v.user)+' · '+safeText(v.id.slice(-7))+'</span><span style="display:flex;gap:7px"><button type="button" data-khtt-play="'+i+'">▶ ВІДКРИТИ</button><button type="button" data-khtt-remove="'+i+'">ВИДАЛИТИ</button></span></article>').join(''):'<p style="margin:0;color:#9eb3cc;font-size:12px">Тут з’являться збережені відео.</p>';}
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
 if(player)player.innerHTML='<div class="kh-tiktok-iframe-wrap"><iframe class="kh-tiktok-player-iframe" src="https://www.tiktok.com/player/v1/'+encodeURIComponent(video.id)+'?controls=1&description=1&music_info=1" title="TikTok відео від @'+safeText(video.user)+'" allow="fullscreen; autoplay; encrypted-media; picture-in-picture" allowfullscreen loading="lazy" referrerpolicy="strict-origin-when-cross-origin"></iframe></div><a class="kh-tiktok-original-link" href="'+safeText(video.url)+'" target="_blank" rel="noopener noreferrer">ВІДКРИТИ ОРИГІНАЛ У TIKTOK ↗</a>';
 if(input)input.value=video.url;
 if(status)status.textContent='Відео відтворюється у вбудованому плеєрі Battle Hub. Якщо автор обмежив вбудовування, TikTok може не показати ролик.';
 let saveButton=$('#khTikTokSaveCurrent');if(!saveButton&&player){saveButton=document.createElement('button');saveButton.type='button';saveButton.id='khTikTokSaveCurrent';saveButton.textContent='★ ЗБЕРЕГТИ В ДОБІРКУ';saveButton.className='kh-tiktok-save-current';player.append(saveButton)}if(saveButton){saveButton.dataset.url=video.url;saveButton.dataset.user=video.user;saveButton.dataset.id=video.id;}
 refreshEmbeds(true);
}
form?.addEventListener('submit',event=>{event.preventDefault();playVideo(input?.value||'')});
document.addEventListener('click',event=>{const save=event.target.closest('#khTikTokSaveCurrent');if(save){const v={url:save.dataset.url,user:save.dataset.user,id:save.dataset.id};if(!v.url)return;const list=readWatch();if(list.some(x=>x.id===v.id)){if(status)status.textContent='Це відео вже є у твоїй добірці.';return}list.unshift(v);if(!writeWatch(list.slice(0,50))){if(status)status.textContent='Не вдалося зберегти посилання. Перевір пам’ять пристрою.';return}renderWatch();if(status)status.textContent='Відео збережено у твоїй добірці.';return}const play=event.target.closest('[data-khtt-play]');if(play){const v=readWatch()[Number(play.dataset.khttPlay)];if(v)playVideo(v.url);return}const remove=event.target.closest('[data-khtt-remove]');if(remove){const list=readWatch();list.splice(Number(remove.dataset.khttRemove),1);writeWatch(list);renderWatch()}});
document.addEventListener('click',event=>{
 const trigger=event.target.closest('[data-tab="tiktok"]');
 if(trigger){window.setTimeout(()=>refreshEmbeds(true),160)}
});
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&isTikTokTabVisible())refreshEmbeds()});
window.addEventListener('pageshow',()=>{if(isTikTokTabVisible())refreshEmbeds()});

/* KH Creator Lab: ideas, captions, hashtags and a persistent local queue. */
const CREATOR_QUEUE_KEY='khkozak_creator_queue_v1';
const creatorSets={
 pubg:[
  {title:'Розворот у фіналі',hook:'Він думав, що раунд уже виграний… 👀',caption:'Один момент — і весь матч перевернувся. Дивись до кінця!',tags:'#PUBGMobile #PUBGHighlights #Kozak #GamingUA #УкраїнськийTikTok'},
  {title:'Клатч 1 проти 3',hook:'1 проти 3. Ти б пішов у цей бій?',caption:'Без паніки, тільки позиція й таймінг. Оціни цей клатч!',tags:'#PUBGMobile #Clutch #PUBG #Kozak #Геймінг'},
  {title:'Найкращий момент матчу',hook:'Ось заради чого я запускаю PUBG 🔥',caption:'Збережи цей момент і напиши, як би зіграв ти.',tags:'#PUBGMobile #GamingHighlights #PUBGClips #GamingUA #Kozak'}
 ],
 tips:[
  {title:'Одна помилка в перестрілці',hook:'Не роби цього, коли ворог уже поруч.',caption:'Коротка порада для наступного матчу. Збережи, щоб не забути.',tags:'#PUBGTips #PUBGMobile #GamingTips #Kozak #УкраїнськийTikTok'},
  {title:'Як займати укриття',hook:'Ця дрібниця може врятувати твій матч.',caption:'Позиція важливіша за хаотичний пуш. Спробуй у наступній грі.',tags:'#PUBGGuide #PUBGMobileTips #GamingUA #Kozak #PUBG'},
  {title:'Передфінальна перевірка',hook:'Перевір ці 3 речі перед фінальною зоною.',caption:'Аптечки, дим і маршрут. Яку пораду додав би ти?',tags:'#PUBGTips #BattleRoyale #PUBGMobile #Kozak #Геймінг'}
 ],
 fun:[
  {title:'Очікування проти реальності',hook:'План був ідеальний… до першого пострілу 😂',caption:'У кого теж так було? Познач напарника, який робить саме так.',tags:'#GamingMemes #PUBGFunny #PUBGMobile #Kozak #УкраїнськийTikTok'},
  {title:'Напарник із дивним планом',hook:'Коли твій тімейт каже: «Довірся мені».',caption:'Найнебезпечніші слова в командному матчі 😅',tags:'#PUBGMoments #GamingFunny #Squad #Kozak #GamingUA'},
  {title:'Лут не за планом',hook:'Знайшов усе… крім того, що потрібно.',caption:'Чесно: це невезіння чи мій звичайний лут?',tags:'#PUBGMemes #GamingMoments #PUBGMobile #Kozak #Геймінг'}
 ],
 challenge:[
  {title:'Челендж однієї зброї',hook:'Чи реально виграти матч лише з цією зброєю?',caption:'Приймаєш виклик? Напиши, яку зброю спробувати наступною.',tags:'#PUBGChallenge #PUBGMobile #GamingChallenge #Kozak #GamingUA'},
  {title:'Гра без поспіху',hook:'Сьогодні виграє не найшвидший, а найрозумніший.',caption:'Тактичний матч: менше хаосу, більше рішень. Спробував би?',tags:'#PUBGTactics #PUBGMobile #GamingChallenge #Kozak #УкраїнськийTikTok'},
  {title:'Коментар обирає наступний ролик',hook:'Ви обираєте моє наступне випробування.',caption:'Напиши челендж у коментарях — найцікавіший перевірю в наступному відео.',tags:'#TikTokChallenge #PUBGMobile #Kozak #GamingUA #PUBG'}
 ]
};
const creatorHooks=['Ти б ризикнув зробити цей пуш? 👀','Дивись до кінця — ось де все змінилося.','Оціни рішення від 1 до 10.','Цей момент я точно не планував.','Збережи перед наступним матчем.','Твій напарник теж так робить? 😅'];
const creatorCaptions=['Дивись до кінця й напиши, як би зіграв ти.','Збережи ідею для наступного матчу.','Оціни момент і запропонуй наступний челендж.','Познач напарника, якому треба це побачити.'];
const creatorTagSets=['#PUBGMobile #Kozak #GamingUA #PUBGHighlights #УкраїнськийTikTok','#PUBGClips #BattleRoyale #Gaming #Kozak #PUBGMobile','#PUBGTips #Геймінг #GamingUA #Kozak #TikTokGaming','#PUBGMoments #Squad #PUBGMobile #Kozak #УкраїнськийTikTok'];
let currentCreatorIdea=creatorSets.pubg[0];
const creatorIdeaEl=$('#khCreatorIdea'),creatorCaptionEl=$('#khCreatorCaption'),creatorTagsEl=$('#khCreatorHashtags');
const readCreatorQueue=()=>{try{const x=JSON.parse(localStorage.getItem(CREATOR_QUEUE_KEY)||'[]');return Array.isArray(x)?x:[]}catch{return []}};
const writeCreatorQueue=x=>{try{localStorage.setItem(CREATOR_QUEUE_KEY,JSON.stringify(x));return true}catch{return false}};
function pickCreator(arr){return arr[Math.floor(Math.random()*arr.length)]}
function renderCreatorIdea(item){currentCreatorIdea=item;if(creatorIdeaEl)creatorIdeaEl.innerHTML='<b>'+safeText(item.title)+'</b><span>'+safeText(item.hook)+'</span><span>'+safeText(item.caption)+'</span>'}
function renderCreatorCaption(){const hook=pickCreator(creatorHooks),caption=pickCreator(creatorCaptions);if(creatorCaptionEl)creatorCaptionEl.innerHTML='<b>ХУК</b><span>'+safeText(hook)+'</span><b>ПІДПИС</b><span>'+safeText(caption)+'</span>';creatorCaptionEl.dataset.copy=hook+'\n'+caption}
function renderCreatorQueue(){const host=$('#khCreatorQueueList'),count=$('#khCreatorQueueCount');if(!host)return;const list=readCreatorQueue();if(count)count.textContent=list.length+' '+(list.length===1?'ідея':list.length>=2&&list.length<=4?'ідеї':'ідей');host.innerHTML=list.length?list.map((v,i)=>'<article class="kh-creator-queue-item"><div><b>'+safeText(v.title)+'</b><small>'+safeText(v.hook)+'<br>'+safeText(v.caption)+'</small></div><button type="button" data-creator-remove="'+i+'">ВИДАЛИТИ</button></article>').join(''):'<p class="kh-creator-empty">Збережи першу ідею з генератора — вона з’явиться тут.</p>'}
async function creatorCopy(text){try{if(navigator.clipboard&&navigator.clipboard.writeText){await navigator.clipboard.writeText(text);if(status)status.textContent='Скопійовано. Можеш вставити текст у TikTok.';return}}catch{}if(status)status.textContent='Не вдалося скопіювати автоматично. Виділи текст і скопіюй вручну.'}
document.addEventListener('click',event=>{const b=event.target.closest('[data-creator-action]');if(b){const action=b.dataset.creatorAction;if(action==='idea'){const key=$('#khCreatorCategory')?.value||'pubg';renderCreatorIdea(pickCreator(creatorSets[key]||creatorSets.pubg));if(status)status.textContent='Нову ідею підготовлено.'}else if(action==='caption'){renderCreatorCaption();if(status)status.textContent='Новий хук і підпис готові.'}else if(action==='hashtags'){if(creatorTagsEl)creatorTagsEl.textContent=pickCreator(creatorTagSets);if(status)status.textContent='Набір хештегів оновлено.'}else if(action==='copy-caption'){creatorCopy(creatorCaptionEl?.dataset.copy||'Ти б ризикнув зробити цей пуш? 👀\nДивись до кінця — фінал вирішив усе.')}else if(action==='copy-hashtags'){creatorCopy(creatorTagsEl?.textContent||'')}else if(action==='save'){const list=readCreatorQueue();if(list.some(v=>v.title===currentCreatorIdea.title&&v.hook===currentCreatorIdea.hook)){if(status)status.textContent='Ця ідея вже є у твоєму плані.';return}list.unshift({...currentCreatorIdea,savedAt:new Date().toISOString()});if(!writeCreatorQueue(list.slice(0,100))){if(status)status.textContent='Не вдалося зберегти ідею на цьому пристрої.';return}renderCreatorQueue();if(status)status.textContent='Ідею додано до плану публікацій.'}return}const remove=event.target.closest('[data-creator-remove]');if(remove){const list=readCreatorQueue();list.splice(Number(remove.dataset.creatorRemove),1);writeCreatorQueue(list);renderCreatorQueue();if(status)status.textContent='Ідею видалено з плану.'}});
renderCreatorQueue();

/* In-app upload handoff: share the selected video to TikTok when the device supports file sharing. */
const uploadInput=$('#khTikTokUploadFile'),uploadPreview=$('#khTikTokUploadPreview'),uploadStatus=$('#khTikTokUploadStatus'),uploadCaption=$('#khTikTokUploadCaption');
let selectedUploadFile=null,uploadPreviewUrl='';
function setUploadStatus(message){if(uploadStatus)uploadStatus.textContent=message}
uploadInput?.addEventListener('change',()=>{
 const file=uploadInput.files?.[0];selectedUploadFile=file||null;
 if(uploadPreviewUrl){URL.revokeObjectURL(uploadPreviewUrl);uploadPreviewUrl=''}
 if(uploadPreview)uploadPreview.innerHTML='';
 if(!file){setUploadStatus('Обери відеофайл, щоб підготувати публікацію.');return}
 if(!file.type.startsWith('video/')){selectedUploadFile=null;uploadInput.value='';setUploadStatus('Це не схоже на відеофайл. Обери MP4 або інше відео.');return}
 if(file.size>500*1024*1024){selectedUploadFile=null;uploadInput.value='';setUploadStatus('Файл завеликий для швидкого передавання через браузер (ліміт 500 МБ). Спробуй коротший ролик.');return}
 uploadPreviewUrl=URL.createObjectURL(file);
 if(uploadPreview)uploadPreview.innerHTML='<video controls playsinline preload="metadata" src="'+uploadPreviewUrl+'" aria-label="Попередній перегляд відео перед публікацією"></video><div><b>'+safeText(file.name)+'</b><small>'+(file.size/1024/1024).toFixed(1)+' МБ · готове до передавання</small></div>';
 setUploadStatus('Відео готове. Натисни «Передати в TikTok» — якщо пристрій підтримує передавання файлів, вибери TikTok у системному меню й заверши публікацію там.');
});
$('#khTikTokShareUpload')?.addEventListener('click',async()=>{
 if(!selectedUploadFile){setUploadStatus('Спочатку обери відеофайл.');uploadInput?.click();return}
 const caption=(uploadCaption?.value||'').trim();
 try{
  if(navigator.share&&navigator.canShare&&navigator.canShare({files:[selectedUploadFile]})){
   const data={files:[selectedUploadFile],title:'KH么Kozak TikTok'};
   if(caption)data.text=caption;
   await navigator.share(data);
   setUploadStatus('Меню передавання відкрито. Вибери TikTok, якщо він є у списку, та заверши публікацію в застосунку.');
   return;
  }
 }catch(error){if(error?.name==='AbortError'){setUploadStatus('Передавання скасовано. Відео залишилося вибраним.');return}}
 setUploadStatus('Цей браузер не передає відеофайли напряму в TikTok. Відкриваю офіційну сторінку завантаження — там вибери цей самий файл вручну.');
 window.open('https://www.tiktok.com/upload?lang=uk-UA','_blank','noopener,noreferrer');
});
$('#khTikTokOpenUpload')?.addEventListener('click',()=>{
 setUploadStatus(selectedUploadFile?'Відкриваю TikTok Studio. Вибери підготовлений файл у TikTok, щоб опублікувати його.':'Відкриваю TikTok Studio. Спочатку або там вибери відеофайл для публікації.');
 window.open('https://www.tiktok.com/upload?lang=uk-UA','_blank','noopener,noreferrer');
});
document.addEventListener('click',event=>{
 const inAppButton=event.target.closest('[data-kh-inapp-video]');
 if(inAppButton){
  event.preventDefault();
  const card=inAppButton.closest('.tiktok-profile-unit');
  if(!card)return;
  let mini=card.querySelector('.kh-profile-mini-player');
  if(!mini){
   const username=inAppButton.dataset.khInappVideo||'';
   mini=document.createElement('div');mini.className='kh-profile-mini-player';
   mini.innerHTML='<label>Посилання на відео @'+username.replace(/[^a-zA-Z0-9._-]/g,'')+'</label><div class="kh-profile-mini-row"><input type="url" inputmode="url" placeholder="Встав посилання на ролик…" aria-label="Посилання на відео"><button type="button" class="kh-profile-mini-play">▶ ДИВИТИСЬ</button></div><div class="kh-profile-mini-screen"><span>Відео відтворюватиметься тут</span></div>';
   card.appendChild(mini);
   mini.querySelector('.kh-profile-mini-play').addEventListener('click',()=>{
    const parsed=parseVideo(mini.querySelector('input').value);
    const screen=mini.querySelector('.kh-profile-mini-screen');
    if(!parsed){screen.innerHTML='<span>Встав повне посилання на конкретний TikTok-ролик.</span>';return;}
    screen.innerHTML='<iframe title="TikTok @'+safeText(parsed.user)+'" src="https://www.tiktok.com/player/v1/'+encodeURIComponent(parsed.id)+'?controls=1&description=1&music_info=1" allow="fullscreen; autoplay; encrypted-media; picture-in-picture" allowfullscreen loading="lazy" referrerpolicy="strict-origin-when-cross-origin"></iframe><a href="'+safeText(parsed.url)+'" target="_blank" rel="noopener noreferrer">ВІДКРИТИ ОРИГІНАЛ ↗</a>';
   });
  }
  mini.hidden=false;
  mini.scrollIntoView({behavior:'auto',block:'nearest'});
  mini.querySelector('input').focus({preventScroll:true});
  return;
 }
 const profile=event.target.closest('[data-kh-profile-open]');
 if(!profile)return;
 event.preventDefault();
 const card=profile.closest('.tiktok-profile-unit');
 const feed=card?.querySelector('.tiktok-creator-feed');
 if(feed){feed.scrollIntoView({behavior:'auto',block:'center'});feed.classList.add('kh-tiktok-feed-focused');setUploadStatus('Профіль відкрито у вбудованій стрічці Battle Hub. Для відео, які TikTok відкриває назовні, встав посилання в плеєр нижче.')}
});
window.khTikTokPlayVideo=playVideo;
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',renderWatch,{once:true});else renderWatch();
})();