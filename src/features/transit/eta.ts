import type { Feature, Point } from "geojson";

import { bearingDeltaDegrees, bearingDegrees, projectOntoLine, type LonLat } from "@/lib/geo";
import type { TransitVehicleProps } from "@/services/transit-client";
import {
  resolveRouteId,
  type MeasuredShape,
  type TransitNetworkIndex,
} from "@/services/transit-network";

/**
 * ETA estimation from live positions. Everything here is an ESTIMATE:
 * distance measured along the route's shape from the vehicle's projected
 * position to the stop's, divided by the vehicle's speed (reported by the
 * feed when present, else a per-mode cruising default). The UI labels it
 * as such — this is "the bus looks ~5 minutes away", not a timetable.
 */

/** Fallback cruising speeds when the feed reports none (km/h). */
const DEFAULT_SPEED_KMH = { rail: 45, bus: 18 } as const;
/** Ignore vehicles farther than this along the route (metres). */
const MAX_APPROACH_METERS = 40_000;
/** A vehicle must sit within this distance of a shape to be "on" it. */
const MAX_SHAPE_OFFSET_METERS = 600;

export interface VehicleEta {
  vehicleKey: string;
  label: string | null;
  routeId: string;
  routeShortName: string;
  routeLongName: string;
  routeColor: string | null;
  agency: string;
  speedKmh: number;
  /** True when speed came from the feed, false when it's the default. */
  speedFromFeed: boolean;
  distanceMeters: number;
  etaMinutes: number;
}

export interface UpcomingStop {
  stopId: string;
  name: string;
  distanceMeters: number;
  etaMinutes: number;
}

/** Stable identity for a live vehicle across polls. */
export function vehicleKey(props: TransitVehicleProps): string {
  return `${props.agency}:${props.vehicleId ?? props.tripId ?? props.route ?? "unknown"}`;
}

interface ShapeFit {
  shape: MeasuredShape;
  alongMeters: number;
  /** +1 travelling with the shape's direction, -1 against it. */
  orientation: 1 | -1;
}

/**
 * Fits a vehicle onto one of its route's shapes: nearest shape wins; the
 * travel orientation comes from the feed bearing vs the local shape
 * tangent when available, else assumes the shape's own direction.
 */
export function fitVehicleToRoute(
  position: LonLat,
  bearing: number | null,
  shapes: MeasuredShape[],
): ShapeFit | null {
  let best: { fit: ShapeFit; offset: number } | null = null;
  for (const shape of shapes) {
    const projection = projectOntoLine(position, shape.coords, shape.cumulative);
    if (projection.offsetMeters > MAX_SHAPE_OFFSET_METERS) continue;
    if (best && projection.offsetMeters >= best.offset) continue;

    let orientation: 1 | -1 = 1;
    if (bearing !== null && bearing > 0) {
      const a = shape.coords[projection.segment];
      const b = shape.coords[Math.min(projection.segment + 1, shape.coords.length - 1)];
      const tangent = bearingDegrees(a, b);
      if (bearingDeltaDegrees(bearing, tangent) > 100) orientation = -1;
    }
    best = {
      fit: { shape, alongMeters: projection.alongMeters, orientation },
      offset: projection.offsetMeters,
    };
  }
  return best?.fit ?? null;
}

function speedFor(
  props: TransitVehicleProps,
  mode: "rail" | "bus",
): { kmh: number; fromFeed: boolean } {
  const reported = typeof props.speed === "number" ? props.speed : null;
  // Reported speeds below walking pace make ETAs meaningless (a train
  // dwelling at a platform is not 0 km/h all the way to the next station).
  if (reported !== null && reported > 5) return { kmh: reported, fromFeed: true };
  return { kmh: DEFAULT_SPEED_KMH[mode], fromFeed: false };
}

/**
 * Live vehicles approaching a stop, soonest first. A vehicle qualifies
 * when it rides a shape of a route calling at the stop and the stop lies
 * ahead of it along its direction of travel.
 */
