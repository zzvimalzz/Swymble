import { z } from "zod";

import {
  fuelPricePayloadSchema,
  gdpDistrictPayloadSchema,
  householdIncomeDistrictPayloadSchema,
  populationDistrictPayloadSchema,
} from "@/types/dataset-payloads";

import type { ParquetRow } from "./lib/parquet";

/**
 * Per-dataset transforms: upstream parquet rows → app-ready payload.
 * Pure functions (unit-tested). Each returns the payload plus the true
 * data vintage (max date seen) — honesty about freshness comes from the
 * data, not the pipeline run time.
 */

export interface TransformResult {
  data: unknown;
  /** ISO timestamp of the newest data point. */
  updatedAt: string;
  rowCount: number;
}

export interface DatasetTransform {
  /** Sanity floor — fewer rows than this fails the run before publishing. */
  minRows: number;
  payloadSchema: z.ZodType;
  transform: (rows: ParquetRow[]) => TransformResult;
}

function asDate(value: unknown): Date {
  const date = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(date.getTime())) throw new Error(`Unparseable date value: ${String(value)}`);
  return date;
}

function asNumber(value: unknown): number {
  if (typeof value === "bigint") return Number(value);
  if (typeof value === "number") return value;
  const n = Number(value);
  if (Number.isNaN(n)) throw new Error(`Unparseable numeric value: ${String(value)}`);
  return n;
}

function maxDateIso(dates: Date[]): string {
  if (dates.length === 0) throw new Error("No rows to derive updatedAt from");
  return new Date(Math.max(...dates.map((d) => d.getTime()))).toISOString();
}

const populationDistrict: DatasetTransform = {
  minRows: 160,
  payloadSchema: populationDistrictPayloadSchema,
  transform: (rows) => {
    // The upstream file is the full cube (sex × age × ethnicity); the
    // artifact carries overall totals per district-year.
    const totals = rows.filter(
      (r) => r.sex === "both" && r.age === "overall" && r.ethnicity === "overall",
    );
    const dates = totals.map((r) => asDate(r.date));
    const data = totals.map((r, i) => ({
      state: String(r.state),
      district: String(r.district),
      year: dates[i].getUTCFullYear(),
      population: asNumber(r.population),
    }));
    return { data, updatedAt: maxDateIso(dates), rowCount: data.length };
  },
};

const gdpDistrict: DatasetTransform = {
  minRows: 160,
  payloadSchema: gdpDistrictPayloadSchema,
  transform: (rows) => {
    // Keep absolute values (series="abs"); growth is derivable client-side.
    const abs = rows.filter((r) => r.series === "abs");
    const dates = abs.map((r) => asDate(r.date));
    const data = abs.map((r, i) => ({
      state: String(r.state),
      district: String(r.district),
      year: dates[i].getUTCFullYear(),
      sector: String(r.sector) as "p0",
      value: asNumber(r.value),
    }));
    return { data, updatedAt: maxDateIso(dates), rowCount: data.length };
  },
};

const householdIncomeDistrict: DatasetTransform = {
  minRows: 150,
  payloadSchema: householdIncomeDistrictPayloadSchema,
  transform: (rows) => {
    const dates = rows.map((r) => asDate(r.date));
    const data = rows.map((r, i) => ({
      state: String(r.state),
      district: String(r.district),
      year: dates[i].getUTCFullYear(),
      incomeMean: asNumber(r.income_mean),
      incomeMedian: asNumber(r.income_median),
    }));
    return { data, updatedAt: maxDateIso(dates), rowCount: data.length };
  },
};

const fuelPrice: DatasetTransform = {
  minRows: 400,
  payloadSchema: fuelPricePayloadSchema,
  transform: (rows) => {
    // series_type "level" = actual prices (vs weekly change).
    const levels = rows.filter((r) => r.series_type === "level");
    const dates = levels.map((r) => asDate(r.date));
    const data = levels
      .map((r, i) => ({
        date: dates[i].toISOString().slice(0, 10),
        ron95: asNumber(r.ron95),
        ron97: asNumber(r.ron97),
        diesel: asNumber(r.diesel),
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
    return { data, updatedAt: maxDateIso(dates), rowCount: data.length };
  },
};

export const TRANSFORMS: Record<string, DatasetTransform> = {
  "population-district": populationDistrict,
  "gdp-district": gdpDistrict,
  "household-income-district": householdIncomeDistrict,
  "fuel-price": fuelPrice,
};
