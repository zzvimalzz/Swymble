"use client";

import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, IdCard, Minus } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SourceAttribution } from "@/components/source-attribution";
import { fetchArtifact } from "@/services/artifact-client";
import { computeQuality, getDatasetManifest } from "@/services/dataset-registry";
import { fuelPricePayloadSchema, type FuelPriceRow } from "@/types/dataset-payloads";
import type { QualityStatus } from "@/types/dataset";

import { FuelChart } from "./fuel-chart";
import {
  BUDI95,
  FUEL_COLORS,
  FUEL_RANGES,
  FUEL_SERIES,
  formatRmPerLitre,
  latestWithDelta,
  sliceRange,
  type FuelRange,
} from "./fuel";

interface FuelState {
  rows: FuelPriceRow[];
  updatedAt: string | null;
  quality: QualityStatus;
}

function Delta({ value }: { value: number }) {
  if (value === 0) {
    return (
      <span className="flex items-center gap-1 text-xs text-muted-foreground">
        <Minus className="size-3" aria-hidden /> unchanged
      </span>
    );
  }
  const rising = value > 0;
  return (
    <span
      className={`flex items-center gap-1 text-xs ${rising ? "text-status-critical" : "text-status-ok"}`}
    >
      {rising ? (
        <ArrowUp className="size-3" aria-hidden />
      ) : (
        <ArrowDown className="size-3" aria-hidden />
      )}
      {`${rising ? "+" : "−"}RM ${Math.abs(value).toFixed(2)} vs last week`}
    </span>
  );
}

interface FuelBoardProps {
  /** Stack the price tiles vertically (for narrow panels). */
  narrow?: boolean;
}

/** Self-contained fuel board: latest prices + deltas, range filter, chart. */
export function FuelBoard({ narrow = false }: FuelBoardProps) {
  const [fuel, setFuel] = useState<FuelState | null>(null);
  const [fuelError, setFuelError] = useState(false);
  const [range, setRange] = useState<FuelRange>("3y");
  const { resolvedTheme } = useTheme();
  const colors = FUEL_COLORS[resolvedTheme === "dark" ? "dark" : "light"];

  useEffect(() => {
    let cancelled = false;
    fetchArtifact("fuel-price", fuelPricePayloadSchema)
      .then((envelope) => {
        if (cancelled) return;
        setFuel({
          rows: envelope.data,
          updatedAt: envelope.updatedAt,
          quality: computeQuality("weekly", envelope.updatedAt),
        });
      })
      .catch((error) => {
        console.error("fuel artifact failed:", error);
        if (!cancelled) setFuelError(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const latest = fuel ? latestWithDelta(fuel.rows) : null;
  const tileGrid = narrow ? "grid gap-px" : "grid gap-px sm:grid-cols-3";

  if (fuelError) {
    return (
      <p className="text-sm text-muted-foreground">
        Fuel prices are unavailable right now — the last good data will return shortly.
      </p>
    );
  }

  if (!fuel || !latest) {
    return (
      <div className={`${tileGrid} gap-4`} aria-label="Loading fuel prices">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-end gap-1" role="group" aria-label="Chart range">
        {FUEL_RANGES.map((r) => (
          <Button
            key={r.id}
            size="sm"
            variant={range === r.id ? "secondary" : "ghost"}
            aria-pressed={range === r.id}
            onClick={() => setRange(r.id)}
          >
            {r.label}
          </Button>
        ))}
      </div>

      <dl className={`mt-3 ${tileGrid} overflow-hidden rounded-lg border`}>
        {FUEL_SERIES.map((series) => (
          <div
            key={series.id}
            className="border-l-4 bg-card p-4"
            style={{ borderLeftColor: colors[series.id] }}
            data-testid={`fuel-${series.id}`}
          >
            <dt
              className="text-xs font-semibold tracking-wide uppercase"
              style={{ color: colors[series.id] }}
            >
              {series.label}
            </dt>
            <dd className="mt-1.5 font-display text-3xl font-semibold tabular">
              {formatRmPerLitre(latest.prices[series.id])}
              <span className="ml-1 text-sm font-normal text-muted-foreground">/litre</span>
            </dd>
            <dd className="mt-1.5">
              <Delta value={latest.deltas[series.id]} />
            </dd>
            {series.id === "ron95" && (
              <dd className="mt-2 flex items-center gap-1.5 text-xs font-medium text-status-ok">
                <IdCard className="size-3.5" aria-hidden />
                {BUDI95.label}: {formatRmPerLitre(BUDI95.pricePerLitre)}/litre
              </dd>
            )}
          </div>
        ))}
      </dl>
      <p className="mt-2 text-xs text-muted-foreground">
        BUDI95 is the subsidised RON95 price for eligible Malaysians via MyKad (
        <a
          href={BUDI95.sourceUrl}
          target="_blank"
          rel="noreferrer"
          className="underline underline-offset-4"
        >
          Budi Madani
        </a>
        , since {BUDI95.effective}); the tile shows the market price.
      </p>

      <FuelChart rows={sliceRange(fuel.rows, range)} className="mt-6" />

      <SourceAttribution
        manifest={getDatasetManifest("fuel-price")}
        updatedAt={fuel.updatedAt}
        quality={fuel.quality}
        className="mt-3"
      />
    </div>
  );
}
