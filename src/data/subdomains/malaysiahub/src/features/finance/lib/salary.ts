/**
 * Salary → take-home pay for Malaysian citizens / PRs.
 *
 * Pure, deterministic functions over the versioned rates in `rates.ts`.
 * Everything here is an ESTIMATE: statutory contributions use the effective
 * percentage method (SOCSO/EIS in reality follow a stepped wage-band table),
 * and monthly income tax is an averaged PCB approximation, not LHDN's
 * official MTD computation. Foreign-worker rules are out of scope for v1.
 */

import { EIS, EPF, RESIDENT_TAX_BANDS, SOCSO, TAX, type TaxBand } from "./rates";
import { round2 } from "./round";

const cap = (value: number, ceiling: number): number => Math.min(value, ceiling);

export interface ContributionLine {
  employee: number;
  employer: number;
}

export interface SalaryInput {
  /** Gross monthly wage, RM. */
  monthlyWage: number;
  /** Age 60+ changes EPF/SOCSO rates and removes EIS. Default false. */
  age60Plus?: boolean;
  /** Whether EPF is contributed (voluntary opt-outs are rare). Default true. */
  includeEpf?: boolean;
  /** Extra annual tax reliefs beyond the automatic individual + statutory ones (RM). */
  additionalReliefs?: number;
}

export interface SalaryBreakdown {
  monthlyWage: number;
  epf: ContributionLine;
  socso: ContributionLine;
  eis: ContributionLine;
  /** Estimated monthly income tax (averaged PCB). */
  monthlyTax: number;
  /** Total monthly deductions borne by the employee. */
  monthlyEmployeeDeductions: number;
  /** Monthly take-home pay. */
  monthlyNet: number;
  /** What the employer pays monthly: wage + employer contributions. */
  employerMonthlyCost: number;
  annual: {
    grossIncome: number;
    chargeableIncome: number;
    incomeTax: number;
    rebate: number;
    netIncome: number;
    epfEmployee: number;
    epfEmployer: number;
  };
  meta: {
    epfAsOf: string;
    taxAsOf: string;
    yearOfAssessment: string;
  };
}

/** EPF employer rate depends on the wage threshold (13% ≤ RM5,000, else 12%). */
export function epfContribution(monthlyWage: number, age60Plus = false): ContributionLine {
  if (age60Plus) {
    return {
      employee: round2(monthlyWage * EPF.senior.employeeRate),
      employer: round2(monthlyWage * EPF.senior.employerRate),
    };
  }
  const employerRate =
    monthlyWage <= EPF.employerThreshold
      ? EPF.employerRateAtOrBelowThreshold
      : EPF.employerRateAboveThreshold;
  return {
    employee: round2(monthlyWage * EPF.employeeRate),
    employer: round2(monthlyWage * employerRate),
  };
}

/** SOCSO First Category (< 60) or Second Category (60+), capped at the ceiling. */
export function socsoContribution(monthlyWage: number, age60Plus = false): ContributionLine {
  const wage = cap(monthlyWage, SOCSO.wageCeiling);
  const employeeRate = age60Plus ? SOCSO.seniorEmployeeRate : SOCSO.employeeRate;
  const employerRate = age60Plus ? SOCSO.seniorEmployerRate : SOCSO.employerRate;
  return {
    employee: round2(wage * employeeRate),
    employer: round2(wage * employerRate),
  };
}

/** EIS — citizens/PRs under 60 only; capped at the ceiling. */
export function eisContribution(monthlyWage: number, age60Plus = false): ContributionLine {
  if (age60Plus) return { employee: 0, employer: 0 };
  const wage = cap(monthlyWage, EIS.wageCeiling);
  return {
    employee: round2(wage * EIS.employeeRate),
    employer: round2(wage * EIS.employerRate),
  };
}

/** Progressive resident income tax on a chargeable income (before rebate). */
export function progressiveTax(
  chargeableIncome: number,
  bands: readonly TaxBand[] = RESIDENT_TAX_BANDS,
): number {
  if (chargeableIncome <= 0) return 0;
  let tax = 0;
  let lowerBound = 0;
  for (const band of bands) {
    const upper = band.upTo ?? Number.POSITIVE_INFINITY;
    if (chargeableIncome <= lowerBound) break;
    const taxableInBand = Math.min(chargeableIncome, upper) - lowerBound;
    tax += taxableInBand * band.rate;
    lowerBound = upper;
  }
  return round2(tax);
}

/** Full salary breakdown: contributions, estimated tax, and take-home. */
export function calculateSalary(input: SalaryInput): SalaryBreakdown {
  const monthlyWage = Math.max(0, input.monthlyWage || 0);
  const age60Plus = input.age60Plus ?? false;
  const includeEpf = input.includeEpf ?? true;
  const additionalReliefs = Math.max(0, input.additionalReliefs ?? 0);

  const epf = includeEpf
    ? epfContribution(monthlyWage, age60Plus)
    : { employee: 0, employer: 0 };
  const socso = socsoContribution(monthlyWage, age60Plus);
  const eis = eisContribution(monthlyWage, age60Plus);

  const annualGross = monthlyWage * 12;
  const epfEmployeeAnnual = epf.employee * 12;
  const socsoEmployeeAnnual = socso.employee * 12;

  const reliefs =
    TAX.reliefs.individual +
    Math.min(epfEmployeeAnnual, TAX.reliefs.epfCap) +
    Math.min(socsoEmployeeAnnual, TAX.reliefs.socsoCap) +
    additionalReliefs;

  const chargeableIncome = Math.max(0, annualGross - reliefs);
  const taxBeforeRebate = progressiveTax(chargeableIncome);
  const rebate = chargeableIncome <= TAX.rebate.threshold ? TAX.rebate.amount : 0;
  const incomeTax = Math.max(0, round2(taxBeforeRebate - rebate));
  const monthlyTax = round2(incomeTax / 12);

  const monthlyEmployeeDeductions = round2(
    epf.employee + socso.employee + eis.employee + monthlyTax,
  );
  const monthlyNet = round2(monthlyWage - monthlyEmployeeDeductions);
  const employerMonthlyCost = round2(
    monthlyWage + epf.employer + socso.employer + eis.employer,
  );

  return {
    monthlyWage,
    epf,
    socso,
    eis,
    monthlyTax,
    monthlyEmployeeDeductions,
    monthlyNet,
    employerMonthlyCost,
    annual: {
      grossIncome: round2(annualGross),
      chargeableIncome: round2(chargeableIncome),
      incomeTax,
      rebate,
      netIncome: round2(monthlyNet * 12),
      epfEmployee: round2(epfEmployeeAnnual),
      epfEmployer: round2(epf.employer * 12),
    },
    meta: {
      epfAsOf: EPF.asOf,
      taxAsOf: TAX.asOf,
      yearOfAssessment: TAX.yearOfAssessment,
    },
  };
}
