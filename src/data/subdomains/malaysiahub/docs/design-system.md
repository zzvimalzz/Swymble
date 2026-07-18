# Design system

The reference for every visual decision in MalaysiaHub. Tokens live in
[`src/styles/tokens.css`](../src/styles/tokens.css); motion primitives in
[`src/lib/motion.ts`](../src/lib/motion.ts). If a value isn't a token, it
isn't in the system.

**Bar:** Apple keynote × modern data journalism (Linear, Arc, Our World in
Data). Never government-portal, never admin-dashboard, never Bootstrap.

## Color

Two brand hues with strict roles, on cool blue-biased neutrals:

| Token                        | Role                                                                                                                 |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `brand-selat` (blue)         | **Interface.** Interactive elements, selection, links, focus, the map's active states. If it's clickable, it's blue. |
| `brand-songket` (gold)       | **Editorial.** Pull-quotes, highlighted figures, featured markers. Never interactive.                                |
| `status-ok/caution/critical` | Data quality and alerts only — semantic, never decorative.                                                           |
| `chart-1…5`                  | Categorical data series (blue, gold, teal, coral, violet).                                                           |

Both themes are first-class. Dark is deep ink (`oklch(0.155 0.015 262)`),
never pure black; light is cool paper, never pure grey. All text/background
pairs meet WCAG AA (4.5:1 body, 3:1 large text) — check any new pair before
adding it.

## Typography

Three faces, loaded via `next/font` (self-hosted, zero layout shift):

| Face                    | Token / class  | Role                                                                                                    |
| ----------------------- | -------------- | ------------------------------------------------------------------------------------------------------- |
| **Bricolage Grotesque** | `font-display` | Headlines h1–h4, hero numerals. Tracking −0.02em, `text-wrap: balance` (set globally).                  |
| **Instrument Sans**     | `font-sans`    | Body, UI. The default.                                                                                  |
| **IBM Plex Mono**       | `font-mono`    | Data values, code, timestamps, coordinates. Use the `tabular` utility wherever digits align in columns. |

Type scale (rem, Tailwind classes): display `text-6xl/7xl` (hero only) · h1
`text-4xl` · h2 `text-3xl` · h3 `text-xl` · h4 `text-lg` · body `text-base` ·
small `text-sm` · caption/label `text-xs` with `tracking-wide uppercase` for
eyebrows. Running text stays ≤ ~65ch (`max-w-prose`).

## Spacing, grid, breakpoints

- Tailwind's 4px spacing scale; no arbitrary pixel values without a reason.
- Page container: centered, `max-w-7xl`, `px-4 sm:px-6 lg:px-8`.
- Content grids are CSS grid with `gap-*`; sections separated by `py-16`
  sm / `py-24` lg rhythm.
- Breakpoints: Tailwind defaults (`sm 640 · md 768 · lg 1024 · xl 1280 ·
2xl 1536`). Design mobile-first; the map experiences must be excellent on
  touch.

## Shape & elevation

- Radius token `--radius: 0.55rem`; use the derived `rounded-sm…rounded-4xl`
  scale — never one-off radii.
- Three elevation levels only: `shadow-raised` (cards), `shadow-overlay`
  (popovers, dropdowns), `shadow-modal` (dialogs, command palette). Borders
  do most separation work; shadows are quiet, and deeper/softer in dark.

## Motion

Tokens: `quick 150ms` (hovers) · `base 240ms` (most transitions) · `slow
400ms` (panels) · `hero 800ms` (orchestrated entrances, map camera). Easings:
`ease-out-expo` for entrances/camera, `ease-in-out-soft` for looping ambient
motion.

Principles:

1. Animate `transform` and `opacity` only.
2. Entrances rise and fade (`fadeUp`); exits just fade, faster.
3. One orchestrated moment per view (staggered hero, camera flight) — beyond
   that, motion stays micro.
4. **Reduced motion is a contract:** every animated component checks
   framer-motion's `useReducedMotion()` and falls back to `fadeIn`
   (opacity-only); ambient/looping animation stops entirely.
5. Scroll-triggered entrances use `inViewOnce` — they play once, never
   re-trigger.

## Accessibility

- WCAG AA contrast in both themes.
- Focus is always visible: `focus-visible` ring (blue), never removed.
- Hit targets ≥ 44×44px on touch.
- Everything keyboard-reachable; the map's selection states have
  non-pointer equivalents (Explorer sidebar list).
- Color never encodes alone — pair with labels, patterns, or position.
- Semantic HTML first; ARIA to enhance, not to rescue.
- Storybook's a11y addon runs on every story (`npm run test:storybook`).

## Component tokens

shadcn/ui components consume the semantic tokens (`--primary`, `--card`,
`--border`…) which are themed in `tokens.css` — restyle tokens, not
components. Component-level overrides are deliberate and noted in PRs.
