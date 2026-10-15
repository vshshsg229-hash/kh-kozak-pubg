(()=>{'use strict';
const KEY='khkozak_fighter_kit_v1';
const TOKEN_KEY='khkozak_online_token_v1';
const API=document.querySelector('meta[name="kh-api-base"]')?.content||'https://khkozak-battle-hub-api-uftt.onrender.com';
const kits=[
{id:'ranger',label:'Ranger',desc:'Польовий комплект',icon:'🪖',price:0,level:1},
{id:'heavy',label:'Heavy',desc:'Посилена броня',icon:'🛡️',price:350,level:2},
{id:'scavenger',label:'Scavenger',desc:'Спорядження пустки',icon:'🟤',price:500,level:3},
{id:'ghost',label:'Ghost',desc:'Холодний камуфляж',icon:'❄️',price:700,level:4}
];
const read=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch{return {}}};
const write=v=>{try{localStorage.setItem(KEY,JSON.stringify(v))}catch{}};
const token=()=>{try{return localStorage.getItem(TOKEN_KEY)||''}catch{return ''}};
const bridge=()=>window.khkozakProgression?.snapshot?.()||{coins:0,xp:0,level:1,online:!!token()};
let remote=null,remoteError='',busy=false;
const api=async(path,body)=>{const t=token();if(!t)throw new Error('Увійди в онлайн-акаунт ще раз.');const response=await fetch(API+path,{method:body?'POST':'GET',headers:{'Content-Type':'application/json',Authorization:'Bearer '+t},body:body?JSON.stringify(body):undefined});const data=await response.json().catch(()=>({}));if(!response.ok)throw new Error(data.error||'Не вдалося зв’язатися із сервером.');return data};
function localState(){
 const saved=read();let owned=Array.isArray(saved.owned)?saved.owned.filter(id=>kits.some(k=>k.id===id)):['ranger'];
 if(!owned.includes('ranger'))owned.unshift('ranger');
 // Keep a kit selected before the store update, so existing players do not lose their current look.
 if(!Array.isArray(saved.owned&&saved.owned)&&kits.some(k=>k.id===saved.kit)&&!owned.includes(saved.kit))owned.push(saved.kit);
 let kit=owned.includes(saved.kit)?saved.kit:'ranger';
 const next={...saved,kit,owned};write(next);return next;
}
function current(){
 if(remote)return {kit:remote.equipped||'ranger',owned:Array.isArray(remote.owned)?remote.owned:['ranger'],coins:Number(remote.coins)||0,level:Number(remote.level)||1,online:true};
 const p=bridge(),s=localState();return {...s,coins:Number(p.coins)||0,level:Number(p.level)||1,online:false};
}
function persistKit(id){const s=read();write({...s,kit:id,owned:Array.isArray(s.owned)?s.owned:['ranger']})}
function attach(){
 const slot=document.querySelector('#khReplicaFighterSlot'),panel=slot?.querySelector('.kh-fighter-customizer');
 if(!slot||!panel)return false;
 if(panel.dataset.kitStoreReady)return true;
 panel.dataset.kitStoreReady='1';
 const heading=document.createElement('strong');heading.className='kh-fighter-kit-title';heading.textContent='ТАКТИЧНИЙ АРСЕНАЛ';panel.appendChild(heading);
 const summary=document.createElement('div');summary.className='kh-fighter-kit-summary';summary.setAttribute('aria-live','polite');panel.appendChild(summary);
 const list=document.createElement('div');list.className='kh-fighter-kits';panel.appendChild(list);
 const status=document.createElement('div');status.className='kh-fighter-kit-status';status.setAttribute('aria-live','polite');panel.appendChild(status);
 function paint(){
  const s=current();slot.dataset.kit=s.kit;summary.textContent='◈ '+s.coins.toLocaleString('uk-UA')+' монет  ·  LVL '+s.level+(s.online?' · ONLINE':' · ЛОКАЛЬНО');
  list.innerHTML='';
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
   else if(owned){action.textContent='ЕКІПІРУВАТИ';action.disabled=busy||!!remoteError}
   else{action.textContent=kit.price+' ◈';action.disabled=busy||!!remoteError||s.level<kit.level||s.coins<kit.price}
   action.addEventListener('click',async e=>{
    e.stopPropagation();if(busy||equipped)return;
    if(s.online&&!token()){status.textContent='Сесія завершилась — увійди знову.';return}
    busy=true;status.textContent=owned?'Застосовую комплект…':'Перевіряю рівень і баланс…';paint();
    try{
     if(s.online){
      const result=await api('/api/fighter-kits',{action:owned?'equip':'buy',kit:kit.id});
      remote={coins:result.coins,level:result.level,owned:result.owned,equipped:result.equipped};remoteError='';
      persistKit(result.equipped);
      if(window.khkozakProgression?.refresh)window.khkozakProgression.refresh();
      status.textContent=owned?'Комплект екіпіровано та збережено в акаунті.':'Комплект придбано: −'+kit.price+' монет. Прогрес збережено в акаунті.';
     }else if(owned){
      persistKit(kit.id);status.textContent='Комплект екіпіровано на цьому пристрої.';
     }else{
      if(s.level<kit.level){status.textContent='Потрібен рівень '+kit.level+'.';return}
      if(s.coins<kit.price){status.textContent='Не вистачає монет — зіграй у мініігри.';return}
      const spend=window.khkozakProgression?.spendCoins;
      if(typeof spend!=='function'||!spend(kit.price)){status.textContent='Не вдалося списати монети з профілю.';return}
      const saved=localState();const ownedKits=[...new Set([...saved.owned,kit.id])];write({...saved,kit:kit.id,owned:ownedKits});
      status.textContent='Комплект придбано: −'+kit.price+' монет. Збережено на цьому пристрої.';
     }
    }catch(err){remoteError=s.online?(err.message||'Сервер комплектів тимчасово недоступний.'):'';status.textContent=err.message||'Не вдалося виконати дію.'}
    finally{busy=false;paint()}
   });
   card.append(info,action);list.appendChild(card);
  });
 }
 async function load(){
  if(token()){
   remoteError='Завантажую онлайн-арсенал…';status.textContent=remoteError;paint();
   try{remote=await api('/api/fighter-kits');remoteError='';status.textContent='Онлайн-арсенал синхронізовано між пристроями.'}
   catch(err){remote=null;remoteError=err.message||'Сервер комплектів недоступний.';status.textContent=remoteError}
  }else{remote=null;remoteError='';status.textContent='Покупки зберігаються на цьому пристрої. Увійди в акаунт для синхронізації між ПК і телефоном.'}
  paint();
 }
 panel.addEventListener('pointerdown',e=>e.stopPropagation());
 panel.addEventListener('click',e=>e.stopPropagation());
 paint();load();
 document.addEventListener('khkozak-cosmetics-updated',()=>{if(token())load();else paint()});
 window.addEventListener('storage',e=>{if(e.key===TOKEN_KEY||e.key===KEY){remote=null;load()}});
 return true;
}
function start(){if(attach())return;const observer=new MutationObserver(()=>{if(attach())observer.disconnect()});observer.observe(document.body,{childList:true,subtree:true});}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();