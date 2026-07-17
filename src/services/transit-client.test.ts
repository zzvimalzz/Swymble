import { describe, expect, it } from "vitest";

import { entitiesToFeatures } from "./transit-client";

describe("entitiesToFeatures", () => {
  it("maps vehicle positions to agency-tagged GeoJSON points", () => {
    const features = entitiesToFeatures("ktmb", [
      {
        id: "1",
        vehicle: {
          position: { latitude: 3.14, longitude: 101.69, bearing: 90, speed: 52 },
          trip: { routeId: "PYG-KMT", tripId: "weekday_2139" },
          vehicle: { id: "weekday_2139", label: "SCS13" },
        },
      },
      // No position — must be skipped, never crash.
      { id: "2", vehicle: {} },
    ]);
    expect(features).toHaveLength(1);
    expect(features[0].geometry.coordinates).toEqual([101.69, 3.14]);
    expect(features[0].properties).toEqual({
      agency: "ktmb",
      route: "PYG-KMT",
      bearing: 90,
      tripId: "weekday_2139",
      vehicleId: "weekday_2139",
      label: "SCS13",
      speed: 52,
    });
  });

  it("fills identity fields with nulls when the feed omits them", () => {
    const features = entitiesToFeatures("rapid-bus-kl", [
      { id: "1", vehicle: { position: { latitude: 3.1, longitude: 101.6 } } },
    ]);
    expect(features[0].properties).toEqual({
      agency: "rapid-bus-kl",
      route: null,
      bearing: null,
      tripId: null,
      vehicleId: null,
      label: null,
      speed: null,
    });
  });
});
