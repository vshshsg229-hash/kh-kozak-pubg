(function(){
  'use strict';
  const root = document.querySelector('main');
  const nav = document.querySelector('.sidebar .nav');
  if (!root || !nav || document.getElementById('tab-anime')) return;

  const group = document.createElement('div');
  group.className = 'nav-group anime-hub-nav';
  group.innerHTML = '<div class="nav-group-title"><span style="color:#ff8bd5">✦</span> ANIME ZONE <small>GALLERY · COLLECTION</small></div><button class="nav-item" type="button" data-tab="anime" title="Відкрити Anime Hub"><span>🌸</span><span class="nav-label">Anime Hub & Collection</span><em>NEW</em></button>';
  nav.appendChild(group);
  group.querySelector('[data-tab="anime"]').addEventListener('click',function(){
    document.querySelectorAll('.view').forEach(function(v){v.classList.toggle('active',v.id==='tab-anime')});
    document.querySelectorAll('[data-tab]').forEach(function(b){b.classList.toggle('active',b.dataset.tab==='anime')});
    window.scrollTo({top:0,behavior:'smooth'});
  });

  const view = document.createElement('section');
  view.className = 'view';
  view.id = 'tab-anime';
  view.innerHTML = `
    <div class="anime-hero">
      <div class="anime-eyebrow">KH么KOZAK · ANIME HUB</div>
      <h1>ANIME <span>HUB</span></h1>
      <p>Аніме-героїні, дорослий ecchi та hentai-inspired pin-up арт без графічних сексуальних сцен. Усі персонажі в цій добірці — вигадані дорослі образи.</p>
      <div class="anime-actions">
        <button class="anime-btn primary" type="button" data-anime-search="images">⌕ Шукати тянок у Google</button><button class="anime-btn" type="button" data-anime-search="images" data-anime-query="adult anime ecchi pin-up illustration lingerie bunny girl fantasy pin-up">🔥 Ecchi / Hentai-style</button>
        <button class="anime-btn" type="button" data-anime-search="videos">▶ Знайти відео в Google</button>
        <button class="anime-btn" type="button" data-anime-search="images" data-anime-query="adult anime gothic pin-up character illustration non-explicit">🖤 Gothic Pin-up</button>
        <button class="anime-btn" type="button" data-anime-search="images" data-anime-query="adult anime bunny girl glamour illustration non-explicit">🐰 Bunny Glam</button>
        <button class="anime-btn" type="button" data-anime-search="images" data-anime-query="adult anime succubus fantasy character art non-explicit">😈 Succubus Fantasy</button>
        <button class="anime-btn" type="button" data-anime-search="images" data-anime-query="adult anime maid glamour pin-up illustration non-explicit">🖤 Maid Glam</button>
        <button class="anime-btn" type="button" data-anime-search="images" data-anime-query="adult anime swimsuit beach pin-up illustration non-explicit">☀️ Beach Pin-up</button>
        <button class="anime-btn" type="button" data-anime-search="images" data-anime-query="adult anime fantasy lingerie fashion illustration non-explicit">✨ Fantasy Glam</button>
        <button class="anime-btn" type="button" data-anime-search="images" data-anime-query="adult anime elf queen elegant fantasy pin-up illustration">🧝 Elf Queen</button>
        <button class="anime-btn" type="button" data-anime-search="images" data-anime-query="adult anime vampire queen gothic glamour illustration">🦇 Vampire Queen</button>
        <button class="anime-btn" type="button" data-anime-search="images" data-anime-query="adult anime catgirl fashion pin-up illustration">🐈 Catgirl Glam</button>
        <button class="anime-btn" type="button" data-anime-search="images" data-anime-query="adult anime fox spirit kitsune woman fantasy art">🦊 Kitsune</button>
        <button class="anime-btn" type="button" data-anime-search="images" data-anime-query="adult anime cyberpunk woman bodysuit character art">⚡ Cyber Glam</button>
        <button class="anime-btn" type="button" data-anime-search="images" data-anime-query="adult anime succubus queen fantasy character illustration">😈 Succubus Queen</button>
        <button class="anime-btn" type="button" data-anime-search="images" data-anime-query="adult anime elegant lingerie fashion illustration character design">💜 Lingerie Fashion</button>
        <button class="anime-btn" type="button" data-anime-search="images" data-anime-query="adult anime fantasy swimsuit pin-up illustration">🌊 Fantasy Swimwear</button>
      </div>
    </div>
    <div class="anime-panel">
      <div class="anime-eyebrow">01 / GOOGLE SEARCH</div><h2>Знайти персонажа</h2>
      <form id="animeSearchForm" class="anime-search-row">
        <input id="animeSearchQuery" class="anime-input" type="search" placeholder="Наприклад: anime girl blue hair" value="adult anime ecchi pin-up illustration" aria-label="Пошуковий запит">
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
  view.querySelectorAll('[data-anime-search]').forEach(b=>b.addEventListener('click',()=>googleSearch(b.dataset.animeSearch,b.dataset.animeQuery||document.getElementById('animeSearchQuery').value)));
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
    {name:'Anime Girl · Sailor Style',image:'https://commons.wikimedia.org/wiki/Special:Redirect/file/Girl_in_sailor_fuku_publicdomainq.png',rarity:'Інтернет-добірка',favorite:false},
    {name:'Anime Girl · Orange Outfit',image:'https://commons.wikimedia.org/wiki/Special:Redirect/file/Anime_girl_in_orange_shirt.svg',rarity:'Інтернет-добірка',favorite:false},
    {name:'Anime Girl · Purple Hair',image:'https://commons.wikimedia.org/wiki/Special:Redirect/file/Purple_Haired_Anime_Girl.svg',rarity:'Інтернет-добірка',favorite:false},
    {name:'Anime Girl · Red Outfit',image:'https://commons.wikimedia.org/wiki/Special:Redirect/file/Red_suit_anime_girl_with_board_2.png',rarity:'Інтернет-добірка',favorite:false},
    {name:'Anime Girl · Cyan Hair',image:'https://commons.wikimedia.org/wiki/Special:Redirect/file/Gray_cyan_hair_anime_girl.png',rarity:'Інтернет-добірка',favorite:false},
    {name:'Anime Girl · Wolf Style',image:'https://commons.wikimedia.org/wiki/Special:Redirect/file/Gray-Haired_Wolf_Girl_with_Collar.jpg',rarity:'Інтернет-добірка',favorite:false},
    {name:'Anime Girl · AI Portrait',image:'https://commons.wikimedia.org/wiki/Special:Redirect/file/Anime_Girl_GAN_generated.jpg',rarity:'Інтернет-добірка',favorite:false},
    {name:'Anime Woman · Elegant',image:'https://commons.wikimedia.org/wiki/Special:Redirect/file/Moe_Manga_Lady.png',rarity:'Інтернет-добірка',favorite:false},
    {name:'Anime Girl · Mecha Style',image:'https://commons.wikimedia.org/wiki/Special:Redirect/file/Mecha-girl.png',rarity:'Інтернет-добірка',favorite:false},
    {name:'Anime Girl · Colorful Portrait',image:'https://commons.wikimedia.org/wiki/Special:Redirect/file/Anime_Girl_Cola_Mateya.svg',rarity:'Інтернет-добірка',favorite:false},
    {name:'Anime Girl · Classic Art',image:'https://commons.wikimedia.org/wiki/Special:Redirect/file/Moe-3251269_1920.png',rarity:'Інтернет-добірка',favorite:false},
    {name:'Anime Girl · Manga Portrait',image:'https://commons.wikimedia.org/wiki/Special:Redirect/file/Frontviewofananimeface.png',rarity:'Інтернет-добірка',favorite:false},
    {name:'Anime Girl · Soft Aesthetic',image:'https://commons.wikimedia.org/wiki/Special:Redirect/file/Aesthetic-anime-girl.jpg',rarity:'Інтернет-добірка',favorite:false},
    {name:'Anime Girl · Portrait Collection',image:'https://commons.wikimedia.org/wiki/Special:Redirect/file/Artbreeder_example_anime_portraits.jpg',rarity:'Інтернет-добірка',favorite:false},
    {name:'Anime Girl · Red Hair',image:'https://commons.wikimedia.org/wiki/Special:Redirect/file/Angry_anime_girl.png',rarity:'Інтернет-добірка',favorite:false},
    {name:'Anime Girl · Cute Style',image:'https://commons.wikimedia.org/wiki/Special:Redirect/file/AnimeGirlXzit.png',rarity:'Інтернет-добірка',favorite:false},
    {name:'Anime Girl · Purple Portrait',image:'https://commons.wikimedia.org/wiki/Special:Redirect/file/All_Weather_Girls_Portrait.png',rarity:'Інтернет-добірка',favorite:false},
    {name:'Anime Girl · Mecha Ecchi Armor',image:'https://commons.wikimedia.org/wiki/Special:Redirect/file/Mecha-girl.png',rarity:'Mecha · Pin-up',favorite:false},
    {name:'Anime Girl · Maid Glam',image:'https://commons.wikimedia.org/wiki/Special:Redirect/file/Meido.png',rarity:'Ecchi · Glam',favorite:false},
    {name:'Anime Girl · Mikaela',image:'https://commons.wikimedia.org/wiki/Special:Redirect/file/Mikaela_color.png',rarity:'Anime · Character Art',favorite:false},
    {name:'Anime Girl · Fuwafuwa',image:'https://commons.wikimedia.org/wiki/Special:Redirect/file/Fuwafuwa-chan.jpg',rarity:'Anime · Character Art',favorite:false},
    {name:'Anime Girl · Mahuri',image:'https://commons.wikimedia.org/wiki/Special:Redirect/file/Mahuri.jpg',rarity:'Anime · Character Art',favorite:false},
    {name:'Anime Girl · Moemiku Yuni',image:'https://commons.wikimedia.org/wiki/Special:Redirect/file/Moemiku_yuni.png',rarity:'Anime · Character Art',favorite:false},
    {name:'Anime Girl · Silver-Hair Sci-Fi',image:'https://commons.wikimedia.org/wiki/Special:Redirect/file/Paulliu_girl_with_silver_hair.svg',rarity:'Sci-Fi · Glam',favorite:false},
    {name:'Anime Girl · Purple Star Glam',image:'https://commons.wikimedia.org/wiki/Special:Redirect/file/Purple_Haired_Anime_Girl_With_Star_Background.svg',rarity:'Ecchi · Glam',favorite:false},
    {name:'Anime Girl · Mecha Pilot',image:'https://commons.wikimedia.org/wiki/Special:Redirect/file/Mirai_Suenaga_-_6839970960.jpg',rarity:'Mecha · Pilot',favorite:false},
    {name:'Anime Girl · Manga Pin-up',image:'https://commons.wikimedia.org/wiki/Special:Redirect/file/PanchiraIlustration.png',rarity:'Ecchi · Pin-up',favorite:false},
    {name:'Ecchi Art · Classic Anime',image:'https://commons.wikimedia.org/wiki/Special:Redirect/file/Anime_Girl.svg',rarity:'Adult-style · Ecchi',favorite:false},
    {name:'Ecchi Art · Beach Pin-up',image:'https://commons.wikimedia.org/wiki/Special:Redirect/file/Anime_girl_at_beach.jpg',rarity:'Adult-style · Pin-up',favorite:false},
    {name:'Ecchi Art · Purple Bunny Girl',image:'https://commons.wikimedia.org/wiki/Special:Redirect/file/Bunny_girl_with_purple_hair.svg',rarity:'Adult-style · Bunny',favorite:false},
    {name:'Ecchi Art · Anime Girl PNG',image:'https://commons.wikimedia.org/wiki/Special:Redirect/file/Anime_Girl.png',rarity:'Adult-style · Illustration',favorite:false},
    {name:'Ecchi Art · Anime Girl Portrait',image:'https://commons.wikimedia.org/wiki/Special:Redirect/file/Anime_Girl_upright_version.jpg',rarity:'Adult-style · Portrait',favorite:false},
    {name:'Ecchi Art · Beach Anime Girl',image:'https://commons.wikimedia.org/wiki/Special:Redirect/file/Anime_girl_at_beach.jpg',rarity:'Adult-style · Beach Pin-up',favorite:false},
    {name:'Ecchi Art · Bunny Girl',image:'https://commons.wikimedia.org/wiki/Special:Redirect/file/Bunny_girl_with_purple_hair.svg',rarity:'Adult-style · Bunny',favorite:false},
    {name:'Ecchi Art · Anime Girl Inkscape',image:'https://commons.wikimedia.org/wiki/Special:Redirect/file/Anime_Girl_Inkscape.png',rarity:'Adult-style · Illustration',favorite:false},
    {name:'Ecchi Art · Anime Girl Batik',image:'https://commons.wikimedia.org/wiki/Special:Redirect/file/Anime_Girl_batik.png',rarity:'Adult-style · Illustration',favorite:false},
    {name:'Ecchi Art · Anime Girl Portrait PNG',image:'https://commons.wikimedia.org/wiki/Special:Redirect/file/Anime_Girl_librsvg.png',rarity:'Adult-style · Portrait',favorite:false},
    {name:'Ecchi Art · Beautiful Anime Girl',image:'https://commons.wikimedia.org/wiki/Special:Redirect/file/Beautiful_girl.jpg',rarity:'Adult-style · Pin-up',favorite:false},
    {name:'Ecchi Art · Fairy Glam',image:'https://commons.wikimedia.org/wiki/Special:Redirect/file/Carefree_as_a_fairy_by_karbo_59804362.jpg',rarity:'Adult-style · Fantasy',favorite:false},
    {name:'Ecchi Art · Manga Pin-up 2',image:'https://commons.wikimedia.org/wiki/Special:Redirect/file/Dojikko2.3.svg',rarity:'Adult-style · Manga',favorite:false},
    {name:'Ecchi Art · Bowsette Glam',image:'https://commons.wikimedia.org/wiki/Special:Redirect/file/Bowsette_by_Kira_I.png',rarity:'Adult-style · Glam',favorite:false},
    {name:'Ecchi Art · Fantasy Trio',image:'https://commons.wikimedia.org/wiki/Special:Redirect/file/Butterfly_trio_and_tasty_trains_by_joanhonekawa_dbjyygv.jpg',rarity:'Adult-style · Fantasy',favorite:false},
    {name:'Ecchi Art · Manga Character',image:'https://commons.wikimedia.org/wiki/Special:Redirect/file/Attack_of_the_giant_muscle_by_joanhonekawa_d4mlg5g.jpg',rarity:'Adult-style · Manga Art',favorite:false},
    {name:'Ecchi Art · Witch Fantasy',image:'https://commons.wikimedia.org/wiki/Special:Redirect/file/Sabbat_of_the_Witch_OP_screenshot.png',rarity:'Adult-style · Fantasy',favorite:false},
    {name:'Ecchi Art · Sakura Portrait',image:'https://commons.wikimedia.org/wiki/Special:Redirect/file/Anime_Girl_librsvg.png',rarity:'Adult-style · Portrait',favorite:false},
    {name:'Ecchi Art · Summer Illustration',image:'https://commons.wikimedia.org/wiki/Special:Redirect/file/Anime_girl_at_beach.jpg',rarity:'Adult-style · Summer',favorite:false},
    {name:'Ecchi Art · Purple Hair Bunny',image:'https://commons.wikimedia.org/wiki/Special:Redirect/file/Bunny_girl_with_purple_hair.svg',rarity:'Adult-style · Bunny',favorite:false},
    {name:'Ecchi Art · Lizard-Girl Bikini',image:'https://commons.wikimedia.org/wiki/Special:Redirect/file/Anime_art_of_lizard_girl_with_bikini.jpg',rarity:'Adult-style · Fantasy',favorite:false},
    {name:'Ecchi Art · Elf Fantasy',image:'https://commons.wikimedia.org/wiki/Special:Redirect/file/Elf_girl_on_bench.jpg',rarity:'Adult-style · Elf',favorite:false},
    {name:'Ecchi Art · Wikipe-tan Bikini',image:'https://commons.wikimedia.org/wiki/Special:Redirect/file/Fan_service_by_Wikipe-tan_with_bikini.jpg',rarity:'Adult-style · Bikini',favorite:false},
    {name:'Ecchi Art · Manga Stockings',image:'https://commons.wikimedia.org/wiki/Special:Redirect/file/Ecchi_manga_-_Dibujo_estilo_manga_de_una_chica_con_pantimedias_puestas.jpg',rarity:'Adult-style · Fashion',favorite:false},
    {name:'Ecchi Art · Dojikko Illustration',image:'https://commons.wikimedia.org/wiki/Special:Redirect/file/Dojikko.png',rarity:'Adult-style · Manga',favorite:false},
    {name:'Ecchi Art · Fantasy Bikini Armor',image:'https://commons.wikimedia.org/wiki/Special:Redirect/file/Bikini_armor.jpg',rarity:'Adult-style · Fantasy Armor',favorite:false},
    {name:'Ecchi Art · Lingerie Manga',image:'https://commons.wikimedia.org/wiki/Special:Redirect/file/Lingerie_in_anime_and_manga.jpg',rarity:'Adult-style · Lingerie',favorite:false}
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
