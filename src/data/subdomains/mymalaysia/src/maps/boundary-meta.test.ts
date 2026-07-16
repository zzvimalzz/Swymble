import { describe, expect, it } from "vitest";

import { DISTRICT_META, MALAYSIA_BBOX, STATE_META } from "@/maps/generated/boundary-meta";

describe("generated boundary metadata", () => {
  it("covers all of Malaysia's states and districts", () => {
    expect(STATE_META).toHaveLength(16);
    expect(DISTRICT_META).toHaveLength(160);
  });

  it("has unique ids", () => {
    expect(new Set(STATE_META.map((s) => s.code)).size).toBe(STATE_META.length);
    expect(new Set(DISTRICT_META.map((d) => d.id)).size).toBe(DISTRICT_META.length);
  });

  it("links every district to an existing state", () => {
    const stateCodes = new Set(STATE_META.map((s) => s.code));
    for (const district of DISTRICT_META) {
      expect(stateCodes.has(district.stateCode)).toBe(true);
    }
  });

  it("keeps every bbox inside Malaysia's bbox and well-formed", () => {
    const [minX, minY, maxX, maxY] = MALAYSIA_BBOX;
    for (const { bbox } of [...STATE_META, ...DISTRICT_META]) {
      const [a, b, c, d] = bbox;
      expect(a).toBeLessThan(c);
      expect(b).toBeLessThan(d);
      expect(a).toBeGreaterThanOrEqual(minX);
      expect(b).toBeGreaterThanOrEqual(minY);
      expect(c).toBeLessThanOrEqual(maxX);
      expect(d).toBeLessThanOrEqual(maxY);
    }
  });

  it("stays within plausible coordinates for Malaysia", () => {
    const [minX, minY, maxX, maxY] = MALAYSIA_BBOX;
    expect(minX).toBeGreaterThan(99);
    expect(maxX).toBeLessThan(120);
    expect(minY).toBeGreaterThan(0);
    expect(maxY).toBeLessThan(8);
  });
});
