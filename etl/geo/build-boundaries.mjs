/**
 * Builds the map engine's boundary artifacts from DOSM geodata (CC BY 4.0):
 *
 *   public/maps/malaysia-states.geojson     (simplified, ~150 KB)
 *   public/maps/malaysia-districts.geojson  (simplified, ~350 KB)
 *   src/maps/generated/boundary-meta.ts     (codes, names, bboxes)
 *
 * The GeoJSON lands in public/ as the interim serving location; Milestone 8
 * moves these artifacts to Cloudflare R2 (the source URLs in src/maps/
 * sources.ts already read from config). Run when boundaries change:
 *
 *   node etl/geo/build-boundaries.mjs
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import mapshaper from "mapshaper";

const BASE = "https://raw.githubusercontent.com/dosm-malaysia/data-open/main/datasets/geodata";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const cacheDir = path.join(repoRoot, "etl", "geo", ".cache");
const mapsDir = path.join(repoRoot, "public", "maps");
const metaPath = path.join(repoRoot, "src", "maps", "generated", "boundary-meta.ts");

async function loadSource(filename) {
  const cachePath = path.join(cacheDir, filename);
  try {
    return await readFile(cachePath, "utf8");
  } catch {
    const url = `${BASE}/${filename}`;
    console.log(`downloading ${url}`);
    const res = await fetch(url);
    if (!res.ok) throw new Error(`download failed for ${filename}: ${res.status}`);
    const text = await res.text();
    await mkdir(cacheDir, { recursive: true });
    await writeFile(cachePath, text);
    return text;
  }
}

/** Simplify with mapshaper, keeping all shapes and required fields. */
async function simplify(geojsonText, percentage, precision = 0.0001) {
  const { "out.geojson": out } = await mapshaper.applyCommands(
    `-i in.geojson -simplify keep-shapes ${percentage} -o out.geojson precision=${precision}`,
    { "in.geojson": geojsonText },
  );
  return out.toString();
}

/** Walk all coordinates of a GeoJSON geometry. */
function eachCoord(geometry, fn) {
  const walk = (coords) => {
    if (typeof coords[0] === "number") fn(coords);
    else coords.forEach(walk);
  };
  walk(geometry.coordinates);
}

function featureBbox(feature) {
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  eachCoord(feature.geometry, ([x, y]) => {
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  });
  const round = (n) => Math.round(n * 1e4) / 1e4;
  return [round(minX), round(minY), round(maxX), round(maxY)];
}

await mkdir(mapsDir, { recursive: true });
await mkdir(path.dirname(metaPath), { recursive: true });

// ---- states ----
const statesRaw = await loadSource("administrative_1_state.geojson");
const statesSimplified = await simplify(statesRaw, "8%");
await writeFile(path.join(mapsDir, "malaysia-states.geojson"), statesSimplified);

const statesGeo = JSON.parse(statesSimplified);
const stateMeta = statesGeo.features
  .map((f) => ({
    code: f.properties.code_state,
    name: f.properties.state,
    bbox: featureBbox(f),
  }))
  .sort((a, b) => a.name.localeCompare(b.name));

// ---- districts ----
// code_district restarts at 1 within each state, so a nationally unique
// numeric id (fid = code_state * 100 + code_district) is injected for
// MapLibre feature-state and statistical joins.
const districtsRaw = await loadSource("administrative_2_district.geojson");
const districtsSimplified = await simplify(districtsRaw, "10%");

const districtsGeo = JSON.parse(districtsSimplified);
for (const f of districtsGeo.features) {
  f.properties.fid = f.properties.code_state * 100 + f.properties.code_district;
}
const districtsOut = JSON.stringify(districtsGeo);
await writeFile(path.join(mapsDir, "malaysia-districts.geojson"), districtsOut);

const districtMeta = districtsGeo.features
  .map((f) => ({
    id: f.properties.fid,
    stateCode: f.properties.code_state,
    name: f.properties.district,
    bbox: featureBbox(f),
  }))
  .sort((a, b) => a.name.localeCompare(b.name));

if (
  districtMeta.some((d) => d.id == null || !d.name) ||
  new Set(districtMeta.map((d) => d.id)).size !== districtMeta.length
) {
  console.error("sample district properties:", districtsGeo.features[0].properties);
  throw new Error("district metadata extraction failed — check property names");
}

// ---- country bbox ----
// Union over BOTH levels: the two levels are simplified independently, so a
// district edge can poke slightly outside the simplified state envelope.
const allMeta = [...stateMeta, ...districtMeta];
const countryBbox = [
  Math.min(...allMeta.map((s) => s.bbox[0])),
  Math.min(...allMeta.map((s) => s.bbox[1])),
  Math.max(...allMeta.map((s) => s.bbox[2])),
  Math.max(...allMeta.map((s) => s.bbox[3])),
];

const banner = `// GENERATED FILE — do not edit by hand.
// Source: DOSM geodata (CC BY 4.0), simplified for interactive use.
// Regenerate with: node etl/geo/build-boundaries.mjs
`;

const body = `${banner}
export type Bbox = [number, number, number, number];

export interface StateMeta {
  /** DOSM code_state. */
  code: number;
  name: string;
  bbox: Bbox;
}

export interface DistrictMeta {
  /** Nationally unique id: code_state * 100 + code_district ("fid" property). */
  id: number;
  /** DOSM code_state of the parent state. */
  stateCode: number;
  name: string;
  bbox: Bbox;
}

export const MALAYSIA_BBOX: Bbox = ${JSON.stringify(countryBbox)};

export const STATE_META: StateMeta[] = ${JSON.stringify(stateMeta, null, 2)};

export const DISTRICT_META: DistrictMeta[] = ${JSON.stringify(districtMeta, null, 2)};
`;

await writeFile(metaPath, body);

const stateSize = Buffer.byteLength(statesSimplified);
const districtSize = Buffer.byteLength(districtsOut);
console.log(
  `states: ${stateMeta.length} features, ${(stateSize / 1024).toFixed(0)} KB · ` +
    `districts: ${districtMeta.length} features, ${(districtSize / 1024).toFixed(0)} KB`,
);
