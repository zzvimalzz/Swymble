import { describe, expect, it } from "vitest";

import { calculateLoan } from "./loan";

describe("calculateLoan", () => {
  it("matches the standard amortisation formula (RM100k, 4%, 30y)", () => {
    const r = calculateLoan({ principal: 100_000, annualRatePct: 4, years: 30 });
    expect(r.monthlyPayment).toBeCloseTo(477.42, 1);
    expect(r.months).toBe(360);
    expect(r.totalInterest).toBeCloseTo(r.totalPayment - 100_000, 2);
  });

  it("handles 0% financing as a flat division", () => {
    const r = calculateLoan({ principal: 12_000, annualRatePct: 0, years: 1 });
    expect(r.monthlyPayment).toBe(1_000);
    expect(r.totalPayment).toBe(12_000);
    expect(r.totalInterest).toBe(0);
  });

  it("returns zeros for empty input", () => {
    const r = calculateLoan({ principal: 0, annualRatePct: 5, years: 10 });
    expect(r.monthlyPayment).toBe(0);
    expect(r.totalPayment).toBe(0);
  });

  it("total payment always exceeds principal when interest is positive", () => {
    const r = calculateLoan({ principal: 250_000, annualRatePct: 3.5, years: 25 });
    expect(r.totalPayment).toBeGreaterThan(250_000);
    expect(r.totalInterest).toBeGreaterThan(0);
  });
});
