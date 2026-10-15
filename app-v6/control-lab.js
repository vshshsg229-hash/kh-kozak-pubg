(()=>{'use strict';
const KEY='khkozak_control_profiles_v1';
const $=id=>document.getElementById(id);
const fields=['camera','ads','gyro','redDot','scope2x','scope3x','scope4x','scope6x','scope8x'];
const ids={camera:'clCamera',ads:'clAds',gyro:'clGyro',redDot:'clRedDot',scope2x:'cl2x',scope3x:'cl3x',scope4x:'cl4x',scope6x:'cl6x',scope8x:'cl8x'};
const presets={
balanced:{name:'Збалансований',values:{camera:120,ads:100,gyro:300,redDot:50,scope2x:35,scope3x:25,scope4x:20,scope6x:12,scope8x:10},fingers:'4',gyroOn:true},
aggressive:{name:'Агресивний ближній бій',values:{camera:145,ads:125,gyro:320,redDot:65,scope2x:42,scope3x:30,scope4x:22,scope6x:14,scope8x:10},fingers:'4',gyroOn:true},
gyro:{name:'Гіроскоп',values:{camera:110,ads:85,gyro:350,redDot:60,scope2x:45,scope3x:35,scope4x:28,scope6x:18,scope8x:12},fingers:'4',gyroOn:true},
sniper:{name:'Снайпер',values:{camera:90,ads:70,gyro:220,redDot:42,scope2x:30,scope3x:22,scope4x:16,scope6x:10,scope8x:7},fingers:'3',gyroOn:false},
two:{name:'2 пальці · старт',values:{camera:130,ads:110,gyro:0,redDot:55,scope2x:38,scope3x:28,scope4x:20,scope6x:12,scope8x:8},fingers:'2',gyroOn:false}
};
if(!$('clForm')||$('clForm').dataset.ready)return;
$('clForm').dataset.ready='1';
const read=()=>{try{const x=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(x)?x:[]}catch{return[]}};
const write=x=>{try{localStorage.setItem(KEY,JSON.stringify(x));return true}catch{return false}};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function current(){const values={};fields.forEach(k=>values[k]=Math.max(0,Math.min(400,Number($(ids[k]).value)||0)));return {name:$('clName').value.trim().slice(0,48)||'Мій профіль',fingers:$('clFingers').value,gyroOn:$('clGyroOn').checked,values,notes:$('clNotes').value.trim().slice(0,240)}}
function apply(p){$('clName').value=p.name||'Мій профіль';$('clFingers').value=String(p.fingers||'4');$('clGyroOn').checked=!!p.gyroOn;$('clNotes').value=p.notes||'';fields.forEach(k=>{$(ids[k]).value=Number(p.values?.[k]??presets.balanced.values[k]);});refresh()}
function refresh(){fields.forEach(k=>{$('clVal'+k).textContent=$(ids[k]).value});$('clGyro').disabled=!$('clGyroOn').checked;$('clValgyro').textContent=$('clGyroOn').checked?$('clGyro').value:'ВИМКНЕНО';$('clPreviewName').textContent=$('clName').value.trim()||'Мій профіль';$('clPreviewFingers').textContent=$('clFingers').value+' ПАЛЬЦІ';$('clPreviewGyro').textContent=$('clGyroOn').checked?'ГІРОСКОП УВІМКНЕНО':'ГІРОСКОП ВИМКНЕНО';const bar=$('clPreviewBars');bar.innerHTML=fields.map(k=>'<div class="cl-bar-row"><span>'+({camera:'Камера',ads:'ADS',gyro:'Гіроскоп',redDot:'Red Dot',scope2x:'2×',scope3x:'3×',scope4x:'4×',scope6x:'6×',scope8x:'8×'}[k])+'</span><i><b style="width:'+Math.min(100,Number($(ids[k]).value)/4)+'%"></b></i><strong>'+($(ids[k]).disabled?'—':$(ids[k]).value)+'</strong></div>').join('')}
function report(p){return ['KH么KOZAK · PUBG MOBILE CONTROL PROFILE',p.name,'Керування: '+p.fingers+' пальці','Гіроскоп: '+(p.gyroOn?'увімкнено':'вимкнено'),...fields.map(k=>({camera:'Камера TPP/FPP',ads:'ADS',gyro:'Гіроскоп',redDot:'Red Dot / Holo',scope2x:'Приціл 2×',scope3x:'Приціл 3×',scope4x:'Приціл 4×',scope6x:'Приціл 6×',scope8x:'Приціл 8×'}[k])+': '+(p.gyroOn||k!=='gyro'?p.values[k]:'вимкнено')),p.notes?'Нотатка: '+p.notes:'','Налаштування потрібно вручну перенести в PUBG Mobile.'].filter(Boolean).join('\n')}
function render(){const list=read();$('clSavedCount').textContent=list.length;if(!list.length){$('clSavedList').innerHTML='<div class="cl-empty">Поки немає збережених профілів. Налаштуй повзунки й натисни «Зберегти профіль».</div>';return}$('clSavedList').innerHTML=list.map(p=>'<article class="cl-saved-item"><div><b>'+esc(p.name)+'</b><small>'+esc(p.fingers)+' пальці · '+(p.gyroOn?'гіроскоп':'без гіроскопа')+' · '+new Date(p.updated||Date.now()).toLocaleDateString('uk-UA')+'</small></div><div class="cl-saved-actions"><button type="button" data-load="'+esc(p.id)+'">Завантажити</button><button type="button" data-copy="'+esc(p.id)+'">Копіювати</button><button type="button" data-delete="'+esc(p.id)+'" aria-label="Видалити профіль">×</button></div></article>').join('')}
function say(t){$('clStatus').textContent=t}
async function copy(p){const txt=report(p);try{await navigator.clipboard.writeText(txt);say('Профіль скопійовано в буфер обміну.')}catch{const ta=document.createElement('textarea');ta.value=txt;document.body.append(ta);ta.select();let ok=false;try{ok=document.execCommand('copy')}catch{}ta.remove();say(ok?'Профіль скопійовано в буфер обміну.':'Не вдалося скопіювати. Перевір дозвіл браузера.')} }
fields.forEach(k=>$(ids[k]).addEventListener('input',refresh));
$('clGyroOn').addEventListener('change',refresh);
$('clName').addEventListener('input',refresh);
$('clFingers').addEventListener('change',refresh);
$('clPresetButtons').addEventListener('click',e=>{const b=e.target.closest('[data-cl-preset]');if(!b)return;const p=presets[b.dataset.clPreset];if(p){apply({...p,notes:$('clNotes').value});say('Застосовано пресет: '+p.name+'. За потреби зміни значення та збережи його.')}});
$('clReset').addEventListener('click',()=>{apply({...presets.balanced,notes:''});say('Повернуто збалансовані значення.')});
$('clForm').addEventListener('submit',e=>{e.preventDefault();const p=current(),list=read();const duplicate=list.find(x=>x.name.toLowerCase()===p.name.toLowerCase());p.id=duplicate?.id||('cl_'+Date.now().toString(36));p.updated=Date.now();const next=[p,...list.filter(x=>x.id!==p.id)].slice(0,30);if(!write(next)){say('Не вдалося зберегти: сховище браузера переповнене.');return}render();say('Профіль «'+p.name+'» збережено.')});
$('clCopyCurrent').addEventListener('click',()=>copy(current()));
$('clExport').addEventListener('click',()=>{const data={app:'KH么Kozak Battle Hub',type:'pubg-control-profiles',schema:1,exportedAt:new Date().toISOString(),profiles:read()};const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='KH-Kozak-Control-Profiles.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);say('Файл профілів підготовлено.')});
$('clSavedList').addEventListener('click',async e=>{const b=e.target.closest('button');if(!b)return;const list=read(),p=list.find(x=>x.id===b.dataset.load||x.id===b.dataset.copy);if(b.dataset.load&&p){apply(p);say('Завантажено профіль «'+p.name+'».');return}if(b.dataset.copy&&p){await copy(p);return}if(b.dataset.delete){if(!confirm('Видалити цей профіль?'))return;write(list.filter(x=>x.id!==b.dataset.delete));render();say('Профіль видалено.')}});
apply({...presets.balanced,notes:''});render();
})();