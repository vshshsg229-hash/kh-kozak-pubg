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
      <p>Галерея персонажів, пошук зображень, відео та власна колекція. Усе в одному розділі Battle Hub.</p>
      <div class="anime-actions">
        <button class="anime-btn primary" type="button" data-anime-search="images">⌕ Шукати тянок у Google</button>
        <button class="anime-btn" type="button" data-anime-search="videos">▶ Знайти відео в Google</button>
      </div>
      <div class="anime-note">Пошук відкриває Google у новій вкладці. Google не надає універсального вбудованого плеєра для всіх знайдених відео — нижче можна відкрити сумісне відео прямо в додатку.</div>
    </div>
    <div class="anime-panel">
      <div class="anime-eyebrow">01 / GOOGLE SEARCH</div><h2>Знайти персонажа</h2>
      <form id="animeSearchForm" class="anime-search-row">
        <input id="animeSearchQuery" class="anime-input" type="search" placeholder="Наприклад: anime girl blue hair" value="anime girl character art" aria-label="Пошуковий запит">
        <button class="anime-btn primary" type="submit">Пошук у Google ↗</button>
      </form>
    </div>
    <div class="anime-panel">
      <div class="anime-eyebrow">02 / IN-APP VIDEO PLAYER</div><h2>Відео всередині додатка</h2>
      <p>Встав посилання на прямий MP4/WebM або на відео Google Drive, доступне за посиланням. Для Google Drive використовується офіційний preview player.</p>
      <form id="animeVideoForm" class="anime-search-row">
        <input id="animeVideoUrl" class="anime-input" type="url" placeholder="Посилання на MP4 або Google Drive" aria-label="Посилання на відео" required>
        <button class="anime-btn primary" type="submit">Відкрити плеєр ▶</button>
      </form>
      <div id="animeVideoPlayer" style="margin-top:12px"><div class="anime-empty">Відеоплеєр готовий. Додай посилання на сумісне відео.</div></div>
      <p class="anime-note">Відео, яке блокує вбудовування або вимагає авторизації, може не відтворюватися. Не вставляй приватні посилання.</p>
    </div>
    <div class="anime-panel">
      <div class="anime-eyebrow">03 / YOUR COLLECTION</div><h2>Моя колекція</h2>
      <div class="anime-collection-stats"><span>Карток: <b id="animeCollectionCount">0</b></span><span>Збереження на цьому пристрої</span></div>
      <form id="animeAddForm" class="anime-search-row" style="margin-top:12px">
        <input id="animeCardName" class="anime-input" type="text" placeholder="Ім'я персонажа" aria-label="Ім'я персонажа" required>
        <input id="animeCardImage" class="anime-input" type="url" placeholder="Пряме посилання на зображення (https://…)" aria-label="Посилання на зображення" required>
        <button class="anime-btn primary" type="submit">＋ Додати картку</button>
      </form>
      <p class="anime-note">Після пошуку в Google Images відкрий зображення, скопіюй пряме посилання на файл і додай його сюди. Використовуй зображення, які маєш право зберігати/показувати.</p>
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
  const grid=document.getElementById('animeCollectionGrid');
  function renderCollection(){
    const items=safeRead();
    document.getElementById('animeCollectionCount').textContent=String(items.length);
    if(!items.length){grid.innerHTML='<div class="anime-empty" style="grid-column:1/-1">Колекція поки порожня. Знайди зображення в Google та додай першу картку.</div>';return;}
    grid.innerHTML='';
    items.forEach((item,index)=>{
      const card=document.createElement('article');card.className='anime-card';
      const img=document.createElement('img');img.loading='lazy';img.alt=item.name;img.src=item.image;img.onerror=()=>{img.removeAttribute('src');img.alt='Зображення недоступне';};
      const body=document.createElement('div');body.className='anime-card-body';
      const name=document.createElement('strong');name.textContent=item.name;
      const rarity=document.createElement('small');rarity.textContent=item.rarity||'Звичайна картка';
      const actions=document.createElement('div');actions.className='anime-card-actions';
      const open=document.createElement('button');open.className='anime-btn';open.type='button';open.textContent='Відкрити';open.addEventListener('click',()=>window.open(item.image,'_blank','noopener,noreferrer'));
      const del=document.createElement('button');del.className='anime-btn';del.type='button';del.textContent='Видалити';del.addEventListener('click',()=>{const next=safeRead();next.splice(index,1);safeWrite(next);renderCollection();});
      actions.append(open,del);body.append(name,rarity,actions);card.append(img,body);grid.append(card);
    });
  }
  document.getElementById('animeAddForm').addEventListener('submit',e=>{
    e.preventDefault();
    const name=document.getElementById('animeCardName').value.trim();
    const image=document.getElementById('animeCardImage').value.trim();
    if(!/^https?:\/\//i.test(image)){alert('Потрібне пряме посилання на зображення, що починається з https:// або http://');return;}
    const items=safeRead();items.unshift({name,image,rarity:['Звичайна','Рідкісна','Епічна','Легендарна'][Math.min(3,Math.floor(Math.random()*4))]});
    if(!safeWrite(items)){alert('Не вдалося зберегти колекцію на цьому пристрої.');return;}
    e.target.reset();renderCollection();
  });

  function getDriveId(url){const m=url.match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?id=)([a-zA-Z0-9_-]+)/);return m?m[1]:null;}
  document.getElementById('animeVideoForm').addEventListener('submit',e=>{
    e.preventDefault();
    const raw=document.getElementById('animeVideoUrl').value.trim();
    let parsed;try{parsed=new URL(raw)}catch{alert('Перевір посилання на відео.');return;}
    if(!/^https?:$/.test(parsed.protocol)){alert('Дозволені лише HTTP/HTTPS посилання.');return;}
    const host=parsed.hostname.toLowerCase();
    const player=document.getElementById('animeVideoPlayer');player.replaceChildren();
    const driveId=getDriveId(raw);
    if(host==='drive.google.com'&&driveId){
      const frame=document.createElement('iframe');frame.className='anime-video-frame';frame.src='https://drive.google.com/file/d/'+encodeURIComponent(driveId)+'/preview';frame.title='Google Drive video player';frame.allow='autoplay; fullscreen; picture-in-picture';frame.allowFullscreen=true;frame.referrerPolicy='no-referrer';player.append(frame);return;
    }
    if(/\.(mp4|webm|ogg)(?:$|\?)/i.test(parsed.pathname+parsed.search)){
      const video=document.createElement('video');video.className='anime-video-frame';video.controls=true;video.playsInline=true;video.preload='metadata';video.src=raw;player.append(video);return;
    }
    const msg=document.createElement('div');msg.className='anime-empty';msg.textContent='Це посилання не схоже на прямий MP4/WebM або Google Drive файл. Google Search не дозволяє універсально вбудувати результати відео. Знайди відео з підтримкою вбудовування або використай пряме посилання.';player.append(msg);
  });
  renderCollection();
})();