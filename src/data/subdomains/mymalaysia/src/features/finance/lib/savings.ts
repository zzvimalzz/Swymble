/**
 * Savings growth with regular contributions — monthly compounding.
 *
 * Future value = future value of the initial deposit plus the future value of
 * an ordinary annuity of monthly contributions. Pure and deterministic; the
 * 0% edge falls back to simple accumulation.
 */

import { round2 } from "./round";

export interface SavingsInput {
  /** Opening balance, RM. */
  initialDeposit: number;
  /** Amount added every month, RM. */
  monthlyContribution: number;
  /** Nominal annual return, percent. */
  annualRatePct: number;
  /** Horizon in years. */
  years: number;
}

export interface SavingsBreakdown {
  futureValue: number;
  totalContributions: number;
  interestEarned: number;
  months: number;
}

/** Projects the ending balance and how much of it is growth vs. contributions. */
export function calculateSavings(input: SavingsInput): SavingsBreakdown {
  const initial = Math.max(0, input.initialDeposit || 0);
  const monthly = Math.max(0, input.monthlyContribution || 0);
  const months = Math.max(0, Math.round((input.years || 0) * 12));
  const i = Math.max(0, input.annualRatePct || 0) / 100 / 12;

  const totalContributions = initial + monthly * months;

  let futureValue: number;
  if (i === 0) {
    futureValue = totalContributions;
  } else {
    const growth = Math.pow(1 + i, months);
    futureValue = initial * growth + monthly * ((growth - 1) / i);
  }

  return {
    futureValue: round2(futureValue),
    totalContributions: round2(totalContributions),
    interestEarned: round2(futureValue - totalContributions),
    months,
  };
}
