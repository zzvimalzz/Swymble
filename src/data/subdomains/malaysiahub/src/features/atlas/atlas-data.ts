import { fetchArtifact } from "@/services/artifact-client";
import { computeQuality } from "@/services/dataset-registry";
import {
  gdpDistrictPayloadSchema,
  householdIncomeDistrictPayloadSchema,
  populationDistrictPayloadSchema,
} from "@/types/dataset-payloads";
import type { QualityStatus } from "@/types/dataset";
import { DISTRICT_META, STATE_META } from "@/maps/generated/boundary-meta";
import { formatPeople, formatRm, formatRmMillions } from "@/lib/format";

import type { MetricId } from "./layer-registry";

/**
 * The workspace's data model: every metric indexed by year and district fid,
 * with a fixed normalisation domain across ALL years — so scrubbing the
 * timeline shows genuine change, not per-year re-normalisation.
 */

export interface MetricSeries {
  id: MetricId;
  label: string;
  /** ISO-ish year list, ascending. */
  years: number[];
  /** year → (district fid → raw value). */
  byYear: Map<number, Map<number, number>>;
  /** Normalisation domain across all years. */
  domain: { min: number; max: number };
  /** Perceptual scale for the choropleth/extrusion (skewed data → sqrt). */
  scale: "linear" | "sqrt";
  format: (value: number) => string;
  updatedAt: string | null;
  quality: QualityStatus;
}

export interface AtlasData {
  metrics: Record<MetricId, MetricSeries>;
}

const FID_BY_KEY = new Map<string, number>();
{
  const stateNameByCode = new Map(STATE_META.map((s) => [s.code, s.name]));
  for (const district of DISTRICT_META) {
    FID_BY_KEY.set(`${stateNameByCode.get(district.stateCode)}|${district.name}`, district.id);
  }
}

function indexRows(
  rows: Array<{ state: string; district: string; year: number; value: number }>,
): Pick<MetricSeries, "years" | "byYear" | "domain"> {
  const byYear = new Map<number, Map<number, number>>();
  let min = Infinity;
  let max = -Infinity;
  for (const row of rows) {
    const fid = FID_BY_KEY.get(`${row.state}|${row.district}`);
    if (fid === undefined) continue; // upstream name not in boundaries — skip
    let yearMap = byYear.get(row.year);
    if (!yearMap) {
      yearMap = new Map();
      byYear.set(row.year, yearMap);
    }
    yearMap.set(fid, row.value);
    if (row.value < min) min = row.value;
    if (row.value > max) max = row.value;
  }
  const years = [...byYear.keys()].sort((a, b) => a - b);
  return { years, byYear, domain: { min, max } };
}

/** Normalise a raw value into 0..1 for the choropleth ramp / prism height. */
export function normalizeValue(series: MetricSeries, value: number): number {
  const { min, max } = series.domain;
  if (max <= min) return 0;
  const t = Math.min(1, Math.max(0, (value - min) / (max - min)));
  return series.scale === "sqrt" ? Math.sqrt(t) : t;
}

/** Values for every district in one year (null = no data). */
export function valuesForYear(
  series: MetricSeries,
  year: number,
): Array<{ id: number; value: number | null; raw: number | null }> {
  const yearMap = series.byYear.get(year);
  return DISTRICT_META.map((d) => {
    const raw = yearMap?.get(d.id);
    return raw === undefined
      ? { id: d.id, value: null, raw: null }
      : { id: d.id, value: normalizeValue(series, raw), raw };
  });
}

/** Time series for one district across the metric's years. */
export function seriesForDistrict(
  series: MetricSeries,
  fid: number,
): Array<{ year: number; value: number }> {
  return series.years
    .map((year) => ({ year, value: series.byYear.get(year)?.get(fid) }))
    .filter((p): p is { year: number; value: number } => p.value !== undefined);
}

/** Sum across one state's districts per year (population only makes sense). */
export function stateSeries(
  series: MetricSeries,
  stateCode: number,
): Array<{ year: number; value: number }> {
  const fids = DISTRICT_META.filter((d) => d.stateCode === stateCode).map((d) => d.id);
  return series.years.map((year) => {
    const yearMap = series.byYear.get(year);
    let sum = 0;
    for (const fid of fids) sum += yearMap?.get(fid) ?? 0;
    return { year, value: sum };
  });
}

export async function loadAtlasData(): Promise<AtlasData> {
  const [population, income, gdp] = await Promise.all([
    fetchArtifact("population-district", populationDistrictPayloadSchema),
    fetchArtifact("household-income-district", householdIncomeDistrictPayloadSchema),
    fetchArtifact("gdp-district", gdpDistrictPayloadSchema),
  ]);

  const populationSeries: MetricSeries = {
    id: "population",
    label: "Population",
    ...indexRows(
      population.data.map((r) => ({
        state: r.state,
        district: r.district,
        year: r.year,
        value: Math.round(r.population * 1000), // upstream unit: thousands
      })),
    ),
    scale: "sqrt",
    format: formatPeople,
    updatedAt: population.updatedAt,
    quality: computeQuality("annual", population.updatedAt),
  };

  const incomeSeries: MetricSeries = {
    id: "income",
    label: "Median household income",
    ...indexRows(
      income.data.map((r) => ({
        state: r.state,
        district: r.district,
        year: r.year,
        value: r.incomeMedian,
      })),
    ),
    scale: "linear",
    format: (v) => `${formatRm(v)}/mo`,
    updatedAt: income.updatedAt,
    quality: computeQuality("biennial", income.updatedAt),
  };

  const gdpSeries: MetricSeries = {
    id: "gdp",
    label: "GDP (all sectors)",
    ...indexRows(
      gdp.data
        .filter((r) => r.sector === "p0")
        .map((r) => ({ state: r.state, district: r.district, year: r.year, value: r.value })),
    ),
    scale: "sqrt",
    format: formatRmMillions,
    updatedAt: gdp.updatedAt,
    quality: computeQuality("annual", gdp.updatedAt),
  };

  return { metrics: { population: populationSeries, income: incomeSeries, gdp: gdpSeries } };
}
