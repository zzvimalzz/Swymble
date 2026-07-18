"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { routes } from "@/config/navigation";
import { site } from "@/config/site";
import { fadeIn, fadeUp, inViewOnce, staggerContainer } from "@/lib/motion";

/**
 * The brand moment: a deep-ink band (both themes) where the Swymble signature
 * accents — volt, cyan, neon — come forward against the dark, closing the
 * page on who made this.
 */
export function Closing() {
  const reducedMotion = useReducedMotion();
  const item = reducedMotion ? fadeIn : fadeUp;

  return (
    <section className="mx-auto max-w-[96rem] px-4 pb-20 sm:px-6 sm:pb-24 lg:px-8">
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-brand-ink px-6 py-16 text-center sm:px-12 sm:py-20 dark:bg-black/40">
        <div className="brand-bar absolute inset-x-0 top-0 h-1" aria-hidden />
        <div
          className="brand-glow pointer-events-none absolute -top-24 left-1/2 -z-0 h-72 w-72 -translate-x-1/2 opacity-60"
          aria-hidden
        />

        <motion.div
          variants={staggerContainer(0.08)}
          initial="hidden"
          whileInView="visible"
          viewport={inViewOnce}
          className="relative mx-auto max-w-2xl"
        >
          <motion.p
            variants={item}
            className="font-mono text-xs tracking-widest uppercase"
            style={{ color: "var(--brand-cyan)" }}
          >
            One tab, not ten
          </motion.p>
          <motion.h2
            variants={item}
            className="mt-4 text-4xl text-white sm:text-5xl"
          >
            Make MalaysiaHub your
            <span style={{ color: "var(--brand-volt)" }}> first tab</span>.
          </motion.h2>
          <motion.p variants={item} className="mx-auto mt-5 max-w-prose text-white/70">
            Fast, honest, and free where it should be. Start with your salary, then let the
            rest of your day fall into place.
          </motion.p>
          <motion.div variants={item} className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="group gap-2">
              <Link href={routes.finance.path}>
                Get started
                <ArrowRight
                  className="size-4 transition-transform group-hover:translate-x-0.5"
                  aria-hidden
                />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="ghost"
              className="text-white hover:bg-white/10 hover:text-white"
            >
              <a href={site.brand.companyUrl} target="_blank" rel="noreferrer">
                By {site.brand.company}
              </a>
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
