import type { Transition, Variants } from "framer-motion";

/**
 * Motion primitives mirroring the CSS motion tokens (src/styles/tokens.css).
 *
 * Rules (see docs/design-system.md):
 *  - Animate transform and opacity only; never layout properties.
 *  - Entrances move up and fade in; exits fade only (faster than entrances).
 *  - Respect reduced motion: components use framer-motion's
 *    `useReducedMotion()` and fall back to opacity-only variants.
 */

/** Durations in seconds, matching --duration-* tokens. */
export const duration = {
  quick: 0.15,
  base: 0.24,
  slow: 0.4,
  hero: 0.8,
} as const;

type Bezier = [number, number, number, number];

/** Easing curves matching --ease-* tokens. */
export const easing: { outExpo: Bezier; inOutSoft: Bezier } = {
  outExpo: [0.16, 1, 0.3, 1],
  inOutSoft: [0.65, 0, 0.35, 1],
};

/** Standard transition for most entrances. */
export const baseTransition: Transition = {
  duration: duration.base,
  ease: easing.outExpo,
};

/** Longer, statelier transition for hero moments and camera moves. */
export const heroTransition: Transition = {
  duration: duration.hero,
  ease: easing.outExpo,
};

/** Soft spring for interactive elements that follow the pointer/selection. */
export const interactiveSpring: Transition = {
  type: "spring",
  stiffness: 380,
  damping: 32,
};

/** Fade + rise entrance. The workhorse. */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: baseTransition },
};

/** Opacity-only variant — the reduced-motion fallback for any entrance. */
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: baseTransition },
};

/** Subtle scale entrance for cards and popovers. */
export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.97 },
  visible: { opacity: 1, scale: 1, transition: baseTransition },
};

/**
 * Parent container that staggers its children's `hidden` → `visible`
 * transition. Children use `fadeUp`/`fadeIn`/`scaleIn`.
 */
export function staggerContainer(staggerSeconds = 0.06, delaySeconds = 0): Variants {
  return {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: staggerSeconds,
        delayChildren: delaySeconds,
      },
    },
  };
}

/** Shared viewport config for scroll-triggered `whileInView` entrances. */
export const inViewOnce = { once: true, margin: "-80px" } as const;
