/**
 * Build metadata for "honest chrome" readouts (StatusLine, footer, boot).
 * VITE_COMMIT is injected by CI (.github/workflows/deploy.yml); local dev
 * shows 'dev' instead of pretending to know a hash. Every readout is true.
 */
export const BUILD_COMMIT: string = (import.meta.env.VITE_COMMIT ?? 'dev').slice(0, 7);

export const SWYMBLE_BASE_LOCATION = 'KUALA LUMPUR';

/** Formats the current time in Malaysia (MYT, UTC+8) as HH:MM. */
export function formatMalaysiaTime(date: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Kuala_Lumpur',
  }).format(date);
}
