/** Shared display formatting for Malaysian figures (en-MY conventions). */

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

/** Compact people counts for dense UI ("3.8 m", "495 k"). */
export function formatPeopleCompact(value: number): string {
  if (Math.abs(value) >= 1_000_000) {
    return `${(value / 1_000_000).toLocaleString("en-MY", { maximumFractionDigits: 1 })} m`;
  }
  if (Math.abs(value) >= 1_000) {
    return `${Math.round(value / 1000).toLocaleString("en-MY")} k`;
  }
  return number.format(value);
}
