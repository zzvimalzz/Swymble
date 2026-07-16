import type {
  FuelPriceRow,
  GdpDistrictRow,
  HouseholdIncomeDistrictRow,
  PopulationDistrictRow,
} from "@/types/dataset-payloads";

/**
 * Pure joins and aggregations for the Explorer: artifact rows are keyed by
 * "state|district" (both sides come from DOSM, so names align for all 160
 * boundary districts; a missing key renders as "no data", never a crash).
 */

export type MetricId = "population" | "income" | "gdp";

export const METRICS: Array<{ id: MetricId; label: string }> = [
  { id: "population", label: "Population" },
  { id: "income", label: "Income" },
  { id: "gdp", label: "GDP" },
];

export function districtKey(state: string, district: string): string {
  return `${state}|${district}`;
}

export interface PopulationFigure {
  /** People (upstream is thousands; converted here). */
  value: number;
  year: number;
}

/** Latest-year population per district, in people. */
export function buildPopulationIndex(rows: PopulationDistrictRow[]): Map<string, PopulationFigure> {
  const index = new Map<string, PopulationFigure>();
  for (const row of rows) {
    const key = districtKey(row.state, row.district);
    const existing = index.get(key);
    if (!existing || row.year > existing.year) {
      index.set(key, { value: Math.round(row.population * 1000), year: row.year });
    }
  }
  return index;
}

export interface IncomeFigure {
  mean: number;
  median: number;
  year: number;
}

export function buildIncomeIndex(rows: HouseholdIncomeDistrictRow[]): Map<string, IncomeFigure> {
  const index = new Map<string, IncomeFigure>();
  for (const row of rows) {
    const key = districtKey(row.state, row.district);
    const existing = index.get(key);
    if (!existing || row.year > existing.year) {
      index.set(key, { mean: row.incomeMean, median: row.incomeMedian, year: row.year });
    }
  }
  return index;
}

export interface GdpFigure {
  /** RM millions, constant 2015 prices, all sectors (p0). */
  value: number;
  year: number;
}

export function buildGdpIndex(rows: GdpDistrictRow[]): Map<string, GdpFigure> {
  const index = new Map<string, GdpFigure>();
  for (const row of rows) {
    if (row.sector !== "p0") continue;
    const key = districtKey(row.state, row.district);
    const existing = index.get(key);
    if (!existing || row.year > existing.year) {
      index.set(key, { value: row.value, year: row.year });
    }
  }
  return index;
}

/** Sum of latest-year district populations for one state, in people. */
export function statePopulation(
  index: Map<string, PopulationFigure>,
  stateName: string,
): PopulationFigure | null {
  let total = 0;
  let year = 0;
  let found = false;
  for (const [key, figure] of index) {
    if (key.startsWith(`${stateName}|`)) {
      total += figure.value;
      year = Math.max(year, figure.year);
      found = true;
    }
  }
  return found ? { value: total, year } : null;
}

/** Latest fuel price row (for future Live use; unused by Explorer). */
export function latestFuelPrice(rows: FuelPriceRow[]): FuelPriceRow | null {
  return rows.length ? rows[rows.length - 1] : null;
}

const number = new Intl.NumberFormat("en-MY");

export function formatPeople(value: number): string {
  return number.format(value);
}

export function formatRm(value: number): string {
  return `RM ${number.format(Math.round(value))}`;
}

/** RM millions → compact display ("RM 11.6 bn", "RM 840 mn"). */
export function formatRmMillions(valueMillions: number): string {
  if (Math.abs(valueMillions) >= 1000) {
    return `RM ${(valueMillions / 1000).toLocaleString("en-MY", { maximumFractionDigits: 1 })} bn`;
  }
  return `RM ${valueMillions.toLocaleString("en-MY", { maximumFractionDigits: 0 })} mn`;
}
