(()=>{'use strict';
const root=document.querySelector('#tab-roblox');if(!root)return;
const ID='rb3d-portal';let host=null,observer=null,game=null,threePromise=null;
const modes=[
{id:'brainrot',name:'BRAINROT HEIST',sub:'STEAL · COLLECT · UPGRADE',icon:'🧠',color:0xff4fcb,goal:'Викрадай мем-істот із вільних баз і повертайся додому, щоб заробити токени.'},
{id:'tokens',name:'TOKEN TYCOON',sub:'COLLECT · BUILD · LEVEL UP',icon:'🪙',color:0xffb52e,goal:'Збирай токени на острові, покращуй власний будинок і відкривай нові зони.'},
{id:'fruits',name:'KOZAK FRUITS 3D',sub:'ISLANDS · POWERS · BOSSES',icon:'🍈',color:0x53e7c3,goal:'Досліджуй острів, збирай енергофрукти та активуй маяк сили.'},
{id:'tower',name:'KOZAK OBBY 3D',sub:'PARKOUR · CHECKPOINTS',icon:'🧗',color:0x65a8ff,goal:'Стрибай між платформами, торкайся чекпойнтів і дістанься вершини.'},
{id:'nights',name:'99 NIGHTS 3D',sub:'FOREST · WOOD · CAMP',icon:'🌲',color:0x9ce56c,goal:'Збирай деревину, розпалюй багаття та переживай лісову ніч.'},
{id:'doors',name:'NIGHT SHIFT 3D',sub:'HORROR · KEYS · ESCAPE',icon:'🚪',color:0xc49aff,goal:'Знайди три ключ-кристали та дістанься до вихідного порталу.'},
{id:'bedwars',name:'BED WARS 3D',sub:'GEMS · BASE · DEFEND',icon:'🛏️',color:0xff7979,goal:'Збирай кристали, підсилюй базу та активуй захисний маяк.'}
];
let profile={tokens:0,brainrots:0,house:1,completed:0};try{profile={...profile,...JSON.parse(localStorage.getItem('khkozak_rb3d_profile')||'{}')}}catch(_){}
function save(){try{localStorage.setItem('khkozak_rb3d_profile',JSON.stringify(profile))}catch(_){}}
function el(tag,cls,html){const n=document.createElement(tag);if(cls)n.className=cls;if(html!==undefined)n.innerHTML=html;return n}
function inject(){
 if(!root.isConnected)return;
 if(root.querySelector('#'+ID))return;
 host=el('section','rb3d-portal');host.id=ID;
 host.innerHTML='<div class="rb3d-heading"><div><div class="rb3d-kicker">KH × LOW-POLY 3D WORLDS</div><h2>PLAYGROUND <span>3D</span></h2><p>Справжня 3D-сцена з персонажем, рухом, стрибками, предметами та будівлями. Прогрес зберігається на пристрої.</p></div><div class="rb3d-wallet"><b id="rb3dTokens">'+profile.tokens+'</b><small>🪙 ТОКЕНИ</small><b id="rb3dHome">LVL '+profile.house+'</b><small>🏠 БУДИНОК</small></div></div><div class="rb3d-modes">'+modes.map(m=>'<button type="button" class="rb3d-mode" data-rb3d-mode="'+m.id+'"><span>'+m.icon+'</span><b>'+m.name+'</b><small>'+m.sub+'</small></button>').join('')+'</div><div class="rb3d-stage" id="rb3dStage"><div class="rb3d-start"><div class="rb3d-start-mark">▣</div><h3>ОБЕРИ СВІТ І ЗАЙДИ В 3D</h3><p>Персонаж від третьої особи · дослідження · збір предметів · будівництво</p><button type="button" class="rb3d-primary" data-rb3d-mode="brainrot">ГРАТИ В BRAINROT HEIST ↗</button></div></div><div class="rb3d-controls-note"><span>⌨️ WASD / стрілки — рух</span><span>␣ SPACE — стрибок</span><span>📱 На телефоні — джойстик</span></div><div class="rb3d-bottom"><div id="rb3dStatus">Оберіть режим, щоб створити світ.</div><button type="button" class="rb3d-upgrade" data-rb3d-upgrade>🏠 ПОКРАЩИТИ БУДИНОК · 100 🪙</button><button type="button" class="rb3d-exit" data-rb3d-exit>ЗУПИНИТИ 3D</button></div><p class="rb3d-disclaimer">Оригінальні фанатські мінісвіти, натхненні жанрами Roblox. Не є офіційним Roblox і не використовують його оригінальні моделі чи карти. Для завантаження 3D-рушія потрібен інтернет.</p>';
 root.prepend(host);
}
function loadThree(){
 if(window.THREE)return Promise.resolve(window.THREE);
 if(threePromise)return threePromise;
 threePromise=new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';s.async=true;s.onload=()=>window.THREE?resolve(window.THREE):reject(Error('Three.js не завантажився'));s.onerror=()=>reject(Error('Немає з’єднання для завантаження 3D-рушія'));document.head.appendChild(s)});
 return threePromise;
}
function startMode(id){
 const mode=modes.find(m=>m.id===id);if(!mode)return;
 stopGame();const stage=host.querySelector('#rb3dStage');
 stage.innerHTML='<div class="rb3d-loading"><div class="rb3d-spinner"></div><b>ЗБИРАЄМО 3D-СВІТ…</b><small>Завантаження рушія та карти</small></div>';
 host.querySelectorAll('.rb3d-mode').forEach(b=>b.classList.toggle('active',b.dataset.rb3dMode===id));
 host.querySelector('#rb3dStatus').textContent=mode.goal;
 loadThree().then(THREE=>createWorld(THREE,mode,stage)).catch(err=>{stage.innerHTML='<div class="rb3d-start"><h3>3D-РУШІЙ НЕ ЗАВАНТАЖИВСЯ</h3><p>'+String(err.message||err)+' — перевір інтернет і спробуй ще раз.</p><button class="rb3d-primary" data-rb3d-mode="'+id+'">СПРОБУВАТИ ЩЕ РАЗ</button></div>'});
}
function createWorld(T,mode,stage){
 if(!stage.isConnected)return;
 const scene=new T.Scene();scene.background=new T.Color(mode.id==='doors'?0x111329:mode.id==='nights'?0x101f2a:0x9ad8ff);scene.fog=new T.Fog(scene.background,35,100);
 const camera=new T.PerspectiveCamera(65,1,.1,180);const renderer=new T.WebGLRenderer({antialias:true,alpha:false});renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.6));renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.outputEncoding=T.sRGBEncoding;renderer.domElement.setAttribute('aria-label','Інтерактивний 3D світ');stage.innerHTML='';stage.appendChild(renderer.domElement);
 const hemi=new T.HemisphereLight(0xd8edff,0x3a435c,2);scene.add(hemi);const sun=new T.DirectionalLight(0xffe3b0,2.4);sun.position.set(15,25,10);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);scene.add(sun);
 const mat=(color,roughness=.8,metalness=0)=>new T.MeshStandardMaterial({color,roughness,metalness});
 const mats={grass:mat(mode.id==='doors'?0x252c4d:mode.id==='nights'?0x183b32:0x4b9c67),ground:mat(0x344255),wood:mat(0x986039),dark:mat(0x182238),white:mat(0xf5f3ff),skin:mat(0xffc39b),shirt:mat(0xff8a24),pants:mat(0x283c65),gold:mat(0xffbf3c,.38,.25),pink:mat(0xff4fcb,.3),blue:mat(0x43d9ff,.25),red:mat(0xff5a63),green:mat(0x8bea71)};
 const ground=new T.Mesh(new T.BoxGeometry(72,.8,72),mats.grass);ground.position.y=-.55;ground.receiveShadow=true;scene.add(ground);
 const grid=new T.GridHelper(72,36,0x9de8ff,0x8ab7cf);grid.position.y=-.13;grid.material.transparent=true;grid.material.opacity=.18;scene.add(grid);
 const solids=[],items=[],decor=[],interactables=[];let ownHouseParts=[];let collected=0,goalCount=mode.id==='brainrot'?3:mode.id==='doors'?3:mode.id==='tower'?5:mode.id==='fruits'?5:mode.id==='nights'?6:mode.id==='bedwars'?5:8;let jumps=0,elapsed=0,won=false,stopped=false,carried=null;
 const box=(x,y,z,sx,sy,sz,material,solid=false)=>{const o=new T.Mesh(new T.BoxGeometry(sx,sy,sz),material);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;scene.add(o);if(solid)solids.push({x,z,hx:sx/2,hz:sz/2,top:y+sy/2,mesh:o});return o};
 const sphere=(x,y,z,r,material)=>{const o=new T.Mesh(new T.SphereGeometry(r,12,10),material);o.position.set(x,y,z);o.castShadow=true;scene.add(o);return o};
 function tree(x,z,scale=1){box(x,scale*1.1,z,.5*scale,2.2*scale,.5*scale,mats.wood);const crown=new T.Mesh(new T.ConeGeometry(1.25*scale,2.6*scale,7),mat(mode.id==='nights'?0x275f42:0x3d805b));crown.position.set(x,2.7*scale,z);crown.castShadow=true;scene.add(crown);decor.push(crown)}
 function house(x,z,level=1,own=false){const before=own?new Set(scene.children):null;const w=3+level*.5,h=2.1+level*.22;box(x,h/2,z,w,h,w,own?mat(level>2?0x304d78:0x6c839f):mat(0x4d657e),true);const roof=new T.Mesh(new T.ConeGeometry(w*.82,1.2,4),own?mats.gold:mat(0x33455f));roof.position.set(x,h+.5,z);roof.rotation.y=Math.PI/4;roof.castShadow=true;scene.add(roof);box(x,h*.42,z+w/2+.025,.85,1.2,.08,mats.wood);if(own){for(let i=0;i<level;i++)sphere(x-1+i*.4,h+.9,z,.12,mats.gold);ownHouseParts=scene.children.filter(o=>!before.has(o))}}
 // Island props, platforms and building landmarks.
 if(mode.id==='tower'){for(let i=0;i<11;i++){const x=-10+i*2,z=3+(i%2?1.2:-1.2),y=.5+i*.55;box(x,y,z,2.1,.42,2,mats.blue,true);sphere(x,y+.5,z,.17,mats.gold)}box(12,6.9,3,3,.5,3,mats.gold,true)}
 else if(mode.id==='doors'){for(let i=0;i<7;i++){const z=-10+i*3;box(-5,1,z,.6,2.5,2.6,mats.dark,true);box(5,1,z,.6,2.5,2.6,mats.dark,true);if(i%2===0){box(-2.2,2.1,z,2.8,.3,.35,mats.pink);box(2.2,2.1,z,2.8,.3,.35,mats.blue)}}box(0,1,-13,4,2.3,.6,mats.dark,true);box(0,1,13,4,2.3,.6,mats.green,true)}
 else if(mode.id==='nights'){for(let i=0;i<28;i++){const a=i*2.399,r=13+(i%5)*3;tree(Math.cos(a)*r,Math.sin(a)*r,.7+(i%4)*.12)}const fire=sphere(0,.45,0,.48,mat(0xff7a2c,.3));fire.userData.fire=true;box(0,.1,0,2,.2,2,mats.wood)}
 else {for(let i=0;i<17;i++){const a=i*2.399,r=10+(i%4)*4;tree(Math.cos(a)*r,Math.sin(a)*r,.6+(i%3)*.15)}}
 house(-7,-6,1,true);house(7,-5,2,false);house(8,7,1,false);house(-8,8,1,false);
 // Blocky third-person avatar.
 const player=new T.Group();scene.add(player);
 const body=box(0,0,0,.01,.01,.01,mats.white);body.visible=false;
 const torso=new T.Mesh(new T.BoxGeometry(.95,1.15,.52),mats.shirt);torso.position.y=1.65;torso.castShadow=true;player.add(torso);
 const head=new T.Mesh(new T.BoxGeometry(.72,.72,.72),mats.skin);head.position.y=2.58;head.castShadow=true;player.add(head);
 const hair=new T.Mesh(new T.BoxGeometry(.76,.22,.76),mats.dark);hair.position.set(0,2.96,0);player.add(hair);
 const eyeMat=mat(0x152034);for(const x of [-.17,.17]){const eye=new T.Mesh(new T.BoxGeometry(.08,.09,.035),eyeMat);eye.position.set(x,2.62,.37);player.add(eye)}
 const limbs=[];for(const x of [-.62,.62]){const arm=new T.Mesh(new T.BoxGeometry(.28,.88,.32),mats.skin);arm.position.set(x,1.65,0);arm.castShadow=true;player.add(arm);limbs.push(arm)}
 for(const x of [-.25,.25]){const leg=new T.Mesh(new T.BoxGeometry(.34,.82,.4),mats.pants);leg.position.set(x,.6,0);leg.castShadow=true;player.add(leg);limbs.push(leg)}
 const ring=new T.Mesh(new T.TorusGeometry(.68,.045,6,24),mats.gold);ring.rotation.x=Math.PI/2;ring.position.y=.04;player.add(ring);
 player.position.set(0,0,10);
 // Collectibles / targets.
 const makeItem=(kind,x,z,index)=>{let obj;if(kind==='brainrot'){obj=new T.Group();const body=new T.Mesh(new T.BoxGeometry(.78,.88,.72),[mats.pink,mats.green,mats.gold,mats.blue][index%4]);obj.add(body);const top=new T.Mesh(new T.SphereGeometry(.3,10,8),[mats.green,mats.gold,mats.pink][index%3]);top.position.y=.58;obj.add(top);const e1=new T.Mesh(new T.BoxGeometry(.09,.12,.05),mats.dark),e2=e1.clone();e1.position.set(-.16,.12,.37);e2.position.set(.16,.12,.37);obj.add(e1,e2);obj.position.set(x,.65,z);scene.add(obj)}
 else {obj=sphere(x,.7,z,kind==='token'?.34:.4,kind==='token'?mats.gold:kind==='key'?mats.blue:kind==='wood'?mats.wood:kind==='fruit'?mats.green:kind==='gem'?mats.pink:mats.gold);if(kind==='fruit'){const leaf=new T.Mesh(new T.ConeGeometry(.16,.35,6),mats.green);leaf.position.y=.4;obj.add(leaf)}}
 obj.userData={kind,index,baseY:obj.position.y};items.push(obj);return obj};
 for(let i=0;i<goalCount;i++){let x,z;if(mode.id==='tower'){x=-10+i*2;z=3+(i%2?1.2:-1.2)}else{x=((i*7)%17)-8;z=((i*11)%19)-9;if(Math.abs(x)<3&&Math.abs(z)<3)z+=5}makeItem(mode.id==='brainrot'?'brainrot':mode.id==='tokens'?'token':mode.id==='nights'?'wood':mode.id==='doors'?'key':mode.id==='fruits'?'fruit':'gem',x,z,i)}
 // NPC rivals for brainrot steal loop; touch their glowing bases to grab, return to home pad.
 const rivalBases=[];
 if(mode.id==='brainrot'){for(let i=0;i<3;i++){const x=-11+i*11,z=-8-(i%2)*2;box(x,.35,z,4,.7,3,[mat(0x58345e),mat(0x36506a),mat(0x57432b)][i],true);const glow=sphere(x,1.35,z,.65,[mats.pink,mats.blue,mats.gold][i]);glow.userData.rival=i;rivalBases.push({x,z,glow,index:i});const label=box(x,2.1,z,1.2,.15,.4,mats.white);label.material=mat(0xffd3fa)}}
 // Home collection / tycoon pad and upgrade visuals.
 const homeX=-7,homeZ=-6;box(homeX,.03,homeZ+3,4,.12,3,mats.gold);const homeMark=sphere(homeX,.28,homeZ+3,.42,mats.gold);
 const hud=el('div','rb3d-hud','<b>'+mode.name+'</b><span id="rb3dTask">'+mode.goal+'</span><span id="rb3dCount">0 / '+goalCount+' ЗІБРАНО</span><span id="rb3dCarry">🎒 Нічого не несеш</span>');stage.appendChild(hud);
 const toast=el('div','rb3d-toast','');stage.appendChild(toast);
 const touch=el('div','rb3d-touch','<div class="rb3d-stick" id="rb3dStick"><i></i></div><div class="rb3d-touch-actions"><button type="button" data-rb3d-jump>⬆<small>СТРИБОК</small></button><button type="button" data-rb3d-action>✦<small>ДІЯ</small></button></div>');stage.appendChild(touch);
 const state={T,scene,camera,renderer,player,torso,limbs,solids,items,mode,stage,stopped:false,moveX:0,moveZ:0,vy:0,onGround:true,yaw:0,collected,goalCount,elapsed,won,carried,toast,hud,homeX,homeZ,homeMark,rivalBases,decor,fire:null};
 game=state;
 let last=performance.now(),anim=0,toastUntil=0;
 function say(s){toast.textContent=s;toast.classList.add('show');toastUntil=performance.now()+2400;host.querySelector('#rb3dStatus').textContent=s}
 function resize(){if(!game||game!==state)return;const w=Math.max(1,stage.clientWidth),h=Math.max(240,stage.clientHeight);renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix()}
 const ro=new ResizeObserver(resize);ro.observe(stage);state.resizeObserver=ro;resize();
 function distance(a,b){return Math.hypot(a.x-b.x,a.z-b.z)}
 function action(){
 if(state.stopped)return;
 if(mode.id==='brainrot'){
 if(state.carried){if(distance(player.position,{x:homeX,z:homeZ+3})<4){profile.brainrots++;profile.tokens+=30+profile.house*5;save();state.carried=null;state.collected++;state.hud.querySelector('#rb3dCarry').textContent='🎒 Нічого не несеш';state.hud.querySelector('#rb3dCount').textContent=state.collected+' / '+goalCount+' ДОСТАВЛЕНО';updateWallet();say('Доставлено на базу! +'+(30+(profile.house-1)*5)+' токенів.');if(state.collected>=goalCount)complete()}else say('Повернись на свою золоту платформу біля будинку!');return}
 const rival=state.rivalBases.find(b=>distance(player.position,b)<2.6);
 if(rival){state.carried={index:rival.index};rival.glow.visible=false;state.hud.querySelector('#rb3dCarry').textContent='🎒 МЕМ У РУКАХ — ПОВЕРТАЙСЯ ДОДОМУ';say('Мем захоплено! Тікай назад на базу й неси здобич.');return}
 const target=state.items.find(o=>o.visible&&distance(player.position,o.position)<2.2);
 if(target){target.visible=false;state.carried={item:target};state.hud.querySelector('#rb3dCarry').textContent='🎒 Мем підібрано — достав додому';say('Знайшов мем-істоту! Віднеси її до своєї бази.');return}
 say('Підійди до мем-істоти або ворожої бази та натисни ДІЯ.');return;
 }
 const item=state.items.find(o=>o.visible&&distance(player.position,o.position)<2.3);
 if(item){item.visible=false;state.collected++;profile.tokens+=mode.id==='tokens'?12:mode.id==='nights'?4:mode.id==='fruits'?8:5;save();updateWallet();state.hud.querySelector('#rb3dCount').textContent=state.collected+' / '+goalCount+' ЗІБРАНО';say('Здобич зібрано! +'+(mode.id==='tokens'?12:mode.id==='nights'?4:mode.id==='fruits'?8:5)+' 🪙');if(mode.id==='tokens'&&distance(player.position,{x:homeX,z:homeZ+3})<5)say('Токени на базі можна вкласти в будинок унизу меню.');if(state.collected>=goalCount)complete();return}
 if(mode.id==='tower'&&player.position.x>9&&player.position.z<6){complete();return}
 if(mode.id==='doors'&&state.collected>=3){complete();return}
 if(mode.id==='nights'&&distance(player.position,{x:0,z:0})<3){complete();return}
 if(mode.id==='bedwars'&&distance(player.position,{x:homeX,z:homeZ+3})<4){complete();return}
 say(mode.id==='tokens'?'Збирай золоті токени на карті, потім покращуй будинок!':mode.id==='nights'?'Збери деревину та повернись до багаття в центрі.':mode.id==='tower'?'Дістанься золотої платформи на вершині.':'Підійди ближче до предмета та натисни ДІЯ.');
 }
 function complete(){if(state.won)return;state.won=true;profile.completed++;profile.tokens+=40;save();updateWallet();say('СВІТ ПРОЙДЕНО! +40 бонусних токенів. Можеш досліджувати далі.');window.dispatchEvent(new CustomEvent('kh-bh3-finished',{detail:{mode:mode.id==='tokens'?'loot':mode.id==='bedwars'?'arena':mode.id==='tower'?'aim':mode.id==='doors'?'memory':mode.id==='brainrot'?'reaction':'tactics',coins:40,points:60,xp:50}}))}
 function updateWallet(){const t=host.querySelector('#rb3dTokens');if(t)t.textContent=profile.tokens;const h=host.querySelector('#rb3dHome');if(h)h.textContent='LVL '+profile.house}
 function upgrade(){const cost=profile.house*100;if(profile.tokens<cost){say('Потрібно '+cost+' токенів для покращення будинку. Збери їх у світі!');return}profile.tokens-=cost;profile.house++;ownHouseParts.forEach(o=>{scene.remove(o);if(o.geometry)o.geometry.dispose();if(o.material){if(Array.isArray(o.material))o.material.forEach(m=>m.dispose());else o.material.dispose()}});ownHouseParts=[];house(homeX,homeZ,profile.house,true);save();updateWallet();say('🏠 Будинок покращено до рівня '+profile.house+'! Будівля стала більшою, а нагорода за brainrot зросла.')}
 state.action=action;state.upgrade=upgrade;state.stop=()=>{state.stopped=true;ro.disconnect();if(state.keyClean)state.keyClean();renderer.setAnimationLoop(null);renderer.dispose();if(renderer.domElement.parentNode)renderer.domElement.remove();state.scene.traverse(o=>{if(o.geometry)o.geometry.dispose();if(o.material){if(Array.isArray(o.material))o.material.forEach(m=>m.dispose());else o.material.dispose()}});game=null};
 function move(dt,now){
 const keys=state.keys||{};let x=state.moveX+(keys.KeyD||keys.ArrowRight?1:0)-(keys.KeyA||keys.ArrowLeft?1:0),z=state.moveZ+(keys.KeyS||keys.ArrowDown?1:0)-(keys.KeyW||keys.ArrowUp?1:0);const len=Math.hypot(x,z);if(len>1){x/=len;z/=len}
 const speed=(keys.ShiftLeft?10:6.4);if(len>.05){const angle=Math.atan2(x,z);player.rotation.y=angle;player.position.x+=x*speed*dt;player.position.z+=z*speed*dt;anim+=dt*11;limbs.forEach((l,i)=>{l.rotation.x=Math.sin(anim+(i%2)*Math.PI)*.45})}else limbs.forEach(l=>l.rotation.x*=.8);
 player.position.x=T.MathUtils.clamp(player.position.x,-31,31);player.position.z=T.MathUtils.clamp(player.position.z,-31,31);
 if(state.jumpQueued&&state.onGround){state.vy=8.5;state.onGround=false;state.jumpQueued=false}
 state.vy-=20*dt;player.position.y+=state.vy*dt;
 let platform=0;if(mode.id==='tower'){for(let i=0;i<11;i++){const px=-10+i*2,pz=3+(i%2?1.2:-1.2),py=.5+i*.55;if(Math.abs(player.position.x-px)<1.05&&Math.abs(player.position.z-pz)<1&&player.position.y<=py+1.3&&player.position.y>=py-.5)platform=Math.max(platform,py+.21)}}
 if(player.position.y<=platform){player.position.y=platform;state.vy=0;state.onGround=true}
 if(player.position.y<-.2){player.position.set(0,0,10);state.vy=0;say('Повернувся на чекпойнт. Спробуй ще раз!')}
 state.items.forEach((o,i)=>{if(o.visible){o.position.y=o.userData.baseY+Math.sin(now*.002+i)*.16;o.rotation.y+=dt*.8}});
 state.rivalBases.forEach((b,i)=>{b.glow.position.y=1.35+Math.sin(now*.003+i)*.25;b.glow.rotation.y+=dt});
 if(mode.id==='nights'){const f=scene.children.find(o=>o.userData.fire);if(f){f.scale.setScalar(1+Math.sin(now*.012)*.12)}}
 const target=new T.Vector3(player.position.x,player.position.y+1.4,player.position.z);const behind=new T.Vector3(Math.sin(player.rotation.y)*8,5.4,Math.cos(player.rotation.y)*8);camera.position.lerp(new T.Vector3(target.x+behind.x,target.y+behind.y,target.z+behind.z),Math.min(1,dt*5));camera.lookAt(target);
 }
 state.keys={};state.jump=()=>state.jumpQueued=true;
 const keydown=e=>{if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code))e.preventDefault();state.keys[e.code]=true;if(e.code==='Space')state.jumpQueued=true;if(e.code==='KeyE'||e.code==='Enter')action()};
 const keyup=e=>{state.keys[e.code]=false};
 window.addEventListener('keydown',keydown);window.addEventListener('keyup',keyup);state.keyClean=()=>{window.removeEventListener('keydown',keydown);window.removeEventListener('keyup',keyup)};
 const jumpBtn=touch.querySelector('[data-rb3d-jump]'),actBtn=touch.querySelector('[data-rb3d-action]');jumpBtn.addEventListener('pointerdown',e=>{e.preventDefault();state.jumpQueued=true});actBtn.addEventListener('pointerdown',e=>{e.preventDefault();action()});
 // Touch joystick: drag the thumb in a bounded circle.
 const stick=touch.querySelector('#rb3dStick'),knob=stick.querySelector('i');let pointer=null;
 stick.addEventListener('pointerdown',e=>{pointer=e.pointerId;stick.setPointerCapture(pointer);joystick(e)});stick.addEventListener('pointermove',e=>{if(e.pointerId===pointer)joystick(e)});const release=()=>{pointer=null;state.moveX=state.moveZ=0;knob.style.transform='translate(0,0)'};stick.addEventListener('pointerup',release);stick.addEventListener('pointercancel',release);
 function joystick(e){const r=stick.getBoundingClientRect(),dx=e.clientX-(r.left+r.width/2),dy=e.clientY-(r.top+r.height/2),max=r.width*.31,d=Math.max(1,Math.hypot(dx,dy)),k=Math.min(1,max/d);state.moveX=dx*k/max;state.moveZ=dy*k/max;knob.style.transform='translate('+dx*k+'px,'+dy*k+'px)'}
 let drag=null;renderer.domElement.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse')drag={x:e.clientX,y:e.clientY}});window.addEventListener('pointerup',()=>drag=null);
 renderer.setAnimationLoop(now=>{if(state.stopped)return;const dt=Math.min(.04,(now-last)/1000);last=now;elapsed+=dt;move(dt,now);renderer.render(scene,camera);if(now>toastUntil)toast.classList.remove('show')});
 say(mode.goal+' Збирай предмети кнопкою ДІЯ.');
}
function stopGame(){if(game&&game.stop)game.stop();game=null}
root.addEventListener('click',e=>{const mode=e.target.closest('[data-rb3d-mode]');if(mode){startMode(mode.dataset.rb3dMode);return}if(e.target.closest('[data-rb3d-upgrade]')){if(game&&game.upgrade)game.upgrade();else{const cost=profile.house*100;if(profile.tokens>=cost){profile.tokens-=cost;profile.house++;save();const t=host.querySelector('#rb3dTokens');if(t)t.textContent=profile.tokens;host.querySelector('#rb3dHome').textContent='LVL '+profile.house;host.querySelector('#rb3dStatus').textContent='Будинок покращено! Запусти TOKEN TYCOON або BRAINROT HEIST.'}else host.querySelector('#rb3dStatus').textContent='Потрібно '+cost+' токенів. Збери їх у 3D-світі.'}return}if(e.target.closest('[data-rb3d-exit]')){stopGame();if(host){host.querySelector('#rb3dStage').innerHTML='<div class="rb3d-start"><h3>3D-СВІТ ЗУПИНЕНО</h3><p>Обери режим, щоб повернутися до гри.</p></div>';host.querySelector('#rb3dStatus').textContent='Оберіть світ.'}}});
function boot(){inject();if(observer)observer.disconnect();observer=new MutationObserver(()=>{if(!root.querySelector('#'+ID))inject()});observer.observe(root,{childList:true});}
boot();
})();