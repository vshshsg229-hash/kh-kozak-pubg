/* KH么Kozak home command profile */
(()=>{'use strict';
const mount=()=>{
 const hero=document.querySelector('#tab-home .hero');
 if(!hero||document.querySelector('.kh-command-profile'))return;
 const panel=document.createElement('section');panel.className='kh-command-profile';panel.setAttribute('aria-label','Профіль бійця KH么Kozak');
 panel.innerHTML=`
 <div class="khcp-top"><div><div class="khcp-kicker">KH么KOZAK / COMMAND PROFILE</div><div class="khcp-level" style="margin-top:7px">РІВЕНЬ <b id="khcpLevel">12</b> · <span id="khcpXpText">620 / 1000 XP</span><div class="khcp-progress"><i id="khcpXpBar"></i></div></div></div><div class="khcp-kicker">● SYSTEM ONLINE</div></div>
 <div class="khcp-layout">
  <aside class="khcp-card"><div class="khcp-profile-head"><div class="khcp-avatar">♛</div><div><div class="khcp-name">KH么Kozak <span style="color:#55d5ff">✓</span></div><div class="khcp-muted">Звичайний гравець · PUBG фан</div></div></div>
   <div class="khcp-social"><span>♪ TikTok · uakozak5</span><span>➤ Telegram · @tt_KH_Kozak</span></div>
   <div class="khcp-stat"><span>🎯 K/D (демо)</span><b>3.42</b></div><div class="khcp-stat"><span>🏆 Перемоги</span><b>238</b></div><div class="khcp-stat"><span>👑 Топ-1</span><b>512</b></div><div class="khcp-stat"><span>🔫 Улюблена зброя</span><b>M416</b></div>
  </aside>
  <div class="khcp-stage" id="khcpStage"><div class="khcp-stage-label">3D CHARACTER PREVIEW · BETA</div><div class="khcp-orbit"></div><div class="khcp-gridfloor"></div><div class="khcp-soldier" id="khcpSoldier" role="img" aria-label="Стилізований 3D-вигляд бійця"><div class="khcp-torso"></div><div class="khcp-arm left"></div><div class="khcp-arm right"></div><div class="khcp-leg left"></div><div class="khcp-leg right"></div><div class="khcp-rifle"></div></div><div class="khcp-stage-title">KH么KOZAK<span>PLAY · LEVEL UP · REPEAT</span></div></div>
  <aside class="khcp-right"><div class="khcp-match"><small>ОСТАННІЙ МАТЧ · ДЕМОКАРТКА</small><strong>#1 / 100</strong><p>Твоя наступна перемога починається тут.</p></div><div class="khcp-card"><div class="khcp-rank"><div class="khcp-rank-medal">✥</div><div><b>Платина V</b><small>Прогрес профілю</small></div></div><div class="khcp-progress" style="width:100%;margin-top:13px"><i style="width:62%"></i></div><div class="khcp-achievements"><span title="Влучність">🎯</span><span title="Переможець">🏆</span><span title="Ветеран">⚡</span><span title="Колекціонер">💎</span></div></div></aside>
 </div>
 <div class="khcp-actions"><button class="khcp-action gold" data-khcp="stats"><span>🎯</span><b>МОЯ СТАТИСТИКА</b><small>Показники профілю</small></button><button class="khcp-action" data-khcp="pose"><span>↻</span><b>ПОВЕРНУТИ БІЙЦЯ</b><small>Огляд персонажа</small></button><button class="khcp-action" data-khcp="gear"><span>🛡️</span><b>СПОРЯДЖЕННЯ</b><small>Налаштувати образ</small></button><button class="khcp-action" data-khcp="bonus"><span>🎁</span><b>БОНУС ДНЯ</b><small>Забрати нагороду</small></button></div><div class="khcp-feedback" id="khcpFeedback" aria-live="polite"></div>`;
 hero.insertAdjacentElement('afterend',panel);
 const stage=panel.querySelector('#khcpStage'), soldier=panel.querySelector('#khcpSoldier'), feedback=panel.querySelector('#khcpFeedback');
 let angle=0;stage.addEventListener('pointermove',e=>{if(e.pointerType==='touch')return;const r=stage.getBoundingClientRect();angle=((e.clientX-r.left)/r.width-.5)*34;soldier.style.setProperty('--khcp-turn',angle+'deg')});stage.addEventListener('pointerleave',()=>soldier.style.setProperty('--khcp-turn','0deg'));
 panel.querySelectorAll('[data-khcp]').forEach(btn=>btn.addEventListener('click',()=>{
 const act=btn.dataset.khcp;
 if(act==='pose'){angle=(angle+90)%360;soldier.style.setProperty('--khcp-turn',angle+'deg');feedback.textContent='Бійця повернуто. Рухай курсор над сценою, щоб оглянути його з різних боків.'}
 if(act==='stats'){feedback.textContent='Цифри K/D, перемог і топ-1 на цій картці — демонстраційні. Реальні матчі PUBG автоматично не підключені.'}
 if(act==='gear'){feedback.textContent='Наступне оновлення: вибір шолома, броні, рюкзака й скінів. Наразі це візуальний попередній перегляд.'}
 if(act==='bonus'){let key='khcpBonusDate',today=new Date().toISOString().slice(0,10);if(localStorage.getItem(key)===today){feedback.textContent='Бонус на сьогодні вже отримано. Повертайся завтра!';return}localStorage.setItem(key,today);let coins=Number(localStorage.getItem('khCoins')||0)+50;localStorage.setItem('khCoins',String(coins));feedback.textContent='🎉 Бонус активовано: +50 тестових монет на цьому пристрої. Баланс хабу може використовувати окреме сховище.'}
 }));
};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})();
