"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

import { MALAYSIA_STATES, MALAYSIA_VIEWBOX } from "@/features/home/geometry/malaysia-states";
import { duration, easing } from "@/lib/motion";

/**
 * The hero's interactive Malaysia map: real DOSM state boundaries as inline
 * SVG. States enter with a soft stagger, hovering lifts a state into the
 * interface blue and names it in the caption line.
 */
export function MalaysiaMap() {
  const [hovered, setHovered] = useState<string | null>(null);
  const reducedMotion = useReducedMotion();

  return (
    <figure className="w-full">
      <svg
        viewBox={MALAYSIA_VIEWBOX}
        role="img"
        aria-label="Map of Malaysia's 16 states and federal territories"
        className="h-auto w-full select-none"
      >
        {MALAYSIA_STATES.map((state, index) => (
          <motion.path
            key={state.code}
            d={state.d}
            initial={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.985 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              duration: duration.slow,
              ease: easing.outExpo,
              delay: reducedMotion ? 0 : 0.08 + index * 0.045,
            }}
            onPointerEnter={() => setHovered(state.name)}
            onPointerLeave={() =>
              setHovered((current) => (current === state.name ? null : current))
            }
            className={
              hovered === state.name
                ? "fill-brand-selat stroke-background"
                : "fill-muted-foreground/25 stroke-background transition-[fill] duration-150 hover:fill-brand-selat"
            }
            strokeWidth={1.2}
            style={{ transformOrigin: "center" }}
          >
            <title>{state.name}</title>
          </motion.path>
        ))}
      </svg>
      <figcaption className="mt-3 flex items-baseline justify-between gap-4 font-mono text-xs text-muted-foreground">
        <span aria-live="polite" className="min-h-4 font-medium text-foreground">
          {hovered ?? " "}
        </span>
        <span>Boundaries: DOSM · CC BY 4.0</span>
      </figcaption>
    </figure>
  );
}
