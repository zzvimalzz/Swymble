import { describe, expect, it } from "vitest";
import type { Feature, Point } from "geojson";

import type { TransitVehicleProps } from "@/services/transit-client";
import { indexNetworks } from "@/services/transit-network";
import type { TransitNetworkPayload } from "@/types/transit-network";

import {
  arrivalsForStop,
  formatDistance,
  formatEta,
  upcomingStopsForVehicle,
  vehicleKey,
} from "./eta";

/**
 * A straight west→east bus route at KL latitude with three stops. 0.01°
 * of longitude ≈ 1.11 km here, so the geometry is easy to reason about.
 */
const network: TransitNetworkPayload = {
  network: "rapid-bus-kl",
  mode: "bus",
  label: "Rapid Bus KL",
  routes: [
    {
      id: "U3000",
      shortName: "300",
      longName: "Maluri ~ Lebuh Ampang",
      color: "#006cff",
      category: null,
    },
  ],
  stops: [
    { id: "A", name: "Stop A", lat: 3.14, lon: 101.6, routeIds: ["U3000"] },
    { id: "B", name: "Stop B", lat: 3.14, lon: 101.62, routeIds: ["U3000"] },
    { id: "C", name: "Stop C", lat: 3.14, lon: 101.64, routeIds: ["U3000"] },
  ],
  shapes: [
    {
      routeId: "U3000",
      direction: 0,
      coords: [
        [101.6, 3.14],
        [101.62, 3.14],
        [101.64, 3.14],
      ],
    },
  ],
  tripRoutes: {},
};

function vehicle(
  lon: number,
  props: Partial<TransitVehicleProps> = {},
): Feature<Point, TransitVehicleProps> {
  return {
    type: "Feature",
    geometry: { type: "Point", coordinates: [lon, 3.1405] },
    properties: {
      agency: "rapid-bus-kl",
      route: "U3000",
      bearing: 90, // travelling east, with the shape
      tripId: null,
      vehicleId: "bus-1",
      label: null,
      speed: null,
      ...props,
    },
  };
}

const index = indexNetworks([network]);

describe("arrivalsForStop", () => {
  it("finds an approaching vehicle with distance and ETA along the route", () => {
    // Vehicle just past stop A, heading east toward B (~2.2 km away → C).
    const arrivals = arrivalsForStop("C", [vehicle(101.605)], index);
    expect(arrivals).toHaveLength(1);
    const [arrival] = arrivals;
    expect(arrival.routeShortName).toBe("300");
    expect(arrival.distanceMeters).toBeGreaterThan(3500);
    expect(arrival.distanceMeters).toBeLessThan(4200);
    // Default bus speed 18 km/h → ~13 min.
    expect(arrival.etaMinutes).toBeGreaterThan(10);
    expect(arrival.etaMinutes).toBeLessThan(16);
    expect(arrival.speedFromFeed).toBe(false);
  });

  it("uses the reported feed speed when present", () => {
    const arrivals = arrivalsForStop("B", [vehicle(101.605, { speed: 36 })], index);
    expect(arrivals[0].speedFromFeed).toBe(true);
    // ~1.7 km at 36 km/h ≈ 3 min.
    expect(arrivals[0].etaMinutes).toBeGreaterThan(2);
    expect(arrivals[0].etaMinutes).toBeLessThan(4);
  });

  it("ignores vehicles heading away from the stop", () => {
    // Same position but bearing west (against the shape): stop C is behind.
    const arrivals = arrivalsForStop("C", [vehicle(101.605, { bearing: 270 })], index);
    expect(arrivals).toHaveLength(0);
  });

  it("ignores vehicles on other routes and unknown stops", () => {
    expect(arrivalsForStop("C", [vehicle(101.605, { route: "OTHER" })], index)).toHaveLength(0);
    expect(arrivalsForStop("nope", [vehicle(101.605)], index)).toHaveLength(0);
  });
});

describe("upcomingStopsForVehicle", () => {
  it("lists the stops ahead in travel order", () => {
    const { routeId, stops } = upcomingStopsForVehicle(vehicle(101.605), index);
    expect(routeId).toBe("U3000");
    expect(stops.map((s) => s.stopId)).toEqual(["B", "C"]);
    expect(stops[0].distanceMeters).toBeLessThan(stops[1].distanceMeters);
  });

  it("reverses with the vehicle's bearing", () => {
    const { stops } = upcomingStopsForVehicle(vehicle(101.635, { bearing: 270 }), index);
    expect(stops.map((s) => s.stopId)).toEqual(["B", "A"]);
  });
});

describe("formatting", () => {
  it("formats ETAs and distances for chips", () => {
    expect(formatEta(0.4)).toBe("<1 min");
    expect(formatEta(4.6)).toBe("5 min");
    expect(formatDistance(840)).toBe("840 m");
    expect(formatDistance(12_400)).toBe("12.4 km");
  });

  it("derives a stable vehicle key", () => {
    expect(vehicleKey(vehicle(101.6).properties)).toBe("rapid-bus-kl:bus-1");
    expect(vehicleKey(vehicle(101.6, { vehicleId: null, tripId: "t9" }).properties)).toBe(
      "rapid-bus-kl:t9",
    );
  });
});
