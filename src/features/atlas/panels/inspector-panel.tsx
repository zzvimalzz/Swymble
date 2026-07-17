"use client";

import { Sparkline } from "@/components/charts/sparkline";
import { SourceAttribution } from "@/components/source-attribution";
import { getDatasetManifest } from "@/services/dataset-registry";
import { DISTRICT_META, STATE_META } from "@/maps/generated/boundary-meta";
import { formatPeople } from "@/lib/format";
import { themedColor } from "@/lib/theme-color";

import { seriesForDistrict, stateSeries, type AtlasData } from "../atlas-data";
import type { AtlasSelection } from "../atlas-state";
import { DATA_LAYERS, type MetricId } from "../layer-registry";

/**
 * Identity color for a metric row (mirrors the layer card). light-dark()
 * keeps it hydration-safe and live to theme switches.
 */
function metricAccent(metric: MetricId): string | undefined {
  const pair = DATA_LAYERS.find((l) => l.metric === metric)?.accent;
  return pair ? themedColor(pair) : undefined;
}

interface InspectorPanelProps {
  selection: AtlasSelection;
  data: AtlasData | null;
  onSelectDistrict: (fid: number) => void;
}

function MetricRow({ data, metric, fid }: { data: AtlasData; metric: MetricId; fid: number }) {
  const accent = metricAccent(metric);
  const series = data.metrics[metric];
  const points = seriesForDistrict(series, fid);
  if (points.length === 0) {
    return (
      <div className="border-t border-border/60 py-3">
        <dt className="text-xs tracking-wide text-muted-foreground uppercase">{series.label}</dt>
        <dd className="mt-1 text-sm text-muted-foreground">no data for this district</dd>
      </div>
    );
  }
  const last = points[points.length - 1];
  return (
    <div className="border-t border-border/60 py-3">
      <dt className="flex items-center gap-1.5 text-xs tracking-wide text-muted-foreground uppercase">
        <span
          className="inline-block size-2 rounded-full"
          style={{ background: accent }}
          aria-hidden
        />
        {series.label} <span className="normal-case">· {last.year}</span>
      </dt>
      <dd className="mt-1 flex items-end justify-between gap-3">
        <span className="font-display text-2xl tabular">{series.format(last.value)}</span>
        <Sparkline
          points={points}
          color={accent}
          ariaLabel={`${series.label} trend, ${points[0].year} to ${last.year}`}
        />
      </dd>
    </div>
  );
}

/** Contextual details for the selected district or state. */
export function InspectorPanel({ selection, data, onSelectDistrict }: InspectorPanelProps) {
  if (!selection) {
    return (
      <p className="p-4 text-sm text-muted-foreground">
        Click a district on the map — or search for one — to inspect it.
      </p>
    );
  }

  if (!data) {
    return <p className="p-4 text-sm text-muted-foreground">Loading data…</p>;
  }

  if (selection.kind === "district") {
    const district = DISTRICT_META.find((d) => d.id === selection.fid);
    if (!district) return null;
    const state = STATE_META.find((s) => s.code === district.stateCode);

    return (
      <div className="p-4">
        <p className="font-mono text-xs tracking-widest text-muted-foreground uppercase">
          {state?.name}
        </p>
        <h2 className="mt-1 font-display text-2xl" data-testid="inspector-heading">
          {district.name}
        </h2>
        <dl className="mt-4">
          <MetricRow data={data} metric="population" fid={district.id} />
          <MetricRow data={data} metric="income" fid={district.id} />
          <MetricRow data={data} metric="gdp" fid={district.id} />
        </dl>
        <SourceAttribution
          manifest={getDatasetManifest("population-district")}
          updatedAt={data.metrics.population.updatedAt}
          quality={data.metrics.population.quality}
          className="mt-4"
        />
      </div>
    );
  }

  const state = STATE_META.find((s) => s.code === selection.code);
  if (!state) return null;
  const population = data.metrics.population;
  const points = stateSeries(population, state.code);
  const latest = points[points.length - 1];
  const districts = DISTRICT_META.filter((d) => d.stateCode === state.code);
  const latestYearMap = population.byYear.get(latest?.year ?? 0);
  const topDistricts = [...districts]
    .map((d) => ({ ...d, value: latestYearMap?.get(d.id) ?? 0 }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  return (
    <div className="p-4">
      <p className="font-mono text-xs tracking-widest text-muted-foreground uppercase">State</p>
      <h2 className="mt-1 font-display text-2xl" data-testid="inspector-heading">
        {state.name}
      </h2>
      <dl className="mt-4">
        <div className="border-t border-border/60 py-3">
          <dt className="text-xs tracking-wide text-muted-foreground uppercase">
            Population {latest ? `· ${latest.year}` : ""}
          </dt>
          <dd className="mt-1 flex items-end justify-between gap-3">
            <span className="font-display text-2xl tabular">
              {latest ? formatPeople(latest.value) : "—"}
            </span>
            <Sparkline points={points} ariaLabel={`${state.name} population trend`} />
          </dd>
        </div>
        <div className="border-t border-border/60 py-3">
          <dt className="text-xs tracking-wide text-muted-foreground uppercase">
            Largest districts
          </dt>
          <dd className="mt-2">
            <ul>
              {topDistricts.map((d) => (
                <li key={d.id}>
                  <button
                    type="button"
                    onClick={() => onSelectDistrict(d.id)}
                    className="flex w-full items-baseline justify-between gap-3 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                  >
                    <span className="truncate">{d.name}</span>
                    <span className="shrink-0 font-mono text-xs text-muted-foreground tabular">
                      {formatPeople(d.value)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </dd>
        </div>
      </dl>
      <SourceAttribution
        manifest={getDatasetManifest("population-district")}
        updatedAt={population.updatedAt}
        quality={population.quality}
        className="mt-4"
      />
    </div>
  );
}
