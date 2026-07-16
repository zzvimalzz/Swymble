"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";

import { routes } from "@/config/navigation";
import { MALAYSIA_STATES, MALAYSIA_VIEWBOX } from "@/features/home/geometry/malaysia-states";
import { duration, easing } from "@/lib/motion";

/**
 * The hero's interactive Malaysia map: real DOSM state boundaries as inline
 * SVG. States enter with a soft stagger; hovering lifts a state into the
 * interface blue and names it; clicking (or Enter) opens it in the Explorer.
 */
export function MalaysiaMap() {
  const [hovered, setHovered] = useState<string | null>(null);
  const reducedMotion = useReducedMotion();
  const router = useRouter();

  const openInExplorer = (code: number) => {
    router.push(`${routes.explorer.path}?state=${code}`);
  };

  return (
    <figure className="w-full">
      <svg
        viewBox={MALAYSIA_VIEWBOX}
        role="group"
        aria-label="Map of Malaysia's 16 states and federal territories — select a state to explore it"
        className="h-auto w-full select-none"
      >
        {MALAYSIA_STATES.map((state, index) => (
          <motion.path
            key={state.code}
            d={state.d}
            role="link"
            tabIndex={0}
            aria-label={`Explore ${state.name}`}
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
            onFocus={() => setHovered(state.name)}
            onBlur={() => setHovered((current) => (current === state.name ? null : current))}
            onClick={() => openInExplorer(state.code)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                openInExplorer(state.code);
              }
            }}
            className={
              hovered === state.name
                ? "cursor-pointer fill-brand-selat stroke-background outline-none"
                : "cursor-pointer fill-muted-foreground/25 stroke-background transition-[fill] duration-150 outline-none hover:fill-brand-selat focus-visible:fill-brand-selat"
            }
            strokeWidth={1.2}
            style={{ transformOrigin: "center" }}
          >
            <title>{`Explore ${state.name}`}</title>
          </motion.path>
        ))}
      </svg>
      <figcaption className="mt-3 flex items-baseline justify-between gap-4 font-mono text-xs text-muted-foreground">
        <span aria-live="polite" className="min-h-4 font-medium text-foreground">
          {hovered ? `${hovered} — click to explore` : "Click a state to explore it"}
        </span>
        <span>Boundaries: DOSM · CC BY 4.0</span>
      </figcaption>
    </figure>
  );
}
