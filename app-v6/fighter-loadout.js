(()=>{'use strict';
const KEY='khkozak_fighter_kit_v1';
const kits=[
{id:'ranger',label:'Ranger',desc:'Польовий комплект',icon:'🪖',price:0,level:1},
{id:'heavy',label:'Heavy',desc:'Посилена броня',icon:'🛡️',price:350,level:2},
{id:'scavenger',label:'Scavenger',desc:'Спорядження пустки',icon:'🟤',price:500,level:3},
{id:'ghost',label:'Ghost',desc:'Холодний камуфляж',icon:'❄️',price:700,level:4}
];
const read=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch{return {}}};
const write=v=>{try{localStorage.setItem(KEY,JSON.stringify(v))}catch{}};
const bridge=()=>window.khkozakProgression?.snapshot?.()||{coins:0,xp:0,level:1};
function state(){const saved=read();let owned=Array.isArray(saved.owned)?saved.owned.filter(id=>kits.some(k=>k.id===id)):['ranger'];if(!owned.includes('ranger'))owned.unshift('ranger');if(saved.kit&&kits.some(k=>k.id===saved.kit)&&!owned.includes(saved.kit))owned.push(saved.kit);const kit=owned.includes(saved.kit)?saved.kit:'ranger';const p={...saved,kit,owned};write(p);return p}
function persist(next){write(next);window.dispatchEvent(new CustomEvent('khkozak-cosmetics-updated'))}
let busy=false;
function attach(){
 const slot=document.querySelector('#khReplicaFighterSlot'),panel=slot?.querySelector('.kh-fighter-customizer');
 if(!slot||!panel)return false;if(panel.dataset.kitStoreReady)return true;panel.dataset.kitStoreReady='1';
 const heading=document.createElement('strong');heading.className='kh-fighter-kit-title';heading.textContent='ТАКТИЧНИЙ АРСЕНАЛ';panel.appendChild(heading);
 const summary=document.createElement('div');summary.className='kh-fighter-kit-summary';summary.setAttribute('aria-live','polite');panel.appendChild(summary);
 const list=document.createElement('div');list.className='kh-fighter-kits';panel.appendChild(list);
 const status=document.createElement('div');status.className='kh-fighter-kit-status';status.setAttribute('aria-live','polite');panel.appendChild(status);
 function paint(){
  const s=state(),p=bridge(),coins=Number(p.coins)||0,level=Number(p.level)||1;slot.dataset.kit=s.kit;summary.textContent='◈ '+coins.toLocaleString('uk-UA')+' монет · LVL '+level;list.replaceChildren();
  kits.forEach(kit=>{
   const owned=s.owned.includes(kit.id),equipped=s.kit===kit.id;
   const card=document.createElement('article');card.className='kh-fighter-kit-card'+(equipped?' is-equipped':'');
   const info=document.createElement('div');info.className='kh-fighter-kit-info';
   const icon=document.createElement('span');icon.className='kh-fighter-kit-icon';icon.textContent=kit.icon;
   const copy=document.createElement('span');copy.className='kh-fighter-kit-copy';
   const name=document.createElement('b');name.textContent=kit.label;
   const desc=document.createElement('small');desc.textContent=kit.desc+' · LVL '+kit.level;
   copy.append(name,desc);info.append(icon,copy);
   const action=document.createElement('button');action.type='button';action.className='kh-fighter-kit-action';
   if(equipped){action.textContent='✓ ОБРАНО';action.disabled=true}
   else if(owned){action.textContent='ЕКІПІРУВАТИ';action.disabled=busy}
   else{action.textContent=kit.price+' ◈';action.disabled=busy||level<kit.level||coins<kit.price}
   action.addEventListener('click',e=>{
    e.stopPropagation();if(busy||equipped)return;
    const latest=state(),progress=bridge(),balance=Number(progress.coins)||0,currentLevel=Number(progress.level)||1;
    if(currentLevel<kit.level){status.textContent='Потрібен рівень '+kit.level+'.';return}
    if(!latest.owned.includes(kit.id)&&balance<kit.price){status.textContent='Не вистачає монет — зіграй у мініігри.';return}
    busy=true;status.textContent=latest.owned.includes(kit.id)?'Застосовую комплект…':'Відкриваю комплект…';paint();
    try{
     let ownedKits=[...new Set([...latest.owned,kit.id])];
     if(!latest.owned.includes(kit.id)){
      const spend=window.khkozakProgression?.spendCoins;
      if(typeof spend!=='function'||!spend(kit.price)){status.textContent='Не вдалося списати монети з профілю.';return}
     }
     persist({...latest,kit:kit.id,owned:ownedKits});status.textContent=latest.owned.includes(kit.id)?'Комплект екіпіровано.':'Комплект придбано та екіпіровано.';if(window.khkozakProgression?.refresh)window.khkozakProgression.refresh();
    }finally{busy=false;paint()}
   });
   card.append(info,action);list.appendChild(card);
  });
 }
 panel.addEventListener('pointerdown',e=>e.stopPropagation());panel.addEventListener('click',e=>e.stopPropagation());
 paint();document.addEventListener('khkozak-cosmetics-updated',paint);window.addEventListener('storage',e=>{if(e.key===KEY)paint()});return true;
}
function start(){if(attach())return;const observer=new MutationObserver(()=>{if(attach())observer.disconnect()});observer.observe(document.body,{childList:true,subtree:true})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();