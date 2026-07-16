import type { FuelPriceRow } from "@/types/dataset-payloads";

/** Pure helpers for the fuel board (unit-tested). */

export type FuelSeries = "ron95" | "ron97" | "diesel";

export const FUEL_SERIES: Array<{ id: FuelSeries; label: string }> = [
  { id: "ron95", label: "RON95" },
  { id: "ron97", label: "RON97" },
  { id: "diesel", label: "Diesel" },
];

/**
 * Chart series colors, validated with the dataviz palette checks against
 * both surfaces (fixed assignment: RON95 blue, RON97 gold, diesel violet).
 */
export const FUEL_COLORS: Record<"light" | "dark", Record<FuelSeries, string>> = {
  light: { ron95: "#3f68c0", ron97: "#a97a10", diesel: "#7c48c9" },
  dark: { ron95: "#5c86d9", ron97: "#b28320", diesel: "#8b5fd6" },
};

export type FuelRange = "1y" | "3y" | "all";

export const FUEL_RANGES: Array<{ id: FuelRange; label: string }> = [
  { id: "1y", label: "1Y" },
  { id: "3y", label: "3Y" },
  { id: "all", label: "All" },
];

/** Rows within the chosen trailing window (rows are date-ascending). */
export function sliceRange(rows: FuelPriceRow[], range: FuelRange): FuelPriceRow[] {
  if (range === "all" || rows.length === 0) return rows;
  const latest = new Date(rows[rows.length - 1].date);
  const cutoff = new Date(latest);
  cutoff.setFullYear(cutoff.getFullYear() - (range === "1y" ? 1 : 3));
  const cutoffIso = cutoff.toISOString().slice(0, 10);
  return rows.filter((r) => r.date >= cutoffIso);
}

export interface FuelLatest {
  date: string;
  prices: Record<FuelSeries, number>;
  /** RM change vs the previous week (0 when flat or no previous row). */
  deltas: Record<FuelSeries, number>;
}

export function latestWithDelta(rows: FuelPriceRow[]): FuelLatest | null {
  if (rows.length === 0) return null;
  const latest = rows[rows.length - 1];
  const previous = rows.length > 1 ? rows[rows.length - 2] : latest;
  const round = (n: number) => Math.round(n * 100) / 100;
  return {
    date: latest.date,
    prices: { ron95: latest.ron95, ron97: latest.ron97, diesel: latest.diesel },
    deltas: {
      ron95: round(latest.ron95 - previous.ron95),
      ron97: round(latest.ron97 - previous.ron97),
      diesel: round(latest.diesel - previous.diesel),
    },
  };
}

export function formatRmPerLitre(value: number): string {
  return `RM ${value.toFixed(2)}`;
}
