"use client";

import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatMyDateTime } from "@/lib/format";
import { TRANSIT_AGENCIES, type TransitSnapshot } from "@/services/transit-client";
import type { TransitNetworkIndex } from "@/services/transit-network";
import { TRANSIT_AGENCY_COLORS, TRANSIT_FALLBACK_COLOR } from "@/maps/style";

import { formatDistance, formatEta, type UpcomingStop, type VehicleEta } from "./eta";

export interface StopSelectionView {
  kind: "stop";
  name: string;
  networkLabel: string;
  routeShortNames: string[];
  arrivals: VehicleEta[];
}

export interface VehicleSelectionView {
  kind: "vehicle";
  title: string;
  routeName: string | null;
  routeColor: string | null;
  agencyLabel: string;
  speedKmh: number | null;
  stops: UpcomingStop[];
}

export type TransitSelectionView = StopSelectionView | VehicleSelectionView | null;

function RouteChip({ shortName, color }: { shortName: string; color: string | null }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border border-border/60 px-2 py-0.5 font-mono text-[10px]"
      title={shortName}
    >
      <span
        className="inline-block size-2 rounded-full"
        style={{ background: color ?? TRANSIT_FALLBACK_COLOR }}
        aria-hidden
      />
      {shortName}
    </span>
  );
}

function ArrivalsList({ arrivals }: { arrivals: VehicleEta[] }) {
  if (arrivals.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">
        No live vehicles heading here right now. Rail positions for LRT/MRT aren&apos;t published in
        the national feed yet — bus and KTM arrivals appear as they approach.
      </p>
    );
  }
  return (
    <ul className="space-y-2" data-testid="stop-arrivals">
      {arrivals.slice(0, 6).map((arrival) => (
        <li key={arrival.vehicleKey} className="flex items-center gap-2 text-xs">
          <RouteChip
            shortName={arrival.routeShortName || arrival.routeId}
            color={arrival.routeColor}
          />
          <span className="min-w-0 truncate text-muted-foreground">
            {arrival.label ?? arrival.routeLongName}
          </span>
          <span className="ml-auto shrink-0 font-mono tabular">
            {formatDistance(arrival.distanceMeters)} · ≈{formatEta(arrival.etaMinutes)}
          </span>
        </li>
      ))}
    </ul>
  );
}

