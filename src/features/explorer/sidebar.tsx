"use client";

import { ChevronLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SourceAttribution } from "@/components/source-attribution";
import { getDatasetManifest } from "@/services/dataset-registry";
import type { QualityStatus } from "@/types/dataset";
import { DISTRICT_META, STATE_META, type DistrictMeta } from "@/maps/generated/boundary-meta";

import {
  districtKey,
  formatPeople,
  formatRm,
  formatRmMillions,
  METRICS,
  statePopulation,
  type GdpFigure,
  type IncomeFigure,
  type MetricId,
  type PopulationFigure,
} from "./data";
import type { ExplorerSelection } from "./selection";

export interface ExplorerData {
  population: Map<string, PopulationFigure> | null;
  income: Map<string, IncomeFigure> | null;
  gdp: Map<string, GdpFigure> | null;
  updatedAt: string | null;
  quality: QualityStatus;
}

interface SidebarProps {
  selection: ExplorerSelection;
  data: ExplorerData;
  metric: MetricId;
  onMetricChange: (metric: MetricId) => void;
  onSelectState: (stateCode: number) => void;
  onSelectDistrict: (district: DistrictMeta) => void;
  onBack: () => void;
}

function metricCell(
  metric: MetricId,
  key: string,
  data: ExplorerData,
): { text: string; year: number | null } {
  if (metric === "population") {
    const fig = data.population?.get(key);
    return fig ? { text: formatPeople(fig.value), year: fig.year } : { text: "—", year: null };
  }
  if (metric === "income") {
    const fig = data.income?.get(key);
    return fig ? { text: `${formatRm(fig.median)}/mo`, year: fig.year } : { text: "—", year: null };
  }
  const fig = data.gdp?.get(key);
  return fig ? { text: formatRmMillions(fig.value), year: fig.year } : { text: "—", year: null };
}

function RowButton({
  label,
  value,
  onClick,
}: {
  label: string;
  value: string;
  onClick: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className="flex w-full items-baseline justify-between gap-3 rounded-md px-3 py-2 text-left text-sm hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      >
        <span className="truncate">{label}</span>
        <span className="shrink-0 font-mono text-xs text-muted-foreground tabular">{value}</span>
      </button>
    </li>
  );
}

function DetailFigure({ label, value, year }: { label: string; value: string; year?: number }) {
  return (
    <div className="border-t border-border/60 py-3">
      <dt className="text-xs tracking-wide text-muted-foreground uppercase">
        {label}
        {year ? <span className="ml-1 normal-case">· {year}</span> : null}
      </dt>
      <dd className="mt-1 font-display text-2xl tabular">{value}</dd>
    </div>
  );
}

/** The Explorer's reading pane: mirrors and drives the map selection. */
export function ExplorerSidebar({
  selection,
  data,
  metric,
  onMetricChange,
  onSelectState,
  onSelectDistrict,
  onBack,
}: SidebarProps) {
  const populationManifest = getDatasetManifest("population-district");
  const loading = data.population === null;

  const heading =
    selection.level === "country"
      ? "Malaysia"
      : selection.level === "state"
        ? selection.stateName
        : selection.districtName;

  const districtsOfState =
    selection.level === "country"
      ? []
      : DISTRICT_META.filter((d) => d.stateCode === selection.stateCode);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="space-y-3 border-b border-border/60 p-4">
        {selection.level !== "country" && (
          <Button variant="ghost" size="sm" onClick={onBack} className="-ml-2 gap-1">
            <ChevronLeft className="size-4" aria-hidden />
            {selection.level === "district" ? selection.stateName : "Malaysia"}
          </Button>
        )}
        <h1 className="font-display text-2xl" data-testid="explorer-heading">
          {heading}
        </h1>
        <Tabs value={metric} onValueChange={(v) => onMetricChange(v as MetricId)}>
          <TabsList className="w-full">
            {METRICS.map((m) => (
              <TabsTrigger key={m.id} value={m.id} className="flex-1 text-xs">
                {m.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <div className="p-2">
          {loading && (
            <div className="space-y-2 p-2" aria-label="Loading data">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          )}

          {!loading && selection.level === "country" && (
            <ul aria-label="States" data-testid="state-list">
              {STATE_META.map((state) => {
                const pop = statePopulation(data.population!, state.name);
                const value = metric === "population" && pop ? formatPeople(pop.value) : "";
                return (
                  <RowButton
                    key={state.code}
                    label={state.name}
                    value={value}
                    onClick={() => onSelectState(state.code)}
                  />
                );
              })}
            </ul>
          )}

          {!loading && selection.level === "state" && (
            <ul aria-label="Districts" data-testid="district-list">
              {districtsOfState.map((district) => {
                const cell = metricCell(
                  metric,
                  districtKey(selection.stateName!, district.name),
                  data,
                );
                return (
                  <RowButton
                    key={district.id}
                    label={district.name}
                    value={cell.text}
                    onClick={() => onSelectDistrict(district)}
                  />
                );
              })}
            </ul>
          )}

          {!loading && selection.level === "district" && (
            <dl className="px-3 py-2" data-testid="district-detail">
              {(() => {
                const key = districtKey(selection.stateName!, selection.districtName!);
                const pop = data.population?.get(key);
                const income = data.income?.get(key);
                const gdp = data.gdp?.get(key);
                return (
                  <>
                    <DetailFigure
                      label="Population"
                      value={pop ? formatPeople(pop.value) : "no data"}
                      year={pop?.year}
                    />
                    <DetailFigure
                      label="Median household income"
                      value={income ? `${formatRm(income.median)}/mo` : "no data"}
                      year={income?.year}
                    />
                    <DetailFigure
                      label="GDP (all sectors)"
                      value={gdp ? formatRmMillions(gdp.value) : "no data"}
                      year={gdp?.year}
                    />
                  </>
                );
              })()}
            </dl>
          )}
        </div>
      </ScrollArea>

      <div className="border-t border-border/60 p-4">
        <SourceAttribution
          manifest={populationManifest}
          updatedAt={data.updatedAt}
          quality={data.quality}
        />
      </div>
    </div>
  );
}
