import type { Map as MaplibreMap } from "maplibre-gl";

import type { Bbox } from "@/maps/generated/boundary-meta";
import { duration } from "@/lib/motion";

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * Camera flight to a bounding box, honouring reduced motion (jump instead of
 * fly). The default duration matches the design system's hero motion token.
 */
export function flyToBbox(
  map: MaplibreMap,
  bbox: Bbox,
  options: { padding?: number; durationMs?: number; maxZoom?: number } = {},
): void {
  const { padding = 48, durationMs = duration.hero * 1000, maxZoom } = options;
  const bounds: [[number, number], [number, number]] = [
    [bbox[0], bbox[1]],
    [bbox[2], bbox[3]],
  ];

  // maxZoom must be absent (not undefined) or MapLibre's zoom math NaNs out.
  const zoomCap = maxZoom !== undefined ? { maxZoom } : {};

  if (prefersReducedMotion()) {
    map.fitBounds(bounds, { padding, duration: 0, ...zoomCap });
    return;
  }
  map.fitBounds(bounds, { padding, duration: durationMs, essential: false, ...zoomCap });
}

/** Eases the camera to a pitch/bearing (0/0 returns to plan view). */
export function easeToPitch(map: MaplibreMap, pitch: number, bearing = 0): void {
  if (prefersReducedMotion()) {
    map.jumpTo({ pitch, bearing });
    return;
  }
  map.easeTo({ pitch, bearing, duration: duration.hero * 1000 });
}
