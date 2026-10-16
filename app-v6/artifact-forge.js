(()=>{'use strict';
const root=document.getElementById('tab-artifactforge');if(!root||root.dataset.afReady)return;root.dataset.afReady='1';
const KEY='kh-kozak-artifact-forge-v1';
const zones=[
{id:'north',name:'Північний ретранслятор',x:26,y:29,icon:'⌁',type:'artifact',reward:'Крижаний уламок',emoji:'❄️',desc:'Фрагмент старого навігаційного ядра.',mission:'Знайди сигнал ретранслятора',missionDesc:'Відкрий північний вузол і забери фрагмент сигналу.'},
{id:'foundry',name:'Затоплена кузня',x:52,y:45,icon:'⚒',type:'skin',reward:'Скін «Глибокий імпульс»',emoji:'🛡️',desc:'Рідкісне покриття зі світними мітками.',mission:'Перезапусти кузню',missionDesc:'Відкрий вузол кузні, щоб отримати креслення.'},
{id:'east',name:'Східний архів',x:76,y:27,icon:'▤',type:'emblem',reward:'Емблема «Привид»',emoji:'◈',desc:'Емблема розвідників прихованого сектору.',mission:'Витягни архівні дані',missionDesc:'Знайди сховище даних у східному секторі.'},
{id:'crater',name:'Кратер нульового дня',x:72,y:68,icon:'✦',type:'trophy',reward:'Трофей «Нульовий день»',emoji:'🏆',desc:'Пам’ятний трофей першої експедиції.',mission:'Зачисти кратер',missionDesc:'Досліди південний маршрут і познач трофей.'},
{id:'vault',name:'Секретне сховище',x:34,y:76,icon:'⬡',type:'artifact',reward:'Серцевина форми',emoji:'💠',desc:'Рідкісна серцевина для роботи кузні.',mission:'Зламай печатку сховища',missionDesc:'Збери доступ до секретного сховища.'},
{id:'relay',name:'Тіньовий вузол',x:89,y:48,icon:'⌖',type:'emblem',reward:'Знак «Тінь»',emoji:'🎖️',desc:'Знак за виконання секретної операції.',mission:'Заверши тіньову операцію',missionDesc:'Знайди віддалений вузол і повернись із доказом.'}
];
const catalog=[
{id:'core',name:'Серцевина «Форми»',emoji:'💠',kind:'Артефакт',desc:'Матеріал для кузні.',zone:'vault'},
{id:'ice',name:'Крижаний уламок',emoji:'❄️',kind:'Артефакт',desc:'Фрагмент навігаційного ядра.',zone:'north'},
{id:'skin',name:'Глибокий імпульс',emoji:'🛡️',kind:'Скін',desc:'Тактичне покриття зі світними мітками.',zone:'foundry'},
{id:'ghost',name:'Емблема «Привид»',emoji:'◈',kind:'Емблема',desc:'Знак прихованого сектору.',zone:'east'},
{id:'trophy',name:'Трофей «Нульовий день»',emoji:'🏆',kind:'Трофей',desc:'Пам’ять про першу експедицію.',zone:'crater'},
{id:'shadow',name:'Знак «Тінь»',emoji:'🎖️',kind:'Емблема',desc:'Відзнака таємної операції.',zone:'relay'},
{id:'forged',name:'Реліквія «Пульс»',emoji:'🔷',kind:'Кований артефакт',desc:'Створено у Кузні з трьох знайдених знахідок.',zone:'forge'}
];
const defaults={found:[],missions:[],forged:false,selected:'north',runs:0};
let state=load(),selected=zones.find(z=>z.id===state.selected)||zones[0],notice='Обери вузол на карті, щоб дослідити його.';
function load(){try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(!s||!Array.isArray(s.found)||!Array.isArray(s.missions))return {...defaults};return {...defaults,...s,found:[...new Set(s.found.filter(id=>zones.some(z=>z.id===id)))],missions:[...new Set(s.missions.filter(id=>zones.some(z=>z.id===id)))],forged:s.forged===true,selected:zones.some(z=>z.id===s.selected)?s.selected:'north',runs:Number.isFinite(s.runs)?Math.max(0,s.runs):0}}catch{return {...defaults}}}
function save(){try{localStorage.setItem(KEY,JSON.stringify(state));return true}catch{notice='Браузер не дозволив зберегти прогрес. Перевір налаштування сховища.';return false}}
function esc(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function itemFor(zone){return catalog.find(c=>c.zone===zone.id)||catalog[0]}
function ownedItems(){return catalog.filter(c=>c.zone==='forge'?state.forged:state.found.includes(c.zone))}
function installNavigation(){
 const gamesGroup=document.querySelector('.sidebar .kozak-games-nav');
 const gamesButton=gamesGroup?.querySelector('[data-tab="games"]');
 if(!gamesGroup||!gamesButton||gamesGroup.querySelector('[data-tab="artifactforge"]'))return;
 const button=document.createElement('button');
 button.type='button';button.className='nav-item artifact-forge-nav';button.dataset.tab='artifactforge';
 button.title='Відкрити Artifact Forge — карта, секретні місії та кузня';
 button.innerHTML='<span aria-hidden="true">⬡</span><span class="nav-label">Artifact Forge</span>';
 button.addEventListener('click',()=>{document.querySelectorAll('.view').forEach(view=>view.classList.toggle('active',view.id==='tab-artifactforge'));document.querySelectorAll('[data-tab]').forEach(item=>item.classList.toggle('active',item.dataset.tab==='artifactforge'));window.scrollTo({top:0,behavior:'auto'});});
 gamesButton.insertAdjacentElement('afterend',button);
}
function render(){const found=state.found.length;
root.innerHTML=`
<div class="af-hero"><div class="af-kicker">KH么KOZAK · CLASSIFIED COLLECTION SYSTEM</div><h1>ARTIFACT <span>FORGE</span></h1><p>Досліджуй голографічну карту, знаходь реліквії, виконуй секретні операції та створюй унікальні предмети у Кузні. Прогрес зберігається на цьому пристрої.</p><div class="af-stats"><div class="af-stat"><small>ВІДКРИТО ВУЗЛІВ</small><b>${found}/${zones.length}</b></div><div class="af-stat"><small>КОЛЕКЦІЯ</small><b>${ownedItems().length}/7</b></div><div class="af-stat"><small>СЕКРЕТНІ ОПЕРАЦІЇ</small><b>${state.missions.length}/${zones.length}</b></div></div></div>
<div class="af-layout"><section class="af-panel"><div class="af-section-title"><h2>Голографічна карта</h2><small>SECTOR 07 · ACTIVE</small></div><div class="af-map" role="group" aria-label="Інтерактивна карта артефактів"><div class="af-map-head"><span>GRID 07 / NORTH</span><span>СИГНАЛ: ${found?'ВИЯВЛЕНО':'ПОШУК'}</span></div>${zones.map(z=>`<button type="button" class="af-node ${state.found.includes(z.id)?'is-found':''} ${selected.id===z.id?'is-selected':''}" style="left:${z.x}%;top:${z.y}%" data-zone="${z.id}" aria-label="${esc(z.name)}${state.found.includes(z.id)?', знайдено':''}" title="${esc(z.name)}">${state.found.includes(z.id)?'✓':z.icon}<small>${esc(z.name.split(' ').slice(0,2).join(' '))}</small></button>`).join('')}<div class="af-map-foot"><span>КООРДИНАТИ ЗАШИФРОВАНІ</span><span>6 ВУЗЛІВ</span></div></div><div class="af-selected"><div class="af-label">ВИБРАНИЙ ВУЗОЛ</div><h3>${esc(selected.name)}</h3><p>${esc(selected.desc)}</p><div class="af-label">МОЖЛИВА ЗНАХІДКА</div><p>${itemFor(selected).emoji} ${esc(itemFor(selected).name)} · ${esc(itemFor(selected).kind)}</p><button type="button" class="af-btn primary" data-action="explore" ${state.found.includes(selected.id)?'disabled':''}>${state.found.includes(selected.id)?'ВУЗОЛ ДОСЛІДЖЕНО':'ДОСЛІДИТИ ВУЗОЛ'}</button><p class="af-notice" role="status" aria-live="polite">${esc(notice)}</p></div></section>
<aside><section class="af-panel"><div class="af-section-title"><h2>Секретні операції</h2><small>${state.missions.length}/6</small></div>${zones.map(z=>`<article class="af-mission"><div class="af-label">${state.missions.includes(z.id)?'ОПЕРАЦІЮ ЗАВЕРШЕНО':'ЗАСЕКРЕЧЕНО'}</div><h3>${esc(z.mission)}</h3><p>${esc(z.missionDesc)}</p><button type="button" class="af-btn" data-mission="${z.id}" ${!state.found.includes(z.id)||state.missions.includes(z.id)?'disabled':''}>${state.missions.includes(z.id)?'✓ Виконано':state.found.includes(z.id)?'ЗАБРАТИ НАГОРОДУ':'Спершу досліди вузол'}</button></article>`).join('')}</section></aside></div>
<div class="af-two-col"><section class="af-panel"><div class="af-section-title"><h2>Колекція</h2><small>ЗНАЙДЕНІ ПРЕДМЕТИ</small></div><div class="af-grid">${catalog.map(c=>{const have=c.zone==='forge'?state.forged:state.found.includes(c.zone);return `<article class="af-item ${have?'':'is-locked'}"><div class="af-icon">${have?c.emoji:'🔒'}</div><b>${have?esc(c.name):'Засекречений предмет'}</b><small>${have?esc(c.kind+' · '+c.desc):'Досліди відповідний вузол на карті.'}</small></article>`}).join('')}</div></section>
<section class="af-panel"><div class="af-section-title"><h2>Кузня артефактів</h2><small>FORGE / 01</small></div><p>Об’єднай три знайдені компоненти, щоб створити реліквію «Пульс».</p><div class="af-ingredients"><span class="af-chip ${state.found.includes('north')?'is-ready':''}">${state.found.includes('north')?'✓':'○'} Крижаний уламок</span><span class="af-chip ${state.found.includes('vault')?'is-ready':''}">${state.found.includes('vault')?'✓':'○'} Серцевина</span><span class="af-chip ${state.found.includes('foundry')?'is-ready':''}">${state.found.includes('foundry')?'✓':'○'} Креслення кузні</span></div><button type="button" class="af-btn primary" data-action="forge" ${state.forged||!['north','vault','foundry'].every(id=>state.found.includes(id))?'disabled':''}>${state.forged?'РЕЛІКВІЮ СТВОРЕНО':'СТВОРИТИ РЕЛІКВІЮ'}</button><p class="af-notice" role="status">${state.forged?'Реліквія «Пульс» додана до колекції.':"Потрібні три вузли: Північ, Сховище та Кузня."}</p><button type="button" class="af-btn" data-action="reset" style="margin-top:12px">Скинути лише прогрес Artifact Forge</button></section></div>`;
}
root.addEventListener('click',e=>{const node=e.target.closest('[data-zone]');if(node){selected=zones.find(z=>z.id===node.dataset.zone)||zones[0];state.selected=selected.id;notice=state.found.includes(selected.id)?'Цей вузол уже досліджено.':'Сигнал стабільний. Можна проводити розвідку.';save();render();return}
const mission=e.target.closest('[data-mission]');if(mission){const id=mission.dataset.mission;if(!state.found.includes(id)||state.missions.includes(id))return;state.missions.push(id);state.runs++;notice='Секретну операцію завершено. Прогрес місії збережено.';save();render();return}
const action=e.target.closest('[data-action]')?.dataset.action;if(action==='explore'){if(state.found.includes(selected.id))return;state.found.push(selected.id);notice='Знахідку отримано: '+itemFor(selected).name+'.';save();render();return}
if(action==='forge'){if(state.forged||!['north','vault','foundry'].every(id=>state.found.includes(id)))return;state.forged=true;notice='Кузня створила реліквію «Пульс».';save();render();return}
if(action==='reset'&&confirm('Скинути лише прогрес Artifact Forge? Інші розділи не зміняться.')){state={...defaults};selected=zones[0];notice='Прогрес Artifact Forge скинуто.';save();render()}
});
installNavigation();
render();
})();