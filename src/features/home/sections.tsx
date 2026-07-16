import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/reveal";
import { FEATURED_DATASETS } from "@/features/home/launch-datasets";
import { routes } from "@/config/navigation";
import { site } from "@/config/site";

/** Shared section shell: consistent rhythm, optional muted ground. */
function Section({
  id,
  eyebrow,
  title,
  muted = false,
  children,
}: {
  id?: string;
  eyebrow: string;
  title: string;
  muted?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className={muted ? "bg-muted/40" : undefined}>
      <div className="mx-auto max-w-[96rem] px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
        <Reveal>
          <p className="font-mono text-xs tracking-widest text-muted-foreground uppercase">
            {eyebrow}
          </p>
          <h2 className="mt-3 max-w-2xl text-3xl sm:text-4xl">{title}</h2>
        </Reveal>
        <div className="mt-10">{children}</div>
      </div>
    </section>
  );
}

export function Mission() {
  return (
    <Section eyebrow="Mission" title="Public data belongs to the public — legibly.">
      <div className="grid gap-10 lg:grid-cols-2">
        <Reveal delay={0.05}>
          <p className="max-w-prose text-lg text-muted-foreground">
            Malaysia publishes extraordinary open data: census tables for every district, GDP by
            sector, prices, boundaries, live transit. But it lives in portals built for
            statisticians. MyMalaysia is the missing layer — the same official numbers, made
            explorable for students, journalists, investors, and anyone deciding where to live,
            build, or invest.
          </p>
        </Reveal>
        <Reveal delay={0.1}>
          <blockquote className="border-l-2 border-brand-songket pl-6">
            <p className="font-display text-2xl">
              Every number on this site traces back to an official source — with its licence,
              vintage, and quality visible.
            </p>
          </blockquote>
        </Reveal>
      </div>
    </Section>
  );
}

const facts = [
  { value: "16", label: "states & federal territories" },
  { value: "160", label: "administrative districts" },
  { value: "3", label: "official API sources at launch" },
  { value: "100%", label: "of figures attributed, CC BY 4.0" },
];

export function Facts() {
  return (
    <div className="border-y border-border/60">
      <div className="mx-auto grid max-w-[96rem] grid-cols-2 gap-px px-4 sm:px-6 lg:grid-cols-4 lg:px-8">
        {facts.map((fact, index) => (
          <Reveal key={fact.label} delay={index * 0.06} className="py-10 lg:py-12">
            <div className="font-display text-5xl tabular sm:text-6xl">{fact.value}</div>
            <div className="mt-2 text-sm text-muted-foreground">{fact.label}</div>
          </Reveal>
        ))}
      </div>
    </div>
  );
}

interface LensFeature {
  label: string;
  status: "live" | "planned";
}

const lenses: Array<{
  name: string;
  href: string;
  description: string;
  features: LensFeature[];
}> = [
  {
    name: "Layers",
    href: "/map",
    description:
      "Every dataset is a map layer with its own color, legend, opacity, and provenance. Compose your own view of Malaysia.",
    features: [
      { label: "Population choropleth", status: "live" },
      { label: "Median household income", status: "live" },
      { label: "GDP by district", status: "live" },
      { label: "3D data prisms", status: "live" },
      { label: "Inflation by state", status: "planned" },
      { label: "Land use", status: "planned" },
      { label: "Flood & rainfall", status: "planned" },
    ],
  },
  {
    name: "Transit",
    href: "/map?layer=transit",
    description:
      "Live vehicles on the map from the national GTFS-Realtime feed, refreshed every 30 seconds.",
    features: [
      { label: "KTM trains, live", status: "live" },
      { label: "Rapid Bus KL · Penang · Kuantan, live", status: "live" },
      { label: "MRT & LRT positions", status: "planned" },
      { label: "Routes & stops", status: "planned" },
    ],
  },
  {
    name: "Live",
    href: "/map?panel=live",
    description: "Malaysia right now, docked beside the map.",
    features: [
      { label: "Fuel prices incl. BUDI95", status: "live" },
      { label: "MET forecasts, 8 cities", status: "live" },
      { label: "Ringgit reference rates", status: "live" },
      { label: "BNM official rates", status: "planned" },
      { label: "Flood alerts", status: "planned" },
    ],
  },
  {
    name: "Inspector",
    href: "/map",
    description: "Click any district and read it — trends beside the map, never instead of it.",
    features: [
      { label: "Population · income · GDP trends", status: "live" },
      { label: "State roll-ups", status: "live" },
      { label: "Education & healthcare", status: "planned" },
    ],
  },
  {
    name: "Timeline",
    href: "/map",
    description: "Scrub the years; the map and figures move together.",
    features: [
      { label: "2020–2025 population", status: "live" },
      { label: "2015–2020 GDP", status: "live" },
      { label: "Back to 1970", status: "planned" },
    ],
  },
];

