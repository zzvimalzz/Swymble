/**
 * Theme-dependent inline colors, hydration-safe.
 *
 * Never resolve a light/dark pair in JS for SSR-rendered inline styles —
 * the server renders the light value while a dark-mode client renders the
 * dark one, and React reports a hydration mismatch. CSS `light-dark()`
 * emits ONE string for both; the browser resolves it against
 * `color-scheme` (set globally in globals.css), so it also flips live when
 * the theme toggles.
 */
export interface ThemedColorPair {
  light: string;
  dark: string;
}

export function themedColor(pair: ThemedColorPair): string {
  return `light-dark(${pair.light}, ${pair.dark})`;
}
