/* KH么Kozak Gaming Hub 4.6 — shared Supabase lobby and online presence */
(()=>{'use strict';
const $=id=>document.getElementById(id);
const wait=ms=>new Promise(r=>setTimeout(r,ms));
let client=null,user=null,heartbeat=null,refreshing=false,joining=new Set();
const status=(message,error=false)=>{const el=$('kh-server-status');if(el){el.textContent=message;el.dataset.state=error?'error':'success';}};
const clean=(value,max=60)=>String(value||'').trim().slice(0,max);
function getNickname(){return clean(localStorage.getItem('khkozak:community-nickname')||user?.user_metadata?.nickname||('Kozak-'+String(user?.id||'player').slice(0,5)),24)||'Гравець';}
function safeUrl(raw){try{const u=new URL(raw);return ['https:','http:'].includes(u.protocol)?u.href:''}catch{return ''}}
function el(tag,cls,text){const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;}
function renderRooms(rows,members){
 const root=$('kh-server-rooms');if(!root)return;root.replaceChildren();
 if(!rows.length){root.append(el('p','game-status','Поки немає активних кімнат. Створи першу — вона з’явиться всім гравцям після підключення сервера.'));return;}
 rows.forEach(room=>{
  const card=el('article','kh-room-card');
  const top=el('div','kh-room-top');const title=el('h3','',room.room_name);const badge=el('span','kh-room-mode',room.game_mode);top.append(title,badge);
  const meta=el('p','kh-room-meta','👤 '+room.owner_nickname+' · 👥 '+(members[room.id]||0)+'/'+room.max_players+' · до '+new Date(room.expires_at).toLocaleTimeString('uk-UA',{hour:'2-digit',minute:'2-digit'}));
  card.append(top,meta);
  const actions=el('div','kh-room-actions');
  if(safeUrl(room.invite_url)){const link=el('a','btn','Відкрити запрошення ↗');link.href=safeUrl(room.invite_url);link.target='_blank';link.rel='noopener noreferrer';actions.append(link);}
  if(room.owner_id===user?.id){const del=el('button','btn','Закрити кімнату');del.type='button';del.addEventListener('click',async()=>{del.disabled=true;const {error}=await client.from('kozak_global_rooms').delete().eq('id',room.id).eq('owner_id',user.id);if(error){status('Не вдалося закрити кімнату: '+error.message,true);del.disabled=false;}else{status('Кімнату закрито для всіх гравців.');await refresh();}});actions.append(del);}
  else {const joined=members['mine:'+room.id];const join=el('button','btn btn-primary',joined?'✓ Ти в кімнаті':'Приєднатися');join.type='button';join.disabled=!!joined||joining.has(String(room.id));join.addEventListener('click',async()=>{joining.add(String(room.id));join.disabled=true;const {error}=await client.from('kozak_global_room_members').upsert({room_id:room.id,user_id:user.id,nickname:getNickname()},{onConflict:'room_id,user_id'});joining.delete(String(room.id));if(error){status('Не вдалося приєднатися: '+error.message,true);join.disabled=false;}else{status('Ти приєднався до кімнати «'+room.room_name+'».');await refresh();}});actions.append(join);}
  card.append(actions);root.append(card);
 });
}
async function refresh(){
 if(!client||!user||refreshing)return;refreshing=true;
 try{
  const now=new Date().toISOString();
  const [roomResult,memberResult]=await Promise.all([
   client.from('kozak_global_rooms').select('id,owner_id,owner_nickname,room_name,game_mode,invite_url,max_players,created_at,expires_at').gt('expires_at',now).order('created_at',{ascending:false}).limit(40),
   client.from('kozak_global_room_members').select('room_id,user_id')
  ]);
  if(roomResult.error)throw roomResult.error;if(memberResult.error)throw memberResult.error;
  const counts={},mine={};(memberResult.data||[]).forEach(m=>{counts[m.room_id]=(counts[m.room_id]||0)+1;if(m.user_id===user.id)mine['mine:'+m.room_id]=true;});
  const members=Object.assign(counts,mine);renderRooms(roomResult.data||[],members);
  const onlineResult=await client.from('kozak_global_presence').select('user_id,nickname,current_area,last_seen').gt('last_seen',new Date(Date.now()-90000).toISOString()).order('last_seen',{ascending:false}).limit(40);
  if(onlineResult.error)throw onlineResult.error;
  const online=$('kh-server-online');if(online){online.replaceChildren();(onlineResult.data||[]).forEach(p=>{const chip=el('span','kh-online-chip','🟢 '+p.nickname);chip.title=p.current_area+' · '+new Date(p.last_seen).toLocaleTimeString('uk-UA',{hour:'2-digit',minute:'2-digit'});online.append(chip)});if(!online.childNodes.length)online.append(el('span','game-status','Поки нікого не видно онлайн.'));}
  const count=$('kh-server-online-count');if(count)count.textContent=String((onlineResult.data||[]).length);
  const roomCount=$('kh-server-room-count');if(roomCount)roomCount.textContent=String((roomResult.data||[]).length);
  status('🟢 Онлайн-сервер підключений · дані кімнат та присутності завантажено з Supabase.');
 }catch(e){status('Сервер ще не активовано. У Supabase виконай online-server-v46.sql та перевір Anonymous Sign-Ins. Деталі: '+(e.message||e),true);}
 finally{refreshing=false;}
}
async function pulse(){
 if(!client||!user)return;
 const {error}=await client.from('kozak_global_presence').upsert({user_id:user.id,nickname:getNickname(),current_area:'Мініігри',last_seen:new Date().toISOString()},{onConflict:'user_id'});
 if(error)status('Не вдалося оновити онлайн-статус: '+error.message,true);
}
async function boot(){
 for(let i=0;i<80;i++){if(window.KozakCommunity?.client&&window.KozakCommunity?.user){client=window.KozakCommunity.client;user=window.KozakCommunity.user;break;}await wait(250);}
 if(!client||!user){status('Не вдалося ввійти до онлайн-сервера. Відкрий спільноту та перевір налаштування Supabase.',true);return;}
 const form=$('kh-server-form'),name=$('kh-server-name'),url=$('kh-server-url'),mode=$('kh-server-mode'),max=$('kh-server-max');
 const open=$('kh-server-open');if(open)open.hidden=true;
 form?.addEventListener('submit',async e=>{e.preventDefault();const roomName=clean(name?.value,60),invite=safeUrl(url?.value||'');if(roomName.length<2){status('Назва кімнати має містити щонайменше 2 символи.',true);return;}const button=form.querySelector('[type=submit]');if(button)button.disabled=true;
  const payload={owner_id:user.id,owner_nickname:getNickname(),room_name:roomName,game_mode:clean(mode?.value||'PUBG Squad',32),invite_url:invite,max_players:Number(max?.value||4),expires_at:new Date(Date.now()+24*60*60*1000).toISOString()};
  const {data,error}=await client.from('kozak_global_rooms').insert(payload).select('id').single();if(button)button.disabled=false;
  if(error){status('Не вдалося створити спільну кімнату: '+error.message,true);return;}
  const roomId=data?.id;if(roomId){const joined=await client.from('kozak_global_room_members').upsert({room_id:roomId,user_id:user.id,nickname:getNickname()},{onConflict:'room_id,user_id'});if(joined.error){status('Кімнату створено, але не вдалося зайняти місце: '+joined.error.message,true);}}
  name.value='';if(url)url.value='';status('Кімнату створено на сервері — інші гравці можуть її бачити.');await refresh();
 });
 $('kh-server-refresh')?.addEventListener('click',refresh);
 $('kh-server-clear')?.addEventListener('click',()=>{if(name)name.value='';if(url)url.value='';status('Поля очищено. Онлайн-кімнати на сервері не видаляються.');});
 await pulse();await refresh();heartbeat=setInterval(async()=>{await pulse();await refresh();},25000);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden){pulse();refresh();}});
}
boot();
})();
