(()=>{'use strict';
const button=document.getElementById('desktopCommandButton');
const backdrop=document.getElementById('desktopCommandBackdrop');
const input=document.getElementById('desktopCommandInput');
const list=document.getElementById('desktopCommandList');
if(!button||!backdrop||!input||!list)return;
const commands=[
 ['home','Головна','Стартова панель, статистика та щоденний бонус','⌂'],
 ['games','Ігри та режими','Каталог мініігор та аркада','▣'],
 ['3d','3D Арена','Окремі масштабні 3D-ігри','◈'],
 ['bunker','Бункер','База, покращення та трофеї','⌂'],
 ['missions','Місії та завдання','Щоденні завдання й бонуси','◈'],
 ['events','Події хабу','Події та календар','🏆'],
 ['arsenal','Арсенал і тактика','Loadout-и та тактичні нотатки','🎯'],
 ['fun','Приколи та рандом','Челенджі й генератори','🎲'],
 ['music','Музика','Музичний плеєр','♫'],
 ['tiktok','Мої відео TikTok','Відео та соціальні посилання','♪'],
 ['rewards','Магазин нагород','Предмети, рамки й титули','✦'],
 ['community','Спільнота','Гравці та спілкування','♧'],
 ['profile','Мій профіль','Статистика та налаштування профілю','◉'],
 ['pass','Royale Pass','Сезонний прогрес і нагороди','⬆'],
 ['telegram','Telegram і бот','Прив’язка та налаштування Telegram','➤'],
 ['admin','Адмін-панель','Керування хабом','⚙'],
 ['assistant','Напарник KH','Підказки та допомога','✧']
];
let visible=[],active=0,lastFocus=null;
const isDesktop=()=>window.matchMedia('(min-width: 1024px)').matches;
function render(){
 const q=input.value.trim().toLocaleLowerCase('uk');
 visible=commands.filter(c=>(c[1]+' '+c[2]+' '+c[0]).toLocaleLowerCase('uk').includes(q))
  .filter(c=>c[0]!=='admin'||!document.querySelector('[data-tab="admin"]')?.hidden);
 if(active>=visible.length)active=Math.max(0,visible.length-1);
 list.replaceChildren();
 if(!visible.length){const empty=document.createElement('div');empty.className='desktop-command-empty';empty.textContent='Нічого не знайдено. Спробуй інший запит.';list.append(empty);return}
 visible.forEach((c,i)=>{
  const item=document.createElement('button');item.type='button';item.className='desktop-command-item';item.setAttribute('role','option');item.setAttribute('aria-selected',String(i===active));
  const icon=document.createElement('span');icon.className='desktop-command-icon';icon.textContent=c[3];
  const copy=document.createElement('span');copy.className='desktop-command-copy';
  const title=document.createElement('strong');title.textContent=c[1];const desc=document.createElement('small');desc.textContent=c[2];copy.append(title,desc);
  const enter=document.createElement('kbd');enter.className='desktop-command-enter';enter.textContent='↵';item.append(icon,copy,enter);
  item.addEventListener('mouseenter',()=>{active=i;syncActive()});
  item.addEventListener('click',()=>go(c[0]));list.append(item);
 });
}
function syncActive(){[...list.querySelectorAll('[role="option"]')].forEach((el,i)=>el.setAttribute('aria-selected',String(i===active)));list.querySelector('[aria-selected="true"]')?.scrollIntoView({block:'nearest'});}
function open(){if(!isDesktop())return;lastFocus=document.activeElement;backdrop.hidden=false;input.value='';active=0;render();requestAnimationFrame(()=>input.focus());}
function close(){backdrop.hidden=true;if(lastFocus&&typeof lastFocus.focus==='function')lastFocus.focus();}
function go(tab){const target=document.querySelector('.sidebar [data-tab="'+tab+'"]:not([hidden])')||document.querySelector('[data-tab="'+tab+'"]:not([hidden])');if(target){target.click();close();}}
button.addEventListener('click',open);
backdrop.addEventListener('click',e=>{if(e.target===backdrop)close()});
input.addEventListener('input',()=>{active=0;render()});
input.addEventListener('keydown',e=>{
 if(e.key==='ArrowDown'){e.preventDefault();active=Math.min(visible.length-1,active+1);syncActive()}
 else if(e.key==='ArrowUp'){e.preventDefault();active=Math.max(0,active-1);syncActive()}
 else if(e.key==='Enter'){e.preventDefault();if(visible[active])go(visible[active][0])}
 else if(e.key==='Escape'){e.preventDefault();close()}
});
document.addEventListener('keydown',e=>{
 if(e.key==='Escape'&&!backdrop.hidden){close();return}
 if(!isDesktop()||e.defaultPrevented||e.altKey||e.metaKey)return;
 if((e.ctrlKey||e.shiftKey&&e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();backdrop.hidden?open():close();return}
 if(!e.ctrlKey&&!e.metaKey&&!e.shiftKey&&!e.altKey&&e.key==='/'){
  const el=e.target;if(el&&(/INPUT|TEXTAREA|SELECT/.test(el.tagName)||el.isContentEditable))return;
  e.preventDefault();open();
 }
});
window.matchMedia('(max-width: 1023px)').addEventListener('change',e=>{if(e.matches)close()});
})();
