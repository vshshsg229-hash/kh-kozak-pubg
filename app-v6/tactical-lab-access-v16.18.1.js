(()=>{'use strict';
function install(){
 if(document.getElementById('khTacticalLabQuickAccess'))return;
 const button=document.createElement('button');
 button.id='khTacticalLabQuickAccess';
 button.type='button';
 button.className='kh-tl-quick-access';
 button.setAttribute('aria-label','Швидко відкрити Tactical Lab');
 button.innerHTML='<span class="kh-tl-qa-icon" aria-hidden="true">🎯</span><span class="kh-tl-qa-copy"><strong>TACTICAL LAB</strong><small>Зброя · обвіси · віддача</small></span><span class="kh-tl-qa-arrow" aria-hidden="true">↗</span>';
 button.addEventListener('click',()=>{
  const lab=document.getElementById('khTacticalLab');
  if(!lab)return;
  const arsenalNav=document.querySelector('[data-tab="arsenal"]');
  if(!document.getElementById('tab-arsenal')?.classList.contains('active'))arsenalNav?.click();
  window.setTimeout(()=>{lab.scrollIntoView({behavior:'smooth',block:'start'});lab.classList.remove('tl-quick-focus');void lab.offsetWidth;lab.classList.add('tl-quick-focus');},220);
 });
 document.body.appendChild(button);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();