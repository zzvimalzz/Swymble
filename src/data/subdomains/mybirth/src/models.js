/* ============================================================
   models.js — builds the four almanac objects:

     · zodiacAnimalObject  — one animal split out of the shared
       animals_of_the_chinese_zodiac.glb, tinted by its element
     · gemstoneObject      — the right cut from gemstone_cuts.glb,
       recoloured for the birth month's stone
     · constellationObject — the star sign, charted in real 3D
     · flowerObject        — a parametric low-poly birth flower

   All return a normalised object ready for viewer.setObject().
   ============================================================ */

import * as THREE from "three";
import { loadGLB, normalizeObject } from "./viewer.js";
import { CONSTELLATIONS } from "./cosmos.js";

const ANIMALS_URL = "/models/mybirth/animals_of_the_chinese_zodiac.glb";
const GEMS_URL = "/models/mybirth/gemstone_cuts.glb";

/** Warm the GLB cache while the loading veil is up. */
export function prefetchModelAssets() {
  loadGLB(ANIMALS_URL).catch(() => {});
  loadGLB(GEMS_URL).catch(() => {});
}

/* ============================================================
   CHINESE ZODIAC — split one named animal out of the pack
   ============================================================ */

// the figurine finish per Chinese element
const ELEMENT_FINISH = {
  Metal: { color: 0xd4d9e2, metalness: 0.85, roughness: 0.32 },
  Water: { color: 0x6b9bd8, metalness: 0.3, roughness: 0.26 },
  Wood: { color: 0x7da06b, metalness: 0.25, roughness: 0.42 },
  Fire: { color: 0xd05a41, metalness: 0.35, roughness: 0.3 },
  Earth: { color: 0xc19a5b, metalness: 0.5, roughness: 0.38 },
};

export async function zodiacAnimalObject(animal, element) {
  const gltf = await loadGLB(ANIMALS_URL);
  gltf.scene.updateMatrixWorld(true);

  const source = gltf.scene.getObjectByName(animal);
  if (!source) throw new Error(`animal "${animal}" not found in GLB`);

  // clone the node and bake its full world transform (the Sketchfab
  // root carries the up-axis correction) so it stands upright alone
  const clone = source.clone(true);
  clone.matrixAutoUpdate = true;
  clone.matrix.copy(source.matrixWorld);
  clone.matrix.decompose(clone.position, clone.quaternion, clone.scale);

  const finish = ELEMENT_FINISH[element] || ELEMENT_FINISH.Earth;
  const material = new THREE.MeshStandardMaterial({
    ...finish,
    envMapIntensity: 0.9,
  });
  clone.traverse((child) => {
    if (child.isMesh) child.material = material;
  });

  return normalizeObject(clone, 2.15);
}

/* ============================================================
   BIRTHSTONE — one cut per stone, recoloured per month
   ============================================================ */

// stone → which cut geometry to borrow, and how the material behaves
export const STONE_CUTS = {
  Garnet: { cut: "Round Cut", finish: "faceted" },
  Amethyst: { cut: "Emerald Square Cut", finish: "faceted" },
  Aquamarine: { cut: "Oval Cut", finish: "faceted" },
  Diamond: { cut: "Diamond", finish: "faceted" },
  Emerald: { cut: "Emerald Cut", finish: "faceted" },
  Pearl: { cut: "Round Cabochon", finish: "pearl" },
  Ruby: { cut: "Heart Cut", finish: "faceted" },
  Peridot: { cut: "Marquise Cut", finish: "faceted" },
  Sapphire: { cut: "Square Cut", finish: "faceted" },
  Opal: { cut: "Oval Cabochon", finish: "opal" },
  Topaz: { cut: "Pear Cut", finish: "faceted" },
  Turquoise: { cut: "Round Cabochon", finish: "opaque" },
};

// Node names arrive doubly mangled: the source file writes "Cabochon"
// with a Cyrillic "С", and GLTFLoader then sanitizes names for animation
// binding ("Square Cut.1_81" → "Square_Cut1_81"). Compare alphanumeric-
// only forms so neither transformation matters.
function keyName(name) {
  return name
    .normalize("NFKD")
    .replace(/[^\x20-\x7E]/g, "C")
    .replace(/[^A-Za-z0-9]/g, "");
}