function FeatureChip({ feature }: { feature: LensFeature }) {
  const live = feature.status === "live";
  return (
    <li
      className={
        live
          ? "inline-flex items-center gap-1 rounded-full border border-status-ok/40 px-2.5 py-0.5 text-xs text-foreground"
          : "inline-flex items-center gap-1 rounded-full border border-dashed border-border px-2.5 py-0.5 text-xs text-muted-foreground"
      }
    >
      <span
        className={
          live
            ? "size-1.5 rounded-full bg-status-ok"
            : "size-1.5 rounded-full bg-muted-foreground/50"
        }
        aria-hidden
      />
      {feature.label}
      {!live && <span className="sr-only">(planned)</span>}
    </li>
  );
}

export function ModulesPreview() {
  return (
    <Section id="workspace" eyebrow="One map" title="Not pages — lenses on the same map.">
      <ul className="divide-y divide-border/60">
        {lenses.map((lens, index) => (
          <Reveal as="li" key={lens.name} delay={index * 0.05}>
            <div className="grid gap-3 py-8 sm:grid-cols-[12rem_1fr] sm:gap-8">
              <h3 className="font-display text-2xl">
                <Link href={lens.href} className="transition-colors hover:text-brand-selat">
                  {lens.name}
                </Link>
              </h3>
              <div>
                <p className="max-w-prose text-muted-foreground">{lens.description}</p>
                <ul className="mt-3 flex flex-wrap gap-1.5">
                  {lens.features.map((feature) => (
                    <FeatureChip key={feature.label} feature={feature} />
                  ))}
                </ul>
              </div>
            </div>
          </Reveal>
        ))}
      </ul>
      <Reveal className="mt-8 flex flex-wrap items-center gap-4">
        <Button asChild size="lg">
          <Link href={routes.map.path}>Open the map</Link>
        </Button>
        <p className="text-xs text-muted-foreground">
          <span className="mr-1 inline-block size-1.5 rounded-full bg-status-ok align-middle" />
          live today ·{" "}
          <span className="mr-1 inline-block size-1.5 rounded-full border border-dashed border-border align-middle" />
          on the roadmap
        </p>
      </Reveal>
    </Section>
  );
}

