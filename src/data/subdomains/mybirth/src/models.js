/* ============================================================
   models.js — builds the four almanac objects:

     · zodiacAnimalObject  — one animal split out of the shared
       animals_of_the_chinese_zodiac.glb, tinted by its element
     · gemstoneObject      — the right cut from gemstone_cuts.glb,
       recoloured for the birth month's stone
     · constellationObject — the star sign, charted in real 3D
     · flowerObject        — the month's birth flower, carved from a
       voxel lattice (see voxel.js) rather than folded from planes

   All return a normalised object ready for viewer.setObject().
   ============================================================ */

import * as THREE from "three";
import { loadGLB, normalizeObject } from "./viewer.js";
import { STAR_FIGURES } from "./starfigures.js";
import { voxelBuild, mix } from "./voxel.js";

/* Voxel edge length for the birth flowers. 0.048 puts ~44 voxels across a
   bloom — fine enough for a petal's taper to read, coarse enough that the
   whole lattice evaluates in a few milliseconds. */
const VOXEL_CELL = 0.048;

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
  Garnet: { cut: "Round Cut", finish: "faceted", tilt: 0.35 },
  Amethyst: { cut: "Emerald Square Cut", finish: "faceted" },
  Aquamarine: { cut: "Oval Cut", finish: "faceted" },
  Diamond: { cut: "Diamond", finish: "faceted" },
  Emerald: { cut: "Emerald Cut", finish: "faceted" },
  Pearl: { cut: "Round Cabochon", finish: "pearl" },
  Ruby: { cut: "Round Cut", finish: "faceted", tilt: 0.35 },
  Peridot: { cut: "Marquise Cut", finish: "faceted" },
  Sapphire: { cut: "Square Cut", finish: "faceted" },
  Opal: { cut: "Oval Cabochon", finish: "opal" },
  Topaz: { cut: "Pear Cut", finish: "faceted" },
  Turquoise: { cut: "Round Cabochon", finish: "opaque" },
};

// Node names arrive doubly mangled: the source file writes "Cabochon"
// with a Cyrillic "С", which isn't valid UTF-8 as authored and decodes to
// one or more U+FFFD replacement characters — not reliably one-for-one
// with the original byte(s) — and GLTFLoader then sanitizes names for
// animation binding ("Square Cut.1_81" → "Square_Cut1_81"). Collapse each
// *run* of invalid chars to a single "C" (not one "C" per char) so
// "Oval ��abochon" still matches "Oval Cabochon".
function keyName(name) {
  return name
    .normalize("NFKD")
    .replace(/[^\x20-\x7E]+/g, "C")
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
  // faceted stone — opaque rather than glass-like transmission, since
  // transmission renders by refracting whatever sits behind the mesh and
  // needs an opaque backdrop to look right; this reads as a solid gem
  // against a transparent canvas instead of a black card behind it
  return new THREE.MeshPhysicalMaterial({
    color: base, metalness: 0.12, roughness: 0.12,
    clearcoat: 1, clearcoatRoughness: 0.06,
    reflectivity: 1, ior: 2.2,
    envMapIntensity: 1.6,
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
  // rotate so the gem stands upright (crown facing viewer) rather than lying
  // flat; a cut can override the tilt (e.g. Round Cut uses less than a full
  // quarter-turn so its pointed culet reads as pointing downward)
  mesh.rotation.x = spec.tilt ?? Math.PI / 2;
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

/** A star's name, drawn to a canvas and hung in space as a facing label. */
function starLabel(text) {
  const pad = 8, fontPx = 34;
  const c = document.createElement("canvas");
  const ctx = c.getContext("2d");
  ctx.font = `${fontPx}px "Spline Sans Mono", ui-monospace, monospace`;
  const label = text.toUpperCase();
  const w = Math.ceil(ctx.measureText(label).width) + pad * 2;
  c.width = w; c.height = fontPx + pad * 2;

  const g = c.getContext("2d");
  g.font = `${fontPx}px "Spline Sans Mono", ui-monospace, monospace`;
  g.textBaseline = "middle";
  g.fillStyle = "rgba(143,192,216,0.92)";
  g.fillText(label, pad, c.height / 2);

  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 4;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map: tex, transparent: true, depthWrite: false, depthTest: false,
  }));
  // keep the type a constant apparent size regardless of the label's length
  const h = 0.2;
  sprite.scale.set((c.width / c.height) * h, h, 1);
  sprite.center.set(0, 0.5);
  return sprite;
}

