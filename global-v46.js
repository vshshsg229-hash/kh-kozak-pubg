/* KH么Kozak Gaming Hub 4.6 — command palette and app shortcuts */
(()=>{'use strict';
if(window.__KH46_READY__)return;window.__KH46_READY__=true;
const links=[
 {icon:'⌂',title:'Головна',detail:'Панель Gaming Hub',url:'index.html',keys:'home start'},
 {icon:'🎮',title:'Мініігри',detail:'Аркада, тренування та челенджі',url:'minigames.html',keys:'games play arcade pubg'},
 {icon:'♟',title:'Друзі та чат',detail:'Спільнота й повідомлення',url:'community.html',keys:'friends chat messages'},
 {icon:'◉',title:'Мій акаунт',detail:'Профіль, прогрес і синхронізація',url:'account.html',keys:'profile account xp coins'},
 {icon:'⚡',title:'Battle Hub',detail:'Ігрові інструменти та завдання',url:'battlehub.html',keys:'battle challenge'},
 {icon:'♫',title:'KH Radio',detail:'Музика та пошук треків',url:'music.html',keys:'music radio songs'},
 {icon:'▧',title:'Аватарки',detail:'Галерея та зображення',url:'avatars.html',keys:'avatars images'},
 {icon:'▶',title:'Відео та кліпи',detail:'Кліпи й відеоконтент',url:'videos.html',keys:'video clips tiktok'},
 {icon:'✦',title:'Магазин і шафка',detail:'Косметика сайту та нагороди',url:'locker.html',keys:'shop locker cosmetics'},
 {icon:'🤖',title:'KH Assistant',detail:'Голосовий помічник і команди',url:'assistant.html',keys:'assistant voice ai'},
 {icon:'⬇',title:'Завантажити додаток',detail:'Android, ПК та вебверсія',url:'download.html',keys:'download install apk pc app'},
 {icon:'🏆',title:'Глобальний рейтинг',detail:'Результати та найкращі гравці',url:'leaderboard.html',keys:'leaderboard ranking scores top'},
 {icon:'🛡',title:'Приватність і безпека',detail:'Правила та інформація про дані',url:'privacy.html',keys:'privacy safety policy'},
 {icon:'↗',title:'Відкрити PUBG Mobile',detail:'Сторінка гри в Google Play',url:'https://play.google.com/store/apps/details?id=com.tencent.ig',external:true,keys:'pubg mobile play store'}
];
const button=document.createElement('button');button.type='button';button.className='kh46-launcher';button.id='kh46-open';button.setAttribute('aria-label','Відкрити швидке меню');button.title='Швидке меню · Ctrl+K';button.innerHTML='<span aria-hidden="true">⌘</span><i class="kh46-launcher-dot" aria-hidden="true"></i>';
const dialog=document.createElement('div');dialog.className='kh46-dialog';dialog.id='kh46-dialog';dialog.setAttribute('role','dialog');dialog.setAttribute('aria-modal','true');dialog.setAttribute('aria-label','Швидке меню KH Kozak');
dialog.innerHTML='<div class="kh46-panel"><div class="kh46-head"><div class="kh46-brand">KH么KOZAK <small>GAMING HUB · NEXT SYSTEM</small></div><button class="kh46-close" type="button" aria-label="Закрити меню">×</button></div><div class="kh46-search-wrap"><input class="kh46-search" id="kh46-search" type="search" autocomplete="off" placeholder="Знайти розділ або дію…" aria-label="Пошук розділів"></div><div class="kh46-hints"><span><kbd class="kh46-key">Ctrl</kbd> + <kbd class="kh46-key">K</kbd> відкрити</span><span><kbd class="kh46-key">Esc</kbd> закрити</span><span><kbd class="kh46-key">/</kbd> пошук</span></div><div class="kh46-results" id="kh46-results"></div><div class="kh46-footer"><span class="kh46-status" id="kh46-status">Перевірка з’єднання…</span><span>Єдине меню · NEXT</span></div></div>';
const toast=document.createElement('div');toast.className='kh46-toast';toast.setAttribute('role','status');toast.setAttribute('aria-live','polite');
const banner=document.createElement('div');banner.className='kh46-update-banner';banner.innerHTML='<strong>NEXT SYSTEM</strong><span>Глобальне оновлення KH么Kozak Gaming Hub</span><a href="community.html">У спільноту ↗</a>';
document.body.prepend(banner);
document.body.append(button,dialog,toast);
const input=dialog.querySelector('#kh46-search'),results=dialog.querySelector('#kh46-results'),close=dialog.querySelector('.kh46-close'),status=dialog.querySelector('#kh46-status');
let lastFocus=null;
function notify(message){toast.textContent=message;toast.classList.add('is-visible');clearTimeout(notify.timer);notify.timer=setTimeout(()=>toast.classList.remove('is-visible'),2400)}
function render(){const q=input.value.trim().toLocaleLowerCase('uk');const filtered=links.filter(x=>(x.title+' '+x.detail+' '+x.keys).toLocaleLowerCase('uk').includes(q));results.replaceChildren();if(!filtered.length){const empty=document.createElement('div');empty.className='kh46-empty';empty.textContent='Нічого не знайдено. Спробуй інший запит.';results.append(empty);return}const label=document.createElement('div');label.className='kh46-group';label.textContent=q?'Результати пошуку':'Швидкий доступ';results.append(label);for(const item of filtered){const a=document.createElement('a');a.className='kh46-item';a.href=item.url;if(item.external){a.target='_blank';a.rel='noopener noreferrer'}const icon=document.createElement('span');icon.className='kh46-icon';icon.textContent=item.icon;const copy=document.createElement('span');copy.className='kh46-item-copy';const title=document.createElement('span');title.textContent=item.title;const detail=document.createElement('small');detail.textContent=item.detail;copy.append(title,detail);const arrow=document.createElement('span');arrow.className='kh46-arrow';arrow.textContent='↗';a.append(icon,copy,arrow);a.addEventListener('click',()=>{if(item.external)notify('Відкриваю Google Play…')});results.append(a)}}
function open(){lastFocus=document.activeElement;dialog.setAttribute('open','');input.value='';render();setTimeout(()=>input.focus(),30)}
function shut(){dialog.removeAttribute('open');if(lastFocus&&lastFocus.focus)lastFocus.focus()}
function updateConnection(){const online=navigator.onLine;status.textContent=online?'Онлайн · усі доступні розділи':'Офлайн · доступні кешовані сторінки';status.dataset.online=String(online)}
button.addEventListener('click',open);close.addEventListener('click',shut);input.addEventListener('input',render);
dialog.addEventListener('click',e=>{if(e.target===dialog)shut()});
document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();dialog.hasAttribute('open')?shut():open();return}if(e.key==='Escape'&&dialog.hasAttribute('open')){shut();return}if(e.key==='/'&&!dialog.hasAttribute('open')&&!/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)&&!document.activeElement.isContentEditable){e.preventDefault();open()}});
addEventListener('online',()=>{updateConnection();notify('З’єднання відновлено')});addEventListener('offline',()=>{updateConnection();notify('Немає мережі. Перевір інтернет-з’єднання')});
updateConnection();render();
if('serviceWorker'in navigator&&location.protocol==='https:'){navigator.serviceWorker.addEventListener('controllerchange',()=>notify('KH么Kozak оновлено до актуальної версії'))}
})();
