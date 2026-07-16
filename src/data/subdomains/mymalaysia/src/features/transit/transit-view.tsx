"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Map as MaplibreMap } from "maplibre-gl";

import { MapView, setLayerVisible, setTransitData } from "@/components/map";
import {
  fetchVehiclePositions,
  TRANSIT_AGENCIES,
  type TransitSnapshot,
} from "@/services/transit-client";
import { LAYER_IDS, TRANSIT_AGENCY_COLORS, TRANSIT_FALLBACK_COLOR } from "@/maps/style";

/**
 * Transit as its own destination: a full-bleed live map with the vehicle
 * layer always on, plus an agency legend with live counts.
 */
export function TransitView() {
  const mapRef = useRef<MaplibreMap | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [snapshot, setSnapshot] = useState<TransitSnapshot | null>(null);

  const onMapLoad = useCallback((map: MaplibreMap) => {
    mapRef.current = map;
    setLayerVisible(map, LAYER_IDS.transitVehicles, true);
    setMapReady(true);
  }, []);

  useEffect(() => {
    if (!mapReady) return;
    let cancelled = false;
    const poll = async () => {
      try {
        const next = await fetchVehiclePositions();
        if (cancelled || !mapRef.current) return;
        setTransitData(mapRef.current, next.collection);
        setSnapshot(next);
      } catch (error) {
        console.error("transit poll failed:", error);
      }
    };
    void poll();
    const timer = setInterval(poll, 30_000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [mapReady]);

  const total = snapshot ? Object.values(snapshot.countByAgency).reduce((a, b) => a + b, 0) : null;

  return (
    <div className="relative h-[calc(100dvh-3.5rem)]">
      <MapView initialLevel="states" onLoad={onMapLoad} ariaLabel="Live transit map">
        <div className="absolute top-3 left-3 z-10 w-64 rounded-xl border border-border/60 bg-background/90 p-4 shadow-md backdrop-blur-md">
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
          <p className="mt-3 font-mono text-[10px] text-muted-foreground">
            GTFS-Realtime · data.gov.my · 30 s refresh
            {snapshot &&
              ` · updated ${snapshot.fetchedAt.toLocaleTimeString("en-MY", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}`}
          </p>
          <p className="mt-2 text-[11px] text-muted-foreground">
            MRT and LRT positions aren&apos;t published in the national feed yet.
          </p>
        </div>
      </MapView>
    </div>
  );
}
