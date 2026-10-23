/* KOZAK NEXUS v18.21.0 — pin sidebar sections to Favorites */
(()=>{'use strict';
const KEY='kozakNexus.sidebarFavorites.v1';
const sidebar=document.querySelector('.sidebar'),nav=sidebar?.querySelector('.nav');
if(!sidebar||!nav||sidebar.querySelector('#nexusFavorites'))return;
const read=()=>{try{const v=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(v)?v.filter(x=>typeof x==='string'):[]}catch(_){return[]}};
let pinned=read();
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(pinned))}catch(_){}};
const entries=()=>[...nav.querySelectorAll('.nav-item[data-tab]')].filter(b=>b.dataset.tab&&!b.dataset.nxfGenerated);
const getLabel=b=>b.querySelector('.nav-label')?.textContent?.trim()||b.textContent.trim();
const box=document.createElement('section');box.id='nexusFavorites';box.setAttribute('aria-label','Обрані розділи');
box.innerHTML='<div class="nxf-head"><span>★ ОБРАНЕ</span><span class="nxf-count"></span></div><div class="nxf-list"></div><div class="nxf-empty">Натисни ☆ біля назви розділу, щоб закріпити його тут.</div>';
nav.insertBefore(box,nav.firstChild);
function render(){
 const list=box.querySelector('.nxf-list'),empty=box.querySelector('.nxf-empty');
 list.replaceChildren();
 const all=entries();pinned=pinned.filter(id=>all.some(b=>b.dataset.tab===id));
 box.querySelector('.nxf-count').textContent=pinned.length?String(pinned.length):'0';
 pinned.forEach(id=>{const original=all.find(b=>b.dataset.tab===id);if(!original)return;
  const btn=document.createElement('button');btn.type='button';btn.className='nxf-link';btn.innerHTML='<span class="nxf-icon"></span><span class="nxf-label"></span>';
  btn.querySelector('.nxf-icon').textContent=original.querySelector(':scope > span:first-child')?.textContent?.trim()||'›';
  btn.querySelector('.nxf-label').textContent=getLabel(original);btn.setAttribute('aria-label','Відкрити '+getLabel(original));
  btn.addEventListener('click',()=>{original.click()});list.appendChild(btn);
 });
 empty.hidden=pinned.length>0;
 all.forEach(b=>{
  let star=b.querySelector(':scope > .nxf-star');if(!star){star=document.createElement('button');star.type='button';star.className='nxf-star';star.setAttribute('aria-label','Закріпити в обраному');star.title='Закріпити в обраному';star.textContent='☆';b.appendChild(star)}
  const yes=pinned.includes(b.dataset.tab);b.classList.toggle('nxf-pinned',yes);star.textContent=yes?'★':'☆';star.setAttribute('aria-pressed',String(yes));star.setAttribute('aria-label',yes?'Відкріпити з обраного':'Закріпити в обраному');star.title=yes?'Відкріпити з обраного':'Закріпити в обраному';
 });
}
nav.addEventListener('click',e=>{const star=e.target.closest('.nxf-star');if(!star)return;e.preventDefault();e.stopPropagation();const item=star.closest('.nav-item'),id=item?.dataset.tab;if(!id)return;pinned=pinned.includes(id)?pinned.filter(x=>x!==id):[...pinned,id];save();render();});
render();
const observer=new MutationObserver(()=>{if(!sidebar.querySelector('#nexusFavorites')){nav.insertBefore(box,nav.firstChild)}render()});
observer.observe(nav,{childList:true,subtree:true});
})();