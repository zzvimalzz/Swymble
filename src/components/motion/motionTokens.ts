/**
 * Motion tokens — the single source of truth for animation timing in TS.
 * Mirrors the --sw-t-* / --sw-ease-* custom properties in styles/tokens.css;
 * if you change a value here, change it there too (and vice versa).
 *
 * Rules (Swymble OS motion system):
 * - Components never define durations/easings inline — import from here.
 * - Two verbs: Rise (enter, 24px) and Scrub (scroll-linked). Exits use EASE.exit
 *   and are always faster than entries.
 * - Stagger is capped: past STAGGER_CAP siblings, items arrive together.
 */

/** Durations in seconds (Framer Motion convention). */
export const MOTION = {
  /** Hover, focus, pressed states, palette open. */
  instant: 0.12,
  /** Hover out, expansions, page cross-fade, toasts, exits. */
  quick: 0.24,
  /** Section entrances, window morphs, workspace settle. */
  scene: 0.42,
  /** Counter runs, boot beats, finale moments — max one per viewport. */
  hero: 0.7,
} as const;

export const EASE = {
  standard: [0.2, 0.8, 0.2, 1],
  outExpo: [0.16, 1, 0.3, 1],
  exit: [0.4, 0, 1, 1],
} as const;

/** Seconds between staggered siblings. */
export const STAGGER = 0.07;

/** Items beyond this index arrive together — staggering 12 things reads as lag. */
export const STAGGER_CAP = 6;

/** Index-based stagger delay with the cap applied. */
export function staggerDelay(index: number): number {
  return Math.min(index, STAGGER_CAP - 1) * STAGGER;
}

/** Typing cadence for the one allowed type-on per page (ms per character). */
export const TYPE_MS_PER_CHAR = 24;
