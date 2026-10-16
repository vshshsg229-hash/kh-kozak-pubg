(()=>{'use strict';
const KEY='khkozak_event_plan_v1';
const read=()=>{try{const v=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(v)?v:[]}catch{return []}};
const save=v=>{try{localStorage.setItem(KEY,JSON.stringify(v))}catch{}};
function render(){const chosen=read();document.querySelectorAll('[data-event-join]').forEach(b=>{const yes=chosen.includes(b.dataset.eventJoin);b.classList.toggle('joined',yes);b.textContent=yes?'✓ У МОЄМУ ПЛАНІ':'ДОДАТИ В ПЛАН';b.closest('.event-card')?.classList.toggle('is-joined',yes)});const c=document.getElementById('eventJoinedCount');if(c)c.textContent=chosen.length+' У ПЛАНІ'}
document.addEventListener('click',e=>{const join=e.target.closest('[data-event-join]');if(join){const id=join.dataset.eventJoin,chosen=read();save(chosen.includes(id)?chosen.filter(x=>x!==id):[...chosen,id]);render();return}const game=e.target.closest('[data-event-game]');if(game){const target=game.dataset.eventGame;if(target==='arcade'){document.querySelector('[data-tab="games"]')?.click();return}if(target==='survival'){document.querySelector('[data-tab="survival"]')?.click();return}const opener=document.querySelector('[data-game="'+target+'"]');if(opener){opener.click();return}document.querySelector('[data-tab="games"]')?.click()}});
render();
})();