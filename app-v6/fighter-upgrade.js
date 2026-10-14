(()=>{'use strict';
const KEY='khkozak_fighter_look_v1';
const looks=[{id:'standard',label:'Польова форма',icon:'🪖'},{id:'shadow',label:'Тінь',icon:'🌑'},{id:'arctic',label:'Арктика',icon:'❄️'},{id:'elite',label:'Елітний',icon:'⭐'}];
const read=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch{return {}}};
const write=v=>{try{localStorage.setItem(KEY,JSON.stringify(v))}catch{}};
function mount(){
 const slot=document.querySelector('#khReplicaFighterSlot');
 if(!slot||!slot.querySelector('.kh-real-soldier'))return false;
 let panel=slot.querySelector('.kh-fighter-customizer');
 if(!panel){
  panel=document.createElement('div');panel.className='kh-fighter-customizer';panel.setAttribute('aria-label','Налаштування зовнішності бійця');
  panel.innerHTML='<strong>ЗОВНІШНІСТЬ БІЙЦЯ</strong><div class="kh-fighter-looks"></div><button type="button" class="kh-motion-toggle" aria-pressed="true">✦ Анімація: УВІМК.</button>';
  slot.appendChild(panel);
  const list=panel.querySelector('.kh-fighter-looks');
  looks.forEach(look=>{const b=document.createElement('button');b.type='button';b.dataset.look=look.id;b.textContent=look.icon+' '+look.label;b.addEventListener('click',()=>{slot.dataset.look=look.id;const s=read();s.look=look.id;write(s);sync();document.dispatchEvent(new CustomEvent('khkozak-cosmetics-updated',{detail:{look:look.id}}))});list.appendChild(b)});
  panel.querySelector('.kh-motion-toggle').addEventListener('click',e=>{const enabled=slot.dataset.motion==='off';slot.dataset.motion=enabled?'on':'off';const s=read();s.motion=enabled;write(s);sync()});
  panel.addEventListener('pointerdown',e=>e.stopPropagation());
  panel.addEventListener('click',e=>e.stopPropagation());
 }
 const saved=read();slot.dataset.look=looks.some(x=>x.id===saved.look)?saved.look:'standard';slot.dataset.motion=saved.motion===false?'off':'on';
 function sync(){panel.querySelectorAll('[data-look]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.look===slot.dataset.look)));const b=panel.querySelector('.kh-motion-toggle');const on=slot.dataset.motion!=='off';b.setAttribute('aria-pressed',String(on));b.textContent=on?'✦ Анімація: УВІМК.':'✦ Анімація: ВИМК.'}
 sync();return true;
}
function start(){if(mount())return;const observer=new MutationObserver(()=>{if(mount())observer.disconnect()});observer.observe(document.body,{childList:true,subtree:true});}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();