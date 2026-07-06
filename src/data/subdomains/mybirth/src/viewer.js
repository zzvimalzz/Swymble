/* ============================================================
   viewer.js — the shared 3D system for every model on the page.

   One GLTFLoader with a promise cache (each GLB is fetched once),
   one requestAnimationFrame loop ticking every mounted viewer,
   one lighting rig and one interaction model:

     · gentle auto-rotate while idle
     · drag to turn the OBJECT (never the camera — lights and
       phase/terminator stay fixed in world space)
     · inertia on release, then auto-rotate resumes

   Viewers pause rendering entirely while off-screen.
   ============================================================ */

import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

/* ---------- shared GLB loading (fetch + parse once per URL) ---------- */
const gltfLoader = new GLTFLoader();
const glbCache = new Map();

export function loadGLB(url) {
  if (!glbCache.has(url)) {
    glbCache.set(
      url,
      new Promise((resolve, reject) => gltfLoader.load(url, resolve, undefined, reject)),
    );
  }
  return glbCache.get(url);
}

/* ---------- shared render loop ---------- */
const activeViewers = new Set();
let rafId = null;
let lastNow = 0;

function loop(now) {
  rafId = requestAnimationFrame(loop);
  const dt = Math.min(0.05, (now - lastNow) / 1000 || 0.016);
  lastNow = now;
  for (const v of activeViewers) v._tick(dt, now);
}
function wakeLoop() {
  if (rafId == null) {
    lastNow = performance.now();
    rafId = requestAnimationFrame(loop);
  }
}
function maybeSleepLoop() {
  if (!activeViewers.size && rafId != null) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
}

/* ---------- helpers ---------- */

/** Centre an object on its bounding box and scale its longest side to `size`. */
export function normalizeObject(object, size = 2) {
  const box = new THREE.Box3().setFromObject(object);
  const center = box.getCenter(new THREE.Vector3());
  const dims = box.getSize(new THREE.Vector3());
  const maxAxis = Math.max(dims.x, dims.y, dims.z) || 1;
  const wrapper = new THREE.Group();
  object.position.sub(center);
  wrapper.add(object);
  wrapper.scale.setScalar(size / maxAxis);
  return wrapper;
}

/** The one studio rig every plate shares — key, fill, rim. */
function addStudioRig(scene) {
  const key = new THREE.DirectionalLight(0xfff2df, 2.4);
  key.position.set(3.2, 4.2, 5.2);
  scene.add(key);

  const fill = new THREE.DirectionalLight(0x8ea4e8, 0.55);
  fill.position.set(-4.2, -1.2, 2.4);
  scene.add(fill);

  const rim = new THREE.DirectionalLight(0xcdb9ff, 1.1);
  rim.position.set(-1.6, 2.4, -5);
  scene.add(rim);

  scene.add(new THREE.AmbientLight(0x1c2238, 0.9));
}

/* ---------- the viewer ---------- */

/**
 * A self-contained viewer: transparent canvas, fixed camera, and a pivot
 * group the user can spin. Returns { mount, setObject, scene, onTick }.
 */
export function createViewer(options = {}) {
  const {
    fov = 30,
    cameraZ = 4.8,
    cameraY = 0,
    studioRig = true,
    environment = true,
    exposure = 1,
    toneMapped = true,
    autoRotateSpeed = 0.22, // rad/s while idle
    maxTilt = 0.5,          // vertical drag clamp, radians
    idleDelay = 2.4,        // seconds after release before auto-rotate resumes
  } = options;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  if (toneMapped) {
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = exposure;
  }

  const scene = new THREE.Scene();
  if (environment) {
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();
  }
  if (studioRig) addStudioRig(scene);

  const camera = new THREE.PerspectiveCamera(fov, 1, 0.1, 100);
  camera.position.set(0, cameraY, cameraZ);
  camera.lookAt(0, 0, 0);

  // everything the user can spin lives under this pivot
  const pivot = new THREE.Group();
  scene.add(pivot);

  /* --- interaction: drag turns the pivot, not the camera --- */
  let dragging = false;
  let lastX = 0;
  let lastY = 0;
  let velocityY = 0;   // yaw inertia
  let idleTimer = 0;

  const el = renderer.domElement;
  el.style.touchAction = "pan-y";
  el.style.cursor = "grab";

  el.addEventListener("pointerdown", (e) => {
    dragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
    velocityY = 0;
    el.setPointerCapture(e.pointerId);
    el.style.cursor = "grabbing";
  });
  el.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    lastX = e.clientX;
    lastY = e.clientY;
    pivot.rotation.y += dx * 0.008;
    pivot.rotation.x = THREE.MathUtils.clamp(pivot.rotation.x + dy * 0.005, -maxTilt, maxTilt);
    velocityY = dx * 0.008 * 60; // rad/s estimate for inertia
    idleTimer = 0;
  });
  const release = (e) => {
    if (!dragging) return;
    dragging = false;
    try { el.releasePointerCapture(e.pointerId); } catch {}
    el.style.cursor = "grab";
  };
  el.addEventListener("pointerup", release);
  el.addEventListener("pointercancel", release);

  /* --- mounting / visibility --- */
  let mounted = null;
  let resizeObserver = null;
  let intersectionObserver = null;
  let visible = false;

  function resize() {
    if (!mounted) return;
    const w = mounted.clientWidth || 1;
    const h = mounted.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  function setActive(on) {
    if (on && !activeViewers.has(api)) {
      activeViewers.add(api);
      wakeLoop();
    } else if (!on && activeViewers.has(api)) {
      activeViewers.delete(api);
      maybeSleepLoop();
    }
  }

  function mount(target) {
    mounted = target;
    target.appendChild(el);
    el.style.width = "100%";
    el.style.height = "100%";
    el.style.display = "block";
    resize();

    if (resizeObserver) resizeObserver.disconnect();
    resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(target);

    if (intersectionObserver) intersectionObserver.disconnect();
    intersectionObserver = new IntersectionObserver((entries) => {
      visible = entries.some((entry) => entry.isIntersecting);
      setActive(visible);
    }, { rootMargin: "120px" });
    intersectionObserver.observe(target);

    // the object may have finished loading before we were mounted
    if (pivot.children.length) target.classList.add("is-ready");
  }

  function setObject(object) {
    pivot.clear();
    pivot.rotation.set(0, 0, 0);
    pivot.add(object);
    if (mounted) mounted.classList.add("is-ready");
  }

  /* --- per-frame --- */
  let onTick = null;

  const api = {
    mount,
    setObject,
    scene,
    camera,
    pivot,
    renderer,
    set onTick(fn) { onTick = fn; },
    _tick(dt, now) {
      if (!dragging) {
        // inertia decays into the idle auto-rotate
        velocityY *= Math.pow(0.0025, dt); // ~exponential decay
        idleTimer += dt;
        const auto = idleTimer > idleDelay ? autoRotateSpeed : 0;
        pivot.rotation.y += (velocityY + auto) * dt;
        // ease tilt back to level while idle
        if (idleTimer > idleDelay) pivot.rotation.x *= Math.pow(0.25, dt);
      }
      if (onTick) onTick(dt, now);
      renderer.render(scene, camera);
    },
  };

  return api;
}
