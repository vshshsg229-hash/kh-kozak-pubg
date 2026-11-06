(()=>{'use strict';
/* KOZAK NEXUS 21.0 · visual runtime only; no gameplay/save mutations */
const start=()=>{const body=document.body;if(!body)return;body.classList.add('nexus-redesign');
const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const observeViews=()=>{document.querySelectorAll('.view.active').forEach(v=>{v.classList.remove('nx-entering');void v.offsetWidth;v.classList.add('nx-entering')})};
const activeRoot=document.querySelector('.app-shell')||document;
const reveal=()=>{if(reduced)return;const nodes=activeRoot.querySelectorAll('.view.active .panel,.view.active .feature-card,.view.active .stat-card,.view.active .mission-card,.view.active .reward-card,.view.active .game-card,.view.active .section-card,.view.active .mode-card');nodes.forEach((node,i)=>{if(node.dataset.nxReveal)return;node.dataset.nxReveal='1';node.classList.add('nx-reveal');node.style.transitionDelay=Math.min(i%7,6)*45+'ms';if(!('IntersectionObserver'in window)){node.classList.add('nx-visible');return}io.observe(node)})};
const io='IntersectionObserver'in window?new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('nx-visible');io.unobserve(e.target)}}),{threshold:.08,rootMargin:'0px 0px -24px 0px'}):null;
const refresh=()=>{observeViews();reveal()};
refresh();
const appObserver=new MutationObserver(records=>{let changed=false;for(const rec of records){if(rec.type==='attributes'&&rec.attributeName==='class'&&rec.target.classList?.contains('view')&&rec.target.classList.contains('active'))changed=true;if(rec.type==='childList'&&rec.target.closest?.('.view.active'))changed=true}if(changed)requestAnimationFrame(refresh)});
appObserver.observe(activeRoot,{subtree:true,childList:true,attributes:true,attributeFilter:['class']});
document.addEventListener('click',e=>{const trigger=e.target.closest('[data-tab], [data-tab-link]');if(trigger)window.setTimeout(refresh,80)},true);
window.addEventListener('pageshow',refresh,{once:true});
};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();