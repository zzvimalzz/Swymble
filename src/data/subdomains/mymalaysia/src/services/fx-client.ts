import { z } from "zod";

/**
 * Ringgit reference rates. Bank Negara's own API sends no CORS headers, so
 * browsers can't call it; until the realtime proxy worker ships, rates come
 * from the ECB reference set via Frankfurter (CORS-open, no key) — clearly
 * attributed as such, never presented as BNM official rates.
 */

const FRANKFURTER_BASE = "https://api.frankfurter.dev/v1";

const responseSchema = z.object({
  base: z.literal("MYR"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  rates: z.record(z.string(), z.number()),
});

export interface FxRate {
  currency: string;
  /** Ringgit per one unit of the currency (per 100 for JPY). */
  rmPer: number;
  per: number;
}

export interface FxSnapshot {
  date: string;
  rates: FxRate[];
}

export const FX_CURRENCIES = ["USD", "EUR", "SGD", "GBP", "JPY", "CNY"] as const;

/** Builds display rates (RM per unit) from a MYR-based rate table. */
export function toDisplayRates(rates: Record<string, number>): FxRate[] {
  return FX_CURRENCIES.flatMap((currency) => {
    const myrToCurrency = rates[currency];
    if (!myrToCurrency || myrToCurrency <= 0) return [];
    const per = currency === "JPY" ? 100 : 1;
    return [{ currency, per, rmPer: (1 / myrToCurrency) * per }];
  });
}

export async function fetchFxRates(): Promise<FxSnapshot> {
  const url = `${FRANKFURTER_BASE}/latest?base=MYR&symbols=${FX_CURRENCIES.join(",")}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status} fetching FX rates`);
  const body = await response.text();
  if (body.trim() === "") throw new Error("empty FX response body");
  const parsed = responseSchema.parse(JSON.parse(body));
  return { date: parsed.date, rates: toDisplayRates(parsed.rates) };
}
