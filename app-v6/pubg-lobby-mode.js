(()=>{'use strict';
const root=document.getElementById('khLobbyMode');if(!root)return;
const STORE='khkozak_lobby_emotes_v1';const character=root.querySelector('#khlobbyCharacter');const toast=root.querySelector('#khlobbyEmoteToast');const label=root.querySelector('#khlobbyCurrentEmote');let toastTimer=0;
const emotes={wave:{name:'Привітання',icon:'👋',className:'emote-wave'},dance:{name:'Танець',icon:'💃',className:'emote-dance'},victory:{name:'Перемога',icon:'🏆',className:'emote-victory'},salute:{name:'Салют',icon:'🫡',className:'emote-salute'},heart:{name:'Серце',icon:'🫶',className:'emote-heart'},bow:{name:'Поклін',icon:'🙇',className:'emote-bow'}};
let state={emote:'wave',rotation:0,scene:'spring'};
try{state={...state,...JSON.parse(localStorage.getItem(STORE)||'{}')}}catch{}
function persist(){try{localStorage.setItem(STORE,JSON.stringify(state))}catch{}}
function play(id){const e=emotes[id]||emotes.wave;state.emote=id;Object.values(emotes).forEach(x=>character.classList.remove(x.className));void character.offsetWidth;character.classList.add(e.className);root.querySelectorAll('[data-khl-emote]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.khlEmote===id)));if(label)label.textContent=e.name;if(toast){toast.textContent=e.icon+' '+e.name.toUpperCase();toast.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.classList.remove('show'),1800)}persist()}
root.querySelectorAll('[data-khl-emote]').forEach(b=>b.addEventListener('click',()=>play(b.dataset.khlEmote)));
root.querySelectorAll('[data-khl-rotate]').forEach(b=>b.addEventListener('click',()=>{state.rotation=(state.rotation+(Number(b.dataset.khlRotate)||0)+360)%360;character.style.filter='drop-shadow(0 12px 12px #0007) hue-rotate('+state.rotation+'deg)';root.querySelectorAll('[data-khl-rotate]').forEach(x=>x.classList.toggle('active',x===b));persist()}));
root.querySelectorAll('[data-khl-scene]').forEach(b=>b.addEventListener('click',()=>{state.scene=b.dataset.khlScene;root.querySelectorAll('[data-khl-scene]').forEach(x=>x.classList.toggle('active',x===b));root.querySelector('.khlobby-scene')?.setAttribute('data-scene',state.scene);persist()}));
const reset=root.querySelector('[data-khl-reset]');reset?.addEventListener('click',()=>{state.rotation=0;character.style.filter='';play('wave');root.querySelectorAll('[data-khl-rotate]').forEach(x=>x.classList.remove('active'))});
root.querySelector('[data-khl-start]')?.addEventListener('click',()=>{const target=document.querySelector('[data-tab="games"]');target?.click();});
root.querySelector('[data-khl-wheel]')?.addEventListener('click',()=>{const panel=root.querySelector('.khlobby-emo-panel');panel?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});panel?.querySelector('[data-khl-emote]')?.focus({preventScroll:true})});
root.querySelectorAll('[data-khl-nav]').forEach(b=>b.addEventListener('click',()=>{root.querySelectorAll('[data-khl-nav]').forEach(x=>x.classList.toggle('active',x===b));const id=b.dataset.khlNav;if(id==='emotes')root.querySelector('.khlobby-emo-panel')?.scrollIntoView({behavior:'smooth',block:'start'});else if(id==='character')play(state.emote);else if(id==='car')root.querySelector('.khlobby-car')?.classList.toggle('khlobby-car-highlight')}));
root.querySelector('.khlobby-scene')?.addEventListener('click',e=>{if(e.target.closest('button'))return;const box=root.querySelector('.khlobby-character');if(!box)return;play(state.emote)});
root.querySelector('.khlobby-scene')?.setAttribute('data-scene',state.scene);
root.querySelectorAll('[data-khl-scene]').forEach(x=>x.classList.toggle('active',x.dataset.khlScene===state.scene));
play(state.emote);
})();