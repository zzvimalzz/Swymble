import { describe, expect, it } from "vitest";

import type { FxSnapshot } from "@/services/fx-client";

import { convertCurrency, rmPerUnit } from "./currency";

// Synthetic snapshot: RM4.20 per USD, RM3.30 per SGD, RM3.00 per 100 JPY.
const snapshot: FxSnapshot = {
  date: "2026-07-18",
  rates: [
    { currency: "USD", per: 1, rmPer: 4.2 },
    { currency: "SGD", per: 1, rmPer: 3.3 },
    { currency: "JPY", per: 100, rmPer: 3.0 },
  ],
};

describe("rmPerUnit", () => {
  it("is 1 for MYR", () => {
    expect(rmPerUnit("MYR", snapshot)).toBe(1);
  });

  it("normalises per-100 quotes (JPY) to a single unit", () => {
    expect(rmPerUnit("JPY", snapshot)).toBeCloseTo(0.03, 6);
  });

  it("returns null when the rate is missing", () => {
    expect(rmPerUnit("EUR", snapshot)).toBeNull();
  });
});

describe("convertCurrency", () => {
  it("converts foreign → MYR", () => {
    expect(convertCurrency(100, "USD", "MYR", snapshot)).toBe(420);
  });

  it("converts MYR → foreign", () => {
    expect(convertCurrency(420, "MYR", "USD", snapshot)).toBe(100);
  });

  it("cross-converts through ringgit (USD → SGD)", () => {
    // 100 USD = RM420 = RM420 / 3.30 ≈ 127.27 SGD
    expect(convertCurrency(100, "USD", "SGD", snapshot)).toBeCloseTo(127.27, 2);
  });

  it("returns null when a leg's rate is unavailable", () => {
    expect(convertCurrency(100, "USD", "EUR", snapshot)).toBeNull();
  });
});