function findCutMesh(root, cutName) {
  const wanted = `${keyName(cutName)}1`; // first instance of the cut
  let found = null;
  root.traverse((node) => {
    if (found) return;
    if (keyName(node.name).startsWith(wanted)) found = node;
  });
  if (!found) return null;
  let mesh = null;
  found.traverse((child) => {
    if (!mesh && child.isMesh) mesh = child;
  });
  return mesh;
}

function gemMaterial(finish, colors) {
  const base = new THREE.Color(colors.base);
  const glow = new THREE.Color(colors.glow);

  if (finish === "pearl") {
    return new THREE.MeshPhysicalMaterial({
      color: base, metalness: 0, roughness: 0.2,
      clearcoat: 0.9, clearcoatRoughness: 0.3,
      sheen: 1, sheenColor: glow, sheenRoughness: 0.4,
      iridescence: 0.45, iridescenceIOR: 1.3,
      envMapIntensity: 1.1,
    });
  }
  if (finish === "opal") {
    return new THREE.MeshPhysicalMaterial({
      color: base, metalness: 0, roughness: 0.28,
      clearcoat: 1, clearcoatRoughness: 0.12,
      iridescence: 1, iridescenceIOR: 1.9,
      envMapIntensity: 1.2,
    });
  }
  if (finish === "opaque") {
    return new THREE.MeshPhysicalMaterial({
      color: base, metalness: 0, roughness: 0.32,
      clearcoat: 0.7, clearcoatRoughness: 0.2,
      envMapIntensity: 1,
    });
  }
  // faceted, transparent stone
  return new THREE.MeshPhysicalMaterial({
    color: base, metalness: 0, roughness: 0.05,
    transmission: 0.8, thickness: 1.6, ior: 2.0,
    clearcoat: 1, clearcoatRoughness: 0.05,
    attenuationColor: base, attenuationDistance: 2.4,
    specularIntensity: 1, envMapIntensity: 1.5,
  });
}

export async function gemstoneObject(stone, colors) {
  const gltf = await loadGLB(GEMS_URL);
  gltf.scene.updateMatrixWorld(true);

  const spec = STONE_CUTS[stone] || STONE_CUTS.Diamond;
  const sourceMesh = findCutMesh(gltf.scene, spec.cut);
  if (!sourceMesh) throw new Error(`cut "${spec.cut}" not found in GLB`);

  // bake the mesh's world transform into a fresh geometry so the
  // stone sits alone at the origin, not at its slot in the tray
  const geometry = sourceMesh.geometry.clone();
  geometry.applyMatrix4(sourceMesh.matrixWorld);
  geometry.center();

  const mesh = new THREE.Mesh(geometry, gemMaterial(spec.finish, colors));
  // rotate so the gem stands upright (crown facing viewer) rather than lying flat
  mesh.rotation.x = Math.PI / 2;
  return normalizeObject(mesh, 1.9);
}

/* ============================================================
   STAR SIGN — the constellation as a floating 3D chart
   ============================================================ */

let glowTexture = null;
function getGlowTexture() {
  if (glowTexture) return glowTexture;
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const ctx = c.getContext("2d");
  const g = ctx.createRadialGradient(64, 64, 4, 64, 64, 64);
  g.addColorStop(0, "rgba(255,252,240,1)");
  g.addColorStop(0.25, "rgba(228,222,255,0.45)");
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  glowTexture = new THREE.CanvasTexture(c);
  return glowTexture;
}

