import GtfsRealtimeBindings from "gtfs-realtime-bindings";
import type { Feature, FeatureCollection, Point } from "geojson";

import { DATA_GOV_MY_API_BASE } from "@/config/api";

/**
 * Live vehicle positions from Malaysia's official GTFS-Realtime feeds
 * (protobuf, CORS-open, ~30 s upstream refresh). Published feeds today:
 * KTMB trains and Prasarana's Rapid buses — MRT/LRT rail positions are not
 * yet in the upstream feed.
 */

export interface TransitAgency {
  id: string;
  label: string;
  url: string;
}

export const TRANSIT_AGENCIES: TransitAgency[] = [
  {
    id: "ktmb",
    label: "KTM trains",
    url: `${DATA_GOV_MY_API_BASE}/gtfs-realtime/vehicle-position/ktmb/`,
  },
  {
    id: "rapid-bus-kl",
    label: "Rapid Bus KL",
    url: `${DATA_GOV_MY_API_BASE}/gtfs-realtime/vehicle-position/prasarana/?category=rapid-bus-kl`,
  },
  {
    id: "rapid-bus-penang",
    label: "Rapid Bus Penang",
    url: `${DATA_GOV_MY_API_BASE}/gtfs-realtime/vehicle-position/prasarana/?category=rapid-bus-penang`,
  },
  {
    id: "rapid-bus-kuantan",
    label: "Rapid Bus Kuantan",
    url: `${DATA_GOV_MY_API_BASE}/gtfs-realtime/vehicle-position/prasarana/?category=rapid-bus-kuantan`,
  },
];

export interface TransitVehicleProps {
  agency: string;
  route: string | null;
  bearing: number | null;
  [key: string]: unknown;
}

export interface TransitSnapshot {
  collection: FeatureCollection<Point, TransitVehicleProps>;
  countByAgency: Record<string, number>;
  fetchedAt: Date;
}

type FeedEntity = GtfsRealtimeBindings.transit_realtime.IFeedEntity;

/** Pure mapping from decoded feed entities to GeoJSON (unit-tested). */
export function entitiesToFeatures(
  agencyId: string,
  entities: FeedEntity[],
): Array<Feature<Point, TransitVehicleProps>> {
  const features: Array<Feature<Point, TransitVehicleProps>> = [];
  for (const entity of entities) {
    const position = entity.vehicle?.position;
    if (!position || position.latitude == null || position.longitude == null) continue;
    features.push({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [position.longitude, position.latitude],
      },
      properties: {
        agency: agencyId,
        route: entity.vehicle?.trip?.routeId ?? null,
        bearing: position.bearing ?? null,
      },
    });
  }
  return features;
}

async function fetchAgency(
  agency: TransitAgency,
): Promise<Array<Feature<Point, TransitVehicleProps>>> {
  const response = await fetch(agency.url);
  if (!response.ok) throw new Error(`HTTP ${response.status} for ${agency.id}`);
  const buffer = await response.arrayBuffer();
  const feed = GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(new Uint8Array(buffer));
  return entitiesToFeatures(agency.id, feed.entity);
}

/**
 * All agencies in parallel; a failing agency contributes zero vehicles
 * rather than sinking the layer.
 */
export async function fetchVehiclePositions(): Promise<TransitSnapshot> {
  const results = await Promise.allSettled(TRANSIT_AGENCIES.map(fetchAgency));
  const features: Array<Feature<Point, TransitVehicleProps>> = [];
  const countByAgency: Record<string, number> = {};
  results.forEach((result, index) => {
    const agency = TRANSIT_AGENCIES[index];
    if (result.status === "fulfilled") {
      countByAgency[agency.id] = result.value.length;
      features.push(...result.value);
    } else {
      countByAgency[agency.id] = 0;
      console.error(`transit feed failed (${agency.id}):`, result.reason);
    }
  });
  return {
    collection: { type: "FeatureCollection", features },
    countByAgency,
    fetchedAt: new Date(),
  };
}
