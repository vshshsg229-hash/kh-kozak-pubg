/* Kozak Academy prototype: offline learning tasks, local badges, and idempotent XP rewards through the existing profile API. */
/* Rewards use unique IDs so a refresh cannot grant XP twice for the same question. */
/* The module is intentionally mounted in the existing progress panel to keep navigation stable. */
(()=>{'use strict';
const KEY='khkozak_academy_v1';
const XP_PREFIX='academy-v1-q-';
const questions=[
{id:'logic-1',category:'Логіка',question:'У кімнаті горіло 3 свічки. Дві загасили. Скільки свічок залишилося?',options:['1','2','3','0'],answer:2,explanation:'Усі три свічки залишилися, навіть якщо дві вже не горять.'},
{id:'math-1',category:'Математика',question:'Скільки буде 15 + 27?',options:['32','42','43','52'],answer:1,explanation:'15 + 20 = 35, ще +7 = 42.'},
{id:'language-1',category:'Українська мова',question:'Яке слово написано правильно?',options:['будьласка','будь-ласка','будь ласка','будь ласко'],answer:2,explanation:'Правильне написання — «будь ласка», окремо.'},
{id:'digital-1',category:'Цифрова безпека',question:'Незнайомець просить надіслати пароль від гри. Що робити?',options:['Надіслати, якщо він чемний','Не надсилати пароль','Надіслати лише частину','Опублікувати пароль у профілі'],answer:1,explanation:'Паролі не передають іншим людям. За потреби звернися до дорослого, якому довіряєш.'},
{id:'logic-2',category:'Логіка',question:'Що важче: кілограм заліза чи кілограм пір’я?',options:['Залізо','Пір’я','Однакова вага','Неможливо знати'],answer:2,explanation:'Кілограм — це однакова маса незалежно від матеріалу.'},
{id:'math-2',category:'Математика',question:'Половина від 86 — це…',options:['23','36','43','46'],answer:2,explanation:'86 ÷ 2 = 43.'},
{id:'digital-2',category:'Цифрова грамотність',question:'Як перевірити підозріле повідомлення про виграш?',options:['Одразу натиснути посилання','Переслати всім друзям','Перевірити джерело й не вводити дані','Ввести дані картки'],answer:2,explanation:'Не поспішай натискати посилання чи вводити особисті дані. Перевір інформацію через офіційне джерело.'},
{id:'logic-3',category:'Увага',question:'Продовж ряд: 2, 4, 8, 16, …',options:['18','24','30','32'],answer:3,explanation:'Кожне число множиться на 2, тому наступне — 32.'},
{id:'language-2',category:'Українська мова',question:'Обери український відповідник до слова «извинение».',options:['Вибачення','Пробаченнячко','Ізвинення','Вибачаю'],answer:0,explanation:'Нормативний український відповідник — «вибачення».'},
{id:'life-1',category:'Корисні звички',question:'Після тривалого сидіння за екраном найкраще…',options:['Не рухатися ще довше','Зробити коротку перерву й порухатися','Збільшити яскравість до максимуму','Пропустити відпочинок'],answer:1,explanation:'Короткі перерви та рух допомагають відпочити від екрана.'},
{id:'logic-4',category:'Логіка',question:'У забігу ти обігнав учасника, який був другим. Яке місце тепер у тебе?',options:['Перше','Друге','Третє','Четверте'],answer:1,explanation:'Ти посів його місце — друге.'},
{id:'digital-3',category:'Цифрова безпека',question:'Який пароль надійніший?',options:['123456','kozak','Password','Довга унікальна фраза з різних символів'],answer:3,explanation:'Використовуй довгий унікальний пароль і не повторюй його на різних сайтах.'},
{id:'science-1',category:'🌍 Природознавство',question:'Яка планета відома як Червона планета?',options:["Венера","Марс","Юпітер","Земля"],answer:1,explanation:'Марс має червонуватий колір через залізо в його ґрунті.'},
{id:'math-3',category:'🔢 Математика',question:'Скільки буде 8 × 7?',options:["54","56","64","48"],answer:1,explanation:'8 помножити на 7 дорівнює 56.'},
{id:'language-3',category:'📚 Українська мова',question:'Яке слово є іменником?',options:["Веселий","Стрибати","Метелик","Швидко"],answer:2,explanation:'Метелик — це назва істоти, отже іменник.'},
{id:'nature-1',category:'🐾 Природа',question:'Яка тварина змінює колір, щоб маскуватися?',options:["Хамелеон","Їжак","Кролик","Пінгвін"],answer:0,explanation:'Хамелеони можуть змінювати колір шкіри.'},
{id:'logic-5',category:'🧩 Логіка',question:'Що зайве: яблуко, груша, морква, слива?',options:["Яблуко","Груша","Морква","Слива"],answer:2,explanation:'Морква — овоч, решта — фрукти.'},
{id:'math-4',category:'🔢 Математика',question:'У тебе 20 зірочок. Віддав 7. Скільки лишилося?',options:["12","13","14","27"],answer:1,explanation:'20 − 7 = 13 зірочок.'},
{id:'emotion-1',category:'💛 Емоційний інтелект',question:'Друг засмутився. Що можна зробити?',options:["Посміятися з нього","Запитати, чи потрібна допомога","Не слухати","Звинувачувати його"],answer:1,explanation:'Уважність і добрі слова допомагають друзям.'},
{id:'science-2',category:'🌌 Космос',question:'Що дає Землі світло й тепло?',options:["Місяць","Сонце","Марс","Комета"],answer:1,explanation:'Земля отримує світло й тепло від Сонця.'},
{id:'digital-4',category:'🛡️ Безпека',question:'Онлайн друг просить твою домашню адресу. Що краще?',options:["Надіслати одразу","Написати адресу школи теж","Не ділитися й порадитися з дорослим","Викласти адресу публічно"],answer:2,explanation:'Особисті дані не варто передавати незнайомцям. Порадься з дорослим, якому довіряєш.'},
{id:'math-5',category:'🔢 Математика',question:'Яке число продовжує ряд: 5, 10, 15, 20, …?',options:["22","24","25","30"],answer:2,explanation:'Щоразу додаємо 5, тому наступне число — 25.'},
{id:'language-4',category:'📖 Слова',question:'Яке слово протилежне до слова «високий»?',options:["Довгий","Низький","Широкий","Великий"],answer:1,explanation:'Антонім до «високий» — «низький».'},
{id:'nature-2',category:'🌿 Природа',question:'Що потрібно рослині, щоб рости?',options:["Лише темрява","Вода, світло й повітря","Тільки цукерки","Пластик"],answer:1,explanation:'Для росту більшості рослин потрібні вода, світло, повітря та поживні речовини.'},
{id:'logic-6',category:'🔍 Уважність',question:'У кошику 4 червоні й 3 сині кульки. Скільки кульок разом?',options:["6","7","8","12"],answer:1,explanation:'4 + 3 = 7 кульок.'},
{id:'science-3',category:'🧪 Наука',question:'У якому стані вода стає льодом?',options:["Коли замерзає","Коли кипить","Коли світить сонце","Коли її перемішати"],answer:0,explanation:'За достатньо низької температури вода замерзає й перетворюється на лід.'},
{id:'life-2',category:'🌈 Добрі звички',question:'Що допоможе відпочити очам після екрана?',options:["Дивитися ще ближче","Коротко подивитися вдалину й зробити перерву","Не кліпати","Збільшити час гри"],answer:1,explanation:'Регулярні перерви та погляд удалину допомагають відпочити від екрана.'},
{id:'math-6',category:'🔢 Математика',question:'У коробці 3 ряди по 4 олівці. Скільки олівців?',options:["7","10","12","14"],answer:2,explanation:'3 × 4 = 12 олівців.'},
{id:'language-5',category:'📚 Українська мова',question:'Як правильно сказати?',options:["Дякую тобі","Дякую тебе","Спасібо тобі","Дякувати тебе"],answer:0,explanation:'Українською природно й правильно: «Дякую тобі».'},
{id:'science-4',category:'🐝 Природа',question:'Чому бджоли важливі для рослин?',options:["Вони запилюють квіти","Вони фарбують листя","Вони поливають дерева","Вони роблять сніг"],answer:0,explanation:'Переносячи пилок, бджоли допомагають багатьом рослинам утворювати плоди й насіння.'},
{id:'logic-7',category:'🧠 Логіка',question:'У сім’ї є двоє батьків і двоє дітей. Найменше скільки людей може бути?',options:["2","3","4","5"],answer:1,explanation:'Це можуть бути бабуся/дідусь? У класичній загадці — дід, батько й син: троє. Тут формулювання має кілька трактувань, тому подумай про різні покоління.'},
{id:'digital-5',category:'💻 Цифрова грамотність',question:'Що робити, якщо побачив онлайн щось страшне або неприємне?',options:["Тримати це в секреті","Показати дорослому, якому довіряєш","Переслати всім","Відповісти образами"],answer:1,explanation:'Не потрібно справлятися самому — звернися до дорослого, якому довіряєш.'},
{id:'math-7',category:'🔢 Математика',question:'Скільки хвилин у пів години?',options:["15","20","30","60"],answer:2,explanation:'Пів години — це 30 хвилин.'},
{id:'emotion-2',category:'🤝 Дружба',question:'Ти випадково образив друга. Що найкраще зробити?',options:["Удавати, що нічого не сталося","Щиро вибачитися й вислухати його","Звинувачувати інших","Перестати з ним говорити"],answer:1,explanation:'Щире вибачення й готовність вислухати допомагають виправити ситуацію.'},
{id:'science-5',category:'🌦️ Погода',question:'Що утворюється, коли сонячне світло проходить крізь краплі дощу?',options:["Веселка","Снігова буря","Туман завжди","Грім"],answer:0,explanation:'Краплі води розкладають сонячне світло на кольори веселки.'},
{id:'logic-8',category:'🧩 Послідовності',question:'Продовж ряд: 🔴 🔵 🔴 🔵 🔴 __',options:["🔴","🔵","🟡","🟢"],answer:1,explanation:'Кольори чергуються: червоний, синій, червоний, синій…'}
];
const badges=[
{id:'first',name:'Перший крок',icon:'🌟',need:1,desc:'Пройти перше завдання'},
{id:'curious',name:'Допитливий розум',icon:'🧠',need:3,desc:'Пройти 3 завдання'},
{id:'thinker',name:'Майстер логіки',icon:'🧩',need:6,desc:'Пройти 6 завдань'},
{id:'explorer',name:'Дослідник світу',icon:'🧭',need:12,desc:'Пройти 12 завдань'},
{id:'rainbow',name:'Веселковий розум',icon:'🌈',need:18,desc:'Пройти 18 завдань'},
{id:'inventor',name:'Маленький винахідник',icon:'🚀',need:24,desc:'Пройти 24 завдання'},
{id:'superhero',name:'Супергерой знань',icon:'🦸',need:30,desc:'Пройти 30 завдань'},
{id:'academy-master',name:'Легенда Academy',icon:'👑',need:questions.length,desc:'Пройти всі 36 завдань'}
];
const $=s=>document.querySelector(s);
function read(){try{const v=JSON.parse(localStorage.getItem(KEY)||'{}');return {solved:Array.isArray(v.solved)?v.solved.filter(id=>questions.some(q=>q.id===id)):[],badges:Array.isArray(v.badges)?v.badges:[],current:typeof v.current==='string'?v.current:null,attempts:Number(v.attempts)||0,memoryFound:Array.isArray(v.memoryFound)?v.memoryFound:[],codeSolved:Array.isArray(v.codeSolved)?v.codeSolved:[],focusSolved:Array.isArray(v.focusSolved)?v.focusSolved:[],stickers:Array.isArray(v.stickers)?v.stickers:[],dailyClaim:typeof v.dailyClaim==='string'?v.dailyClaim:null,dailyCycleStart:Number(v.dailyCycleStart)||0,dailyCycle:Number(v.dailyCycle)||0,dailySolved:Array.isArray(v.dailySolved)?v.dailySolved:[]}}catch{return {solved:[],badges:[],current:null,attempts:0,memoryFound:[],codeSolved:[],focusSolved:[],stickers:[],dailyClaim:null,dailyCycleStart:0,dailyCycle:0,dailySolved:[]}}}
let state=read();
function save(){try{localStorage.setItem(KEY,JSON.stringify(state));return true}catch{return false}}
function unlocked(){return badges.filter(b=>state.solved.length>=b.need)}
function grantBadges(){const rewards={first:'🌟',curious:'🐸',thinker:'🐼',explorer:'🦄',rainbow:'🐙',inventor:'🐧',superhero:'🐲','academy-master':'🦋'};for(const b of unlocked()){if(!state.badges.includes(b.id))state.badges.push(b.id);const sticker=rewards[b.id];if(sticker&&!state.stickers.includes(sticker))state.stickers.push(sticker)}save()}
function chooseNext(){const available=questions.filter(q=>!state.solved.includes(q.id));if(!available.length){state.current=null;save();return null}const next=available[Math.floor(Math.random()*available.length)];state.current=next.id;save();return next}
function esc(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
let mode='quest',memoryCards=[],memoryOpen=[],memoryBusy=false,codeFeedback='',focusFeedback='',renderedDailyCycle=-1;
const memoryPairs=[
{id:'word',icon:'📚',label:'КНИГА'},
{id:'sun',icon:'☀️',label:'СОНЦЕ'},
{id:'heart',icon:'❤️',label:'ДОБРО'},
{id:'shield',icon:'🛡️',label:'БЕЗПЕКА'},
{id:'star',icon:'⭐',label:'ЗІРКА'},
{id:'brain',icon:'🧠',label:'РОЗУМ'},
{id:'moon',icon:'🌙',label:'МІСЯЦЬ'},
{id:'leaf',icon:'🍀',label:'ПРИРОДА'},
{id:'rocket',icon:'🚀',label:'КОСМОС'},
{id:'rainbow',icon:'🌈',label:'ВЕСЕЛКА'}
];
const focusTasks=[
{id:'odd-1',title:'Знайди зайве',question:'Що не підходить до решти?',items:['🐶','🐱','🚗','🐰'],answer:2,tip:'Три картинки — тварини, а одна — транспорт.'},
{id:'odd-2',title:'Фруктова загадка',question:'Який предмет зайвий?',items:['🍎','🍐','🥕','🍌'],answer:2,tip:'Морква — овоч, а інші — фрукти.'},
{id:'odd-3',title:'Космічний пошук',question:'Знайди те, що не літає в космосі.',items:['🚀','🪐','🐟','🌙'],answer:2,tip:'Риба живе у воді, а не в космосі.'},
{id:'odd-4',title:'Кольоровий ряд',question:'Який символ порушує правило?',items:['🔵','🔵','🔵','🔺'],answer:3,tip:'Три символи — круги, а один — трикутник.'},
{id:'odd-5',title:'Зимова історія',question:'Що не пасує до зими?',items:['⛄','🧤','🍉','❄️'],answer:2,tip:'Кавун частіше асоціюється з літом.'},
{id:'odd-6',title:'У світі чисел',question:'Яке число не парне?',items:['2','4','7','8'],answer:2,tip:'Парні числа діляться на 2 без остачі.'},
{id:'odd-7',title:'Звуки природи',question:'Хто не є птахом?',items:['🦉','🐧','🦋','🦅'],answer:2,tip:'Метелик — комаха.'},
{id:'odd-8',title:'Чарівні форми',question:'Яка форма відрізняється?',items:['🟦','🟦','🟦','🔴'],answer:3,tip:'Три фігури квадратні, одна кругла.'},
{id:'odd-9',title:'Здорові звички',question:'Що не є напоєм?',items:['💧','🥛','🧃','📚'],answer:3,tip:'Книжка допомагає вчитися, але її не п’ють.'},
{id:'odd-10',title:'Фінішний рівень',question:'Що зайве в цій групі?',items:['🎨','🖌️','🖍️','🥄'],answer:3,tip:'Три предмети для малювання, а ложка — для їжі.'}
];
const codeTasks=[
{id:'riddle-1',title:'Загадка лісу',question:'Без рук, без ніг, а малювати вміє. Що це?',options:['Вітер','Мороз','Кіт'],answer:1,tip:'Узимку він малює візерунки на вікнах.'},
{id:'riddle-2',title:'Код космічної станції',question:'Яке число пропущено: 3, 6, 9, __?',options:['10','12','15'],answer:1,tip:'Щоразу додаємо три.'},
{id:'riddle-3',title:'Таємниця козачка',question:'Що потрібно зробити, якщо незнайомець просить твій пароль?',options:['Поділитися','Надіслати другу','Не надсилати й сказати дорослому'],answer:2,tip:'Пароль — секрет, навіть якщо просять дуже ввічливо.'},
{id:'riddle-4',title:'Загадка мандрівника',question:'Що має голки, але не вміє шити?',options:['Їжак','Кравець','Риба'],answer:0,tip:'Це маленька тваринка, яка згортається в клубочок.'},
{id:'riddle-5',title:'Математичний портал',question:'Яке число більше: 18 чи 81?',options:['18','81','Вони однакові'],answer:1,tip:'Подивись на десятки: у 81 їх вісім.'},
{id:'riddle-6',title:'Лісова стежка',question:'У якого дерева восени жовтіє листя, а взимку воно часто без листя?',options:['Береза','Сосна','Ялина'],answer:0,tip:'Це листяне дерево з білою корою.'},
{id:'riddle-7',title:'Дружня місія',question:'Що краще сказати, коли хтось допоміг тобі?',options:['Відчепись','Дякую!','Мені байдуже'],answer:1,tip:'Добрі слова показують вдячність.'},
{id:'riddle-8',title:'Код часу',question:'Якщо зараз 3 година, котра буде через 2 години?',options:['4','5','6'],answer:1,tip:'Рахуй уперед: 4, потім 5.'},
{id:'riddle-9',title:'Таємниця океану',question:'Яка тварина дихає повітрям і живе в морі?',options:['Дельфін','Акула-молот','Медуза'],answer:0,tip:'Це ссавець, який виринає на поверхню подихати.'},
{id:'riddle-10',title:'Зоряний код',question:'Яка фігура має три сторони?',options:['Коло','Квадрат','Трикутник'],answer:2,tip:'Назва підказує: у трикутника три кути й три сторони.'},
{id:'riddle-11',title:'Зелений герой',question:'Яка дія допомагає природі?',options:['Кидати сміття в річку','Сортувати відходи','Ламати гілки'],answer:1,tip:'Сортування допомагає переробляти матеріали.'},
{id:'riddle-12',title:'Фінальний секрет',question:'Що росте, коли ним ділишся з друзями?',options:['Знання','Таємний пароль','Сміття'],answer:0,tip:'Коли пояснюєш щось іншим, ви вчитеся разом.'}
];
function shuffle(items){return items.slice().sort(()=>Math.random()-.5)}
function localDay(){const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
const DAY_MS=24*60*60*1000;
function ensureDailyCycle(){const now=Date.now();if(!state.dailyCycleStart){state.dailyCycleStart=now;state.dailyCycle=0;state.dailySolved=[];save()}const cycle=Math.floor(Math.max(0,now-state.dailyCycleStart)/DAY_MS);if(cycle!==state.dailyCycle){state.dailyCycle=cycle;state.dailySolved=[];save()}return {cycle,nextAt:state.dailyCycleStart+(cycle+1)*DAY_MS,remaining:Math.max(0,state.dailyCycleStart+(cycle+1)*DAY_MS-now)}}
function dailyQuestions(){const cycle=ensureDailyCycle().cycle;return Array.from({length:5},(_,i)=>questions[(cycle*5+i)%questions.length])}
function remainingLabel(ms){const total=Math.ceil(ms/60000),hours=Math.floor(total/60),minutes=total%60;return hours+' год '+String(minutes).padStart(2,'0')+' хв'}
function hasSolvedCode(id){return state.codeSolved.includes(id)}
function awardXP(id,xp){const api=window.khkozakProgression;if(!api||typeof api.awardChallenge!=='function')return false;const result=api.awardChallenge(id,0,xp);return !!result.ok||result.reason==='already-claimed'}
function buildMemory(){memoryCards=shuffle(memoryPairs.flatMap(p=>[{id:p.id,side:'icon',face:p.icon,key:p.id+'-icon'},{id:p.id,side:'word',face:p.label,key:p.id+'-word'}]));memoryOpen=[];memoryBusy=false}
function render(){
 let host=$('#khAcademy');if(!host){const panel=$('#tab-academy')||$('#tab-progress');if(!panel)return;host=document.createElement('section');host.id='khAcademy';host.className='kha-panel';panel.appendChild(host)}
 const dailyClock=ensureDailyCycle(),dailyTasks=dailyQuestions();renderedDailyCycle=dailyClock.cycle;
 const done=state.solved.length,all=questions.length,q=(mode==='quest'?questions.find(x=>x.id===state.current&&!state.solved.includes(x.id)):null);
 if(mode==='quest'&&!q&&done<all)state.current=chooseNext()?.id||null;
 const activeQ=mode==='quest'?(questions.find(x=>x.id===state.current&&!state.solved.includes(x.id))||null):null;
 const earned=badges.filter(b=>state.badges.includes(b.id));
 const today=localDay(),dailyDone=state.dailyClaim===today;
 const modeButton=(id,icon,label,sub)=>'<button type="button" class="kha-mode '+(mode===id?'is-active':'')+'" data-kha-mode="'+id+'"><span>'+icon+'</span><b>'+label+'</b><small>'+sub+'</small></button>';
 let activity='';
 if(mode==='quest'){
 activity=activeQ?'<article class="kha-question"><div class="kha-category">'+esc(activeQ.category)+'</div><h3>'+esc(activeQ.question)+'</h3><div class="kha-options">'+activeQ.options.map((o,i)=>'<button type="button" class="kha-option" data-kha-answer="'+i+'">'+esc(o)+'</button>').join('')+'</div><p class="kha-feedback" id="khaFeedback" aria-live="polite">Обери відповідь і зароби 15 XP! ✨</p><div class="kha-actions"><button type="button" class="kha-next" data-kha-next disabled>Наступне завдання ↗</button></div></article>':'<article class="kha-complete"><span>🏆</span><h3>Місія пройдена!</h3><p>Ти виконав усі завдання цієї добірки. Можна тренуватися ще або перейти до іншої пригоди.</p><button type="button" class="kha-next" data-kha-replay>Спробувати мінігру 🎮</button></article>';
 }else if(mode==='daily'){
 const task=dailyTasks.find(x=>!state.dailySolved.includes(x.id));
 activity=task?'<article class="kha-game kha-daily-quest"><span class="kha-category">🎯 МІСІЯ ДНЯ · +15 XP</span><h3>'+esc(task.category)+'</h3><p class="kha-code-question">'+esc(task.question)+'</p><p class="kha-child-help">Обери одну відповідь. Якщо не вийшло з першого разу — спробуй ще, це нормально 💛</p><div class="kha-options">'+task.options.map((o,i)=>'<button type="button" class="kha-option" data-kha-daily-answer="'+i+'">'+esc(o)+'</button>').join('')+'</div><p class="kha-feedback" id="khaDailyFeedback" aria-live="polite">Місія '+(state.dailySolved.length+1)+' із '+dailyTasks.length+'. За правильну відповідь отримаєш зірочки!</p><div class="kha-daily-progress"><span style="width:'+(state.dailySolved.length/dailyTasks.length*100)+'%"></span></div><small class="kha-code-progress">'+state.dailySolved.length+' із '+dailyTasks.length+' місій виконано</small></article>':'<article class="kha-complete"><span>🎉</span><h3>Усі місії дня виконано!</h3><p>Ти молодець! Нові 5 місій з’являться через '+remainingLabel(dailyClock.remaining)+'. А поки можеш грати в інші пригоди.</p><button type="button" class="kha-next" data-kha-mode="memory">Пограти в «Знайди пару» 🧠</button></article>';
 }else if(mode==='memory'){
 if(!memoryCards.length)buildMemory();
 activity='<article class="kha-game"><div class="kha-game-heading"><div><span class="kha-category">🧠 ТРЕНУВАННЯ ПАМ’ЯТІ</span><h3>Знайди пару!</h3><p>Поєднуй картинки й слова. За кожну нову пару — 5 XP.</p></div><b class="kha-game-score">'+state.memoryFound.length+' / '+memoryPairs.length+' пар</b></div><div class="kha-memory-grid">'+memoryCards.map(c=>{const open=memoryOpen.includes(c.key)||state.memoryFound.includes(c.id);return '<button type="button" class="kha-memory-card '+(open?'is-revealed':'')+' '+(state.memoryFound.includes(c.id)?'is-matched':'')+'" data-kha-memory="'+c.id+'" data-kha-card="'+c.key+'" '+(state.memoryFound.includes(c.id)||memoryBusy?'disabled':'')+' aria-label="'+(open?esc(c.face):'Закрита картка')+'"><span>'+(open?esc(c.face):'❔')+'</span></button>'}).join('')+'</div><p class="kha-feedback" id="khaMemoryFeedback" aria-live="polite">'+(state.memoryFound.length===memoryPairs.length?'Усі пари знайдено! Справжній майстер пам’яті! 🏆':'Знайди всі '+memoryPairs.length+' пар, щоб завершити гру.')+'</p><div class="kha-actions"><button type="button" class="kha-next" data-kha-memory-reset>'+(state.memoryFound.length===memoryPairs.length?'До інших пригод ↗':'Перемішати картки ↻')+'</button></div></article>';
 }else if(mode==='code'){
 const task=codeTasks.find(t=>!hasSolvedCode(t.id));
 activity=task?'<article class="kha-game"><span class="kha-category">🔐 СЕКРЕТНА МІСІЯ</span><h3>'+esc(task.title)+'</h3><p class="kha-code-question">'+esc(task.question)+'</p><div class="kha-options">'+task.options.map((o,i)=>'<button type="button" class="kha-option" data-kha-code="'+i+'">'+esc(o)+'</button>').join('')+'</div><p class="kha-feedback" id="khaCodeFeedback" aria-live="polite">'+esc(codeFeedback||'Розшифруй завдання, щоб отримати 10 XP!')+'</p><div class="kha-code-progress">'+codeTasks.filter(t=>hasSolvedCode(t.id)).length+' із '+codeTasks.length+' секретів розкрито</div></article>':'<article class="kha-complete"><span>🗝️</span><h3>Код розшифровано!</h3><p>Ти пройшов усі секретні випробування. Твій розум — справжній суперінструмент!</p><button type="button" class="kha-next" data-kha-code-replay>До інших пригод ↗</button></article>';
 }else if(mode==='focus'){
 const task=focusTasks.find(t=>!state.focusSolved.includes(t.id));
 activity=task?'<article class="kha-game kha-focus"><span class="kha-category">🔎 ТРЕНУВАННЯ УВАГИ</span><h3>'+esc(task.title)+'</h3><p class="kha-code-question">'+esc(task.question)+'</p><div class="kha-focus-grid">'+task.items.map((item,i)=>'<button type="button" class="kha-focus-option" data-kha-focus="'+i+'">'+item+'</button>').join('')+'</div><p class="kha-feedback" id="khaFocusFeedback" aria-live="polite">Знайди правильну картинку й отримай 8 XP! ✨</p><small class="kha-code-progress">'+state.focusSolved.length+' / '+focusTasks.length+' головоломок</small></article>':'<article class="kha-complete"><span>🏆</span><h3>Увагу прокачано!</h3><p>Ти розгадав усі головоломки! Повертайся до інших режимів або забирай щоденну нагороду.</p><button type="button" class="kha-next" data-kha-focus-replay>До інших пригод ↗</button></article>';
 }else{
 activity='<article class="kha-game kha-treasure"><span class="kha-treasure-icon">'+(dailyDone?'🎉':'🎁')+'</span><span class="kha-category">ЩОДЕННИЙ СЮРПРИЗ</span><h3>'+(dailyDone?'Нагороду вже отримано!':'Скриня дня чекає на тебе!')+'</h3><p>'+(dailyDone?'Завітай завтра — на тебе чекатиме новий подарунок.':'Забирай щоденний бонус і повертайся завтра за новим!')+'</p><button type="button" class="kha-next" data-kha-daily '+(dailyDone?'disabled':'')+'>'+(dailyDone?'✓ БОНУС ЗАБРАНО':'ВІДКРИТИ СКРИНЮ · +10 XP')+'</button><div class="kha-reward-strip"><span>⭐ XP</span><span>🏅 Значки</span><span>🧩 Нові місії</span></div></article>';
 }
 host.innerHTML='<div class="kha-head"><div><span class="kha-eyebrow">🌈 ТВОЯ ВЕЛИКА ПРИГОДА</span><h2>🎒 KOZAK KIDS WORLD</h2><p>Грай, думай, відкривай сюрпризи й навчайся! Кожен маленький крок — велика перемога.</p></div><div class="kha-xp"><b>'+done+' / '+all+'</b><span>місій пройдено</span></div></div>'+
 '<div class="kha-companion"><span class="kha-mascot" aria-hidden="true">🦊</span><div><b>Лисеня Кузя — твій напарник!</b><p>«Приві-і-іт, супергерою! 🎉 Обери пригоду, заробляй зірочки та збирай мої наліпки. Помилки — це теж частина навчання!»</p></div><span class="kha-companion-star">🌟</span></div>'+
 '<div class="kha-progress" role="progressbar" aria-label="Прогрес Academy" aria-valuemin="0" aria-valuemax="'+all+'" aria-valuenow="'+done+'"><span style="width:'+(done/all*100)+'%"></span></div>'+
 '<div class="kha-stats"><span>⭐ '+(done*15+state.memoryFound.length*5+state.codeSolved.length*10+state.focusSolved.length*8+(state.dailyClaim===today?10:0))+' XP у твоїй пригоді</span><span>🏅 '+earned.length+' / '+badges.length+' значків</span><span>🧩 '+state.memoryFound.length+' пар · 🔎 '+state.focusSolved.length+' знахідок</span></div>'+
 '<div class="kha-daily-banner"><div><b>🎯 П’ять місій на день!</b><p>Виконуй завдання, збирай ⭐ XP. Новий набір з’являється кожні 24 години.</p></div><span id="khaDailyCountdown">Оновлення через '+remainingLabel(dailyClock.remaining)+'</span></div>'+
 '<div class="kha-mode-grid">'+modeButton('daily','🌞','Місії дня','5 нових завдань · 24 год')+modeButton('quest','🗺️','Усі місії','Навчайся у своєму темпі')+modeButton('memory','🧠','Знайди пару','Тренуй пам’ять')+modeButton('code','🔐','Секретний код','Загадки й кмітливість')+modeButton('focus','🔎','Знайди зайве','10 швидких головоломок')+modeButton('treasure','🎁','Скриня дня','Щоденний бонус')+'</div>'+
 activity+
 '<div class="kha-badges"><div class="kha-section-title"><h3>🏆 Колекція досягнень</h3><span>Збирай усі!</span></div><div class="kha-badge-grid">'+badges.map(b=>'<article class="kha-badge '+(state.badges.includes(b.id)?'is-earned':'')+'"><span>'+b.icon+'</span><b>'+esc(b.name)+'</b><small>'+esc(b.desc)+'</small><em>'+(state.badges.includes(b.id)?'ВІДКРИТО':b.need+' правильних')+'</em></article>').join('')+'</div></div>'+
 '<div class="kha-sticker-collection"><div class="kha-section-title"><h3>🎒 Колекція наліпок</h3><span>'+state.stickers.length+' / 10 знайдено</span></div><div class="kha-sticker-grid">'+['🌟','🐸','🐼','🦄','🐙','🐧','🐲','🦋','🐝','🐢'].map((sticker,i)=>'<span class="kha-sticker '+(state.stickers.includes(sticker)?'is-earned':'is-locked')+'" title="'+(state.stickers.includes(sticker)?'Знайдена наліпка':'Захована наліпка')+'">'+(state.stickers.includes(sticker)?sticker:'❔')+'</span>').join('')+'</div></div><p class="kha-note">Твій прогрес зберігається на цьому пристрої. Не потрібні пароль, онлайн-акаунт чи особисті дані.</p>';
}
function answer(index){
 const q=questions.find(x=>x.id===state.current);if(!q||state.solved.includes(q.id))return;
 state.attempts++;
 const feedback=$('#khaFeedback');
 if(index!==q.answer){if(feedback)feedback.textContent='Ще спроба! Підказка: подумай уважно й обери інший варіант.';const buttons=$('#khAcademy')?.querySelectorAll('[data-kha-answer]');buttons?.forEach(b=>{b.classList.toggle('is-wrong',Number(b.dataset.khaAnswer)===index)});save();return}
 const api=window.khkozakProgression;
 if(!api||typeof api.awardChallenge!=='function'){if(feedback)feedback.textContent='Профіль ще завантажується. Зачекай мить і спробуй знову.';return}
 const result=api.awardChallenge(XP_PREFIX+q.id,0,15);
 if(!result.ok&&result.reason!=='already-claimed'){if(feedback)feedback.textContent='Не вдалося зберегти XP. Спробуй ще раз — відповідь не втрачена.';return}
 state.solved.push(q.id);grantBadges();save();
 const host=$('#khAcademy');host?.querySelectorAll('[data-kha-answer]').forEach(b=>{b.disabled=true;b.classList.remove('is-wrong');b.classList.toggle('is-correct',Number(b.dataset.khaAnswer)===q.answer)});host?.querySelector('[data-kha-next]')?.removeAttribute('disabled');
 if(feedback)feedback.textContent='Правильно! '+q.explanation+(result.ok?' +15 XP 🎉':' Завдання вже було зараховане, тому XP не нараховано повторно.');
 const stats=host?.querySelector('.kha-xp b');if(stats)stats.textContent=state.solved.length+' / '+questions.length;
 const progress=host?.querySelector('.kha-progress');if(progress){progress.setAttribute('aria-valuenow',String(state.solved.length));const fill=progress.querySelector('span');if(fill)fill.style.width=(state.solved.length/questions.length*100)+'%'}
 host?.querySelectorAll('.kha-badge').forEach((card,i)=>{const badge=badges[i];if(!badge)return;const earnedNow=state.badges.includes(badge.id);card.classList.toggle('is-earned',earnedNow);const label=card.querySelector('em');if(label)label.textContent=earnedNow?'ВІДКРИТО':badge.need+' правильних'});
 const bar=host?.querySelector('.kha-stats');if(bar)bar.innerHTML='<span>⚡ +15 XP за правильну відповідь</span><span>🏅 '+state.badges.length+' / '+badges.length+' значків</span>'}
function next(){if(state.current&&!state.solved.includes(state.current)){const feedback=$('#khaFeedback');if(feedback)feedback.textContent='Спершу дай правильну відповідь — тоді відкриється наступне завдання.';return}chooseNext();render()}
function dailyAnswer(index){const clock=ensureDailyCycle(),task=dailyQuestions().find(q=>!state.dailySolved.includes(q.id));if(!task)return;const feedback=$('#khaDailyFeedback');if(index!==task.answer){if(feedback)feedback.textContent='Майже! 💛 Подумай ще раз і спробуй інший варіант. Помилятися — це нормально!';return}if(!awardXP('academy-daily-mission-'+clock.cycle+'-'+task.id,15)){if(feedback)feedback.textContent='Зачекай мить — зберігаємо твій результат.';return}state.dailySolved.push(task.id);save();render()}
document.addEventListener('click',e=>{
 const modeButton=e.target.closest('[data-kha-mode]');if(modeButton){mode=modeButton.dataset.khaMode;codeFeedback='';if(mode==='memory'&&!memoryCards.length)buildMemory();render();return}
 const dailyOption=e.target.closest('[data-kha-daily-answer]');if(dailyOption){dailyAnswer(Number(dailyOption.dataset.khaDailyAnswer));return}
 const option=e.target.closest('[data-kha-answer]');if(option){answer(Number(option.dataset.khaAnswer));return}
 if(e.target.closest('[data-kha-next]')){next();return}
 if(e.target.closest('[data-kha-replay]')){mode='memory';buildMemory();render();return}
 if(e.target.closest('[data-kha-focus-replay]')){mode='quest';render();return}
 const memory=e.target.closest('[data-kha-memory]');if(memory&&!memoryBusy){const key=memory.dataset.khaCard,id=memory.dataset.khaMemory;if(memoryOpen.includes(key)||state.memoryFound.includes(id))return;memoryOpen.push(key);render();if(memoryOpen.length===2){const cards=memoryOpen.map(k=>memoryCards.find(c=>c.key===k));if(cards[0].id===cards[1].id&&cards[0].side!==cards[1].side){const pairId=cards[0].id;if(awardXP('academy-memory-pair-'+pairId,5)){state.memoryFound.push(pairId);memoryOpen=[];save();render()}else{memoryOpen=[];memoryBusy=false;render();const feedback=$('#khaMemoryFeedback');if(feedback)feedback.textContent='Профіль завантажується. Спробуй цю пару ще раз!'}}else{memoryBusy=true;const feedback=$('#khaMemoryFeedback');if(feedback)feedback.textContent='Майже! Запам’ятай картки й спробуй ще раз.';window.setTimeout(()=>{memoryOpen=[];memoryBusy=false;render()},750)}}return}
 if(e.target.closest('[data-kha-memory-reset]')){if(state.memoryFound.length===memoryPairs.length){mode='quest';render();return}buildMemory();render();return}
 const code=e.target.closest('[data-kha-code]');if(code){const task=codeTasks.find(t=>!hasSolvedCode(t.id));if(!task)return;const feedback=$('#khaCodeFeedback');if(Number(code.dataset.khaCode)!==task.answer){codeFeedback='Спробуй ще! Підказка: '+task.tip;if(feedback)feedback.textContent=codeFeedback;return}if(!awardXP('academy-code-'+task.id,10)){if(feedback)feedback.textContent='Зачекай секунду — профіль завантажується.';return}state.codeSolved.push(task.id);codeFeedback='Правильно! '+task.tip+' +10 XP 🎉';save();render();return}
 if(e.target.closest('[data-kha-code-replay]')){mode='quest';render();return}
 const focus=e.target.closest('[data-kha-focus]');if(focus){const task=focusTasks.find(t=>!state.focusSolved.includes(t.id));if(!task)return;const feedback=$('#khaFocusFeedback');if(Number(focus.dataset.khaFocus)!==task.answer){focusFeedback='Спробуй іще! Підказка: '+task.tip;if(feedback)feedback.textContent=focusFeedback;return}if(!awardXP('academy-focus-'+task.id,8)){if(feedback)feedback.textContent='Профіль завантажується — спробуй за мить.';return}state.focusSolved.push(task.id);focusFeedback='Супер! '+task.tip+' +8 XP ⭐';save();render();return}
 if(e.target.closest('[data-kha-daily]')){const day=localDay();if(state.dailyClaim===day)return;if(!awardXP('academy-daily-'+day,10)){const feedback=$('#khAcademy .kha-treasure p');if(feedback)feedback.textContent='Зачекай секунду, профіль ще завантажується.';return}state.dailyClaim=day;const available=['🦊','🐸','🐼','🦄','🐙','🐧','🐲','🐝','🐢','🦋'].filter(sticker=>!state.stickers.includes(sticker));if(available.length)state.stickers.push(available[Math.floor(Math.random()*available.length)]);save();render();return}
});
window.addEventListener('khkozak-profile-updated',()=>{const el=$('#khAcademy .kha-stats');if(el)el.setAttribute('data-profile-updated','true')});
function init(){grantBadges();render()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
const observer=new MutationObserver(()=>{if(($('#tab-academy')||$('#tab-progress'))&&!$('#khAcademy'))render()});observer.observe(document.documentElement,{childList:true,subtree:true});
window.setInterval(()=>{const clock=ensureDailyCycle();if(clock.cycle!==renderedDailyCycle){render();return}const label=$('#khaDailyCountdown');if(label)label.textContent='Нові місії через '+remainingLabel(clock.remaining)},60000);
})();