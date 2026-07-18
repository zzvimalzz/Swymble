import { describe, expect, it } from "vitest";

import type { TransitNetworkPayload } from "@/types/transit-network";

import { indexNetworks, resolveRouteId, routesToGeoJson, stopsToGeoJson } from "./transit-network";

const rail: TransitNetworkPayload = {
  network: "rapid-rail-kl",
  mode: "rail",
  label: "Rapid Rail KL",
  routes: [
    {
      id: "KJ",
      shortName: "KJL",
      longName: "LRT Kelana Jaya Line",
      color: "#d50032",
      category: "LRT",
    },
  ],
  stops: [{ id: "KJ10", name: "KLCC", lat: 3.158, lon: 101.713, routeIds: ["KJ"] }],
  shapes: [
    {
      routeId: "KJ",
      direction: 0,
      coords: [
        [101.7, 3.15],
        [101.72, 3.16],
      ],
    },
  ],
  tripRoutes: {},
};

const ktmb: TransitNetworkPayload = {
  network: "ktmb",
  mode: "rail",
  label: "KTM trains",
  routes: [
    { id: "SH", shortName: "SH", longName: "Intercity Shuttle", color: null, category: "KTM" },
  ],
  stops: [{ id: "50500", name: "Taman Wahyu", lat: 3.214, lon: 101.672, routeIds: ["SH"] }],
  shapes: [],
  tripRoutes: { "34": "SH" },
};

describe("indexNetworks", () => {
  const index = indexNetworks([rail, ktmb]);

  it("indexes routes and stops with network + mode context", () => {
    expect(index.routesById.get("KJ")?.mode).toBe("rail");
    expect(index.stopsById.get("KJ10")?.network).toBe("rapid-rail-kl");
  });

  it("pre-measures shapes for ETA math", () => {
    const [shape] = index.shapesByRoute.get("KJ")!;
    expect(shape.cumulative).toHaveLength(2);
    expect(shape.cumulative[1]).toBeGreaterThan(2000);
  });

  it("resolves realtime identities: route id directly, trip id via the map", () => {
    expect(resolveRouteId(index, "KJ", null)).toBe("KJ");
    expect(resolveRouteId(index, null, "34")).toBe("SH");
    expect(resolveRouteId(index, "nope", "nope")).toBeNull();
  });
});

describe("GeoJSON projections", () => {
  const index = indexNetworks([rail, ktmb]);

  it("emits one colored line per route that has a shape", () => {
    const routes = routesToGeoJson(index);
    expect(routes.features).toHaveLength(1); // KTMB has no shape here
    expect(routes.features[0].properties).toMatchObject({
      routeId: "KJ",
      color: "#d50032",
      mode: "rail",
    });
  });

  it("emits every stop with mode + name for the map layers", () => {
    const stops = stopsToGeoJson(index);
    expect(stops.features).toHaveLength(2);
    expect(stops.features[0].properties.name).toBe("KLCC");
  });
});
