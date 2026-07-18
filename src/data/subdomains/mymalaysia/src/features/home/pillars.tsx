"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, Banknote, Landmark, Map, Radio, TrainFront } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { routes } from "@/config/navigation";
import { fadeIn, fadeUp, inViewOnce, staggerContainer } from "@/lib/motion";
import { cn } from "@/lib/utils";

interface Pillar {
  icon: LucideIcon;
  label: string;
  blurb: string;
  href?: string;
  soon?: boolean;
  /** Accent hue used for the icon chip. */
  accent: "selat" | "songket" | "merah" | "cyan";
}

const PILLARS: Pillar[] = [
  {
    icon: Banknote,
    label: "Finance",
    blurb: "Salary, EPF & tax, loans, savings, and live ringgit rates.",
    href: routes.finance.path,
    accent: "selat",
  },
  {
    icon: Landmark,
    label: "Government",
    blurb: "Passport, licence, road tax, EPF — what to bring, where to go.",
    soon: true,
    accent: "songket",
  },
  {
    icon: TrainFront,
    label: "Transport",
    blurb: "Fuel prices, toll costs, and trains and buses moving live.",
    href: routes.transit.path,
    accent: "merah",
  },
  {
    icon: Map,
    label: "Explore",
    blurb: "The living atlas — people, economy, and place on one map.",
    href: routes.map.path,
    accent: "cyan",
  },
  {
    icon: Radio,
    label: "Live",
    blurb: "Malaysia right now — pump prices, rates, and today's forecast.",
    href: routes.live.path,
    accent: "merah",
  },
];

const ACCENT: Record<Pillar["accent"], string> = {
  selat: "text-brand-selat bg-brand-selat/10",
  songket: "text-brand-songket bg-brand-songket/15",
  merah: "text-brand-merah bg-brand-merah/10",
  cyan: "text-brand-cyan-deep bg-brand-cyan/15",
};

function PillarCard({ pillar }: { pillar: Pillar }) {
  const Icon = pillar.icon;
  const reducedMotion = useReducedMotion();

  const inner = (
    <>
      <div className="flex items-start justify-between">
        <span
          className={cn(
            "inline-flex size-11 items-center justify-center rounded-xl",
            ACCENT[pillar.accent],
          )}
        >
          <Icon className="size-5" aria-hidden />
        </span>
        {pillar.soon ? (
          <span className="rounded-full border border-border px-2 py-0.5 font-mono text-[10px] tracking-wide text-muted-foreground uppercase">
            Soon
          </span>
        ) : (
          <ArrowUpRight
            className="size-5 text-muted-foreground transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-foreground"
            aria-hidden
          />
        )}
      </div>
      <h3 className="mt-5 text-xl">{pillar.label}</h3>
      <p className="mt-1.5 text-sm text-muted-foreground">{pillar.blurb}</p>
    </>
  );

  const baseClass = cn(
    "group relative flex h-full flex-col rounded-2xl border border-border bg-card p-6 shadow-raised transition-all",
    pillar.soon
      ? "opacity-80"
      : "hover:-translate-y-1 hover:border-brand-selat/40 hover:shadow-overlay",
  );

  return (
    <motion.div
      variants={reducedMotion ? fadeIn : fadeUp}
      className="h-full"
      whileHover={pillar.soon || reducedMotion ? undefined : { scale: 1.0 }}
    >
      {pillar.href ? (
        <Link href={pillar.href} className={baseClass}>
          {inner}
        </Link>
      ) : (
        <div className={baseClass}>{inner}</div>
      )}
    </motion.div>
  );
}

/** The product in five doors — the pillars of the daily OS. */
export function Pillars() {
  return (
    <section className="mx-auto max-w-[96rem] px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
      <div className="max-w-2xl">
        <p className="font-mono text-xs tracking-widest text-muted-foreground uppercase">
          One home, every errand
        </p>
        <h2 className="mt-3 text-3xl sm:text-4xl">
          Five doors into daily Malaysian life
        </h2>
      </div>

      <motion.div
        variants={staggerContainer(0.07)}
        initial="hidden"
        whileInView="visible"
        viewport={inViewOnce}
        className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        {PILLARS.map((pillar) => (
          <PillarCard key={pillar.label} pillar={pillar} />
        ))}
      </motion.div>
    </section>
  );
}
