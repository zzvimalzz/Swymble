import { describe, expect, it } from "vitest";

import {
  computeQuality,
  getDatasetManifest,
  listDatasetManifests,
  validateAllManifests,
} from "@/services/dataset-registry";

describe("dataset registry", () => {
  it("every manifest passes schema validation and ids are unique", () => {
    expect(() => validateAllManifests()).not.toThrow();
  });

  it("looks up manifests by id and rejects unknown ids", () => {
    expect(getDatasetManifest("fuel-price").title).toBe("Fuel prices");
    expect(() => getDatasetManifest("nope")).toThrow(/Unknown dataset id/);
  });

  it("filters by module", () => {
    const explorer = listDatasetManifests({ module: "explorer" });
    expect(explorer.length).toBeGreaterThan(0);
    expect(explorer.every((m) => m.module === "explorer")).toBe(true);
  });
});

describe("computeQuality", () => {
  const now = new Date("2026-07-16T00:00:00Z");

  it("is unavailable without an updatedAt", () => {
    expect(computeQuality("weekly", null, now)).toBe("unavailable");
  });

  it("is degraded on unparseable timestamps", () => {
    expect(computeQuality("weekly", "not-a-date", now)).toBe("degraded");
  });

  it("is ok within the cadence window and stale beyond it", () => {
    expect(computeQuality("weekly", "2026-07-10T00:00:00Z", now)).toBe("ok");
    expect(computeQuality("weekly", "2026-05-01T00:00:00Z", now)).toBe("stale");
    expect(computeQuality("annual", "2025-01-01T00:00:00Z", now)).toBe("ok");
    expect(computeQuality("annual", "2023-01-01T00:00:00Z", now)).toBe("stale");
  });

  it("static datasets never go stale", () => {
    expect(computeQuality("static", "2000-01-01T00:00:00Z", now)).toBe("ok");
  });
});
