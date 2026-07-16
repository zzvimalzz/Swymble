"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Download, Map as MapIcon } from "lucide-react";
import { useTheme } from "next-themes";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkline } from "@/components/charts/sparkline";
import { FuelBoard } from "@/features/live/fuel-board";
import {
  loadAtlasData,
  stateSeries,
  valuesForYear,
  type AtlasData,
} from "@/features/atlas/atlas-data";
import { DATA_LAYERS } from "@/features/atlas/layer-registry";
import { getDatasetManifest } from "@/services/dataset-registry";
import { DISTRICT_META, STATE_META } from "@/maps/generated/boundary-meta";
import { env } from "@/config/env";

const STATE_NAME_BY_CODE = new Map(STATE_META.map((s) => [s.code, s.name]));

/** Top districts for a metric's latest year, from the loaded atlas data. */
function MetricBody({ id }: { id: string }) {
  const [data, setData] = useState<AtlasData | null>(null);
  const { resolvedTheme } = useTheme();
  const theme = resolvedTheme === "dark" ? "dark" : "light";
  const layer = DATA_LAYERS.find((l) => l.datasetId === id);

  useEffect(() => {
    let cancelled = false;
    loadAtlasData().then((loaded) => {
      if (!cancelled) setData(loaded);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!layer?.metric) return null;
  if (!data) return <p className="text-sm text-muted-foreground">Loading data…</p>;

  const series = data.metrics[layer.metric];
  const latestYear = series.years[series.years.length - 1];
  const values = valuesForYear(series, latestYear)
    .filter((v): v is { id: number; value: number; raw: number } => v.raw !== null)
    .sort((a, b) => b.raw - a.raw)
    .slice(0, 10);
  const accent = layer.accent[theme];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl">Top districts · {latestYear}</h2>
        <table className="mt-4 w-full max-w-xl text-left text-sm">
          <thead>
            <tr className="border-b border-border/60 font-mono text-xs text-muted-foreground uppercase">
              <th className="py-2 pr-4 font-medium">District</th>
              <th className="py-2 pr-4 font-medium">State</th>
              <th className="py-2 text-right font-medium">{series.label}</th>
            </tr>
          </thead>
          <tbody className="tabular">
            {values.map((row) => {
              const district = DISTRICT_META.find((d) => d.id === row.id);
              if (!district) return null;
              return (
                <tr key={row.id} className="border-b border-border/40">
                  <td className="py-2 pr-4 font-medium">{district.name}</td>
                  <td className="py-2 pr-4 text-muted-foreground">
                    {STATE_NAME_BY_CODE.get(district.stateCode)}
                  </td>
                  <td className="py-2 text-right font-mono">{series.format(row.raw)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {layer.metric === "population" && (
        <div>
          <h2 className="text-xl">National trend</h2>
          <div className="mt-3 flex items-end gap-4">
            <Sparkline
              points={STATE_META.reduce(
                (acc, state) => {
                  const points = stateSeries(series, state.code);
                  points.forEach((p, i) => {
                    acc[i] = { year: p.year, value: (acc[i]?.value ?? 0) + p.value };
                  });
                  return acc;
                },
                [] as Array<{ year: number; value: number }>,
              )}
              color={accent}
              ariaLabel="National population trend"
              className="max-w-56"
            />
          </div>
        </div>
      )}

      <Button asChild>
        <Link href={`/map?layer=${layer.metric}`}>
          <MapIcon className="size-4" aria-hidden />
          Open as a map layer
        </Link>
      </Button>
    </div>
  );
}

/**
 * A dataset's own page: full metadata, provenance, a preview of the data,
 * and the artifact download — the expandable detail behind every layer and
 * board in the workspace.
 */
export function DatasetDetail({ id }: { id: string }) {
  const manifest = getDatasetManifest(id);
  const artifactHref = `${env.NEXT_PUBLIC_DATA_BASE_URL || ""}/${manifest.artifact.path}`;

  return (
    <div className="mx-auto max-w-[96rem] px-4 py-12 sm:px-6 lg:px-8">
      <p className="font-mono text-xs tracking-widest text-muted-foreground uppercase">
        Dataset · {manifest.module}
      </p>
      <h1 className="mt-3 max-w-3xl text-4xl sm:text-5xl">{manifest.title}</h1>
      <p className="mt-4 max-w-prose text-lg text-muted-foreground">{manifest.description}</p>

      <dl className="mt-8 grid max-w-3xl grid-cols-2 gap-px overflow-hidden rounded-lg border sm:grid-cols-4">
        {[
          ["Source", manifest.source.portal],
          ["Provider", manifest.source.provider],
          ["Licence", manifest.source.licence],
          ["Cadence", manifest.cadence],
        ].map(([label, value]) => (
          <div key={label} className="bg-card p-4">
            <dt className="text-xs tracking-wide text-muted-foreground uppercase">{label}</dt>
            <dd className="mt-1 text-sm font-medium">{value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Badge variant="outline" className="font-mono text-[10px]">
          dependability tier {manifest.tier}
        </Badge>
        <a
          href={manifest.source.url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-sm font-medium text-brand-selat underline-offset-4 hover:underline"
        >
          Source page at {manifest.source.portal}
          <ArrowUpRight className="size-4" aria-hidden />
        </a>
        <a
          href={artifactHref}
          download
          className="inline-flex items-center gap-1 text-sm font-medium text-brand-selat underline-offset-4 hover:underline"
        >
          <Download className="size-4" aria-hidden />
          Download artifact ({manifest.artifact.format})
        </a>
      </div>

      <div className="mt-12">
        {id === "fuel-price" && <FuelBoard />}
        {DATA_LAYERS.some((l) => l.datasetId === id) && <MetricBody id={id} />}
        {id.startsWith("boundaries-") && (
          <Button asChild>
            <Link href="/map">
              <MapIcon className="size-4" aria-hidden />
              View on the map
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}