/**
 * The birth sign's constellation, built from the real star catalogue.
 *
 * Right ascension and declination are projected the way a sky chart does it
 * (RA scaled by cos of the mean declination so the figure isn't stretched),
 * then lifted into 3D so it can be turned. Star size follows visual
 * magnitude, and the named stars carry their names, which is the detail that
 * turns a decorative shape back into a chart of something real.
 */
export function constellationObject(sign) {
  const figure = STAR_FIGURES[sign];
  const group = new THREE.Group();
  if (!figure) return group;

  const RAD = Math.PI / 180;
  const meanDec = figure.stars.reduce((a, s) => a + s[1], 0) / figure.stars.length;

  /*
     Right ascension is an angle that wraps at 24h, and Pisces straddles the
     wrap: its circlet sits at 23.3h and its northern fish at 2.0h. Projected
     from raw RA that reads as a 22.9-hour span instead of a 2.7-hour one, and
     the figure came out 24:1 wide where it should be 2.9:1 — a line of stars
     smeared right across the chart with no shape left in it. Every other
     constellation happened not to cross the boundary, which is why only this
     one looked broken.

     So each star is moved onto whichever branch of the circle is nearest the
     first star before projecting. Nothing changes for the eleven figures that
     never wrapped.
  */
  const ra0 = figure.stars[0][0];
  const unwrap = (ra) => ra0 + (((ra - ra0) % 24) + 36) % 24 - 12;

  const raw = figure.stars.map(([ra, dec]) => ({
    x: -unwrap(ra) * 15 * Math.cos(meanDec * RAD),
    y: dec,
  }));

  // centre and scale the figure to a consistent frame
  const xs = raw.map((p) => p.x), ys = raw.map((p) => p.y);
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
  const cy = (Math.min(...ys) + Math.max(...ys)) / 2;
  const span = Math.max(
    Math.max(...xs) - Math.min(...xs),
    Math.max(...ys) - Math.min(...ys),
    1e-6,
  );
  const k = 2.2 / span;

  const points = raw.map((p, i) => new THREE.Vector3(
    (p.x - cx) * k,
    (p.y - cy) * k,
    // a shallow deterministic depth so turning the chart reads as 3D
    (((i * 0.618034) % 1) - 0.5) * 0.75,
  ));

  const starMat = new THREE.SpriteMaterial({
    map: getGlowTexture(),
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  figure.stars.forEach((s, i) => {
    const mag = s[2] ?? 4;
    const name = s[3];
    // brighter star, bigger disc: the same relation a printed chart uses
    const r = Math.max(0.016, (6.4 - mag * 1.35) * 0.011);

    const sprite = new THREE.Sprite(starMat.clone());
    sprite.material.opacity = Math.max(0.45, 1 - (mag - 1.5) * 0.16);
    sprite.position.copy(points[i]);
    sprite.scale.setScalar(r * 11);
    group.add(sprite);

    const core = new THREE.Mesh(
      new THREE.SphereGeometry(r, 14, 14),
      new THREE.MeshBasicMaterial({ color: 0xfffaf0 }),
    );
    core.position.copy(points[i]);
    group.add(core);

    if (name) {
      const label = starLabel(name);
      label.position.copy(points[i]).add(new THREE.Vector3(r + 0.07, 0, 0));
      group.add(label);
    }
  });

  // the joining lines
  const linePositions = [];
  figure.lines.forEach(([a, b]) => {
    if (!points[a] || !points[b]) return;
    linePositions.push(
      points[a].x, points[a].y, points[a].z,
      points[b].x, points[b].y, points[b].z,
    );
  });
  const lineGeo = new THREE.BufferGeometry();
  lineGeo.setAttribute("position", new THREE.Float32BufferAttribute(linePositions, 3));
  group.add(new THREE.LineSegments(
    lineGeo,
    new THREE.LineBasicMaterial({ color: 0xecd9ac, transparent: true, opacity: 0.5 }),
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

  /*
     Returned unnormalised on purpose. normalizeObject() measures the whole
     bounding box, and the name labels stick out well past the figure, so
     letting it scale this would shrink every chart by however long its
     longest star name happens to be. The points are already scaled to a
     fixed span above, which frames all twelve signs identically.
  */
  return group;
}

/* ============================================================
   BIRTH FLOWER — parametric low-poly bloom, one recipe per month
   ============================================================ */

/*
   One recipe per month, built to be recognisable rather than generic:
   a daisy's thin ray florets, a rose's inward spiral, a carnation's frill
   and lily of the valley's hanging bells are all genuinely different
   geometry, not the same bloom in twelve colours.

   Field meanings:
     petals/layers   how many, in how many stacked whorls
     inner/reach     radius the petals attach at, and how far they extend
     layerShrink     each whorl inside the last, as a fraction
     layerRise       each whorl sitting higher — this is what domes a pom-pom
     baseWidth       petal width at its base (low = teardrop, high = strap)
     spread          how much of its angular slot a petal fills (1 = touching)
     arch/curl       rise along the petal, then droop (negative curl = incurved)
     cup             cross-petal cupping
     frill           wavy edge amplitude
*/
const FLOWERS = {
  "Carnation": {
    petals: 13, layers: 4, inner: 0.13, reach: 0.92, layerShrink: 0.15, layerRise: 0.085,
    baseWidth: 0.4, widthPow: 0.55, spread: 0.88, arch: 0.3, curl: 0.12, cup: 0.3,
    frill: 0.13, frillFreq: 7, thickness: 0.1,
    color: "#e0567f", tipColor: "#f7a9c2", center: "cluster", centerColor: "#f2a9bd",
    stem: { h: 0.92, r: 0.055, color: "#5f8a54" },
    leaves: { n: 2, len: 0.78, wid: 0.1, color: "#5f8a54", yBase: -0.42, slope: -0.2, droop: 0.5 },
  },
  "Violet": {
    petals: 5, layers: 1, inner: 0.12, reach: 0.95, layerShrink: 0, layerRise: 0,
    baseWidth: 0.34, widthPow: 0.42, spread: 0.8, arch: 0.16, curl: 0.06, cup: 0.14,
    frill: 0, frillFreq: 0, thickness: 0.11,
    color: "#6d4fc4", tipColor: "#a48ceb", center: "eye", centerColor: "#f2d15f",
    centerColor2: "#3d2585", centerSize: 0.3,
    stem: { h: 0.9, r: 0.045, color: "#54823f" },
    leaves: { n: 2, len: 0.6, wid: 0.34, color: "#54823f", yBase: -0.5, slope: -0.1, droop: 0.35 },
  },
  "Daffodil": {
    petals: 6, layers: 1, inner: 0.17, reach: 1.0, layerShrink: 0, layerRise: 0,
    baseWidth: 0.34, widthPow: 0.6, spread: 0.94, arch: 0.14, curl: 0.05, cup: 0.1,
    frill: 0, frillFreq: 0, thickness: 0.1,
    color: "#f2e29a", tipColor: "#fbf6d8", center: "trumpet", centerColor: "#eeb63a",
    trumpet: { h: 0.42, rIn: 0.17, flare: 0.16, wall: 0.075, rim: "#e2862f" },
    stem: { h: 0.95, r: 0.06, color: "#4f8c4a" },
    leaves: { n: 2, len: 0.85, wid: 0.09, color: "#4f8c4a", yBase: -0.5, slope: -0.05, droop: 0.3 },
  },
  "Daisy": {
    petals: 21, layers: 1, inner: 0.24, reach: 1.02, layerShrink: 0, layerRise: 0,
    baseWidth: 0.82, widthPow: 0.5, spread: 0.7, arch: 0.1, curl: 0.06, cup: 0.06,
    frill: 0, frillFreq: 0, thickness: 0.085,
    color: "#f6f5f0", tipColor: "#ffffff", center: "disc", centerColor: "#e9b73f",
    centerColor2: "#c48f22", centerSize: 0.3, centerDome: 0.16,
    stem: { h: 0.95, r: 0.045, color: "#5c9150" },
    leaves: { n: 2, len: 0.5, wid: 0.16, color: "#5c9150", yBase: -0.55, slope: -0.1, droop: 0.4 },
  },
  "Lily of the Valley": {
    form: "bells",
    // A bell needs enough voxels across it to read as hollow, so this one
    // gets a finer lattice and fewer, larger flowers than the rosettes.
    cell: 0.036,
    bells: 5, bellR: 0.26, bellH: 0.4, wall: 0.038,
    hang: 0.32, drop: 0.2, pedicel: 0.035, spread: 0.86, topY: 0.36,
    color: "#eef1e9", tipColor: "#ffffff",
    stem: { h: 1.12, top: 0.48, r: 0.055, color: "#4f7f42", arc: 0.22 },
    leaves: { n: 2, len: 0.78, wid: 0.26, color: "#4f7f42", yBase: -0.74, slope: 0.22, droop: 0.3 },
  },
  "Rose": {
    petals: 6, layers: 5, inner: 0.12, reach: 0.95, layerShrink: 0.16, layerRise: 0.135,
    baseWidth: 0.44, widthPow: 0.4, spread: 0.84, arch: 0.26, curl: -0.34, cup: 0.5,
    frill: 0.04, frillFreq: 2, thickness: 0.1,
    color: "#b4243a", tipColor: "#e35d6c", center: "cluster", centerColor: "#7d1a2b",
    stem: { h: 0.9, r: 0.06, color: "#4d7a44" },
    leaves: { n: 2, len: 0.55, wid: 0.24, color: "#4d7a44", yBase: -0.48, slope: -0.12, droop: 0.4 },
  },
  "Larkspur": {
    petals: 5, layers: 2, inner: 0.14, reach: 0.94, layerShrink: 0.34, layerRise: 0.12,
    baseWidth: 0.32, widthPow: 0.45, spread: 0.78, arch: 0.2, curl: 0.1, cup: 0.2,
    frill: 0.03, frillFreq: 3, thickness: 0.1,
    color: "#4257c9", tipColor: "#93a5f2", center: "disc", centerColor: "#eef0ff",
    centerColor2: "#b9c4ee", centerSize: 0.24, centerDome: 0.13,
    stem: { h: 0.95, r: 0.05, color: "#5a8a4e" },
    leaves: { n: 3, len: 0.5, wid: 0.07, color: "#5a8a4e", yBase: -0.45, slope: -0.05, droop: 0.3 },
  },
  "Gladiolus": {
    petals: 6, layers: 2, inner: 0.13, reach: 1.02, layerShrink: 0.3, layerRise: 0.09,
    baseWidth: 0.44, widthPow: 0.5, spread: 0.74, arch: 0.24, curl: 0.16, cup: 0.22,
    frill: 0.1, frillFreq: 4, thickness: 0.1,
    color: "#cf4661", tipColor: "#f5919f", center: "cluster", centerColor: "#f7d9a0",
    stem: { h: 0.92, r: 0.06, color: "#57883f" },
    leaves: { n: 2, len: 0.9, wid: 0.08, color: "#57883f", yBase: -0.4, slope: 0.05, droop: 0.25 },
  },
  "Aster": {
    petals: 26, layers: 2, inner: 0.22, reach: 1.0, layerShrink: 0.14, layerRise: 0.055,
    baseWidth: 0.85, widthPow: 0.5, spread: 0.62, arch: 0.13, curl: 0.07, cup: 0.05,
    frill: 0, frillFreq: 0, thickness: 0.08,
    color: "#8a74e4", tipColor: "#c0b2f5", center: "disc", centerColor: "#e9b73f",
    centerColor2: "#c48f22", centerSize: 0.26, centerDome: 0.13,
    stem: { h: 0.95, r: 0.045, color: "#5c8b4c" },
    leaves: { n: 2, len: 0.5, wid: 0.12, color: "#5c8b4c", yBase: -0.52, slope: -0.1, droop: 0.4 },
  },
  "Marigold": {
    petals: 16, layers: 5, inner: 0.1, reach: 0.86, layerShrink: 0.135, layerRise: 0.105,
    baseWidth: 0.46, widthPow: 0.5, spread: 0.94, arch: 0.3, curl: -0.06, cup: 0.34,
    frill: 0.09, frillFreq: 6, thickness: 0.09,
    color: "#e07c19", tipColor: "#f6b845", center: "cluster", centerColor: "#b85f13",
    stem: { h: 0.9, r: 0.055, color: "#4e8446" },
    leaves: { n: 2, len: 0.55, wid: 0.09, color: "#4e8446", yBase: -0.45, slope: -0.15, droop: 0.45 },
  },
  "Chrysanthemum": {
    petals: 22, layers: 3, inner: 0.11, reach: 1.05, layerShrink: 0.2, layerRise: 0.075,
    baseWidth: 0.66, widthPow: 0.55, spread: 0.6, arch: 0.2, curl: -0.3, cup: 0.16,
    frill: 0, frillFreq: 0, thickness: 0.075,
    color: "#dcb03c", tipColor: "#f6e08a", center: "cluster", centerColor: "#b8912c",
    stem: { h: 0.9, r: 0.055, color: "#547f45" },
    leaves: { n: 2, len: 0.52, wid: 0.2, color: "#547f45", yBase: -0.48, slope: -0.12, droop: 0.4 },
  },
  "Narcissus": {
    petals: 6, layers: 1, inner: 0.18, reach: 1.0, layerShrink: 0, layerRise: 0,
    baseWidth: 0.38, widthPow: 0.55, spread: 0.96, arch: 0.12, curl: 0.05, cup: 0.09,
    frill: 0, frillFreq: 0, thickness: 0.1,
    color: "#f4f2e4", tipColor: "#ffffff", center: "trumpet", centerColor: "#f0a24a",
    trumpet: { h: 0.24, rIn: 0.19, flare: 0.1, wall: 0.07, rim: "#e2862f" },
    stem: { h: 0.95, r: 0.055, color: "#4f8c4a" },
    leaves: { n: 2, len: 0.85, wid: 0.09, color: "#4f8c4a", yBase: -0.5, slope: -0.05, droop: 0.3 },
  },
};

/* ---------- shared parts: the stalk and the leaves ---------- */

/** Stem (optionally arching) plus lance-shaped leaves, as a field function. */
function greeneryField(spec) {
  const stem = spec.stem, lv = spec.leaves;
  const arc = stem?.arc || 0;
  // where the stalk's centre line sits at a given height
  const bend = (y) => (arc ? arc * (1 - (y + stem.h) / stem.h) ** 2 : 0);

  const leaves = [];
  for (let i = 0; lv && i < lv.n; i++) {
    const a = (i / lv.n) * Math.PI * 2 + 0.6;
    leaves.push({ ca: Math.cos(a), sa: Math.sin(a), y0: lv.yBase - i * 0.07 });
  }

  const stemTop = stem?.top ?? 0.06;

  return (x, y, z) => {
    // --- stalk ---
    if (stem && y < stemTop && y > -stem.h) {
      const dx = x - bend(y);
      if (dx * dx + z * z < stem.r * stem.r) {
        // a touch darker low down, so the stalk doesn't read as a flat bar
        return mix(stem.color, "#2f5a2c", 0.35 * (-y / stem.h));
      }
    }

    // --- leaves ---
    for (const L of leaves) {
      const along = x * L.ca + z * L.sa;
      const across = -x * L.sa + z * L.ca;
      if (along <= 0 || along > lv.len) continue;
      const t = along / lv.len;
      const half = lv.wid * Math.sin(Math.min(1, t * 1.05) * Math.PI) ** 0.7;
      if (Math.abs(across) > half) continue;
      // the blade rises then droops, and folds up along its midrib
      const yc = L.y0 + along * lv.slope - lv.droop * along * along
        + (Math.abs(across) / (half || 1)) ** 2 * 0.06;
      if (Math.abs(y - yc) < 0.05) {
        return mix(lv.color, "#8fc27a", 0.3 * t);
      }
    }
    return null;
  };
}

/* ---------- the two bloom forms ---------- */

/** A rosette: whorls of petals around a centre. Ten of the twelve months. */
function rosetteField(spec) {
  const TAU = Math.PI * 2;
  const green = greeneryField(spec);
  const half = spec.thickness / 2;
  const c = spec.centerSize || 0.22;

  return (x, y, z) => {
    const r = Math.hypot(x, z);
    const theta = Math.atan2(z, x);

    // --- petals, outermost whorl first ---
    for (let L = 0; L < spec.layers; L++) {
      const shrink = 1 - L * spec.layerShrink;
      const inner = spec.inner * shrink;
      const reach = spec.reach * shrink;
      if (r < inner || r > reach) continue;

      const t = (r - inner) / (reach - inner || 1);      // 0 at base → 1 at tip
      const phase = (L * Math.PI) / spec.petals;          // stagger each whorl
      const u = ((theta + phase) / TAU) * spec.petals;
      const o = (u - Math.floor(u) - 0.5) * 2;            // -1..1 across the petal

      const w = spec.baseWidth
        + (1 - spec.baseWidth) * Math.sin(Math.min(1, t * 1.06) * Math.PI) ** spec.widthPow;
      if (Math.abs(o) > w * spec.spread) continue;

      // the petal's own surface height at this point
      let ys = L * spec.layerRise
        + spec.arch * Math.sin(t * Math.PI * 0.85)
        - spec.curl * t * t * t
        + spec.cup * o * o * (1 - t * 0.45);
      if (spec.frill) ys += spec.frill * Math.sin(o * Math.PI * spec.frillFreq) * t;

      if (Math.abs(y - ys) > half) continue;

      // base → tip gradient, with a darker midrib line down each petal
      let col = mix(spec.color, spec.tipColor, t * 0.85 + L * 0.04);
      if (Math.abs(o) < 0.14) col = col.clone().multiplyScalar(0.9);
      return col;
    }

    // --- the centre ---
    if (spec.center === "disc" && r < c) {
      const dome = spec.centerDome || 0.14;
      const h = dome * Math.sqrt(Math.max(0, 1 - (r / c) ** 2));
      if (y > -0.04 && y < h) {
        // packed florets: speckle two golds so it isn't a smooth cap
        const n = Math.abs(Math.sin(r * 61 + theta * 23)) ;
        return mix(spec.centerColor, spec.centerColor2 || spec.centerColor, n);
      }
    } else if (spec.center === "trumpet" && spec.trumpet) {
      const T = spec.trumpet;
      if (y > -0.02 && y < T.h) {
        const k = y / T.h;
        const R = T.rIn + T.flare * k * k;
        if (Math.abs(r - R) < T.wall) {
          // the rim is the darker, ruffled edge of a daffodil's cup
          return k > 0.82 ? mix(T.rim, "#ffffff", 0.15) : mix(spec.centerColor, T.rim, k * 0.6);
        }
        if (k < 0.18 && r < R) return mix(spec.centerColor, "#8a5a12", 0.4);
      }
    } else if (spec.center === "eye" && r < c) {
      if (y > -0.02 && y < 0.07) {
        // a violet's yellow eye with dark nectar guides radiating out
        const guide = Math.abs(Math.sin(theta * 2.5));
        return guide > 0.86 ? mix(spec.centerColor2, "#000000", 0.2) : spec.centerColor;
      }
    } else if (spec.center === "cluster" && r < c * 0.9) {
      const top = (spec.layers - 1) * spec.layerRise + spec.arch * 0.55;
      const h = 0.12 * Math.sqrt(Math.max(0, 1 - (r / (c * 0.9)) ** 2));
      if (y > top - 0.06 && y < top + h) {
        const n = Math.abs(Math.sin(r * 47 + theta * 19));
        return mix(spec.centerColor, spec.tipColor, n * 0.3);
      }
    }

    return green(x, y, z);
  };
}

/**
 * Hanging bells on an arching stalk — lily of the valley only.
 * A rosette would have been botanically wrong for May, and a wrong flower
 * is exactly the kind of detail this site can't afford to fudge.
 */
/*
   The silhouette of one bell, as radius/bellR against depth from the crown.
   A hemisphere reads as a flat plate at this resolution; a real bell needs
   a narrow neck, a belly, a pinched mouth and a recurved lip — so the
   profile is spelled out and interpolated rather than derived.
*/
const BELL_PROFILE = [
  [0.00, 0.20],   // neck, where it meets the pedicel
  [0.18, 0.70],   // shoulders
  [0.44, 0.97],
  [0.68, 1.00],   // belly
  [0.87, 0.83],   // pinched toward the mouth
  [1.00, 1.06],   // the lip curls back out
];

function bellRadius(k) {
  for (let i = 1; i < BELL_PROFILE.length; i++) {
    const [k1, r1] = BELL_PROFILE[i];
    if (k <= k1) {
      const [k0, r0] = BELL_PROFILE[i - 1];
      const t = (k - k0) / (k1 - k0 || 1);
      return r0 + (r1 - r0) * t;
    }
  }
  return BELL_PROFILE[BELL_PROFILE.length - 1][1];
}

function bellsField(spec) {
  const green = greeneryField(spec);
  const stem = spec.stem;
  const bend = (y) => (stem.arc ? stem.arc * (1 - (y + stem.h) / stem.h) ** 2 : 0);

  // Bells alternate left and right down the arch, each on its own pedicel.
  // Alternating is what keeps them from colliding: neighbours are only
  // ~0.16 apart vertically but a full 2×hang apart across the stem.
  const bells = [];
  for (let i = 0; i < spec.bells; i++) {
    const k = i / (spec.bells - 1 || 1);
    const ys = spec.topY - k * spec.spread;  // where it joins the stalk
    const side = i % 2 ? 1 : -1;
    bells.push({
      ax: bend(ys), ay: ys, az: 0,           // attachment point
      x: bend(ys) + side * spec.hang,
      y: ys - spec.drop,
      z: (i % 4 < 2 ? 1 : -1) * 0.11,
      s: 1 - k * 0.22,                       // bells shrink toward the tip
    });
  }

  /** Distance from a point to the little stalk joining bell to stem. */
  const nearPedicel = (px, py, pz, b) => {
    const vx = b.x - b.ax, vy = (b.y + spec.bellH * b.s * 0.5) - b.ay, vz = b.z - b.az;
    const wx = px - b.ax, wy = py - b.ay, wz = pz - b.az;
    const len2 = vx * vx + vy * vy + vz * vz || 1;
    const t = Math.max(0, Math.min(1, (wx * vx + wy * vy + wz * vz) / len2));
    const dx = wx - vx * t, dy = wy - vy * t, dz = wz - vz * t;
    return Math.hypot(dx, dy, dz) < spec.pedicel;
  };

  return (x, y, z) => {
    for (const b of bells) {
      if (nearPedicel(x, y, z, b)) return stem.color;
    }
    for (const b of bells) {
      const px = x - b.x, py = y - b.y, pz = z - b.z;
      const R = spec.bellR * b.s, H = spec.bellH * b.s;
      if (py > 0 || py < -H) continue;                      // the crown is at py = 0
      const r = Math.hypot(px, pz);
      if (r > R * 1.12) continue;

      const k = -py / H;                                    // 0 at crown → 1 at lip
      const surf = R * bellRadius(k);
      const wall = spec.wall * b.s;

      // cap the crown solid, then run a thin shell down to the open lip
      if (k < 0.08 ? r < surf + wall : Math.abs(r - surf) < wall) {
        return mix(spec.color, spec.tipColor, k * 0.7);
      }
    }
    return green(x, y, z);
  };
}

/* ---------- how far the lattice has to reach for each form ---------- */
function flowerBounds(spec) {
  if (spec.form === "bells") {
    return { min: [-0.9, -1.25, -0.9], max: [0.9, 0.55, 0.9] };
  }
  const lv = spec.leaves;
  const spread = Math.max(spec.reach + 0.12, (lv?.len || 0) + 0.1);
  const top = (spec.layers - 1) * spec.layerRise + spec.arch + spec.cup + 0.18;
  return {
    min: [-spread, -(spec.stem?.h || 1) - 0.1, -spread],
    max: [spread, Math.max(top, (spec.trumpet?.h || 0) + 0.1), spread],
  };
}

/** The month's flower, carved out of a voxel lattice. */
export function flowerObject(flower) {
  const spec = FLOWERS[flower] || FLOWERS.Daisy;
  const { min, max } = flowerBounds(spec);
  const field = spec.form === "bells" ? bellsField(spec) : rosetteField(spec);

  const mesh = voxelBuild(field, {
    cell: spec.cell || VOXEL_CELL,
    min,
    max,
    gap: 0.07,
    ao: 0.6,
    grain: 0.055,
  });

  const group = new THREE.Group();
  if (mesh) group.add(mesh);

  // lean the bloom toward the viewer so you look into it, not at its edge
  const tilted = new THREE.Group();
  tilted.add(group);
  group.rotation.x = spec.form === "bells" ? 0.12 : 0.5;
  return normalizeObject(tilted, 2.15);
}
