/* KOZAK NEXUS Control Flow 18.18.0 — responsive controls, existing tab actions preserved */
(()=>{'use strict';
const $=s=>document.querySelector(s);
const body=document.body,menu=$('#mobileMenuToggle'),close=$('#mobileSidebarClose'),backdrop=$('#mobileMenuBackdrop'),side=$('.sidebar'),desktop=$('#desktopSidebarToggle');
if(!side)return;
document.querySelectorAll('#nexusControlDock,.nexus-control-dock').forEach(n=>n.remove());
const isDrawer=()=>window.matchMedia('(max-width:1100px)').matches;
function openMenu(){body.classList.add('nexus-nav-open');menu?.setAttribute('aria-expanded','true');backdrop?.removeAttribute('hidden');}
function closeMenu(){body.classList.remove('nexus-nav-open');menu?.setAttribute('aria-expanded','false');if(backdrop)backdrop.hidden=true;}
menu?.addEventListener('click',e=>{if(isDrawer()){e.preventDefault();e.stopImmediatePropagation();body.classList.contains('nexus-nav-open')?closeMenu():openMenu();}},true);
close?.addEventListener('click',e=>{if(isDrawer()){e.preventDefault();closeMenu();}});
backdrop?.addEventListener('click',()=>closeMenu());
desktop?.addEventListener('click',e=>{if(!isDrawer()){e.preventDefault();e.stopImmediatePropagation();body.classList.toggle('nexus-sidebar-collapsed');desktop.setAttribute('aria-expanded',String(!body.classList.contains('nexus-sidebar-collapsed')));}},true);
side.addEventListener('click',e=>{if(isDrawer()&&e.target.closest('.nav-item,[data-tab-link]'))closeMenu();});
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMenu();});
let wasDrawer=isDrawer();window.addEventListener('resize',()=>{const now=isDrawer();if(now!==wasDrawer){closeMenu();wasDrawer=now;}},{passive:true});
})();
