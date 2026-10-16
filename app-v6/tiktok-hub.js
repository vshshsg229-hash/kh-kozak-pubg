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
 if(player)player.innerHTML='<blockquote class="tiktok-embed kh-tiktok-single-embed" cite="'+safeText(video.url)+'" data-video-id="'+safeText(video.id)+'" style="max-width:605px;min-width:288px"><section><a target="_blank" rel="noopener noreferrer" href="'+safeText(video.url)+'">@'+safeText(video.user)+' · Відкрити оригінал ↗</a></section></blockquote>';
 if(input)input.value=video.url;
 if(status)status.textContent='Відео додано до плеєра. Якщо TikTok дозволяє вбудовування, натисни ▶ у відео нижче.';
 let saveButton=$('#khTikTokSaveCurrent');if(!saveButton&&player){saveButton=document.createElement('button');saveButton.type='button';saveButton.id='khTikTokSaveCurrent';saveButton.textContent='★ ЗБЕРЕГТИ В ДОБІРКУ';saveButton.style.cssText='margin:10px 0;padding:10px 14px;border:1px solid #f2c94c;border-radius:8px;background:#182334;color:#f2c94c;font-weight:800';player.prepend(saveButton)}if(saveButton){saveButton.dataset.url=video.url;saveButton.dataset.user=video.user;saveButton.dataset.id=video.id;}
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

window.khTikTokPlayVideo=playVideo;
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',renderWatch,{once:true});else renderWatch();
})();