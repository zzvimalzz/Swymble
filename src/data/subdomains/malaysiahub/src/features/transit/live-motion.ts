import type { Feature, FeatureCollection, Point } from "geojson";
import type { Map as MaplibreMap } from "maplibre-gl";

import { setTransitData } from "@/components/map";
import type { TransitVehicleProps } from "@/services/transit-client";
import type { LonLat } from "@/lib/geo";

import { vehicleKey } from "./eta";

/**
 * Smooth vehicle motion between polls. GTFS-Realtime updates every ~30 s;
 * snapping dots across the map reads as teleporting, so each new snapshot
 * glides vehicles from their previous position over a short tween. Runs
 * imperatively on requestAnimationFrame and writes straight to the map
 * source — React never re-renders per frame.
 */

const TWEEN_MS = 1_800;

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - (2 - 2 * t) ** 2 / 2;
}

export interface LiveMotionController {
  /** Feed a fresh snapshot; vehicles glide from their last position. */
  update(features: Array<Feature<Point, TransitVehicleProps>>): void;
  /** Re-push the latest positions (e.g. after a style reload). */
  refresh(): void;
  dispose(): void;
}

export function createLiveMotion(map: MaplibreMap): LiveMotionController {
  let previous = new Map<string, LonLat>();
  let latest: Array<Feature<Point, TransitVehicleProps>> = [];
  let frame: number | null = null;
  let tweenStart = 0;
  let disposed = false;

  const write = (features: Array<Feature<Point, TransitVehicleProps>>) => {
    const collection: FeatureCollection<Point, TransitVehicleProps> = {
      type: "FeatureCollection",
      features,
    };
    setTransitData(map, collection);
  };

  const stop = () => {
    if (frame !== null) cancelAnimationFrame(frame);
    frame = null;
  };

  const tick = (now: number) => {
    frame = null;
    if (disposed) return;
    const t = Math.min(1, (now - tweenStart) / TWEEN_MS);
    const eased = easeInOut(t);

    write(
      latest.map((feature) => {
        const from = previous.get(vehicleKey(feature.properties));
        const to = feature.geometry.coordinates as LonLat;
        if (!from || t >= 1) return feature;
        return {
          ...feature,
          geometry: {
            type: "Point" as const,
            coordinates: [from[0] + (to[0] - from[0]) * eased, from[1] + (to[1] - from[1]) * eased],
          },
        };
      }),
    );
    if (t < 1) frame = requestAnimationFrame(tick);
  };

  return {
    update(features) {
      if (disposed) return;
      // Where each vehicle currently appears becomes the tween origin.
      const origins = new Map<string, LonLat>();
      for (const feature of latest) {
        origins.set(vehicleKey(feature.properties), feature.geometry.coordinates as LonLat);
      }
      previous = origins;
      latest = features;
      tweenStart = performance.now();
      stop();
      frame = requestAnimationFrame(tick);
    },
    refresh() {
      if (!disposed) write(latest);
    },
    dispose() {
      disposed = true;
      stop();
      write([]);
    },
  };
}
