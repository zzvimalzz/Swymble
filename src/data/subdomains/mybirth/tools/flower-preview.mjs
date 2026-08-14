/* Offscreen isometric preview of the voxel flowers — no GPU, no browser.
   Reads the InstancedMesh back out, projects each cube's three visible faces
   and paints them back-to-front into a PNG contact sheet.

   Run:  node tools/flower-preview.mjs out.png

   Use this when tuning a FLOWERS recipe in src/scene/models.js — it's a couple of
   seconds per iteration instead of a dev server, a form and a scroll. */
import * as THREE from "three";
import { PNG } from "pngjs";
import fs from "node:fs";
import { flowerObject } from "../src/scene/models.js";

const MONTHS = ["Carnation", "Violet", "Daffodil", "Daisy", "Lily of the Valley", "Rose",
  "Larkspur", "Gladiolus", "Aster", "Marigold", "Chrysanthemum", "Narcissus"];

const COLS = 4, ROWS = 3, CW = 330, CH = 330;
const W = COLS * CW, H = ROWS * CH;
const png = new PNG({ width: W, height: H });
const buf = png.data;
for (let i = 0; i < buf.length; i += 4) { buf[i] = 8; buf[i + 1] = 9; buf[i + 2] = 18; buf[i + 3] = 255; }

const S = 3.0;                       // pixels per voxel edge
const KX = 0.866 * S, KY = 0.5 * S;  // isometric basis

function fillQuad(pts, r, g, b) {
  let minY = Infinity, maxY = -Infinity;
  for (const p of pts) { minY = Math.min(minY, p[1]); maxY = Math.max(maxY, p[1]); }
  for (let y = Math.max(0, Math.ceil(minY)); y <= Math.min(H - 1, Math.floor(maxY)); y++) {
    let xa = Infinity, xb = -Infinity;
    for (let i = 0; i < pts.length; i++) {
      const [x1, y1] = pts[i], [x2, y2] = pts[(i + 1) % pts.length];
      if ((y1 <= y && y2 > y) || (y2 <= y && y1 > y)) {
        const x = x1 + ((y - y1) / (y2 - y1)) * (x2 - x1);
        xa = Math.min(xa, x); xb = Math.max(xb, x);
      }
    }
    if (xa > xb) continue;
    for (let x = Math.max(0, Math.ceil(xa)); x <= Math.min(W - 1, Math.floor(xb)); x++) {
      const o = (y * W + x) * 4;
      buf[o] = r; buf[o + 1] = g; buf[o + 2] = b;
    }
  }
}

const m = new THREE.Matrix4(), v = new THREE.Vector3(), col = new THREE.Color();

MONTHS.forEach((name, idx) => {
  const obj = flowerObject(name);
  const mesh = obj.children[0].children[0].children[0];
  if (!mesh) return;

  // pull every instance back out of the mesh
  const cells = [];
  for (let i = 0; i < mesh.count; i++) {
    mesh.getMatrixAt(i, m);
    v.setFromMatrixPosition(m);
    mesh.getColorAt(i, col);
    cells.push({ x: v.x, y: v.y, z: v.z, r: col.r, g: col.g, b: col.b });
  }
  // back to front along the view axis
  cells.sort((a, b) => (a.x + a.y + a.z) - (b.x + b.y + b.z));

  // centre this flower in its grid cell
  let sxMin = Infinity, sxMax = -Infinity, syMin = Infinity, syMax = -Infinity;
  const CELL = name === "Lily of the Valley" ? 0.036 : 0.048;
  for (const c of cells) {
    const px = (c.x - c.z) / CELL * KX, py = (c.x + c.z) / CELL * KY - (c.y / CELL) * S;
    sxMin = Math.min(sxMin, px); sxMax = Math.max(sxMax, px);
    syMin = Math.min(syMin, py); syMax = Math.max(syMax, py);
  }
  const ox = (idx % COLS) * CW + CW / 2 - (sxMin + sxMax) / 2;
  const oy = Math.floor(idx / COLS) * CH + CH / 2 - (syMin + syMax) / 2;

  const P = (x, y, z) => [ox + (x - z) * KX, oy + (x + z) * KY - y * S];

  for (const c of cells) {
    const gx = c.x / CELL, gy = c.y / CELL, gz = c.z / CELL;
    const R = c.r * 255, G = c.g * 255, B = c.b * 255;
    const face = (pts, k) => fillQuad(pts, Math.min(255, R * k), Math.min(255, G * k), Math.min(255, B * k));
    // top, then the two vertical faces turned toward the camera
    face([P(gx, gy + 1, gz), P(gx + 1, gy + 1, gz), P(gx + 1, gy + 1, gz + 1), P(gx, gy + 1, gz + 1)], 1.0);
    face([P(gx + 1, gy, gz), P(gx + 1, gy + 1, gz), P(gx + 1, gy + 1, gz + 1), P(gx + 1, gy, gz + 1)], 0.74);
    face([P(gx, gy, gz + 1), P(gx + 1, gy, gz + 1), P(gx + 1, gy + 1, gz + 1), P(gx, gy + 1, gz + 1)], 0.52);
  }
  console.log(`${name.padEnd(20)} ${cells.length} voxels`);
});

png.pack().pipe(fs.createWriteStream(process.argv[2] || "flowers.png"))
  .on("finish", () => console.log("\nwrote", process.argv[2] || "flowers.png"));
