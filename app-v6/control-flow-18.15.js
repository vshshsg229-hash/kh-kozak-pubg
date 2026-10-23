/* KOZAK NEXUS Control Flow 18.15.0
   Adds a persistent device dock; every destination delegates to the existing tab button. */
(()=>{'use strict';
function init(){
 if(document.getElementById('nexusControlDock'))return;
 const nav=document.querySelector('.sidebar .nav');
 if(!nav)return;
 const dock=document.createElement('nav');
 dock.id='nexusControlDock';dock.className='nexus-control-dock';dock.setAttribute('aria-label','Швидка навігація');
 dock.innerHTML=[
  ['home','⌂','Головна'],
  ['games','▣','Ігри'],
  ['missions','◈','Місії'],
  ['progress','✦','Прогрес'],
  ['__more','☰','Усі розділи']
 ].map(([tab,icon,label])=>'<button type="button" class="nexus-dock-item" data-dock-tab="'+tab+'" aria-label="'+label+'"><span class="nexus-dock-icon" aria-hidden="true">'+icon+'</span><span class="nexus-dock-label">'+label+'</span></button>').join('');
 document.body.appendChild(dock);
 const original=tab=>nav.querySelector('.nav-item[data-tab="'+tab+'"]')||document.querySelector('.nav-item[data-tab="'+tab+'"]');
 dock.addEventListener('click',e=>{
  const b=e.target.closest('[data-dock-tab]');if(!b)return;
  const tab=b.dataset.dockTab;
  if(tab==='__more'){
   const toggle=document.getElementById('mobileMenuToggle');
   if(toggle){if(toggle.getAttribute('aria-expanded')!=='true')toggle.click();}
   else document.querySelector('.sidebar')?.classList.toggle('nexus-sidebar-open');
   return;
  }
  const search=document.getElementById('sidebarQuickSearchInput');
  if(search&&search.value){search.value='';search.dispatchEvent(new Event('input',{bubbles:true}));}
  const target=original(tab);if(target)target.click();
  if(document.getElementById('mobileMenuToggle')?.getAttribute('aria-expanded')==='true')document.getElementById('mobileMenuToggle').click();
 });
 const sync=()=>{
  const active=document.querySelector('.view.active');
  const tab=active?.id?.replace(/^tab-/,'')||'home';
  dock.querySelectorAll('[data-dock-tab]').forEach(b=>{
   const selected=b.dataset.dockTab===tab;
   b.classList.toggle('active',selected);b.setAttribute('aria-current',selected?'page':'false');
  });
 };
 new MutationObserver(sync).observe(document.querySelector('main')||document.body,{subtree:true,attributes:true,attributeFilter:['class']});
 document.addEventListener('click',e=>{if(e.target.closest('[data-tab],[data-game]'))requestAnimationFrame(sync);});
 sync();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();