/* ============================================================
   voxel.js — a small voxel builder for the almanac objects.

   You describe a shape as a field function over space; this walks a
   cubic lattice, keeps the cells your function fills, throws away the
   ones buried inside the model, bakes a cheap ambient-occlusion tint
   from each survivor's neighbourhood, and returns a single
   InstancedMesh.

   Two details do most of the visual work:

     · Occlusion culling — interior voxels are invisible but still cost
       a draw slot. Dropping them typically removes 60–80% of the cells.
     · Baked AO — darkening a voxel by how enclosed it is. Without this
       a voxel model reads as a flat blob of colour; with it, crevices
       and layers separate and the model looks carved.
   ============================================================ */

import * as THREE from "three";

/** Deterministic hash noise in [0,1) — same cell always gets the same grain. */
function hash3(x, y, z) {
  const n = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453;
  return n - Math.floor(n);
}

/**
 * Build a voxel mesh from a field function.
 *
 * @param {(x:number,y:number,z:number)=>(number|string|null)} field
 *        Called with the world-space centre of each cell. Return a colour
 *        (hex number or CSS string) to fill the cell, or null to leave it empty.
 * @param {object} opts
 * @param {number} opts.cell     edge length of one voxel in world units
 * @param {number[]} opts.min    [x,y,z] lower corner of the region to scan
 * @param {number[]} opts.max    [x,y,z] upper corner
 * @param {number} [opts.gap]    shrink each cube slightly so faces read as separate bricks
 * @param {number} [opts.ao]     0 = no ambient occlusion, 1 = strong
 * @param {number} [opts.grain]  per-voxel brightness jitter
 * @returns {THREE.InstancedMesh|null}
 */
export function voxelBuild(field, opts) {
  const { cell, min, max, gap = 0.06, ao = 0.55, grain = 0.05 } = opts;

  const nx = Math.max(1, Math.ceil((max[0] - min[0]) / cell));
  const ny = Math.max(1, Math.ceil((max[1] - min[1]) / cell));
  const nz = Math.max(1, Math.ceil((max[2] - min[2]) / cell));
  const total = nx * ny * nz;

  const filled = new Uint8Array(total);
  const colors = new Array(total);
  const at = (ix, iy, iz) => (iy * nz + iz) * nx + ix;

  // ---- pass 1: evaluate the field -------------------------------------
  let count = 0;
  for (let iy = 0; iy < ny; iy++) {
    const y = min[1] + (iy + 0.5) * cell;
    for (let iz = 0; iz < nz; iz++) {
      const z = min[2] + (iz + 0.5) * cell;
      for (let ix = 0; ix < nx; ix++) {
        const x = min[0] + (ix + 0.5) * cell;
        const c = field(x, y, z);
        if (c == null) continue;
        const i = at(ix, iy, iz);
        filled[i] = 1;
        colors[i] = c;
        count++;
      }
    }
  }
  if (!count) return null;

  // ---- pass 2: drop buried cells, bake AO from the 26-neighbourhood ----
  const solid = (ix, iy, iz) =>
    ix >= 0 && iy >= 0 && iz >= 0 && ix < nx && iy < ny && iz < nz && filled[at(ix, iy, iz)];

  const visible = [];
  for (let iy = 0; iy < ny; iy++) {
    for (let iz = 0; iz < nz; iz++) {
      for (let ix = 0; ix < nx; ix++) {
        const i = at(ix, iy, iz);
        if (!filled[i]) continue;

        // buried? all six face-neighbours solid → never seen, skip it
        if (
          solid(ix - 1, iy, iz) && solid(ix + 1, iy, iz) &&
          solid(ix, iy - 1, iz) && solid(ix, iy + 1, iz) &&
          solid(ix, iy, iz - 1) && solid(ix, iy, iz + 1)
        ) continue;

        // how enclosed is it? 26 neighbours → occlusion factor
        let neighbours = 0;
        for (let dy = -1; dy <= 1; dy++)
          for (let dz = -1; dz <= 1; dz++)
            for (let dx = -1; dx <= 1; dx++) {
              if (!dx && !dy && !dz) continue;
              if (solid(ix + dx, iy + dy, iz + dz)) neighbours++;
            }

        visible.push({ ix, iy, iz, color: colors[i], occ: neighbours / 26 });
      }
    }
  }
  if (!visible.length) return null;

  // ---- pass 3: one InstancedMesh ---------------------------------------
  const geo = new THREE.BoxGeometry(cell * (1 - gap), cell * (1 - gap), cell * (1 - gap));
  const mat = new THREE.MeshStandardMaterial({
    roughness: 0.72,
    metalness: 0.02,
    flatShading: true,
    envMapIntensity: 0.45,
  });

  const mesh = new THREE.InstancedMesh(geo, mat, visible.length);
  const m = new THREE.Matrix4();
  const c = new THREE.Color();

  visible.forEach((v, n) => {
    m.makeTranslation(
      min[0] + (v.ix + 0.5) * cell,
      min[1] + (v.iy + 0.5) * cell,
      min[2] + (v.iz + 0.5) * cell,
    );
    mesh.setMatrixAt(n, m);

    c.set(v.color);
    // shade down where the model encloses itself, then add a little grain
    const shade = 1 - ao * v.occ * v.occ;
    const g = 1 + (hash3(v.ix, v.iy, v.iz) - 0.5) * 2 * grain;
    c.multiplyScalar(Math.max(0, shade * g));
    mesh.setColorAt(n, c);
  });

  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

/* ---------- helpers for writing field functions ---------- */

/** Blend two hex colours; t=0 → a, t=1 → b. Returns a THREE.Color. */
const _a = new THREE.Color(), _b = new THREE.Color();
export function mix(a, b, t) {
  _a.set(a); _b.set(b);
  return _a.clone().lerp(_b, Math.max(0, Math.min(1, t)));
}

/** Smooth 0→1 ramp between edges, for soft field boundaries. */
export function smoothstep(edge0, edge1, x) {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0 || 1)));
  return t * t * (3 - 2 * t);
}
