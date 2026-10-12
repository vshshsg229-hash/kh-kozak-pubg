(()=> {
'use strict';
const $=id=>document.getElementById(id);
const status=msg=>{const el=$('arcade-global-status');if(el)el.textContent=msg;};
const config=window.KH_FIREBASE_CONFIG;
const placeholder=!config||!config.apiKey||String(config.apiKey).startsWith('PASTE_')||!config.databaseURL||String(config.databaseURL).includes('PASTE_PROJECT_ID')||!config.projectId||String(config.projectId).startsWith('PASTE_');
const api={ready:false,refresh:()=>{},publishScores:async()=>{throw new Error('Firebase ще не налаштовано. Дивись FIREBASE_SETUP.md у GitHub.');}};
window.KH_FIREBASE_LEADERBOARD=api;
const labels={aim:'Влуч у ціль',run:'Kozak Run',music:'Music Challenge',memory:'Знайди пару',wheel:'Колесо удачі',xo:'Хрестики-нулики'};
function render(data){
 const root=$('arcade-global-scores');if(!root)return;
 const all=[];Object.entries(data||{}).forEach(([uid,games])=>Object.entries(games||{}).forEach(([game,entry])=>{if(labels[game]&&entry&&Number.isFinite(Number(entry.score)))all.push({...entry,game,uid});}));
 if(!all.length){root.innerHTML='<p class="ap-note">Ще немає опублікованих рекордів. Зіграй і натисни «Опублікувати рекорди»!</p>';return;}
 root.innerHTML=Object.keys(labels).map(game=>{
   const arr=all.filter(x=>x.game===game).sort((a,b)=>Number(b.score)-Number(a.score)).slice(0,5);
   if(!arr.length)return '';
   return '<div class="ap-global-game"><strong>'+labels[game]+'</strong>'+arr.map((r,i)=>'<div class="ap-score-row"><span>'+(i+1)+'. '+String(r.nickname||'Гравець').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))+'</span><strong>'+Number(r.score).toLocaleString('uk-UA')+' <small>очок</small></strong></div>').join('')+'</div>';
 }).join('');
}
if(placeholder||!window.firebase||!firebase.apps){status('Онлайн-таблиця підготовлена, але ще не підключена. Налаштуй firebase-config.js та правила за інструкцією FIREBASE_SETUP.md.');return;}
try{
 if(!firebase.apps.length)firebase.initializeApp(config);
 const auth=firebase.auth(),db=firebase.database();
 const ready=new Promise((resolve,reject)=>{
   const timeout=setTimeout(()=>reject(new Error('Firebase не відповідає. Перевір конфігурацію.')),12000);
   auth.onAuthStateChanged(async user=>{
     try{if(!user){await auth.signInAnonymously();return;}clearTimeout(timeout);api.ready=true;resolve(user);status('Онлайн-таблиця підключена. Рекорди можна публікувати для всіх гравців.');}
     catch(e){clearTimeout(timeout);reject(e);}
   },e=>{clearTimeout(timeout);reject(e);});
 });
 db.ref('leaderboard').on('value',snap=>render(snap.val()),err=>status('Не вдалося завантажити онлайн-рекорди. Перевір правила Firebase.'));
 api.refresh=()=>db.ref('leaderboard').once('value').then(s=>render(s.val()));
 api.publishScores=async(scores,nickname)=>{
   const user=await ready;
   const clean=String(nickname||'Гравець').trim().slice(0,24)||'Гравець';
   const updates=scores.filter(x=>labels[x.game]&&Number.isFinite(Number(x.score))&&Number(x.score)>0).map(item=>{
     const ref=db.ref('leaderboard/'+user.uid+'/'+item.game);
     return ref.transaction(current=>{
       const score=Math.max(0,Math.min(100000,Math.floor(Number(item.score))));
       if(current&&Number(current.score)>score)return;
       return {nickname:clean,game:item.game,score,updatedAt:firebase.database.ServerValue.TIMESTAMP};
     },undefined,false);
   });
   await Promise.all(updates);
   await api.refresh();
   status('Рекорди опубліковано! Таблиця оновлюється для всіх гравців. Для дружньої гри пам’ятай: клієнтські бали не мають серверної перевірки.');
 };
 ready.catch(e=>{api.ready=false;status('Firebase не підключився: '+e.message+' Перевір налаштування у FIREBASE_SETUP.md.');});
}catch(e){status('Помилка запуску Firebase: '+e.message);}
})();