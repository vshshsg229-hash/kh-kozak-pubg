(()=>{'use strict';
/* KOZAK NEXUS 21.1 · navigation and home command deck. Existing tab IDs and game handlers remain the source of truth. */
const start=()=>{
 const body=document.body;if(!body||body.dataset.nx21Layout==='ready')return;body.dataset.nx21Layout='ready';body.classList.add('nexus-redesign');
 const nav=document.querySelector('.sidebar .nav');
 if(nav){
  let world=nav.querySelector(':scope > .nx-world-nav');
  if(!world){world=document.createElement('div');world.className='nav-group nx-world-nav';world.innerHTML='<div class="nav-group-title">NEXUS WORLD <small>КОМАНДУВАННЯ · ДОСЛІДЖЕННЯ</small></div>';const game=nav.querySelector(':scope > .kozak-games-nav');const worldBtn=game?.querySelector('.nexus-world-expansion-nav');const command=game?.querySelector('[data-tab="commandcenter"]');if(worldBtn)world.append(worldBtn);if(command)world.append(command);if(game)nav.insertBefore(world,game);}
  const ordered=['.nx-world-nav','.kozak-games-nav','.survival-bunker-nav','.kozak-challenge-zone','.kozak-plans-nav','.kozak-ai-nav','.kozak-content-nav','.kozak-progress-nav','.kozak-contact-nav','.kozak-life-nav'];
  ordered.forEach(sel=>{const el=nav.querySelector(':scope > '+sel);if(el)nav.append(el)});
  const titles={'.kozak-games-nav':'ІГРОВІ РЕЖИМИ <small>2D · 3D · PUB G · ARCADE</small>','.survival-bunker-nav':'ВИЖИВАННЯ <small>БАЗА · РЕЙДИ</small>','.kozak-challenge-zone':'ЧЕЛЕНДЖІ ТА ЗАГІН <small>RANDOM · CO-OP</small>','.kozak-plans-nav':'ТАКТИЧНИЙ ЦЕНТР <small>ПЛАНУВАННЯ · АРСЕНАЛ</small>','.kozak-ai-nav':'KOZAK AI <small>ПОРАДИ · ПОМІЧНИКИ</small>','.kozak-content-nav':'МЕДІА ПРОСТІР <small>МУЗИКА · ВІДЕО</small>','.kozak-progress-nav':'ПРОФІЛЬ І ПРОГРЕС <small>XP · МОНЕТИ · НАГОРОДИ</small>','.kozak-contact-nav':'ЗВʼЯЗОК <small>КОНТАКТИ</small>','.kozak-life-nav':'ДОДАТКОВИЙ ПРОСТІР <small>KOZAK LIFE</small>'};
  Object.entries(titles).forEach(([sel,label])=>{const el=nav.querySelector(':scope > '+sel),title=el?.querySelector(':scope > .nav-group-title');if(title)title.innerHTML=label});
 }
 const grid=document.querySelector('#kh-home-v2 .kv2-launch-grid');
 if(grid&&!grid.dataset.nx21Deck){
  grid.dataset.nx21Deck='1';grid.classList.add('nx-command-deck');
  const tiles=[
   ['🌌','NEXUS WORLD','Карта, цивілізація, база та експедиції','nexusworld','WORLD'],
   ['🎮','ІГРОВА БАЗА','Усі режими та швидкий запуск','games','PLAY'],
   ['⬡','COMMAND CENTER','Керування операціями та штаб','commandcenter','HQ'],
   ['⚔','3D АРЕНА','Тривимірні бойові режими','3d','3D'],
   ['⛨','SURVIVAL OPS','Бункер, рейди та виживання','survival','OPS'],
   ['🎯','МІСІЇ','Щоденні завдання та виклики','missions','DAILY'],
   ['♛','ROYale PASS','Сезонні рівні та нагороди','pass','SEASON'],
   ['◉','МІЙ ПРОФІЛЬ','Рівень, баланс і статистика','profile','PLAYER'],
   ['🎲','PUBG CHALLENGES','Рандом, челенджі та загін','challenges','CHALLENGE'],
   ['♫','МУЗИЧНИЙ ПРОСТІР','Плеєр та плейлисти','music','AUDIO'],
   ['🎮','ROBLOX WORLDS','Окремі ігрові світи','roblox','WORLDS'],
   ['🎯','АРСЕНАЛ','Зброя, збірки та тактика','arsenal','LOADOUT']
  ];
  grid.innerHTML=tiles.map(([icon,title,desc,tab,tag])=>'<button class="kv2-launch nx-launch-tile" type="button" data-nx-go="'+tab+'"><span class="kv2-icon">'+icon+'</span><strong>'+title+'</strong><small>'+desc+'</small><em>'+tag+' ↗</em></button>').join('');
 }
 const shell=document.querySelector('.app-shell');
 if(shell&&!document.getElementById('nxMobileDock')){
  const dock=document.createElement('nav');dock.id='nxMobileDock';dock.className='nx-mobile-dock';dock.setAttribute('aria-label','Швидка навігація');
  const items=[['home','⌂','ГОЛОВНА'],['games','▣','ІГРИ'],['nexusworld','🌌','СВІТ'],['missions','🎯','МІСІЇ'],['profile','◉','ПРОФІЛЬ']];
  dock.innerHTML=items.map(([tab,icon,label])=>'<button type="button" class="nx-dock-btn" data-nx-go="'+tab+'" aria-label="'+label+'"><span>'+icon+'</span><small>'+label+'</small></button>').join('');
  shell.append(dock);
 }
 const route=(tab)=>{const target=nav?.querySelector('[data-tab="'+tab+'"]')||document.querySelector('.sidebar [data-tab="'+tab+'"]');if(target){target.click();return true}const any=document.querySelector('[data-tab="'+tab+'"]');if(any){any.click();return true}return false};
 document.addEventListener('click',e=>{const btn=e.target.closest('[data-nx-go]');if(btn){e.preventDefault();route(btn.dataset.nxGo)}},true);
 const sync=()=>{const active=document.querySelector('.sidebar .nav-item.active')?.dataset.tab||'home';document.querySelectorAll('.nx-dock-btn').forEach(b=>b.classList.toggle('active',b.dataset.nxGo===active))};
 const mo=new MutationObserver(sync);if(nav)mo.observe(nav,{subtree:true,attributes:true,attributeFilter:['class']});sync();
 const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
 const io=('IntersectionObserver'in window&&!reduced)?new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('nx-visible');io.unobserve(e.target)}}),{threshold:.08,rootMargin:'0px 0px -24px 0px'}):null;
 const refresh=()=>{document.querySelectorAll('.view.active').forEach(v=>v.classList.add('nx-entering'));if(!io)return;document.querySelectorAll('.view.active .panel,.view.active .feature-card,.view.active .stat-card,.view.active .mission-card,.view.active .reward-card,.view.active .game-card,.view.active .section-card,.view.active .mode-card').forEach((node,i)=>{if(node.dataset.nxReveal)return;node.dataset.nxReveal='1';node.classList.add('nx-reveal');node.style.transitionDelay=Math.min(i%7,6)*40+'ms';io.observe(node)})};
 refresh();const observer=new MutationObserver(records=>{if(records.some(r=>r.type==='attributes'||r.type==='childList'))requestAnimationFrame(refresh)});observer.observe(shell||document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class']});
};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();