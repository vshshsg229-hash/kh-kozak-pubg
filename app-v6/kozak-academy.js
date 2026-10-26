/* Kozak Academy prototype: offline learning tasks, local badges, and idempotent XP rewards through the existing profile API. */
/* Rewards use unique IDs so a refresh cannot grant XP twice for the same question. */
/* The module is intentionally mounted in the existing progress panel to keep navigation stable. */
(()=>{'use strict';
const KEY='khkozak_academy_v1';
const XP_PREFIX='academy-v1-q-';
const questions=[
{id:'logic-1',category:'Логіка',question:'У кімнаті горіло 3 свічки. Дві загасили. Скільки свічок залишилося?',options:['1','2','3','0'],answer:2,explanation:'Усі три свічки залишилися, навіть якщо дві вже не горять.'},
{id:'math-1',category:'Математика',question:'Скільки буде 15 + 27?',options:['32','42','43','52'],answer:1,explanation:'15 + 20 = 35, ще +7 = 42.'},
{id:'language-1',category:'Українська мова',question:'Яке слово написано правильно?',options:['будьласка','будь-ласка','будь ласка','будь ласко'],answer:2,explanation:'Правильне написання — «будь ласка», окремо.'},
{id:'digital-1',category:'Цифрова безпека',question:'Незнайомець просить надіслати пароль від гри. Що робити?',options:['Надіслати, якщо він чемний','Не надсилати пароль','Надіслати лише частину','Опублікувати пароль у профілі'],answer:1,explanation:'Паролі не передають іншим людям. За потреби звернися до дорослого, якому довіряєш.'},
{id:'logic-2',category:'Логіка',question:'Що важче: кілограм заліза чи кілограм пір’я?',options:['Залізо','Пір’я','Однакова вага','Неможливо знати'],answer:2,explanation:'Кілограм — це однакова маса незалежно від матеріалу.'},
{id:'math-2',category:'Математика',question:'Половина від 86 — це…',options:['23','36','43','46'],answer:2,explanation:'86 ÷ 2 = 43.'},
{id:'digital-2',category:'Цифрова грамотність',question:'Як перевірити підозріле повідомлення про виграш?',options:['Одразу натиснути посилання','Переслати всім друзям','Перевірити джерело й не вводити дані','Ввести дані картки'],answer:2,explanation:'Не поспішай натискати посилання чи вводити особисті дані. Перевір інформацію через офіційне джерело.'},
{id:'logic-3',category:'Увага',question:'Продовж ряд: 2, 4, 8, 16, …',options:['18','24','30','32'],answer:3,explanation:'Кожне число множиться на 2, тому наступне — 32.'},
{id:'language-2',category:'Українська мова',question:'Обери український відповідник до слова «извинение».',options:['Вибачення','Пробаченнячко','Ізвинення','Вибачаю'],answer:0,explanation:'Нормативний український відповідник — «вибачення».'},
{id:'life-1',category:'Корисні звички',question:'Після тривалого сидіння за екраном найкраще…',options:['Не рухатися ще довше','Зробити коротку перерву й порухатися','Збільшити яскравість до максимуму','Пропустити відпочинок'],answer:1,explanation:'Короткі перерви та рух допомагають відпочити від екрана.'},
{id:'logic-4',category:'Логіка',question:'У забігу ти обігнав учасника, який був другим. Яке місце тепер у тебе?',options:['Перше','Друге','Третє','Четверте'],answer:1,explanation:'Ти посів його місце — друге.'},
{id:'digital-3',category:'Цифрова безпека',question:'Який пароль надійніший?',options:['123456','kozak','Password','Довга унікальна фраза з різних символів'],answer:3,explanation:'Використовуй довгий унікальний пароль і не повторюй його на різних сайтах.'}
];
const badges=[
{id:'first',name:'Перший крок',icon:'🌟',need:1,desc:'Правильно відповісти на перше завдання'},
{id:'curious',name:'Допитливий розум',icon:'🧠',need:3,desc:'Розв’язати 3 завдання'},
{id:'thinker',name:'Майстер логіки',icon:'🧩',need:6,desc:'Розв’язати 6 завдань'},
{id:'academy',name:'Зірка Academy',icon:'👑',need:questions.length,desc:'Завершити всі завдання прототипу'}
];
const $=s=>document.querySelector(s);
function read(){try{const v=JSON.parse(localStorage.getItem(KEY)||'{}');return {solved:Array.isArray(v.solved)?v.solved.filter(id=>questions.some(q=>q.id===id)):[],badges:Array.isArray(v.badges)?v.badges:[],current:typeof v.current==='string'?v.current:null,attempts:Number(v.attempts)||0,memoryFound:Array.isArray(v.memoryFound)?v.memoryFound:[],codeSolved:Array.isArray(v.codeSolved)?v.codeSolved:[],dailyClaim:typeof v.dailyClaim==='string'?v.dailyClaim:null}}catch{return {solved:[],badges:[],current:null,attempts:0,memoryFound:[],codeSolved:[],dailyClaim:null}}}
let state=read();
function save(){try{localStorage.setItem(KEY,JSON.stringify(state));return true}catch{return false}}
function unlocked(){return badges.filter(b=>state.solved.length>=b.need)}
function grantBadges(){for(const b of unlocked())if(!state.badges.includes(b.id))state.badges.push(b.id);save()}
function chooseNext(){const available=questions.filter(q=>!state.solved.includes(q.id));if(!available.length){state.current=null;save();return null}const next=available[Math.floor(Math.random()*available.length)];state.current=next.id;save();return next}
function esc(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
let mode='quest',memoryCards=[],memoryOpen=[],memoryBusy=false,codeFeedback='';
const memoryPairs=[
{id:'word',icon:'📚',label:'КНИГА'},
{id:'sun',icon:'☀️',label:'СОНЦЕ'},
{id:'heart',icon:'❤️',label:'ДОБРО'},
{id:'shield',icon:'🛡️',label:'БЕЗПЕКА'},
{id:'star',icon:'⭐',label:'ЗІРКА'},
{id:'brain',icon:'🧠',label:'РОЗУМ'}
];
const codeTasks=[
{id:'riddle-1',title:'Загадка лісу',question:'Без рук, без ніг, а малювати вміє. Що це?',options:['Вітер','Мороз','Кіт'],answer:1,tip:'Узимку він малює візерунки на вікнах.'},
{id:'riddle-2',title:'Код космічної станції',question:'Яке число пропущено: 3, 6, 9, __?',options:['10','12','15'],answer:1,tip:'Щоразу додаємо три.'},
{id:'riddle-3',title:'Таємниця козачка',question:'Що потрібно зробити, якщо незнайомець просить твій пароль?',options:['Поділитися','Надіслати другу','Не надсилати й сказати дорослому'],answer:2,tip:'Пароль — секрет, навіть якщо просять дуже ввічливо.'}
];
function shuffle(items){return items.slice().sort(()=>Math.random()-.5)}
function localDay(){const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
function hasSolvedCode(id){return state.codeSolved.includes(id)}
function awardXP(id,xp){const api=window.khkozakProgression;if(!api||typeof api.awardChallenge!=='function')return false;const result=api.awardChallenge(id,0,xp);return !!result.ok||result.reason==='already-claimed'}
function buildMemory(){memoryCards=shuffle(memoryPairs.flatMap(p=>[{id:p.id,side:'icon',face:p.icon,key:p.id+'-icon'},{id:p.id,side:'word',face:p.label,key:p.id+'-word'}]));memoryOpen=[];memoryBusy=false}
function render(){
 let host=$('#khAcademy');if(!host){const panel=$('#tab-academy')||$('#tab-progress');if(!panel)return;host=document.createElement('section');host.id='khAcademy';host.className='kha-panel';panel.appendChild(host)}
 const done=state.solved.length,all=questions.length,q=(mode==='quest'?questions.find(x=>x.id===state.current&&!state.solved.includes(x.id)):null);
 if(mode==='quest'&&!q&&done<all)state.current=chooseNext()?.id||null;
 const activeQ=mode==='quest'?(questions.find(x=>x.id===state.current&&!state.solved.includes(x.id))||null):null;
 const earned=badges.filter(b=>state.badges.includes(b.id));
 const today=localDay(),dailyDone=state.dailyClaim===today;
 const modeButton=(id,icon,label,sub)=>'<button type="button" class="kha-mode '+(mode===id?'is-active':'')+'" data-kha-mode="'+id+'"><span>'+icon+'</span><b>'+label+'</b><small>'+sub+'</small></button>';
 let activity='';
 if(mode==='quest'){
 activity=activeQ?'<article class="kha-question"><div class="kha-category">'+esc(activeQ.category)+'</div><h3>'+esc(activeQ.question)+'</h3><div class="kha-options">'+activeQ.options.map((o,i)=>'<button type="button" class="kha-option" data-kha-answer="'+i+'">'+esc(o)+'</button>').join('')+'</div><p class="kha-feedback" id="khaFeedback" aria-live="polite">Обери відповідь і зароби 15 XP! ✨</p><div class="kha-actions"><button type="button" class="kha-next" data-kha-next disabled>Наступне завдання ↗</button></div></article>':'<article class="kha-complete"><span>🏆</span><h3>Місія пройдена!</h3><p>Ти виконав усі завдання цієї добірки. Можна тренуватися ще або перейти до іншої пригоди.</p><button type="button" class="kha-next" data-kha-replay>Спробувати мінігру 🎮</button></article>';
 }else if(mode==='memory'){
 if(!memoryCards.length)buildMemory();
 activity='<article class="kha-game"><div class="kha-game-heading"><div><span class="kha-category">🧠 ТРЕНУВАННЯ ПАМ’ЯТІ</span><h3>Знайди пару!</h3><p>Поєднай картинку зі словом. За кожну нову пару — 5 XP.</p></div><b class="kha-game-score">'+state.memoryFound.length+' / '+memoryPairs.length+' пар</b></div><div class="kha-memory-grid">'+memoryCards.map(c=>{const open=memoryOpen.includes(c.key)||state.memoryFound.includes(c.id);return '<button type="button" class="kha-memory-card '+(open?'is-revealed':'')+' '+(state.memoryFound.includes(c.id)?'is-matched':'')+'" data-kha-memory="'+c.id+'" data-kha-card="'+c.key+'" '+(state.memoryFound.includes(c.id)||memoryBusy?'disabled':'')+' aria-label="'+(open?esc(c.face):'Закрита картка')+'"><span>'+(open?esc(c.face):'❔')+'</span></button>'}).join('')+'</div><p class="kha-feedback" id="khaMemoryFeedback" aria-live="polite">'+(state.memoryFound.length===memoryPairs.length?'Усі пари знайдено! Справжній майстер пам’яті! 🏆':'Знайди 6 пар, щоб завершити гру.')+'</p><div class="kha-actions"><button type="button" class="kha-next" data-kha-memory-reset>Перемішати картки ↻</button></div></article>';
 }else if(mode==='code'){
 const task=codeTasks.find(t=>!hasSolvedCode(t.id));
 activity=task?'<article class="kha-game"><span class="kha-category">🔐 СЕКРЕТНА МІСІЯ</span><h3>'+esc(task.title)+'</h3><p class="kha-code-question">'+esc(task.question)+'</p><div class="kha-options">'+task.options.map((o,i)=>'<button type="button" class="kha-option" data-kha-code="'+i+'">'+esc(o)+'</button>').join('')+'</div><p class="kha-feedback" id="khaCodeFeedback" aria-live="polite">'+esc(codeFeedback||'Розшифруй завдання, щоб отримати 10 XP!')+'</p><div class="kha-code-progress">'+codeTasks.filter(t=>hasSolvedCode(t.id)).length+' із '+codeTasks.length+' секретів розкрито</div></article>':'<article class="kha-complete"><span>🗝️</span><h3>Код розшифровано!</h3><p>Ти пройшов усі секретні випробування. Твій розум — справжній суперінструмент!</p><button type="button" class="kha-next" data-kha-code-replay>Зіграти ще раз</button></article>';
 }else{
 activity='<article class="kha-game kha-treasure"><span class="kha-treasure-icon">'+(dailyDone?'🎉':'🎁')+'</span><span class="kha-category">ЩОДЕННИЙ СЮРПРИЗ</span><h3>'+(dailyDone?'Нагороду вже отримано!':'Скриня дня чекає на тебе!')+'</h3><p>'+(dailyDone?'Завітай завтра — на тебе чекатиме новий подарунок.':'Забирай щоденний бонус і повертайся завтра за новим!')+'</p><button type="button" class="kha-next" data-kha-daily '+(dailyDone?'disabled':'')+'>'+(dailyDone?'✓ БОНУС ЗАБРАНО':'ВІДКРИТИ СКРИНЮ · +10 XP')+'</button><div class="kha-reward-strip"><span>⭐ XP</span><span>🏅 Значки</span><span>🧩 Нові місії</span></div></article>';
 }
 host.innerHTML='<div class="kha-head"><div><span class="kha-eyebrow">KH么KOZAK / ПРИГОДА + НАВЧАННЯ</span><h2>🧭 СВІТ KOZAK ACADEMY</h2><p>Пройди місії, розгадай таємниці й збери нагороди. Кожна пригода триває лише кілька хвилин!</p></div><div class="kha-xp"><b>'+done+' / '+all+'</b><span>місій пройдено</span></div></div>'+
 '<div class="kha-companion"><span class="kha-mascot" aria-hidden="true">🧙‍♂️</span><div><b>Козачок-напарник</b><p>«Привіт, герою! Я підготував для тебе нові випробування. Спробуємо?»</p></div><span class="kha-companion-star">✨</span></div>'+
 '<div class="kha-progress" role="progressbar" aria-label="Прогрес Academy" aria-valuemin="0" aria-valuemax="'+all+'" aria-valuenow="'+done+'"><span style="width:'+(done/all*100)+'%"></span></div>'+
 '<div class="kha-stats"><span>⚡ '+(done*15+state.memoryFound.length*5+state.codeSolved.length*10+(state.dailyClaim===today?10:0))+' XP зароблено в академії*</span><span>🏅 '+earned.length+' / '+badges.length+' значків</span></div>'+
 '<div class="kha-mode-grid">'+modeButton('quest','🗺️','Місії','Запитання та логіка')+modeButton('memory','🧠','Знайди пару','Гра на пам’ять')+modeButton('code','🔐','Секретний код','Загадки й кмітливість')+modeButton('treasure','🎁','Скриня дня','Щоденний бонус')+'</div>'+
 activity+
 '<div class="kha-badges"><div class="kha-section-title"><h3>🏆 Колекція досягнень</h3><span>Збирай усі!</span></div><div class="kha-badge-grid">'+badges.map(b=>'<article class="kha-badge '+(state.badges.includes(b.id)?'is-earned':'')+'"><span>'+b.icon+'</span><b>'+esc(b.name)+'</b><small>'+esc(b.desc)+'</small><em>'+(state.badges.includes(b.id)?'ВІДКРИТО':b.need+' правильних')+'</em></article>').join('')+'</div></div>'+
 '<p class="kha-note">*Лічильник показує зароблені нагороди Academy. Прогрес зберігається лише на цьому пристрої; онлайн-акаунт не потрібен.</p>';
}
function answer(index){
 const q=questions.find(x=>x.id===state.current);if(!q||state.solved.includes(q.id))return;
 state.attempts++;
 const feedback=$('#khaFeedback');
 if(index!==q.answer){if(feedback)feedback.textContent='Ще спроба! Підказка: подумай уважно й обери інший варіант.';const buttons=$('#khAcademy')?.querySelectorAll('[data-kha-answer]');buttons?.forEach(b=>{b.classList.toggle('is-wrong',Number(b.dataset.khaAnswer)===index)});save();return}
 const api=window.khkozakProgression;
 if(!api||typeof api.awardChallenge!=='function'){if(feedback)feedback.textContent='Профіль ще завантажується. Зачекай мить і спробуй знову.';return}
 const result=api.awardChallenge(XP_PREFIX+q.id,0,15);
 if(!result.ok&&result.reason!=='already-claimed'){if(feedback)feedback.textContent='Не вдалося зберегти XP. Спробуй ще раз — відповідь не втрачена.';return}
 state.solved.push(q.id);grantBadges();save();
 const host=$('#khAcademy');host?.querySelectorAll('[data-kha-answer]').forEach(b=>{b.disabled=true;b.classList.remove('is-wrong');b.classList.toggle('is-correct',Number(b.dataset.khaAnswer)===q.answer)});host?.querySelector('[data-kha-next]')?.removeAttribute('disabled');
 if(feedback)feedback.textContent='Правильно! '+q.explanation+(result.ok?' +15 XP 🎉':' Завдання вже було зараховане, тому XP не нараховано повторно.');
 const stats=host?.querySelector('.kha-xp b');if(stats)stats.textContent=state.solved.length+' / '+questions.length;
 const progress=host?.querySelector('.kha-progress');if(progress){progress.setAttribute('aria-valuenow',String(state.solved.length));const fill=progress.querySelector('span');if(fill)fill.style.width=(state.solved.length/questions.length*100)+'%'}
 host?.querySelectorAll('.kha-badge').forEach((card,i)=>{const badge=badges[i];if(!badge)return;const earnedNow=state.badges.includes(badge.id);card.classList.toggle('is-earned',earnedNow);const label=card.querySelector('em');if(label)label.textContent=earnedNow?'ВІДКРИТО':badge.need+' правильних'});
 const bar=host?.querySelector('.kha-stats');if(bar)bar.innerHTML='<span>⚡ +15 XP за правильну відповідь</span><span>🏅 '+state.badges.length+' / '+badges.length+' значків</span>'}
function next(){if(state.current&&!state.solved.includes(state.current)){const feedback=$('#khaFeedback');if(feedback)feedback.textContent='Спершу дай правильну відповідь — тоді відкриється наступне завдання.';return}chooseNext();render()}
document.addEventListener('click',e=>{
 const modeButton=e.target.closest('[data-kha-mode]');if(modeButton){mode=modeButton.dataset.khaMode;codeFeedback='';if(mode==='memory'&&!memoryCards.length)buildMemory();render();return}
 const option=e.target.closest('[data-kha-answer]');if(option){answer(Number(option.dataset.khaAnswer));return}
 if(e.target.closest('[data-kha-next]')){next();return}
 if(e.target.closest('[data-kha-replay]')){mode='memory';buildMemory();render();return}
 const memory=e.target.closest('[data-kha-memory]');if(memory&&!memoryBusy){const key=memory.dataset.khaCard,id=memory.dataset.khaMemory;if(memoryOpen.includes(key)||state.memoryFound.includes(id))return;memoryOpen.push(key);render();if(memoryOpen.length===2){const cards=memoryOpen.map(k=>memoryCards.find(c=>c.key===k));if(cards[0].id===cards[1].id&&cards[0].side!==cards[1].side){const pairId=cards[0].id;state.memoryFound.push(pairId);awardXP('academy-memory-pair-'+pairId,5);memoryOpen=[];save();render()}else{memoryBusy=true;const feedback=$('#khaMemoryFeedback');if(feedback)feedback.textContent='Майже! Запам’ятай картки й спробуй ще раз.';window.setTimeout(()=>{memoryOpen=[];memoryBusy=false;render()},750)}}return}
 if(e.target.closest('[data-kha-memory-reset]')){buildMemory();render();return}
 const code=e.target.closest('[data-kha-code]');if(code){const task=codeTasks.find(t=>!hasSolvedCode(t.id));if(!task)return;const feedback=$('#khaCodeFeedback');if(Number(code.dataset.khaCode)!==task.answer){codeFeedback='Спробуй ще! Підказка: '+task.tip;if(feedback)feedback.textContent=codeFeedback;return}if(!awardXP('academy-code-'+task.id,10)){if(feedback)feedback.textContent='Зачекай секунду — профіль завантажується.';return}state.codeSolved.push(task.id);codeFeedback='Правильно! '+task.tip+' +10 XP 🎉';save();render();return}
 if(e.target.closest('[data-kha-code-replay]')){codeFeedback='';mode='code';render();return}
 if(e.target.closest('[data-kha-daily]')){const day=localDay();if(state.dailyClaim===day)return;if(!awardXP('academy-daily-'+day,10)){const feedback=$('#khAcademy .kha-treasure p');if(feedback)feedback.textContent='Зачекай секунду, профіль ще завантажується.';return}state.dailyClaim=day;save();render();return}
});
window.addEventListener('khkozak-profile-updated',()=>{const el=$('#khAcademy .kha-stats');if(el)el.setAttribute('data-profile-updated','true')});
function init(){render()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
const observer=new MutationObserver(()=>{if(($('#tab-academy')||$('#tab-progress'))&&!$('#khAcademy'))render()});observer.observe(document.documentElement,{childList:true,subtree:true});
})();