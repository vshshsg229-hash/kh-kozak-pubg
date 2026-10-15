(()=>{'use strict';
const PROFILES=[
 {id:'baggy8364',label:'@baggy8364',url:'https://www.tiktok.com/@baggy8364'},
 {id:'tiktok.comkhkozak4',label:'@tiktok.comkhkozak4',url:'https://www.tiktok.com/@tiktok.comkhkozak4'}
];
const IDEAS=[
 'PUBG: найкращий момент за сьогодні — короткий кліп на 15 секунд',
 'Челендж: виграй бій лише зі зброєю, яку знайдеш першою',
 'До / після: невдалий пуш і як треба було зіграти',
 'Три поради новачкам PUBG Mobile за 20 секунд',
 'Найсмішніший момент із рандомними тіммейтами',
 'Клатч 1 проти 3: залиш звук гри та реакцію',
 'Мій улюблений лут на Erangel — швидкий рейтинг',
 'Перевірка міфу PUBG: покажи результат у кліпі',
 'POV: залишився останнім у загоні',
 'Порівняй дві зброї в короткому тесті',
 'Фейл дня з підписом і неочікуваним фіналом',
 'Покажи налаштування керування, які тобі зручні',
 'Зроби монтаж із трьох найкращих фрагів',
 'Відповідь на коментар глядача через ігровий кліп',
 'Мінігайд: як не програти першу перестрілку'
];
const STORE='khkozak_creator_studio_v1';
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
let state={posted:[],ideaIndex:-1,lastIdea:''};
try{state={...state,...JSON.parse(localStorage.getItem(STORE)||'{}')};if(!Array.isArray(state.posted))state.posted=[]}catch{}
const today=()=>new Date().toISOString().slice(0,10);
function save(){try{localStorage.setItem(STORE,JSON.stringify(state))}catch{}renderStats()}
function escapeHtml(s){return String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))}
function studioMarkup(){return '<section id="khCreatorStudio" class="kh-creator-studio"><div class="kh-creator-head"><div><div class="eyebrow muted">KH CREATOR LAB / 9.5.2</div><h2>Твоя Creator Studio <span>✦</span></h2><p>Два профілі, відео та план контенту — в одному місці.</p></div><div class="kh-creator-live"><i></i> TIKTOK CONNECT</div></div><div class="kh-creator-profiles">'+PROFILES.map((p,i)=>'<article class="kh-creator-profile"><div class="kh-creator-logo">♪</div><div class="kh-creator-profile-info"><small>ПРОФІЛЬ '+(i+1)+'</small><b>'+p.label+'</b><span>Офіційна сторінка TikTok</span></div><button type="button" class="kh-creator-action '+(i?'secondary':'')+'" data-khc-open="'+i+'">ВІДКРИТИ ↗</button><button type="button" class="kh-creator-copy" data-khc-copy="'+i+'" aria-label="Скопіювати посилання профілю" title="Скопіювати посилання">▣</button></article>').join('')+'</div><div class="kh-creator-tools"><article class="kh-creator-tool"><div class="kh-creator-tool-title"><span>🎬</span><div><small>CONTENT PLANNER</small><h3>Ідея для наступного відео</h3></div></div><p id="khCreatorIdea" class="kh-creator-idea">Натисни кнопку — підберу ідею для нового кліпу.</p><div class="kh-creator-buttons"><button type="button" id="khCreatorNewIdea" class="kh-creator-action">🎲 НОВА ІДЕЯ</button><button type="button" id="khCreatorCopyIdea" class="kh-creator-action secondary">СКОПІЮВАТИ</button></div></article><article class="kh-creator-tool kh-creator-tracker"><div class="kh-creator-tool-title"><span>📈</span><div><small>LOCAL TRACKER</small><h3>Мій контент-ритм</h3></div></div><div class="kh-creator-stats"><div><b id="khCreatorToday">0</b><span>опубліковано сьогодні</span></div><div><b id="khCreatorTotal">0</b><span>відміток загалом</span></div></div><button type="button" id="khCreatorPosted" class="kh-creator-action">✓ Я ОПУБЛІКУВАВ ВІДЕО</button><p class="kh-creator-note" id="khCreatorNote">Позначка зберігається тільки на цьому пристрої — перегляди та підписники автоматично не зчитуються.</p></article></div><div class="kh-creator-refresh-row"><div><b>Стрічка відео</b><span id="khCreatorFeedStatus">Відкрий вкладку, щоб завантажити вбудовані стрічки.</span></div><button type="button" id="khCreatorRefresh" class="kh-creator-action secondary">↻ ОНОВИТИ СТРІЧКИ</button></div></section>'}
function renderStats(){const todayCount=state.posted.filter(x=>x.date===today()).length;const a=$('#khCreatorToday'),b=$('#khCreatorTotal');if(a)a.textContent=todayCount;if(b)b.textContent=state.posted.length;const note=$('#khCreatorNote');if(note)note.textContent=todayCount?'Круто! Сьогодні вже позначено '+todayCount+' публікацію(ї).':'Позначай публікацію після того, як реально викладеш ролик.'}
function say(message){const el=$('#khCreatorFeedStatus');if(el)el.textContent=message}
function openProfile(i){const p=PROFILES[Number(i)];if(p)window.open(p.url,'_blank','noopener,noreferrer')}
async function copyText(text){try{await navigator.clipboard.writeText(text);return true}catch{try{window.prompt('Скопіюй посилання:',text)}catch{}return false}}
function loadEmbeds(force=false){const section=$('#tab-tiktok');if(!section)return;const quotes=$$('.tiktok-creator-feed blockquote.tiktok-embed',section);if(!quotes.length){say('Не знайшов блоки профілів — відкрий профіль через кнопку вище.');return}
if(force){quotes.forEach(q=>{const p=PROFILES.find(x=>q.getAttribute('data-unique-id')===x.id);if(!p)return;const fresh=document.createElement('blockquote');fresh.className='tiktok-embed';fresh.setAttribute('cite',p.url);fresh.setAttribute('data-unique-id',p.id);fresh.setAttribute('data-embed-type','creator');fresh.style.maxWidth='720px';fresh.style.minWidth='288px';fresh.innerHTML='<section><a target="_blank" rel="noopener noreferrer" href="'+p.url+'">'+p.label+'</a></section>';q.replaceWith(fresh)})}
const old=$('script[data-kh-tiktok-embed]');if(old)old.remove();const script=document.createElement('script');script.async=true;script.dataset.khTiktokEmbed='';script.src='https://www.tiktok.com/embed.js';script.onload=()=>say('Запит на офіційні вбудовані стрічки надіслано. Якщо вони заблоковані браузером, відкрий профіль кнопкою вище.');script.onerror=()=>say('TikTok не завантажив вбудовану стрічку. Офіційні профілі залишаються доступні кнопками вище.');document.body.append(script);say('Оновлюю офіційні віджети TikTok…')}
function init(){const tab=$('#tab-tiktok');if(!tab)return;if(!$('#khCreatorStudio')){const heading=$('.page-heading',tab);if(heading)heading.insertAdjacentHTML('afterend',studioMarkup());else tab.insertAdjacentHTML('afterbegin',studioMarkup())}
$('#khCreatorNewIdea')?.addEventListener('click',()=>{let i=Math.floor(Math.random()*IDEAS.length);if(IDEAS.length>1&&i===state.ideaIndex)i=(i+1)%IDEAS.length;state.ideaIndex=i;state.lastIdea=IDEAS[i];const el=$('#khCreatorIdea');if(el)el.textContent=state.lastIdea;save()});
$('#khCreatorCopyIdea')?.addEventListener('click',async()=>{const idea=state.lastIdea||$('#khCreatorIdea')?.textContent||'';if(!idea||idea.startsWith('Натисни кнопку')){say('Спочатку згенеруй ідею для відео.');return}await copyText(idea);say('Ідею підготовлено для копіювання.')});
$('#khCreatorPosted')?.addEventListener('click',()=>{if(state.posted.some(x=>x.date===today())){say('На сьогодні вже є позначка публікації. Гарного монтажу!');return}state.posted.push({date:today(),at:Date.now()});save();say('Публікацію відмічено! Це особистий лічильник, не статистика TikTok.')});
$('#khCreatorRefresh')?.addEventListener('click',()=>loadEmbeds(true));
$$('[data-khc-open]').forEach(b=>b.addEventListener('click',()=>openProfile(b.dataset.khcOpen)));
$$('[data-khc-copy]').forEach(b=>b.addEventListener('click',async()=>{await copyText(PROFILES[Number(b.dataset.khcCopy)].url);say('Посилання на профіль підготовлено для копіювання.')}));
renderStats();
let lastActive=false;const check=()=>{const active=tab.classList.contains('active');if(active&&!lastActive){loadEmbeds(false)}lastActive=active};new MutationObserver(check).observe(tab,{attributes:true,attributeFilter:['class']});document.addEventListener('visibilitychange',()=>{if(!document.hidden&&tab.classList.contains('active'))say('Повернувся до Creator Studio. За потреби натисни «Оновити стрічки».')});check();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();