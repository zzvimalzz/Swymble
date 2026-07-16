"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Map as MapIcon } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkline } from "@/components/charts/sparkline";
import { SourceAttribution } from "@/components/source-attribution";
import { getDatasetManifest } from "@/services/dataset-registry";
import { DISTRICT_META, STATE_META } from "@/maps/generated/boundary-meta";
import { formatPeople } from "@/lib/format";

import {
  loadAtlasData,
  stateSeries,
  valuesForYear,
  type AtlasData,
  type MetricSeries,
} from "@/features/atlas/atlas-data";
import { DATA_LAYERS, type MetricId } from "@/features/atlas/layer-registry";

const STATE_NAME_BY_CODE = new Map(STATE_META.map((s) => [s.code, s.name]));

function nationalSeries(series: MetricSeries): Array<{ year: number; value: number }> {
  return STATE_META.reduce(
    (acc, state) => {
      stateSeries(series, state.code).forEach((point, i) => {
        acc[i] = { year: point.year, value: (acc[i]?.value ?? 0) + point.value };
      });
      return acc;
    },
    [] as Array<{ year: number; value: number }>,
  );
}

function MetricSection({ data, metric }: { data: AtlasData; metric: MetricId }) {
  const { resolvedTheme } = useTheme();
  const theme = resolvedTheme === "dark" ? "dark" : "light";
  const layer = DATA_LAYERS.find((l) => l.metric === metric);
  if (!layer?.datasetId) return null;

  const series = data.metrics[metric];
  const latestYear = series.years[series.years.length - 1];
  const rows = valuesForYear(series, latestYear)
    .filter((v): v is { id: number; value: number; raw: number } => v.raw !== null)
    .sort((a, b) => b.raw - a.raw);
  const top = rows.slice(0, 10);
  const accent = layer.accent[theme];

  // Summing only makes sense for additive metrics (people, RM output) —
  // median income shows the national spread instead.
  const additive = metric !== "income";
  const national = additive ? nationalSeries(series) : [];
  const latestNational = national[national.length - 1];

  return (
    <section aria-labelledby={`metric-${metric}`} className="mt-14">
      <h2 id={`metric-${metric}`} className="flex items-center gap-2 text-2xl">
        <span
          className="inline-block size-2.5 rounded-full"
          style={{ background: accent }}
          aria-hidden
        />
        {series.label}
      </h2>

      <div className="mt-6 grid gap-8 lg:grid-cols-[20rem_1fr]">
        <div>
          <p className="text-xs tracking-wide text-muted-foreground uppercase">
            {additive ? `National · ${latestYear}` : `District spread · ${latestYear}`}
          </p>
          {additive && latestNational ? (
            <>
              <p className="mt-1 font-display text-4xl font-semibold tabular">
                {metric === "population"
                  ? formatPeople(latestNational.value)
                  : series.format(latestNational.value)}
              </p>
              <Sparkline
                points={national}
                color={accent}
                ariaLabel={`National ${series.label} trend`}
                className="mt-3"
              />
            </>
          ) : (
            <p className="mt-1 font-display text-2xl font-semibold tabular">
              {series.format(rows[rows.length - 1]?.raw ?? 0)} – {series.format(rows[0]?.raw ?? 0)}
            </p>
          )}
          <SourceAttribution
            manifest={getDatasetManifest(layer.datasetId)}
            updatedAt={series.updatedAt}
            quality={series.quality}
            className="mt-4"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full max-w-xl text-left text-sm">
            <thead>
              <tr className="border-b border-border/60 font-mono text-xs text-muted-foreground uppercase">
                <th className="py-2 pr-4 font-medium">#</th>
                <th className="py-2 pr-4 font-medium">District</th>
                <th className="py-2 pr-4 font-medium">State</th>
                <th className="py-2 text-right font-medium">{latestYear}</th>
              </tr>
            </thead>
            <tbody className="tabular">
              {top.map((row, index) => {
                const district = DISTRICT_META.find((d) => d.id === row.id);
                if (!district) return null;
                return (
                  <tr key={row.id} className="border-b border-border/40">
                    <td className="py-2 pr-4 font-mono text-xs text-muted-foreground">
                      {index + 1}
                    </td>
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
      </div>

      <Button asChild className="mt-6" variant="outline">
        <Link href={`/map?layer=${metric}`}>
          <MapIcon className="size-4" aria-hidden />
          See {series.label.toLowerCase()} on the map
        </Link>
      </Button>
    </section>
  );
}

interface MetricPageProps {
  eyebrow: string;
  title: string;
  description: string;
  metrics: MetricId[];
}

/** A metric module's own destination: figures, rankings, and map links. */
export function MetricPage({ eyebrow, title, description, metrics }: MetricPageProps) {
  const [data, setData] = useState<AtlasData | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadAtlasData().then((loaded) => {
      if (!cancelled) setData(loaded);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="mx-auto max-w-[96rem] px-4 py-12 sm:px-6 lg:px-8">
      <p className="font-mono text-xs tracking-widest text-muted-foreground uppercase">{eyebrow}</p>
      <h1 className="mt-3 max-w-3xl text-4xl sm:text-5xl">
        {title}
        <span className="text-brand-selat">.</span>
      </h1>
      <p className="mt-4 max-w-prose text-lg text-muted-foreground">{description}</p>

      {!data && (
        <div className="mt-14 space-y-4" aria-label="Loading data">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-40 w-full max-w-3xl" />
        </div>
      )}
      {data && metrics.map((metric) => <MetricSection key={metric} data={data} metric={metric} />)}
    </div>
  );
}
