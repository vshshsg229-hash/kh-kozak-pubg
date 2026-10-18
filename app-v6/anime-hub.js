(function(){
  'use strict';
  const root = document.querySelector('main');
  const nav = document.querySelector('.sidebar .nav');
  if (!root || !nav || document.getElementById('tab-anime')) return;

  const group = document.createElement('div');
  group.className = 'nav-group anime-hub-nav';
  group.innerHTML = '<div class="nav-group-title"><span style="color:#ff8bd5">✦</span> ANIME ZONE <small>GALLERY · COLLECTION</small></div><button class="nav-item" type="button" data-tab="anime" title="Відкрити Anime Hub"><span>🌸</span><span class="nav-label">Anime Hub & Collection</span><em>NEW</em></button>';
  nav.appendChild(group);

  const view = document.createElement('section');
  view.className = 'view';
  view.id = 'tab-anime';
  view.innerHTML = `
    <div class="anime-hero">
      <div class="anime-eyebrow">KH么KOZAK · ANIME HUB</div>
      <h1>ANIME <span>HUB</span></h1>
      <p>Галерея аніме-персонажів із фото з інтернету та власна колекція. Усе в одному розділі Battle Hub.</p>
      <div class="anime-actions">
        <button class="anime-btn primary" type="button" data-anime-search="images">⌕ Шукати тянок у Google</button>
        <button class="anime-btn" type="button" data-anime-search="videos">▶ Знайти відео в Google</button>
      </div>
    </div>
    <div class="anime-panel">
      <div class="anime-eyebrow">01 / GOOGLE SEARCH</div><h2>Знайти персонажа</h2>
      <form id="animeSearchForm" class="anime-search-row">
        <input id="animeSearchQuery" class="anime-input" type="search" placeholder="Наприклад: anime girl blue hair" value="anime girl character art" aria-label="Пошуковий запит">
        <button class="anime-btn primary" type="submit">Пошук у Google ↗</button>
      </form>
    </div>
    <div class="anime-panel">
      <div class="anime-eyebrow">02 / YOUR COLLECTION</div><h2>Моя колекція</h2>
      <div class="anime-collection-stats"><span>Карток: <b id="animeCollectionCount">0</b></span><span>Збереження на цьому пристрої</span><span>Обране: <b id="animeFavoritesCount">0</b></span></div>
      <div class="anime-collection-tools">
        <input id="animeCollectionSearch" class="anime-input" type="search" placeholder="Знайти у своїй колекції…" aria-label="Фільтр колекції">
        <select id="animeCollectionSort" class="anime-input" aria-label="Сортування колекції"><option value="newest">Спочатку нові</option><option value="name">За ім'ям А—Я</option><option value="favorites">Обране спочатку</option></select>
        <label class="anime-favorites-filter"><input id="animeFavoritesOnly" type="checkbox"> Лише обране</label>
        <button id="animeExportCollection" class="anime-btn" type="button">⇩ Експорт</button>
      </div>
      <p class="anime-note">Добірку аніме-зображень уже додано в колекцію. Фото відкриваються з Wikimedia Commons; завантажувати файли вручну не потрібно.</p>
      <div id="animeCollectionGrid" class="anime-grid" style="margin-top:12px"></div>
    </div>
  `;
  const footer = root.querySelector('.footer');
  root.insertBefore(view, footer || null);

  const navButton = group.querySelector('[data-tab="anime"]');
  navButton.addEventListener('click', function(){ if (typeof window.goTab === 'function') window.goTab('anime'); else { document.querySelectorAll('.view').forEach(v=>v.classList.toggle('active',v.id==='tab-anime')); document.querySelectorAll('[data-tab]').forEach(b=>b.classList.toggle('active',b.dataset.tab==='anime')); } });

  const googleSearch = (kind, query) => {
    const base = kind === 'videos' ? 'https://www.google.com/search?tbm=vid&q=' : 'https://www.google.com/search?tbm=isch&q=';
    window.open(base + encodeURIComponent(query || 'anime girl character art'), '_blank', 'noopener,noreferrer');
  };
  view.querySelectorAll('[data-anime-search]').forEach(b=>b.addEventListener('click',()=>googleSearch(b.dataset.animeSearch,document.getElementById('animeSearchQuery').value)));
  document.getElementById('animeSearchForm').addEventListener('submit',e=>{e.preventDefault();googleSearch('images',document.getElementById('animeSearchQuery').value.trim());});

  const STORAGE_KEY='khkozak_anime_collection_v1';
  const safeRead=()=>{try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||'[]').filter(x=>x&&typeof x.name==='string'&&typeof x.image==='string')}catch{return []}};
  const safeWrite=items=>{try{localStorage.setItem(STORAGE_KEY,JSON.stringify(items));return true}catch{return false}};
  const DEFAULT_PHOTOS = [
    {name:'Anime Girl · Sakura',image:'https://commons.wikimedia.org/wiki/Special:Redirect/file/Anime_girl_publicdomainq.png',rarity:'Інтернет-добірка',favorite:false},
    {name:'Anime Portrait · Classic',image:'https://commons.wikimedia.org/wiki/Special:Redirect/file/Anime_girl_portrait.jpg',rarity:'Інтернет-добірка',favorite:false},
    {name:'Black Hair · Anime Portrait',image:'https://commons.wikimedia.org/wiki/Special:Redirect/file/Black_long_haired_anime_girl_portrait.jpg',rarity:'Інтернет-добірка',favorite:false},
    {name:'Anime Girl · Blue Sky',image:'https://commons.wikimedia.org/wiki/Special:Redirect/file/Anime_Girl_rendersvg.png',rarity:'Інтернет-добірка',favorite:false},
    {name:'Anime Girl · Kimono',image:'https://commons.wikimedia.org/wiki/Special:Redirect/file/A_girl_in_kimono_playing_hanafuda.webp',rarity:'Інтернет-добірка',favorite:false},
    {name:'Anime Girl · Sailor Style',image:'https://commons.wikimedia.org/wiki/Special:Redirect/file/Girl_in_sailor_fuku_publicdomainq.png',rarity:'Інтернет-добірка',favorite:false}
  ];
  {
    const current=safeRead();
    const seen=new Set(current.map(item=>item.image));
    const fresh=DEFAULT_PHOTOS.filter(item=>!seen.has(item.image));
    if(fresh.length) safeWrite([...fresh,...current]);
  }
  const grid=document.getElementById('animeCollectionGrid');
  function renderCollection(){
    const allItems=safeRead();
    document.getElementById('animeCollectionCount').textContent=String(allItems.length);
    document.getElementById('animeFavoritesCount').textContent=String(allItems.filter(x=>x.favorite).length);
    const query=(document.getElementById('animeCollectionSearch')?.value||'').trim().toLocaleLowerCase('uk');
    const favoritesOnly=!!document.getElementById('animeFavoritesOnly')?.checked;
    const sort=document.getElementById('animeCollectionSort')?.value||'newest';
    let items=allItems.map((item,index)=>({...item,_index:index})).filter(item=>
      (!favoritesOnly||item.favorite) && (!query||item.name.toLocaleLowerCase('uk').includes(query))
    );
    if(sort==='name') items.sort((a,b)=>a.name.localeCompare(b.name,'uk'));
    else if(sort==='favorites') items.sort((a,b)=>Number(!!b.favorite)-Number(!!a.favorite)||b._index-a._index);
    else items.sort((a,b)=>b._index-a._index);
    if(!allItems.length){grid.innerHTML='<div class="anime-empty" style="grid-column:1/-1">Фото тимчасово недоступні. Перевір підключення до інтернету.</div>';return;}
    if(!items.length){grid.innerHTML='<div class="anime-empty" style="grid-column:1/-1">Нічого не знайдено. Зміни фільтр або вимкни «Лише обране».</div>';return;}
    grid.innerHTML='';
    items.forEach((item)=>{
      const card=document.createElement('article');card.className='anime-card';
      const img=document.createElement('img');img.loading='lazy';img.alt=item.name;img.src=item.image;img.onerror=()=>{img.removeAttribute('src');img.alt='Зображення недоступне';};
      const body=document.createElement('div');body.className='anime-card-body';
      const name=document.createElement('strong');name.textContent=item.name;
      const rarity=document.createElement('small');rarity.textContent=item.rarity||'Звичайна картка';
      const actions=document.createElement('div');actions.className='anime-card-actions';
      const open=document.createElement('button');open.className='anime-btn';open.type='button';open.textContent='Відкрити';open.addEventListener('click',()=>window.open(item.image,'_blank','noopener,noreferrer'));
      const favorite=document.createElement('button');favorite.className='anime-btn';favorite.type='button';favorite.textContent=item.favorite?'♥ Обране':'♡ В обране';favorite.setAttribute('aria-pressed',String(!!item.favorite));favorite.addEventListener('click',()=>{const next=safeRead();const target=next.find(x=>x.name===item.name&&x.image===item.image);if(target)target.favorite=!target.favorite;safeWrite(next);renderCollection();});
      const del=document.createElement('button');del.className='anime-btn';del.type='button';del.textContent='Видалити';del.addEventListener('click',()=>{const next=safeRead();const target=next.findIndex(x=>x.name===item.name&&x.image===item.image);if(target>=0)next.splice(target,1);safeWrite(next);renderCollection();});
      actions.append(open,favorite,del);body.append(name,rarity,actions);card.append(img,body);grid.append(card);
    });
  }
  ['animeCollectionSearch','animeCollectionSort','animeFavoritesOnly'].forEach(id=>document.getElementById(id).addEventListener(id==='animeFavoritesOnly'?'change':'input',renderCollection));
  document.getElementById('animeExportCollection').addEventListener('click',()=>{
    const data=safeRead();
    const blob=new Blob([JSON.stringify({format:'khkozak-anime-collection',version:1,items:data},null,2)],{type:'application/json'});
    const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download='khkozak-anime-collection.json';link.click();URL.revokeObjectURL(url);
  });
  renderCollection();
})();
