import { describe, expect, it } from "vitest";

import {
  buildGdpIndex,
  buildIncomeIndex,
  buildPopulationIndex,
  computeExtrusionHeights,
  districtKey,
  formatPeople,
  formatRmMillions,
  statePopulation,
} from "./data";

describe("explorer data joins", () => {
  it("keeps only the latest year per district and converts to people", () => {
    const index = buildPopulationIndex([
      { state: "Johor", district: "Batu Pahat", year: 2024, population: 495.3 },
      { state: "Johor", district: "Batu Pahat", year: 2025, population: 501.1 },
      { state: "Johor", district: "Kluang", year: 2025, population: 323.4 },
    ]);
    expect(index.get(districtKey("Johor", "Batu Pahat"))).toEqual({ value: 501100, year: 2025 });
    expect(index.size).toBe(2);
  });

  it("sums a state's districts for the latest year", () => {
    const index = buildPopulationIndex([
      { state: "Johor", district: "Batu Pahat", year: 2025, population: 500 },
      { state: "Johor", district: "Kluang", year: 2025, population: 300 },
      { state: "Perak", district: "Kinta", year: 2025, population: 700 },
    ]);
    expect(statePopulation(index, "Johor")).toEqual({ value: 800000, year: 2025 });
    expect(statePopulation(index, "Kedah")).toBeNull();
  });

  it("indexes income and gdp by latest year, gdp restricted to p0", () => {
    const income = buildIncomeIndex([
      { state: "Johor", district: "Kluang", year: 2022, incomeMean: 7000, incomeMedian: 5500 },
      { state: "Johor", district: "Kluang", year: 2024, incomeMean: 7600, incomeMedian: 5900 },
    ]);
    expect(income.get(districtKey("Johor", "Kluang"))?.year).toBe(2024);

    const gdp = buildGdpIndex([
      { state: "Johor", district: "Kluang", year: 2020, sector: "p0", value: 9000 },
      { state: "Johor", district: "Kluang", year: 2020, sector: "p3", value: 4000 },
    ]);
    expect(gdp.get(districtKey("Johor", "Kluang"))).toEqual({ value: 9000, year: 2020 });
  });

  it("computes sqrt-normalised extrusion heights with missing data at 0", () => {
    const population = buildPopulationIndex([
      { state: "Johor", district: "Batu Pahat", year: 2025, population: 400 },
      { state: "Johor", district: "Kluang", year: 2025, population: 100 },
    ]);
    const heights = computeExtrusionHeights(
      "population",
      { population, income: null, gdp: null },
      [
        { id: 101, stateCode: 1, name: "Batu Pahat" },
        { id: 102, stateCode: 1, name: "Kluang" },
        { id: 103, stateCode: 1, name: "Nowhere" },
      ],
      new Map([[1, "Johor"]]),
      1000,
    );
    expect(heights).toEqual([
      { id: 101, height: 1000 },
      { id: 102, height: 500 },
      { id: 103, height: 0 },
    ]);
  });

  it("formats figures for display", () => {
    expect(formatPeople(501100)).toBe("501,100");
    expect(formatRmMillions(11605.5)).toMatch(/^RM 11\.6 bn$/);
    expect(formatRmMillions(840)).toBe("RM 840 mn");
  });
});
