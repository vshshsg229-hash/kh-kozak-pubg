(()=>{'use strict';
const q=(s,root=document)=>root.querySelector(s);
const qa=(s,root=document)=>Array.from(root.querySelectorAll(s));
const safe=(fn)=>{try{return fn()}catch(e){console.warn('[KH么Kozak repair]',e);return null}};
function launchGame(id){
 if(!id)return false;
 const candidates=qa('#tab-games [data-game], [data-game]');
 const norm=v=>String(v||'').toLowerCase().replace(/[^a-z0-9]/g,'');
 let target=candidates.find(x=>x.dataset.game===id);
 if(!target){const map={zone:['zone','arena','zone-route','zoneRoute','safe-zone','route'],aim:['aim','aim-trainer','aimTrainer','shooting'],reaction:['reaction','reflex','reaction-test'],loot:['loot','loot-logic','lootLogic'],tactics:['tactics','tactical','tactical-lab'],code:['code','memory','memory-code'],recoil:['recoil','control-recoil']};const aliases=map[id]||[id];target=candidates.find(x=>aliases.some(a=>norm(a)===norm(x.dataset.game)))}
 if(target){target.click();return true}
 const search=q('#khBh3Search');
 if(search){search.value=id;search.dispatchEvent(new Event('input',{bubbles:true}));const match=qa('[data-bh3-catalog-launch]').find(x=>norm(x.dataset.bh3CatalogLaunch)===norm(id));if(match){match.click();return true}}
 const fallback=qa('#tab-games button, #tab-games [role="button"]').find(x=>norm(x.dataset.game||x.dataset.bh3Play||x.dataset.mode||x.id)===norm(id));if(fallback){fallback.click();return true}
 return false;
}
function continuePlan(){
 const selectors=['[data-bh3-plan-next]','#khBh3PlanNext','[data-action="continue-plan"]','[data-training-continue]'];
 for(const selector of selectors){const b=q(selector);if(b&&!b.disabled){b.click();return true}}
 // Kozak AI's real plan controls use these IDs, not the generic bridge selectors.
 const generate=q('#kozaiGenerate');
 if(generate){generate.scrollIntoView({behavior:'auto',block:'center'});generate.click();return true}
 const tasks=q('#kozaiTasks');
 if(tasks){tasks.scrollIntoView({behavior:'auto',block:'center'});return true}
 const plan=q('#tab-home [data-bh3-plan-start],#tab-profile [data-bh3-plan-start]');
 if(plan){plan.click();return true}
 const aiTab=q('[data-tab="home"],[data-tab="kozak-ai"],[data-tab="assistant"]');
 if(aiTab){aiTab.click();setTimeout(()=>{const b=q('#kozaiGenerate');if(b)b.click()},80);return true}
 return false;
}
function refreshProgress(){
 const p=q('#khxp-root');
 if(p){document.dispatchEvent(new CustomEvent('khkozak-progress-refresh'));window.dispatchEvent(new Event('storage'));return true}
 const tab=q('[data-tab="progress"]');if(tab){tab.click();return true}
 return false;
}
document.addEventListener('click',e=>safe(()=>{
 const launch=e.target.closest('[data-bh3-catalog-launch]');
 if(launch){const id=launch.dataset.bh3CatalogLaunch;if(!launchGame(id)){launch.setAttribute('aria-disabled','true');launch.title='Цей режим не знайдено. Онови список режимів або спробуй інший.'}return}
 if(e.target.closest('[data-bh3-plan-next],#khBh3PlanNext,[data-action="continue-plan"],[data-training-continue]')){setTimeout(()=>{const active=q('#tab-games .kh-bh3-modal,[role="dialog"]');if(!active)continuePlan()},0);return}
 if(e.target.closest('[data-action="refresh-progress"],[data-progress-refresh],#khProgressRefresh')){refreshProgress();return}
}));
window.addEventListener('khkozak-profile-updated',()=>safe(()=>{const root=q('#khxp-root');if(root)document.dispatchEvent(new CustomEvent('khkozak-progress-refresh'))}));
window.KHKozakRepairs={launchGame,continuePlan,refreshProgress};
})();