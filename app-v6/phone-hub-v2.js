/* KOZAK NEXUS — phone-first universal section finder */
(function(){
  'use strict';
  if (window.__kozakPhoneHubV2) return;
  window.__kozakPhoneHubV2 = true;
  const mobile = () => window.matchMedia('(max-width: 720px)').matches;
  const nav = document.querySelector('.mobile-nav');
  const sidebar = document.querySelector('.sidebar .nav');
  if (!nav || !sidebar) return;
  const originalButtons = () => Array.from(sidebar.querySelectorAll('.nav-item'));
  const tabName = el => (el.querySelector('.nav-label')?.textContent || el.textContent || '').replace(/\s+/g,' ').trim();
  const groupName = el => {
    const group = el.closest('.nav-group');
    const title = group?.querySelector(':scope > .nav-group-title, :scope > .kozak-2d-title');
    return (title?.textContent || (el.hasAttribute('data-game') ? '2D ІГРИ' : 'ІНШЕ')).replace(/\s+/g,' ').trim();
  };
  const bucket = el => {
    const id = el.dataset.tab || '';
    const game = el.dataset.game || '';
    const g = groupName(el).toLowerCase();
    if (game || /коzak-2d|2d ігри/i.test(g) || ['games','roblox','nexusops','3d','survival','bunker','pass','missions'].includes(id)) return 'Ігри';
    if (['events','arsenal','tactical','control','commandcenter'].includes(id) || /завдан|план|тактич|бункер|command/i.test(g)) return 'Тактика';
    if (['fun','challenges'].includes(id) || /fun|pubg|challenge/i.test(g)) return 'Челенджі';
    if (['music','youtube','tiktok'].includes(id) || /контент/i.test(g)) return 'Контент';
    if (['profile','progress','rewards','matchreport'].includes(id) || /прогрес/i.test(g)) return 'Прогрес';
    if (['kozakai','assistant'].includes(id) || /kozak ai/i.test(g)) return 'Помічники';
    return 'Інше';
  };
  let activeCategory = 'Усі розділи';
  let query = '';
  let sheet = null;
  function ensureHomeHub(){
    const home = document.getElementById('tab-home');
    if (!home || home.querySelector('.kn-mobile-home-hub')) return;
    const hub = document.createElement('section');
    hub.className = 'kn-mobile-home-hub';
    hub.innerHTML = '<div class="kn-mobile-home-head"><div class="kn-mobile-home-eyebrow">KOZAK NEXUS · MOBILE HUB</div><h2>Усе потрібне — поруч.</h2><p>Режими, челенджі, тактика, музика та твій прогрес — у кілька дотиків.</p><div class="kn-mobile-home-actions"><button type="button" data-kn-open="Ігри"><span>🎮</span><b>Знайти режим</b><small>Усі ігри та режими</small></button><button type="button" data-kn-open="Челенджі"><span>🎯</span><b>Челенджі</b><small>Рандом і місії PUBG</small></button><button type="button" data-kn-open="Тактика"><span>🧭</span><b>Тактичний центр</b><small>Арсенал, план і штаб</small></button><button type="button" data-kn-open="Прогрес"><span>🏆</span><b>Мій прогрес</b><small>Профіль і нагороди</small></button></div></div>';
    home.insertBefore(hub, home.firstChild);
    hub.addEventListener('click', e => {const b=e.target.closest('[data-kn-open]');if(b)openSheet(b.dataset.knOpen);});
  }
  function makeNav(){
    nav.innerHTML = '<button class="active" data-kn-nav="home" aria-label="Головна"><span>⌂</span>Головна</button><button data-kn-nav="games" aria-label="Ігри"><span>🎮</span>Ігри</button><button data-kn-nav="search" aria-label="Пошук усіх розділів"><span>⌕</span>Пошук</button><button data-kn-nav="progress" aria-label="Мій прогрес"><span>🏆</span>Прогрес</button><button data-kn-nav="all" aria-label="Усі функції"><span>☰</span>Усе</button>';
    nav.addEventListener('click', e => {
      const b=e.target.closest('[data-kn-nav]'); if(!b)return;
      const key=b.dataset.knNav;
      if(key==='home'){setActiveNav(key);clickOriginal('home');window.scrollTo({top:0,behavior:'smooth'});}
      else if(key==='games')openSheet('Ігри');
      else if(key==='search')openSheet('Усі розділи',true);
      else if(key==='progress'){setActiveNav(key);clickOriginal('profile');}
      else openSheet('Усі розділи');
    });
  }
  function setActiveNav(key){nav.querySelectorAll('button').forEach(b=>b.classList.toggle('active',b.dataset.knNav===key));}
  function clickOriginal(id){
    const el=originalButtons().find(b=>b.dataset.tab===id);
    if(el){el.click();return true;}return false;
  }
  function openSheet(category, focusSearch){
    if(!mobile()){const toggle=document.getElementById('mobileMenuToggle');if(toggle)toggle.click();return;}
    activeCategory=category||'Усі розділи';query='';
    if(sheet)sheet.remove();
    sheet=document.createElement('div');sheet.className='kn-mobile-sheet-backdrop';sheet.innerHTML='<section class="kn-mobile-sheet" role="dialog" aria-modal="true" aria-label="Усі функції KOZAK NEXUS"><header class="kn-mobile-sheet-head"><div class="kn-mobile-sheet-top"><div class="kn-mobile-sheet-mark">N</div><div class="kn-mobile-sheet-title"><b>Знайди потрібне</b><small>Усі режими та функції KOZAK NEXUS</small></div><button class="kn-mobile-sheet-close" type="button" aria-label="Закрити">×</button></div><label class="kn-mobile-search"><span>⌕</span><input type="search" placeholder="Пошук режиму або функції…" autocomplete="off"></label></header><div class="kn-mobile-categories" role="tablist"></div><div class="kn-mobile-sheet-list"></div></section>';
    document.body.appendChild(sheet);
    const input=sheet.querySelector('input');
    sheet.querySelector('.kn-mobile-sheet-close').addEventListener('click',closeSheet);
    sheet.addEventListener('click',e=>{if(e.target===sheet)closeSheet();});
    sheet.querySelector('.kn-mobile-categories').addEventListener('click',e=>{const b=e.target.closest('button[data-category]');if(!b)return;activeCategory=b.dataset.category;renderList();});
    input.addEventListener('input',()=>{query=input.value.trim().toLocaleLowerCase('uk');renderList();});
    sheet.querySelector('.kn-mobile-sheet-list').addEventListener('click',e=>{
      const b=e.target.closest('button[data-index]');if(!b)return;
      const items=collectItems();const item=items[Number(b.dataset.index)];if(!item)return;
      closeSheet();setActiveNav(item.el.dataset.tab==='home'?'home':(['profile','progress','rewards','matchreport'].includes(item.el.dataset.tab)?'progress':''));
      item.el.click();
      if(item.el.dataset.tab==='home')window.scrollTo({top:0,behavior:'smooth'});
    });
    renderList();
    if(focusSearch) setTimeout(()=>input.focus(),80);
  }
  function closeSheet(){if(sheet){sheet.remove();sheet=null;}}
  function collectItems(){
    return originalButtons().map(el=>({el,name:tabName(el),group:groupName(el),bucket:bucket(el),id:el.dataset.tab||'',game:el.dataset.game||'',badge:el.querySelector('em')?.textContent||''}))
      .filter((it,i,all)=>all.findIndex(x=>x.el===it.el)===i);
  }
  function renderList(){
    if(!sheet)return;
    const cats=['Усі розділи','Ігри','Тактика','Челенджі','Контент','Прогрес','Помічники','Інше'];
    const catBox=sheet.querySelector('.kn-mobile-categories');
    catBox.innerHTML=cats.map(c=>'<button type="button" data-category="'+c+'" class="'+(activeCategory===c?'active':'')+'">'+c+'</button>').join('');
    const list=sheet.querySelector('.kn-mobile-sheet-list');
    const items=collectItems().filter(it=>(activeCategory==='Усі розділи'||it.bucket===activeCategory)&&(!query||(it.name+' '+it.group+' '+it.bucket+' '+it.id+' '+it.game).toLocaleLowerCase('uk').includes(query)));
    if(!items.length){list.innerHTML='<div class="kn-mobile-empty">Нічого не знайдено. Спробуй іншу назву.</div>';return;}
    let html='',last='';
    items.forEach(it=>{
      if(activeCategory==='Усі розділи'&&it.group!==last){html+='<div class="kn-mobile-group-title">'+escapeHtml(it.group)+'</div>';last=it.group;}
      html+='<button type="button" class="kn-mobile-link" data-index="'+collectItems().indexOf(it)+'"><span class="kn-mobile-link-icon">'+escapeHtml(it.el.querySelector(':scope > span:first-child')?.textContent||'◈')+'</span><span class="kn-mobile-link-copy"><b>'+escapeHtml(it.name)+'</b><small>'+escapeHtml(it.bucket==='Інше'?it.group:it.bucket)+'</small></span>'+(it.badge?'<span class="kn-mobile-link-badge">'+escapeHtml(it.badge)+'</span>':'')+'</button>';
    });
    list.innerHTML=html;
  }
  function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&sheet)closeSheet();});
  window.addEventListener('resize',()=>{if(!mobile()&&sheet)closeSheet();});
  ensureHomeHub();
  makeNav();
  document.addEventListener('click',e=>{
    const b=e.target.closest('[data-kn-open]');
    if(b){e.preventDefault();openSheet(b.dataset.knOpen);}
  });
  document.addEventListener('click',e=>{
    const tab=e.target.closest('[data-tab]');
    if(tab&&tab.closest('.sidebar')){setActiveNav(tab.dataset.tab==='home'?'home':(['profile','progress','rewards','matchreport'].includes(tab.dataset.tab)?'progress':''));}
  });
})();