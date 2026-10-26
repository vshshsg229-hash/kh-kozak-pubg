/* KOZAK NEXUS — phone-first navigation; original feature controls remain the source of truth */
(function () {
  'use strict';
  function init() {
    if (window.__kozakPhoneHubV3) return;
    const sidebar = document.querySelector('.sidebar');
    const sourceNav = sidebar && sidebar.querySelector('.nav');
    if (!sidebar || !sourceNav) return;
    window.__kozakPhoneHubV3 = true;
    const mobile = () => window.matchMedia('(max-width: 720px)').matches;
    let sheet = null, activeCategory = 'Усі функції', query = '';
    let nav = document.querySelector('.mobile-nav');
    if (!nav) {
      nav = document.createElement('nav');
      nav.className = 'mobile-nav';
      nav.setAttribute('aria-label', 'Мобільна навігація');
      document.body.appendChild(nav);
    }
    const originalButtons = () => Array.from(sourceNav.querySelectorAll('.nav-item'));
    const clean = s => String(s || '').replace(/\s+/g, ' ').trim();
    const nameOf = el => clean(el.querySelector('.nav-label')?.textContent || el.textContent || 'Розділ');
    const groupOf = el => {
      const group = el.closest('.nav-group');
      const heading = group && group.querySelector(':scope > .nav-group-title, :scope > .kozak-2d-title');
      return clean(heading?.textContent || (el.dataset.game ? '2D ігри' : 'Інші функції'));
    };
    const bucketOf = el => {
      const id = el.dataset.tab || '', game = el.dataset.game || '';
      const g = groupOf(el).toLowerCase(), n = nameOf(el).toLowerCase();
      if (game || el.classList.contains('atlas-zero-nav') || /ігри|roblox|arena|режим/.test(g+' '+n) || ['games','roblox','nexusops','3d','survival','bunker','missions'].includes(id)) return 'Ігри';
      if (['events','arsenal','tactical','control','commandcenter'].includes(id) || /тактик|план|штаб|арсенал|операц|бункер/.test(g+' '+n)) return 'Тактика';
      if (['fun','challenges'].includes(id) || /challenge|челендж|рандом|прикол/.test(g+' '+n)) return 'Челенджі';
      if (['music','youtube','tiktok'].includes(id) || /контент|музик|youtube|tiktok/.test(g+' '+n)) return 'Медіа';
      if (['profile','progress','rewards','matchreport','pass'].includes(id) || /прогрес|профіл|нагород|royale pass/.test(g+' '+n)) return 'Прогрес';
      if (['kozakai','assistant'].includes(id) || /kozak ai|помічник/.test(g+' '+n)) return 'Помічники';
      return 'Інше';
    };
    const collect = () => originalButtons().map(el => ({
      el, name:nameOf(el), group:groupOf(el), bucket:bucketOf(el),
      id:el.dataset.tab || '', game:el.dataset.game || '',
      icon:clean(el.querySelector(':scope > span:first-child')?.textContent || '◈'),
      badge:clean(el.querySelector('em')?.textContent || ''),
      title:clean(el.getAttribute('title') || '')
    })).filter((it,i,all) => all.findIndex(x => x.el === it.el) === i);
    const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    const clickTab = id => {
      const item = collect().find(it => it.id === id);
      if (item) { item.el.click(); return true; }
      return false;
    };
    const setActive = key => nav.querySelectorAll('[data-kn-nav]').forEach(b => b.classList.toggle('active', b.dataset.knNav === key));
    function buildBottomNav() {
      nav.innerHTML = '<button type="button" data-kn-nav="home"><span>⌂</span><b>Головна</b></button><button type="button" data-kn-nav="games"><span>🎮</span><b>Ігри</b></button><button type="button" data-kn-nav="search"><span>⌕</span><b>Пошук</b></button><button type="button" data-kn-nav="progress"><span>🏆</span><b>Прогрес</b></button><button type="button" data-kn-nav="all"><span>☰</span><b>Усі функції</b></button>';
      nav.addEventListener('click', e => {
        const b = e.target.closest('[data-kn-nav]');
        if (!b) return;
        const key = b.dataset.knNav;
        if (key === 'home') { setActive(key); clickTab('home'); window.scrollTo({top:0,behavior:'smooth'}); }
        else if (key === 'games') openSheet('Ігри');
        else if (key === 'search') openSheet('Усі функції', true);
        else if (key === 'progress') { setActive(key); if (!clickTab('profile')) clickTab('progress'); }
        else openSheet('Усі функції');
      });
    }
    function openSheet(category, focus) {
      activeCategory = category || 'Усі функції'; query = '';
      if (sheet) sheet.remove();
      sheet = document.createElement('div');
      sheet.className = 'kn-mobile-sheet-backdrop';
      sheet.innerHTML = '<section class="kn-mobile-sheet" role="dialog" aria-modal="true" aria-label="Усі функції KOZAK NEXUS"><header class="kn-mobile-sheet-head"><div class="kn-mobile-sheet-top"><div class="kn-mobile-sheet-mark">N</div><div class="kn-mobile-sheet-title"><b>Усі функції KOZAK NEXUS</b><small>Усі оригінальні режими та інструменти в одному місці</small></div><button class="kn-mobile-sheet-close" type="button" aria-label="Закрити">×</button></div><label class="kn-mobile-search"><span>⌕</span><input type="search" placeholder="Знайти режим або функцію…" autocomplete="off"></label></header><div class="kn-mobile-categories"></div><div class="kn-mobile-sheet-count"></div><div class="kn-mobile-sheet-list"></div></section>';
      document.body.appendChild(sheet);
      const input = sheet.querySelector('input');
      sheet.querySelector('.kn-mobile-sheet-close').addEventListener('click', closeSheet);
      sheet.addEventListener('click', e => { if (e.target === sheet) closeSheet(); });
      sheet.querySelector('.kn-mobile-categories').addEventListener('click', e => {
        const b = e.target.closest('[data-category]'); if (!b) return;
        activeCategory = b.dataset.category; renderList();
      });
      input.addEventListener('input', () => { query = input.value.trim().toLocaleLowerCase('uk'); renderList(); });
      sheet.querySelector('.kn-mobile-sheet-list').addEventListener('click', e => {
        const b = e.target.closest('[data-index]'); if (!b) return;
        const items = collect(), item = items[Number(b.dataset.index)];
        if (!item) return;
        closeSheet();
        setActive(item.id === 'home' ? 'home' : (['profile','progress','rewards','matchreport'].includes(item.id) ? 'progress' : ''));
        item.el.click();
        if (item.id === 'home') window.scrollTo({top:0,behavior:'smooth'});
      });
      renderList();
      if (focus) setTimeout(() => input.focus(), 100);
    }
    function closeSheet() { if (sheet) { sheet.remove(); sheet = null; } }
    function renderList() {
      if (!sheet) return;
      const cats = ['Усі функції','Ігри','Тактика','Челенджі','Медіа','Прогрес','Помічники','Інше'];
      sheet.querySelector('.kn-mobile-categories').innerHTML = cats.map(c => '<button type="button" data-category="'+esc(c)+'" class="'+(activeCategory===c?'active':'')+'">'+esc(c)+'</button>').join('');
      const all = collect();
      const found = all.filter(it => (activeCategory === 'Усі функції' || it.bucket === activeCategory) &&
        (!query || (it.name+' '+it.group+' '+it.bucket+' '+it.id+' '+it.game+' '+it.title).toLocaleLowerCase('uk').includes(query)));
      sheet.querySelector('.kn-mobile-sheet-count').textContent = found.length+' функцій доступно';
      const list = sheet.querySelector('.kn-mobile-sheet-list');
      if (!found.length) { list.innerHTML = '<div class="kn-mobile-empty">Не знайшов. Спробуй коротшу назву або іншу категорію.</div>'; return; }
      let html = '', last = '';
      found.forEach(it => {
        if (activeCategory === 'Усі функції' && it.group !== last) { html += '<div class="kn-mobile-group-title">'+esc(it.group)+'</div>'; last = it.group; }
        html += '<button type="button" class="kn-mobile-link" data-index="'+all.indexOf(it)+'"><span class="kn-mobile-link-icon">'+esc(it.icon)+'</span><span class="kn-mobile-link-copy"><b>'+esc(it.name)+'</b><small>'+esc(it.bucket==='Інше'?it.group:it.bucket)+'</small></span>'+(it.badge?'<span class="kn-mobile-link-badge">'+esc(it.badge)+'</span>':'')+'<span class="kn-mobile-link-arrow">›</span></button>';
      });
      list.innerHTML = html;
    }
    function ensureHomeHub() {
      const home = document.getElementById('tab-home');
      if (!home || home.querySelector('.kn-mobile-home-hub')) return;
      const hub = document.createElement('section'); hub.className = 'kn-mobile-home-hub';
      hub.innerHTML = '<div class="kn-mobile-home-head"><div class="kn-mobile-home-eyebrow">KOZAK NEXUS · MOBILE</div><h2>Усе під рукою</h2><p>Ігри, інструменти, відео та музика — без бічної панелі.</p><div class="kn-mobile-home-actions"><button type="button" data-kn-open="Ігри"><span>🎮</span><b>Знайти режим</b><small>Усі ігри та режими</small></button><button type="button" data-kn-open="Челенджі"><span>🎯</span><b>Челенджі</b><small>Рандом і PUBG</small></button><button type="button" data-kn-open="Тактика"><span>🧭</span><b>Тактичний центр</b><small>Арсенал і штаб</small></button><button type="button" data-kn-open="Усі функції"><span>▦</span><b>Усі функції</b><small>Повний каталог</small></button></div><div class="kn-mobile-media-actions"><button type="button" data-kn-tab="youtube"><span>▶</span><b>YouTube</b><small>Відео та плейлисти</small></button><button type="button" data-kn-tab="music"><span>♫</span><b>Музика</b><small>Музичний плеєр</small></button></div></div>';
      home.insertBefore(hub, home.firstChild);
      hub.addEventListener('click', e => { const tab=e.target.closest('[data-kn-tab]'); if(tab){const item=collect().find(it=>it.id===tab.dataset.knTab);if(item)item.el.click();return;} const b=e.target.closest('[data-kn-open]'); if(b) openSheet(b.dataset.knOpen); });
    }
    buildBottomNav();
    ensureHomeHub();
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && sheet) closeSheet(); });
    document.addEventListener('click', e => {
      /* The phone hamburger now opens the original sidebar drawer, matching the tablet navigation. */
      const tab = e.target.closest('.sidebar [data-tab]');
      if (tab) setActive(tab.dataset.tab === 'home' ? 'home' : (['profile','progress','rewards','matchreport'].includes(tab.dataset.tab) ? 'progress' : ''));
    }, true);
    document.addEventListener('click', e => {
      const close = e.target.closest('#mobileSidebarClose');
      if (close && mobile()) { e.preventDefault(); e.stopPropagation(); closeSheet(); }
    }, true);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once:true});
  else init();
})();