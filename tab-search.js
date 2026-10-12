(()=>{'use strict';
const toggle=document.getElementById('tab-search-toggle');
const panel=document.getElementById('tab-search-panel');
const input=document.getElementById('tab-search-input');
const results=document.getElementById('tab-search-results');
if(!toggle||!panel||!input||!results)return;
const tabs=[
 {name:'Головна',icon:'⌂',url:'index.html',keys:'home головна'},
 {name:'Відео та кліпи',icon:'▶',url:'videos.html',keys:'відео кліпи ролики'},
 {name:'Аватарки',icon:'▧',url:'avatars.html',keys:'аватарки фото картинки'},
 {name:'Мініігри',icon:'🎮',url:'minigames.html',keys:'мініігри ігри гра тир реакція'},
 {name:'Гардероб',icon:'👕',url:'locker.html',keys:'гардероб одяг скіни речі магазин'},
  {name:'Музика · KH Radio',icon:'🎵',url:'music.html',keys:'музика пісні плейлист радіо radio'}
];
function render(){
 const q=input.value.trim().toLocaleLowerCase('uk');
 const found=tabs.filter(t=>(t.name+' '+t.keys).toLocaleLowerCase('uk').includes(q));
 results.replaceChildren();
 if(!found.length){const empty=document.createElement('div');empty.className='tab-search-empty';empty.textContent='Нічого не знайдено. Спробуй інше слово.';results.append(empty);return;}
 found.forEach(t=>{const a=document.createElement('a');a.className='tab-search-result';a.href=t.url;a.setAttribute('role','option');const icon=document.createElement('span');icon.textContent=t.icon;const label=document.createElement('span');label.textContent=t.name;a.append(icon,label);results.append(a);});
}
function open(){panel.hidden=false;toggle.setAttribute('aria-expanded','true');render();input.focus();}
function close(){panel.hidden=true;toggle.setAttribute('aria-expanded','false');toggle.focus();}
toggle.setAttribute('aria-expanded','false');
toggle.addEventListener('click',()=>panel.hidden?open():close());
input.addEventListener('input',render);
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!panel.hidden)close();if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();if(panel.hidden)open();else input.focus();}});
document.addEventListener('click',e=>{if(!panel.hidden&&!panel.contains(e.target)&&!toggle.contains(e.target)){panel.hidden=true;toggle.setAttribute('aria-expanded','false');}});
render();
})();