import { describe, expect, it } from "vitest";

import { forecastEntrySchema, pickRelevantForecast } from "./weather-client";

describe("forecast schema", () => {
  it("accepts a real API row", () => {
    const row = {
      location: { location_id: "Ds058", location_name: "Kuala Lumpur" },
      date: "2026-07-16",
      summary_forecast: "Tiada hujan",
      summary_when: "Sepanjang Hari",
      min_temp: 25,
      max_temp: 34,
      // Extra fields the API sends but we don't model:
      morning_forecast: "Tiada hujan",
    };
    expect(() => forecastEntrySchema.parse(row)).not.toThrow();
  });
});

describe("pickRelevantForecast", () => {
  const entries = [
    { date: "2026-07-22" },
    { date: "2026-07-18" },
    { date: "2026-07-16" },
    { date: "2026-07-15" },
  ];

  it("prefers today's entry", () => {
    expect(pickRelevantForecast(entries, "2026-07-16")?.date).toBe("2026-07-16");
  });

  it("falls back to the nearest future day", () => {
    expect(pickRelevantForecast(entries, "2026-07-17")?.date).toBe("2026-07-18");
  });

  it("falls back to the newest past day when nothing is upcoming", () => {
    expect(pickRelevantForecast(entries, "2026-08-01")?.date).toBe("2026-07-22");
  });

  it("returns null for no entries", () => {
    expect(pickRelevantForecast([], "2026-07-16")).toBeNull();
  });
});
