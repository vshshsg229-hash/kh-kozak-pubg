(()=>{'use strict';
const links=[['index.html','⌂ Головна'],['music.html','♫ Музика'],['minigames.html','🎮 Мініігри'],['videos.html','▶ Відео'],['avatars.html','▧ Аватарки'],['locker.html','🛡 Магазин'],['battlehub.html','⚡ Battle Hub'],['assistant.html','🤖 KH Assistant']];
const path=location.pathname.split('/').pop()||'index.html';
const nav=document.querySelector('.site-header .nav');
if(nav){nav.setAttribute('aria-label','Навігація KH Gaming Hub');nav.innerHTML=links.map(([href,label])=>'<a href="'+href+'"'+(path===href?' aria-current="page"':'')+'>'+label+'</a>').join('');}
document.querySelectorAll('.v3-brand-badge').forEach(el=>el.textContent='4.0');
const brand=document.querySelector('.site-header .brand');
if(brand&&!brand.querySelector('.v3-brand-badge')){const badge=document.createElement('span');badge.className='v3-brand-badge';badge.textContent='4.0';brand.appendChild(badge);}
const appBrand=document.querySelector('.kh-app-brand');
if(appBrand){const small=appBrand.querySelector('small');if(small)small.textContent='GAMING HUB 4.0 · ГРА · МУЗИКА';}
const footer=document.querySelector('.footer');
if(footer&&!footer.querySelector('.site-v4-footer-nav')){const navFooter=document.createElement('nav');navFooter.className='site-v4-footer-nav';navFooter.setAttribute('aria-label','Розділи сайту');navFooter.innerHTML=links.map(([href,label])=>'<a href="'+href+'">'+label+'</a>').join('');footer.appendChild(navFooter);}

// Спільний контакт Telegram для всіх сторінок, де підключено site-v4.js.



// Вирівнюємо всі старі Telegram-посилання на актуальний акаунт.
document.querySelectorAll('a[href*="t.me/idvolf450"], a[href*="t.me/tt_KH_Kozak"]').forEach(a=>{a.href='https://t.me/tt_KH_Kozak';a.target='_blank';a.rel='noopener noreferrer';a.textContent=a.textContent.replace(/@?idvolf450|@?tt_KH_Kozak/gi,'@tt_KH_Kozak');});
if(!document.querySelector('.kh-telegram-contact, .telegram-contact-link, .telegram-contact a[href*="t.me/"]')){const style=document.createElement('style');style.textContent='.kh-telegram-contact{display:flex;align-items:center;gap:14px;max-width:560px;margin:28px auto;padding:16px 18px;border:1px solid #229ed955;border-radius:16px;background:linear-gradient(110deg,#102b40,#11151d);color:inherit;text-decoration:none;font:inherit}.kh-telegram-contact:hover{border-color:#229ed9;transform:translateY(-2px)}.kh-telegram-contact .kh-tg-icon{display:grid;place-items:center;width:44px;height:44px;flex:0 0 44px;border-radius:13px;background:#229ed9;color:#fff;font-size:1.4rem}.kh-telegram-contact strong,.kh-telegram-contact small{display:block}.kh-telegram-contact strong{font-size:.9rem}.kh-telegram-contact small{margin-top:4px;opacity:.75;font-size:.76rem}.kh-telegram-contact .kh-tg-arrow{margin-left:auto;color:#58c5ff;font-size:1.1rem}';document.head.appendChild(style);const contact=document.createElement('a');contact.className='kh-telegram-contact';contact.href='https://t.me/tt_KH_Kozak';contact.target='_blank';contact.rel='noopener noreferrer';contact.innerHTML='<span class="kh-tg-icon">✈</span><span><strong>@tt_KH_Kozak · написати мені</strong><small>↗ Цей телеграм</small></span><b class="kh-tg-arrow">↗</b>';const footer=document.querySelector('footer');if(footer)footer.parentNode.insertBefore(contact,footer);else document.body.appendChild(contact);}
// У картках аватарок є окреме посилання на власника, не ламаючи перегляд картинки.
document.querySelectorAll('.avatar-tile').forEach(tile=>{
 if(!tile.querySelector('.avatar-contact-link')){
  const link=document.createElement('a');
  link.className='avatar-contact-link';
  link.href='https://t.me/tt_KH_Kozak';
  link.target='_blank';link.rel='noopener noreferrer';
  link.textContent='✈ Запитати про аватарку · @tt_KH_Kozak ↗';
  link.style.cssText='display:flex;justify-content:center;align-items:center;gap:8px;margin:8px 0 18px;padding:10px 12px;border:1px solid rgba(34,158,217,.4);border-radius:11px;background:rgba(34,158,217,.09);color:#8bd8ff;text-decoration:none;font-size:.78rem;font-weight:800;';
  tile.appendChild(link);
 }
});
document.documentElement.dataset.siteVersion='4.0';
})();