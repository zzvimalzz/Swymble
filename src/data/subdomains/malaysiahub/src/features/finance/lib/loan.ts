/**
 * Loan / financing repayment — standard amortisation.
 *
 * Pure and deterministic. Handles the 0% edge (flat division) so a
 * zero-interest financing plan still returns sane numbers.
 */

import { round2 } from "./round";

export interface LoanInput {
  /** Principal / financing amount, RM. */
  principal: number;
  /** Nominal annual interest rate, percent (e.g. 3.5 for 3.5%). */
  annualRatePct: number;
  /** Tenure in years. */
  years: number;
}

export interface LoanBreakdown {
  monthlyPayment: number;
  totalPayment: number;
  totalInterest: number;
  months: number;
  principal: number;
}

/** Monthly repayment and totals for an amortising loan. */
export function calculateLoan(input: LoanInput): LoanBreakdown {
  const principal = Math.max(0, input.principal || 0);
  const months = Math.max(0, Math.round((input.years || 0) * 12));
  const monthlyRate = Math.max(0, input.annualRatePct || 0) / 100 / 12;

  if (months === 0 || principal === 0) {
    return { monthlyPayment: 0, totalPayment: 0, totalInterest: 0, months, principal };
  }

  const monthlyPayment =
    monthlyRate === 0
      ? principal / months
      : (principal * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -months));

  const totalPayment = monthlyPayment * months;
  return {
    monthlyPayment: round2(monthlyPayment),
    totalPayment: round2(totalPayment),
    totalInterest: round2(totalPayment - principal),
    months,
    principal: round2(principal),
  };
}
