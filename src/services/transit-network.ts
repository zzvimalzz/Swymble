import type { Feature, FeatureCollection, LineString, Point } from "geojson";

import { fetchArtifact } from "@/services/artifact-client";
import { cumulativeMeters, type LonLat } from "@/lib/geo";
import {
  TRANSIT_NETWORK_IDS,
  transitNetworkPayloadSchema,
  type TransitNetworkId,
  type TransitNetworkPayload,
  type TransitRoute,
  type TransitShape,
  type TransitStop,
} from "@/types/transit-network";

/**
 * Loads the static transit networks (built by etl/gtfs) and indexes them
 * for the live map: route lookup by id, stop lookup, per-route shapes with
 * pre-measured cumulative distances (for ETA math), and the GeoJSON the
 * map layers render.
 */

export interface MeasuredShape extends TransitShape {
  /** Metres from line start to each vertex (cumulativeMeters). */
  cumulative: number[];
}

export interface TransitNetworkIndex {
  networks: TransitNetworkPayload[];
  routesById: Map<string, TransitRoute & { network: TransitNetworkId; mode: "rail" | "bus" }>;
  stopsById: Map<string, TransitStop & { network: TransitNetworkId; mode: "rail" | "bus" }>;
  shapesByRoute: Map<string, MeasuredShape[]>;
  /** trip id → route id (KTMB's realtime feed omits route ids). */
  tripToRoute: Map<string, string>;
}

export interface TransitRouteProps {
  routeId: string;
  network: string;
  mode: "rail" | "bus";
  color: string | null;
  shortName: string;
  longName: string;
  [key: string]: unknown;
}

export interface TransitStopProps {
  stopId: string;
  network: string;
  mode: "rail" | "bus";
  name: string;
  [key: string]: unknown;
}

async function loadNetwork(network: TransitNetworkId): Promise<TransitNetworkPayload> {
  const envelope = await fetchArtifact(`transit-network-${network}`, transitNetworkPayloadSchema);
  return envelope.data;
}

export function indexNetworks(networks: TransitNetworkPayload[]): TransitNetworkIndex {
  const index: TransitNetworkIndex = {
    networks,
    routesById: new Map(),
    stopsById: new Map(),
    shapesByRoute: new Map(),
    tripToRoute: new Map(),
  };
  for (const network of networks) {
    for (const route of network.routes) {
      index.routesById.set(route.id, { ...route, network: network.network, mode: network.mode });
    }
    for (const stop of network.stops) {
      index.stopsById.set(stop.id, { ...stop, network: network.network, mode: network.mode });
    }
    for (const shape of network.shapes) {
      const measured: MeasuredShape = { ...shape, cumulative: cumulativeMeters(shape.coords) };
      const list = index.shapesByRoute.get(shape.routeId);
      if (list) list.push(measured);
      else index.shapesByRoute.set(shape.routeId, [measured]);
    }
    for (const [tripId, routeId] of Object.entries(network.tripRoutes)) {
      index.tripToRoute.set(tripId, routeId);
    }
  }
  return index;
}

let cached: Promise<TransitNetworkIndex> | null = null;

/** Loads every network once per session (all five in parallel). */
export function loadTransitNetworks(): Promise<TransitNetworkIndex> {
  cached ??= Promise.all(TRANSIT_NETWORK_IDS.map(loadNetwork)).then(indexNetworks);
  return cached;
}

/** Route lines as GeoJSON, colored by the feed's official route colors. */
export function routesToGeoJson(
  index: TransitNetworkIndex,
): FeatureCollection<LineString, TransitRouteProps> {
  const features: Array<Feature<LineString, TransitRouteProps>> = [];
  for (const network of index.networks) {
    for (const route of network.routes) {
      // One rendered line per route: direction 0 (or whatever exists) —
      // both directions overlap at map scale.
      const shape = index.shapesByRoute.get(route.id)?.[0];
      if (!shape) continue;
      features.push({
        type: "Feature",
        geometry: { type: "LineString", coordinates: shape.coords as LonLat[] },
        properties: {
          routeId: route.id,
          network: network.network,
          mode: network.mode,
          color: route.color,
          shortName: route.shortName,
          longName: route.longName,
        },
      });
    }
  }
  return { type: "FeatureCollection", features };
}

/** Stops/stations as GeoJSON points. */
export function stopsToGeoJson(
  index: TransitNetworkIndex,
): FeatureCollection<Point, TransitStopProps> {
  const features: Array<Feature<Point, TransitStopProps>> = [];
  for (const network of index.networks) {
    for (const stop of network.stops) {
      features.push({
        type: "Feature",
        geometry: { type: "Point", coordinates: [stop.lon, stop.lat] },
        properties: {
          stopId: stop.id,
          network: network.network,
          mode: network.mode,
          name: stop.name,
        },
      });
    }
  }
  return { type: "FeatureCollection", features };
}

/** Resolves a live vehicle's route: direct route id, else via trip id. */
export function resolveRouteId(
  index: TransitNetworkIndex,
  routeId: string | null,
  tripId: string | null,
): string | null {
  if (routeId && index.routesById.has(routeId)) return routeId;
  if (tripId) return index.tripToRoute.get(tripId) ?? null;
  return null;
}
