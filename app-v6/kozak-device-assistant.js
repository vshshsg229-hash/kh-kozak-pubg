(()=>{'use strict';
const section=document.getElementById('tab-kozakai');if(!section||document.getElementById('kozDeviceAssistant'))return;
const app=document.createElement('article');app.id='kozDeviceAssistant';app.className='koz-device-assistant';
app.innerHTML='<div class="koz-device-head"><div class="koz-device-orb" aria-hidden="true">✦</div><div><div class="koz-device-label" style="margin:0 0 4px">KOZAK AI · DEVICE CONTROL</div><h2>KOZAK ASSISTANT</h2><p>Голосовий помічник для команд, програм і швидких дій.</p></div></div><div class="koz-device-status" id="kozDeviceStatus" role="status" aria-live="polite">Готовий. Скажи «відкрий YouTube» або введи команду.</div><div class="koz-device-command"><input id="kozDeviceInput" type="text" maxlength="160" placeholder="Наприклад: відкрий Telegram" autocomplete="off"><button class="primary" id="kozDeviceRun" type="button">Виконати ↗</button></div><div class="koz-device-controls"><button class="primary" id="kozDeviceListen" type="button">🎙 Говорити</button><button id="kozDeviceAppsRefresh" type="button">↻ Оновити список програм</button><button id="kozDeviceShowApps" type="button">▦ Програми</button></div><div class="koz-device-label">ШВИДКІ КОМАНДИ</div><div class="koz-device-apps" id="kozDeviceShortcuts"><button type="button" data-command="відкрий YouTube"><span>▶</span>YouTube</button><button type="button" data-command="відкрий Google"><span>⌕</span>Google</button><button type="button" data-command="відкрий Telegram"><span>➤</span>Telegram</button><button type="button" data-command="відкрий TikTok"><span>♪</span>TikTok</button><button type="button" data-command="відкрий PUBG Mobile"><span>🎮</span>PUBG Mobile</button><button type="button" data-command="відкрий KOZAK AI"><span>✦</span>KOZAK AI</button></div><div class="koz-device-label">ПРОГРАМИ НА ПРИСТРОЇ</div><div class="koz-device-apps" id="kozDeviceInstalled"></div><p class="koz-device-note">Android-додаток може показати доступні до запуску програми та відкрити встановлені. Якщо програми немає, помічник запропонує сторінку магазину. У браузері доступні лише вебсайти та підтримувані посилання. Для запуску довільних програм Windows потрібен окремий настільний компаньйон — браузер не має такого доступу.</p>';
section.querySelector('.kozai-wrap')?.append(app);if(!app.isConnected)section.append(app);
const $=s=>app.querySelector(s),status=$('#kozDeviceStatus'),input=$('#kozDeviceInput'),installed=$('#kozDeviceInstalled');
const device=window.KozakDevice||null;
const catalog=[
{name:'YouTube',terms:['youtube','ютуб'],url:'https://www.youtube.com/',pkg:'com.google.android.youtube',icon:'▶'},
{name:'Google',terms:['google','гугл','гугл пошук','пошук'],url:'https://www.google.com/',pkg:'com.google.android.googlequicksearchbox',icon:'⌕'},
{name:'Chrome',terms:['chrome','хром','браузер'],url:'https://www.google.com/chrome/',pkg:'com.android.chrome',icon:'🌐'},
{name:'Telegram',terms:['telegram','телеграм','телеграмм'],url:'https://t.me/',pkg:'org.telegram.messenger',icon:'➤'},
{name:'TikTok',terms:['tiktok','тікток','тикток'],url:'https://www.tiktok.com/',pkg:'com.zhiliaoapp.musically',icon:'♪'},
{name:'PUBG Mobile',terms:['pubg mobile','пабг мобайл','пабг'],url:'https://play.google.com/store/apps/details?id=com.tencent.ig',pkg:'com.tencent.ig',icon:'🎮'},
{name:'Discord',terms:['discord','діскорд','дискорд'],url:'https://discord.com/app',pkg:'com.discord',icon:'🎧'},
{name:'Spotify',terms:['spotify','спотіфай'],url:'https://open.spotify.com/',pkg:'com.spotify.music',icon:'♫'},
{name:'Instagram',terms:['instagram','інстаграм'],url:'https://www.instagram.com/',pkg:'com.instagram.android',icon:'◎'},
{name:'Gmail',terms:['gmail','пошта'],url:'https://mail.google.com/',pkg:'com.google.android.gm',icon:'✉'},
{name:'Play Store',terms:['play store','плей маркет','магазин'],url:'https://play.google.com/store',pkg:'com.android.vending',icon:'▣'},
{name:'KOZAK AI',terms:['kozak ai','козак ai','козак ай','помічник'],action:()=>{document.querySelector('[data-tab="kozakai"]')?.click();status.textContent='Відкрив розділ KOZAK AI.'},icon:'✦'}
];
let apps=[];
const setStatus=t=>{status.textContent=t};
const norm=s=>String(s||'').toLocaleLowerCase('uk-UA').replace(/[.,!?]/g,' ').replace(/\s+/g,' ').trim();
function openItem(item){if(item.action){item.action();return}
if(device&&item.pkg){try{const list=JSON.parse(device.getInstalledApps()||'[]');const found=list.find(a=>a.packageName===item.pkg);if(found&&device.launchApp(item.pkg)){setStatus('Запускаю '+found.label+'…');return}setStatus(item.name+' не знайдено серед встановлених. Відкриваю магазин…');device.openStore(item.pkg);return}catch(e){}}
if(item.url){window.open(item.url,'_blank','noopener,noreferrer');setStatus('Відкрив посилання для '+item.name+'. Якщо застосунок встановлений, пристрій може запропонувати відкрити його.');}}
function runCommand(raw){const q=norm(raw);if(!q){setStatus('Введи або промов команду.');return}
if(/^(допомога|що ти вмієш|help)$/.test(q)){setStatus('Команди: «відкрий YouTube», «відкрий Telegram», «пошук [слова]», «покажи програми», «час».');return}
if(q.includes('покажи програми')||q.includes('список програм')||q.includes('мої програми')){loadApps();return}
if(q==='час'||q.includes('котра година')){setStatus('Зараз '+new Date().toLocaleTimeString('uk-UA',{hour:'2-digit',minute:'2-digit'}));return}
if(q.startsWith('пошук ')||q.startsWith('знайди ')){const term=raw.replace(/^(пошук|знайди)\s+/i,'').trim();if(term){window.open('https://www.google.com/search?q='+encodeURIComponent(term),'_blank','noopener,noreferrer');setStatus('Шукаю: '+term)}return}
const clean=q.replace(/^(будь ласка\s+)?(відкрий|запусти|запуск|перейди до|відкрити)\s+/,'').trim();
const item=catalog.find(x=>x.terms.some(t=>clean===norm(t)||clean.includes(norm(t))||norm(t).includes(clean)));
if(item){openItem(item);return}
const match=apps.find(a=>norm(a.label)===clean||norm(a.label).includes(clean)||clean.includes(norm(a.label)));
if(match&&device){try{if(device.launchApp(match.packageName)){setStatus('Запускаю '+match.label+'…');return}device.openStore(match.packageName);setStatus('Не вдалося запустити '+match.label+'. Відкрив сторінку магазину.');return}catch{}}
if(device){setStatus('Не знайшов «'+raw+'». Перевір назву або натисни «Програми».');return}
window.open('https://www.google.com/search?q='+encodeURIComponent(raw),'_blank','noopener,noreferrer');setStatus('У браузері не можна запускати довільні локальні програми. Виконав вебпошук за командою.');}
function loadApps(){if(!device){installed.innerHTML='<button type="button" data-webapps="1"><span>🌐</span>Вебпрограми й сайти</button>';setStatus('Список локальних програм доступний у встановленій Android-версії KH么Kozak. У браузері показуємо лише вебпосилання.');installed.querySelector('[data-webapps]')?.addEventListener('click',()=>{window.open('https://www.google.com/','_blank','noopener,noreferrer')});return}
try{apps=JSON.parse(device.getInstalledApps()||'[]').filter(a=>a&&a.label&&a.packageName).sort((a,b)=>a.label.localeCompare(b.label));installed.replaceChildren();if(!apps.length){setStatus('Не вдалося отримати список програм. Перезапусти додаток і спробуй ще раз.');return}
apps.forEach(a=>{const b=document.createElement('button');b.type='button';b.innerHTML='<span>▣</span>';const label=document.createElement('span');label.textContent=a.label;b.append(label);b.addEventListener('click',()=>{if(device.launchApp(a.packageName))setStatus('Запускаю '+a.label+'…');else{device.openStore(a.packageName);setStatus('Не вдалося запустити '+a.label+'. Відкрив магазин.')}});installed.append(b)});setStatus('Знайдено програм: '+apps.length+'. Натисни назву, щоб запустити.')}catch(e){setStatus('Не вдалося завантажити список програм на цьому пристрої.');}}
$('#kozDeviceRun').addEventListener('click',()=>runCommand(input.value));input.addEventListener('keydown',e=>{if(e.key==='Enter')runCommand(input.value)});
app.querySelectorAll('[data-command]').forEach(b=>b.addEventListener('click',()=>runCommand(b.dataset.command)));
$('#kozDeviceAppsRefresh').addEventListener('click',loadApps);$('#kozDeviceShowApps').addEventListener('click',()=>{installed.hidden=!installed.hidden;if(!installed.hidden&&!apps.length)loadApps()});
let recognition=null;const Speech=window.SpeechRecognition||window.webkitSpeechRecognition;
const listen=$('#kozDeviceListen');if(Speech){recognition=new Speech();recognition.lang='uk-UA';recognition.interimResults=false;recognition.maxAlternatives=1;recognition.onstart=()=>{listen.textContent='🎙 Слухаю…';listen.disabled=true;setStatus('Слухаю команду. Говори зараз.')};recognition.onresult=e=>{const heard=e.results?.[0]?.[0]?.transcript||'';input.value=heard;runCommand(heard)};recognition.onerror=e=>setStatus(e.error==='not-allowed'?'Дозволь доступ до мікрофона у налаштуваннях браузера.':'Голосове розпізнавання недоступне. Введи команду вручну.');recognition.onend=()=>{listen.textContent='🎙 Говорити';listen.disabled=false};listen.addEventListener('click',()=>{try{recognition.start()}catch(e){setStatus('Мікрофон уже активний.')}})}else{listen.disabled=true;listen.title='Голосове розпізнавання не підтримується цим браузером';listen.addEventListener('click',()=>setStatus('Цей браузер не підтримує голосове розпізнавання. Спробуй Chrome або введи команду текстом.'))}
if(device)loadApps();
})();