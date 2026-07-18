/**
 * Malaysian statutory contribution and tax rates — the single versioned
 * source for every Finance calculator.
 *
 * These are STATUTORY figures that change with the annual Budget. Each block
 * carries an `asOf` date and an official `source`. When a Budget changes a
 * rate, update it here (and its `asOf`); nothing else in the app hardcodes a
 * ringgit figure. Estimates produced from these are labelled as estimates in
 * the UI — they are not a substitute for an official LHDN PCB calculation.
 *
 * Verified against official/authoritative sources, July 2026.
 */

export interface TaxBand {
  /** Upper bound of chargeable income for this band (RM); null = no ceiling. */
  upTo: number | null;
  /** Marginal rate applied to income within this band. */
  rate: number;
}

/**
 * Resident individual progressive income tax — YA 2024 / 2025 schedule.
 * Source: PwC Worldwide Tax Summaries (Malaysia), reviewed Jun 2026;
 * LHDN. Bands are the schedule unchanged since YA 2023.
 */
export const RESIDENT_TAX_BANDS: readonly TaxBand[] = [
  { upTo: 5_000, rate: 0 },
  { upTo: 20_000, rate: 0.01 },
  { upTo: 35_000, rate: 0.03 },
  { upTo: 50_000, rate: 0.06 },
  { upTo: 70_000, rate: 0.11 },
  { upTo: 100_000, rate: 0.19 },
  { upTo: 400_000, rate: 0.25 },
  { upTo: 600_000, rate: 0.26 },
  { upTo: 2_000_000, rate: 0.28 },
  { upTo: null, rate: 0.3 },
] as const;

export const TAX = {
  asOf: "2025-01-01",
  yearOfAssessment: "YA 2025",
  source: "https://taxsummaries.pwc.com/malaysia/individual/taxes-on-personal-income",
  bands: RESIDENT_TAX_BANDS,
  /** Flat rate for non-residents (< 182 days), no personal reliefs. */
  nonResidentRate: 0.3,
  reliefs: {
    /** Automatic individual relief. */
    individual: 9_000,
    /** EPF + approved-scheme relief sub-limit (combined life-insurance cap is higher). */
    epfCap: 4_000,
    /** SOCSO/PERKESO relief cap. */
    socsoCap: 350,
  },
  /** Rebate for low chargeable income (individual). */
  rebate: {
    threshold: 35_000,
    amount: 400,
  },
} as const;

/**
 * EPF / KWSP mandatory contribution — Malaysian citizens & PRs.
 * Source: KWSP Third Schedule; money.com.my EPF guide 2026.
 * Employer pays 13% when monthly wage ≤ RM5,000, otherwise 12%.
 */
export const EPF = {
  asOf: "2026-01-01",
  source: "https://www.kwsp.gov.my/en/employer/responsibilities/mandatory-contribution",
  employeeRate: 0.11,
  employerRateAtOrBelowThreshold: 0.13,
  employerRateAboveThreshold: 0.12,
  employerThreshold: 5_000,
  senior: {
    /** Age 60–75, citizens/PRs. */
    ageFrom: 60,
    employeeRate: 0,
    employerRate: 0.04,
  },
} as const;

/**
 * SOCSO / PERKESO (First Category: Employment Injury + Invalidity) and EIS.
 * Both cap contributions at the RM6,000 monthly wage ceiling (since 1 Oct
 * 2024). Official contributions follow a stepped RM-band table; we
 * approximate with the effective percentage of the capped wage, which is why
 * results are presented as estimates.
 * Source: PERKESO rate-of-contribution; SOCSO/EIS tables 2026.
 */
export const SOCSO = {
  asOf: "2024-10-01",
  source: "https://perkeso.gov.my/en/rate-of-contribution.html",
  wageCeiling: 6_000,
  /** First Category (under 60): employment injury + invalidity. */
  employeeRate: 0.005,
  employerRate: 0.0175,
  /** Second Category (60+): employment injury only, employer-funded. */
  seniorEmployeeRate: 0,
  seniorEmployerRate: 0.0125,
} as const;

export const EIS = {
  asOf: "2024-10-01",
  source: "https://perkeso.gov.my/en/rate-of-contribution.html",
  wageCeiling: 6_000,
  employeeRate: 0.002,
  employerRate: 0.002,
} as const;
