"use client";

import { useEffect, useState } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { fetchForecasts, type CityForecast } from "@/services/weather-client";

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

interface WeatherBoardProps {
  /** Tile grid for narrow panels (single column) vs full pages. */
  narrow?: boolean;
}

/** Self-contained MET forecast board for the major cities. */
export function WeatherBoard({ narrow = false }: WeatherBoardProps) {
  const [forecasts, setForecasts] = useState<Array<CityForecast | null> | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchForecasts(WEATHER_CITIES).then((result) => {
      if (!cancelled) setForecasts(result);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const loaded = forecasts?.filter((f): f is CityForecast => f !== null) ?? [];
  const grid = narrow ? "grid gap-px" : "grid gap-px sm:grid-cols-2 lg:grid-cols-4";

  if (forecasts === null) {
    return (
      <div className={`${grid} gap-4`} aria-label="Loading forecasts">
        {Array.from({ length: narrow ? 4 : 8 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  if (loaded.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Forecasts are unavailable right now — MET Malaysia&apos;s feed isn&apos;t answering.
      </p>
    );
  }

  return (
    <div>
      <ul className={`${grid} overflow-hidden rounded-lg border`}>
        {loaded.map((forecast) => (
          <li key={forecast.city} className="bg-card p-4" data-testid="weather-tile">
            <div className="flex items-baseline justify-between gap-2">
              <h3 className="text-sm font-medium">{forecast.city}</h3>
              <span className="font-display text-xl tabular">
                {forecast.maxTemp}°
                <span className="text-sm text-muted-foreground">/{forecast.minTemp}°</span>
              </span>
            </div>
            <p lang="ms" className="mt-1.5 text-xs text-muted-foreground">
              {forecast.summary}
              {forecast.when ? ` · ${forecast.when}` : ""}
            </p>
          </li>
        ))}
      </ul>
      <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-xs text-muted-foreground">
        <a
          href="https://developer.data.gov.my/realtime-api/weather"
          target="_blank"
          rel="noreferrer"
          className="underline underline-offset-4 hover:text-foreground"
        >
          MET Malaysia via data.gov.my
        </a>
        <span aria-hidden>·</span>
        <span>forecast text as published (Malay)</span>
      </p>
    </div>
  );
}
