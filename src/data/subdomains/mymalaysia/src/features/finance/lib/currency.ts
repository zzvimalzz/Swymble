/**
 * Currency conversion over a ringgit-based FX snapshot (see
 * services/fx-client — ECB reference rates via Frankfurter). MYR is the pivot:
 * every amount is taken to ringgit, then out to the target currency.
 */

import { FX_CURRENCIES, type FxSnapshot } from "@/services/fx-client";

import { round2 } from "./round";

/** MYR plus every quoted foreign currency, MYR first. */
export const CONVERT_CURRENCIES = ["MYR", ...FX_CURRENCIES] as const;
export type ConvertCurrency = (typeof CONVERT_CURRENCIES)[number];

/** Ringgit value of one unit of `currency`, or null if the rate is missing. */
export function rmPerUnit(currency: ConvertCurrency, snapshot: FxSnapshot): number | null {
  if (currency === "MYR") return 1;
  const rate = snapshot.rates.find((r) => r.currency === currency);
  if (!rate || rate.per <= 0) return null;
  return rate.rmPer / rate.per;
}

/**
 * Convert `amount` of `from` into `to`. Returns null when either rate is
 * unavailable so the UI can show an honest "rate unavailable" state rather
 * than a fabricated number.
 */
export function convertCurrency(
  amount: number,
  from: ConvertCurrency,
  to: ConvertCurrency,
  snapshot: FxSnapshot,
): number | null {
  const rmFrom = rmPerUnit(from, snapshot);
  const rmTo = rmPerUnit(to, snapshot);
  if (rmFrom === null || rmTo === null) return null;
  const inRinggit = (amount || 0) * rmFrom;
  return round2(inRinggit / rmTo);
}
