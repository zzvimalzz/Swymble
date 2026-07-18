"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { FuelBoard } from "@/features/live/fuel-board";
import { FxBoard } from "@/features/live/fx-board";
import { WeatherBoard } from "@/features/live/weather-board";

function PanelSection({
  id,
  title,
  detailHref,
  children,
}: {
  id: string;
  title: string;
  detailHref?: string;
  children: React.ReactNode;
}) {
  return (
    <section aria-labelledby={id}>
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <h3 id={id} className="font-mono text-xs tracking-widest text-muted-foreground uppercase">
          {title}
        </h3>
        {detailHref && (
          <Link
            href={detailHref}
            className="inline-flex items-center gap-0.5 text-xs font-medium text-brand-selat underline-offset-4 hover:underline"
          >
            Details
            <ArrowUpRight className="size-3" aria-hidden />
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

/** Live lens: the country right now, alongside the map. */
export function LivePanel() {
  return (
    <div className="space-y-8 p-4">
      <PanelSection id="panel-fuel-heading" title="At the pump" detailHref="/data/fuel-price">
        <FuelBoard narrow />
      </PanelSection>
      <PanelSection id="panel-fx-heading" title="The ringgit">
        <FxBoard narrow />
      </PanelSection>
      <PanelSection id="panel-weather-heading" title="The sky today">
        <WeatherBoard narrow />
      </PanelSection>
      <p className="text-xs text-muted-foreground">
        Live transit is a map layer — toggle it in Layers. BNM official rates join once the realtime
        proxy ships.
      </p>
    </div>
  );
}
