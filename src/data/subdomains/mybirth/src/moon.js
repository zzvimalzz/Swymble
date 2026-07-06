/* ============================================================
   moon.js — renders the shared moon.glb with true phase lighting.

   The phase is physically staged: one directional "sun" is fixed
   in WORLD space at the elongation angle for the real lunar phase,
   and the camera never moves. Dragging spins the moon itself —
   craters turn under the light exactly like the real moon rotating
   under the real sun — so the terminator (the phase) stays put
   no matter how the visitor plays with it.
   ============================================================ */

import * as THREE from "three";
import { createViewer, loadGLB, normalizeObject } from "./viewer.js";

const MOON_MODEL_URL = "/models/mybirth/moon.glb";

export function createMoon() {
  const viewer = createViewer({
    fov: 32,
    cameraZ: 4.3,
    studioRig: false,     // the moon has exactly one light: the sun
    environment: false,
    toneMapped: false,    // keep the terminator contrast crisp
    autoRotateSpeed: 0.05,
    maxTilt: 0.45,
  });
  const { scene } = viewer;

  // the sun — anchored in world space, positioned by setPhase()
  const sun = new THREE.DirectionalLight(0xfff6e6, 3.4);
  sun.position.set(0, 0.84, 6);
  scene.add(sun);
  // earthshine: keeps the dark limb faintly readable, even at new moon
  scene.add(new THREE.AmbientLight(0x2a3452, 0.55));

  const haloMat = new THREE.SpriteMaterial({
    map: buildHalo(),
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    opacity: 0.55,
  });
  const halo = new THREE.Sprite(haloMat);
  halo.scale.set(3.4, 3.4, 1);
  halo.position.z = -0.6;
  scene.add(halo);

  // the moon's axial tilt, then the model inside it
  const tilt = new THREE.Group();
  tilt.rotation.z = THREE.MathUtils.degToRad(6.7);

  loadGLB(MOON_MODEL_URL)
    .then((gltf) => {
      tilt.add(normalizeMoonModel(gltf.scene));
      viewer.setObject(tilt);
    })
    .catch(() => {
      tilt.add(createFallbackMoonMesh());
      viewer.setObject(tilt);
    });

  function setPhase(fraction) {
    // Camera looks down -Z from +Z. psi=0 (new moon): sun behind the
    // moon at -Z → the face we see is dark. psi=π (full): sun behind
    // the camera at +Z → the face we see is fully lit.
    const psi = fraction * Math.PI * 2;
    sun.position.set(Math.sin(psi) * 6, 0.84, -Math.cos(psi) * 6);
    const illum = (1 - Math.cos(psi)) / 2;
    halo.material.opacity = 0.16 + illum * 0.5;
  }

  return { mount: viewer.mount, setPhase };
}

function normalizeMoonModel(model) {
  model.traverse((child) => {
    if (!child.isMesh) return;
    child.castShadow = false;
    child.receiveShadow = false;
    const materials = Array.isArray(child.material) ? child.material : [child.material];
    materials.filter(Boolean).forEach(tuneMoonMaterial);
  });
  return normalizeObject(model, 2);
}

function tuneMoonMaterial(material) {
  if ("roughness" in material) {
    material.roughness = Math.max(material.roughness ?? 0.96, 0.88);
  }
  if ("metalness" in material) {
    material.metalness = 0;
  }
  if (material.map) {
    material.map.colorSpace = THREE.SRGBColorSpace;
  }
  material.needsUpdate = true;
}

function createFallbackMoonMesh() {
  return new THREE.Mesh(
    new THREE.SphereGeometry(1, 96, 96),
    new THREE.MeshStandardMaterial({
      color: 0x9a958d,
      roughness: 0.96,
      metalness: 0,
    }),
  );
}

function buildHalo() {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const ctx = c.getContext("2d");
  const g = ctx.createRadialGradient(128, 128, 30, 128, 128, 128);
  g.addColorStop(0, "rgba(236,226,200,0.5)");
  g.addColorStop(0.4, "rgba(150,150,190,0.12)");
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(c);
}
