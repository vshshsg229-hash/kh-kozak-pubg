/* KH么Kozak Battle Hub — real rigged 3D lobby character.
 * Loads a public, animated GLB soldier with Three.js. The illustrated figure is hidden
 * only after the 3D model has loaded successfully; a clear status is shown on failure.
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
  canvas.setAttribute('aria-label', 'Справжній 3D-персонаж із кістковою анімацією');
  canvas.setAttribute('role', 'img');
  const status = document.createElement('div');
  status.className = 'khl-real3d-status';
  status.setAttribute('role', 'status');
  status.textContent = 'Завантаження 3D-персонажа…';
  host.append(canvas, status);

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  camera.position.set(0, 2.45, 8.7);
  camera.lookAt(0, 2.1, 0);
  scene.add(new THREE.HemisphereLight(0xe5f4ff, 0x37402f, 2.2));
  const key = new THREE.DirectionalLight(0xffedcf, 3.2);
  key.position.set(-3, 7, 5);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.left = -4; key.shadow.camera.right = 4;
  key.shadow.camera.top = 7; key.shadow.camera.bottom = -2;
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x6dcfff, 2.1);
  rim.position.set(4, 4, -4);
  scene.add(rim);

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(20, 20),
    new THREE.ShadowMaterial({ opacity: 0.23 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = 0.015;
  floor.receiveShadow = true;
  scene.add(floor);

  let model = null, mixer = null, idleAction = null, currentAction = null;
  let bones = {}, baseRotations = new Map(), activeEmote = 'wave';
  let targetYaw = 0, dragging = false, lastX = 0, lastTime = 0, raf = 0;
  const clock = new THREE.Clock();
  const emotes = {
    wave: 'Привітання', dance: 'Танець', victory: 'Перемога',
    salute: 'Салют', heart: 'Серце', bow: 'Поклін'
  };

  function resize() {
    const w = Math.max(1, host.clientWidth), h = Math.max(1, host.clientHeight);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  const observer = new ResizeObserver(resize);
  observer.observe(host);
  resize();

  function findBone(patterns) {
    for (const [name, bone] of Object.entries(bones)) {
      if (patterns.some(p => p.test(name))) return bone;
    }
    return null;
  }
  function rememberBone(name, bone) {
    bones[name] = bone;
    baseRotations.set(bone, bone.quaternion.clone());
  }
  function boneRotation(patterns, axis, amount) {
    const bone = findBone(patterns);
    if (!bone) return;
    const base = baseRotations.get(bone);
    if (!base) return;
    bone.quaternion.copy(base);
    const q = new THREE.Quaternion().setFromAxisAngle(axis, amount);
    bone.quaternion.multiply(q);
  }
  const X = new THREE.Vector3(1, 0, 0), Y = new THREE.Vector3(0, 1, 0), Z = new THREE.Vector3(0, 0, 1);

  function chooseAnimation(names) {
    if (!mixer) return false;
    const clips = mixer._root?.animations || [];
    const clip = clips.find(c => names.some(n => c.name.toLowerCase().includes(n.toLowerCase())));
    if (!clip) return false;
    const next = mixer.clipAction(clip);
    if (currentAction === next) return true;
    next.reset().fadeIn(0.2).play();
    if (currentAction) currentAction.fadeOut(0.2);
    currentAction = next;
    return true;
  }
  function playEmote(id) {
    activeEmote = emotes[id] ? id : 'wave';
    if (mixer && idleAction) {
      if (currentAction && currentAction !== idleAction) currentAction.fadeOut(0.18);
      idleAction.reset().fadeIn(0.2).play();
      currentAction = idleAction;
    }
    const btns = root.querySelectorAll('[data-khl-emote]');
    btns.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.khlEmote === activeEmote)));
    const label = root.querySelector('#khlobbyCurrentEmote');
    if (label) label.value = activeEmote;
    const toast = root.querySelector('#khlobbyEmoteToast');
    if (toast) {
      toast.textContent = ({wave:'👋',dance:'💃',victory:'🏆',salute:'🫡',heart:'🫶',bow:'🙇'}[activeEmote]) + ' ' + emotes[activeEmote].toUpperCase();
      toast.classList.add('show');
      clearTimeout(playEmote.toastTimer);
      playEmote.toastTimer = setTimeout(() => toast.classList.remove('show'), 1800);
    }
  }

  root.querySelectorAll('[data-khl-emote]').forEach(button => {
    button.addEventListener('click', () => playEmote(button.dataset.khlEmote));
  });
  root.querySelectorAll('[data-khl-rotate]').forEach(button => {
    button.addEventListener('click', () => {
      targetYaw += THREE.MathUtils.degToRad(Number(button.dataset.khlRotate) || 0);
    });
  });
  root.querySelector('[data-khl-reset]')?.addEventListener('click', () => { targetYaw = 0; playEmote('wave'); });
  canvas.addEventListener('pointerdown', e => { dragging = true; lastX = e.clientX; canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener('pointermove', e => {
    if (!dragging) return;
    targetYaw += (e.clientX - lastX) * 0.012;
    lastX = e.clientX;
  });
  canvas.addEventListener('pointerup', () => { dragging = false; });
  canvas.addEventListener('pointercancel', () => { dragging = false; });

  function tick() {
    raf = requestAnimationFrame(tick);
    const dt = Math.min(clock.getDelta(), 0.05);
    if (mixer) mixer.update(dt);
    if (model) {
      model.rotation.y = THREE.MathUtils.damp(model.rotation.y, targetYaw, 5, dt);
      const t = clock.elapsedTime;
      // Layered skeletal gestures on top of the model's idle motion; these are bone rotations, not image transforms.
      const wave = activeEmote === 'wave' ? Math.sin(t * 8) * 0.42 : 0;
      const dance = activeEmote === 'dance' ? Math.sin(t * 7) * 0.45 : 0;
      const raised = activeEmote === 'victory' ? -1.55 : activeEmote === 'salute' ? -1.05 : 0;
      const heart = activeEmote === 'heart' ? -0.48 : 0;
      const bow = activeEmote === 'bow' ? Math.sin(Math.min(t % 1.5, 0.75) / 0.75 * Math.PI) * 0.42 : 0;
      boneRotation([/rightarm/i, /right_arm/i], Z, wave + dance + raised + heart);
      boneRotation([/leftarm/i, /left_arm/i], Z, -dance + (activeEmote === 'victory' ? 1.45 : 0) + heart);
      boneRotation([/rightforearm/i, /right_forearm/i], X, activeEmote === 'salute' ? -1.0 : activeEmote === 'heart' ? -0.8 : 0);
      boneRotation([/leftforearm/i, /left_forearm/i], X, activeEmote === 'heart' ? 0.8 : 0);
      boneRotation([/spine/i, /mixamorigspine/i], X, bow);
      boneRotation([/head/i], X, -bow * 0.45);
      boneRotation([/rightupleg/i, /rightthigh/i], Z, activeEmote === 'dance' ? Math.sin(t * 7) * 0.16 : 0);
      boneRotation([/leftupleg/i, /leftthigh/i], Z, activeEmote === 'dance' ? -Math.sin(t * 7) * 0.16 : 0);
    }
    renderer.render(scene, camera);
  }

  const loader = new GLTFLoader();
  loader.load(
    'https://threejs.org/examples/models/gltf/Soldier.glb',
    gltf => {
      model = gltf.scene;
      model.traverse(obj => {
        if (obj.isMesh) { obj.castShadow = true; obj.receiveShadow = true; }
        if (obj.isBone) rememberBone(obj.name, obj);
      });
      const bounds = new THREE.Box3().setFromObject(model);
      const size = bounds.getSize(new THREE.Vector3());
      const scale = 4.25 / Math.max(size.y, 0.001);
      model.scale.setScalar(scale);
      const scaledBounds = new THREE.Box3().setFromObject(model);
      model.position.y -= scaledBounds.min.y;
      model.position.x -= (scaledBounds.min.x + scaledBounds.max.x) / 2;
      scene.add(model);
      const clips = gltf.animations || [];
      mixer = new THREE.AnimationMixer(model);
      mixer._root.animations = clips;
      const idle = clips.find(c => /idle/i.test(c.name)) || clips[0];
      if (idle) {
        idleAction = mixer.clipAction(idle);
        currentAction = idleAction;
        idleAction.play();
      }
      host.classList.add('khl-has-3d');
      status.classList.add('is-hidden');
      status.textContent = '';
      // Refresh the saved scene/controls after the model is ready.
      const saved = root.querySelector('#khlobbyCurrentEmote')?.value || activeEmote;
      playEmote(saved);
      resize();
    },
    progress => {
      if (progress.total) status.textContent = 'Завантаження 3D-персонажа… ' + Math.round(progress.loaded / progress.total * 100) + '%';
    },
    error => {
      console.error('KH Lobby 3D model failed to load', error);
      status.classList.add('is-error');
      status.textContent = '3D-модель не завантажилась. Перевір інтернет і натисни «Оновити».';
    }
  );
  tick();
  window.addEventListener('pagehide', () => { cancelAnimationFrame(raf); observer.disconnect(); renderer.dispose(); }, { once: true });
})();