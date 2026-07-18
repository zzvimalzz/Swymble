"use client";

import { motion, useReducedMotion } from "framer-motion";

import { baseTransition, inViewOnce } from "@/lib/motion";
import { cn } from "@/lib/utils";

interface RevealProps {
  children: React.ReactNode;
  className?: string;
  /** Seconds to wait before the entrance plays (for manual stagger). */
  delay?: number;
  /** Render as a different element (defaults to div). */
  as?: "div" | "section" | "li" | "span";
}

/**
 * Scroll-triggered entrance: fade + rise, playing once when the element
 * enters the viewport. Falls back to opacity-only under reduced motion.
 */
export function Reveal({ children, className, delay = 0, as = "div" }: RevealProps) {
  const reducedMotion = useReducedMotion();
  const Component = motion[as];

  return (
    <Component
      className={cn(className)}
      initial={{ opacity: 0, y: reducedMotion ? 0 : 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={inViewOnce}
      transition={{ ...baseTransition, delay }}
    >
      {children}
    </Component>
  );
}
