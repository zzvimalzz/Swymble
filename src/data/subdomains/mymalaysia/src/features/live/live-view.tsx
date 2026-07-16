"use client";

import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, Minus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SourceAttribution } from "@/components/source-attribution";
import { fetchArtifact } from "@/services/artifact-client";
import { computeQuality, getDatasetManifest } from "@/services/dataset-registry";
import { fetchForecasts, type CityForecast } from "@/services/weather-client";
import { fuelPricePayloadSchema, type FuelPriceRow } from "@/types/dataset-payloads";
import type { QualityStatus } from "@/types/dataset";

import { FuelChart } from "./fuel-chart";
import {
  FUEL_RANGES,
  FUEL_SERIES,
  formatRmPerLitre,
  latestWithDelta,
  sliceRange,
  type FuelRange,
} from "./fuel";

// Names exactly as MET publishes them (e.g. "Georgetown", not "George Town").
const WEATHER_CITIES = [
  "Kuala Lumpur",
  "Georgetown",
  "Johor Bahru",
  "Ipoh",
  "Kuantan",
  "Kota Bharu",
  "Kuching",
  "Kota Kinabalu",
];

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

/** Live board: the country right now — pump prices and the sky. */
export function LiveView() {
  const [fuel, setFuel] = useState<FuelState | null>(null);
  const [fuelError, setFuelError] = useState(false);
  const [range, setRange] = useState<FuelRange>("3y");
  const [forecasts, setForecasts] = useState<Array<CityForecast | null> | null>(null);

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
    fetchForecasts(WEATHER_CITIES).then((result) => {
      if (!cancelled) setForecasts(result);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const latest = fuel ? latestWithDelta(fuel.rows) : null;
  const loadedForecasts = forecasts?.filter((f): f is CityForecast => f !== null) ?? [];

  return (
    <div className="mx-auto max-w-[96rem] px-4 py-12 sm:px-6 lg:px-8">
      <p className="font-mono text-xs tracking-widest text-muted-foreground uppercase">
        Live · Malaysia right now
      </p>
      <h1 className="mt-3 text-4xl sm:text-5xl">
        The week&apos;s numbers<span className="text-brand-selat">.</span>
      </h1>

      {/* ---- fuel ---- */}
      <section aria-labelledby="fuel-heading" className="mt-12">
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <h2 id="fuel-heading" className="text-2xl">
            At the pump
          </h2>
          <div className="flex gap-1" role="group" aria-label="Chart range">
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
        </div>

        {fuelError && (
          <p className="mt-6 text-sm text-muted-foreground">
            Fuel prices are unavailable right now — the last good data will return shortly.
          </p>
        )}

        {!fuel && !fuelError && (
          <div className="mt-6 grid gap-4 sm:grid-cols-3" aria-label="Loading fuel prices">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        )}

        {fuel && latest && (
          <>
            <dl className="mt-6 grid gap-px overflow-hidden rounded-lg border sm:grid-cols-3">
              {FUEL_SERIES.map((series) => (
                <div key={series.id} className="bg-card p-5" data-testid={`fuel-${series.id}`}>
                  <dt className="text-xs tracking-wide text-muted-foreground uppercase">
                    {series.label}
                  </dt>
                  <dd className="mt-1 font-display text-3xl tabular">
                    {formatRmPerLitre(latest.prices[series.id])}
                    <span className="ml-1 text-sm font-normal text-muted-foreground">/litre</span>
                  </dd>
                  <dd className="mt-2">
                    <Delta value={latest.deltas[series.id]} />
                  </dd>
                </div>
              ))}
            </dl>

            <FuelChart rows={sliceRange(fuel.rows, range)} className="mt-8" />

            <SourceAttribution
              manifest={getDatasetManifest("fuel-price")}
              updatedAt={fuel.updatedAt}
              quality={fuel.quality}
              className="mt-4"
            />
          </>
        )}
      </section>

      {/* ---- weather ---- */}
      <section aria-labelledby="weather-heading" className="mt-16">
        <h2 id="weather-heading" className="text-2xl">
          The sky today
        </h2>

        {forecasts === null && (
          <div
            className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
            aria-label="Loading forecasts"
          >
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-28 w-full" />
            ))}
          </div>
        )}

        {forecasts !== null && loadedForecasts.length === 0 && (
          <p className="mt-6 text-sm text-muted-foreground">
            Forecasts are unavailable right now — MET Malaysia&apos;s feed isn&apos;t answering.
          </p>
        )}

        {loadedForecasts.length > 0 && (
          <ul className="mt-6 grid gap-px overflow-hidden rounded-lg border sm:grid-cols-2 lg:grid-cols-4">
            {loadedForecasts.map((forecast) => (
              <li key={forecast.city} className="bg-card p-5" data-testid="weather-tile">
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="text-sm font-medium">{forecast.city}</h3>
                  <span className="font-display text-2xl tabular">
                    {forecast.maxTemp}°
                    <span className="text-sm text-muted-foreground">/{forecast.minTemp}°</span>
                  </span>
                </div>
                <p lang="ms" className="mt-2 text-sm text-muted-foreground">
                  {forecast.summary}
                  {forecast.when ? ` · ${forecast.when}` : ""}
                </p>
              </li>
            ))}
          </ul>
        )}

        <p className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-xs text-muted-foreground">
          <a
            href="https://developer.data.gov.my/realtime-api/weather"
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-4 hover:text-foreground"
          >
            MET Malaysia via data.gov.my
          </a>
          <span aria-hidden>·</span>
          <span>7-day forecasts, refreshed upstream hourly</span>
          <span aria-hidden>·</span>
          <span>forecast text as published (Malay)</span>
        </p>
      </section>

      <p className="mt-16 max-w-prose text-sm text-muted-foreground">
        Exchange rates and live transit join this board once the realtime proxy ships — Bank
        Negara&apos;s API doesn&apos;t answer browsers directly, and GTFS positions need decoding
        closer to the edge.
      </p>
    </div>
  );
}
