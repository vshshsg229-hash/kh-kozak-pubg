(()=>{'use strict';
const KEY='kozak.nexus.world.v1';
const $=s=>document.querySelector(s);
const labels={credits:'КРЕДИТИ',energy:'ЕНЕРГІЯ',alloy:'СПЛАВ',data:'ДАНІ',crystal:'КРИСТАЛИ'};
const relics=['Печатка Першого Командира','Кристал пам’яті','Термальне ядро','Полярний маяк','Креслення Омега','Стабілізатор Розлому','Серце Туманності','Ключ Ехо-Цитаделі','Фрагмент Серця NEXUS','Ядро Протоколу Омега'];
function read(){try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch{return {}}}
function save(s){s.artifactLevels=s.artifactLevels&&typeof s.artifactLevels==='object'?s.artifactLevels:{};s.equippedArtifacts=Array.isArray(s.equippedArtifacts)?s.equippedArtifacts.filter(x=>s.artifacts?.includes(x)).slice(0,3):[];localStorage.setItem(KEY,JSON.stringify(s));window.dispatchEvent(new CustomEvent('nexus-artifact-state',{detail:{levels:s.artifactLevels,equipped:s.equippedArtifacts}}))}
function esc(v){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function level(s,n){return Math.max(1,Math.min(5,Number(s.artifactLevels?.[n])||1))}
function kind(n){if(n==='Ядро Протоколу Омега')return 'Універсальний бонус';const i=relics.indexOf(n);return ['Бонус до дослідження секторів','Бонус до експедицій','Додаткова енергія постачання','Знижка на дослідження технологій'][Math.max(0,i)%4]}
function cost(l){return {credits:35*l,alloy:15*l,data:10*l,...(l>=3?{crystal:l-2}:{})}}
function canPay(s,c){return Object.entries(c).every(([k,v])=>(Number(s.res?.[k])||0)>=v)}
function pay(s,c){if(!canPay(s,c))return false;Object.entries(c).forEach(([k,v])=>s.res[k]-=v);return true}
function render(){const s=read(),owned=[...new Set(Array.isArray(s.artifacts)?s.artifacts:[])],equipped=s.equippedArtifacts||[];const slots=$('#artifactSlots'),grid=$('#artifactForgeGrid');if(!slots||!grid)return;
$('#artifactForgeCount').textContent=equipped.length+' / 3 слотів';
slots.innerHTML=[0,1,2].map(i=>{const n=equipped[i];return '<div class="artifact-slot '+(n?'filled':'')+'"><b>СЛОТ '+(i+1)+'</b><br>'+(n?esc(n)+' · РІВЕНЬ '+['I','II','III','IV','V'][level(s,n)-1]:'ПУСТО')+'</div>'}).join('');
grid.innerHTML=owned.map(n=>{const lv=level(s,n),on=equipped.includes(n),c=cost(lv);return '<article class="card '+(on?'gold-card':'')+'"><div class="card-top"><span class="icon gold">✧</span><span class="tag gold">РІВЕНЬ '+['I','II','III','IV','V'][lv-1]+' / V</span></div><h3>'+esc(n)+'</h3><p>'+kind(n)+'. Кожен рівень дає +2% відповідного бонусу.</p><div class="cost">АКТИВНИЙ БОНУС: +'+(lv*2)+'%</div><div class="actions"><button class="btn '+(on?'':'blue')+'" data-relic-equip="'+esc(n)+'" '+(!on&&equipped.length>=3?'disabled':'')+'>'+(on?'ЗНЯТИ':'СПОРЯДИТИ')+'</button><button class="btn primary" data-relic-upgrade="'+esc(n)+'" '+(lv>=5||!canPay(s,c)?'disabled':'')+'>'+(lv>=5?'МАКС. РІВЕНЬ':'ПОКРАЩИТИ · '+Object.entries(c).map(([k,v])=>v+' '+labels[k]).join(' · '))+'</button></div></article>'}).join('')||'<div class="empty">Артефактів ще немає. Досліди нові сектори, щоб відкрити реліквії.</div>';
}
document.addEventListener('click',e=>{if(e.target.closest('[data-view="forge"]')){render();return}const eq=e.target.closest('[data-relic-equip]');if(eq){const s=read(),n=eq.dataset.relicEquip;s.equippedArtifacts=s.equippedArtifacts||[];if(!s.artifacts?.includes(n))return;if(s.equippedArtifacts.includes(n))s.equippedArtifacts=s.equippedArtifacts.filter(x=>x!==n);else{if(s.equippedArtifacts.length>=3)return; s.equippedArtifacts.push(n)}save(s);render();return}const up=e.target.closest('[data-relic-upgrade]');if(up){const s=read(),n=up.dataset.relicUpgrade,lv=level(s,n);if(!s.artifacts?.includes(n)||lv>=5)return;const c=cost(lv);if(!pay(s,c))return;s.artifactLevels=s.artifactLevels||{};s.artifactLevels[n]=lv+1;save(s);render();return}});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',render,{once:true});else render();
})();