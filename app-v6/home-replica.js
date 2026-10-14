(()=>{'use strict';
const KEY='khkozak_hub_v6';
const $=s=>document.querySelector(s);
function stateRead(){try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch{return {}}}
function accountName(s){return String(s.name||window.khOnlineUser?.username||'KH么Kozak').trim()||'Гравець'}
function render(){const s=stateRead(),name=accountName(s),xp=Math.max(0,Number(s.xp)||0),level=Math.floor(xp/100)+1,within=xp%100,percent=within;
const put=(sel,val)=>{const el=$(sel);if(el)el.textContent=String(val)};
put('#khReplicaTopName',name);put('#khReplicaProfileName',name);put('#khReplicaQuoteName',name);put('#khReplicaLevel',level);put('#khReplicaXP',within+' / 100 XP');put('#khReplicaProgressText',xp+' / '+(level*100)+' XP');put('#khReplicaRankName',level>=50?'Елітний боєць':level>=30?'Ветеран':level>=15?'Боєць':level>=5?'Рекрут':'Новобранець');
const avatar=$('#khReplicaAvatar');if(avatar)avatar.textContent=(name.replace(/[^\p{L}\p{N}]/gu,'').slice(0,2)||'KH').toUpperCase();
const bio=$('#khReplicaBio');if(bio)bio.textContent=window.khOnlineUserId?'Гравець KH么Kozak · онлайн-акаунт':'Звичайний гравець.';
put('#khReplicaKD','—');put('#khReplicaWins',Number(s.games?.pubg)||0);put('#khReplicaTop1',Number(s.played)||0);put('#khReplicaRank',level>1?Math.max(1,100-(level%20)*4):'—');put('#khReplicaGems',Number(s.gems||s.diamonds)||0);
['#khReplicaXPBar','#khReplicaProgressBar'].forEach(sel=>{const el=$(sel);if(el)el.style.width=percent+'%'});
const progress=$('#khReplicaProgressBar');if(progress)progress.style.width=Math.min(100,xp%2000/20)+'%';
const root=$('#khHomeReplica'),slot=$('#khReplicaFighterSlot');
if(slot&&!slot.querySelector('.kh-real-soldier')){const soldier=document.createElement('img');soldier.className='kh-real-soldier';soldier.src='soldier-hero.jpg?v=1.0.0';soldier.alt='Реалістичний боєць KH么Kozak';soldier.draggable=false;slot.appendChild(soldier);}
if(root){root.dataset.account=String(window.khOnlineUserId||'guest');}
}
function attach(){render();document.addEventListener('khkozak-profile-updated',render);document.addEventListener('khkozak-cosmetics-updated',render);window.addEventListener('storage',e=>{if(e.key===KEY)render()});const stage=$('#khReplicaFighterSlot');if(stage){let down=false,startX=0,rot=0;stage.addEventListener('pointerdown',e=>{down=true;startX=e.clientX;stage.setPointerCapture?.(e.pointerId)});stage.addEventListener('pointermove',e=>{if(!down)return;rot=Math.max(-13,Math.min(13,rot+(e.clientX-startX)*.18));startX=e.clientX;const img=stage.querySelector('.kh-real-soldier');if(img)img.style.transform='translateX(-50%) perspective(900px) rotateY('+rot+'deg)'});stage.addEventListener('pointerup',()=>down=false);stage.addEventListener('pointercancel',()=>down=false);}
document.addEventListener('click',e=>{if(e.target.closest('#khReplicaDaily'))$('#claimDaily')?.click();if(e.target.closest('#khReplicaMenu'))document.body.classList.toggle('sidebar-hidden')});}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',attach);else attach();
})();