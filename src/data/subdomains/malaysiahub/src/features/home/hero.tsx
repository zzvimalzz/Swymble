"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { MalaysiaMap } from "@/features/home/malaysia-map";
import { routes } from "@/config/navigation";
import { fadeIn, fadeUp, staggerContainer } from "@/lib/motion";

/**
 * The opening statement: one calm promise — everything Malaysia, one place —
 * with the country itself as the hero art, drawn from official boundaries.
 */
export function Hero() {
  const reducedMotion = useReducedMotion();
  const item = reducedMotion ? fadeIn : fadeUp;

  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto grid max-w-[96rem] items-center gap-12 px-4 pt-20 pb-16 sm:px-6 sm:pt-28 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8 lg:px-8">
        <motion.div variants={staggerContainer(0.08)} initial="hidden" animate="visible">
          <motion.p
            variants={item}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 font-mono text-xs tracking-widest text-muted-foreground uppercase"
          >
            <span className="live-dot" aria-hidden />
            The daily OS for Malaysia
          </motion.p>

          <motion.h1
            variants={item}
            className="mt-6 text-5xl leading-[0.98] sm:text-6xl lg:text-7xl"
          >
            Everything Malaysia,
            <br />
            <span className="text-gradient-brand">in one place</span>
            <span className="text-brand-merah">.</span>
          </motion.h1>

          <motion.p variants={item} className="mt-6 max-w-prose text-lg text-muted-foreground">
            Fuel prices, ringgit rates, salary and tax math, government services, and live
            transit — the ten tabs you open every day, replaced by one calm, fast home.
          </motion.p>

          <motion.div variants={item} className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg" className="group gap-2">
              <Link href={routes.finance.path}>
                Try the salary calculator
                <ArrowRight
                  className="size-4 transition-transform group-hover:translate-x-0.5"
                  aria-hidden
                />
              </Link>
            </Button>
            <Button asChild size="lg" variant="ghost">
              <Link href={routes.map.path}>Explore the map</Link>
            </Button>
          </motion.div>

          <motion.p
            variants={item}
            className="mt-8 font-mono text-xs text-muted-foreground/80"
          >
            Built on official open data · A Swymble product
          </motion.p>
        </motion.div>

        <motion.div
          initial={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
          className="relative mx-auto w-full max-w-lg lg:max-w-none"
        >
          <div
            className="brand-glow pointer-events-none absolute inset-0 -z-10 scale-125 opacity-70"
            aria-hidden
          />
          <MalaysiaMap />
        </motion.div>
      </div>

      <div className="brand-bar h-px w-full opacity-60" aria-hidden />
    </section>
  );
}
