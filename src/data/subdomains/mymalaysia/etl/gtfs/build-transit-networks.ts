import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { unzipSync } from "fflate";

import { DATASET_MANIFESTS } from "@datasets";
import type { ArtifactEnvelope, DatasetManifest } from "@/types/dataset";
import {
  transitNetworkPayloadSchema,
  type TransitMode,
  type TransitNetworkId,
  type TransitNetworkPayload,
  type TransitRoute,
  type TransitShape,
  type TransitStop,
} from "@/types/transit-network";

import { compactLine, parseGtfsCsv, simplifyLine, type LonLat } from "./gtfs-parse";

/**
 * GTFS Static → transit network artifacts (npm run etl:gtfs).
 *
 * Downloads each network's official GTFS zip, extracts routes/stops/shapes,
 * joins stop_times ∘ trips to learn which routes call at each stop, picks
 * one representative shape per route+direction (the one most trips use),
 * simplifies it (~10 m tolerance), and publishes a versioned envelope to
 * public/data/transit/<network>.json. KTMB ships no shapes.txt, so its
 * lines are reconstructed from each route's longest stop sequence — an
 * honest approximation along stations, not surveyed track geometry.
 */

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

/** ~10 m in degrees: tight enough to hug roads, enough to shrink shapes. */
const SIMPLIFY_TOLERANCE = 1e-4;

const NETWORK_CONFIG: Record<TransitNetworkId, { mode: TransitMode; label: string }> = {
  ktmb: { mode: "rail", label: "KTM trains" },
  "rapid-rail-kl": { mode: "rail", label: "Rapid Rail KL" },
  "rapid-bus-kl": { mode: "bus", label: "Rapid Bus KL" },
  "rapid-bus-penang": { mode: "bus", label: "Rapid Bus Penang" },
  "rapid-bus-kuantan": { mode: "bus", label: "Rapid Bus Kuantan" },
};

interface GtfsFiles {
  [name: string]: Array<Record<string, string>>;
}

async function downloadGtfs(url: string): Promise<GtfsFiles> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`);
  const zipped = unzipSync(new Uint8Array(await response.arrayBuffer()));
  const decoder = new TextDecoder();
  const files: GtfsFiles = {};
  for (const [name, bytes] of Object.entries(zipped)) {
    if (name.startsWith("__MACOSX") || !name.endsWith(".txt")) continue;
    files[path.basename(name, ".txt")] = parseGtfsCsv(decoder.decode(bytes));
  }
  return files;
}

function normalizeColor(value: string | undefined): string | null {
  const hex = value?.trim().toLowerCase();
  return hex && /^[0-9a-f]{6}$/.test(hex) ? `#${hex}` : null;
}

/** Title-cases the SHOUTING names some feeds ship ("BATU CAVES"). */
function normalizeName(name: string): string {
  if (name !== name.toUpperCase()) return name;
  return name
    .toLowerCase()
    .replace(/\b\p{L}/gu, (c) => c.toUpperCase())
    .replace(/\b(Brt|Lrt|Mrt|Ktm|Utc|Usj|Ss|Pj|Kl)\b/g, (m) => m.toUpperCase());
}

function buildRoutes(files: GtfsFiles, mode: TransitMode): TransitRoute[] {
  return (files.routes ?? []).map((row) => ({
    id: row.route_id,
    shortName: row.route_short_name ?? "",
    longName: row.route_long_name ?? "",
    color: normalizeColor(row.route_color),
    category: row.category || (mode === "rail" ? "KTM" : null),
  }));
}

/** stop id → set of route ids, via stop_times ∘ trips. */
function buildStopRouteIndex(files: GtfsFiles): Map<string, Set<string>> {
  const tripRoute = new Map<string, string>();
  for (const trip of files.trips ?? []) tripRoute.set(trip.trip_id, trip.route_id);
  const index = new Map<string, Set<string>>();
  for (const stopTime of files.stop_times ?? []) {
    const routeId = tripRoute.get(stopTime.trip_id);
    if (!routeId) continue;
    let routes = index.get(stopTime.stop_id);
    if (!routes) {
      routes = new Set();
      index.set(stopTime.stop_id, routes);
    }
    routes.add(routeId);
  }
  return index;
}