export function arrivalsForStop(
  stopId: string,
  vehicles: Array<Feature<Point, TransitVehicleProps>>,
  index: TransitNetworkIndex,
): VehicleEta[] {
  const stop = index.stopsById.get(stopId);
  if (!stop) return [];
  const stopPosition: LonLat = [stop.lon, stop.lat];

  const arrivals: VehicleEta[] = [];
  for (const vehicle of vehicles) {
    const props = vehicle.properties;
    const routeId = resolveRouteId(index, props.route, props.tripId ?? null);
    if (!routeId || !stop.routeIds.includes(routeId)) continue;
    const route = index.routesById.get(routeId);
    const shapes = index.shapesByRoute.get(routeId);
    if (!route || !shapes?.length) continue;

    const position = vehicle.geometry.coordinates as LonLat;
    const fit = fitVehicleToRoute(position, props.bearing, shapes);
    if (!fit) continue;

    const stopProjection = projectOntoLine(stopPosition, fit.shape.coords, fit.shape.cumulative);
    if (stopProjection.offsetMeters > MAX_SHAPE_OFFSET_METERS) continue;

    const ahead = (stopProjection.alongMeters - fit.alongMeters) * fit.orientation;
    if (ahead < 30 || ahead > MAX_APPROACH_METERS) continue;

    const speed = speedFor(props, route.mode);
    arrivals.push({
      vehicleKey: vehicleKey(props),
      label: props.label ?? null,
      routeId,
      routeShortName: route.shortName,
      routeLongName: route.longName,
      routeColor: route.color,
      agency: props.agency,
      speedKmh: speed.kmh,
      speedFromFeed: speed.fromFeed,
      distanceMeters: ahead,
      etaMinutes: (ahead / 1000 / speed.kmh) * 60,
    });
  }
  return arrivals.sort((a, b) => a.etaMinutes - b.etaMinutes);
}

/** The next stops ahead of a vehicle along its route, nearest first. */
export function upcomingStopsForVehicle(
  vehicle: Feature<Point, TransitVehicleProps>,
  index: TransitNetworkIndex,
  limit = 4,
): { routeId: string | null; stops: UpcomingStop[] } {
  const props = vehicle.properties;
  const routeId = resolveRouteId(index, props.route, props.tripId ?? null);
  const route = routeId ? index.routesById.get(routeId) : null;
  const shapes = routeId ? index.shapesByRoute.get(routeId) : null;
  if (!routeId || !route || !shapes?.length) return { routeId: null, stops: [] };

  const position = vehicle.geometry.coordinates as LonLat;
  const fit = fitVehicleToRoute(position, props.bearing, shapes);
  if (!fit) return { routeId, stops: [] };

  const speed = speedFor(props, route.mode);
  const upcoming: UpcomingStop[] = [];
  for (const [, stop] of index.stopsById) {
    if (!stop.routeIds.includes(routeId)) continue;
    const projection = projectOntoLine(
      [stop.lon, stop.lat],
      fit.shape.coords,
      fit.shape.cumulative,
    );
    if (projection.offsetMeters > MAX_SHAPE_OFFSET_METERS) continue;
    const ahead = (projection.alongMeters - fit.alongMeters) * fit.orientation;
    if (ahead < 30 || ahead > MAX_APPROACH_METERS) continue;
    upcoming.push({
      stopId: stop.id,
      name: stop.name,
      distanceMeters: ahead,
      etaMinutes: (ahead / 1000 / speed.kmh) * 60,
    });
  }
  return {
    routeId,
    stops: upcoming.sort((a, b) => a.distanceMeters - b.distanceMeters).slice(0, limit),
  };
}

/** "2 min" / "<1 min" for ETA chips. */
export function formatEta(minutes: number): string {
  if (minutes < 1) return "<1 min";
  return `${Math.round(minutes)} min`;
}

/** "850 m" / "12.4 km". */
export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters / 10) * 10} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}
