"use client";

import { FuelBoard } from "@/features/live/fuel-board";
import { WeatherBoard } from "@/features/live/weather-board";

/** Live lens: the country right now, alongside the map. */
export function LivePanel() {
  return (
    <div className="space-y-8 p-4">
      <section aria-labelledby="panel-fuel-heading">
        <h3
          id="panel-fuel-heading"
          className="mb-3 font-mono text-xs tracking-widest text-muted-foreground uppercase"
        >
          At the pump
        </h3>
        <FuelBoard narrow />
      </section>
      <section aria-labelledby="panel-weather-heading">
        <h3
          id="panel-weather-heading"
          className="mb-3 font-mono text-xs tracking-widest text-muted-foreground uppercase"
        >
          The sky today
        </h3>
        <WeatherBoard narrow />
      </section>
      <p className="text-xs text-muted-foreground">
        Exchange rates and live transit join once the realtime proxy ships — Bank Negara&apos;s API
        doesn&apos;t answer browsers directly, and GTFS positions need decoding at the edge.
      </p>
    </div>
  );
}
