import { describe, expect, it } from "vitest";

import { calculateSavings } from "./savings";

describe("calculateSavings", () => {
  it("compounds an initial deposit plus monthly contributions", () => {
    const r = calculateSavings({
      initialDeposit: 10_000,
      monthlyContribution: 500,
      annualRatePct: 5,
      years: 10,
    });
    expect(r.months).toBe(120);
    expect(r.totalContributions).toBe(70_000); // 10k + 500*120
    // ~RM94.1k ending balance; interest is the balance minus what was put in.
    expect(r.futureValue).toBeGreaterThan(90_000);
    expect(r.futureValue).toBeLessThan(98_000);
    expect(r.interestEarned).toBeCloseTo(r.futureValue - r.totalContributions, 2);
    expect(r.interestEarned).toBeGreaterThan(0);
  });

  it("falls back to simple accumulation at 0% return", () => {
    const r = calculateSavings({
      initialDeposit: 1_000,
      monthlyContribution: 100,
      annualRatePct: 0,
      years: 2,
    });
    expect(r.futureValue).toBe(3_400); // 1000 + 100*24
    expect(r.interestEarned).toBe(0);
  });

  it("grows a lump sum with no contributions", () => {
    const r = calculateSavings({
      initialDeposit: 10_000,
      monthlyContribution: 0,
      annualRatePct: 6,
      years: 1,
    });
    // 10k at 6% nominal, monthly compounding ≈ 10,616.78
    expect(r.futureValue).toBeCloseTo(10_616.78, 1);
    expect(r.totalContributions).toBe(10_000);
  });
});
