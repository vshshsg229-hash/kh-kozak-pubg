(()=>{'use strict';
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const KEY='khkozak_bh3_v1',TODAY=()=>new Date().toISOString().slice(0,10);
let data={favorites:[],recent:[],dailyChallenge:''};
try{data={...data,...JSON.parse(localStorage.getItem(KEY)||'{}')}}catch{}
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(data))}catch{}};
const games=[
{id:'aim',icon:'🎯',name:'Тренування прицілу',tag:'ТОЧНІСТЬ',desc:'Влучай у мішені 15 секунд. Працює з дотиком і мишею.',reward:'До +45 монет · +60 XP'},
{id:'reaction',icon:'⚡',name:'Дуель реакції',tag:'РЕАКЦІЯ',desc:'Три раунди: дочекайся сигналу й натисни миттєво.',reward:'До +40 монет · +55 XP'},
{id:'zone',icon:'🛡️',name:'Маршрут зони',tag:'ТАКТИКА',desc:'Проклади безпечну ротацію через п’ять етапів.',reward:'До +35 монет · +50 XP'},
{id:'code',icon:'🔐',name:'Злам сейфа',tag:'ПАМ’ЯТЬ',desc:'Запам’ятай послідовність доступу й повтори без помилок.',reward:'До +35 монет · +50 XP'}
];
function addStyles(){if($('#kh-bh3-style'))return;const l=document.createElement('link');l.id='kh-bh3-style';l.rel='stylesheet';l.href='battle-hub-3.css?v=16.65.0';document.head.appendChild(l)}
function injectGameHub(){
 const section=$('#tab-games');if(!section||$('#khBh3Hub'))return;addStyles();
 const hub=document.createElement('section');hub.id='khBh3Hub';hub.className='kh-bh3-hub';hub.innerHTML=
 '<div class="kh-bh3-head"><div><span class="kh-bh3-kicker">BATTLE HUB 3.0 · QUICK OPS</span><h2>Швидкий старт <span>без зайвих кліків</span></h2><p>Чотири короткі тренування, збережені ігри й швидкий повтор останнього запуску.</p></div><button type="button" class="kh-bh3-last" data-bh3-last>↻ ОСТАННЯ ГРА</button></div>'+
 '<div class="kh-bh3-tools"><label class="kh-bh3-search">⌕ <input id="khBh3Search" type="search" placeholder="Знайти тренування…" aria-label="Пошук тренувань"></label><div class="kh-bh3-filters" role="group" aria-label="Фільтр тренувань"><button type="button" class="active" data-bh3-filter="all">Усі</button><button type="button" data-bh3-filter="favorites">★ Збережені</button><button type="button" data-bh3-filter="recent">Останні</button></div></div>'+
 '<div class="kh-bh3-grid" id="khBh3Grid"></div><div class="kh-bh3-daily" id="khBh3Daily"></div>';
 const toolbar=$('#kh100Toolbar'),heading=section.querySelector('.page-heading');if(toolbar)toolbar.before(hub);else if(heading)heading.after(hub);else section.prepend(hub);
 renderGames();renderDaily();
 hub.addEventListener('click',e=>{
  const filter=e.target.closest('[data-bh3-filter]');if(filter){$$('[data-bh3-filter]').forEach(b=>b.classList.toggle('active',b===filter));renderGames(filter.dataset.bh3Filter);return}
  const fav=e.target.closest('[data-bh3-fav]');if(fav){const id=fav.dataset.bh3Fav;data.favorites=data.favorites.includes(id)?data.favorites.filter(x=>x!==id):[...data.favorites,id];save();renderGames(activeFilter());return}
  const play=e.target.closest('[data-bh3-play]');if(play){launch(play.dataset.bh3Play);return}
  if(e.target.closest('[data-bh3-last]')){launch(data.recent[0]||'aim');return}
  if(e.target.closest('[data-bh3-daily]'))launch(dailyGame());
 });
}
function activeFilter(){return $('[data-bh3-filter].active')?.dataset.bh3Filter||'all'}
function renderGames(filter='all'){
 const grid=$('#khBh3Grid');if(!grid)return;const q=($('#khBh3Search')?.value||'').toLowerCase();
 const list=games.filter(g=>(filter==='all'||(filter==='favorites'&&data.favorites.includes(g.id))||(filter==='recent'&&data.recent.includes(g.id)))&&(g.name+' '+g.tag+' '+g.desc).toLowerCase().includes(q));
 grid.innerHTML=list.length?list.map(g=>'<article class="kh-bh3-card"><div class="kh-bh3-card-top"><span>'+g.icon+'</span><button type="button" data-bh3-fav="'+g.id+'" aria-label="'+(data.favorites.includes(g.id)?'Прибрати зі збережених':'Зберегти гру')+'" class="'+(data.favorites.includes(g.id)?'is-fav':'')+'">'+(data.favorites.includes(g.id)?'★':'☆')+'</button></div><small>'+g.tag+'</small><h3>'+g.name+'</h3><p>'+g.desc+'</p><div class="kh-bh3-reward">'+g.reward+'</div><button class="kh-bh3-play" type="button" data-bh3-play="'+g.id+'">▶ ГРАТИ ЗАРАЗ</button></article>').join(''):'<div class="kh-bh3-empty">Нічого не знайдено. Зміни пошук або фільтр.</div>';
}
function dailyGame(){const key=TODAY();const ix=Math.abs([...key].reduce((n,c)=>n+c.charCodeAt(0),0))%games.length;return games[ix].id}
function renderDaily(){const el=$('#khBh3Daily');if(!el)return;const g=games.find(x=>x.id===dailyGame());el.innerHTML='<div><small>ОПЕРАЦІЯ ДНЯ · '+TODAY()+'</small><b>'+g.icon+' '+g.name+'</b><span>Виконай тренування дня. Результат і нагорода збережуться у прогресі хабу.</span></div><button type="button" data-bh3-daily>ПОЧАТИ ОПЕРАЦІЮ ↗</button>'}
let activeCleanup=[];
function cleanup(){activeCleanup.forEach(fn=>{try{fn()}catch{}});activeCleanup=[];const stage=$('#bh3Stage');if(stage)stage.style.position=''}
function openModal(id){
 const modal=$('#gameModal'),title=$('#modalTitle'),desc=$('#modalDesc'),eyebrow=$('#modalEyebrow'),area=$('#gameArea'),message=$('#gameMessage');
 if(!modal||!area)return;cleanup();const g=games.find(x=>x.id===id)||games[0];data.recent=[id,...data.recent.filter(x=>x!==id)].slice(0,4);save();renderGames(activeFilter());
 modal.classList.add('open');modal.setAttribute('aria-hidden','false');document.body.style.overflow='hidden';title.textContent=g.name;desc.textContent=g.desc;eyebrow.textContent='KH BATTLE HUB 3.0 / '+g.tag;message.textContent='';
 area.innerHTML='<div class="kh-bh3-game"><div class="kh-bh3-hud"><span id="bh3Score">ОЧКИ: 0</span><span id="bh3Time">ГОТОВИЙ</span></div><div class="kh-bh3-stage" id="bh3Stage"></div><p class="kh-bh3-feedback" id="bh3Feedback" aria-live="polite"></p></div>';
 const stage=$('#bh3Stage'),scoreEl=$('#bh3Score'),timeEl=$('#bh3Time'),feedback=$('#bh3Feedback');let score=0,done=false;const timers=[];
 activeCleanup=timers.map(()=>()=>{}); 
 const tick=(fn,ms)=>{const t=setInterval(fn,ms);timers.push(()=>clearInterval(t));return t},later=(fn,ms)=>{const t=setTimeout(fn,ms);timers.push(()=>clearTimeout(t));return t};
 activeCleanup=timers;
 const button=(label,fn,cls='')=>{const b=document.createElement('button');b.type='button';b.textContent=label;b.className=cls;b.addEventListener('click',fn);stage.appendChild(b);return b};
 const finish=(rawScore=score)=>{if(done)return;done=true;score=Math.max(0,Math.floor(rawScore));cleanup();timeEl.textContent='ЗАВЕРШЕНО';stage.innerHTML='<div class="kh-bh3-result"><strong>+'+score+' ОЧОК</strong><p>Тренування завершено. Результат можна покращити повторним запуском.</p><button type="button" class="kh-bh3-primary" id="bh3Claim">ЗАБРАТИ НАГОРОДУ</button></div>';$('#bh3Claim').addEventListener('click',()=>{const key='kh_bh3_reward_'+TODAY(),claims=readClaims(key);if(claims.includes(id)){feedback.textContent='Нагороду за це тренування сьогодні вже отримано.';return}claims.push(id);try{localStorage.setItem(key,JSON.stringify(claims))}catch{}const mode=id==='aim'?'aim':id==='reaction'?'reaction':id==='zone'?'arena':'memory';window.dispatchEvent(new CustomEvent('kh100-finished',{detail:{id:'bh3-'+id,mode,coins:12+Math.min(28,score),points:15+score,xp:20+Math.min(35,score),score}}));feedback.textContent='Нагороду зараховано до прогресу Battle Hub.';$('#bh3Claim').disabled=true;$('#bh3Claim').textContent='ЗАРАХОВАНО ✓'});};
 function readClaims(key){try{const v=JSON.parse(localStorage.getItem(key)||'[]');return Array.isArray(v)?v:[]}catch{return[]}}
 if(id==='aim'){
  let left=15,hits=0;timeEl.textContent=left+' СЕК';scoreEl.textContent='ВЛУЧАННЯ: 0';stage.style.position='relative';
  const spawn=()=>{if(done)return;stage.innerHTML='';const target=button('◎',()=>{hits++;score=hits*3;scoreEl.textContent='ВЛУЧАННЯ: '+hits;feedback.textContent='Влучно!';spawn()},'kh-bh3-target');target.style.left=(4+Math.random()*78)+'%';target.style.top=(5+Math.random()*72)+'%';target.style.position='absolute'};
  spawn();tick(()=>{left--;timeEl.textContent=left+' СЕК';if(left<=0)finish(hits)},1000);
 }else if(id==='reaction'){
  let round=0,total=0;function roundStart(){if(done)return;round++;if(round>3){finish(Math.max(0,Math.round(1000/Math.max(1,total/3))));return}stage.innerHTML='<p class="kh-bh3-instruction">Раунд '+round+'/3 — чекай зеленого сигналу. Не поспішай!</p>';const b=button('ЧЕКАЙ…',()=>{if(b.dataset.ready!=='yes'){done=true;cleanup();feedback.textContent='Фальстарт! Перезапусти дуель і дочекайся сигналу.';stage.innerHTML='<button class="kh-bh3-primary" id="bh3Restart">СПРОБУВАТИ ЩЕ</button>';$('#bh3Restart').onclick=()=>openModal('reaction');return}total+=Date.now()-Number(b.dataset.started);score=Math.max(0,Math.round(1200/(total/round)));scoreEl.textContent='РЕАКЦІЯ: '+Math.round(total/round)+' мс';feedback.textContent='Вчасно!';later(roundStart,650)},'kh-bh3-wait');later(()=>{if(done)return;b.dataset.ready='yes';b.dataset.started=String(Date.now());b.textContent='НАТИСНИ!';b.classList.add('is-ready')},900+Math.random()*2200)}roundStart();
 }else if(id==='zone'){
  let round=0,correct=0;const opts=['ПІВНІЧ · УКРИТТЯ','ЦЕНТР · ВІДКРИТА ДІЛЯНКА','ПІВДЕНЬ · РЕЛЬЄФ'];function next(){if(done)return;round++;if(round>5){feedback.textContent='Безпечні ротації: '+correct+'/5';finish(correct*8);return}const safe=Math.floor(Math.random()*3);stage.innerHTML='<p class="kh-bh3-instruction">Етап '+round+'/5 · зона стискається. Обери маршрут з укриттям.</p>';opts.forEach((label,i)=>button(label,()=>{if(done)return;if(i===safe){correct++;score+=8;feedback.textContent='Ротація вдала. +8';}else feedback.textContent='Маршрут небезпечний. Наступного разу перевір укриття.';scoreEl.textContent='БЕЗПЕЧНО: '+correct;later(next,500)},'kh-bh3-route'))}next();
 }else if(id==='code'){
  const symbols=['▲','◆','●','■','✦','⬟'];let round=0,sequence=[],step=0,correct=0;function show(){if(done)return;round++;if(round>3){finish(correct*12);return}sequence=Array.from({length:round+3},()=>symbols[Math.floor(Math.random()*symbols.length)]);step=0;stage.innerHTML='<p class="kh-bh3-instruction">Раунд '+round+'/3 · запам’ятай код</p><div class="kh-bh3-sequence">'+sequence.join('　')+'</div>';later(()=>{if(done)return;stage.innerHTML='<p class="kh-bh3-instruction">Повтори послідовність</p>';symbols.forEach(s=>button(s,()=>{if(done)return;if(s!==sequence[step]){feedback.textContent='Код помилковий. Раунд пропущено.';later(show,650);return}step++;if(step===sequence.length){correct++;score+=12;scoreEl.textContent='УСПІШНО: '+correct;feedback.textContent='Сейф відкрито!';later(show,650)}},'kh-bh3-symbol'))},1200)}show();
 }
}
function enhanceAssistant(){
 const form=$('#assistantForm'),box=$('#assistantMessages'),input=$('#assistantInput');if(!form||!box||!input||form.dataset.bh3Ready)return;form.dataset.bh3Ready='yes';
 const say=(text)=>{const bubble=document.createElement('div');bubble.className='assistant-bubble bot-bubble';bubble.textContent=text;box.appendChild(bubble);box.scrollTop=box.scrollHeight};
 const readProgress=()=>{try{return window.khkozakProgression?.snapshot?.()||{level:Number($('#assistantLevel')?.textContent)||1,coins:Number($('#assistantCoins')?.textContent)||0,xp:0}}catch{return{level:1,coins:0,xp:0}}};
 const reply=(raw)=>{const q=raw.toLowerCase(),p=readProgress();
 if(/статист|мій прогрес|скільки.*(монет|xp|рів)|мій рів/.test(q))return '📊 Твій поточний профіль: рівень '+p.level+', '+p.xp+' XP та '+p.coins+' монет. Прогрес зберігається в цьому браузері; для перенесення на інший пристрій зроби резервну копію в налаштуваннях.';
 if(/що грати|порадь гру|яку гру|гра дня|операці.*дня/.test(q))return '🎮 Моя рекомендація: '+(games.find(g=>g.id===dailyGame())?.name||'Тренування прицілу')+'. Це операція дня. Відкрий «Ігри та режими» → «Швидкий старт» і натисни «Почати операцію».';
 if(/керуван|телефон|мобільн|планшет|пк|комп.?ютер/.test(q))return '🕹️ На телефоні та планшеті використовуй великі кнопки й вертикальний список режимів. На ПК — клавіатуру, мишу та бічну панель; Ctrl+K відкриває швидкий пошук вкладок. Ігрові мінітренування працюють з дотиком і мишею.';
 if(/помил|не працю|баг|завис|не відкрива/.test(q))return '🧰 Швидке відновлення: 1) натисни «Оновити» у керуванні додатком; 2) перевір інтернет; 3) закрий і знову відкрий вкладку. Якщо баг лишився — відкрий керування додатком → «Діагностика» та збережи файл, але не надсилай паролі.';
 if(/челендж|виклик|challenge|рандом|ще/.test(q))return '🎯 Челендж від Козака: наступний матч — без стрільби з відкритої місцевості. Після кожної перестрілки зміни позицію, а перед ротацією перевір аптечки й дими. Після матчу зіграй «Маршрут зони» у швидкому старті.';
 if(/гра|ігри|тренув|приціл|реакці|зона|сейф|мінігр/.test(q))return '🎮 У «Швидкому старті» є чотири повноцінні короткі тренування: приціл, реакція, безпечна ротація й код сейфа. Збережи ★ улюблені режими, а вкладка «Останні» поверне до попередньої гри.';
 if(/нагород|монет|xp|рів|battle pass|пас/.test(q))return '💰 Заробляй нагороди за ігри, щоденні місії та дроп. Після завершення нового тренування натисни «Забрати нагороду» — повторна виплата за ту саму гру в той самий день блокується.';
 if(/музик|тікток|telegram|телеграм/.test(q))return '♫ Музика, TikTok і Telegram залишаються окремими вкладками в хабі. Відкривай їх через бічне меню або Ctrl+K на ПК.';
 return 'Йо, боєць 😎 Я Козак AI — ігровий напарник хабу. Можу порадити гру, дати челендж, пояснити нагороди, показати твій прогрес або допомогти з помилкою. Напиши, наприклад: «що грати сьогодні?»';
 };
 const send=text=>{const user=document.createElement('div');user.className='assistant-bubble user-bubble';user.textContent=text;box.appendChild(user);say(reply(text));box.scrollTop=box.scrollHeight};
 form.addEventListener('submit',e=>{e.preventDefault();e.stopImmediatePropagation();const text=input.value.trim();if(!text)return;send(text);input.value=''},true);
 $$('.assistant-chips [data-prompt]').forEach(btn=>btn.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();send(btn.dataset.prompt||btn.textContent)},true));
 const chips=$('.assistant-chips');if(chips&&!chips.querySelector('[data-bh3-prompt]')){[['Що грати сьогодні?','що грати сьогодні?'],['Мій прогрес','мій прогрес'],['Допоможи з багом','допоможи з багом']].forEach(([label,prompt])=>{const b=document.createElement('button');b.type='button';b.dataset.bh3Prompt=prompt;b.textContent=label;b.addEventListener('click',()=>send(prompt));chips.appendChild(b)})}
}
function addQuickNavigation(){const nav=$('.topbar');if(!nav||$('#khBh3NavHint'))return;const hint=document.createElement('button');hint.id='khBh3NavHint';hint.type='button';hint.className='kh-bh3-navhint';hint.textContent='⚡ Швидко';hint.title='Відкрити швидкий пошук розділів';hint.addEventListener('click',()=>{const b=$('#desktopCommandButton');if(b)b.click();else $('#mobileMenuToggle')?.click()});const before=nav.querySelector('.season');if(before)before.before(hint);else nav.prepend(hint)}
function init(){injectGameHub();enhanceAssistant();addQuickNavigation();$('#closeModal')?.addEventListener('click',cleanup);$('#gameModal')?.addEventListener('click',e=>{if(e.target.id==='gameModal')cleanup()});document.addEventListener('keydown',e=>{if(e.key==='Escape')cleanup()})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();