# src/styles

Design tokens and global styles. `src/app/globals.css` remains the Tailwind
entrypoint and imports from here.

- `tokens.css` — the design system's custom properties (Milestone 3): color,
  typography, spacing, radius, elevation, motion. Single source of truth;
  Tailwind theme values derive from these.

Component-specific styles belong in the component (Tailwind classes), not
here.
