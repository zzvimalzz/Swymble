/**
 * Generates the homepage's inline Malaysia map geometry.
 *
 * Downloads DOSM's state boundaries (administrative_1_state.geojson,
 * CC BY 4.0), simplifies them with mapshaper, converts to SVG paths, and
 * writes a typed TS module consumed by the hero map component.
 *
 * Run manually when the upstream boundaries change:
 *   node etl/geo/build-home-map.mjs
 *
 * The full-resolution PMTiles pipeline for the map engine is separate
 * (Milestone 8); this artifact is deliberately tiny (~50 KB) because it
 * ships in the homepage bundle.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import mapshaper from "mapshaper";

const SOURCE_URL =
  "https://raw.githubusercontent.com/dosm-malaysia/data-open/main/datasets/geodata/administrative_1_state.geojson";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const cacheDir = path.join(repoRoot, "etl", "geo", ".cache");
const cachePath = path.join(cacheDir, "administrative_1_state.geojson");
const outPath = path.join(repoRoot, "src", "features", "home", "geometry", "malaysia-states.ts");

const SVG_WIDTH = 900;

async function loadSource() {
  try {
    return await readFile(cachePath, "utf8");
  } catch {
    console.log(`downloading ${SOURCE_URL}`);
    const res = await fetch(SOURCE_URL);
    if (!res.ok) throw new Error(`download failed: ${res.status}`);
    const text = await res.text();
    await mkdir(cacheDir, { recursive: true });
    await writeFile(cachePath, text);
    return text;
  }
}

function parseSvgPaths(svg) {
  const paths = [];
  const pathRegex = /<path([^>]*)>/g;
  for (const match of svg.matchAll(pathRegex)) {
    const attrs = match[1];
    const d = attrs.match(/\bd="([^"]+)"/)?.[1];
    const id = attrs.match(/\bid="([^"]+)"/)?.[1];
    if (d && id) paths.push({ id, d });
  }
  return paths;
}

const geojsonText = await loadSource();
const geojson = JSON.parse(geojsonText);

const nameByCode = new Map(
  geojson.features.map((f) => [String(f.properties.code_state), f.properties.state]),
);

const { "states.svg": svgBuffer } = await mapshaper.applyCommands(
  `-i states.geojson -simplify keep-shapes 4% -o states.svg id-field=code_state width=${SVG_WIDTH}`,
  { "states.geojson": geojsonText },
);
const svg = svgBuffer.toString();

const viewBox = svg.match(/viewBox="([^"]+)"/)?.[1];
if (!viewBox) throw new Error("no viewBox in mapshaper SVG output");

const paths = parseSvgPaths(svg);
if (paths.length !== geojson.features.length) {
  throw new Error(`expected ${geojson.features.length} paths, got ${paths.length}`);
}

const states = paths
  .map(({ id, d }) => ({
    code: Number(id),
    name: nameByCode.get(id),
    d,
  }))
  .sort((a, b) => a.name.localeCompare(b.name));

if (states.some((s) => !s.name)) throw new Error("unmatched state code in SVG output");

const banner = `// GENERATED FILE — do not edit by hand.
// Source: DOSM administrative_1_state.geojson (CC BY 4.0), simplified 4%.
// Regenerate with: node etl/geo/build-home-map.mjs
`;

const body = `${banner}
export interface StatePath {
  /** DOSM state code (code_state). */
  code: number;
  name: string;
  /** SVG path data in the shared viewBox. */
  d: string;
}

export const MALAYSIA_VIEWBOX = ${JSON.stringify(viewBox)};

export const MALAYSIA_STATES: StatePath[] = ${JSON.stringify(states, null, 2)};
`;

await mkdir(path.dirname(outPath), { recursive: true });
await writeFile(outPath, body);
console.log(`wrote ${outPath} (${states.length} states, viewBox ${viewBox})`);
