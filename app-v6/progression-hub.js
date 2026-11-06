(()=>{'use strict';
const PROFILE_KEY='khkozak_hub_v6';
const RECORDS_KEY='khkozak_arcade_records_v1';
const EXTRA_KEY='khkozak_pass50_claimed_v1';
const seasonRewards=[{name:'Командир сезону',item:'avatar_commander',icon:'♜'},{name:'Морозний вартовий',item:'avatar_frost',icon:'❄'},{name:'Фантом сезону',item:'avatar_phantom',icon:'☾'},{name:'Королівський авангард',item:'avatar_royal',icon:'♛'}];
const $=s=>document.querySelector(s);
const safeRead=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key)||'null')??fallback}catch{return fallback}};
const safeWrite=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value));return true}catch{return false}};
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const tiers=[
{n:1,name:'Перший крок',coins:50,icon:'⚡'},{n:2,name:'Монетний запас',coins:60,icon:'◈'},{n:3,name:'Мисливець за рекордами',coins:70,icon:'🎯'},{n:4,name:'Аркадний боєць',coins:80,icon:'🕹️'},{n:5,name:'Неонова рамка',coins:100,icon:'✦',item:'frame_neon'},
{n:6,name:'Швидкі руки',coins:60,icon:'⚡'},{n:7,name:'Збирач луту',coins:70,icon:'💎'},{n:8,name:'Майстер пам’яті',coins:80,icon:'🧠'},{n:9,name:'Тактичний розум',coins:90,icon:'♟'},{n:10,name:'Титул Рейдер',coins:150,icon:'🏆',item:'title_raider'},
{n:11,name:'Мисливець',coins:70,icon:'🎯'},{n:12,name:'Золота хвиля',coins:80,icon:'◈'},{n:13,name:'Спритність',coins:90,icon:'⚡'},{n:14,name:'Розумний хід',coins:100,icon:'🧩'},{n:15,name:'Знак ветерана',coins:180,icon:'✦',item:'badge_veteran'},
{n:16,name:'Реактивний старт',coins:80,icon:'🚀'},{n:17,name:'Кристальний запас',coins:90,icon:'💎'},{n:18,name:'Майстер лабіринту',coins:100,icon:'🧭'},{n:19,name:'Безпечна зона',coins:110,icon:'🛡️'},{n:20,name:'Багряна рамка',coins:220,icon:'♛',item:'frame_crimson'},
{n:21,name:'Точний постріл',coins:90,icon:'🎯'},{n:22,name:'Зоряний пил',coins:100,icon:'✦'},{n:23,name:'Комбо-майстер',coins:110,icon:'⚡'},{n:24,name:'Кмітливість',coins:120,icon:'🧠'},{n:25,name:'Титул Тінь Ерангелю',coins:250,icon:'🏆',item:'title_shadow'},
{n:26,name:'Дослідник',coins:100,icon:'🧭'},{n:27,name:'Лут-експерт',coins:110,icon:'💎'},{n:28,name:'Захисник бази',coins:120,icon:'🛡️'},{n:29,name:'Гострий розум',coins:130,icon:'🧩'},{n:30,name:'Аватар Розвідник',coins:300,icon:'♜',item:'avatar_recon'},
{n:31,name:'Висока швидкість',coins:110,icon:'🚀'},{n:32,name:'Точність+',coins:120,icon:'🎯'},{n:33,name:'Код зламано',coins:130,icon:'⌘'},{n:34,name:'Майстер виживання',coins:140,icon:'🛡️'},{n:35,name:'Титул Слідопит',coins:350,icon:'🏆',item:'title_pathfinder'},
{n:36,name:'Неоновий слід',coins:120,icon:'✦'},{n:37,name:'Тактик',coins:130,icon:'♟'},{n:38,name:'Швидкий розум',coins:140,icon:'🧠'},{n:39,name:'Переможець раунду',coins:150,icon:'⚔️'},{n:40,name:'Крижана тема',coins:400,icon:'👑',item:'theme_ice'},
{n:41,name:'Володар комбо',coins:130,icon:'⚡'},{n:42,name:'Скарбниця',coins:140,icon:'💎'},{n:43,name:'Останній рубіж',coins:150,icon:'🛡️'},{n:44,name:'Мисливець на босів',coins:160,icon:'⚔️'},{n:45,name:'Банер Легенда',coins:450,icon:'🏆',item:'banner_legend'},
{n:46,name:'Космічний ранг',coins:150,icon:'🚀'},{n:47,name:'Незламний',coins:160,icon:'♜'},{n:48,name:'Майстер усіх режимів',coins:170,icon:'🎮'},{n:49,name:'Абсолютний рекорд',coins:180,icon:'👑'},{n:50,name:'KH么Kozak легенда',coins:600,icon:'💜',item:'title_ace'},
{n:51,name:'Розвідник галактики',coins:120,icon:'⚡'},
{n:52,name:'Майстер виживання',coins:124,icon:'🎯'},
{n:53,name:'Швидкий рейдер',coins:128,icon:'🧭'},
{n:54,name:'Сталевий характер',coins:132,icon:'🛡️'},
{n:55,name:'Рамка зоряного рейдера',coins:136,icon:'✦',item:'frame_star_raider'},
{n:56,name:'Тактичний аналітик',coins:140,icon:'🚀'},
{n:57,name:'Володар луту',coins:144,icon:'⚡'},
{n:58,name:'Мисливець за артефактами',coins:148,icon:'🎯'},
{n:59,name:'Захисник рубежу',coins:152,icon:'🧭'},
{n:60,name:'Титул Командир Omega',coins:156,icon:'♜',item:'title_commander_omega'},
{n:61,name:'Снайперська точність',coins:160,icon:'💎'},
{n:62,name:'Командир загону',coins:164,icon:'🚀'},
{n:63,name:'Майстер засідки',coins:168,icon:'⚡'},
{n:64,name:'Незламний боєць',coins:172,icon:'🎯'},
{n:65,name:'Аватар Фантом NEXUS',coins:176,icon:'☾',item:'avatar_phantom_nexus'},
{n:66,name:'Тіньова операція',coins:180,icon:'🛡️'},
{n:67,name:'Провідник експедиції',coins:184,icon:'💎'},
{n:68,name:'Гроза арени',coins:188,icon:'🚀'},
{n:69,name:'Вартовий NEXUS',coins:192,icon:'⚡'},
{n:70,name:'Скін NEBULA STRIKE',coins:196,icon:'🪖',item:'skin_nebula_strike'},
{n:71,name:'Штурмовий експерт',coins:200,icon:'🧭'},
{n:72,name:'Мисливець на босів',coins:204,icon:'🛡️'},
{n:73,name:'Легенда метро',coins:208,icon:'💎'},
{n:74,name:'Повелитель зон',coins:212,icon:'🚀'},
{n:75,name:'Значок Володар секторів',coins:216,icon:'💠',item:'badge_sector_lord'},
{n:76,name:'Імпульс перемоги',coins:220,icon:'🎯'},
{n:77,name:'Елітний розвідник',coins:224,icon:'🧭'},
{n:78,name:'Стратег битви',coins:228,icon:'🛡️'},
{n:79,name:'Володар трофеїв',coins:232,icon:'💎'},
{n:80,name:'Титул Галактичний вовк',coins:236,icon:'🐺',item:'title_galaxy_wolf'},
{n:81,name:'Оперативник Omega',coins:240,icon:'⚡'},
{n:82,name:'Майстер усіх режимів',coins:244,icon:'🎯'},
{n:83,name:'Фантом поля бою',coins:248,icon:'🧭'},
{n:84,name:'Командир NEXUS',coins:252,icon:'🛡️'},
{n:85,name:'Банер Космічна легенда',coins:256,icon:'⚔',item:'banner_cosmic_legend'},
{n:86,name:'Абсолютна тактика',coins:260,icon:'🚀'},
{n:87,name:'Зоряний чемпіон',coins:264,icon:'⚡'},
{n:88,name:'Охоронець порталу',coins:268,icon:'🎯'},
{n:89,name:'Володар артефактів',coins:272,icon:'🧭'},
{n:90,name:'Аватар Зоряний творець',coins:276,icon:'👑',item:'avatar_star_creator'},
{n:91,name:'Легенда виживання',coins:280,icon:'💎'},
{n:92,name:'Космічний командир',coins:284,icon:'🚀'},
{n:93,name:'Незламний NEXUS',coins:288,icon:'⚡'},
{n:94,name:'Вершина майстерності',coins:292,icon:'🎯'},
{n:95,name:'Реліквія Пульс NEXUS',coins:296,icon:'💎',item:'relic_nexus_pulse'},
{n:96,name:'Володар галактики',coins:300,icon:'🛡️'},
{n:97,name:'Абсолютний чемпіон',coins:304,icon:'💎'},
{n:98,name:'Останній рубіж',coins:308,icon:'🚀'},
{n:99,name:'Пробудження NEXUS',coins:312,icon:'⚡'},
{n:100,name:'Сезонна легендарна нагорода',coins:316,icon:'🌌',item:'title_nexus_legend'}
];
const css=`
.khph-panel{margin:18px 0;padding:18px;border:1px solid #303b46;border-radius:10px;background:linear-gradient(145deg,#171e26,#10151b);color:#f5f6f7}
.khph-head{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:12px}.khph-head h2{margin:0;font-size:20px}.khph-sub{color:#9ba8b6;font-size:12px;margin-top:5px}
.khph-progress{height:9px;border-radius:9px;background:#273440;overflow:hidden;margin:12px 0}.khph-progress span{display:block;height:100%;background:linear-gradient(90deg,#7c3aed,#d8b4fe);width:0}
.khph-tiers{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:9px}.khph-tier{border:1px solid #303b46;border-radius:8px;padding:10px;background:#111820;min-width:0}.khph-tier.unlocked{border-color:#8b5cf6;background:#22183a}.khph-tier.claimed{opacity:.65}.khph-tier .khph-icon{font-size:22px}.khph-tier b{display:block;font-size:12px;margin:5px 0}.khph-tier small{display:block;color:#aab4bf;line-height:1.4;min-height:30px}.khph-tier button{width:100%;margin-top:8px;padding:8px 5px;border:0;border-radius:5px;background:#8b5cf6;color:#fff;font-weight:800;cursor:pointer;font-size:10px}.khph-tier button:disabled{background:#29313b;color:#8793a0;cursor:default}
.khph-records{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}.khph-record{padding:12px;border:1px solid #303b46;background:#111820;border-radius:8px;min-width:0}.khph-record strong{display:block;font-size:12px;overflow-wrap:anywhere}.khph-record span{display:block;color:#c4b5fd;font-weight:800;margin-top:7px}.khph-empty{color:#9ba8b6;padding:12px;border:1px dashed #3a4652;border-radius:8px}
.khph-elite{margin-top:16px;padding:16px;border:1px solid #b58b36;border-radius:10px;background:linear-gradient(145deg,#2a2417,#111820)}.khph-elite-head{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}.khph-elite-head h3{margin:0;color:#f2c94c}.khph-elite p{color:#b9c5d4;font-size:12px;line-height:1.5}.khph-elite button{border:1px solid #8d6d2d;border-radius:7px;padding:9px 12px;background:#3b301b;color:#f6d77a;font-weight:800;cursor:pointer}.khph-elite button:disabled{opacity:.55;cursor:default}.khph-elite-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px;margin-top:12px}.khph-elite-reward{padding:10px;border:1px solid #594824;border-radius:8px;background:#171a1d}.khph-elite-reward b{display:block;font-size:11px;margin:6px 0}.khph-elite-reward small{color:#c3b58d;line-height:1.4;display:block}.khph-elite-reward button{width:100%;margin-top:8px;font-size:10px;padding:8px 4px}@media(max-width:700px){.khph-elite-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:1000px){.khph-tiers{grid-template-columns:repeat(4,minmax(0,1fr))}}@media(max-width:700px){.khph-tiers{grid-template-columns:repeat(2,minmax(0,1fr))}.khph-records{grid-template-columns:repeat(2,minmax(0,1fr))}.khph-panel{padding:13px}}@media(max-width:380px){.khph-records{grid-template-columns:1fr}}
`;
function addStyle(){if($('#khphStyle'))return;const st=document.createElement('style');st.id='khphStyle';st.textContent=css;document.head.appendChild(st)}
function profile(){return safeRead(PROFILE_KEY,{coins:0,xp:0,passXp:0})}
function progressLevel(){const p=profile();return Math.max(1,Math.floor((Number(p.passXp)||0)/100)+1)}
function seasonClaims(p=profile()){const season=String(p.passSeason||'S1');const saved=p.progressionPassClaims;if(saved&&saved.season===season&&Array.isArray(saved.claimed))return {season,claimed:saved.claimed.slice()};const legacy=safeRead(EXTRA_KEY,[]);if(Array.isArray(legacy))return {season,claimed:legacy};if(legacy&&legacy.season===season&&Array.isArray(legacy.claimed))return {season,claimed:legacy.claimed.slice()};return {season,claimed:[]}}
function renderPass(){const panel=$('#tab-pass');if(!panel||$('#khphPass50'))return;const p=profile(),level=progressLevel(),claims=seasonClaims(p),claimed=claims.claimed,season=Math.max(1,Number(p.passSeasonNumber)||1),seasonal=seasonRewards[(season-1)%seasonRewards.length],daysLeft=Math.max(0,Math.ceil(((Number(p.passSeasonStart)||Date.now())+30*86400000-Date.now())/86400000));const section=document.createElement('section');section.className='khph-panel';section.id='khphPass50';section.innerHTML='<div class="khph-head"><div><h2>✦ СЕЗОННИЙ ШЛЯХ · 100 РІВНІВ</h2><div class="khph-sub">Сезон '+season+' · оновлення через '+daysLeft+' дн. Прогрес сезону скинеться, але отримані предмети й монети залишаться в профілі.</div></div><b>РІВЕНЬ '+Math.min(100,level)+' / 50</b></div><div class="khph-progress"><span style="width:'+Math.min(100,level/100*100)+'%"></span></div><div class="khph-tiers">'+tiers.map(t=>{const reward=t.n===100?{...t,name:seasonal.name,item:seasonal.item,icon:seasonal.icon}:t;const unlocked=level>=reward.n,done=claimed.includes(reward.n);return '<article class="khph-tier '+(unlocked?'unlocked ':'')+(done?'claimed':'')+'"><div class="khph-icon">'+reward.icon+'</div><b>'+reward.n+'. '+esc(reward.name)+'</b><small>Нагорода: '+reward.coins+' монет'+(reward.item?' + предмет колекції':'')+'</small><button data-khph-claim="'+reward.n+'" '+(!unlocked||done?'disabled':'')+'>'+(done?'✓ ЗАБРАНО':unlocked?'ЗАБРАТИ':'ЗАКРИТО')+'</button></article>'}).join('')+'</div>';const track=$('#passTrack');if(track&&track.parentNode)track.parentNode.insertBefore(section,track.nextSibling);else panel.appendChild(section)}
function records(){const r=safeRead(RECORDS_KEY,{});return Object.entries(r).sort((a,b)=>(b[1].best||0)-(a[1].best||0)).slice(0,6)}
function renderRecords(){const games=$('#tab-games');if(!games||$('#khphRecords'))return;const panel=document.createElement('section');panel.className='khph-panel';panel.id='khphRecords';panel.innerHTML='<div class="khph-head"><div><h2>🏆 ОСОБИСТІ РЕКОРДИ</h2><div class="khph-sub">Найкращі результати мініігор</div></div><b id="khphPlayed">0 ігор</b></div><div class="khph-records" id="khphRecordList"></div>';const target=$('#kh100Toolbar')||$('#kh100Grid');if(target)games.insertBefore(panel,target);else games.appendChild(panel);refreshRecords()}
function refreshRecords(){const r=safeRead(RECORDS_KEY,{}),el=$('#khphRecordList'),played=$('#khphPlayed');if(!el)return;const rows=records();if(played)played.textContent=Object.values(r).reduce((n,x)=>n+(x.plays||0),0)+' раундів';el.innerHTML=rows.length?rows.map(([id,v])=>'<article class="khph-record"><strong>'+esc(v.name||id)+'</strong><span>Рекорд: '+Number(v.best||0)+' очок</span><small class="khph-sub">Зіграно: '+Number(v.plays||0)+'</small></article>').join(''):'<div class="khph-empty">Поки немає рекордів. Запусти будь-яку гру з каталогу та забери нагороду після раунду.</div>'}
const eliteRewards=[
{n:5,name:'Неонова бойова рамка',item:'elite_frame_neon',coins:100,icon:'✦'},
{n:10,name:'Титул Елітний рейдер',item:'elite_title_raider',coins:120,icon:'🏆'},
{n:15,name:'Аватар Тінь',item:'elite_avatar_shadow',coins:150,icon:'☾'},
{n:20,name:'Скін URBAN ELITE',item:'elite_skin_urban',coins:180,icon:'🪖'},
{n:25,name:'Титул Сталевий вовк',item:'elite_title_wolf',coins:200,icon:'♜'},
{n:30,name:'Аватар Командир',item:'elite_avatar_commander',coins:220,icon:'👑'},
{n:35,name:'Епічний значок',item:'elite_badge_epic',coins:250,icon:'💠'},
{n:40,name:'Скін PHANTOM',item:'elite_skin_phantom',coins:280,icon:'🥷'},
{n:45,name:'Банер Чемпіон',item:'elite_banner_champion',coins:320,icon:'⚔'},
{n:50,name:'Легендарний титул KH么Kozak',item:'elite_title_legend',coins:500,icon:'💜'},
{n:55,name:'Рамка NEXUS PRIME',item:'elite_frame_nexus_prime',coins:540,icon:'✦'},
{n:60,name:'Титул Володар Omega',item:'elite_title_omega_lord',coins:580,icon:'♜'},
{n:65,name:'Аватар Зоряний фантом',item:'elite_avatar_star_phantom',coins:620,icon:'☾'},
{n:70,name:'Скін GALAXY WARDEN',item:'elite_skin_galaxy_warden',coins:660,icon:'🪖'},
{n:75,name:'Банер Секторний володар',item:'elite_banner_sector_lord',coins:700,icon:'💠'},
{n:80,name:'Титул Абсолютний рейдер',item:'elite_title_absolute_raider',coins:760,icon:'🐺'},
{n:85,name:'Аватар NEXUS PRIME',item:'elite_avatar_nexus_prime',coins:820,icon:'👑'},
{n:90,name:'Скін COSMIC EMPEROR',item:'elite_skin_cosmic_emperor',coins:900,icon:'⚔'},
{n:95,name:'Реліквія Серце галактики',item:'elite_relic_galaxy_heart',coins:1000,icon:'💎'},
{n:100,name:'Легенда KOZAK NEXUS',item:'elite_title_nexus_legend',coins:1500,icon:'🌌'}];
function renderElitePass(){
 const p=profile(),claims=p.elitePass&&p.elitePass.season===String(p.passSeason||'S1')?p.elitePass:{season:String(p.passSeason||'S1'),active:false,claimed:[]};
 let host=$('#khphElitePass');if(!host){host=document.createElement('section');host.id='khphElitePass';host.className='khph-elite';const base=$('#khphPass50');if(base)base.after(host);else return}
 const level=progressLevel(),owned=!!claims.active,claimed=Array.isArray(claims.claimed)?claims.claimed:[];
 host.innerHTML='<div class="khph-elite-head"><div><h3>👑 ELITE PASS · ЕЛІТНА ЛІНІЯ</h3><p>Окремі нагороди на рівнях 5, 10, 15…100. Відкрий лінію за 1 000 монет хабу; прогрес рівнів спільний із безкоштовним пропуском, а кожен предмет зберігається в профілі.</p></div><button type="button" data-khph-elite-buy '+(owned?'disabled':'')+'>'+(owned?'✓ ELITE PASS АКТИВНИЙ':'ВІДКРИТИ ЗА 1 000 ◈')+'</button></div><div class="khph-elite-grid">'+eliteRewards.map(t=>{const unlocked=level>=t.n,done=claimed.includes(t.n);return '<article class="khph-elite-reward"><span>'+t.icon+'</span><b>'+t.n+'. '+esc(t.name)+'</b><small>+'+t.coins+' монет · '+(t.item?'косметична нагорода':'')+'</small><button type="button" data-khph-elite-claim="'+t.n+'" '+(!owned||!unlocked||done?'disabled':'')+'>'+(done?'✓ ЗАБРАНО':!owned?'ЗАКРИТО':unlocked?'ЗАБРАТИ':'РІВЕНЬ '+t.n)+'</button></article>'}).join('')+'</div><p id="khphEliteStatus" role="status" aria-live="polite">'+(owned?'Елітна лінія відкрита. Забирай нагороди за досягнуті рівні.':'Баланс: '+Math.max(0,Number(p.coins)||0)+' ◈. Нагороди відкриваються після досягнення рівня.')+'</p>';
}
function buyElitePass(){const p=profile(),season=String(p.passSeason||'S1'),existing=p.elitePass&&p.elitePass.season===season?p.elitePass:null,status=$('#khphEliteStatus');if(existing?.active)return;const coins=Math.max(0,Number(p.coins)||0);if(coins<1000){if(status)status.textContent='Не вистачає монет: потрібно 1 000 ◈, у тебе '+coins+' ◈.';return}p.coins=coins-1000;p.elitePass={season,active:true,claimed:[]};if(!safeWrite(PROFILE_KEY,p)){if(status)status.textContent='Не вдалося зберегти Elite Pass. Спробуй ще раз.';return}renderElitePass();const toast=$('#toast');if(toast){toast.textContent='Elite Pass відкрито! Нагороди збережуться в профілі.';toast.classList.add('show');setTimeout(()=>toast.classList.remove('show'),2400)}}
function claimElite(level){const t=eliteRewards.find(x=>x.n===level);if(!t)return;const p=profile(),season=String(p.passSeason||'S1'),elite=p.elitePass&&p.elitePass.season===season?p.elitePass:null,status=$('#khphEliteStatus');if(!elite?.active||progressLevel()<level||(elite.claimed||[]).includes(level))return;const next={...p,coins:Math.max(0,Number(p.coins)||0)+t.coins,owned:Array.isArray(p.owned)?p.owned.slice():[],ownedAt:{...(p.ownedAt||{})},ownedSource:{...(p.ownedSource||{})},rewardLedger:Array.isArray(p.rewardLedger)?p.rewardLedger.slice():[],elitePass:{...elite,claimed:[...(elite.claimed||[]),level]}};if(t.item&&!next.owned.includes(t.item)){next.owned.push(t.item);next.ownedAt[t.item]=Date.now();next.ownedSource[t.item]='elitePass'}next.rewardLedger.push({source:'elitePass',season,level,item:t.item||null,coins:t.coins,claimedAt:Date.now()});if(!safeWrite(PROFILE_KEY,next)){if(status)status.textContent='Не вдалося зберегти нагороду. Перевір місце у сховищі та спробуй ще раз.';return}renderElitePass();renderPass();const toast=$('#toast');if(toast){toast.textContent='Елітну нагороду збережено в профілі: +'+t.coins+' монет'+(t.item?' і предмет колекції.':'.');toast.classList.add('show');setTimeout(()=>toast.classList.remove('show'),2400)}}
function claim(level){const t=tiers.find(x=>x.n===level);if(!t)return;const p=profile(),lv=progressLevel(),claims=seasonClaims(p),claimed=claims.claimed.slice(),season=Math.max(1,Number(p.passSeasonNumber)||1),seasonal=seasonRewards[(season-1)%seasonRewards.length],reward=level===100?{...t,name:seasonal.name,item:seasonal.item,icon:seasonal.icon}:t;if(lv<level||claimed.includes(level))return;const next={...p,coins:Math.max(0,Number(p.coins)||0)+reward.coins,owned:Array.isArray(p.owned)?p.owned.slice():[],ownedAt:{...(p.ownedAt||{})},ownedSource:{...(p.ownedSource||{})},progressionPassClaims:{season:claims.season,claimed:[...claimed,level]}};if(reward.item){const isNew=!next.owned.includes(reward.item);if(isNew)next.owned.push(reward.item);if(!next.ownedAt[reward.item])next.ownedAt[reward.item]=Date.now();if(!next.ownedSource[reward.item])next.ownedSource[reward.item]='freePass'}if(!safeWrite(PROFILE_KEY,next)){const toast=$('#toast');if(toast){toast.textContent='Не вдалося зберегти нагороду. Перевір вільне місце на пристрої та спробуй ще раз.';toast.classList.add('show')}return}const toast=$('#toast');if(toast){toast.textContent='Нагороду збережено в профілі: +'+reward.coins+' монет'+(reward.item?' і предмет колекції.':'.');toast.classList.add('show');setTimeout(()=>toast.classList.remove('show'),2400)}window.location.reload()}
function handleFinish(e){const d=e.detail||{},id=String(d.id||'unknown'),p=safeRead(RECORDS_KEY,{}),prev=p[id]||{best:0,plays:0,name:id};const score=Math.max(0,Number(d.score??d.points)||0);p[id]={best:Math.max(Number(prev.best)||0,score),plays:(Number(prev.plays)||0)+1,name:(document.querySelector('[data-kh100=\"'+(Number(id.replace('kh100-',''))-1)+'\"]')?.closest('.kh100-card')?.querySelector('h3')?.textContent)||prev.name||id,lastPlayed:Date.now()};safeWrite(RECORDS_KEY,p);refreshRecords()}
document.addEventListener('click',e=>{const b=e.target.closest('[data-khph-claim]');if(b){e.preventDefault();claim(Number(b.dataset.khphClaim));return}const eliteBuy=e.target.closest('[data-khph-elite-buy]');if(eliteBuy){e.preventDefault();buyElitePass();return}const eliteClaim=e.target.closest('[data-khph-elite-claim]');if(eliteClaim){e.preventDefault();claimElite(Number(eliteClaim.dataset.khphEliteClaim))}});
window.addEventListener('kh100-finished',handleFinish);
function init(){addStyle();renderPass();renderElitePass();renderRecords();refreshRecords()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
const observer=new MutationObserver(()=>{if(!$('#khphPass50'))renderPass();if(!$('#khphRecords'))renderRecords()});observer.observe(document.documentElement,{childList:true,subtree:true});
})();