/* KH么Kozak Battle Hub — custom 3D character lobby controller.
 * Emotes are layered on the loaded rig without accumulating bone rotations.
 * The source model is a generic animated GLB, not an official PUBG asset.
 */
import * as THREE from 'https://esm.sh/three@0.164.1';
import { GLTFLoader } from 'https://esm.sh/three@0.164.1/examples/jsm/loaders/GLTFLoader.js';

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
  const sceneHost=root.querySelector('.khlobby-scene');
  if(sceneHost && !sceneHost.querySelector('.khl-real3d-emote-grid')){
    const gallery=document.createElement('div');
    gallery.className='khl-real3d-emote-grid';
    gallery.setAttribute('aria-label','Швидкий вибір емоцій');
    gallery.innerHTML='<div class="khl-real3d-emote-title">ЕМОЦІЇ <span>3D</span></div>';
    for(const [id,item] of Object.entries(emotes)){
      const button=document.createElement('button');
      button.type='button'; button.dataset.khlEmote=id; button.setAttribute('aria-pressed',String(id==='wave'));
      button.title=item.label; button.innerHTML='<span class="khl-real3d-emote-icon">'+item.emoji+'</span><span class="khl-real3d-emote-name">'+item.label+'</span>';
      gallery.appendChild(button);
    }
    sceneHost.appendChild(gallery);
  }

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
    const autoRig=Boolean(model?.userData?.autoRig);
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
      rotate(rightArm,Z,autoRig?1.72:-1.75); rotate(rightFore,autoRig?Z:X,autoRig?1.05+wave*.16:-.3+wave*.22);
      rotate(leftArm,Z,autoRig?-.08:.08); rotate(spine,Y,Math.sin(t*2)*.025);
    } else if(id==='dance'){
      rotate(rightArm,Z,(autoRig?2.0:-1.15) + sway*.38); rotate(leftArm,Z,(autoRig?-2.0:1.12) - sway*.38);
      rotate(rightFore,autoRig?Z:X,(autoRig?-.8:-.45)+pulse*.22); rotate(leftFore,autoRig?Z:X,(autoRig?.8:.42)-pulse*.22);
      rotate(spine,Z,sway*.16); rotate(spine,Y,Math.sin(t*3.1)*.13);
      rotate(rLeg,Z,.18 + Math.max(0,sway)*.16); rotate(lLeg,Z,-.18 - Math.max(0,-sway)*.16);
    } else if(id==='victory'){
      rotate(rightArm,Z,(autoRig?2.7:-2.45)+pulse*.08); rotate(leftArm,Z,(autoRig?-2.7:2.45)-pulse*.08);
      rotate(rightFore,autoRig?Z:X,autoRig?-.45:-.15); rotate(leftFore,autoRig?Z:X,autoRig?.45:.15);
      rotate(spine,Z,Math.sin(t*3)*.035);
    } else if(id==='salute'){
      rotate(rightArm,Z,autoRig?1.15:-1.18); rotate(rightFore,autoRig?Z:X,autoRig?-1.25:-1.15+pulse*.035);
      rotate(spine,Z,-.035); rotate(head,X,-.06);
    } else if(id==='heart'){
      rotate(rightArm,Z,autoRig?2.1:-1.1); rotate(leftArm,Z,autoRig?-2.1:1.1);
      rotate(rightFore,autoRig?Z:X,autoRig?-1.25:-.85); rotate(leftFore,autoRig?Z:X,autoRig?1.25:.85);
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

  // Custom procedural 3D recreation based on the user's three reference angles.
  // This is a purpose-built 3D character, not a ripped PUBG asset or a static image.
  function makeCharacter(){
    const group=new THREE.Group();
    const mat=(color,metalness=0,roughness=.58,emissive=0x000000)=>new THREE.MeshStandardMaterial({color,metalness,roughness,emissive,emissiveIntensity:.5});
    const ivory=mat(0xd9d2c9,.18,.38), pale=mat(0xf0e9df,.22,.3), seam=mat(0x9d958d,.35,.42);
    const green=mat(0x087d68,.35,.32), darkGreen=mat(0x063c38,.4,.3), gold=mat(0xb9953c,.72,.26);
    const mask=mat(0x9c762d,.65,.26), black=mat(0x171b1c,.1,.4), eye=mat(0x00ffb7,.25,.18,0x00d995);
    function mesh(geometry,material,parent,x,y,z,sx=1,sy=1,sz=1){
      const m=new THREE.Mesh(geometry,material);m.position.set(x,y,z);m.scale.set(sx,sy,sz);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;
    }
    function ball(parent,material,x,y,z,sx,sy,sz){return mesh(new THREE.SphereGeometry(1,18,14),material,parent,x,y,z,sx,sy,sz);}
    function limb(name,x,y,z){const g=new THREE.Group();g.name=name;g.position.set(x,y,z);group.add(g);boneMap.set(name,g);return g;}
    // Boots and articulated legs
    const leftLeg=limb('LeftUpLeg',-.19,.9,0), rightLeg=limb('RightUpLeg',.19,.9,0);
    for(const [g,sgn] of [[leftLeg,-1],[rightLeg,1]]){
      mesh(new THREE.CapsuleGeometry(.105,.58,4,8),ivory,g,0,-.28,0,1,1,.95);
      mesh(new THREE.BoxGeometry(.23,.18,.38),pale,g,0,-.68,.075,1,1,1);
      mesh(new THREE.BoxGeometry(.24,.07,.4),seam,g,0,-.77,.08,1,1,1);
    }
    // Long split ceremonial coat over the legs
    mesh(new THREE.CylinderGeometry(.48,.63,1.8,12,1,true),ivory,group,0,1.65,0,1,1,1);
    mesh(new THREE.ConeGeometry(.65,.72,12,1,true),pale,group,0,.99,0,1,1,1);
    mesh(new THREE.BoxGeometry(.12,1.35,.08),seam,group,0,1.72,.47);
    // Torso and decorative chest panels
    const spine=limb('Spine2',0,2.35,0);
    mesh(new THREE.CapsuleGeometry(.31,.66,5,10),pale,spine,0,.18,0,1,1,.72);
    mesh(new THREE.BoxGeometry(.43,.68,.09),ivory,spine,0,.18,.235);
    mesh(new THREE.BoxGeometry(.055,.67,.045),gold,spine,0,.18,.29);
    mesh(new THREE.BoxGeometry(.2,.38,.045),green,spine,0,.22,.31);
    // Shoulder armor
    for(const s of [-1,1]){
      const pad=mesh(new THREE.SphereGeometry(1,12,8),green,spine,s*.39,.46,0,.28,.14,.34);
      pad.rotation.z=s*-.16;
      const trim=mesh(new THREE.BoxGeometry(.4,.045,.35),gold,spine,s*.39,.48,.005);
      trim.rotation.z=s*-.12;
    }
    // Arms pivot at shoulders; pose() can drive these named bones
    for(const side of ['Right','Left']){
      const s=side==='Right'?1:-1;
      const upper=limb(side+'Arm',s*.43,2.72,0);
      mesh(new THREE.CapsuleGeometry(.105,.42,4,8),pale,upper,0,-.25,0,1,1,1);
      mesh(new THREE.BoxGeometry(.22,.16,.2),green,upper,0,-.1,0);
      const fore= new THREE.Group();fore.name=side+'ForeArm';fore.position.set(0,-.48,0);upper.add(fore);boneMap.set(fore.name,fore);
      mesh(new THREE.CapsuleGeometry(.085,.36,4,8),ivory,fore,0,-.21,0);
      mesh(new THREE.BoxGeometry(.18,.2,.13),darkGreen,fore,0,-.13,.035);
      mesh(new THREE.SphereGeometry(.095,12,10),pale,fore,0,-.46,.02);
      for(let i=0;i<3;i++) mesh(new THREE.CapsuleGeometry(.018,.09,2,5),pale,fore,(i-1)*.045,-.53,.055,1,1,1);
    }
    // Neck, head, hair and crown
    mesh(new THREE.CylinderGeometry(.095,.12,.2,12),seam,group,0,3.08,0);
    const head=limb('Head',0,3.28,0);
    ball(head,ivory,0,.12,0,.24,.31,.22);
    // swept pale hair and crown silhouette
    ball(head,mat(0xc7c0b9,.15,.48),0,.34,-.025,.25,.16,.23);
    for(let i=0;i<5;i++){
      const spike=mesh(new THREE.ConeGeometry(.055,.23,6),mat(0xb9b1a8,.1,.55),head,-.17+i*.085,.47-(i%2)*.035,-.015,.8,1,.8);
      spike.rotation.z=(i-2)*-.17;
    }
    // Ornate golden face mask, brow and glowing eyes
    ball(head,mask,0,.11,.188,.22,.2,.075);
    mesh(new THREE.ConeGeometry(.055,.14,5),gold,head,0,.04,.25,1,1,1);
    for(const s of [-1,1]){
      ball(head,eye,s*.095,.17,.248,.055,.035,.022);
      const horn=mesh(new THREE.ConeGeometry(.035,.16,5),gold,head,s*.16,.34,.06,1,1,1);horn.rotation.z=s*.4;
    }
    // Crown with five small gold points
    mesh(new THREE.CylinderGeometry(.19,.22,.055,10),gold,head,0,.43,0);
    for(let i=0;i<5;i++){
      const a=(i/5)*Math.PI*2;
      const point=mesh(new THREE.ConeGeometry(.035,.15,5),gold,head,Math.cos(a)*.16,.52,Math.sin(a)*.13);
      point.rotation.z=Math.cos(a)*-.28;
    }
    // Green shoulder mantle and long split back cape
    const cape=mesh(new THREE.ConeGeometry(.48,1.55,8,1,true),darkGreen,group,0,2.08,-.24,1,1,.28);
    cape.rotation.x=-.06;
    for(const s of [-1,1]){
      const flap=mesh(new THREE.BoxGeometry(.16,1.38,.045),ivory,group,s*.24,1.84,-.31);
      flap.rotation.z=s*.12;
      const edge=mesh(new THREE.BoxGeometry(.025,1.2,.025),green,group,s*.31,1.83,-.27);
      edge.rotation.z=s*.12;
    }
    // Small ornamental inlays across the coat
    for(let i=0;i<4;i++){
      const stripe=mesh(new THREE.BoxGeometry(.26,.025,.025),gold,group,0,2.08-i*.23,.35);
      stripe.rotation.z=(i%2?-.08:.08);
    }
    return group;
  }
  // Build a lightweight humanoid rig for unrigged GLB assets.
  // Geometry is baked into normalized model space, then weighted to nearby bone segments.
  function prepareLoadedModel(object){
    object.updateMatrixWorld(true);
    const bounds=new THREE.Box3().setFromObject(object);
    const size=bounds.getSize(new THREE.Vector3());
    const height=Math.max(size.y,.01);
    const scale=3.65/height;
    const center=new THREE.Vector3((bounds.min.x+bounds.max.x)/2,bounds.min.y,(bounds.min.z+bounds.max.z)/2);
    const normalize=new THREE.Matrix4().makeScale(scale,scale,scale);
    normalize.premultiply(new THREE.Matrix4().makeTranslation(-center.x*scale,-center.y*scale,-center.z*scale));
    const inverseRoot=object.matrixWorld.clone().invert();
    const rigRoot=new THREE.Group();
    rigRoot.name='Silvanus_AutoRig';
    boneMap.clear();

    const rootBone=new THREE.Bone();rootBone.name='mixamorigHipsRoot';rootBone.position.set(0,0,0);rigRoot.add(rootBone);
    const bones=[];
    const boneWorld=new Map();
    function addBone(name,parent,x,y,z){
      const b=new THREE.Bone();b.name=name;
      const wp=new THREE.Vector3(x,y,z);
      const parentWp=boneWorld.get(parent)||new THREE.Vector3();
      b.position.copy(wp).sub(parentWp);parent.add(b);
      boneWorld.set(b,wp);bones.push(b);boneMap.set(name,b);return b;
    }
    const hips=addBone('mixamorigHips',rootBone,0,.91,0);
    const spine=addBone('mixamorigSpine',hips,0,1.55,0);
    const chest=addBone('mixamorigSpine1',spine,0,2.18,0);
    addBone('mixamorigSpine2',chest,0,2.53,0);
    const neck=addBone('mixamorigNeck',chest,0,2.98,0);
    addBone('mixamorigHead',neck,0,3.22,0);
    for(const side of ['Right','Left']){
      const sign=side==='Right'?1:-1;
      const upper=addBone('mixamorig'+side+'Arm',chest,sign*.34,2.63,0);
      const fore=addBone('mixamorig'+side+'ForeArm',upper,sign*.49,2.22,.015);
      addBone('mixamorig'+side+'Hand',fore,sign*.61,1.91,.025);
      const thigh=addBone('mixamorig'+side+'UpLeg',hips,sign*.16,.82,0);
      const shin=addBone('mixamorig'+side+'Leg',thigh,sign*.17,.45,0);
      addBone('mixamorig'+side+'Foot',shin,sign*.17,.10,.06);
    }
    rigRoot.updateMatrixWorld(true);
    const boneIndex=new Map(bones.map((b,i)=>[b,i]));
    const segments=[];
    for(const b of bones){
      for(const child of b.children){
        if(!child.isBone) continue;
        const a=boneWorld.get(b)||new THREE.Vector3(), z=boneWorld.get(child)||new THREE.Vector3();
        segments.push({index:boneIndex.get(b),a:a.clone(),z:z.clone()});
      }
    }
    // If source nodes contain meshes, preserve each material while baking transforms.
    object.traverse(node=>{
      if(!node.isMesh || !node.geometry) return;
      const geometry=node.geometry.clone();
      const relative=inverseRoot.clone().multiply(node.matrixWorld);
      const transform=normalize.clone().multiply(relative);
      geometry.applyMatrix4(transform);
      const pos=geometry.getAttribute('position');
      const count=pos.count;
      const joints=new Uint16Array(count*4), weights=new Float32Array(count*4);
      const p=new THREE.Vector3();
      const nearestD=new Float32Array(4), nearestJ=new Int32Array(4);
      for(let i=0;i<count;i++){
        const px=pos.getX(i),py=pos.getY(i),pz=pos.getZ(i);
        nearestD.fill(Infinity);nearestJ.fill(0);
        for(let j=0;j<segments.length;j++){
          const s=segments[j], ax=s.a.x,ay=s.a.y,az=s.a.z;
          const abx=s.z.x-ax,aby=s.z.y-ay,abz=s.z.z-az;
          const denom=Math.max(abx*abx+aby*aby+abz*abz,1e-8);
          const apx=px-ax,apy=py-ay,apz=pz-az;
          const t=THREE.MathUtils.clamp((apx*abx+apy*aby+apz*abz)/denom,0,1);
          const dx=px-(ax+abx*t),dy=py-(ay+aby*t),dz=pz-(az+abz*t);
          const d=Math.sqrt(dx*dx+dy*dy+dz*dz);
          if(d<nearestD[3]){
            let k=3;
            while(k>0 && d<nearestD[k-1]){nearestD[k]=nearestD[k-1];nearestJ[k]=nearestJ[k-1];k--;}
            nearestD[k]=d;nearestJ[k]=j;
          }
        }
        let sum=0;
        for(let k=0;k<4;k++){
          const w=1/Math.pow(nearestD[k]+.035,3);
          joints[i*4+k]=segments[nearestJ[k]].index;weights[i*4+k]=w;sum+=w;
        }
        for(let k=0;k<4;k++) weights[i*4+k]/=sum||1;
      }
      geometry.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(joints,4));
      geometry.setAttribute('skinWeight',new THREE.Float32BufferAttribute(weights,4));
      const skinned=new THREE.SkinnedMesh(geometry,node.material);
      skinned.name=node.name||'SilvanusPart';
      skinned.castShadow=true;skinned.receiveShadow=true;
      if(skinned.material){const materials=Array.isArray(skinned.material)?skinned.material:[skinned.material];
        for(const material of materials){if(material.map)material.map.colorSpace=THREE.SRGBColorSpace;material.needsUpdate=true;}
      }
      rigRoot.add(skinned);
      skinned.bind(new THREE.Skeleton(bones));
    });
    rigRoot.updateMatrixWorld(true);
    // Rebind after every mesh has its final world matrix.
    const skeleton=new THREE.Skeleton(bones);
    for(const child of rigRoot.children) if(child.isSkinnedMesh) child.bind(skeleton);
    rigRoot.userData.autoRig=true;
    return rigRoot;
  }
  function startLobby(){
    host.classList.add('khl-has-3d');
    status.classList.add('is-hidden');status.textContent='';
    playEmote(root.querySelector('#khlobbyCurrentEmote')?.value||'wave');
    resize();
    tick();
  }
  // Prefer the user's actual Silvanus X Suit asset when it is published in the app.
  // If the GLB is absent or invalid, keep the lobby available with its existing rigged fallback.
  const modelLoader=new GLTFLoader();
  modelLoader.load('assets/silvanus_x_suit_3d_model.glb',gltf=>{
    model=prepareLoadedModel(gltf.scene);
    scene.add(model);
    // The supplied Silvanus GLB has no character skeleton; its only animation
    // targets a camera. Never play camera-only clips as a character idle.
    const rigBoneNames=new Set();
    model.traverse(node=>{if(node.isBone)rigBoneNames.add(node.name);});
    clips=(gltf.animations||[]).filter(clip=>{
      const tracks=clip.tracks||[];
      return tracks.length>0 && tracks.some(track=>{
        const targetName=String(track.name||"").split(".")[0].split("/").pop();
        return rigBoneNames.has(targetName) || /mixamorig|\b(bone|spine|head|arm|leg|hand|foot|hips|neck)\b/i.test(targetName);
      });
    });
    if(clips.length){
      mixer=new THREE.AnimationMixer(model);
      const idle=clips.find(c=>/idle|stand|breath/i.test(c.name))||null;
      if(idle){idleAction=mixer.clipAction(idle);idleAction.play();currentAction=idleAction;}
    }
    startLobby();
  },undefined,error=>{
    console.warn('Silvanus GLB asset is not published in app assets; opening the public model preview.',error);
    // Keep the exact Silvanus X Suit visible instead of silently showing the generic fallback.
    // The embedded preview is viewable while the local rigged GLB is unavailable.
    status.textContent='Silvanus X Suit · 3D preview';
    status.classList.remove('is-error');
    const preview=document.createElement('iframe');
    preview.title='Silvanus X Suit 3D model preview';
    preview.src='https://sketchfab.com/models/241373189f2e4c63b26ae1aede43ca4b/embed?autostart=1&ui_theme=dark&dnt=1';
    preview.loading='eager';
    preview.allow='autoplay; fullscreen; xr-spatial-tracking';
    preview.setAttribute('allowfullscreen','');
    preview.setAttribute('frameborder','0');
    preview.referrerPolicy='strict-origin-when-cross-origin';
    preview.style.cssText='position:absolute;inset:0;width:100%;height:100%;border:0;border-radius:inherit;background:#080b10;z-index:4';
    host.style.position='relative';
    host.appendChild(preview);
    canvas.style.visibility='hidden';
    status.style.zIndex='5';
    status.style.pointerEvents='none';
    startLobby();
  });
  window.addEventListener('pagehide',()=>{cancelAnimationFrame(raf);observer.disconnect();renderer.dispose();},{once:true});
})();