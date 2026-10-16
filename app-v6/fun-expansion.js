(()=>{'use strict';
const jokes=[
'Козак: «Я не загубився на Ерангелі — я просто відкрив секретний маршрут до луту».',
'Коли кажеш «останній матч», а команда вже знає, що це мінімум ще п’ять.',
'Мій план на матч: знайти лут. План луту: сховатися від мене.',
'У PUBG найстрашніший звук — не постріл. Це напарник: «Я зараз швидко залутаюся».',
'Козак не кемперить. Він проводить довготривале тактичне спостереження.',
'Зона рухається швидше за мене після фрази «та встигаємо пішки».',
'Командна робота — це коли всі четверо кажуть «ворог тут», але кожен показує в інший бік.',
'Мій aim стабільний: стабільно дивиться на стіну поруч із ворогом.',
'Лутбокс мене любить. Просто ми поки не зустрілися.',
'Найкраща тактика: сказати «я прикриваю» і випадково прикрити двері.'
];
const $=s=>document.querySelector(s),key='khkozak_joke_day_v1';
const today=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Kyiv',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
let current='';
function choose(daily=false){const s=(()=>{try{return JSON.parse(localStorage.getItem(key)||'{}')}catch{return {}}})();if(daily&&s.day===today()&&s.joke){current=s.joke}else{const prev=current;let pool=jokes.filter(j=>j!==prev);current=pool[Math.floor(Math.random()*pool.length)]||jokes[0];if(daily){s.day=today();s.joke=current;try{localStorage.setItem(key,JSON.stringify(s))}catch{}}}const host=$('#khJokeResult');if(host)host.innerHTML='<b>'+current.replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))+'</b>'}
document.addEventListener('click',e=>{if(e.target.closest('#khJokeNext'))choose(false);if(e.target.closest('#khJokeCopy')){if(!current)choose(true);if(navigator.clipboard?.writeText)navigator.clipboard.writeText(current).then(()=>{const b=$('#khJokeCopy');if(b)b.textContent='СКОПІЙОВАНО ✓'}).catch(()=>window.prompt('Скопіюй жарт:',current));else window.prompt('Скопіюй жарт:',current)}});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>choose(true),{once:true});else choose(true);
})();