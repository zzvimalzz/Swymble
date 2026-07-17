import { describe, expect, it } from "vitest";

import {
  bearingDegrees,
  bearingDeltaDegrees,
  cumulativeMeters,
  haversineMeters,
  projectOntoLine,
  type LonLat,
} from "./geo";

// A straight west→east line at KL's latitude; 0.01° lon ≈ 1.11 km there.
const LINE: LonLat[] = [
  [101.6, 3.14],
  [101.61, 3.14],
  [101.62, 3.14],
  [101.63, 3.14],
];

describe("haversineMeters", () => {
  it("measures KL Sentral → KLCC at roughly 5.5 km", () => {
    const klSentral: LonLat = [101.6865, 3.1339];
    const klcc: LonLat = [101.7118, 3.1579];
    const d = haversineMeters(klSentral, klcc);
    expect(d).toBeGreaterThan(3500);
    expect(d).toBeLessThan(4500);
  });

  it("is zero for identical points", () => {
    expect(haversineMeters([101.7, 3.15], [101.7, 3.15])).toBe(0);
  });
});

describe("cumulativeMeters", () => {
  it("accumulates segment lengths monotonically from zero", () => {
    const cumulative = cumulativeMeters(LINE);
    expect(cumulative[0]).toBe(0);
    expect(cumulative).toHaveLength(LINE.length);
    for (let i = 1; i < cumulative.length; i += 1) {
      expect(cumulative[i]).toBeGreaterThan(cumulative[i - 1]);
    }
    // ~1.11 km per 0.01° step at the equator-adjacent latitude.
    expect(cumulative[3]).toBeGreaterThan(3200);
    expect(cumulative[3]).toBeLessThan(3450);
  });
});

describe("projectOntoLine", () => {
  const cumulative = cumulativeMeters(LINE);

  it("projects a point beside the line onto the nearest segment", () => {
    // Slightly north of the midpoint between vertices 1 and 2.
    const projection = projectOntoLine([101.615, 3.141], LINE, cumulative);
    expect(projection.segment).toBe(1);
    expect(projection.t).toBeCloseTo(0.5, 1);
    expect(projection.offsetMeters).toBeGreaterThan(100);
    expect(projection.offsetMeters).toBeLessThan(125);
    expect(projection.alongMeters).toBeGreaterThan(cumulative[1]);
    expect(projection.alongMeters).toBeLessThan(cumulative[2]);
  });

  it("clamps to the line ends", () => {
    const before = projectOntoLine([101.59, 3.14], LINE, cumulative);
    expect(before.alongMeters).toBe(0);
    const after = projectOntoLine([101.65, 3.14], LINE, cumulative);
    expect(after.alongMeters).toBeCloseTo(cumulative[3], 5);
  });
});

describe("bearings", () => {
  it("east is 90°, north is 0°", () => {
    expect(bearingDegrees([101.6, 3.14], [101.61, 3.14])).toBeCloseTo(90, 0);
    expect(bearingDegrees([101.6, 3.14], [101.6, 3.15])).toBeCloseTo(0, 0);
  });

  it("delta wraps around 360", () => {
    expect(bearingDeltaDegrees(350, 10)).toBe(20);
    expect(bearingDeltaDegrees(90, 270)).toBe(180);
  });
});
