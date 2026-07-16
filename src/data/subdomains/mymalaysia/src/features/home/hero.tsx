"use client";

import { motion, useReducedMotion } from "framer-motion";

import { Button } from "@/components/ui/button";
import { MalaysiaMap } from "@/features/home/malaysia-map";
import { fadeIn, fadeUp, staggerContainer } from "@/lib/motion";

/**
 * The opening statement: an orchestrated entrance for the headline, then the
 * country itself — every state boundary, drawn from official data, live to
 * the pointer.
 */
export function Hero() {
  const reducedMotion = useReducedMotion();
  const item = reducedMotion ? fadeIn : fadeUp;

  return (
    <section className="mx-auto max-w-[96rem] px-4 pt-20 pb-16 sm:px-6 sm:pt-28 lg:px-8">
      <motion.div
        variants={staggerContainer(0.08)}
        initial="hidden"
        animate="visible"
        className="max-w-3xl"
      >
        <motion.p
          variants={item}
          className="font-mono text-xs tracking-widest text-muted-foreground uppercase"
        >
          Open data · 16 states · 160 districts
        </motion.p>
        <motion.h1 variants={item} className="mt-5 text-5xl sm:text-6xl lg:text-7xl">
          Understand Malaysia from first principles
          <span className="text-brand-selat">.</span>
        </motion.h1>
        <motion.p variants={item} className="mt-6 max-w-prose text-lg text-muted-foreground">
          MyMalaysia turns the country&apos;s official open data — every census table, price index,
          and boundary file — into an experience you can explore, not a report you have to read.
        </motion.p>
        <motion.div variants={item} className="mt-8 flex flex-wrap gap-3">
          <Button asChild size="lg">
            <a href="#modules">Preview the modules</a>
          </Button>
          <Button asChild size="lg" variant="ghost">
            <a href="#philosophy">Our data promise</a>
          </Button>
        </motion.div>
      </motion.div>

      <div className="mt-14 sm:mt-20">
        <MalaysiaMap />
      </div>
    </section>
  );
}
