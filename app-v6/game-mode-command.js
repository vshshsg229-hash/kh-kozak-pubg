(()=>{'use strict';
const root=document.getElementById('tab-games');if(!root||root.dataset.nexusModeDeck)return;root.dataset.nexusModeDeck='1';
const KEY='kozak.nexus.gameModeDeck.v1';
const modes=[
 {id:'metro',name:'METRO ROYALE',title:'Рейд за трофеями',desc:'Збери цінний лут, оцінюй ризик і вчасно евакуюйся.',icon:'☣️',goal:'Евакуюйся з 8 контейнерами'},
 {id:'classic',name:'КЛАСИКА',title:'Виживи до фіналу',desc:'Лутайся, контролюй безпечну зону та тримай позицію.',icon:'🏆',goal:'Дійди до топ-10'},
 {id:'zombie',name:'ЗОМБІ SURVIVAL',title:'Втримай оборону',desc:'Переживи хвилі заражених, збирай припаси та лікуйся.',icon:'🧟',goal:'Зачисти 3 хвилі'},
 {id:'arena',name:'SURVIVAL ARENA',title:'П’ять раундів',desc:'Перемагай раунд за раундом і зберігай ресурси.',icon:'⚔️',goal:'Пройди 5 раундів'},
 {id:'pubg',name:'PUBG: ЗОНА',title:'Тактика виживання',desc:'Підготуй спорядження й переживи три етапи бою.',icon:'🎯',goal:'Виживи на всіх етапах'}
];
const today=()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
const read=()=>{try{const v=JSON.parse(localStorage.getItem(KEY)||'{}');return v&&typeof v==='object'?v:{}}catch(_){return {}}};
let state=read();state.plays=state.plays&&typeof state.plays==='object'?state.plays:{};state.last=state.last&&typeof state.last==='object'?state.last:{};state.favorite=modes.some(m=>m.id===state.favorite)?state.favorite:'classic';state.day=state.day||today();
function save(){try{localStorage.setItem(KEY,JSON.stringify(state))}catch(_){}}
function daily(){const n=Number(today().replaceAll('-',''));return modes[n%modes.length]}
function launch(id){const target=root.querySelector('[data-game="'+id+'"]');if(!target){const alt=root.querySelector('[data-tab="3d"]');if(id==='arena'&&alt){alt.click();return}return}target.click()}
const shortcuts=root.querySelector('.mode-shortcuts');
if(!shortcuts)return;
const deck=document.createElement('section');deck.className='nexus-mode-deck';deck.setAttribute('aria-label','Центр ігрових режимів');
deck.innerHTML='<div class="nexus-mode-deck-copy"><div class="nexus-mode-kicker">KOZAK NEXUS / BATTLE COMMAND</div><h2>ОБЕРИ СВІЙ <span>НАСТУПНИЙ РЕЙД</span></h2><p>Єдиний центр запуску режимів. Твій улюблений режим і локальна статистика залишаються на цьому пристрої — без акаунта й без сервера.</p><div class="nexus-mode-stats"><div class="nexus-mode-stat"><small>ЗАПУСКІВ РЕЖИМІВ</small><strong id="nexusModeTotal">0</strong></div><div class="nexus-mode-stat"><small>ОСТАННІЙ РЕЖИМ</small><strong id="nexusModeLast">—</strong></div><div class="nexus-mode-stat"><small>УЛЮБЛЕНИЙ</small><strong id="nexusModeFav">КЛАСИКА</strong></div></div><div class="nexus-mode-status" id="nexusModeStatus" aria-live="polite">Локальний журнал активності готовий.</div></div><aside class="nexus-mode-mission"><div><div class="nexus-mode-mission-top"><span>✦ ВИКЛИК ДНЯ</span><span class="nexus-mode-chip" id="nexusModeDailyChip">ЦІЛЬ ДНЯ</span></div><h3 id="nexusModeDailyTitle">Завантаження завдання…</h3><p id="nexusModeDailyDesc"></p><p class="nexus-mode-status" id="nexusModeDailyGoal"></p></div><div class="nexus-mode-actions"><button type="button" id="nexusModeLaunch">▶ ЗАПУСТИТИ ВИКЛИК</button><button type="button" class="secondary" id="nexusModeFavorite">☆ ЗРОБИТИ УЛЮБЛЕНИМ</button></div></aside>';
shortcuts.before(deck);
function render(){const d=daily(),f=modes.find(m=>m.id===state.favorite)||modes[1],last=modes.find(m=>m.id===state.last.id);deck.querySelector('#nexusModeDailyTitle').textContent=d.title;deck.querySelector('#nexusModeDailyDesc').textContent=d.desc;deck.querySelector('#nexusModeDailyGoal').textContent='Ціль: '+d.goal;deck.querySelector('#nexusModeDailyChip').textContent='ЦІЛЬ ДНЯ';deck.querySelector('#nexusModeTotal').textContent=String(Object.values(state.plays).reduce((a,b)=>a+(Number(b)||0),0));deck.querySelector('#nexusModeLast').textContent=last?last.name:'—';deck.querySelector('#nexusModeFav').textContent=f.name;const fb=deck.querySelector('#nexusModeFavorite');fb.textContent='★ ЗМІНИТИ УЛЮБЛЕНИЙ: '+f.name;deck.querySelector('#nexusModeStatus').innerHTML='Збереження: <strong>на цьому пристрої</strong> · Остання активність: '+(state.last.date||'ще не було');}
deck.querySelector('#nexusModeLaunch').addEventListener('click',()=>launch(daily().id));
deck.querySelector('#nexusModeFavorite').addEventListener('click',()=>{const current=modes.find(m=>m.id===state.favorite)||modes[1];const i=modes.findIndex(m=>m.id===current.id);state.favorite=modes[(i+1)%modes.length].id;save();render();deck.querySelector('#nexusModeStatus').textContent='Улюблений режим змінено. Вибір збережено локально.'});
root.addEventListener('click',e=>{const b=e.target.closest('[data-game]');if(!b||!root.contains(b))return;const id=b.dataset.game;if(!modes.some(m=>m.id===id))return;state.plays[id]=(Number(state.plays[id])||0)+1;state.last={id,date:today()};save();render();},{capture:true});
render();
})();