function buildStops(files: GtfsFiles): TransitStop[] {
  const stopRoutes = buildStopRouteIndex(files);
  const stops: TransitStop[] = [];
  for (const row of files.stops ?? []) {
    const lat = Number(row.stop_lat);
    const lon = Number(row.stop_lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
    const routeIds = [...(stopRoutes.get(row.stop_id) ?? [])].sort();
    if (routeIds.length === 0) continue; // orphan stop, nothing ever calls
    stops.push({
      id: row.stop_id,
      name: normalizeName(row.stop_name || row.stop_id),
      lat: Math.round(lat * 1e5) / 1e5,
      lon: Math.round(lon * 1e5) / 1e5,
      routeIds,
    });
  }
  return stops;
}

/** Picks the shape most trips use, per route+direction, then simplifies. */
function buildShapesFromShapesTxt(files: GtfsFiles): TransitShape[] {
  const shapePoints = new Map<string, Array<{ seq: number; point: LonLat }>>();
  for (const row of files.shapes ?? []) {
    const lon = Number(row.shape_pt_lon);
    const lat = Number(row.shape_pt_lat);
    if (!Number.isFinite(lon) || !Number.isFinite(lat)) continue;
    let points = shapePoints.get(row.shape_id);
    if (!points) {
      points = [];
      shapePoints.set(row.shape_id, points);
    }
    points.push({ seq: Number(row.shape_pt_sequence), point: [lon, lat] });
  }

  // route|direction → shape_id usage counts across trips.
  const usage = new Map<string, Map<string, number>>();
  for (const trip of files.trips ?? []) {
    if (!trip.shape_id || !shapePoints.has(trip.shape_id)) continue;
    const key = `${trip.route_id}|${trip.direction_id === "1" ? 1 : 0}`;
    let counts = usage.get(key);
    if (!counts) {
      counts = new Map();
      usage.set(key, counts);
    }
    counts.set(trip.shape_id, (counts.get(trip.shape_id) ?? 0) + 1);
  }

  const shapes: TransitShape[] = [];
  for (const [key, counts] of usage) {
    const [routeId, direction] = key.split("|");
    const shapeId = [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
    const coords = shapePoints
      .get(shapeId)!
      .sort((a, b) => a.seq - b.seq)
      .map((p) => p.point);
    const simplified = compactLine(simplifyLine(coords, SIMPLIFY_TOLERANCE));
    if (simplified.length < 2) continue;
    shapes.push({ routeId, direction: direction === "1" ? 1 : 0, coords: simplified });
  }
  return shapes;
}

/** KTMB fallback: the longest trip's ordered stops become the line. */
function buildShapesFromStopSequences(files: GtfsFiles, stops: TransitStop[]): TransitShape[] {
  const stopById = new Map(stops.map((s) => [s.id, s]));
  const tripMeta = new Map<string, { routeId: string; direction: 0 | 1 }>();
  for (const trip of files.trips ?? []) {
    tripMeta.set(trip.trip_id, {
      routeId: trip.route_id,
      direction: trip.direction_id === "1" ? 1 : 0,
    });
  }

  const tripStops = new Map<string, Array<{ seq: number; stopId: string }>>();
  for (const stopTime of files.stop_times ?? []) {
    if (!tripMeta.has(stopTime.trip_id)) continue;
    let list = tripStops.get(stopTime.trip_id);
    if (!list) {
      list = [];
      tripStops.set(stopTime.trip_id, list);
    }
    list.push({ seq: Number(stopTime.stop_sequence), stopId: stopTime.stop_id });
  }

  // Longest stop sequence per route+direction wins.
  const best = new Map<string, { tripId: string; length: number }>();
  for (const [tripId, list] of tripStops) {
    const meta = tripMeta.get(tripId)!;
    const key = `${meta.routeId}|${meta.direction}`;
    const current = best.get(key);
    if (!current || list.length > current.length) {
      best.set(key, { tripId, length: list.length });
    }
  }

  const shapes: TransitShape[] = [];
  for (const [key, { tripId }] of best) {
    const [routeId, direction] = key.split("|");
    const coords = tripStops
      .get(tripId)!
      .sort((a, b) => a.seq - b.seq)
      .map(({ stopId }) => stopById.get(stopId))
      .filter((s): s is TransitStop => Boolean(s))
      .map((s): LonLat => [s.lon, s.lat]);
    const compacted = compactLine(coords);
    if (compacted.length < 2) continue;
    shapes.push({ routeId, direction: direction === "1" ? 1 : 0, coords: compacted });
  }
  return shapes;
}

/** trip → route map for feeds whose realtime omits route ids (KTMB). */
function buildTripRoutes(files: GtfsFiles): Record<string, string> {
  const map: Record<string, string> = {};
  for (const trip of files.trips ?? []) {
    if (trip.trip_id && trip.route_id) map[trip.trip_id] = trip.route_id;
  }
  return map;
}

async function processNetwork(manifest: DatasetManifest): Promise<void> {
  const network = manifest.id.replace(/^transit-network-/, "") as TransitNetworkId;
  const config = NETWORK_CONFIG[network];
  if (!config) throw new Error(`No network config for ${manifest.id}`);

  console.log(`[${manifest.id}] downloading ${manifest.upstream.url}`);
  const files = await downloadGtfs(manifest.upstream.url);

  const routes = buildRoutes(files, config.mode);
  const stops = buildStops(files);
  const shapes = files.shapes?.length
    ? buildShapesFromShapesTxt(files)
    : buildShapesFromStopSequences(files, stops);

  const payload: TransitNetworkPayload = {
    network,
    mode: config.mode,
    label: config.label,
    routes,
    stops,
    shapes,
    tripRoutes: network === "ktmb" ? buildTripRoutes(files) : {},
  };
  transitNetworkPayloadSchema.parse(payload);

  const now = new Date();
  const envelope: ArtifactEnvelope<TransitNetworkPayload> = {
    datasetId: manifest.id,
    version: now.toISOString().slice(0, 10),
    updatedAt: now.toISOString(),
    publishedAt: now.toISOString(),
    rowCount: routes.length + stops.length,
    source: manifest.source,
    data: payload,
  };

  const outPath = path.join(repoRoot, "public", manifest.artifact.path);
  await mkdir(path.dirname(outPath), { recursive: true });
  await writeFile(outPath, JSON.stringify(envelope));
  console.log(
    `[${manifest.id}] published ${manifest.artifact.path} ` +
      `(${routes.length} routes, ${stops.length} stops, ${shapes.length} shapes)`,
  );
}

async function main(): Promise<void> {
  const requestedIds = process.argv.slice(2).filter((a) => !a.startsWith("-"));
  const manifests = DATASET_MANIFESTS.filter((m) => m.upstream.kind === "gtfs").filter(
    (m) => requestedIds.length === 0 || requestedIds.includes(m.id),
  );
  if (manifests.length === 0) {
    console.error(`No GTFS datasets matched ${JSON.stringify(requestedIds)}`);
    process.exit(1);
  }

  let failures = 0;
  for (const manifest of manifests) {
    try {
      await processNetwork(manifest);
    } catch (error) {
      failures += 1;
      console.error(`[${manifest.id}] FAILED:`, error instanceof Error ? error.message : error);
    }
  }
  if (failures > 0) {
    console.error(`${failures}/${manifests.length} networks failed — nothing broken published.`);
    process.exit(1);
  }
  console.log(`All ${manifests.length} transit networks published.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