export function constellationObject(sign) {
  const chart = CONSTELLATIONS[sign];
  const group = new THREE.Group();
  if (!chart) return group;

  // lift the flat chart into space: gentle deterministic depth per star
  const points = chart.stars.map(([x, y], i) => new THREE.Vector3(
    (x - 0.5) * 3.1,
    (0.5 - y) * 2.5,
    ((i * 0.618034) % 1 - 0.5) * 1.1,
  ));

  const starMat = new THREE.SpriteMaterial({
    map: getGlowTexture(),
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  points.forEach((p, i) => {
    const major = i % 3 === 0;
    const sprite = new THREE.Sprite(starMat.clone());
    sprite.material.opacity = major ? 1 : 0.75;
    sprite.position.copy(p);
    sprite.scale.setScalar(major ? 0.44 : 0.28);
    group.add(sprite);

    const core = new THREE.Mesh(
      new THREE.SphereGeometry(major ? 0.035 : 0.022, 12, 12),
      new THREE.MeshBasicMaterial({ color: 0xfffaf0 }),
    );
    core.position.copy(p);
    group.add(core);
  });

  // the joining lines
  const linePositions = [];
  chart.lines.forEach(([a, b]) => {
    linePositions.push(
      points[a].x, points[a].y, points[a].z,
      points[b].x, points[b].y, points[b].z,
    );
  });
  const lineGeo = new THREE.BufferGeometry();
  lineGeo.setAttribute("position", new THREE.Float32BufferAttribute(linePositions, 3));
  group.add(new THREE.LineSegments(
    lineGeo,
    new THREE.LineBasicMaterial({ color: 0x9a7ff0, transparent: true, opacity: 0.55 }),
  ));

  // a faint armillary ring gives the chart its instrument feel
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(1.85, 0.0045, 8, 128),
    new THREE.MeshBasicMaterial({ color: 0xecd9ac, transparent: true, opacity: 0.28 }),
  );
  ring.rotation.x = Math.PI / 2 - 0.42;
  group.add(ring);

  const ring2 = ring.clone();
  ring2.material = ring.material.clone();
  ring2.material.opacity = 0.14;
  ring2.rotation.x = Math.PI / 2 - 0.42;
  ring2.rotation.y = 1.2;
  ring2.scale.setScalar(0.92);
  group.add(ring2);

  // the ring bounds every sign identically, so all charts frame the same
  return normalizeObject(group, 2.35);
}

/* ============================================================
   BIRTH FLOWER — parametric low-poly bloom, one recipe per month
   ============================================================ */

const FLOWERS = {
  "Carnation": { petals: 12, layers: 3, len: 0.85, wid: 0.5, curl: 0.5, tilt: 1.05, color: "#e56b8b", center: "cluster", centerColor: "#f2a9bd" },
  "Violet": { petals: 5, layers: 1, len: 1.05, wid: 0.78, curl: 0.28, tilt: 1.15, color: "#7b5fd0", center: "disc", centerColor: "#f2d15f" },
  "Daffodil": { petals: 6, layers: 1, len: 1.05, wid: 0.58, curl: 0.16, tilt: 1.2, color: "#f5e9b0", center: "trumpet", centerColor: "#eeb63a" },
  "Daisy": { petals: 18, layers: 1, len: 1.05, wid: 0.3, curl: 0.2, tilt: 1.12, color: "#f4f2ec", center: "disc", centerColor: "#e9b73f" },
  "Lily of the Valley": { petals: 6, layers: 1, len: 0.8, wid: 0.6, curl: 0.85, tilt: 0.6, color: "#f2f4ee", center: "cluster", centerColor: "#dfe7d4" },
  "Rose": { petals: 8, layers: 4, len: 0.8, wid: 0.66, curl: 0.68, tilt: 0.8, color: "#c22b3f", center: "cluster", centerColor: "#8f1e30" },
  "Larkspur": { petals: 5, layers: 2, len: 0.98, wid: 0.62, curl: 0.32, tilt: 1.1, color: "#5f74d8", center: "disc", centerColor: "#eef0ff" },
  "Gladiolus": { petals: 6, layers: 2, len: 1.0, wid: 0.6, curl: 0.42, tilt: 1.0, color: "#d8566b", center: "cluster", centerColor: "#f0a5b2" },
  "Aster": { petals: 21, layers: 2, len: 1.0, wid: 0.24, curl: 0.24, tilt: 1.3, color: "#8d7be8", center: "disc", centerColor: "#e9b73f" },
  "Marigold": { petals: 15, layers: 3, len: 0.72, wid: 0.46, curl: 0.55, tilt: 0.95, color: "#e8912b", center: "cluster", centerColor: "#c96f1a" },
  "Chrysanthemum": { petals: 22, layers: 3, len: 0.9, wid: 0.26, curl: 0.45, tilt: 1.05, color: "#e3c04c", center: "cluster", centerColor: "#caa53a" },
  "Narcissus": { petals: 6, layers: 1, len: 1.05, wid: 0.58, curl: 0.16, tilt: 1.2, color: "#f6f3e6", center: "trumpet", centerColor: "#e2862f" },
};

/** A single petal: a subdivided plane shaped into a cupped teardrop. */
function petalGeometry(len, wid, curl) {
  const geo = new THREE.PlaneGeometry(wid, len, 5, 10);
  geo.translate(0, len / 2, 0); // base of the petal at the origin
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const t = y / len; // 0 at base → 1 at tip
    // teardrop silhouette
    const profile = Math.sin(Math.min(1, t * 1.12) * Math.PI) * (0.35 + 0.65 * (1 - t * 0.4));
    pos.setX(i, x * profile);
    // curl back along the length, cup across the width
    const cup = (x / (wid / 2 || 1)) ** 2 * wid * 0.22;
    pos.setZ(i, -(t * t) * curl + cup * (1 - t * 0.5));
  }
  geo.computeVertexNormals();
  return geo;
}

