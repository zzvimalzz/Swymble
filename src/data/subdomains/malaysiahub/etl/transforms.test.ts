import { describe, expect, it } from "vitest";

import { TRANSFORMS } from "./transforms";

describe("population-district transform", () => {
  const spec = TRANSFORMS["population-district"];

  it("keeps only overall totals and derives vintage from the data", () => {
    const rows = [
      {
        state: "Johor",
        district: "Batu Pahat",
        date: new Date("2024-01-01T00:00:00Z"),
        sex: "both",
        age: "overall",
        ethnicity: "overall",
        population: 495.3,
      },
      {
        state: "Johor",
        district: "Batu Pahat",
        date: new Date("2025-01-01T00:00:00Z"),
        sex: "both",
        age: "overall",
        ethnicity: "overall",
        population: 501.1,
      },
      // Must be excluded: a subgroup slice.
      {
        state: "Johor",
        district: "Batu Pahat",
        date: new Date("2025-01-01T00:00:00Z"),
        sex: "female",
        age: "85+",
        ethnicity: "overall",
        population: 3.2,
      },
    ];
    const result = spec.transform(rows);
    expect(result.rowCount).toBe(2);
    expect(result.updatedAt).toBe("2025-01-01T00:00:00.000Z");
    expect(result.data).toEqual([
      { state: "Johor", district: "Batu Pahat", year: 2024, population: 495.3 },
      { state: "Johor", district: "Batu Pahat", year: 2025, population: 501.1 },
    ]);
    expect(() => spec.payloadSchema.parse(result.data)).not.toThrow();
  });
});

describe("gdp-district transform", () => {
  it("keeps absolute series only", () => {
    const spec = TRANSFORMS["gdp-district"];
    const rows = [
      {
        series: "abs",
        state: "Johor",
        district: "Batu Pahat",
        date: new Date("2020-01-01T00:00:00Z"),
        sector: "p0",
        value: 11605.5,
      },
      {
        series: "growth_yoy",
        state: "Johor",
        district: "Batu Pahat",
        date: new Date("2020-01-01T00:00:00Z"),
        sector: "p0",
        value: 1.2,
      },
    ];
    const result = spec.transform(rows);
    expect(result.rowCount).toBe(1);
    expect(result.data).toEqual([
      { state: "Johor", district: "Batu Pahat", year: 2020, sector: "p0", value: 11605.5 },
    ]);
  });
});

describe("household-income transform", () => {
  it("converts BigInt income columns", () => {
    const spec = TRANSFORMS["household-income-district"];
    const rows = [
      {
        state: "Johor",
        district: "Batu Pahat",
        date: new Date("2022-01-01T00:00:00Z"),
        income_mean: 7569n,
        income_median: 5871n,
      },
    ];
    const result = spec.transform(rows);
    expect(result.data).toEqual([
      { state: "Johor", district: "Batu Pahat", year: 2022, incomeMean: 7569, incomeMedian: 5871 },
    ]);
    expect(() => spec.payloadSchema.parse(result.data)).not.toThrow();
  });
});

describe("fuel-price transform", () => {
  it("keeps price levels, sorted by date", () => {
    const spec = TRANSFORMS["fuel-price"];
    const rows = [
      {
        series_type: "level",
        date: new Date("2026-07-10T00:00:00Z"),
        ron95: 2.05,
        ron97: 4.0,
        diesel: 3.97,
      },
      {
        series_type: "change_weekly",
        date: new Date("2026-07-10T00:00:00Z"),
        ron95: 0,
        ron97: 0,
        diesel: 0,
      },
      {
        series_type: "level",
        date: new Date("2026-07-03T00:00:00Z"),
        ron95: 2.05,
        ron97: 3.98,
        diesel: 3.95,
      },
    ];
    const result = spec.transform(rows);
    expect(result.rowCount).toBe(2);
    expect((result.data as Array<{ date: string }>).map((r) => r.date)).toEqual([
      "2026-07-03",
      "2026-07-10",
    ]);
    expect(result.updatedAt).toBe("2026-07-10T00:00:00.000Z");
  });
});
