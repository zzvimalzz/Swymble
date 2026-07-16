import { describe, expect, it } from "vitest";

import { DISTRICT_META } from "@/maps/generated/boundary-meta";

import {
  normalizeValue,
  seriesForDistrict,
  stateSeries,
  valuesForYear,
  type MetricSeries,
} from "./atlas-data";

function makeSeries(overrides: Partial<MetricSeries> = {}): MetricSeries {
  const johorFids = DISTRICT_META.filter((d) => d.stateCode === 1).map((d) => d.id);
  const [a, b] = johorFids;
  return {
    id: "population",
    label: "Population",
    years: [2024, 2025],
    byYear: new Map([
      [
        2024,
        new Map([
          [a, 100],
          [b, 400],
        ]),
      ],
      [
        2025,
        new Map([
          [a, 150],
          [b, 900],
        ]),
      ],
    ]),
    domain: { min: 100, max: 900 },
    scale: "linear",
    format: String,
    updatedAt: "2025-01-01T00:00:00Z",
    quality: "ok",
    ...overrides,
  };
}

describe("atlas data model", () => {
  it("normalises within the cross-year domain (linear and sqrt)", () => {
    const linear = makeSeries();
    expect(normalizeValue(linear, 100)).toBe(0);
    expect(normalizeValue(linear, 900)).toBe(1);
    expect(normalizeValue(linear, 500)).toBeCloseTo(0.5);

    const sqrt = makeSeries({ scale: "sqrt" });
    expect(normalizeValue(sqrt, 500)).toBeCloseTo(Math.sqrt(0.5));
  });

  it("returns a value for every district, null where data is missing", () => {
    const series = makeSeries();
    const values = valuesForYear(series, 2025);
    expect(values).toHaveLength(DISTRICT_META.length);
    expect(values.filter((v) => v.raw !== null)).toHaveLength(2);
    expect(values.find((v) => v.raw === 900)?.value).toBe(1);
  });

  it("builds district and state time series", () => {
    const series = makeSeries();
    const fid = DISTRICT_META.filter((d) => d.stateCode === 1)[0].id;
    expect(seriesForDistrict(series, fid)).toEqual([
      { year: 2024, value: 100 },
      { year: 2025, value: 150 },
    ]);
    expect(stateSeries(series, 1)).toEqual([
      { year: 2024, value: 500 },
      { year: 2025, value: 1050 },
    ]);
  });
});
