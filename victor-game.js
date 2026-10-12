/* KH Survival Arena: Classic, Metro Royale and Zombie mode */
(()=>{'use strict';
const canvas=document.getElementById('vg-canvas');if(!canvas)return;
const ctx=canvas.getContext('2d'),$=s=>document.querySelector(s),W=900,H=520;
let mode='classic',running=false,last=0,elapsed=0,spawnClock=0,fireClock=0,kills=0,loot=0,hp=100,wave=1;
let bullets=[],enemies=[],crates=[],pickups=[],particles=[];
const player={x:W/2,y:H/2,r:16,speed:210,angle:0,invuln:0},keys=new Set(),touchMove=new Set();
let pointer={x:W/2,y:H/2,down:false};
const rand=(a,b)=>a+Math.random()*(b-a),clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const gearKey='khkozak:survival-gear-v1',recordKey='khkozak:survival-records-v1',rewardKey='khkozak:rewards-v1';
const defaultGear={helmet:1,armor:1,weapon:1,backpack:1,medkits:1,supplies:0};
let gear,records={};try{gear={...defaultGear,...JSON.parse(localStorage.getItem(gearKey)||'{}')};}catch{gear={...defaultGear};}
try{records=JSON.parse(localStorage.getItem(recordKey)||'{}');}catch{records={};}
const overlay=$('#vg-overlay'),title=$('#vg-overlay-title'),desc=$('#vg-overlay-text'),startBtn=$('#vg-start');
function wallet(){try{return {...{coins:0,xp:0,games:0,claimed:[],owned:['rookie'],equipped:'rookie'},...JSON.parse(localStorage.getItem(rewardKey)||'{}')};}catch{return {coins:0,xp:0,games:0,claimed:[],owned:['rookie'],equipped:'rookie'};}}
function saveGear(){try{localStorage.setItem(gearKey,JSON.stringify(gear));}catch{}}
function changeCoins(delta){const s=wallet();s.coins=Math.max(0,(Number(s.coins)||0)+delta);try{localStorage.setItem(rewardKey,JSON.stringify(s));}catch{}window.dispatchEvent(new CustomEvent('khkozak:rewards-updated',{detail:s}));renderGear();}
function noteGear(message){const el=$('#vg-inventory-note');if(el)el.textContent=message;}
function renderGear(){const s=wallet(),set=(id,v)=>{const el=document.getElementById(id);if(el)el.textContent=v;};
set('vg-helmet','Рівень '+gear.helmet);set('vg-armor','Рівень '+gear.armor);
set('vg-weapon',(gear.weapon>=4?'Groza':gear.weapon===3?'Beryl M762':gear.weapon===2?'AKM':'M416')+' · рів. '+gear.weapon);
set('vg-backpack','Рівень '+gear.backpack);set('vg-medkits',gear.medkits);set('vg-supplies',gear.supplies);
set('vg-coins',Number(s.coins||0).toLocaleString('uk-UA'));set('vg-record',records[mode]||0);set('vg-wave',wave);const total=Object.values(records).reduce((a,v)=>a+(Number(v)||0),0);const rank=total>=50?'Легенда':total>=30?'Золото':total>=15?'Срібло':total>=5?'Бронза':'Рекрут';set('vg-rank',rank);const perk=document.getElementById('vg-rank-perks');if(perk)perk.textContent=rank==='Легенда'?'👑 Легенда: +12 🪙 за перемогу та +10% XP у бойових режимах.':rank==='Золото'?'🥇 Золото: +8 🪙 за перемогу та +5% XP.':rank==='Срібло'?'🥈 Срібло: +5 🪙 за перемогу.':rank==='Бронза'?'🥉 Бронза: +2 🪙 за перемогу.':'🎖️ Рекрут: збирай лут і встановлюй рекорди, щоб відкрити бонуси.';}
function addRewardCoins(amount){changeCoins(amount);}
function spawnPickup(x=rand(50,W-50),y=rand(50,H-50),type){const types=['ammo','medkit','armor','weapon','coins','backpack'];pickups.push({x,y,type:type||types[Math.floor(Math.random()*types.length)],life:22});}
function pickUp(p){gear.supplies++;if(p.type==='ammo'){gear.supplies++;addRewardCoins(3);noteGear('Зібрано набої та +3 🪙.');}
else if(p.type==='medkit'){gear.medkits++;addRewardCoins(2);noteGear('Аптечку додано до рюкзака! +2 🪙.');}
else if(p.type==='armor'){gear.armor=Math.min(5,gear.armor+1);addRewardCoins(5);noteGear('Бронежилет покращено до рівня '+gear.armor+'!');}
else if(p.type==='weapon'){gear.weapon=Math.min(5,gear.weapon+1);addRewardCoins(6);noteGear('Знайдена зброя: рівень '+gear.weapon+'!');}
else if(p.type==='backpack'){gear.backpack=Math.min(5,gear.backpack+1);addRewardCoins(4);noteGear('Рюкзак покращено до рівня '+gear.backpack+'.');}
else{addRewardCoins(12);noteGear('Цінний лут: +12 🪙!');}saveGear();renderGear();}
function updateHud(){ $('#vg-hp').textContent=hp;$('#vg-ammo').textContent='∞';$('#vg-kills').textContent=kills;$('#vg-loot').textContent=mode==='metro'?loot+'/5':String(gear.supplies);$('#vg-time').textContent=String(Math.floor(elapsed/60)).padStart(2,'0')+':'+String(Math.floor(elapsed%60)).padStart(2,'0');renderGear();}
function setMode(next){if(running)return;mode=next;document.querySelectorAll('[data-vg-mode]').forEach(b=>{b.classList.toggle('active',b.dataset.vgMode===mode);b.setAttribute('aria-selected',String(b.dataset.vgMode===mode));});
$('#vg-tip').textContent=mode==='classic'?'Мета: 15 фрагів або вижити 60 секунд.':mode==='metro'?'Мета: зібрати 5 ящиків і евакуюватися.':'Мета: пережити хвилі зомбі та набрати 20 фрагів.';
title.textContent=mode==='classic'?'Класика: Віктор готовий':mode==='metro'?'Metro Royale: рейд починається':'Зомбі-режим: хвиля наближається';
desc.textContent=mode==='classic'?'Збирай спорядження, знищуй ворогів і протримайся 60 секунд.':mode==='metro'?'Шукай ящики, забирай цінний лут і дійди до точки евакуації.':'Зомбі стають швидшими з кожною хвилею. Рухайся, стріляй і не дай себе оточити.';
overlay.classList.remove('hidden');renderGear();draw();}
document.querySelectorAll('[data-vg-mode]').forEach(b=>b.addEventListener('click',()=>setMode(b.dataset.vgMode)));
function reset(){running=false;elapsed=0;spawnClock=0;fireClock=0;kills=0;loot=0;wave=1;hp=Math.min(150,100+gear.armor*5);bullets=[];enemies=[];crates=[];pickups=[];particles=[];player.x=W/2;player.y=H/2;player.angle=0;player.invuln=0;
for(let i=0;i<5;i++)spawnPickup();
if(mode==='metro')for(let i=0;i<7;i++)crates.push({x:rand(70,W-70),y:rand(65,H-65),got:false});
updateHud();$('#vg-message').textContent=mode==='classic'?'Знищуй ворогів і збирай предмети на полі.':mode==='metro'?'Збери 5 ящиків і дістанься зеленої точки евакуації.':'Виживай серед зомбі, підбирай аптечки та покращуй спорядження.';
overlay.classList.remove('hidden');title.textContent=mode==='classic'?'Класика: Віктор готовий':mode==='metro'?'Metro Royale: рейд починається':'Зомбі-режим: хвиля наближається';
desc.textContent=mode==='classic'?'15 фрагів або 60 секунд виживання.':mode==='metro'?'Збери 5 ящиків, потім рухайся до EVAC.':'Переможи 20 зомбі. З кожною хвилею вони швидші.';
startBtn.textContent='▶ Почати гру';renderGear();draw();}
function spawnEnemy(){const side=Math.floor(Math.random()*4),x=side===0?0:side===1?W:rand(0,W),y=side===2?0:side===3?H:rand(0,H);
enemies.push({x,y,r:mode==='zombie'?17:14,hp:mode==='metro'?2:mode==='zombie'?2+Math.floor(wave/3):1,speed:rand(45,75)+(mode==='metro'?15:mode==='zombie'?Math.min(65,wave*7):0),shoot:rand(.6,1.8),flash:0});}
function shoot(){if(!running)return;let target=null,best=Infinity;for(const e of enemies){const d=Math.hypot(e.x-player.x,e.y-player.y);if(d<best){best=d;target=e;}}
const a=pointer.down?Math.atan2(pointer.y-player.y,pointer.x-player.x):(target?Math.atan2(target.y-player.y,target.x-player.x):player.angle);player.angle=a;
bullets.push({x:player.x+Math.cos(a)*20,y:player.y+Math.sin(a)*20,vx:Math.cos(a)*(500+gear.weapon*18),vy:Math.sin(a)*(500+gear.weapon*18),r:4+Math.min(2,gear.weapon-1),life:1.15,damage:1+Math.floor((gear.weapon-1)/2),enemy:false});}
function finish(win,message){running=false;overlay.classList.remove('hidden');title.textContent=win?'МІСІЮ ВИКОНАНО!':'Гру завершено';desc.textContent=message;startBtn.textContent='▶ Грати ще раз';$('#vg-message').textContent=message;
const old=Number(records[mode]||0);if(kills>old){records[mode]=kills;try{localStorage.setItem(recordKey,JSON.stringify(records));}catch{}if(win){addRewardCoins(mode==='metro'?20:mode==='zombie'?25:15);noteGear('Новий рекорд! Додаткові монети нараховано.');}}
if(win&&typeof window.khVictorReward==='function')window.khVictorReward(mode,kills,loot);renderGear();draw();}
function update(dt){elapsed+=dt;spawnClock+=dt;fireClock-=dt;player.invuln=Math.max(0,player.invuln-dt);
let dx=0,dy=0;if(keys.has('w')||keys.has('arrowup')||touchMove.has('up'))dy--;if(keys.has('s')||keys.has('arrowdown')||touchMove.has('down'))dy++;if(keys.has('a')||keys.has('arrowleft')||touchMove.has('left'))dx--;if(keys.has('d')||keys.has('arrowright')||touchMove.has('right'))dx++;
if(dx||dy){const n=Math.hypot(dx,dy)||1;player.x=clamp(player.x+dx/n*player.speed*dt,22,W-22);player.y=clamp(player.y+dy/n*player.speed*dt,22,H-22);if(!pointer.down)player.angle=Math.atan2(dy,dx);}
if((keys.has(' ')||keys.has('f')||pointer.down)&&fireClock<=0){shoot();fireClock=.19;}
const rate=mode==='classic'?Math.max(.45,1.5-elapsed*.012):mode==='metro'?1.25:Math.max(.38,1.35-wave*.08);
if(spawnClock>rate&&enemies.length<=(mode==='classic'?12:mode==='metro'?9:10+wave)){spawnClock=0;spawnEnemy();if(mode==='zombie')wave=1+Math.floor(kills/5);}
for(let i=bullets.length-1;i>=0;i--){const b=bullets[i];b.x+=b.vx*dt;b.y+=b.vy*dt;b.life-=dt;if(b.life<=0||b.x<0||b.x>W||b.y<0||b.y>H){bullets.splice(i,1);continue;}
if(!b.enemy){let hit=false;for(let j=enemies.length-1;j>=0;j--){const e=enemies[j];if(Math.hypot(e.x-b.x,e.y-b.y)<e.r+b.r){e.hp-=b.damage||1;e.flash=.12;bullets.splice(i,1);hit=true;if(e.hp<=0){enemies.splice(j,1);kills++;for(let k=0;k<5;k++)particles.push({x:e.x,y:e.y,vx:rand(-80,80),vy:rand(-80,80),life:.4});if(mode==='metro'&&Math.random()<.35)crates.push({x:e.x,y:e.y,got:false});if(Math.random()<.52)spawnPickup(e.x,e.y);}break;} }if(hit)continue;}
else if(Math.hypot(player.x-b.x,player.y-b.y)<player.r+b.r){bullets.splice(i,1);if(player.invuln<=0){hp-=Math.max(3,8-gear.helmet);player.invuln=.35;}continue;}}
for(const e of enemies){const a=Math.atan2(player.y-e.y,player.x-e.x),d=Math.hypot(player.x-e.x,player.y-e.y);if(d>player.r+e.r-2){e.x+=Math.cos(a)*e.speed*dt;e.y+=Math.sin(a)*e.speed*dt;}else if(player.invuln<=0){hp-=Math.max(4,12-gear.armor*2);player.invuln=.55;}
e.shoot-=dt;if(mode==='metro'&&e.shoot<=0&&d<260){e.shoot=rand(1.4,2.2);bullets.push({x:e.x,y:e.y,vx:Math.cos(a)*190,vy:Math.sin(a)*190,r:4,life:1.7,enemy:true});}e.flash=Math.max(0,e.flash-dt);}
if(mode==='metro'){for(const c of crates){if(!c.got&&Math.hypot(c.x-player.x,c.y-player.y)<26){c.got=true;loot++;gear.supplies++;saveGear();noteGear('Ящик Metro Royale: '+loot+'/5.');$('#vg-message').textContent='Лут зібрано: '+loot+'/5';}}
if(loot>=5&&Math.hypot(player.x-(W-72),player.y-72)<36){finish(true,'Успішна евакуація! Винесено '+loot+' ящиків і знищено '+kills+' ворогів.');return;}}
for(let i=pickups.length-1;i>=0;i--){const p=pickups[i];p.life-=dt;if(p.life<=0){pickups.splice(i,1);continue;}if(Math.hypot(p.x-player.x,p.y-player.y)<27){pickUp(p);pickups.splice(i,1);}}
if(mode==='zombie'&&kills>=20){finish(true,'Хвилю зомбі відбито! Фрагів: '+kills+'. Ти отримав бонус за виживання.');return;}
for(let i=particles.length-1;i>=0;i--){const p=particles[i];p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt;if(p.life<=0)particles.splice(i,1);}
if(hp<=0){hp=0;updateHud();finish(false,'Віктор вибув. Фрагів: '+kills+'. Збирай аптечки та покращуй броню.');return;}
if(mode==='classic'&&(kills>=15||elapsed>=60)){finish(true,kills>=15?'Перемога! 15 фрагів за '+Math.floor(elapsed)+' секунд.':'Ти вижив 60 секунд! Фрагів: '+kills+'.');return;}updateHud();}
function drawSoldier(x,y,a,isPlayer=false,flash=0){ctx.save();ctx.translate(x,y);ctx.rotate(a);if(isPlayer){ctx.fillStyle='#0008';ctx.beginPath();ctx.ellipse(0,10,18,10,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#c47b42';ctx.beginPath();ctx.arc(0,-3,10,0,Math.PI*2);ctx.fill();ctx.fillStyle='#d5a078';ctx.beginPath();ctx.arc(2,-4,7,0,Math.PI*2);ctx.fill();ctx.fillStyle='#2b3525';ctx.fillRect(-10,3,20,20);ctx.fillStyle='#59694a';ctx.fillRect(-8,6,16,11);ctx.fillStyle='#b5ff4a';ctx.fillRect(-6,7,4,5);ctx.fillStyle='#25291f';ctx.fillRect(-8,19,6,9);ctx.fillRect(2,19,6,9);ctx.fillStyle='#30362a';ctx.fillRect(8,-2,20,5);ctx.fillStyle='#111';ctx.fillRect(18,-1,10,3);}
else{ctx.fillStyle=flash?'#fff':mode==='zombie'?'#527b43':'#7e4130';ctx.beginPath();ctx.arc(0,0,mode==='zombie'?16:13,0,Math.PI*2);ctx.fill();ctx.fillStyle=mode==='zombie'?'#263b24':'#382b25';ctx.fillRect(-10,-6,20,16);ctx.fillStyle=mode==='zombie'?'#8eaa5d':'#a66d4c';ctx.fillRect(-5,-7,10,8);if(mode==='zombie'){ctx.fillStyle='#f4ff9a';ctx.fillRect(-6,-2,4,3);ctx.fillRect(3,-2,4,3);}else{ctx.fillStyle='#25251f';ctx.fillRect(4,-2,19,4);}}ctx.restore();}
function draw(){ctx.clearRect(0,0,W,H);ctx.fillStyle=mode==='metro'?'#161915':mode==='zombie'?'#1c211b':'#1c2719';ctx.fillRect(0,0,W,H);ctx.strokeStyle=mode==='metro'?'#b3a06c12':mode==='zombie'?'#a7e35a12':'#c5f4a00d';ctx.lineWidth=1;
for(let x=0;x<W;x+=36){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}for(let y=0;y<H;y+=36){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}
for(let i=0;i<12;i++){const x=(i*173+55)%W,y=(i*97+25)%H;ctx.fillStyle=mode==='metro'?'#33372a':mode==='zombie'?'#263225':'#293923';ctx.fillRect(x,y,34,22);ctx.strokeStyle='#77805a55';ctx.strokeRect(x,y,34,22);}
if(mode==='metro'){ctx.fillStyle='#b5ff4a22';ctx.beginPath();ctx.arc(W-72,72,36,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#b5ff4a';ctx.lineWidth=3;ctx.beginPath();ctx.arc(W-72,72,28,0,Math.PI*2);ctx.stroke();ctx.fillStyle='#dfffad';ctx.font='bold 12px sans-serif';ctx.fillText('EVAC',W-92,76);}
for(const c of crates){if(c.got)continue;ctx.fillStyle='#d5a04a';ctx.fillRect(c.x-10,c.y-10,20,20);ctx.strokeStyle='#ffe2a1';ctx.lineWidth=2;ctx.strokeRect(c.x-10,c.y-10,20,20);ctx.fillStyle='#352818';ctx.fillRect(c.x-2,c.y-9,4,18);}
const colors={ammo:'#d7dce6',medkit:'#ff6262',armor:'#8ed3ff',weapon:'#ffca64',coins:'#ffe35b',backpack:'#c59cff'},marks={ammo:'A',medkit:'+',armor:'B',weapon:'W',coins:'$',backpack:'R'};
for(const p of pickups){ctx.fillStyle=colors[p.type]||'#fff';ctx.globalAlpha=.65+.35*Math.sin(elapsed*7+p.x);ctx.beginPath();ctx.arc(p.x,p.y,12,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;ctx.fillStyle='#111';ctx.font='bold 11px sans-serif';ctx.textAlign='center';ctx.fillText(marks[p.type]||'?',p.x,p.y+4);ctx.textAlign='left';}
for(const b of bullets){ctx.fillStyle=b.enemy?'#ff6a4a':'#fff2a3';ctx.beginPath();ctx.arc(b.x,b.y,b.r,0,Math.PI*2);ctx.fill();}
for(const e of enemies)drawSoldier(e.x,e.y,Math.atan2(player.y-e.y,player.x-e.x),false,e.flash);
for(const p of particles){ctx.fillStyle='#b5ff4a';ctx.globalAlpha=Math.max(0,p.life*2);ctx.fillRect(p.x,p.y,4,4);ctx.globalAlpha=1;}
drawSoldier(player.x,player.y,player.angle,true);if(player.invuln>0){ctx.strokeStyle='#b5ff4a';ctx.lineWidth=2;ctx.beginPath();ctx.arc(player.x,player.y,23,0,Math.PI*2);ctx.stroke();}
ctx.fillStyle='#e9f3df';ctx.font='bold 13px sans-serif';ctx.fillText('VICTOR',player.x-23,player.y-28);
if(!running&&!overlay.classList.contains('hidden')){ctx.fillStyle='#fff8';ctx.font='bold 15px sans-serif';ctx.fillText(mode==='classic'?'CLASSIC BATTLE':mode==='metro'?'METRO ROYALE RAID':'ZOMBIE SURVIVAL',18,28);}}
function frame(now){if(!last)last=now;const dt=Math.min(.035,(now-last)/1000);last=now;if(running)update(dt);draw();requestAnimationFrame(frame);}
startBtn.addEventListener('click',()=>{reset();overlay.classList.add('hidden');running=true;last=performance.now();$('#vg-message').textContent='Бій почався!';});
$('#vg-restart').addEventListener('click',reset);
document.addEventListener('keydown',e=>{const k=e.key.toLowerCase();if(['arrowup','arrowdown','arrowleft','arrowright',' '].includes(k))e.preventDefault();keys.add(k);});
document.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));
canvas.addEventListener('pointermove',e=>{const r=canvas.getBoundingClientRect();pointer.x=(e.clientX-r.left)/r.width*W;pointer.y=(e.clientY-r.top)/r.height*H;});
canvas.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse'){pointer.down=true;canvas.setPointerCapture?.(e.pointerId);}});
canvas.addEventListener('pointerup',()=>pointer.down=false);canvas.addEventListener('pointercancel',()=>pointer.down=false);
document.querySelectorAll('[data-vg-move]').forEach(btn=>{const dir=btn.dataset.vgMove,down=e=>{e.preventDefault();touchMove.add(dir);},up=e=>{e.preventDefault();touchMove.delete(dir);};btn.addEventListener('pointerdown',down);btn.addEventListener('pointerup',up);btn.addEventListener('pointerleave',up);btn.addEventListener('pointercancel',up);});
const fire=$('#vg-fire');fire.addEventListener('pointerdown',e=>{e.preventDefault();keys.add('f');});['pointerup','pointerleave','pointercancel'].forEach(ev=>fire.addEventListener(ev,()=>keys.delete('f')));
$('#vg-upgrade-armor')?.addEventListener('click',()=>{const cost=40*gear.armor;if(gear.armor>=5){noteGear('Броня вже максимального рівня.');return;}if(wallet().coins<cost){noteGear('Потрібно '+cost+' 🪙 для покращення броні.');return;}changeCoins(-cost);gear.armor++;saveGear();renderGear();noteGear('Броню покращено до рівня '+gear.armor+'.');});
$('#vg-upgrade-weapon')?.addEventListener('click',()=>{const cost=55*gear.weapon;if(gear.weapon>=5){noteGear('Зброя вже максимального рівня.');return;}if(wallet().coins<cost){noteGear('Потрібно '+cost+' 🪙 для покращення зброї.');return;}changeCoins(-cost);gear.weapon++;saveGear();renderGear();noteGear('Зброю покращено до рівня '+gear.weapon+'.');});
$('#vg-use-medkit')?.addEventListener('click',()=>{if(gear.medkits<=0){noteGear('Аптечок немає — шукай їх на полі.');return;}if(hp>=Math.min(150,100+gear.armor*5)){noteGear('Здоров’я вже повне.');return;}gear.medkits--;hp=Math.min(150,100+gear.armor*5,hp+35);saveGear();updateHud();noteGear('Аптечку використано: +35 HP.');});
window.khVictorReward=(m,k,l)=>{try{const s=wallet(),total=Object.values(records).reduce((a,v)=>a+(Number(v)||0),0),rankBonus=total>=50?12:total>=30?8:total>=15?5:total>=5?2:0,rankXp=total>=50?10:total>=30?5:0,coinBonus=(m==='metro'?Math.max(10,l*4):m==='zombie'?Math.max(18,k*3):Math.max(8,k*2))+rankBonus;s.coins=(Number(s.coins)||0)+coinBonus;s.xp=(Number(s.xp)||0)+Math.max(10,k*3+l*2)+(m==='zombie'?20:0)+rankXp;s.games=(Number(s.games)||0)+1;localStorage.setItem(rewardKey,JSON.stringify(s));window.dispatchEvent(new CustomEvent('khkozak:rewards-updated',{detail:s}));const fill=$('#reward-level-fill');if(fill)fill.style.width=(s.xp%100)+'%';const xp=$('#reward-xp-label');if(xp)xp.textContent=(s.xp%100)+' / 100 XP до наступного рівня';const totalEl=$('#reward-total-label');if(totalEl)totalEl.textContent=s.xp+' XP загалом';renderGear();}catch{}};
renderGear();setMode('classic');reset();requestAnimationFrame(frame);
})();