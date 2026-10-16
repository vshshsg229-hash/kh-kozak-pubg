/* KH么Kozak Battle Hub — skeletal 3D lobby controller.
 * Emotes are layered on the loaded rig without accumulating bone rotations.
 * The source model is a generic animated GLB, not an official PUBG asset.
 */
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.164.1/build/three.module.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.164.1/examples/jsm/loaders/GLTFLoader.js';

(() => {
  const root = document.getElementById('khLobbyMode');
  const host = document.getElementById('khlobbyCharacter');
  if (!root || !host || host.dataset.real3dStarted) return;
  host.dataset.real3dStarted = '1';

  const canvas = document.createElement('canvas');
  canvas.className = 'khl-real3d-canvas';
  canvas.setAttribute('aria-label', 'Інтерактивний 3D-персонаж із кістковою анімацією');
  canvas.setAttribute('role', 'img');
  const status = document.createElement('div');
  status.className = 'khl-real3d-status';
  status.setAttribute('role', 'status');
  status.textContent = 'Завантаження 3D-персонажа…';
  host.append(canvas, status);

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({canvas, alpha:true, antialias:true, powerPreference:'high-performance'});
  } catch (error) {
    status.classList.add('is-error');
    status.textContent = 'WebGL недоступний у цьому браузері. Відкрий лобі в актуальному Chrome.';
    console.error('KH lobby WebGL init failed', error);
    return;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.background = null;
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  camera.position.set(0, 2.35, 8.4);
  camera.lookAt(0, 2.05, 0);
  scene.add(new THREE.HemisphereLight(0xe4f4ff, 0x202c3a, 2.15));
  const key = new THREE.DirectionalLight(0xffedcf, 3.0);
  key.position.set(-3, 7, 5);
  key.castShadow = true;
  key.shadow.mapSize.set(1024,1024);
  key.shadow.camera.left=-4; key.shadow.camera.right=4;
  key.shadow.camera.top=7; key.shadow.camera.bottom=-2;
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x6dcfff, 2.2);
  rim.position.set(4,4,-4); scene.add(rim);

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(20,20), new THREE.ShadowMaterial({opacity:.26}));
  floor.rotation.x=-Math.PI/2; floor.position.y=.012; floor.receiveShadow=true; scene.add(floor);

  const emotes = {
    wave:{label:'Привітання',emoji:'👋',duration:3.2},
    dance:{label:'Танець',emoji:'💃',duration:4.2},
    victory:{label:'Перемога',emoji:'🏆',duration:3.4},
    salute:{label:'Салют',emoji:'🫡',duration:2.8},
    heart:{label:'Серце',emoji:'🫶',duration:3.4},
    bow:{label:'Поклін',emoji:'🙇',duration:2.8}
  };
  const boneMap = new Map();
  const previousDeltas = new Map();
  let model=null, mixer=null, idleAction=null, currentAction=null, clips=[];
  let activeEmote='wave', emoteStarted=0, emoteUntil=0, targetYaw=0, dragging=false, lastX=0, raf=0;
  const clock=new THREE.Clock();
  const X=new THREE.Vector3(1,0,0), Y=new THREE.Vector3(0,1,0), Z=new THREE.Vector3(0,0,1);

  function resize(){
    const w=Math.max(1,host.clientWidth), h=Math.max(1,host.clientHeight);
    renderer.setSize(w,h,false); camera.aspect=w/h; camera.updateProjectionMatrix();
  }
  const observer=new ResizeObserver(resize); observer.observe(host); resize();

  function bone(patterns){
    for(const [name,b] of boneMap){ if(patterns.some(p=>p.test(name))) return b; }
    return null;
  }
  function restoreGesture(){
    for(const [b,q] of previousDeltas) b.quaternion.multiply(q.clone().invert());
    previousDeltas.clear();
  }
  function rotate(patterns,axis,angle){
    if(Math.abs(angle)<0.0001) return;
    const b=bone(patterns); if(!b) return;
    const q=new THREE.Quaternion().setFromAxisAngle(axis,angle);
    b.quaternion.multiply(q);
    const prior=previousDeltas.get(b);
    if(prior) prior.multiply(q); else previousDeltas.set(b,q.clone());
  }
  function pose(t,id){
    const wave=Math.sin(t*8.5);
    const sway=Math.sin(t*6.2);
    const pulse=Math.sin(t*4.8);
    const rightArm=[/rightarm/i,/right_arm/i,/rightupperarm/i];
    const leftArm=[/leftarm/i,/left_arm/i,/leftupperarm/i];
    const rightFore=[/rightforearm/i,/right_forearm/i,/rightlowerarm/i];
    const leftFore=[/leftforearm/i,/left_forearm/i,/leftlowerarm/i];
    const spine=[/spine2/i,/mixamorigspine1/i,/^spine$/i];
    const head=[/head/i];
    const rLeg=[/rightupleg/i,/rightthigh/i,/rightupperleg/i];
    const lLeg=[/leftupleg/i,/leftthigh/i,/leftupperleg/i];
    // Deltas are removed before every mixer update and reapplied once per frame,
    // so gestures do not spiral or drift after several seconds.
    if(id==='wave'){
      rotate(rightArm,Z,-1.75); rotate(rightFore,X,-.3 + wave*.22);
      rotate(leftArm,Z,.08); rotate(spine,Y,Math.sin(t*2)*.025);
    } else if(id==='dance'){
      rotate(rightArm,Z,-1.15 + sway*.38); rotate(leftArm,Z,1.12 - sway*.38);
      rotate(rightFore,X,-.45 + pulse*.22); rotate(leftFore,X,.42 - pulse*.22);
      rotate(spine,Z,sway*.16); rotate(spine,Y,Math.sin(t*3.1)*.13);
      rotate(rLeg,Z,.18 + Math.max(0,sway)*.16); rotate(lLeg,Z,-.18 - Math.max(0,-sway)*.16);
    } else if(id==='victory'){
      rotate(rightArm,Z,-2.45 + pulse*.08); rotate(leftArm,Z,2.45 - pulse*.08);
      rotate(rightFore,X,-.15); rotate(leftFore,X,.15);
      rotate(spine,Z,Math.sin(t*3)*.035);
    } else if(id==='salute'){
      rotate(rightArm,Z,-1.18); rotate(rightFore,X,-1.15 + pulse*.035);
      rotate(spine,Z,-.035); rotate(head,X,-.06);
    } else if(id==='heart'){
      rotate(rightArm,Z,-1.1); rotate(leftArm,Z,1.1);
      rotate(rightFore,X,-.85); rotate(leftFore,X,.85);
      rotate(spine,X,-.05 + pulse*.025);
    } else if(id==='bow'){
      const bend=Math.sin(Math.min(1,t/.7)*Math.PI/2)*.48;
      rotate(spine,X,bend); rotate(head,X,-bend*.42);
      rotate(rightArm,Z,-.12); rotate(leftArm,Z,.12);
    }
  }
  function showToast(id){
    const toast=root.querySelector('#khlobbyEmoteToast');
    if(toast){toast.textContent=emotes[id].emoji+' '+emotes[id].label.toUpperCase();toast.classList.add('show');}
  }
  function playEmote(id){
    if(!emotes[id]) id='wave';
    activeEmote=id; emoteStarted=clock.elapsedTime; emoteUntil=emoteStarted+emotes[id].duration;
    if(mixer && idleAction){
      const matched=clips.find(c=>new RegExp(id==='wave'?'wave|hello|greet':id==='dance'?'dance|hip.?hop':id==='victory'?'victory|cheer|win':id==='salute'?'salute|military':id==='heart'?'heart|love': 'bow|respect','i').test(c.name));
      if(matched){
        const action=mixer.clipAction(matched);
        if(currentAction && currentAction!==action) currentAction.fadeOut(.16);
        action.reset().setLoop(THREE.LoopOnce,1); action.clampWhenFinished=true; action.fadeIn(.16).play(); currentAction=action;
      } else if(currentAction!==idleAction){
        if(currentAction) currentAction.fadeOut(.16);
        idleAction.reset().fadeIn(.16).play(); currentAction=idleAction;
      }
    }
    root.querySelectorAll('[data-khl-emote]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.khlEmote===id)));
    const label=root.querySelector('#khlobbyCurrentEmote'); if(label) label.value=id;
    showToast(id);
  }
  root.querySelectorAll('[data-khl-emote]').forEach(b=>b.addEventListener('click',()=>playEmote(b.dataset.khlEmote)));
  root.querySelectorAll('[data-khl-rotate]').forEach(b=>b.addEventListener('click',()=>{targetYaw+=THREE.MathUtils.degToRad(Number(b.dataset.khlRotate)||0);}));
  root.querySelector('[data-khl-reset]')?.addEventListener('click',()=>{targetYaw=0;playEmote('wave');});
  canvas.addEventListener('pointerdown',e=>{dragging=true;lastX=e.clientX;canvas.setPointerCapture(e.pointerId);});
  canvas.addEventListener('pointermove',e=>{if(!dragging)return;targetYaw+=(e.clientX-lastX)*.012;lastX=e.clientX;});
  const stopDrag=()=>{dragging=false;}; canvas.addEventListener('pointerup',stopDrag);canvas.addEventListener('pointercancel',stopDrag);

  function tick(){
    raf=requestAnimationFrame(tick);
    const dt=Math.min(clock.getDelta(),.05), now=clock.elapsedTime;
    restoreGesture();
    if(mixer) mixer.update(dt);
    if(model){
      model.rotation.y=THREE.MathUtils.damp(model.rotation.y,targetYaw,5,dt);
      if(activeEmote && now<emoteUntil) pose(now-emoteStarted,activeEmote);
      else if(activeEmote){activeEmote='';root.querySelectorAll('[data-khl-emote]').forEach(b=>b.setAttribute('aria-pressed','false'));const toast=root.querySelector('#khlobbyEmoteToast');toast?.classList.remove('show');}
    }
    renderer.render(scene,camera);
  }

  const loader=new GLTFLoader();
  loader.load('https://threejs.org/examples/models/gltf/Soldier.glb',gltf=>{
    model=gltf.scene;
    model.traverse(obj=>{
      if(obj.isMesh){obj.castShadow=true;obj.receiveShadow=true;}
      if(obj.isBone) boneMap.set(obj.name,obj);
    });
    const bounds=new THREE.Box3().setFromObject(model), size=bounds.getSize(new THREE.Vector3());
    model.scale.setScalar(4.15/Math.max(size.y,.001));
    const fitted=new THREE.Box3().setFromObject(model);
    model.position.y-=fitted.min.y; model.position.x-=(fitted.min.x+fitted.max.x)/2;
    scene.add(model);
    clips=gltf.animations||[];
    mixer=new THREE.AnimationMixer(model);
    const idle=clips.find(c=>/idle|stand/i.test(c.name))||clips.find(c=>/t.?pose/i.test(c.name))||clips[0];
    if(idle){idleAction=mixer.clipAction(idle);currentAction=idleAction;idleAction.play();}
    host.classList.add('khl-has-3d');
    status.classList.add('is-hidden');status.textContent='';
    const selected=root.querySelector('#khlobbyCurrentEmote')?.value||'wave';
    playEmote(selected);resize();
  },progress=>{
    if(progress.total) status.textContent='Завантаження 3D-персонажа… '+Math.round(progress.loaded/progress.total*100)+'%';
  },error=>{
    console.error('KH lobby 3D model failed to load',error);
    status.classList.add('is-error');
    status.textContent='Не вдалося завантажити 3D-модель. Перевір інтернет і натисни «Оновити».';
  });
  tick();
  window.addEventListener('pagehide',()=>{cancelAnimationFrame(raf);observer.disconnect();renderer.dispose();},{once:true});
})();