(()=> {
'use strict';
const $ = (s) => document.querySelector(s);
const store = {
  get(k, fallback='') { try { return localStorage.getItem('khkozak:'+k) ?? fallback; } catch { return fallback; } },
  set(k, v) { try { localStorage.setItem('khkozak:'+k, String(v)); } catch {} }
};
let toastTimer;
const toast = (message) => {
  const el = $('#toast');
  if (!el) return;
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2200);
};

/* Random PUBG challenge */
const challenges = [
  'Виграй матч без транспорту.',
  'Зіграй матч лише з двома видами зброї.',
  'Приземлись у новому для себе місці.',
  'Використовуй димову гранату для безпечної ротації.',
  'Зроби матч із незвичною для себе зброєю.',
  'Дійди до топ-10, уникаючи непотрібних перестрілок.',
  'Зіграй із другом і допомагай йому з лутом.',
  'Після кожного файту зміни позицію.',
  'Спробуй зіграти без прицілу 4x і вище.',
  'Зроби акцент на командній грі.'
];
const challengeEl = $('#mini-challenge');
$('#mini-challenge-next')?.addEventListener('click', () => {
  let next = challenges[Math.floor(Math.random() * challenges.length)];
  if (challenges.length > 1 && next === challengeEl?.textContent) {
    next = challenges[(challenges.indexOf(next) + 1) % challenges.length];
  }
  if (challengeEl) challengeEl.textContent = next;
  store.set('mini-challenge', next);
});
if (challengeEl && store.get('mini-challenge')) challengeEl.textContent = store.get('mini-challenge');

/* 1. Reaction test */
let reactionState = 'idle', reactionTimer = null, reactionStarted = 0;
const reactionPad = $('#reaction-pad');
const reactionStatus = $('#reaction-status');
const reactionScore = $('#reaction-score');
const reactionBest = $('#reaction-best');
const reactionBestValue = () => Number(store.get('reaction-best', '0')) || 0;
const showReactionBest = () => { if (reactionBest) reactionBest.textContent = reactionBestValue() ? reactionBestValue() + ' мс' : '—'; };
showReactionBest();

function startReaction() {
  clearTimeout(reactionTimer);
  reactionState = 'waiting';
  if (reactionScore) reactionScore.textContent = '—';
  if (reactionPad) {
    reactionPad.classList.remove('ready');
    reactionPad.classList.add('waiting');
    reactionPad.textContent = 'Чекай на зелений сигнал…';
  }
  if (reactionStatus) reactionStatus.textContent = 'Не натискай завчасно!';
  reactionTimer = setTimeout(() => {
    if (reactionState !== 'waiting') return;
    reactionState = 'ready';
    reactionStarted = performance.now();
    reactionPad?.classList.remove('waiting');
    reactionPad?.classList.add('ready');
    if (reactionPad) reactionPad.textContent = 'НАТИСКАЙ!';
    if (reactionStatus) reactionStatus.textContent = 'Зараз! Натисни якомога швидше.';
  }, 1200 + Math.random() * 2800);
}
$('#reaction-start')?.addEventListener('click', startReaction);
reactionPad?.addEventListener('click', () => {
  if (reactionState === 'idle') {
    if (reactionStatus) reactionStatus.textContent = 'Спочатку натисни «Старт».';
    return;
  }
  if (reactionState === 'waiting') {
    clearTimeout(reactionTimer);
    reactionState = 'idle';
    reactionPad.classList.remove('waiting');
    reactionPad.textContent = 'Фальстарт — спробуй ще';
    if (reactionStatus) reactionStatus.textContent = 'Фальстарт! Натисни «Старт» і спробуй знову.';
    return;
  }
  if (reactionState === 'ready') {
    const ms = Math.round(performance.now() - reactionStarted);
    rewardGame('reaction', 8, 10, 'Тест реакції завершено');
    reactionState = 'idle';
    reactionPad.classList.remove('ready');
    reactionPad.textContent = ms + ' мс — ще раз?';
    if (reactionScore) reactionScore.textContent = ms + ' мс';
    if (reactionStatus) reactionStatus.textContent = ms < 220 ? 'Блискавична реакція!' : ms < 300 ? 'Чудовий результат!' : 'Непогано — спробуй ще раз.';
    const old = reactionBestValue();
    if (!old || ms < old) {
      store.set('reaction-best', ms);
      showReactionBest();
      toast('Новий рекорд реакції!');
    }
  }
});

/* 2. Aim trainer */
let aimActive = false, aimCount = 0, aimLeft = 20, aimInterval = null;
const arena = $('#aim-arena'), target = $('#aim-target');
const aimScore = $('#aim-score'), aimTime = $('#aim-time'), aimBest = $('#aim-best'), aimStatus = $('#aim-status');
if (aimBest) aimBest.textContent = store.get('aim-best', '0');

function moveTarget() {
  if (!arena || !target) return;
  const margin = 28;
  const maxX = Math.max(margin, arena.clientWidth - margin);
  const maxY = Math.max(margin, arena.clientHeight - margin);
  target.style.left = (margin + Math.random() * Math.max(0, maxX - margin)) + 'px';
  target.style.top = (margin + Math.random() * Math.max(0, maxY - margin)) + 'px';
}
function finishAim() {
  clearInterval(aimInterval);
  rewardGame('aim', Math.min(30, Math.floor(aimCount / 2)), 15, 'Тренування прицілу завершено');
  addStat('aimHits', aimCount);
  aimActive = false;
  if (target) target.style.display = 'none';
  if (aimStatus) aimStatus.textContent = 'Час! Твій результат: ' + aimCount + ' влучань.';
  const best = Number(store.get('aim-best', '0')) || 0;
  if (aimCount > best) {
    store.set('aim-best', aimCount);
    if (aimBest) aimBest.textContent = String(aimCount);
    toast('Новий рекорд прицілу!');
  } else {
    toast('Тренування завершено!');
  }
}
$('#aim-start')?.addEventListener('click', () => {
  clearInterval(aimInterval);
  aimActive = true;
  aimCount = 0;
  aimLeft = 20;
  if (aimScore) aimScore.textContent = '0';
  if (aimTime) aimTime.textContent = '20';
  if (aimStatus) aimStatus.textContent = 'Влучай у ціль якомога швидше!';
  if (target) { target.style.display = 'block'; moveTarget(); }
  aimInterval = setInterval(() => {
    aimLeft -= 1;
    if (aimTime) aimTime.textContent = String(aimLeft);
    if (aimLeft <= 0) finishAim();
  }, 1000);
});
target?.addEventListener('click', (event) => {
  event.preventDefault();
  event.stopPropagation();
  if (!aimActive) return;
  aimCount += 1;
  if (aimScore) aimScore.textContent = String(aimCount);
  moveTarget();
});
arena?.addEventListener('click', (event) => {
  if (aimActive && event.target === arena && aimStatus) aimStatus.textContent = 'Повз! Ціль — маленьке коло.';
});

/* 3. Memory matching */
const symbols = ['🎯','🪖','💣','🧭','🔫','🎒','🛡️','🚁'];
const board = $('#memory-board'), movesEl = $('#memory-moves'), pairsEl = $('#memory-pairs'), memoryStatus = $('#memory-status'), memoryBest = $('#memory-best');
let firstCard = null, memoryLocked = false, moves = 0, pairs = 0, mismatchTimer = null;
function shuffle(items) {
  for (let i = items.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}
function setupMemory() {
  if (!board) return;
  clearTimeout(mismatchTimer);
  board.innerHTML = '';
  const deck = shuffle([...symbols, ...symbols]);
  firstCard = null; memoryLocked = false; moves = 0; pairs = 0;
  if (movesEl) movesEl.textContent = '0';
  if (pairsEl) pairsEl.textContent = '0';
  if (memoryStatus) memoryStatus.textContent = 'Знайди всі 8 пар!';
  deck.forEach((symbol, index) => {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'memory-card';
    card.textContent = '?';
    card.setAttribute('aria-label', 'Закрита картка ' + (index + 1));
    card.dataset.symbol = symbol;
    card.addEventListener('click', () => {
      if (memoryLocked || card.classList.contains('matched') || card.classList.contains('flipped')) return;
      card.classList.add('flipped');
      card.textContent = symbol;
      card.setAttribute('aria-label', symbol);
      if (!firstCard) { firstCard = card; return; }

      moves += 1;
      if (movesEl) movesEl.textContent = String(moves);
      const previous = firstCard;
      firstCard = null;
      if (previous.dataset.symbol === card.dataset.symbol) {
        previous.classList.add('matched');
        card.classList.add('matched');
        pairs += 1;
        if (pairsEl) pairsEl.textContent = String(pairs);
        if (pairs === symbols.length) {
          rewardGame('memory', 20, 25, 'Знайдено всі пари');
          addStat('memoryWins', 1);
          if (memoryStatus) memoryStatus.textContent = 'Перемога! Усі пари знайдено за ' + moves + ' ходів.';
          const best = Number(store.get('memory-best', '0')) || 0;
          if (!best || moves < best) {
            store.set('memory-best', moves);
            if (memoryBest) memoryBest.textContent = moves + ' ходів';
            toast('Новий рекорд пам’яті!');
          }
        } else if (memoryStatus) memoryStatus.textContent = 'Є пара! Продовжуй.';
      } else {
        memoryLocked = true;
        mismatchTimer = setTimeout(() => {
          previous.classList.remove('flipped');
          card.classList.remove('flipped');
          previous.textContent = '?';
          card.textContent = '?';
          previous.setAttribute('aria-label', 'Закрита картка');
          card.setAttribute('aria-label', 'Закрита картка');
          memoryLocked = false;
        }, 700);
      }
    });
    board.appendChild(card);
  });
  const best = Number(store.get('memory-best', '0')) || 0;
  if (memoryBest) memoryBest.textContent = best ? best + ' ходів' : '—';
}
$('#memory-reset')?.addEventListener('click', setupMemory);
setupMemory();

/* Coins, XP, achievements and title shop */
const rewardKey='rewards-v1';
const defaultRewardState={coins:0,xp:0,games:0,aimHits:0,memoryWins:0,reactionBest:0,daily:'',claimed:[],owned:['rookie'],equipped:'rookie'};
let rewardState; try{rewardState={...defaultRewardState,...JSON.parse(store.get(rewardKey,'{}'))};}catch{rewardState={...defaultRewardState};}
const titleItems=[
{id:'rookie',title:'🌱 Новачок',cost:0,desc:'Базовий титул для старту.',perks:['Стартовий титул','Доступ до всіх мініігор'],perk:{coins:0,xp:0,bonus:0}},
{id:'quick',title:'⚡ Реактивний',cost:100,desc:'Бонус за швидкість і реакцію.',perks:['+2 🪙 за тест реакції','+5% XP у мінііграх'],perk:{coins:2,xp:5,bonus:0}},
{id:'sharpshooter',title:'🎯 Точний стрілець',cost:150,desc:'Підтримка для майстрів прицілу.',perks:['+5 🪙 за завершення тиру','+10% XP у мінііграх'],perk:{coins:5,xp:10,bonus:0}},
{id:'memory',title:'🧠 Майстер пам’яті',cost:180,desc:'Бонус за зосередженість.',perks:['+5 🪙 за перемогу в пам’яті','+10% XP у мінііграх'],perk:{coins:5,xp:10,bonus:0}},
{id:'arcade',title:'👑 Король аркади',cost:300,desc:'Більше нагород за кожну гру.',perks:['+3 🪙 за будь-яку мінігру','+15% XP у мінііграх','Особливий стиль титулу'],perk:{coins:3,xp:15,bonus:0}},
{id:'legend',title:'🔥 Легенда KH',cost:500,desc:'Найвищий статус KH Arcade.',perks:['+5 🪙 за будь-яку мінігру','+25% XP у мінііграх','+5 🪙 до щоденного бонусу','Ексклюзивний стиль титулу'],perk:{coins:5,xp:25,bonus:5}}];
const achievements=[
{id:'first',icon:'🎮',title:'Перший запуск',desc:'Заверши будь-яку мінігру.',reward:15,test:s=>s.games>=1},
{id:'five',icon:'🕹️',title:'У розігріві',desc:'Заверши 5 мініігор.',reward:25,test:s=>s.games>=5},
{id:'ten',icon:'🏅',title:'Затятий гравець',desc:'Заверши 10 мініігор.',reward:40,test:s=>s.games>=10},
{id:'aim',icon:'🎯',title:'Перші 25 влучань',desc:'Набери сумарно 25 влучань у тирі.',reward:30,test:s=>s.aimHits>=25},
{id:'memory',icon:'🧠',title:'Гостра пам’ять',desc:'Виграй 3 гри на пошук пар.',reward:35,test:s=>s.memoryWins>=3},
{id:'xp',icon:'✨',title:'Досвідчений',desc:'Набери 250 XP.',reward:50,test:s=>s.xp>=250}];
function saveRewardState(){store.set(rewardKey,JSON.stringify(rewardState));}
function levelInfo(xp){return{level:Math.floor(xp/100)+1,current:xp%100};}
function checkAchievements(){let changed=false;achievements.forEach(a=>{if(!rewardState.claimed.includes(a.id)&&a.test(rewardState)){rewardState.claimed.push(a.id);rewardState.coins+=a.reward;changed=true;toast('Досягнення: '+a.title+' · +'+a.reward+' 🪙');}});if(changed)saveRewardState();}
function addStat(key,amount){rewardState[key]=(Number(rewardState[key])||0)+amount;saveRewardState();renderRewards();}
function rewardGame(type,coins,xp,message){const title=titleItems.find(t=>t.id===rewardState.equipped)||titleItems[0];let extraCoins=title.perk.coins||0;if(title.id==='quick'&&type!=='reaction')extraCoins=0;if(title.id==='sharpshooter'&&type!=='aim')extraCoins=0;if(title.id==='memory'&&type!=='memory')extraCoins=0;const titleBonus=(title.id==='arcade'?3:title.id==='legend'?5:0);const earnedCoins=coins+(title.id==='arcade'||title.id==='legend'?titleBonus:extraCoins);const earnedXp=Math.round(xp*(1+(title.perk.xp||0)/100));rewardState.games+=1;rewardState.coins+=earnedCoins;rewardState.xp+=earnedXp;saveRewardState();toast('+'+earnedCoins+' 🪙 · +'+earnedXp+' XP');renderRewards();}
function renderRewards(){
checkAchievements();
const info=levelInfo(rewardState.xp);
if($('#reward-coins'))$('#reward-coins').textContent=rewardState.coins.toLocaleString('uk-UA');
if($('#reward-level'))$('#reward-level').textContent='Рівень '+info.level+' · '+(info.level>=10?'Легенда':info.level>=5?'Ветеран':info.level>=3?'Боєць':'Новачок');
if($('#reward-xp-label'))$('#reward-xp-label').textContent=info.current+' / 100 XP до наступного рівня';
if($('#reward-total-label'))$('#reward-total-label').textContent=rewardState.xp+' XP загалом';
if($('#reward-level-fill'))$('#reward-level-fill').style.width=info.current+'%';
const equipped=titleItems.find(t=>t.id===rewardState.equipped)||titleItems[0];
if($('#equipped-title'))$('#equipped-title').textContent=equipped.title;
const today=new Date().toISOString().slice(0,10),daily=$('#daily-claim'),dailyStatus=$('#daily-status');
if(daily&&dailyStatus){const claimed=rewardState.daily===today;daily.disabled=claimed;daily.textContent=claimed?'Вже отримано ✓':'Забрати +25 🪙';dailyStatus.textContent=claimed?'Сьогоднішню нагороду вже забрано. Повертайся завтра!':'Щодня заходь і забирай 25 монет.';}
const ach=$('#achievement-list');
if(ach){ach.innerHTML='';achievements.forEach(a=>{const done=rewardState.claimed.includes(a.id),card=document.createElement('div');card.className='achievement'+(done?' complete':'');const icon=document.createElement('span');icon.className='achievement-icon';icon.textContent=a.icon;const copy=document.createElement('span');copy.className='achievement-copy';const strong=document.createElement('strong');strong.textContent=a.title;const small=document.createElement('small');small.textContent=a.desc;copy.append(strong,small);const reward=document.createElement('span');reward.className='achievement-reward';reward.textContent=done?'✓ Отримано':'+'+a.reward+' 🪙';card.append(icon,copy,reward);ach.appendChild(card);});}
const shop=$('#title-shop');
if(shop){shop.innerHTML='';titleItems.forEach(item=>{const owned=rewardState.owned.includes(item.id),isEquipped=rewardState.equipped===item.id,card=document.createElement('div');card.className='title-item'+(isEquipped?' is-equipped':'');const title=document.createElement('strong');title.textContent=item.title;const desc=document.createElement('small');desc.textContent=item.desc;const perks=document.createElement('ul');perks.className='title-perks';item.perks.forEach(perk=>{const li=document.createElement('li');li.textContent=perk;perks.appendChild(li);});const cost=document.createElement('span');cost.className='title-cost';cost.textContent=item.cost?'🪙 '+item.cost:'Безкоштовно';const btn=document.createElement('button');btn.type='button';btn.className='btn'+(isEquipped?'':' btn-primary');btn.textContent=isEquipped?'Обрано ✓':owned?'Одягнути титул':'Купити';btn.disabled=isEquipped||(!owned&&rewardState.coins<item.cost);btn.addEventListener('click',()=>{if(!rewardState.owned.includes(item.id)){if(rewardState.coins<item.cost)return;rewardState.coins-=item.cost;rewardState.owned.push(item.id);}rewardState.equipped=item.id;saveRewardState();renderRewards();toast('Титул активовано!');});card.append(title,desc,perks,cost,btn);shop.appendChild(card);});}
}
$('#daily-claim')?.addEventListener('click',()=>{const today=new Date().toISOString().slice(0,10);if(rewardState.daily===today)return;const dailyExtra=rewardState.equipped==='legend'?5:0;rewardState.daily=today;rewardState.coins+=25+dailyExtra;rewardState.xp+=5;saveRewardState();renderRewards();toast('Щоденна нагорода: +'+(25+dailyExtra)+' 🪙');});
renderRewards();


/* Classic / Metro Royale visual mode and extraction mini-game. */
const modeRoot=$('#game-grid');
const modeDescription=$('#game-mode-description');
const modeButtons=[...document.querySelectorAll('[data-game-mode]')];
const modeCopy={classic:'Тренуй реакцію та точність, наче перед класичним матчем.',metro:'Metro Royale: лутайся, оцінюй ризик і вчасно евакуюйся. Увімкнено темнішу тактичну тему та спеціальний рейд.'};
modeButtons.forEach(btn=>btn.addEventListener('click',()=>{const mode=btn.dataset.gameMode;modeButtons.forEach(b=>{const active=b===btn;b.classList.toggle('active',active);b.querySelector('b').textContent=active?'Обрано ✓':'Обрати режим →'});if(modeRoot)modeRoot.dataset.mode=mode;if(modeDescription)modeDescription.textContent=modeCopy[mode];if(mode==='metro'&&challengeEl)challengeEl.textContent='Metro Royale: знайди цінний лут і евакуюйся живим.';}));
let metroLoot=0,metroTurns=0,metroEnded=false;
const metroLootEl=$('#metro-loot'),metroTurnsEl=$('#metro-turns'),metroResult=$('#metro-result'),metroSearch=$('#metro-search'),metroExtract=$('#metro-extract');
function renderMetro(){if(metroLootEl)metroLootEl.textContent=String(metroLoot);if(metroTurnsEl)metroTurnsEl.textContent=String(metroTurns);if(metroSearch)metroSearch.disabled=metroEnded||metroTurns>=5;if(metroExtract)metroExtract.disabled=metroEnded||metroLoot<=0;}
function resetMetro(){metroLoot=0;metroTurns=0;metroEnded=false;if(metroResult)metroResult.textContent='Ти на вході до метро. Шукай лут, але стеж за ризиком!';renderMetro();}
metroSearch?.addEventListener('click',()=>{if(metroEnded||metroTurns>=5)return;metroTurns++;const roll=Math.random();if(roll<.2){metroLoot=0;metroEnded=true;if(metroResult)metroResult.textContent='Засідка! Лут втрачено, рейд завершено. Спробуй ще раз.';toast('Рейд провалено — наступного разу обережніше.');}else{const found=roll>.82?100:roll>.58?55:25;metroLoot+=found;if(metroResult)metroResult.textContent='Знайдено '+found+' монет вартості луту. '+(metroTurns>=5?'Шлях далі закритий — час евакуюватися!':'Продовжити пошук чи забрати лут?');}renderMetro();});
metroExtract?.addEventListener('click',()=>{if(metroEnded||metroLoot<=0)return;const earned=Math.max(5,Math.floor(metroLoot/5));rewardGame('metro',earned,10,'Metro Royale: успішна евакуація');metroEnded=true;if(metroResult)metroResult.textContent='Евакуація успішна! Ти забрав '+metroLoot+' вартості луту та отримав '+earned+' 🪙 на сайті.';toast('Евакуація успішна!');renderMetro();});
$('#metro-reset')?.addEventListener('click',resetMetro);renderMetro();
})();
/* Victor browser shooter: Classic survival and Metro loot/extraction */
(()=>{'use strict';
const canvas=document.getElementById('vg-canvas');if(!canvas)return;
const ctx=canvas.getContext('2d'),$=s=>document.querySelector(s);
const W=900,H=520;let mode='classic',running=false,ended=false,last=0,elapsed=0,spawnClock=0,fireClock=0,kills=0,loot=0,hp=100,bullets=[],enemies=[],crates=[],particles=[];
const player={x:W/2,y:H/2,r:16,speed:210,angle:0,invuln:0};
const keys=new Set(),touchMove=new Set();let pointer={x:W/2,y:H/2,down:false};
const overlay=$('#vg-overlay'),title=$('#vg-overlay-title'),desc=$('#vg-overlay-text'),startBtn=$('#vg-start');
const rand=(a,b)=>a+Math.random()*(b-a),clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function updateHud(){ $('#vg-hp').textContent=hp;$('#vg-ammo').textContent='∞';$('#vg-kills').textContent=kills;$('#vg-loot').textContent=mode==='metro'?loot+'/5':'—';$('#vg-time').textContent=String(Math.floor(elapsed/60)).padStart(2,'0')+':'+String(Math.floor(elapsed%60)).padStart(2,'0');}
function setMode(next){if(running)return;mode=next;document.querySelectorAll('[data-vg-mode]').forEach(b=>b.classList.toggle('active',b.dataset.vgMode===mode));$('#vg-tip').textContent=mode==='classic'?'Мета: 15 фрагів або вижити 60 секунд.':'Мета: збери 5 ящиків і дістанься зеленої точки евакуації.';title.textContent=mode==='classic'?'Віктор готовий до бою':'Metro Royale: рейд починається';desc.textContent=mode==='classic'?'Знищуй ворогів, ухиляйся від пострілів і протримайся 60 секунд.':'Збирай ящики з лутом, не дай ворогам оточити Віктора та дійди до точки евакуації.';draw();}
document.querySelectorAll('[data-vg-mode]').forEach(b=>b.addEventListener('click',()=>setMode(b.dataset.vgMode)));
function reset(){running=false;ended=false;elapsed=0;spawnClock=0;fireClock=0;kills=0;loot=0;hp=100;bullets=[];enemies=[];crates=[];particles=[];player.x=W/2;player.y=H/2;player.angle=0;player.invuln=0;
if(mode==='metro'){for(let i=0;i<7;i++)crates.push({x:rand(70,W-70),y:rand(65,H-65),got:false});}
updateHud();$('#vg-message').textContent=mode==='classic'?'Віктор готовий. Знищуй ворогів!':'Збери 5 ящиків і шукай евакуацію у верхньому правому куті.';overlay.classList.remove('hidden');title.textContent=mode==='classic'?'Віктор готовий до бою':'Metro Royale: рейд починається';desc.textContent=mode==='classic'?'Знищуй ворогів і виживи 60 секунд.':'Збирай 5 ящиків луту, а потім дійди до зеленої зони евакуації.';draw();}
function spawnEnemy(){const side=Math.floor(Math.random()*4);let x=side===0?0:side===1?W:rand(0,W),y=side===2?0:side===3?H:rand(0,H);enemies.push({x,y,r:14,hp:mode==='metro'?2:1,speed:rand(45,75)+(mode==='metro'?15:0),shoot:rand(.6,1.8),flash:0});}
function shoot(){if(!running)return;let targetEnemy=null,best=Infinity;for(const e of enemies){const d=Math.hypot(e.x-player.x,e.y-player.y);if(d<best){best=d;targetEnemy=e;}}let a=pointer.down?Math.atan2(pointer.y-player.y,pointer.x-player.x):(targetEnemy?Math.atan2(targetEnemy.y-player.y,targetEnemy.x-player.x):player.angle);player.angle=a;bullets.push({x:player.x+Math.cos(a)*20,y:player.y+Math.sin(a)*20,vx:Math.cos(a)*500,vy:Math.sin(a)*500,r:4,life:1.15,enemy:false});}
function finish(win,message){running=false;ended=true;overlay.classList.remove('hidden');title.textContent=win?'МІСІЮ ВИКОНАНО!':'Гру завершено';desc.textContent=message;startBtn.textContent='▶ Грати ще раз';$('#vg-message').textContent=message;if(win&&typeof window.khVictorReward==='function')window.khVictorReward(mode,kills,loot);draw();}
function update(dt){elapsed+=dt;spawnClock+=dt;fireClock-=dt;player.invuln=Math.max(0,player.invuln-dt);let dx=0,dy=0;if(keys.has('w')||keys.has('arrowup')||touchMove.has('up'))dy--;if(keys.has('s')||keys.has('arrowdown')||touchMove.has('down'))dy++;if(keys.has('a')||keys.has('arrowleft')||touchMove.has('left'))dx--;if(keys.has('d')||keys.has('arrowright')||touchMove.has('right'))dx++;if(dx||dy){const n=Math.hypot(dx,dy)||1;player.x=clamp(player.x+dx/n*player.speed*dt,22,W-22);player.y=clamp(player.y+dy/n*player.speed*dt,22,H-22);if(!pointer.down)player.angle=Math.atan2(dy,dx);}
if((keys.has(' ')||keys.has('f')||pointer.down)&&fireClock<=0){shoot();fireClock=.19;}
const spawnRate=mode==='classic'?Math.max(.45,1.5-elapsed*.012):1.25;if(spawnClock>spawnRate&&enemies.length<=(mode==='classic'?12:9)){spawnClock=0;spawnEnemy();}
for(let i=bullets.length-1;i>=0;i--){const b=bullets[i];b.x+=b.vx*dt;b.y+=b.vy*dt;b.life-=dt;if(b.life<=0||b.x<0||b.x>W||b.y<0||b.y>H){bullets.splice(i,1);continue;}if(!b.enemy){let hit=false;for(let j=enemies.length-1;j>=0;j--){const e=enemies[j];if(Math.hypot(e.x-b.x,e.y-b.y)<e.r+b.r){e.hp--;e.flash=.12;bullets.splice(i,1);hit=true;if(e.hp<=0){enemies.splice(j,1);kills++;for(let k=0;k<5;k++)particles.push({x:e.x,y:e.y,vx:rand(-80,80),vy:rand(-80,80),life:.4});if(mode==='metro'&&Math.random()<.35)crates.push({x:e.x,y:e.y,got:false});}break;}}if(hit)continue;}else if(Math.hypot(player.x-b.x,player.y-b.y)<player.r+b.r){bullets.splice(i,1);if(player.invuln<=0){hp-=8;player.invuln=.35;}continue;}}
for(const e of enemies){const a=Math.atan2(player.y-e.y,player.x-e.x),d=Math.hypot(player.x-e.x,player.y-e.y);if(d>player.r+e.r-2){e.x+=Math.cos(a)*e.speed*dt;e.y+=Math.sin(a)*e.speed*dt;}else if(player.invuln<=0){hp-=12;player.invuln=.55;}e.shoot-=dt;if(mode==='metro'&&e.shoot<=0&&d<260){e.shoot=rand(1.4,2.2);bullets.push({x:e.x,y:e.y,vx:Math.cos(a)*190,vy:Math.sin(a)*190,r:4,life:1.7,enemy:true});}e.flash=Math.max(0,e.flash-dt);}
if(mode==='metro'){for(const c of crates){if(!c.got&&Math.hypot(c.x-player.x,c.y-player.y)<26){c.got=true;loot++;$('#vg-message').textContent='Лут зібрано: '+loot+'/5';}}if(loot>=5&&Math.hypot(player.x-(W-72),player.y-72)<36){finish(true,'Успішна евакуація! Віктор виніс '+loot+' ящиків і знищив '+kills+' ворогів.');return;}}
for(let i=particles.length-1;i>=0;i--){const p=particles[i];p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt;if(p.life<=0)particles.splice(i,1);}
if(hp<=0){hp=0;updateHud();finish(false,'Віктор вибув. Фрагів: '+kills+'. Спробуй рухатися постійно й стріляти чергами.');return;}
if(mode==='classic'&&(kills>=15||elapsed>=60)){finish(true,kills>=15?'Перемога! Ти набрав 15 фрагів за '+Math.floor(elapsed)+' секунд.':'Ти вижив 60 секунд! Фрагів: '+kills+'.');return;}
updateHud();}
function drawSoldier(x,y,a,isPlayer=false,flash=0){ctx.save();ctx.translate(x,y);ctx.rotate(a);if(isPlayer){ctx.fillStyle='#0008';ctx.beginPath();ctx.ellipse(0,10,18,10,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#c47b42';ctx.beginPath();ctx.arc(0,-3,10,0,Math.PI*2);ctx.fill();ctx.fillStyle='#d5a078';ctx.beginPath();ctx.arc(2,-4,7,0,Math.PI*2);ctx.fill();ctx.fillStyle='#2b3525';ctx.fillRect(-10,3,20,20);ctx.fillStyle='#59694a';ctx.fillRect(-8,6,16,11);ctx.fillStyle='#b5ff4a';ctx.fillRect(-6,7,4,5);ctx.fillStyle='#25291f';ctx.fillRect(-8,19,6,9);ctx.fillRect(2,19,6,9);ctx.fillStyle='#30362a';ctx.fillRect(8,-2,20,5);ctx.fillStyle='#111';ctx.fillRect(18,-1,10,3);ctx.fillStyle='#d3b18c';ctx.fillRect(3,-6,7,3);}else{ctx.fillStyle=flash?'#fff':'#7e4130';ctx.beginPath();ctx.arc(0,0,13,0,Math.PI*2);ctx.fill();ctx.fillStyle='#382b25';ctx.fillRect(-10,-6,20,16);ctx.fillStyle='#a66d4c';ctx.fillRect(-5,-7,10,8);ctx.fillStyle='#25251f';ctx.fillRect(4,-2,19,4);}ctx.restore();}
function draw(){ctx.clearRect(0,0,W,H);ctx.fillStyle=mode==='metro'?'#161915':'#1c2719';ctx.fillRect(0,0,W,H);ctx.strokeStyle=mode==='metro'?'#b3a06c12':'#c5f4a00d';ctx.lineWidth=1;for(let x=0;x<W;x+=36){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}for(let y=0;y<H;y+=36){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}
for(let i=0;i<12;i++){const x=(i*173+55)%W,y=(i*97+25)%H;ctx.fillStyle=mode==='metro'?'#33372a':'#293923';ctx.fillRect(x,y,34,22);ctx.strokeStyle='#77805a55';ctx.strokeRect(x,y,34,22);}
if(mode==='metro'){ctx.fillStyle='#b5ff4a22';ctx.beginPath();ctx.arc(W-72,72,36,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#b5ff4a';ctx.lineWidth=3;ctx.beginPath();ctx.arc(W-72,72,28,0,Math.PI*2);ctx.stroke();ctx.fillStyle='#dfffad';ctx.font='bold 12px sans-serif';ctx.fillText('EVAC',W-92,76);}
for(const c of crates){if(c.got)continue;ctx.fillStyle='#d5a04a';ctx.fillRect(c.x-10,c.y-10,20,20);ctx.strokeStyle='#ffe2a1';ctx.lineWidth=2;ctx.strokeRect(c.x-10,c.y-10,20,20);ctx.fillStyle='#352818';ctx.fillRect(c.x-2,c.y-9,4,18);}
for(const b of bullets){ctx.fillStyle=b.enemy?'#ff6a4a':'#fff2a3';ctx.beginPath();ctx.arc(b.x,b.y,b.r,0,Math.PI*2);ctx.fill();}
for(const e of enemies)drawSoldier(e.x,e.y,Math.atan2(player.y-e.y,player.x-e.x),false,e.flash);
for(const p of particles){ctx.fillStyle='#b5ff4a';ctx.globalAlpha=Math.max(0,p.life*2);ctx.fillRect(p.x,p.y,4,4);ctx.globalAlpha=1;}
drawSoldier(player.x,player.y,player.angle,true);if(player.invuln>0){ctx.strokeStyle='#b5ff4a';ctx.lineWidth=2;ctx.beginPath();ctx.arc(player.x,player.y,23,0,Math.PI*2);ctx.stroke();}
ctx.fillStyle='#e9f3df';ctx.font='bold 13px sans-serif';ctx.fillText('VICTOR',player.x-23,player.y-28);
if(!running&&!overlay.classList.contains('hidden')){ctx.fillStyle='#fff8';ctx.font='bold 15px sans-serif';ctx.fillText(mode==='classic'?'CLASSIC BATTLE':'METRO ROYALE RAID',18,28);}}
function frame(now){if(!last)last=now;const dt=Math.min(.035,(now-last)/1000);last=now;if(running)update(dt);draw();requestAnimationFrame(frame);}
startBtn.addEventListener('click',()=>{reset();overlay.classList.add('hidden');running=true;ended=false;last=performance.now();$('#vg-message').textContent='Бій почався!';});
$('#vg-restart').addEventListener('click',reset);
document.addEventListener('keydown',e=>{const k=e.key.toLowerCase();if(['arrowup','arrowdown','arrowleft','arrowright',' '].includes(k))e.preventDefault();keys.add(k);});
document.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));
canvas.addEventListener('pointermove',e=>{const r=canvas.getBoundingClientRect();pointer.x=(e.clientX-r.left)/r.width*W;pointer.y=(e.clientY-r.top)/r.height*H;});
canvas.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse'){pointer.down=true;canvas.setPointerCapture?.(e.pointerId);}});
canvas.addEventListener('pointerup',()=>pointer.down=false);canvas.addEventListener('pointercancel',()=>pointer.down=false);
document.querySelectorAll('[data-vg-move]').forEach(btn=>{const dir=btn.dataset.vgMove;const down=e=>{e.preventDefault();touchMove.add(dir);};const up=e=>{e.preventDefault();touchMove.delete(dir);};btn.addEventListener('pointerdown',down);btn.addEventListener('pointerup',up);btn.addEventListener('pointerleave',up);btn.addEventListener('pointercancel',up);});
const fire=$('#vg-fire');fire.addEventListener('pointerdown',e=>{e.preventDefault();keys.add('f');});['pointerup','pointerleave','pointercancel'].forEach(ev=>fire.addEventListener(ev,()=>keys.delete('f')));
window.khVictorReward=(m,k,l)=>{try{rewardState.coins=(Number(rewardState.coins)||0)+(m==='metro'?Math.max(10,l*4):Math.max(8,k*2));rewardState.xp=(Number(rewardState.xp)||0)+Math.max(10,k*3+l*2);rewardState.games=(Number(rewardState.games)||0)+1;saveRewardState();renderRewards();toast('Нагорода за бой додана!');}catch{}};setMode('classic');reset();requestAnimationFrame(frame);
})();