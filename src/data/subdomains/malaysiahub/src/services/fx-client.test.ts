import { describe, expect, it } from "vitest";

import { toDisplayRates } from "./fx-client";

describe("toDisplayRates", () => {
  it("inverts MYR-based rates into RM-per-unit, JPY per 100", () => {
    const rates = toDisplayRates({ USD: 0.25, JPY: 35, SGD: 0.3 });
    const usd = rates.find((r) => r.currency === "USD");
    const jpy = rates.find((r) => r.currency === "JPY");
    expect(usd).toEqual({ currency: "USD", per: 1, rmPer: 4 });
    expect(jpy?.per).toBe(100);
    expect(jpy?.rmPer).toBeCloseTo(2.857, 3);
  });

  it("skips currencies missing from the table", () => {
    const rates = toDisplayRates({ USD: 0.25 });
    expect(rates).toHaveLength(1);
  });
});
