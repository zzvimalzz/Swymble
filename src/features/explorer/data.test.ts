import { describe, expect, it } from "vitest";

import {
  buildGdpIndex,
  buildIncomeIndex,
  buildPopulationIndex,
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

  it("formats figures for display", () => {
    expect(formatPeople(501100)).toBe("501,100");
    expect(formatRmMillions(11605.5)).toMatch(/^RM 11\.6 bn$/);
    expect(formatRmMillions(840)).toBe("RM 840 mn");
  });
});
