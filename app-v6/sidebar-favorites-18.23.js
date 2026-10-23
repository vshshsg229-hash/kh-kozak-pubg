/* KOZAK NEXUS v18.23.0 — additive module; does not replace the existing sidebar module */
(()=>{'use strict';
const side=document.querySelector('.sidebar'),nav=side?.querySelector('.nav');
if(!side||!nav||document.getElementById('nexusRadar'))return;
const getTab=id=>nav.querySelector('.nav-item[data-tab="'+id+'"]');
const getLabel=b=>b?.querySelector('.nav-label')?.textContent?.trim()||b?.textContent?.trim()||'Розділ';
const node=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e};
const section=(id,label)=>{const s=node('section');s.id=id;s.setAttribute('aria-label',label);return s};
const title=(left,right)=>{const h=node('div','nx23-title');h.append(node('span','',left),node('span','nx23-live',''));h.lastChild.append(node('i','nx23-dot'));h.lastChild.append(document.createTextNode(' '+right));return h};
const radar=section('nexusRadar','NEXUS Radar');radar.append(title('◉ NEXUS RADAR','SYSTEM READY'));
const layout=node('div','nx23-radar-layout'),circle=node('div','nx23-radar'),center=node('div','nx23-radar-center','NX');circle.append(center);
const data=node('div','nx23-radar-data'),current=node('div'),currentLabel=node('span','nx23-data-label','ПОТОЧНИЙ РОЗДІЛ'),currentValue=node('b','nx23-data-value','Головна');currentValue.id='nx23Current';current.append(currentLabel,currentValue);
const status=node('div'),statusLabel=node('span','nx23-data-label','СТАН'),statusValue=node('b','nx23-data-value','ГОТОВИЙ ДО ГРИ');statusValue.id='nx23Status';status.append(statusLabel,statusValue);data.append(current,status);layout.append(circle,data);radar.append(layout);
const quickBox=section('nexusQuickLaunch','Швидкий запуск');quickBox.append(title('⚡ QUICK LAUNCH','5 СЛОТІВ'));const quickGrid=node('div','nx23-quick-grid');quickGrid.id='nx23QuickGrid';quickBox.append(quickGrid,node('div','nx23-line'));const edit=node('button','nxt-compact','⚙ НАЛАШТУВАТИ ШВИДКИЙ ЗАПУСК');edit.type='button';edit.style.width='100%';quickBox.append(edit);
const missions=section('nexusMissionBrief','Центр завдань'),mhead=node('div','nx23-man-head'),mTitle=node('span','nx23-title','▤ ЦЕНТР ЗАВДАНЬ'),mCount=node('b','nx23-mission-count','0 / 3');mTitle.style.margin='0';mCount.id='nx23MissionCount';mhead.append(mTitle,mCount);
const track=node('div','nx23-mission-track'),bar=node('i');bar.id='nx23MissionBar';track.append(bar);
const caption=node('div','nx23-mission-caption'),captionLeft=node('span','','ЩОДЕННІ МІСІЇ'),captionRight=node('span','','0% виконано');captionRight.id='nx23MissionPct';caption.append(captionLeft,captionRight);
const note=node('div','nx23-mission-note','Статус оновлюється з даних профілю.');note.id='nx23MissionNote';const openM=node('button','nx23-mission-open','ВІДКРИТИ ЗАВДАННЯ ↗');openM.type='button';missions.append(mhead,track,caption,note,openM);
const anchor=document.getElementById('nexusFavorites')||document.getElementById('nexusSidebarTools');
if(anchor){anchor.after(radar);radar.after(quickBox);quickBox.after(missions)}else nav.prepend(missions,quickBox,radar);
const QUICK='kozakNexus.sidebarQuickLaunch.v1';const readQuick=()=>{try{const x=JSON.parse(localStorage.getItem(QUICK)||'null');return Array.isArray(x)?x:['games','missions','pass','arsenal','profile']}catch(_){return ['games','missions','pass','arsenal','profile']}};
let quick=readQuick();
const saveQuick=()=>{try{localStorage.setItem(QUICK,JSON.stringify(quick))}catch(_){}};
function renderQuick(){const all=[...nav.querySelectorAll('.nav-item[data-tab]')];quick=quick.filter((id,i,a)=>a.indexOf(id)===i&&all.some(b=>b.dataset.tab===id)).slice(0,5);quickGrid.replaceChildren();quick.forEach(id=>{const b=getTab(id);if(!b)return;const q=node('button','nx23-quick'),ico=node('span','nx23-quick-icon',b.querySelector(':scope > span:first-child')?.textContent?.trim()||'›'),txt=node('span','nx23-quick-label',getLabel(b));q.type='button';q.title='Відкрити '+getLabel(b);q.append(ico,txt);q.addEventListener('click',()=>b.click());quickGrid.append(q)});if(!quick.length){const empty=node('div','nx23-quick-empty','Налаштуй до п’яти улюблених розділів для запуску одним натисканням.');quickGrid.append(empty)}}
function configureQuick(){const all=[...nav.querySelectorAll('.nav-item[data-tab]')],menu=all.map(b=>b.dataset.tab+' — '+getLabel(b)).join('\n'),chosen=prompt('Введи до 5 значень data-tab через кому. Доступні розділи:\n'+menu,quick.join(','));if(chosen===null)return;const valid=chosen.split(',').map(x=>x.trim()).filter((id,i,a)=>id&&a.indexOf(id)===i&&all.some(b=>b.dataset.tab===id)).slice(0,5);if(!valid.length){alert('Не знайдено дійсних розділів. Попередній швидкий запуск збережено.');return}quick=valid;saveQuick();renderQuick()}
function updateRadar(){const active=nav.querySelector('.nav-item.active,[aria-current="page"]');currentValue.textContent=active?getLabel(active):'Головна';statusValue.textContent=document.hidden?'У ФОНОВОМУ РЕЖИМІ':'ГОТОВИЙ ДО ГРИ'}
function updateMissions(){const el=document.getElementById('profileDailyMissions'),raw=el?.textContent?.trim()||'0 / 3',nums=raw.match(/\d+/g)||['0','3'],done=Number(nums[0])||0,total=Number(nums[1])||3,pct=total?Math.max(0,Math.min(100,done/total*100)):0;mCount.textContent=raw;bar.style.width=pct+'%';captionRight.textContent=Math.round(pct)+'% виконано';note.textContent=done>=total&&total>0?'Усі щоденні місії виконано. Чудова робота!':'Виконано '+done+' із '+total+' щоденних місій. Відкрий розділ, щоб продовжити.'}
edit.addEventListener('click',configureQuick);openM.addEventListener('click',()=>getTab('missions')?.click());renderQuick();updateRadar();updateMissions();
nav.addEventListener('click',e=>{if(e.target.closest('.nav-item'))setTimeout(updateRadar,0)});
document.addEventListener('visibilitychange',updateRadar);
const observer=new MutationObserver(()=>{updateMissions();renderQuick();updateRadar()});observer.observe(nav,{childList:true,subtree:false});const missionEl=document.getElementById('profileDailyMissions');if(missionEl)new MutationObserver(updateMissions).observe(missionEl,{subtree:true,childList:true,characterData:true,attributes:true});
})();