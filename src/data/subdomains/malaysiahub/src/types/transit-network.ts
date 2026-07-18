import { z } from "zod";

/**
 * The static transit network model — routes, stops, and simplified route
 * shapes derived from the official GTFS Static feeds (data.gov.my). One
 * artifact per network, produced by etl/gtfs and consumed by the transit
 * map. Live vehicle positions (GTFS-Realtime) join onto this by route id
 * (buses) or trip id (KTMB, via tripRoutes).
 */

export const TRANSIT_NETWORK_IDS = [
  "ktmb",
  "rapid-rail-kl",
  "rapid-bus-kl",
  "rapid-bus-penang",
  "rapid-bus-kuantan",
] as const;
export type TransitNetworkId = (typeof TRANSIT_NETWORK_IDS)[number];

export const transitModeSchema = z.enum(["rail", "bus"]);
export type TransitMode = z.infer<typeof transitModeSchema>;

export const transitRouteSchema = z.object({
  id: z.string().min(1),
  /** Rider-facing route number/code, e.g. "300", "KJL". */
  shortName: z.string(),
  /** Full route name, e.g. "LRT Kelana Jaya Line". */
  longName: z.string(),
  /** Official line color (#rrggbb) from the feed, or null when absent. */
  color: z
    .string()
    .regex(/^#[0-9a-f]{6}$/)
    .nullable(),
  /** Rail family when the feed provides one (LRT, MRT, BRT, MR, KTM). */
  category: z.string().nullable(),
});
export type TransitRoute = z.infer<typeof transitRouteSchema>;

export const transitStopSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  lat: z.number().gte(-90).lte(90),
  lon: z.number().gte(-180).lte(180),
  /** Every route calling at this stop (via stop_times ∘ trips). */
  routeIds: z.array(z.string()),
});
export type TransitStop = z.infer<typeof transitStopSchema>;

export const transitShapeSchema = z.object({
  routeId: z.string().min(1),
  direction: z.union([z.literal(0), z.literal(1)]),
  /** Simplified [lon, lat] polyline along the route. */
  coords: z.array(z.tuple([z.number(), z.number()])).min(2),
});
export type TransitShape = z.infer<typeof transitShapeSchema>;

export const transitNetworkPayloadSchema = z.object({
  network: z.enum(TRANSIT_NETWORK_IDS),
  mode: transitModeSchema,
  /** Agency label riders know, e.g. "Rapid Bus KL". */
  label: z.string().min(1),
  routes: z.array(transitRouteSchema).min(1),
  stops: z.array(transitStopSchema).min(1),
  shapes: z.array(transitShapeSchema),
  /**
   * trip id → route id, only for networks whose realtime feed omits
   * route ids (KTMB). Empty object elsewhere.
   */
  tripRoutes: z.record(z.string(), z.string()),
});
export type TransitNetworkPayload = z.infer<typeof transitNetworkPayloadSchema>;
