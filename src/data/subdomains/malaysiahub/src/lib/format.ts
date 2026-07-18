/** Shared display formatting for Malaysian figures (en-MY conventions). */

const number = new Intl.NumberFormat("en-MY");

export function formatPeople(value: number): string {
  return number.format(value);
}

export function formatRm(value: number): string {
  return `RM ${number.format(Math.round(value))}`;
}

const money = new Intl.NumberFormat("en-MY", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** RM with sen precision ("RM 3,825.50") — for money that must balance. */
export function formatRmPrecise(value: number): string {
  return `RM ${money.format(value)}`;
}

/** RM millions → compact display ("RM 11.6 bn", "RM 840 mn"). */
export function formatRmMillions(valueMillions: number): string {
  if (Math.abs(valueMillions) >= 1000) {
    return `RM ${(valueMillions / 1000).toLocaleString("en-MY", { maximumFractionDigits: 1 })} bn`;
  }
  return `RM ${valueMillions.toLocaleString("en-MY", { maximumFractionDigits: 0 })} mn`;
}

/** Full "updated" stamp with date AND time, Malaysian clock. */
export function formatMyDateTime(date: Date): string {
  return date.toLocaleString("en-MY", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: "Asia/Kuala_Lumpur",
  });
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
