(()=>{'use strict';
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const views={home:['#kh-app-dashboard'],arena:['#victor-game'],modes:['#kh-app-modes-panel'],games:['.mode-select','.game-grid','.arcade-plus'],gifts:['#rewards']};
function setTab(name){Object.entries(views).forEach(([key,selectors])=>selectors.forEach(sel=>{const el=$(sel);if(el)el.classList.toggle('kh-app-hidden',key!==name)}));$$('[data-app-tab]').forEach(b=>{const active=b.dataset.appTab===name;b.classList.toggle('active',active);b.setAttribute('aria-current',active?'page':'false')});document.body.dataset.appView=name;window.scrollTo({top:0,behavior:'smooth'});if(name==='arena')window.dispatchEvent(new Event('resize'));}
$$('[data-app-tab]').forEach(b=>b.addEventListener('click',()=>setTab(b.dataset.appTab)));
$$('[data-app-go]').forEach(b=>b.addEventListener('click',()=>setTab(b.dataset.appGo)));
const modeSwitch=$('.victor-game-head .vg-mode-switch'),slot=$('#kh-app-mode-slot');if(modeSwitch&&slot)slot.appendChild(modeSwitch);
const loadout=$('.vg-loadout'),bottomActions=$('.vg-bottom-actions');if(loadout&&bottomActions)bottomActions.insertAdjacentElement('afterend',loadout);
$$('[data-vg-mode]').forEach(b=>b.addEventListener('click',()=>{setTimeout(()=>setTab('arena'),120)}));
function refreshHomeCoins(){const src=$('#reward-coins'),out=$('#kh-home-coins');if(src&&out)out.textContent=src.textContent;}
refreshHomeCoins();window.addEventListener('khkozak:rewards-updated',refreshHomeCoins);const rewardObserver=$('#reward-coins');if(rewardObserver&&'MutationObserver'in window)new MutationObserver(refreshHomeCoins).observe(rewardObserver,{childList:true,characterData:true,subtree:true});
let installPrompt=null;const installBtn=$('#kh-install-btn');
window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();installPrompt=event;if(installBtn)installBtn.textContent='⬇ Встановити застосунок'});
installBtn?.addEventListener('click',async()=>{if(installPrompt){installPrompt.prompt();try{const choice=await installPrompt.userChoice;installBtn.textContent=choice.outcome==='accepted'?'✓ Встановлено':'⬇ Встановити';}catch{}installPrompt=null;return;}if(window.matchMedia('(display-mode: standalone)').matches){installBtn.textContent='✓ Застосунок встановлено';return;}alert('Щоб встановити KH Kozak: відкрий меню браузера ⋮ і вибери «Додати на головний екран» або «Встановити застосунок».');});
if('serviceWorker'in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
if(new URLSearchParams(location.search).get('app')==='1'){setTimeout(()=>{const daily=$('#daily-claim');if(daily&&!daily.disabled)daily.click();},800);}
setTab('home');
})();