function SelectionCard({
  selection,
  onClear,
}: {
  selection: NonNullable<TransitSelectionView>;
  onClear: () => void;
}) {
  return (
    <section
      aria-label={selection.kind === "stop" ? "Stop details" : "Vehicle details"}
      className="border-t border-border/60 pt-3"
      data-testid="transit-selection"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className="truncate text-sm font-medium">
            {selection.kind === "stop" ? selection.name : selection.title}
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {selection.kind === "stop"
              ? selection.networkLabel
              : (selection.routeName ?? selection.agencyLabel)}
          </p>
        </div>
        <Button size="icon-sm" variant="ghost" aria-label="Clear selection" onClick={onClear}>
          <X className="size-3.5" aria-hidden />
        </Button>
      </div>

      {selection.kind === "stop" && (
        <>
          {selection.routeShortNames.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {selection.routeShortNames.slice(0, 10).map((name) => (
                <span
                  key={name}
                  className="rounded-full border border-border/60 px-2 py-0.5 font-mono text-[10px] text-muted-foreground"
                >
                  {name}
                </span>
              ))}
            </div>
          )}
          <h3 className="mt-3 mb-2 font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
            Approaching now
          </h3>
          <ArrivalsList arrivals={selection.arrivals} />
        </>
      )}

      {selection.kind === "vehicle" && (
        <>
          {selection.speedKmh !== null && (
            <p className="mt-2 font-mono text-xs text-muted-foreground">
              {Math.round(selection.speedKmh)} km/h
            </p>
          )}
          <h3 className="mt-3 mb-2 font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
            Next stops
          </h3>
          {selection.stops.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              This vehicle isn&apos;t matched to a mapped route right now.
            </p>
          ) : (
            <ul className="space-y-2" data-testid="vehicle-stops">
              {selection.stops.map((stop) => (
                <li key={stop.stopId} className="flex items-center gap-2 text-xs">
                  <span className="min-w-0 truncate">{stop.name}</span>
                  <span className="ml-auto shrink-0 font-mono text-muted-foreground tabular">
                    {formatDistance(stop.distanceMeters)} · ≈{formatEta(stop.etaMinutes)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      <p className="mt-3 text-[10px] text-muted-foreground">
        Times are estimates from live positions along the route — not a timetable.
      </p>
    </section>
  );
}

/**
 * The transit workspace panel: live counts per agency with a full
 * date+time stamp, the rail lines in their official colors, and the
 * current stop/vehicle selection with distance + ETA estimates.
 */
export function TransitPanel({
  snapshot,
  index,
  selection,
  onClear,
}: {
  snapshot: TransitSnapshot | null;
  index: TransitNetworkIndex | null;
  selection: TransitSelectionView;
  onClear: () => void;
}) {
  const total = snapshot ? Object.values(snapshot.countByAgency).reduce((a, b) => a + b, 0) : null;
  const railRoutes =
    index?.networks
      .filter((n) => n.mode === "rail")
      .flatMap((n) => n.routes.filter((r) => r.color)) ?? [];

  return (
    <div className="absolute top-3 left-3 z-10 flex max-h-[calc(100%-1.5rem)] w-72 flex-col gap-3 overflow-y-auto rounded-xl border border-border/60 bg-background/90 p-4 shadow-md backdrop-blur-md">
      <div>
        <h1 className="font-mono text-xs tracking-widest uppercase">Live transit</h1>
        <p className="mt-1 font-display text-3xl tabular" data-testid="transit-total">
          {total === null ? "…" : total}
          <span className="ml-1.5 text-sm font-normal text-muted-foreground">vehicles</span>
        </p>
        <ul className="mt-3 space-y-1.5">
          {TRANSIT_AGENCIES.map((agency) => (
            <li key={agency.id} className="flex items-center gap-2 text-xs">
              <span
                className="inline-block size-2.5 rounded-full border border-background"
                style={{ background: TRANSIT_AGENCY_COLORS[agency.id] ?? TRANSIT_FALLBACK_COLOR }}
                aria-hidden
              />
              <span>{agency.label}</span>
              <span className="ml-auto font-mono text-muted-foreground tabular">
                {snapshot ? (snapshot.countByAgency[agency.id] ?? 0) : "…"}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-2 font-mono text-[10px] text-muted-foreground">
          GTFS-Realtime · data.gov.my · 30 s refresh
        </p>
        {snapshot && (
          <p className="font-mono text-[10px] text-muted-foreground" data-testid="transit-updated">
            updated {formatMyDateTime(snapshot.fetchedAt)}
          </p>
        )}
      </div>

      {railRoutes.length > 0 && (
        <section aria-label="Rail lines" className="border-t border-border/60 pt-3">
          <h2 className="mb-2 font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
            Rail lines
          </h2>
          <div className="flex flex-wrap gap-1">
            {railRoutes.map((route) => (
              <RouteChip key={route.id} shortName={route.shortName} color={route.color} />
            ))}
          </div>
          <p className="mt-2 text-[10px] text-muted-foreground">
            LRT/MRT live positions aren&apos;t in the national feed yet — lines and stations are
            mapped; KTM trains and Rapid buses move live.
          </p>
        </section>
      )}

      {selection ? (
        <SelectionCard selection={selection} onClear={onClear} />
      ) : (
        <p className="border-t border-border/60 pt-3 text-[11px] text-muted-foreground">
          Click a station, stop, or moving vehicle to see what&apos;s approaching and how far away
          it is. Zoom in past city level for bus stops.
        </p>
      )}
    </div>
  );
}
