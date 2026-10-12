(()=>{'use strict';
const $=s=>document.querySelector(s);
const key='khkozak:squad-profile';
const voteKey='khkozak:map-vote';
const countsKey='khkozak:map-vote-counts';
const maps=['Erangel','Miramar','Sanhok','Livik'];
const read=(k,fallback)=>{try{const v=localStorage.getItem(k);return v===null?fallback:JSON.parse(v)}catch{return fallback}};
const write=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch{}};
const notify=m=>{const t=$('#toast');if(!t)return;t.textContent=m;t.classList.add('show');clearTimeout(notify.timer);notify.timer=setTimeout(()=>t.classList.remove('show'),2200)};
const fields={nick:$('#squad-nick'),role:$('#squad-role'),map:$('#squad-map'),mode:$('#squad-mode')};
const defaults={nick:'KH么Kozak',role:'Штурмовик',map:'Erangel',mode:'Squad · 4 гравці'};
function getProfile(){return Object.fromEntries(Object.entries(fields).map(([k,el])=>[k,el?.value||defaults[k]]))}
function paintProfile(p){Object.entries(fields).forEach(([k,el])=>{if(el)el.value=p[k]||defaults[k]});const card=$('#squad-card');if(card)card.innerHTML='<strong></strong><p></p>';if(card){card.querySelector('strong').textContent=p.nick;card.querySelector('p').textContent='Роль: '+p.role+' · Карта: '+p.map+' · '+p.mode}}
const saved=read(key,defaults);paintProfile({...defaults,...saved});
$('#squad-save')?.addEventListener('click',()=>{const p=getProfile();if(!p.nick.trim()){notify('Вкажи нік гравця.');fields.nick?.focus();return}p.nick=p.nick.trim().slice(0,24);write(key,p);paintProfile(p);notify('Профіль збережено на цьому пристрої ✓')});
async function shareText(text){const url='https://t.me/share/url?url='+encodeURIComponent(location.href)+'&text='+encodeURIComponent(text);try{if(navigator.share)await navigator.share({title:'KH么Kozak · Сквад',text,url:location.href});else window.open(url,'_blank','noopener,noreferrer')}catch(e){if(e?.name!=='AbortError')window.open(url,'_blank','noopener,noreferrer')}}
$('#squad-share')?.addEventListener('click',()=>{const p=getProfile();shareText('🎮 Сквад-профіль KH么Kozak\nГравець: '+p.nick+'\nРоль: '+p.role+'\nКарта: '+p.map+'\nРежим: '+p.mode)});
function getCounts(){return read(countsKey,{Erangel:0,Miramar:0,Sanhok:0,Livik:0})}
function renderVotes(){const counts=getCounts(),selected=read(voteKey,'');document.querySelectorAll('[data-map-vote]').forEach(btn=>{const map=btn.dataset.mapVote;btn.setAttribute('aria-pressed',String(map===selected));const count=btn.querySelector('[data-vote-count]');if(count)count.textContent=String(counts[map]||0)});const status=$('#vote-status');if(status)status.textContent=selected?'Твій локальний голос: '+selected+'. Можеш змінити його будь-коли.':'Обери карту — це локальне голосування на цьому пристрої.'}
document.querySelectorAll('[data-map-vote]').forEach(btn=>btn.addEventListener('click',()=>{const next=btn.dataset.mapVote,old=read(voteKey,'');if(!maps.includes(next))return;if(old===next){notify('Ти вже голосував за '+next+'.');return}const counts=getCounts();if(old&&counts[old]>0)counts[old]-=1;counts[next]=(counts[next]||0)+1;write(countsKey,counts);write(voteKey,next);renderVotes();notify('Голос за '+next+' збережено локально.')}));
$('#share-vote')?.addEventListener('click',()=>{const selected=read(voteKey,'');shareText('🗳️ Голосування скваду KH么Kozak: '+(selected?'мій вибір — '+selected+'. ':'')+'Обери карту для наступного матчу!')});
renderVotes();
})();