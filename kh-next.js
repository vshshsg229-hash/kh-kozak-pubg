/* KH么Kozak NEXT · shared motion and app navigation polish */
(()=>{'use strict';
if(window.__KH_NEXT_READY__)return;window.__KH_NEXT_READY__=true;
document.documentElement.dataset.khNext='true';
const reduce=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const flash=document.createElement('div');flash.className='kh-next-page-flash';flash.setAttribute('aria-hidden','true');document.body.append(flash);
const path=(location.pathname.split('/').pop()||'index.html').toLowerCase();
const revealSelectors='main>section,main .feature,main .kh-quick-card,main .game-card,main .minigame-card,main .avatar-tile,main .video-card,main .music-card,main .locker-item,main .community-card,main .kh-room-card,main .tool-card,main .panel,main .account-panel';
const revealNodes=[...document.querySelectorAll(revealSelectors)].filter(el=>!el.closest('[hidden]')&&!el.classList.contains('kh-next-reveal'));
if(!reduce&&'IntersectionObserver'in window){
 const io=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('kh-next-visible');io.unobserve(entry.target)}}),{threshold:.08,rootMargin:'0px 0px -30px 0px'});
 revealNodes.forEach((el,i)=>{el.classList.add('kh-next-reveal');el.style.setProperty('--kh-next-order',String(i%4));io.observe(el)});
}else revealNodes.forEach(el=>el.classList.add('kh-next-visible'));
document.addEventListener('click',e=>{
 const a=e.target.closest('a[href]');if(!a||reduce||e.defaultPrevented||e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey||a.target==='_blank'||a.hasAttribute('download'))return;
 const href=a.getAttribute('href');if(!href||href.startsWith('#')||href.startsWith('javascript:'))return;
 let u;try{u=new URL(href,location.href)}catch{return}
 if(u.origin!==location.origin||u.pathname===location.pathname&&(u.hash||u.search))return;
 document.body.classList.add('kh-next-leaving');
},true);
document.addEventListener('keydown',e=>{if(e.key==='Escape')document.body.classList.remove('kh-next-leaving')});
window.addEventListener('pageshow',()=>document.body.classList.remove('kh-next-leaving'));
/* Mark the current section in the shared mobile dock, including grouped sections. */
const groups={'index.html':['index.html','index-v3.html'],'minigames.html':['minigames.html','battlehub.html','leaderboard.html'],'community.html':['community.html'],'avatars.html':['avatars.html','videos.html','music.html'],'account.html':['account.html','assistant.html','locker.html','download.html','privacy.html']};
document.querySelectorAll('#kh5-bottom-nav a').forEach(a=>{const href=(a.getAttribute('href')||'').split('?')[0];if((groups[href]||[href]).includes(path)){a.setAttribute('aria-current','page')}else if(a.getAttribute('aria-current')==='page')a.removeAttribute('aria-current')});
})();