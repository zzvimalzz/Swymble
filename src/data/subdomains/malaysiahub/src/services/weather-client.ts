import { z } from "zod";

import { DATA_GOV_MY_API_BASE } from "@/config/api";

/**
 * MET Malaysia forecasts via api.data.gov.my (CORS-open, no key).
 * Forecast text is published in Malay — rendered as-is with lang="ms".
 */

export const forecastEntrySchema = z.object({
  location: z.object({
    location_id: z.string(),
    location_name: z.string(),
  }),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  summary_forecast: z.string(),
  summary_when: z.string(),
  min_temp: z.number(),
  max_temp: z.number(),
});
const forecastResponseSchema = z.array(forecastEntrySchema);

export interface CityForecast {
  city: string;
  date: string;
  minTemp: number;
  maxTemp: number;
  /** Malay summary from MET, e.g. "Ribut petir di beberapa tempat". */
  summary: string;
  /** When it applies, e.g. "Petang". */
  when: string;
}

/** Today's date in Malaysia (the API's frame of reference). */
export function todayInMalaysia(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kuala_Lumpur" }).format(now);
}

/**
 * Picks the entry closest to today: today itself, else the nearest future
 * day, else the newest past one. Entries arrive newest-first.
 */
export function pickRelevantForecast<T extends { date: string }>(
  entries: T[],
  today: string,
): T | null {
  if (entries.length === 0) return null;
  const exact = entries.find((e) => e.date === today);
  if (exact) return exact;
  const future = entries.filter((e) => e.date > today);
  if (future.length > 0) return future.reduce((a, b) => (a.date < b.date ? a : b));
  return entries.reduce((a, b) => (a.date > b.date ? a : b));
}

async function fetchCityForecast(city: string, today: string): Promise<CityForecast | null> {
  const url = `${DATA_GOV_MY_API_BASE}/weather/forecast/?contains=${encodeURIComponent(
    city,
  )}@location__location_name&limit=7`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status} for ${city}`);
  // Defensive parse: a rate-limited/empty upstream body must fail with
  // context, never a bare "Unexpected end of JSON input".
  const body = await response.text();
  if (body.trim() === "") throw new Error(`empty response body for ${city} (${url})`);
  let parsed: unknown;
  try {
    parsed = JSON.parse(body);
  } catch {
    throw new Error(`malformed JSON for ${city}: ${body.slice(0, 120)}…`);
  }
  const entries = forecastResponseSchema.parse(parsed);
  // The contains-filter can match multiple locations; keep exact-name rows.
  const exact = entries.filter((e) => e.location.location_name === city);
  const entry = pickRelevantForecast(exact.length > 0 ? exact : entries, today);
  if (!entry) return null;
  return {
    city,
    date: entry.date,
    minTemp: entry.min_temp,
    maxTemp: entry.max_temp,
    summary: entry.summary_forecast,
    when: entry.summary_when,
  };
}

/**
 * Forecasts for several cities in parallel; cities that fail resolve to
 * null so one bad upstream row never empties the whole board.
 */
export async function fetchForecasts(cities: string[]): Promise<Array<CityForecast | null>> {
  const today = todayInMalaysia();
  const results = await Promise.allSettled(cities.map((city) => fetchCityForecast(city, today)));
  return results.map((r) => (r.status === "fulfilled" ? r.value : null));
}