export function FeaturedDatasets() {
  return (
    <Section muted eyebrow="The ledger" title="Launch datasets, straight from the source.">
      <div className="overflow-x-auto">
        <table className="w-full min-w-160 border-collapse text-left">
          <thead>
            <tr className="border-b border-border/60 font-mono text-xs tracking-wide text-muted-foreground uppercase">
              <th className="py-3 pr-4 font-medium">Dataset</th>
              <th className="py-3 pr-4 font-medium">What it holds</th>
              <th className="py-3 pr-4 font-medium">Source</th>
              <th className="py-3 font-medium">Updates</th>
            </tr>
          </thead>
          <tbody>
            {FEATURED_DATASETS.map((dataset) => (
              <tr key={dataset.name} className="border-b border-border/40 align-baseline">
                <td className="py-4 pr-4 font-medium whitespace-nowrap">{dataset.name}</td>
                <td className="py-4 pr-4 text-muted-foreground">{dataset.detail}</td>
                <td className="py-4 pr-4 font-mono text-sm whitespace-nowrap">{dataset.source}</td>
                <td className="py-4 font-mono text-sm whitespace-nowrap">{dataset.cadence}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Reveal className="mt-6">
        <p className="text-sm text-muted-foreground">
          Every dataset ships with source, licence, last-updated timestamp, and a quality status —
          in the interface, not a footnote.
        </p>
      </Reveal>
    </Section>
  );
}

const technologies = [
  { name: "MapLibre GL + PMTiles", note: "open mapping, self-hosted tiles, zero metering" },
  { name: "Next.js on Cloudflare", note: "rendered at the edge, static where it can be" },
  { name: "GitHub Actions ETL", note: "data that refreshes itself on schedule" },
  { name: "Typed end to end", note: "TypeScript from ingestion to interface" },
];

export function Technology() {
  return (
    <Section eyebrow="Engineering" title="Built like a product, not a portal.">
      <dl className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
        {technologies.map((tech, index) => (
          <Reveal key={tech.name} delay={index * 0.05}>
            <div className="border-t border-border/60 pt-4">
              <dt className="font-medium">{tech.name}</dt>
              <dd className="mt-1 text-sm text-muted-foreground">{tech.note}</dd>
            </div>
          </Reveal>
        ))}
      </dl>
    </Section>
  );
}

const waves = [
  {
    phase: "01",
    name: "Foundations",
    description:
      "The Explorer with every state and district, the live board, economy and population in depth — all on official APIs.",
  },
  {
    phase: "02",
    name: "Depth",
    description:
      "The historical timeline back to 1970, environment and infrastructure layers, realtime feeds with visible quality status.",
  },
  {
    phase: "03",
    name: "Intelligence",
    description:
      "Ask questions in plain language and get maps and charts back. Saved views, a public developer API.",
  },
];

export function Roadmap() {
  return (
    <Section muted eyebrow="Roadmap" title="Shipping in waves, each one complete.">
      <ol className="grid gap-10 lg:grid-cols-3">
        {waves.map((wave, index) => (
          <Reveal as="li" key={wave.phase} delay={index * 0.07}>
            <div className="font-mono text-sm text-brand-selat">{wave.phase}</div>
            <h3 className="mt-2 font-display text-2xl">{wave.name}</h3>
            <p className="mt-3 max-w-prose text-sm text-muted-foreground">{wave.description}</p>
          </Reveal>
        ))}
      </ol>
    </Section>
  );
}

export function Philosophy() {
  return (
    <Section id="philosophy" eyebrow="The promise" title="Open data, honestly presented.">
      <div className="max-w-prose space-y-6">
        <Reveal>
          <p className="text-lg text-muted-foreground">
            We don&apos;t collect the data — Malaysia&apos;s statisticians do, and they publish it
            openly. Our work is presentation: every figure keeps its provenance, annual data is
            never dressed up as realtime, and when a feed degrades, the interface says so.
          </p>
        </Reveal>
        <Reveal delay={0.05}>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              Statistical data © Department of Statistics Malaysia and originating agencies, CC BY
              4.0.
            </li>
            <li>Boundaries from DOSM geodata; basemaps © OpenStreetMap contributors.</li>
            <li>The platform itself is open source.</li>
          </ul>
        </Reveal>
        <Reveal delay={0.1}>
          <a
            href={site.links.github}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 font-medium text-brand-selat underline-offset-4 hover:underline"
          >
            Read the code on GitHub
            <ArrowUpRight className="size-4" aria-hidden />
          </a>
        </Reveal>
      </div>
    </Section>
  );
}
