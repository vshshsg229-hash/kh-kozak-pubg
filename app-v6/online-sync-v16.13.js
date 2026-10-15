(()=>{'use strict';
const API='https://xacqretciujzrcqjvvgz.supabase.co/functions/v1/hub-api';
const TOKEN='khkozak_online_token_v1',REFRESH='khkozak_supabase_refresh_v1',USER='khkozak_online_user_v1';
const $=s=>document.querySelector(s);
const get=k=>{try{return localStorage.getItem(k)||''}catch{return''}};
const put=(k,v)=>{try{if(v)localStorage.setItem(k,v);else localStorage.removeItem(k)}catch{}};
let busy=false,lastUser=null;
function token(){return get(TOKEN)}
async function request(path,{method='GET',body,auth=true,skipRefresh=false}={}){
 const headers={'Content-Type':'application/json'};if(auth&&token())headers.Authorization='Bearer '+token();
 let res=await fetch(API+path,{method,headers,body:body?JSON.stringify(body):undefined,cache:'no-store'});
 let data=await res.json().catch(()=>({error:'Сервер повернув нечитабельну відповідь.'}));
 if(res.status===401&&auth&&!skipRefresh&&get(REFRESH)){
   const refreshed=await request('/api/auth/refresh',{method:'POST',body:{refreshToken:get(REFRESH)},auth:false,skipRefresh:true}).catch(()=>null);
   if(refreshed?.token){saveSession(refreshed);return request(path,{method,body,auth:true,skipRefresh:true})}
 }
 if(!res.ok)throw new Error(data.error||'Помилка сервера ('+res.status+').');
 return data;
}
function saveSession(data){if(data.token)put(TOKEN,data.token);if(data.refreshToken)put(REFRESH,data.refreshToken);if(data.user){lastUser=data.user;put(USER,JSON.stringify(data.user));window.khOnlineUserId=data.user.id;window.khOnlineUser=data.user;applyUser(data.user)}}
function applyUser(user){if(!user)return;lastUser=user;window.khOnlineUserId=String(user.id||'');window.khOnlineUser=user;put(USER,JSON.stringify(user));if(window.khkozakProgression?.applyRemoteUser)window.khkozakProgression.applyRemoteUser(user);document.dispatchEvent(new CustomEvent('khkozak-online-user',{detail:{user}}));}
function setStatus(text,error=false){const el=$('#khOnlineAccountStatus');if(el){el.textContent=text;el.dataset.error=error?'true':'false'}}
function accountCard(){
 const profile=$('#tab-profile');if(!profile)return;
 let card=$('#khOnlineAccount');if(!card){card=document.createElement('section');card.id='khOnlineAccount';card.className='kh-online-account';card.innerHTML='<div class="kh-online-account-head"><span class="kh-online-account-icon">◈</span><div><small>KH么KOZAK · SUPABASE</small><h3>ОНЛАЙН-ПРОФІЛЬ</h3><p>Увійди, щоб зберігати прогрес, монети та інвентар між телефоном і ПК.</p></div><span class="kh-online-pill" id="khOnlineStatePill">НЕ ВИКОНАНО ВХІД</span></div><div id="khOnlineAccountBody"><div class="kh-online-fields"><label>Номер телефону або email<input id="khOnlineIdentifier" autocomplete="username" placeholder="+380501234567 або email"></label><label>Пароль<input id="khOnlinePassword" type="password" autocomplete="current-password" minlength="8" maxlength="72" placeholder="Щонайменше 8 символів"></label></div><div class="kh-online-register-fields" id="khOnlineRegisterFields" hidden><label>Ігровий нік<input id="khOnlineUsername" maxlength="20" autocomplete="nickname" placeholder="Твій нік KH"></label></div><div class="kh-online-actions"><button type="button" id="khOnlineLogin">УВІЙТИ</button><button type="button" id="khOnlineRegister">СТВОРИТИ АКАУНТ</button></div><p id="khOnlineAccountStatus" role="status" aria-live="polite">Сесія зберігається на цьому пристрої. Для входу на іншому пристрої використовуй ті самі дані.</p></div>'; }
 const heading=profile.querySelector('.profile-card')||profile.firstElementChild; if(heading)heading.insertAdjacentElement('beforebegin',card);else profile.prepend(card);
 $('#khOnlineLogin').addEventListener('click',()=>{const f=$('#khOnlineRegisterFields');if(f&&!f.hidden){f.hidden=true;$('#khOnlineRegister').textContent='СТВОРИТИ АКАУНТ';$('#khOnlineLogin').textContent='УВІЙТИ';return}signIn()});
 $('#khOnlineRegister').addEventListener('click',()=>{const f=$('#khOnlineRegisterFields');if(!f)return;if(!f.hidden){signUp();return}f.hidden=false;$('#khOnlineRegister').textContent='ЗАРЕЄСТРУВАТИСЯ';$('#khOnlineLogin').textContent='СКАСУВАТИ';});
}
function setBusy(v){busy=v;['#khOnlineLogin','#khOnlineRegister'].forEach(s=>{const b=$(s);if(b)b.disabled=v})}
async function signIn(){
 if(busy)return;const identifier=$('#khOnlineIdentifier')?.value.trim()||'',password=$('#khOnlinePassword')?.value||'';
 if(!identifier||!password){setStatus('Введи номер телефону/email і пароль.',true);return}
 setBusy(true);setStatus('Підключаюся до Supabase…');
 try{const data=await request('/api/auth/login',{method:'POST',auth:false,body:{identifier,password}});saveSession(data);setStatus('Успішний вхід. Прогрес завантажено із сервера.');renderCard();await sync();}catch(e){setStatus(e.message,true)}finally{setBusy(false)}
}
async function signUp(){
 if(busy)return;const phone=$('#khOnlineIdentifier')?.value.trim()||'',password=$('#khOnlinePassword')?.value||'',username=$('#khOnlineUsername')?.value.trim()||'';
 if(!phone||!password||!username){setStatus('Для реєстрації введи номер телефону, пароль і нік.',true);return}
 setBusy(true);setStatus('Створюю акаунт…');
 try{const data=await request('/api/auth/register',{method:'POST',auth:false,body:{phone,password,username}});if(data.confirmationRequired){setStatus(data.message||'Потрібне підтвердження номера.',true);return}saveSession(data);setStatus('Акаунт створено. Прогрес тепер прив’язаний до твого входу.');renderCard();await sync();}catch(e){setStatus(e.message,true)}finally{setBusy(false)}
}
function renderCard(){
 const body=$('#khOnlineAccountBody'),pill=$('#khOnlineStatePill');if(!body||!pill)return;
 const user=lastUser||(()=>{try{return JSON.parse(get(USER)||'null')}catch{return null}})();
 if(token()&&user){pill.textContent='ОНЛАЙН';pill.classList.add('online');body.innerHTML='<div class="kh-online-user"><div class="kh-online-user-avatar">✓</div><div><b>'+escapeText(user.username||'Гравець')+'</b><small>◈ '+(Number(user.coins)||0).toLocaleString('uk-UA')+' монет · ⚡ '+(Number(user.xp)||0)+' XP</small><small>Серверний ID: '+escapeText(String(user.id||'').slice(0,8))+'…</small></div></div><div class="kh-online-actions"><button type="button" id="khOnlineSyncNow">СИНХРОНІЗУВАТИ ЗАРАЗ</button><button type="button" class="secondary" id="khOnlineLogout">ВИЙТИ З АКАУНТА</button></div><p id="khOnlineAccountStatus" role="status" aria-live="polite">Акаунт підключено. Остання перевірка — після входу.</p>';$('#khOnlineSyncNow').addEventListener('click',()=>sync().catch(e=>setStatus(e.message,true)));$('#khOnlineDailyClaim').addEventListener('click',()=>claimDaily().catch(e=>setStatus(e.message,true)));$('#khOnlineLogout').addEventListener('click',logout);return}
 pill.textContent='НЕ ВИКОНАНО ВХІД';pill.classList.remove('online');
}
function escapeText(v){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
async function sync(){
 if(!token())return null;
 setStatus('Завантажую серверний профіль…');
 try{const data=await request('/api/auth/me');if(data.user){applyUser(data.user);renderCard();setStatus('Синхронізація успішна · '+new Date().toLocaleTimeString('uk-UA',{hour:'2-digit',minute:'2-digit'}));return data.user}return null}
 catch(e){setStatus(e.message,true);throw e}
}
function logout(){put(TOKEN,'');put(REFRESH,'');put(USER,'');lastUser=null;window.khOnlineUserId='';window.khOnlineUser=null;$('#khOnlineAccount')?.remove();accountCard();setStatus('Вийшов з онлайн-акаунта. Локальний прогрес на цьому пристрої збережено.')}
const UUID=()=>{if(crypto?.randomUUID)return crypto.randomUUID();return'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,c=>{const r=Math.random()*16|0;return(c==='x'?r:(r&3|8)).toString(16)})};
async function claimDaily(){
 if(!token())throw new Error('Спочатку увійди в онлайн-акаунт.');
 const button=$('#khOnlineDailyClaim');if(button)button.disabled=true;
 try{const data=await request('/api/daily/claim',{method:'POST',body:{}});if(data.user)applyUser(data.user);
 if(data.alreadyClaimed){setStatus('Щоденну серверну нагороду вже забрано сьогодні.');if(button)button.textContent='НАГОРОДУ ВЖЕ ЗАБРАНО';}
 else{setStatus('Нагорода отримана на сервері: +25 монет · +20 очок · +20 XP.');if(button)button.textContent='НАГОРОДУ ЗАБРАНО ✓';}
 if(button)button.disabled=!!data.alreadyClaimed;renderCard();return data
 }catch(e){if(button)button.disabled=false;throw e}
}
async function finishGame(kind){
 if(!token())return null;
 const accepted=['reaction','aim','quiz','memory','loot','pubg','metro','classic','arena','zombie'];
 const game=accepted.includes(kind)?kind:(String(kind).includes('memory')?'memory':String(kind).includes('loot')?'loot':String(kind).includes('pubg')?'pubg':'aim');
 try{const data=await request('/api/games/finish',{method:'POST',body:{game,eventId:UUID()}});if(data.user)applyUser(data.user);setStatus('Гру зараховано на сервері · нагорода синхронізована.');renderCard();return data}catch(e){setStatus('Локальна гра збережена, але серверна нагорода не синхронізувалась: '+e.message,true);throw e}
}
async function purchaseItem(itemId){if(!token())return null;const data=await request('/api/shop/purchase',{method:'POST',body:{itemId}});if(data.user)applyUser(data.user);return data}
async function equipItem(itemId){if(!token())return null;const data=await request('/api/shop/equip',{method:'POST',body:{itemId}});if(data.user)applyUser(data.user);return data}
window.khOnlineSync={api:API,request,signIn,signUp,sync,claimDaily,finishGame,purchaseItem,equipItem,getUser:()=>lastUser,hasSession:()=>!!token(),logout,applyUser};
document.addEventListener('DOMContentLoaded',()=>{accountCard();if(token()){try{lastUser=JSON.parse(get(USER)||'null')}catch{};if(lastUser){window.khOnlineUserId=lastUser.id;window.khOnlineUser=lastUser}sync().catch(()=>{});renderCard()}});
const observer=new MutationObserver(()=>{if($('#tab-profile')&&!$('#khOnlineAccount'))accountCard()});if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>observer.observe(document.body,{childList:true,subtree:true}),{once:true});else observer.observe(document.body,{childList:true,subtree:true});
})();