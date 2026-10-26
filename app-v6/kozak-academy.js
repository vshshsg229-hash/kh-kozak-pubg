/* Kozak Academy prototype: offline learning tasks, local badges, and idempotent XP rewards through the existing profile API. */
/* Rewards use unique IDs so a refresh cannot grant XP twice for the same question. */
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
function read(){try{const v=JSON.parse(localStorage.getItem(KEY)||'{}');return {solved:Array.isArray(v.solved)?v.solved.filter(id=>questions.some(q=>q.id===id)):[],badges:Array.isArray(v.badges)?v.badges:[],current:typeof v.current==='string'?v.current:null,attempts:Number(v.attempts)||0}}catch{return {solved:[],badges:[],current:null,attempts:0}}}
let state=read();
function save(){try{localStorage.setItem(KEY,JSON.stringify(state));return true}catch{return false}}
function unlocked(){return badges.filter(b=>state.solved.length>=b.need)}
function grantBadges(){for(const b of unlocked())if(!state.badges.includes(b.id))state.badges.push(b.id);save()}
function chooseNext(){const available=questions.filter(q=>!state.solved.includes(q.id));if(!available.length){state.current=null;save();return null}const next=available[Math.floor(Math.random()*available.length)];state.current=next.id;save();return next}
function esc(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function render(){
 let host=$('#khAcademy');if(!host){const panel=$('#tab-progress');if(!panel)return;host=document.createElement('section');host.id='khAcademy';host.className='kha-panel';panel.appendChild(host)}
 const done=state.solved.length,all=questions.length;let q=questions.find(x=>x.id===state.current);
 if(q&&state.solved.includes(q.id))q=null;
 if(!q&&done<all)q=chooseNext();
 grantBadges();
 const earned=badges.filter(b=>state.badges.includes(b.id));
 host.innerHTML='<div class="kha-head"><div><span class="kha-eyebrow">KH么KOZAK / LEARN & PLAY</span><h2>✦ KOZAK ACADEMY</h2><p>Логіка, мова, математика й цифрова безпека — навчайся у власному темпі.</p></div><div class="kha-xp"><b>'+done+' / '+all+'</b><span>завдань</span></div></div>'+
 '<div class="kha-progress" role="progressbar" aria-label="Прогрес Academy" aria-valuemin="0" aria-valuemax="'+all+'" aria-valuenow="'+done+'"><span style="width:'+(done/all*100)+'%"></span></div>'+
 '<div class="kha-stats"><span>⚡ XP нараховується за правильні відповіді</span><span>🏅 '+earned.length+' / '+badges.length+' значків</span></div>'+
 (q?'<article class="kha-question"><div class="kha-category">'+esc(q.category)+'</div><h3>'+esc(q.question)+'</h3><div class="kha-options">'+q.options.map((o,i)=>'<button type="button" class="kha-option" data-kha-answer="'+i+'" '+(state.solved.includes(q.id)?'disabled':'')+'>'+esc(o)+'</button>').join('')+'</div><p class="kha-feedback" id="khaFeedback" aria-live="polite">Обери відповідь — пояснення з’явиться одразу.</p><div class="kha-actions"><button type="button" class="kha-next" data-kha-next>Наступне завдання ↗</button></div></article>':'<article class="kha-complete"><span>🏆</span><h3>Усі завдання виконано!</h3><p>Ти пройшов усю першу добірку. Значки та XP збережені локально.</p><button type="button" class="kha-next" data-kha-replay>Повторити для тренування</button></article>')+
 '<div class="kha-badges"><div class="kha-section-title"><h3>Колекція значків</h3><span>Локальний прогрес</span></div><div class="kha-badge-grid">'+badges.map(b=>'<article class="kha-badge '+(state.badges.includes(b.id)?'is-earned':'')+'"><span>'+b.icon+'</span><b>'+esc(b.name)+'</b><small>'+esc(b.desc)+'</small><em>'+(state.badges.includes(b.id)?'ВІДКРИТО':b.need+' правильних')+'</em></article>').join('')+'</div></div>'+
 '<p class="kha-note">Без реєстрації та сервера. Прогрес Academy зберігається в цьому браузері. XP профілю використовує наявну систему KH么Kozak.</p>';
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
 const host=$('#khAcademy');host?.querySelectorAll('[data-kha-answer]').forEach(b=>{b.disabled=true;b.classList.toggle('is-correct',Number(b.dataset.khaAnswer)===q.answer)});
 if(feedback)feedback.textContent='Правильно! '+q.explanation+(result.ok?' +15 XP 🎉':' Завдання вже було зараховане, тому XP не нараховано повторно.');
 const stats=host?.querySelector('.kha-xp b');if(stats)stats.textContent=state.solved.length+' / '+questions.length;
 const progress=host?.querySelector('.kha-progress');if(progress){progress.setAttribute('aria-valuenow',String(state.solved.length));const fill=progress.querySelector('span');if(fill)fill.style.width=(state.solved.length/questions.length*100)+'%'}
 host?.querySelectorAll('.kha-badge').forEach((card,i)=>{const badge=badges[i];if(!badge)return;const earnedNow=state.badges.includes(badge.id);card.classList.toggle('is-earned',earnedNow);const label=card.querySelector('em');if(label)label.textContent=earnedNow?'ВІДКРИТО':badge.need+' правильних'});
 const bar=host?.querySelector('.kha-stats');if(bar)bar.innerHTML='<span>⚡ +15 XP за правильну відповідь</span><span>🏅 '+state.badges.length+' / '+badges.length+' значків</span>'}
function next(){chooseNext();render()}
document.addEventListener('click',e=>{
 const option=e.target.closest('[data-kha-answer]');if(option){answer(Number(option.dataset.khaAnswer));return}
 if(e.target.closest('[data-kha-next]')){next();return}
 if(e.target.closest('[data-kha-replay]')){state.current=null;next()}
});
window.addEventListener('khkozak-profile-updated',()=>{const el=$('#khAcademy .kha-stats');if(el)el.setAttribute('data-profile-updated','true')});
function init(){render()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
const observer=new MutationObserver(()=>{if($('#tab-progress')&&!$('#khAcademy'))render()});observer.observe(document.documentElement,{childList:true,subtree:true});
})();