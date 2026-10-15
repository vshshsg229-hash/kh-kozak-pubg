(()=>{'use strict';
const KEY='khkozak_game_favorites_v1';
const grid=document.querySelector('#kh100Grid')||document.querySelector('#tab-games .games-grid');
if(!grid)return;
const arcade=grid.id==='kh100Grid';
let favorites=new Set();
try{const raw=JSON.parse(localStorage.getItem(KEY)||'[]');if(Array.isArray(raw))favorites=new Set(raw.filter(x=>typeof x==='string'))}catch(_){}
let filter='all';
const toolbar=document.createElement('section');
toolbar.className='game-library-tools';
toolbar.setAttribute('aria-label','Фільтр улюблених і зіграних ігор');
toolbar.innerHTML='<div class="game-library-top"><strong class="game-library-title">ТВОЯ ІГРОВА БІБЛІОТЕКА</strong><div class="game-library-count" id="gameLibraryCount" aria-live="polite">1000 мініігор</div></div><div class="game-library-filters" role="group" aria-label="Фільтр ігор"><button type="button" class="game-filter active" data-library-filter="all">Усі ігри</button><button type="button" class="game-filter" data-library-filter="favorites">★ Обрані <span id="gameFavoriteCount">0</span></button><button type="button" class="game-filter" data-library-filter="played">Зіграні</button></div><p class="game-library-hint">★ Додавай ігри в обране. Твої позначки зберігаються на цьому пристрої.</p>';
if(arcade){const base=document.querySelector('#kh100Toolbar');if(base)base.insertAdjacentElement('afterend',toolbar);else grid.before(toolbar)}else grid.before(toolbar);
function idFor(card){if(arcade){const b=card.querySelector('[data-kh100]');return b?'kh100-'+(Number(b.dataset.kh100)+1):''}const b=card.querySelector('[data-game]');return b?.dataset.game||''}
function decorate(){
 const cards=[...grid.querySelectorAll(arcade?'.kh100-card':'.game-tile')];
 cards.forEach(card=>{
  const id=idFor(card);if(!id)return;
  let b=card.querySelector('.game-favorite-toggle');
  if(!b){b=document.createElement('button');b.type='button';b.className='game-favorite-toggle';b.dataset.favoriteGame=id;const content=card.querySelector(arcade?'.kh100-art':'.tile-content')||card;b.setAttribute('aria-pressed','false');content.appendChild(b)}
  const active=favorites.has(id),glyph=active?'★':'☆';
  if(b.textContent!==glyph)b.textContent=glyph;
  b.classList.toggle('is-favorite',active);b.setAttribute('aria-pressed',String(active));b.setAttribute('aria-label',active?'Прибрати з обраного':'Додати до обраного');b.title=active?'Прибрати з обраного':'Додати до обраного';
 });
}
function apply(){
 const cards=[...grid.querySelectorAll(arcade?'.kh100-card':'.game-tile')];
 const search=arcade?document.querySelector('#kh100Search'):document.querySelector('#gameLibrarySearch');
 const category=arcade?document.querySelector('#kh100Category'):null;
 const q=(search?.value||'').trim().toLocaleLowerCase(),cat=category?.value||'all';
 let shown=0;
 cards.forEach(card=>{
  const id=idFor(card),name=(arcade?(card.dataset.name||card.textContent):(card.textContent||'')).toLocaleLowerCase();
  const matches=name.includes(q)&&(cat==='all'||!category||card.dataset.category===cat);
  const fav=filter!=='favorites'||favorites.has(id);
  let plays=0;try{plays=Number(localStorage.getItem('khkozak_game_played_'+id)||0)}catch(_){}
  const played=filter!=='played'||plays>0;
  const visible=matches&&fav&&played;card.hidden=!visible;if(visible)shown++;
 });
 const count=document.querySelector('#gameLibraryCount');if(count)count.textContent=shown+' / '+cards.length+' ігор';
 const fc=document.querySelector('#gameFavoriteCount');if(fc)fc.textContent=String(favorites.size);
 toolbar.querySelectorAll('[data-library-filter]').forEach(b=>b.classList.toggle('active',b.dataset.libraryFilter===filter));
 const oldCount=document.querySelector('#kh100Count');if(oldCount)oldCount.textContent=shown+' ігор';
}
grid.addEventListener('click',e=>{
 const fav=e.target.closest('[data-favorite-game]');
 if(fav){e.preventDefault();e.stopPropagation();const id=fav.dataset.favoriteGame;if(favorites.has(id))favorites.delete(id);else favorites.add(id);try{localStorage.setItem(KEY,JSON.stringify([...favorites]))}catch(_){}decorate();apply();return}
 const launch=e.target.closest(arcade?'[data-kh100]':'[data-game]');
 if(launch){const id=arcade?'kh100-'+(Number(launch.dataset.kh100)+1):launch.dataset.game;try{const key='khkozak_game_played_'+id;localStorage.setItem(key,String(Number(localStorage.getItem(key)||0)+1));apply()}catch(_){}}
});
toolbar.addEventListener('click',e=>{const b=e.target.closest('[data-library-filter]');if(!b)return;filter=b.dataset.libraryFilter;apply()});
const search=arcade?document.querySelector('#kh100Search'):toolbar.querySelector('#gameLibrarySearch');
if(search)search.addEventListener('input',apply);
const category=arcade?document.querySelector('#kh100Category'):null;if(category)category.addEventListener('change',apply);
document.addEventListener('kh100-finished',apply);
const observer=new MutationObserver(()=>{decorate();apply()});observer.observe(grid,{childList:true});
decorate();apply();
})();