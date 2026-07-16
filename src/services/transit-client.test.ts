import { describe, expect, it } from "vitest";

import { entitiesToFeatures } from "./transit-client";

describe("entitiesToFeatures", () => {
  it("maps vehicle positions to agency-tagged GeoJSON points", () => {
    const features = entitiesToFeatures("ktmb", [
      {
        id: "1",
        vehicle: {
          position: { latitude: 3.14, longitude: 101.69, bearing: 90 },
          trip: { routeId: "PYG-KMT" },
        },
      },
      // No position — must be skipped, never crash.
      { id: "2", vehicle: {} },
    ]);
    expect(features).toHaveLength(1);
    expect(features[0].geometry.coordinates).toEqual([101.69, 3.14]);
    expect(features[0].properties).toEqual({ agency: "ktmb", route: "PYG-KMT", bearing: 90 });
  });
});
