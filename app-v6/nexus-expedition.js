(()=>{'use strict';
const KEY='kozakNexus.expedition.v1';
const style=`
#knx-expedition-card{margin:16px 0;padding:clamp(16px,3vw,24px);border:1px solid #8b7137;border-radius:18px;background:radial-gradient(circle at 85% 0%,#4b371c88,transparent 38%),linear-gradient(135deg,#15191f,#080b10);color:#f5f1e7;box-shadow:0 12px 36px #0005;font-family:inherit}
#knx-expedition-card .knx-kicker{font-size:10px;letter-spacing:2px;color:#e5c36c;font-weight:900}
#knx-expedition-card h2{font-size:clamp(22px,4vw,32px);margin:8px 0}
#knx-expedition-card p{color:#b9c2d0;line-height:1.55;margin:7px 0 14px}
#knx-expedition-card button,#knx-expedition-panel button{cursor:pointer;border:1px solid #806a39;border-radius:10px;padding:10px 13px;background:#211d14;color:#ffe5a0;font-weight:800;min-height:42px}
#knx-expedition-card .knx-open{background:linear-gradient(110deg,#d5ac4b,#8c6722);color:#17130a;border:0}
#knx-expedition-card .knx-chips{display:flex;flex-wrap:wrap;gap:8px;margin:12px 0}
#knx-expedition-card .knx-chip{font-size:11px;padding:6px 9px;border:1px solid #343c48;border-radius:99px;color:#d6deea}
#knx-expedition-panel{position:fixed;inset:0;z-index:100020;background:#05070bea;backdrop-filter:blur(14px);overflow:auto;padding: max(16px,env(safe-area-inset-top)) 14px max(24px,env(safe-area-inset-bottom));color:#f4f6fa}
#knx-expedition-panel[hidden]{display:none}
#knx-expedition-panel .knx-shell{max-width:1000px;margin:0 auto}
#knx-expedition-panel .knx-top{display:flex;justify-content:space-between;gap:12px;align-items:center;position:sticky;top:0;padding:10px 0;background:#080b10ee;z-index:2}
#knx-expedition-panel .knx-eyebrow{color:#e4bd60;font-size:10px;letter-spacing:2px;font-weight:900}
#knx-expedition-panel h1{font-size:clamp(26px,5vw,42px);margin:8px 0}
#knx-expedition-panel .knx-sub{color:#aab6c7;line-height:1.6;max-width:720px}
#knx-expedition-panel .knx-stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin:18px 0}
#knx-expedition-panel .knx-stat,#knx-expedition-panel .knx-track,#knx-expedition-panel .knx-contract{background:linear-gradient(140deg,#151d28,#0c1119);border:1px solid #2c3949;border-radius:14px;padding:14px}
#knx-expedition-panel .knx-stat small{display:block;color:#9eacbf;font-size:10px;letter-spacing:1px}
#knx-expedition-panel .knx-stat strong{display:block;font-size:25px;margin-top:6px;color:#f4d47e}
#knx-expedition-panel .knx-section-title{margin:22px 0 10px;font-size:17px}
#knx-expedition-panel .knx-tracks{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
#knx-expedition-panel .knx-track h3{margin:6px 0;font-size:16px}
#knx-expedition-panel .knx-track p{color:#aab6c7;font-size:13px;line-height:1.5;min-height:40px}
#knx-expedition-panel .knx-track .knx-bar{height:7px;background:#263241;border-radius:8px;overflow:hidden;margin:10px 0}
#knx-expedition-panel .knx-track .knx-bar i{display:block;height:100%;background:linear-gradient(90deg,#96722e,#f4d47e)}
#knx-expedition-panel .knx-contracts{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
#knx-expedition-panel .knx-contract h3{margin:6px 0;font-size:15px}
#knx-expedition-panel .knx-contract p{font-size:13px;line-height:1.5;color:#aab6c7;min-height:36px}
#knx-expedition-panel .knx-contract small{color:#e4bd60}
#knx-expedition-panel .knx-contract button{width:100%;margin-top:10px}
#knx-expedition-panel .knx-contract button:disabled{opacity:.55;cursor:default}
#knx-expedition-panel .knx-event{padding:16px;border-radius:14px;border:1px solid #75602f;background:linear-gradient(120deg,#322615,#11151b);margin-top:12px}
#knx-expedition-panel .knx-event p{color:#c9cdd4;line-height:1.55}
#knx-expedition-panel .knx-foot{font-size:11px;color:#8795a8;margin:18px 0}
@media(max-width:580px){#knx-expedition-panel .knx-stats{grid-template-columns:repeat(3,minmax(0,1fr));gap:6px}#knx-expedition-panel .knx-stat{padding:10px}#knx-expedition-panel .knx-stat strong{font-size:20px}#knx-expedition-panel .knx-tracks,#knx-expedition-panel .knx-contracts{grid-template-columns:1fr}}
`;
const daily=[
{id:'scout',track:'recon',title:'Тихий розвідник',desc:'Відкрий будь-який розділ і переглянь нову можливість.',xp:30},
{id:'planner',track:'command',title:'Командир плану',desc:'Запиши одну ціль у NEXUS Command або онови свій план.',xp:35},
{id:'arsenal',track:'arsenal',title:'Перевірка спорядження',desc:'Зазирни до арсеналу та обери спорядження для наступного рейду.',xp:25},
{id:'creator',track:'creator',title:'Іскра творця',desc:'Збережи нову ідею, нотатку або власний челендж.',xp:40}
];
const tracks={recon:{name:'РОЗВІДКА',icon:'⌖',desc:'Відкривай нові розділи й знаходь приховані можливості.'},command:{name:'КОМАНДУВАННЯ',icon:'♜',desc:'Планування, цілі, нотатки та тактичні рішення.'},arsenal:{name:'АРСЕНАЛ',icon:'⬡',desc:'Підготовка до матчів, спорядження та бойові виклики.'},creator:{name:'ТВОРЕЦЬ',icon:'✦',desc:'Ідеї, челенджі, експерименти та власні сценарії.'}};
const dayKey=()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
const read=()=>{try{const x=JSON.parse(localStorage.getItem(KEY)||'{}');return {xp:Number(x.xp)||0,completed:Array.isArray(x.completed)?x.completed:[],day:x.day||dayKey(),tracks:{...Object.fromEntries(Object.keys(tracks).map(k=>[k,0])),...(x.tracks||{})},events:Array.isArray(x.events)?x.events:[]}}catch{return {xp:0,completed:[],day:dayKey(),tracks:{recon:0,command:0,arsenal:0,creator:0},events:[]}}};
let data=read();
function rollover(){if(data.day!==dayKey()){data.day=dayKey();data.completed=[];save('Нові щоденні контракти доступні');}}
function save(action){try{localStorage.setItem(KEY,JSON.stringify(data))}catch{}if(action){data.events.unshift({action,at:Date.now()});data.events=data.events.slice(0,12);try{localStorage.setItem(KEY,JSON.stringify(data))}catch{}}render();}
function level(){return Math.floor(data.xp/100)+1}
function render(){const panel=document.getElementById('knx-expedition-panel');if(!panel)return;rollover();const next=level()*100,into=data.xp%100;panel.innerHTML='<div class="knx-shell"><div class="knx-top"><div><div class="knx-eyebrow">KOZAK NEXUS / FIELD OPERATIONS</div><strong>EXPEDITION SYSTEM</strong></div><button type="button" data-knx-close>✕ Закрити</button></div><header><h1>Експедиція NEXUS</h1><p class="knx-sub">Додатковий шар прогресу для дослідження KOZAK NEXUS. Виконуй контракти, розвивай чотири гілки й відкривай нові ранги. Прогрес зберігається локально на цьому пристрої.</p></header><div class="knx-stats"><div class="knx-stat"><small>РАНГ</small><strong>'+level()+'</strong></div><div class="knx-stat"><small>ДОСВІД</small><strong>'+data.xp+' XP</strong></div><div class="knx-stat"><small>КОНТРАКТИ СЬОГОДНІ</small><strong>'+data.completed.length+'/4</strong></div></div><div class="knx-track"><small>ПРОГРЕС ДО РАНГУ '+(level()+1)+'</small><div class="knx-bar"><i style="width:'+into+'%"></i></div><small>'+into+' / 100 XP</small></div><h2 class="knx-section-title">Карта гілок розвитку</h2><div class="knx-tracks">'+Object.entries(tracks).map(([id,t])=>'<article class="knx-track"><div class="knx-eyebrow">'+t.icon+' / '+t.name+'</div><h3>Рівень '+(1+Math.floor((Number(data.tracks[id])||0)/3))+'</h3><p>'+t.desc+'</p><div class="knx-bar"><i style="width:'+((Number(data.tracks[id])||0)%3/3*100)+'%"></i></div><small>'+(Number(data.tracks[id])||0)+' очок розвитку · наступний рівень за '+(3-(Number(data.tracks[id])||0)%3)+' контракт(и)</small></article>').join('')+'</div><h2 class="knx-section-title">Щоденні контракти</h2><div class="knx-contracts">'+daily.map(c=>{const done=data.completed.includes(c.id);return '<article class="knx-contract"><small>'+c.xp+' XP · '+tracks[c.track].name+'</small><h3>'+c.title+'</h3><p>'+c.desc+'</p><button type="button" data-knx-contract="'+c.id+'" '+(done?'disabled':'')+'>'+(done?'✓ Виконано сьогодні':'Позначити виконаним')+'</button></article>'}).join('')+'</div><div class="knx-event"><div class="knx-eyebrow">ВИПАДКОВА ПОДІЯ</div><h2>Сигнал із туманного сектора</h2><p>Обери одну гілку для бонусного імпульсу. Раз на день можна отримати +20 XP та +1 очко розвитку у вибраній гілці.</p><div style="display:flex;flex-wrap:wrap;gap:8px">'+Object.entries(tracks).map(([id,t])=>'<button type="button" data-knx-event="'+id+'" '+(data.events.some(e=>e.action==='Бонусна подія: '+id&&e.day===dayKey())?'disabled':'')+'>'+t.icon+' '+t.name+'</button>').join('')+'</div></div><h2 class="knx-section-title">Останні події</h2><div class="knx-track">'+(data.events.slice(0,5).map(e=>'<p style="margin:7px 0;color:#c3ccda">'+String(e.action).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))+' · '+new Date(e.at).toLocaleTimeString('uk-UA',{hour:'2-digit',minute:'2-digit'})+'</p>').join('')||'<p>Тут з’явиться історія твоєї експедиції.</p>')+'</div><p class="knx-foot">Цей режим не потребує акаунта, сервера чи мережевої синхронізації. Дані зберігаються окремо від профілю та інших режимів KOZAK NEXUS.</p></div>';}
function mount(){if(!document.getElementById('knx-expedition-style')){const s=document.createElement('style');s.id='knx-expedition-style';s.textContent=style;document.head.appendChild(s)}if(!document.getElementById('knx-expedition-panel')){const p=document.createElement('div');p.id='knx-expedition-panel';p.hidden=true;p.setAttribute('aria-label','Експедиція NEXUS');document.body.appendChild(p)}const root=document.getElementById('tab-commandcenter');if(root&&!document.getElementById('knx-expedition-card')){const card=document.createElement('section');card.id='knx-expedition-card';card.innerHTML='<div class="knx-kicker">NEW FEATURE · OFFLINE PROGRESSION</div><h2>Експедиція NEXUS</h2><p>Щоденні контракти, чотири гілки розвитку, випадкові події та окремий рівень прогресу. Новий ігровий шар без сервера — не змінює наявний профіль, монети чи режими.</p><div class="knx-chips"><span class="knx-chip">4 гілки розвитку</span><span class="knx-chip">Щоденні контракти</span><span class="knx-chip">Локальне збереження</span></div><button class="knx-open" type="button" data-knx-open>ВІДКРИТИ ЕКСПЕДИЦІЮ ↗</button>';root.prepend(card)}}
document.addEventListener('click',e=>{if(e.target.closest('[data-knx-open]')){rollover();render();document.getElementById('knx-expedition-panel').hidden=false;document.body.style.overflow='hidden'}if(e.target.closest('[data-knx-close]')){document.getElementById('knx-expedition-panel').hidden=true;document.body.style.overflow=''}const c=e.target.closest('[data-knx-contract]');if(c&&!data.completed.includes(c.dataset.knxContract)){const item=daily.find(x=>x.id===c.dataset.knxContract);if(item){data.completed.push(item.id);data.xp+=item.xp;data.tracks[item.track]=(Number(data.tracks[item.track])||0)+1;data.events.unshift({action:'Контракт завершено: '+item.title,at:Date.now(),day:dayKey()});data.events=data.events.slice(0,12);save()}}const ev=e.target.closest('[data-knx-event]');if(ev&&!data.events.some(x=>x.action==='Бонусна подія: '+ev.dataset.knxEvent&&x.day===dayKey())){const id=ev.dataset.knxEvent;data.xp+=20;data.tracks[id]=(Number(data.tracks[id])||0)+1;data.events.unshift({action:'Бонусна подія: '+id,at:Date.now(),day:dayKey()});data.events=data.events.slice(0,12);save()}});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){const p=document.getElementById('knx-expedition-panel');if(p&&!p.hidden){p.hidden=true;document.body.style.overflow=''}}});
const observer=new MutationObserver(()=>mount());
function boot(){mount();const root=document.getElementById('tab-commandcenter');if(root)observer.observe(root,{childList:true,subtree:true});}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();