(()=>{'use strict';
const KEY='khkozak_fighter_kit_v1';
const kits=[
{id:'ranger',label:'Ranger · базовий',icon:'🪖'},
{id:'heavy',label:'Heavy · броня',icon:'🛡️'},
{id:'ghost',label:'Ghost · холод',icon:'❄️'},
{id:'scavenger',label:'Scavenger · пустка',icon:'🟤'}
];
const read=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch{return {}}};
const save=id=>{try{localStorage.setItem(KEY,JSON.stringify({kit:id}))}catch{}};
function attach(){
 const slot=document.querySelector('#khReplicaFighterSlot'),panel=slot?.querySelector('.kh-fighter-customizer');
 if(!slot||!panel||panel.dataset.kitReady)return false;
 panel.dataset.kitReady='1';
 const heading=document.createElement('strong');heading.className='kh-fighter-kit-title';heading.textContent='ТАКТИЧНИЙ КОМПЛЕКТ';panel.appendChild(heading);
 const list=document.createElement('div');list.className='kh-fighter-kits';panel.appendChild(list);
 const status=document.createElement('div');status.className='kh-fighter-kit-status';status.setAttribute('aria-live','polite');panel.appendChild(status);
 function choose(id){const kit=kits.find(k=>k.id===id)||kits[0];slot.dataset.kit=kit.id;save(kit.id);list.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.kit===kit.id)));status.textContent='Обрано: '+kit.label;document.dispatchEvent(new CustomEvent('khkozak-loadout-updated',{detail:{kit:kit.id}}))}
 kits.forEach(kit=>{const b=document.createElement('button');b.type='button';b.dataset.kit=kit.id;b.textContent=kit.icon+' '+kit.label;b.addEventListener('click',e=>{e.stopPropagation();choose(kit.id)});list.appendChild(b)});
 choose(read().kit||'ranger');
 panel.addEventListener('pointerdown',e=>e.stopPropagation());
 return true;
}
function start(){if(attach())return;const observer=new MutationObserver(()=>{if(attach())observer.disconnect()});observer.observe(document.body,{childList:true,subtree:true});}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();