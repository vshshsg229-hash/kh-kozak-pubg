(()=>{'use strict';
const links=[['index.html','⌂ Головна'],['music.html','♫ Музика'],['minigames.html','🎮 Мініігри'],['videos.html','▶ Відео'],['avatars.html','▧ Аватарки'],['locker.html','🛡 Магазин'],['battlehub.html','⚡ Battle Hub']];
const path=location.pathname.split('/').pop()||'index.html';
const nav=document.querySelector('.site-header .nav');
if(nav){nav.setAttribute('aria-label','Навігація KH Gaming Hub');nav.innerHTML=links.map(([href,label])=>'<a href="'+href+'"'+(path===href?' aria-current="page"':'')+'>'+label+'</a>').join('');}
document.querySelectorAll('.v3-brand-badge').forEach(el=>el.textContent='4.0');
const brand=document.querySelector('.site-header .brand');
if(brand&&!brand.querySelector('.v3-brand-badge')){const badge=document.createElement('span');badge.className='v3-brand-badge';badge.textContent='4.0';brand.appendChild(badge);}
const footer=document.querySelector('.footer');
if(footer&&!footer.querySelector('.site-v4-footer-nav')){const navFooter=document.createElement('nav');navFooter.className='site-v4-footer-nav';navFooter.setAttribute('aria-label','Розділи сайту');navFooter.innerHTML=links.map(([href,label])=>'<a href="'+href+'">'+label+'</a>').join('');footer.appendChild(navFooter);}
document.documentElement.dataset.siteVersion='4';
})();