(()=>{'use strict';
const root=document.querySelector('#tab-roblox');if(!root||root.dataset.rbReady)return;root.dataset.rbReady='1';
const KEY='khkozak_roblox_worlds_v1';
const games=[
{id:'fruits',icon:'🍈',title:'KOZAK FRUITS',sub:'ISLANDS · POWERS',desc:'Досліджуй острови, виконуй квести, бийся з босами й шукай рідкісні сили фруктів.',tags:['Острови','Боси','Здібності'],goal:'Знайди слід рідкісного фрукта й здолай охоронців острова.',steps:['Знайди карту острова','Виконай квест місцевого бійця','Збери енергію фрукта','Переможи охоронця','Забери силу фрукта'],reward:[65,85,70],mode:'tactics'},
{id:'doors',icon:'🚪',title:'KOZAK: NIGHT SHIFT',sub:'HORROR · SURVIVAL',desc:'Проходь випадкові кімнати, слухай звуки, ховайся від істот і розгадуй коди.',tags:['Жахи','Пастки','Ключі'],goal:'Дійди до виходу, не потрапивши в лапи нічної істоти.',steps:['Знайди ключ у кімнаті','Прислухайся до коридору','Сховайся від істоти','Розшифруй код дверей','Дістанься до ліфта'],reward:[75,95,80],mode:'memory'},
{id:'tower',icon:'🧗',title:'KOZAK TOWER',sub:'OBBY · TIME ATTACK',desc:'Подолай смугу перешкод, рухомі платформи та стрибки на час. Кожна спроба швидша.',tags:['Паркур','Таймер','Рекорди'],goal:'Піднімися на вершину неонової вежі.',steps:['Пройди стартові платформи','Перестрибни лазери','Знайди безпечний чекпойнт','Подолай рухомі блоки','Активуй вершину вежі'],reward:[55,80,65],mode:'aim'},
{id:'bedwars',icon:'🛏️',title:'KOZAK BED WARS',sub:'TEAM · BASE DEFENSE',desc:'Збирай ресурси, укріплюй базу, купуй спорядження та захищай своє ліжко.',tags:['Команди','База','Тактика'],goal:'Підготуй базу й прорви оборону суперників.',steps:['Збери залізо та блоки','Купи захисне спорядження','Укріпи ліжко команди','Знешкодь ворожий пост','Утримай базу до сигналу'],reward:[80,105,85],mode:'arena'},
{id:'nights',icon:'🌲',title:'KOZAK: 99 NIGHTS',sub:'FOREST · SURVIVAL',desc:'Збирай деревину, підтримуй вогонь, будуй укриття й переживай нічні хвилі монстрів.',tags:['Виживання','Крафт','Ночі'],goal:'Підготуй табір і переживи ніч у небезпечному лісі.',steps:['Назбирай деревини','Розпали захисне багаття','Створи просте укриття','Відбий атаку монстрів','Переживи світанок'],reward:[85,110,90],mode:'loot'},
{id:'brainrot',icon:'🧠',title:'BRAINROT RUSH',sub:'MEME HUNT · CHAOS',desc:'Лови дивні мем-персонажі, проходь хаотичні випробування та збирай колекцію brainrot.',tags:['Меми','Колекція','Рандом'],goal:'Збери мем-артефакти й переживи хаос brainrot-арени.',steps:['Знайди першого мемчика','Ухились від хаос-хвилі','Збери рідкісний мем-токен','Виконай абсурдне випробування','Зафіксуй мем у колекції'],reward:[70,90,80],mode:'reaction'},
{id:'tokens',icon:'🪙',title:'TOKEN RUSH',sub:'TOKEN TYCOON · ECONOMY',desc:'Збирай токени на маршруті, ризикуй заради рідкісних множників і міняй трофеї на нагороди хабу.',tags:['Токени','Множники','Обмін'],goal:'Збери жетони, обери ризиковий маршрут і достав токени до сховища.',steps:['Збери стартові токени','Обери маршрут із множником','Пройди токен-пастку','Забери золотий жетон','Достав токени до сховища'],reward:[90,120,100],mode:'loot'}
];
let data={completed:0,launches:0,tokens:0,best:0,unlocked:[]};try{data={...data,...JSON.parse(localStorage.getItem(KEY)||'{}')}}catch(_){}
let active=null,step=0,runTokens=0,stability=3;
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function save(){try{localStorage.setItem(KEY,JSON.stringify(data))}catch(_){}}
function render(){
root.innerHTML='<div class="rb-hero"><div class="rb-kicker">KH × ROBLOX-INSPIRED WORLDS</div><h1>ROBLOX <span>WORLDS</span></h1><p>Окремий портал ігрових світів у KH么Kozak Battle Hub. Обирай режим, проходь короткі місії та отримуй нагороди у спільний прогрес хабу. Це оригінальні браузерні мінірежими, а не підключення до Roblox.</p><div class="rb-top-stats"><div class="rb-stat"><b>'+Number(data.completed||0)+'</b> місій пройдено</div><div class="rb-stat"><b>'+Number(data.tokens||0)+'</b> токенів у сховищі</div><div class="rb-stat"><b>'+Number(data.best||0)+'</b> найкращий ланцюжок</div></div></div><div class="rb-section-title"><h2>ОБЕРИ СВІТ</h2><small>7 РЕЖИМІВ · ПРОГРЕС ЗБЕРІГАЄТЬСЯ</small></div><div class="rb-games">'+games.map(g=>'<article class="rb-card" data-game-id="'+g.id+'"><div class="rb-card-top"><div class="rb-icon">'+g.icon+'</div><div><h3>'+g.title+'</h3><div class="rb-subtitle">'+g.sub+'</div></div></div><p>'+g.desc+'</p><div class="rb-tags">'+g.tags.map(t=>'<span>'+t+'</span>').join('')+'</div><button class="rb-play" type="button" data-rb-start="'+g.id+'">ЗАПУСТИТИ РЕЖИМ ↗</button></article>').join('')+'</div><section class="rb-runner" id="rbRunner" hidden></section><div class="rb-section-title"><h2>ТВОЯ КОЛЕКЦІЯ</h2><small>LOCAL SAVE</small></div><div class="rb-records"><div class="rb-record"><b>'+Number(data.launches||0)+'</b><small>ЗАПУСКИ</small></div><div class="rb-record"><b>'+Number(data.unlocked?.length||0)+'</b><small>ВІДКРИТІ ЗНАКИ</small></div><div class="rb-record"><b>'+Number(data.best||0)+'/5</b><small>РЕКОРД МІСІЇ</small></div></div><div class="rb-tip">💡 Порада: проходь усі 7 світів — за кожну завершену місію нараховуються монети, очки та XP у профіль KH么Kozak. Токени з TOKEN RUSH зберігаються окремо й додають колекційний прогрес.</div>';
}
function start(id){active=games.find(g=>g.id===id);if(!active)return;step=0;runTokens=0;stability=3;data.launches=(Number(data.launches)||0)+1;save();const box=root.querySelector('#rbRunner');box.hidden=false;drawRunner('Твоя місія почалася. Обирай дію обережно!');box.scrollIntoView({behavior:'smooth',block:'start'});}
function drawRunner(message){
const box=root.querySelector('#rbRunner');if(!active||!box)return;
const finished=step>=active.steps.length;
box.innerHTML='<div class="rb-runner-head"><div><div class="rb-kicker">'+active.sub+'</div><h2>'+active.icon+' '+active.title+'</h2><p>'+active.goal+'</p></div><div class="rb-stat"><b>'+Math.min(step,5)+'/5</b> етапів · ❤️ '+stability+'</div></div><div class="rb-progress"><span style="width:'+(Math.min(step,5)/5*100)+'%"></span></div><div class="rb-run-log" aria-live="polite">'+esc(message)+(active.id==='tokens'?' <b>🪙 Токени цього забігу: '+runTokens+'</b>':'')+'</div>'+(finished?'<div class="rb-run-actions"><button class="rb-action" type="button" data-rb-claim="1">ЗАБРАТИ НАГОРОДУ ↗</button><button class="rb-quit" type="button" data-rb-close="1">ЗАКРИТИ</button></div>':'<div class="rb-run-actions"><button class="rb-action" type="button" data-rb-step="1">'+esc(active.steps[step])+' ↗</button><button class="rb-quit" type="button" data-rb-close="1">ВИЙТИ</button></div>')+'<p>Прогрес місії: '+step+' із 5. Дії та нагороди зберігаються на цьому пристрої.</p>';
}
function act(){
if(!active||step>=5)return;
const g=active;step++;let msg='';const roll=Math.random();
if(g.id==='tokens'){const gain=roll>.84?25:roll>.5?12:7;runTokens+=gain;msg=['Влучний збір!','Токен-пастку пройдено.','Золотий маршрут спрацював.'][Math.floor(Math.random()*3)]+' +'+gain+' токенів.'}
else if(g.id==='doors'&&roll<.24){stability--;msg='Небезпека поруч! Ти втратив одну спробу, але знайшов шлях далі. Залишилось ❤️ '+stability+'.'}
else if(g.id==='nights'&&roll<.28){stability--;msg='Нічна хвиля завдала шкоди, але укриття витримало. Залишилось ❤️ '+stability+'.'}
else if(g.id==='tower'&&roll<.22){msg='Ледь не зірвався, але чекпойнт урятував спробу. Продовжуй!'}
else if(g.id==='brainrot'){const memes=['Skibidi-артефакт','Sigma-жетон','Rizz-кристал','Meme Core','Ultra Brainrot'];msg='Хаос-сканер знайшов: '+memes[Math.floor(Math.random()*memes.length)]+'.'}
else msg=['Етап виконано!','Здобич зафіксовано — рухайся далі.','Чудова тактика. Шлях до нагороди відкрито.'][Math.floor(Math.random()*3)];
if(step===5)msg+=' Фінальний етап завершено — можна забрати нагороду!';
drawRunner(msg);
}
function claim(){
if(!active||step<5)return;const g=active;
const coins=g.reward[0]+Math.floor(runTokens/5),points=g.reward[1],xp=g.reward[2];
data.completed=(Number(data.completed)||0)+1;data.best=Math.max(Number(data.best)||0,5);if(!data.unlocked.includes(g.id))data.unlocked.push(g.id);if(g.id==='tokens')data.tokens=(Number(data.tokens)||0)+runTokens;
save();window.dispatchEvent(new CustomEvent('kh-bh3-finished',{detail:{mode:g.mode,coins,points,xp}}));
if(g.id==='tokens')window.dispatchEvent(new CustomEvent('khkozak-roblox-tokens',{detail:{tokens:runTokens,total:data.tokens}}));
const name=g.title;active=null;render();const box=root.querySelector('#rbRunner');box.hidden=false;box.innerHTML='<div class="rb-kicker">MISSION COMPLETE</div><h2>🏆 МІСІЮ ЗАВЕРШЕНО</h2><p>'+esc(name)+' · +'+coins+' монет · +'+points+' очок · +'+xp+' XP'+(g.id==='tokens'?' · 🪙 +'+runTokens+' токенів':'')+'</p><button class="rb-action" type="button" data-rb-close="1">ПОВЕРНУТИСЯ ДО СВІТІВ</button>';box.scrollIntoView({behavior:'smooth',block:'start'});
}
root.addEventListener('click',e=>{const s=e.target.closest('[data-rb-start]');if(s){start(s.dataset.rbStart);return}if(e.target.closest('[data-rb-step]')){act();return}if(e.target.closest('[data-rb-claim]')){claim();return}if(e.target.closest('[data-rb-close]')){active=null;const b=root.querySelector('#rbRunner');if(b)b.hidden=true;return}});
render();
})();