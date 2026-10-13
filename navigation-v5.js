/* KH么Kozak Gaming Hub 5.0 — responsive quick navigation and page motion */
(()=>{'use strict';
if(document.getElementById('kh5-bottom-nav'))return;
const path=location.pathname.split('/').pop()||'index.html';
const items=[
 ['index.html','⌂','Головна',['','index.html','index-v3.html']],
 ['minigames.html','🎮','Ігри',['minigames.html','battlehub.html']],
 ['community.html','♟','Друзі',['community.html']],
 ['avatars.html','▧','Медіа',['avatars.html','videos.html','music.html']],
 ['account.html','◉','Профіль',['account.html','assistant.html','locker.html','download.html']]
];
const nav=document.createElement('nav');nav.className='kh5-bottom-nav';nav.id='kh5-bottom-nav';nav.setAttribute('aria-label','Швидка навігація');
for(const [href,icon,label,activePaths] of items){const a=document.createElement('a');a.href=href;a.innerHTML='<span class="kh5-nav-icon" aria-hidden="true">'+icon+'</span><span>'+label+'</span>';if(activePaths.includes(path)){a.setAttribute('aria-current','page');}nav.append(a)}
document.body.append(nav);
const progress=document.createElement('div');progress.className='kh5-page-progress';progress.setAttribute('aria-hidden','true');document.body.append(progress);
let ticking=false;function updateProgress(){const max=document.documentElement.scrollHeight-innerHeight;progress.style.width=(max>0?Math.min(100,scrollY/max*100):0)+'%';ticking=false}addEventListener('scroll',()=>{if(!ticking){requestAnimationFrame(updateProgress);ticking=true}},{passive:true});addEventListener('resize',updateProgress,{passive:true});updateProgress();
if(!matchMedia('(prefers-reduced-motion: reduce)').matches){const main=document.querySelector('main')||document.querySelector('#main')||document.body;main.classList.add('kh5-enter');document.querySelectorAll('a[href]').forEach(a=>{const href=a.getAttribute('href');if(!href||href.startsWith('#')||a.target==='_blank'||a.hasAttribute('download'))return;let url;try{url=new URL(href,location.href)}catch{return}if(url.origin!==location.origin||url.pathname===location.pathname&&url.hash)return;a.addEventListener('click',e=>{if(e.defaultPrevented||e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;document.body.classList.add('kh5-leaving')})})}
})();