export function flowerObject(flower) {
  const spec = FLOWERS[flower] || FLOWERS.Daisy;
  const group = new THREE.Group();

  const petalMat = new THREE.MeshStandardMaterial({
    color: spec.color,
    roughness: 0.55,
    metalness: 0.05,
    side: THREE.DoubleSide,
    envMapIntensity: 0.5,
  });
  const innerMat = petalMat.clone();
  innerMat.color = petalMat.color.clone().lerp(new THREE.Color("#ffffff"), 0.18);

  for (let layer = 0; layer < spec.layers; layer++) {
    const layerScale = 1 - layer * (0.55 / Math.max(1, spec.layers));
    const geo = petalGeometry(spec.len * layerScale, spec.wid * layerScale, spec.curl);
    const angleOffset = (layer * Math.PI) / spec.petals;
    // inner layers stand more upright, like a real bloom closing inward
    const tilt = spec.tilt - layer * 0.28;

    for (let i = 0; i < spec.petals; i++) {
      const petal = new THREE.Mesh(geo, layer === spec.layers - 1 && spec.layers > 1 ? innerMat : petalMat);
      petal.rotation.x = tilt;
      const arm = new THREE.Group();
      arm.add(petal);
      arm.rotation.y = (i / spec.petals) * Math.PI * 2 + angleOffset;
      group.add(arm);
    }
  }

  // the centre
  if (spec.center === "disc") {
    const disc = new THREE.Mesh(
      new THREE.SphereGeometry(0.26, 20, 14),
      new THREE.MeshStandardMaterial({ color: spec.centerColor, roughness: 0.7 }),
    );
    disc.scale.y = 0.45;
    disc.position.y = 0.08;
    group.add(disc);
  } else if (spec.center === "trumpet") {
    const trumpetMat = new THREE.MeshStandardMaterial({
      color: spec.centerColor, roughness: 0.5, side: THREE.DoubleSide,
    });
    const trumpet = new THREE.Mesh(
      new THREE.CylinderGeometry(0.3, 0.15, 0.42, 24, 1, true),
      trumpetMat,
    );
    trumpet.position.y = 0.24;
    group.add(trumpet);
    const base = new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 12), trumpetMat);
    base.scale.y = 0.5;
    base.position.y = 0.05;
    group.add(base);
  } else {
    // cluster of buds
    const budMat = new THREE.MeshStandardMaterial({ color: spec.centerColor, roughness: 0.6 });
    for (let i = 0; i < 7; i++) {
      const bud = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 10), budMat);
      const a = (i / 7) * Math.PI * 2;
      const r = i === 0 ? 0 : 0.13;
      bud.position.set(Math.cos(a) * r, 0.12 + (i === 0 ? 0.05 : 0), Math.sin(a) * r);
      group.add(bud);
    }
  }

  // present the bloom leaning toward the viewer
  const tilted = new THREE.Group();
  tilted.add(group);
  group.rotation.x = 0.62;
  return normalizeObject(tilted, 2.0);
}
