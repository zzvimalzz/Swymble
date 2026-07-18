import { describe, expect, it } from "vitest";

import { latestWithDelta, sliceRange } from "./fuel";

const rows = [
  { date: "2023-07-06", ron95: 2.05, ron97: 3.37, diesel: 2.15 },
  { date: "2025-07-10", ron95: 2.05, ron97: 3.18, diesel: 2.88 },
  { date: "2026-07-09", ron95: 3.37, ron97: 4.0, diesel: 3.97 },
  { date: "2026-07-16", ron95: 3.42, ron97: 4.0, diesel: 4.07 },
];

describe("sliceRange", () => {
  it("keeps rows within the trailing window measured from the latest row", () => {
    expect(sliceRange(rows, "1y").map((r) => r.date)).toEqual(["2026-07-09", "2026-07-16"]);
    expect(sliceRange(rows, "3y").map((r) => r.date)).toEqual([
      "2025-07-10",
      "2026-07-09",
      "2026-07-16",
    ]);
    expect(sliceRange(rows, "all")).toHaveLength(4);
  });

  it("handles empty input", () => {
    expect(sliceRange([], "1y")).toEqual([]);
  });
});

describe("latestWithDelta", () => {
  it("reports the latest prices with week-over-week change", () => {
    const latest = latestWithDelta(rows);
    expect(latest?.date).toBe("2026-07-16");
    expect(latest?.prices.ron95).toBe(3.42);
    expect(latest?.deltas).toEqual({ ron95: 0.05, ron97: 0, diesel: 0.1 });
  });

  it("returns zero deltas with a single row and null with none", () => {
    const single = latestWithDelta([rows[0]]);
    expect(single?.deltas).toEqual({ ron95: 0, ron97: 0, diesel: 0 });
    expect(latestWithDelta([])).toBeNull();
  });
});
