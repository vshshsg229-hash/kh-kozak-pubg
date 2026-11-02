(()=>{'use strict';
const KEY='kozak.nexus.world.expansion.v1';
const $=s=>document.querySelector(s);
const fresh=()=>({v:1,xp:0,credits:420,energy:180,alloy:120,data:45,crystals:18,city:1,buildings:{habitat:1,industry:0,lab:0,port:0},dungeons:0,bossWins:0,planet:0,fleet:0,companion:1,companionXp:0,tech:[],genetics:0,artifacts:[],museum:[],season:1,seasonXp:0,crisisDay:'',crisisDone:false,story:0,storyChoices:[],simWins:0,legacy:0,logs:[],lastDaily:'',dailyDone:false,rewardSeq:0});
let s;try{const v=JSON.parse(localStorage.getItem(KEY)||'null');s=v&&v.v===1?{...fresh(),...v,buildings:{...fresh().buildings,...(v.buildings||{})},tech:Array.isArray(v.tech)?v.tech:[],artifacts:Array.isArray(v.artifacts)?v.artifacts:[],museum:Array.isArray(v.museum)?v.museum:[],storyChoices:Array.isArray(v.storyChoices)?v.storyChoices:[],logs:Array.isArray(v.logs)?v.logs:[]}:fresh()}catch{s=fresh()}
const fmt=n=>Math.floor(n||0).toLocaleString('uk-UA');
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(s));const el=$('#nxw-save-status');if(el)el.textContent='● ЗБЕРЕЖЕНО ЛОКАЛЬНО';return true}catch{const el=$('#nxw-save-status');if(el)el.textContent='ПОМИЛКА ЗБЕРЕЖЕННЯ';return false}};
const log=t=>{s.logs.unshift({t,at:Date.now()});s.logs=s.logs.slice(0,40)};
const toast=t=>{let el=$('#nxw-toast');if(!el){el=document.createElement('div');el.id='nxw-toast';document.body.append(el)}el.textContent=t;el.classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove('show'),2200)};
const pay=(c)=>{if(Object.entries(c).some(([k,v])=>(s[k]||0)<v)){toast('Не вистачає ресурсів');return false}Object.entries(c).forEach(([k,v])=>s[k]-=v);return true};
function profileReward(coins,xp){const amountCoins=Math.max(0,Math.floor(Number(coins)||0)),amountXp=Math.max(0,Math.floor(Number(xp)||0));if(!amountCoins&&!amountXp)return true;s.rewardSeq=Math.max(0,Number(s.rewardSeq)||0)+1;const api=window.khkozakProgression,result=api?.awardModeReward?.('nexus-world-expansion','world-'+s.rewardSeq,amountCoins,amountXp,0,0);if(!result?.ok){s.rewardSeq--;toast('Не вдалося синхронізувати нагороду зі спільним профілем.');return false}return true}const gain=(c)=>{Object.entries(c).forEach(([k,v])=>s[k]=(s[k]||0)+v);if(Number(c.credits)>0)profileReward(c.credits,0)};
const xp=n=>{const amount=Math.max(0,Math.floor(Number(n)||0));if(!amount)return;profileReward(0,amount);s.xp+=amount;s.seasonXp+=amount;};
const day=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Kyiv',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const modules=[
['city','🏙️','МЕГАПОЛІС','Місто','Розбудовуй квартали, виробництво, лабораторію та космопорт.'],
['dungeon','🗝️','ПІДЗЕМЕЛЛЯ','Підземелля','Досліджуй процедурні кімнати, знаходь реліквії та бийся з охороною.'],
['fleet','🚀','КОСМІЧНИЙ ФЛОТ','Флот і планети','Відкривай планети, будуй кораблі та відправляй міжзоряні рейси.'],
['crisis','☄️','ГЛОБАЛЬНІ КРИЗИ','Кризи світу','Щодня виникає нова загроза з власним вибором і наслідками.'],
['companion','🤖','ШІ-НАПАРНИК','Компаньйон','Прокачуй дрона-помічника, щоб отримувати бойові й економічні бонуси.'],
['evolution','🧬','ЕВОЛЮЦІЯ','Дерево еволюції','Відкривай гілки інженерії, розвідки, біотехнологій і командування.'],
['market','🕶️','ЧОРНИЙ РИНОК','Чорний ринок','Обмінюй ресурси на рідкісні модулі та артефакти.'],
['arena','⚔️','АРЕНА БОСІВ','Арена','Викликай босів, обирай тактику та забирай трофеї.'],
['genetics','🧫','ГЕНЕТИЧНА ЛАБОРАТОРІЯ','Генетика','Створюй адаптації, що посилюють експедиції та економіку.'],
['museum','🏛️','МУЗЕЙ ЦИВІЛІЗАЦІЇ','Музей','Збирай реліквії з усіх систем і відкривай бонуси колекцій.'],
['season','🎖️','СЕЗОННІ ПОДІЇ','Сезон','Просувайся сезонним шляхом і забирай нагороди за активність.'],
['sim','🎯','БОЙОВИЙ СИМУЛЯТОР','Симулятор','Тестуй склади та тактики без втрати ресурсів.'],
['command','🧭','КАЮТА КОМАНДИРА','Командний центр','Керуй наказами, хронікою та стратегічними рішеннями.'],
['legacy','♾️','СПАДЩИНА','Нова ера','Після великого циклу перезапусти розвиток із постійними привілеями.']
];
const tabNames=[['all','Усе'],['city','Місто'],['explore','Дослідження'],['space','Космос'],['combat','Бій'],['science','Наука'],['meta','Розвиток']];
function panel(){return `
<style>
#view-expansion{color:#edf6ff}#view-expansion .nxw-intro{padding:18px;border:1px solid #80683a;border-radius:17px;background:radial-gradient(circle at 90% 0,#1b778244,transparent 42%),linear-gradient(130deg,#1b1d21,#0c1721);margin-bottom:13px}
#view-expansion .nxw-kicker{font-size:9px;letter-spacing:.18em;color:#55e6ff;font-weight:900}#view-expansion h2{margin:4px 0 6px;font-size:26px}#view-expansion p{color:#a9bdce;font-size:12px;line-height:1.6}
#view-expansion .nxw-res{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px;margin:10px 0}
#view-expansion .nxw-res div{background:#111e2c;border:1px solid #30475b;border-radius:11px;padding:9px}#view-expansion .nxw-res small{display:block;color:#8da6bb;font-size:8px;letter-spacing:.1em}#view-expansion .nxw-res b{font-size:17px;color:#f0c86a}
#view-expansion .nxw-tabs{display:flex;gap:6px;overflow:auto;padding:3px 0 10px}#view-expansion .nxw-tabs button{white-space:nowrap;border:1px solid #344d62;background:#0d1925;color:#b8c9d8;border-radius:99px;padding:8px 11px;font-size:10px;font-weight:850}#view-expansion .nxw-tabs button.active{background:#183747;border-color:#55cce4;color:#eaffff}
#view-expansion .nxw-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
#view-expansion .nxw-card{background:linear-gradient(145deg,#142235,#0b131e);border:1px solid #2b4359;border-radius:15px;padding:14px;min-width:0}
#view-expansion .nxw-card h3{font-size:15px;margin:5px 0}#view-expansion .nxw-card p{min-height:36px;margin:5px 0 10px}
#view-expansion .nxw-card .nxw-icon{font-size:22px}#view-expansion .nxw-meta{color:#e8ca7c;font-size:10px;margin:8px 0}
#view-expansion .nxw-btn{border:1px solid #3e8193;border-radius:9px;background:#123344;color:#dffaff;padding:9px 11px;font-size:10px;font-weight:900;margin:3px 4px 0 0}
#view-expansion .nxw-btn.gold{border:0;background:linear-gradient(100deg,#f0c86a,#a77d2d);color:#17130a}#view-expansion .nxw-btn:disabled{opacity:.4}
#view-expansion .nxw-progress{height:6px;background:#25384b;border-radius:8px;overflow:hidden;margin:8px 0}#view-expansion .nxw-progress i{display:block;height:100%;background:linear-gradient(90deg,#1b91ad,#55e6ff,#f0c86a)}
#view-expansion .nxw-log{padding:9px;border-bottom:1px solid #25394c;color:#b9c9d8;font-size:11px}
#view-expansion .nxw-foot{display:flex;justify-content:space-between;gap:8px;align-items:center;margin:12px 0;color:#8299ac;font-size:9px}
#nxw-toast{position:fixed;z-index:99;bottom:20px;left:50%;transform:translate(-50%,12px);opacity:0;pointer-events:none;background:#102332;border:1px solid #4d8799;color:#effcff;border-radius:10px;padding:10px 14px;font-size:12px;font-weight:800;transition:.2s}#nxw-toast.show{opacity:1;transform:translate(-50%,0)}
@media(max-width:600px){#view-expansion .nxw-res{grid-template-columns:repeat(2,minmax(0,1fr))}#view-expansion .nxw-grid{grid-template-columns:1fr}#view-expansion h2{font-size:22px}}
</style>
<div class="nxw-intro"><div class="nxw-kicker">NEXUS WORLD EXPANSION · OFFLINE SYSTEMS</div><h2>Живий світ NEXUS</h2><p>14 повноцінних систем усередині твого світу: місто, підземелля, флот, кризи, компаньйон, еволюція, арена, генетика, музей, сезон, симулятор і спадщина. Усе зберігається локально окремо від старих режимів.</p><div class="nxw-res" id="nxw-res"></div><div class="nxw-foot"><span id="nxw-save-status">● ЛОКАЛЬНЕ ЗБЕРЕЖЕННЯ</span><span>WORLD LEVEL <b id="nxw-level">1</b> · LEGACY <b id="nxw-legacy">0</b></span></div></div>
<div class="nxw-tabs" id="nxw-tabs"></div><div id="nxw-content"></div>
<div class="nxw-foot"><span>Локальний профіль NEXUS WORLD EXPANSION</span><span><button class="nxw-btn" data-x="export">Експорт</button><button class="nxw-btn" data-x="import">Імпорт</button></span><input id="nxw-file" type="file" accept="application/json" hidden></div>`}
function addUI(){const nav=$('.nav'),main=$('.content');if(!nav||!main||$('#view-expansion'))return;const saveBtn=nav.querySelector('[data-view="save"]');const b=document.createElement('button');b.dataset.view='expansion';b.innerHTML='<span>✦</span>Розширення світу';if(saveBtn)nav.insertBefore(b,saveBtn);else nav.append(b);const sec=document.createElement('section');sec.className='view';sec.id='view-expansion';sec.innerHTML=panel();main.append(sec);$('#nxw-tabs').innerHTML=tabNames.map(([id,n])=>'<button data-tab="'+id+'" class="'+(id==='all'?'active':'')+'">'+n+'</button>').join('');$('#nxw-tabs').addEventListener('click',e=>{const t=e.target.closest('[data-tab]');if(t){activeTab=t.dataset.tab;render()}});$('#nxw-content').addEventListener('click',actions);$('#view-expansion').addEventListener('click',e=>{const x=e.target.closest('[data-x]');if(x)backup(x.dataset.x)});render()}
let activeTab='all';
function card(icon,title,desc,meta,buttons){return '<article class="nxw-card"><div class="nxw-icon">'+icon+'</div><h3>'+title+'</h3><p>'+desc+'</p><div class="nxw-meta">'+meta+'</div>'+buttons+'</article>'}
function btn(action,label,cls=''){return '<button class="nxw-btn '+cls+'" data-act="'+action+'">'+label+'</button>'}
function render(){
if(!$('#nxw-content'))return;$('#nxw-res').innerHTML=[['КРЕДИТИ','credits'],['ЕНЕРГІЯ','energy'],['СПЛАВ','alloy'],['КРИСТАЛИ','crystals']].map(([n,k])=>'<div><small>'+n+'</small><b>'+fmt(s[k])+'</b></div>').join('');$('#nxw-level').textContent=Math.floor(s.xp/300)+1;$('#nxw-legacy').textContent=s.legacy;
$('#nxw-tabs').querySelectorAll('button').forEach(b=>b.classList.toggle('active',b.dataset.tab===activeTab));
const all=modules.filter(m=>activeTab==='all'||(activeTab==='city'&&m[0]==='city')||(activeTab==='explore'&&['dungeon','museum'].includes(m[0]))||(activeTab==='space'&&['fleet','crisis'].includes(m[0]))||(activeTab==='combat'&&['arena','sim'].includes(m[0]))||(activeTab==='science'&&['evolution','genetics','companion'].includes(m[0]))||(activeTab==='meta'&&['market','season','command','legacy'].includes(m[0])));
const cards=all.map(([id,ic,kicker,title,desc])=>{let meta='',buttons='';
switch(id){
case'city':meta='РІВЕНЬ МІСТА '+s.city+' · будівлі '+Object.values(s.buildings).reduce((a,b)=>a+b,0);buttons=btn('city','Побудувати квартал · 80 кредитів','gold')+btn('building','Покращити виробництво · 45 сплаву');break;
case'dungeon':meta='ЗАЧИЩЕНО '+s.dungeons+' підземель · наступний рівень складності '+(s.dungeons+1);buttons=btn('dungeon','Увійти · 25 енергії','gold');break;
case'fleet':meta='ФЛОТ '+s.fleet+' · ВІДКРИТО ПЛАНЕТ '+(s.planet+1)+'/6';buttons=btn('planet','Відкрити наступну планету · 60 даних')+btn('fleet','Збудувати корабель · 90 сплаву','gold');break;
case'crisis':meta='ГЛОБАЛЬНА КРИЗА · '+(s.crisisDay===day()?(s.crisisDone?'ВИРІШЕНО':'АКТИВНА'):'НОВА');buttons=btn('crisis','Вирішити кризу дня','gold');break;
case'companion':meta='РІВЕНЬ ДРОНА '+s.companion+' · ДОСВІД '+s.companionXp+'/100';buttons=btn('companion','Навчити компаньйона · 35 даних','gold');break;
case'evolution':meta='ВІДКРИТО '+s.tech.length+'/8 ВУЗЛІВ';buttons=btn('tech','Дослідити гілку · 55 даних','gold');break;
case'market':meta='ОСОБЛИВИЙ ТОВАР · РІДКІСНІ МОДУЛІ';buttons=btn('market','Придбати артефакт · 110 кредитів','gold')+btn('trade','Обміняти 2 кристали на 70 кредитів');break;
case'arena':meta='ПЕРЕМОГИ НАД БОСАМИ '+s.bossWins;buttons=btn('boss','Викликати боса · 35 енергії','gold');break;
case'genetics':meta='АДАПТАЦІЇ '+s.genetics+'/5';buttons=btn('genetics','Створити адаптацію · 45 даних + 2 кристали','gold');break;
case'museum':meta='ЕКСПОНАТІВ '+s.museum.length+'/12 · РЕЛІКВІЙ '+s.artifacts.length;buttons=btn('museum','Передати артефакт у музей');break;
case'season':meta='СЕЗОН '+s.season+' · '+s.seasonXp+' / 500 XP';buttons=btn('season','Забрати сезонну нагороду','gold')+btn('seasonup','Перейти до наступного сезону');break;
case'sim':meta='ПЕРЕМОГИ '+s.simWins+' · БЕЗ ВИТРАТ РЕСУРСІВ';buttons=btn('sim','Запустити тактичний бій','gold');break;
case'command':meta='НАКАЗ ДНЯ · '+(s.lastDaily===day()&&s.dailyDone?'ВИКОНАНО':'ДОСТУПНИЙ');buttons=btn('daily','Виконати наказ командира','gold')+btn('story','Продовжити живу історію');break;
case'legacy':meta='СПАДЩИНА '+s.legacy+' · ПЕРЕВАГА '+(s.legacy*5)+'%';buttons=btn('legacy','Почати нову еру (потрібен рівень 10)','gold');break;
}
return card(ic,title,desc,meta,buttons)}).join('');
const logHTML=s.logs.slice(0,8).map(x=>'<div class="nxw-log">◈ '+x.t+'</div>').join('');
$('#nxw-content').innerHTML='<div class="nxw-grid">'+cards+'</div><article class="nxw-card" style="margin-top:10px"><h3>Хроніка живого світу</h3>'+(logHTML||'<p>Тут з’являтимуться наслідки твоїх рішень.</p>')+'</article>';
}
function actions(e){const b=e.target.closest('[data-act]');if(!b)return;const a=b.dataset.act;let msg='';
if(a==='city'){if(!pay({credits:80,energy:20}))return;s.city++;s.buildings.habitat++;gain({credits:35,energy:12});xp(55);msg='Мегаполіс розширено: новий житловий квартал запущено.'}
if(a==='building'){if(!pay({alloy:45,credits:35}))return;s.buildings.industry++;gain({alloy:12});xp(35);msg='Промисловий район модернізовано.'}
if(a==='dungeon'){if(!pay({energy:25}))return;const win=Math.random()<Math.min(.92,.62+s.genetics*.04+s.companion*.025+s.legacy*.01);if(win){s.dungeons++;const relic=['Ключ забутої брами','Серце підземного реактора','Маска першого архонта','Кристал темної пам’яті'][Math.floor(Math.random()*4)];s.artifacts.push(relic);gain({credits:55,alloy:25,crystals:1});xp(75);msg='Підземелля зачищено. Знайдено: '+relic+'.'}else{gain({credits:12});xp(12);msg='Загін ледве повернувся з підземелля. Здобуто лише уламки.'}}
if(a==='planet'){if(s.planet>=5)return toast('Усі шість планет уже відкриті.');if(!pay({data:60,energy:25}))return;s.planet++;s.artifacts.push('Зразок планети №'+(s.planet+1));gain({crystals:2,credits:45});xp(65);msg='Відкрито нову планету. Карта зоряної системи оновлена.'}
if(a==='fleet'){if(!pay({alloy:90,credits:65}))return;s.fleet++;gain({energy:30});xp(50);msg='Новий корабель додано до флоту. Експедиційний потенціал зріс.'}
if(a==='crisis'){if(s.crisisDay===day()&&s.crisisDone)return toast('Кризу сьогодні вже вирішено.');if(!pay({energy:25,alloy:15}))return;const outcomes=[['Метеоритний шторм відбито. Місто врятовано.',{credits:100,crystals:2}],['Енергетичну аномалію стабілізовано.',{energy:80,data:25}],['Біо-зараження локалізовано.',{alloy:35,crystals:3}]];const o=outcomes[Math.floor(Math.random()*outcomes.length)];gain(o[1]);s.crisisDay=day();s.crisisDone=true;xp(70);msg=o[0]}
if(a==='companion'){if(!pay({data:35,energy:10}))return;s.companionXp+=55;if(s.companionXp>=100){s.companion++;s.companionXp-=100}xp(25);msg='ШІ-компаньйон отримав нові навички та досвід.'}
if(a==='tech'){if(s.tech.length>=8)return toast('Усі вузли еволюції відкриті.');if(!pay({data:55,crystals:1}))return;const nodes=['Сканування глибин','Наносплави','Біоадаптація','Квантова навігація','Тактичний прогноз','Автономні дрони','Синтез енергії','Командна мережа'];const n=nodes.find(x=>!s.tech.includes(x));s.tech.push(n);xp(45);msg='Еволюція: відкрито вузол «'+n+'».'}
if(a==='market'){if(!pay({credits:110,crystals:2}))return;const relic='Чорноринковий модуль №'+(s.artifacts.length+1);s.artifacts.push(relic);gain({alloy:35});xp(25);msg='Придбано рідкісний модуль: '+relic+'.'}
if(a==='trade'){if(!pay({crystals:2}))return;gain({credits:70});msg='Обмін завершено: +70 кредитів.'}
if(a==='boss'){if(!pay({energy:35,alloy:15}))return;const power=s.companion*5+s.genetics*7+s.tech.length*3+s.fleet*2+s.legacy*5+Math.floor(s.xp/100);const win=Math.random()<Math.min(.94,.38+power/100);if(win){s.bossWins++;const relic='Трофей арени '+s.bossWins;s.artifacts.push(relic);gain({credits:100,crystals:3,alloy:45});xp(110);msg='Боса переможено! Отримано '+relic+'.'}else{gain({data:15});xp(18);msg='Бос відкинув загін. Зібрано бойові дані для наступної спроби.'}}
if(a==='genetics'){if(s.genetics>=5)return toast('Генетичний потенціал вичерпано.');if(!pay({data:45,crystals:2}))return;s.genetics++;xp(45);msg='Створено нову генетичну адаптацію. Шанс успіху експедицій зріс.'}
if(a==='museum'){const relic=s.artifacts.find(x=>!s.museum.includes(x));if(!relic)return toast('Немає нових артефактів для музею. Спершу досліди світ.');s.museum.push(relic);gain({credits:30,crystals:1});xp(30);msg='До музею передано експонат: '+relic+'.'}
if(a==='season'){if(s.seasonXp<100)return toast('Потрібно щонайменше 100 сезонного XP.');s.seasonXp-=100;gain({credits:80,energy:35,crystals:1});msg='Сезонну нагороду забрано.'}
if(a==='seasonup'){if(s.seasonXp<500)return toast('Для нового сезону потрібно 500 сезонного XP.');s.seasonXp-=500;s.season++;gain({crystals:3,credits:150});msg='Розпочато сезон '+s.season+'. Старі трофеї збережено.'}
if(a==='sim'){const p=s.companion*4+s.genetics*5+s.tech.length*4+s.fleet*3+Math.random()*30;const win=p>35;if(win){s.simWins++;xp(30);gain({data:12});msg='Симуляція успішна: тактика підтверджена, +30 XP.'}else{xp(12);msg='Симуляція виявила слабке місце. +12 XP за аналіз.'}}
if(a==='daily'){if(s.lastDaily===day()&&s.dailyDone)return toast('Наказ уже виконано сьогодні.');s.lastDaily=day();s.dailyDone=true;gain({credits:45,energy:25,data:12});xp(35);msg='Наказ командира виконано. Ресурси й XP зараховано.'}
if(a==='story'){const stories=[['Сигнал із глибин','Ти знаходиш сигнал, що може належати першій експедиції.'],['Розкол ради','Командири сперечаються: розвивати флот чи рятувати місто.'],['Пульс ядра','Ядро пропонує обміняти частину ресурсів на невідоме знання.'],['Нова цивілізація','Мешканці колонії просять автономію. Твоє рішення змінить історію.']];const st=stories[s.story%stories.length];s.storyChoices.push({chapter:s.story+1,title:st[0],choice:s.story%2?'Флот':'Місто'});s.story++;gain({data:18,credits:25});xp(35);msg='Глава '+s.story+' «'+st[0]+'»: '+st[1]+' Рішення: '+s.storyChoices[s.storyChoices.length-1].choice+'.'}
if(a==='legacy'){if(Math.floor(s.xp/300)+1<10)return toast('До рівня 10 ще зарано.');if(!confirm('Почати нову еру? Місто, флот, технології та ресурси перезапустяться. Артефакти, трофеї та бонус спадщини залишаться.'))return;const keep={legacy:s.legacy+1,artifacts:s.artifacts,museum:s.museum,bossWins:s.bossWins,logs:s.logs};s={...fresh(),...keep,xp:0};msg='Нова ера розпочалася. Постійний бонус спадщини збільшено.'}
if(!msg)return;log(msg);save();render();toast(msg)}
function backup(mode){if(mode==='export'){const blob=new Blob([JSON.stringify({app:'KOZAK NEXUS',module:'NEXUS WORLD EXPANSION',state:s},null,2)],{type:'application/json'});const u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download='nexus-world-expansion-backup.json';a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);return}$('#nxw-file').click()}
document.addEventListener('change',e=>{if(e.target.id!=='nxw-file')return;const f=e.target.files[0];if(!f)return;const rd=new FileReader();rd.onload=()=>{try{const d=JSON.parse(rd.result);if(d.app!=='KOZAK NEXUS'||d.module!=='NEXUS WORLD EXPANSION'||!d.state||d.state.v!==1)throw Error('Невірна резервна копія');if(!confirm('Замінити тільки прогрес розширення NEXUS WORLD?'))return;s={...fresh(),...d.state,buildings:{...fresh().buildings,...d.state.buildings}};save();render();toast('Розширення відновлено')}catch(err){toast(err.message)}};rd.readAsText(f)});
function init(){addUI();save()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();