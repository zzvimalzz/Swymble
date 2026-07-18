import { describe, expect, it } from "vitest";

import {
  calculateSalary,
  eisContribution,
  epfContribution,
  progressiveTax,
  socsoContribution,
} from "./salary";

describe("progressiveTax", () => {
  it("is zero at or below the exempt band", () => {
    expect(progressiveTax(0)).toBe(0);
    expect(progressiveTax(5_000)).toBe(0);
  });

  // Anchored to LHDN's published tax-on-first-N figures.
  it("matches the official cumulative tax at band boundaries", () => {
    expect(progressiveTax(50_000)).toBe(1_500);
    expect(progressiveTax(70_000)).toBe(3_700);
    expect(progressiveTax(100_000)).toBe(9_400);
  });
});

describe("epfContribution", () => {
  it("uses 11% employee / 13% employer at or below RM5,000", () => {
    expect(epfContribution(5_000)).toEqual({ employee: 550, employer: 650 });
  });

  it("drops the employer rate to 12% above RM5,000", () => {
    expect(epfContribution(8_000)).toEqual({ employee: 880, employer: 960 });
  });

  it("applies senior (60+) rates: 0% employee / 4% employer", () => {
    expect(epfContribution(5_000, true)).toEqual({ employee: 0, employer: 200 });
  });
});

describe("socsoContribution", () => {
  it("charges 0.5% / 1.75% under the ceiling", () => {
    expect(socsoContribution(3_000)).toEqual({ employee: 15, employer: 52.5 });
  });

  it("caps the wage base at RM6,000", () => {
    expect(socsoContribution(9_000)).toEqual({ employee: 30, employer: 105 });
  });

  it("switches 60+ to employer-only Second Category", () => {
    expect(socsoContribution(3_000, true)).toEqual({ employee: 0, employer: 37.5 });
  });
});

describe("eisContribution", () => {
  it("charges 0.2% each side, capped at RM6,000", () => {
    expect(eisContribution(3_000)).toEqual({ employee: 6, employer: 6 });
    expect(eisContribution(9_000)).toEqual({ employee: 12, employer: 12 });
  });

  it("excludes workers aged 60+", () => {
    expect(eisContribution(3_000, true)).toEqual({ employee: 0, employer: 0 });
  });
});

describe("calculateSalary", () => {
  it("computes a full breakdown for a RM5,000 earner", () => {
    const r = calculateSalary({ monthlyWage: 5_000 });
    expect(r.epf).toEqual({ employee: 550, employer: 650 });
    expect(r.socso).toEqual({ employee: 25, employer: 87.5 });
    expect(r.eis).toEqual({ employee: 10, employer: 10 });
    // chargeable 46,700 → tax 1,302 → RM108.50/mo
    expect(r.annual.chargeableIncome).toBe(46_700);
    expect(r.annual.incomeTax).toBe(1_302);
    expect(r.monthlyTax).toBe(108.5);
    expect(r.monthlyNet).toBe(4_306.5);
    expect(r.employerMonthlyCost).toBe(5_747.5);
  });

  it("wipes tax for low earners via the RM400 rebate", () => {
    const r = calculateSalary({ monthlyWage: 3_000 });
    expect(r.annual.rebate).toBe(400);
    expect(r.annual.incomeTax).toBe(0);
    expect(r.monthlyTax).toBe(0);
  });

  it("take-home equals wage minus all employee deductions", () => {
    const r = calculateSalary({ monthlyWage: 7_500 });
    expect(r.monthlyNet).toBe(
      r.monthlyWage - r.monthlyEmployeeDeductions,
    );
  });

  it("honours EPF opt-out", () => {
    const r = calculateSalary({ monthlyWage: 5_000, includeEpf: false });
    expect(r.epf).toEqual({ employee: 0, employer: 0 });
  });
});
