(()=>{'use strict';
const KEY='khkozak_game_favorites_v1';
const grid=document.querySelector('#tab-games .games-grid');
if(!grid)return;
let favorites=new Set();
try{const raw=JSON.parse(localStorage.getItem(KEY)||'[]');if(Array.isArray(raw))favorites=new Set(raw.filter(x=>typeof x==='string'))}catch(_){}
let filter='all',query='';
const toolbar=document.createElement('section');
toolbar.className='game-library-tools';
toolbar.setAttribute('aria-label','Пошук і вибране');
toolbar.innerHTML='<div class="game-library-top"><label class="game-library-search"><span aria-hidden="true">⌕</span><input type="search" id="gameLibrarySearch" placeholder="Знайти мінігру..." autocomplete="off" aria-label="Пошук ігор"><kbd>⌘ / Ctrl K</kbd></label><div class="game-library-count" id="gameLibraryCount" aria-live="polite">100 режимів</div></div><div class="game-library-filters" role="group" aria-label="Фільтр ігор"><button type="button" class="game-filter active" data-library-filter="all">Усі ігри</button><button type="button" class="game-filter" data-library-filter="favorites">★ Обрані <span id="gameFavoriteCount">0</span></button><button type="button" class="game-filter" data-library-filter="played">Зіграні</button></div><p class="game-library-hint">★ Збережи улюблені режими — список залишиться на цьому пристрої.</p>';
grid.parentNode.insertBefore(toolbar,grid);
function idFor(card){const launch=card.querySelector('[data-game]');return launch?.dataset.game||''}
function decorate(){
 const cards=[...grid.querySelectorAll('.game-tile')];
 cards.forEach(card=>{
  const id=idFor(card);if(!id)return;
  let b=card.querySelector('.game-favorite-toggle');
  if(!b){b=document.createElement('button');b.type='button';b.className='game-favorite-toggle';b.setAttribute('aria-label','Додати до обраного');b.title='Додати до обраного';b.dataset.favoriteGame=id;const content=card.querySelector('.tile-content')||card;content.insertBefore(b,content.firstChild)}
  const active=favorites.has(id);b.classList.toggle('is-favorite',active);const glyph=active?'★':'☆';if(b.textContent!==glyph)b.textContent=glyph;b.setAttribute('aria-pressed',String(active));b.setAttribute('aria-label',active?'Прибрати з обраного':'Додати до обраного');b.title=active?'Прибрати з обраного':'Додати до обраного';
 });
}
function apply(){
 const cards=[...grid.querySelectorAll('.game-tile')];
 let shown=0;
 cards.forEach(card=>{
  const id=idFor(card),text=(card.textContent||'').toLocaleLowerCase();
  const matches=text.includes(query.toLocaleLowerCase());
  const fav=filter!=='favorites'||favorites.has(id);
  const played=filter!=='played'||(Number(localStorage.getItem('khkozak_game_played_'+id)||0)>0);
  const visible=matches&&fav&&played;card.hidden=!visible;if(visible)shown++;
 });
 const count=document.querySelector('#gameLibraryCount');if(count)count.textContent=shown+' / '+cards.length+' режимів';
 const fc=document.querySelector('#gameFavoriteCount');if(fc)fc.textContent=String(favorites.size);
 toolbar.querySelectorAll('[data-library-filter]').forEach(b=>b.classList.toggle('active',b.dataset.libraryFilter===filter));
}
grid.addEventListener('click',e=>{
 const b=e.target.closest('[data-favorite-game]');if(!b)return;
 e.preventDefault();e.stopPropagation();const id=b.dataset.favoriteGame;
 if(favorites.has(id))favorites.delete(id);else favorites.add(id);
 try{localStorage.setItem(KEY,JSON.stringify([...favorites]))}catch(_){}
 decorate();apply();
});
toolbar.addEventListener('click',e=>{const b=e.target.closest('[data-library-filter]');if(!b)return;filter=b.dataset.libraryFilter;apply()});
const search=toolbar.querySelector('#gameLibrarySearch');
search.addEventListener('input',()=>{query=search.value.trim();apply()});
document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();search.focus()}});
const observer=new MutationObserver(()=>{decorate();apply()});observer.observe(grid,{childList:true});
decorate();apply();
})();