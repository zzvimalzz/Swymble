"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import maplibregl, { type Map as MaplibreMap } from "maplibre-gl";
import { useTheme } from "next-themes";
import { Protocol } from "pmtiles";

import { MALAYSIA_BBOX, type Bbox } from "@/maps/generated/boundary-meta";
import type { BoundaryLevel } from "@/maps/sources";
import { buildMapStyle, type MapTheme } from "@/maps/style";
import { cn } from "@/lib/utils";

import "maplibre-gl/dist/maplibre-gl.css";

// The pmtiles:// protocol is registered once per session so any style can
// reference PMTiles archives (the basemap artifact arrives with the R2
// pipeline; boundary sources are GeoJSON and don't need it).
let pmtilesRegistered = false;
function registerPmtilesProtocol() {
  if (pmtilesRegistered) return;
  const protocol = new Protocol();
  maplibregl.addProtocol("pmtiles", protocol.tile);
  pmtilesRegistered = true;
}

const MapContext = createContext<MaplibreMap | null>(null);

/** The MapLibre map instance, available to children of MapView. Null until loaded. */
export function useMap(): MaplibreMap | null {
  return useContext(MapContext);
}

export interface MapViewProps {
  className?: string;
  /** Which boundary level is visible initially. */
  initialLevel?: BoundaryLevel;
  /** Initial camera bounds; defaults to the whole country. */
  initialBounds?: Bbox;
  /** Called once the style has loaded and the map is interactive. */
  onLoad?: (map: MaplibreMap) => void;
  /** Overlays rendered above the canvas with access to useMap(). */
  children?: React.ReactNode;
  /** Accessible label for the map region. */
  ariaLabel?: string;
}

/**
 * The mapping engine's host component: theme-aware style, pmtiles protocol,
 * camera bounds, and a context handing the raw MapLibre instance to overlay
 * children. Every module's map builds on this.
 */
export function MapView({
  className,
  initialLevel = "states",
  initialBounds = MALAYSIA_BBOX,
  onLoad,
  children,
  ariaLabel = "Interactive map of Malaysia",
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MaplibreMap | null>(null);
  const [loadedMap, setLoadedMap] = useState<MaplibreMap | null>(null);
  const { resolvedTheme } = useTheme();
  const theme: MapTheme = resolvedTheme === "dark" ? "dark" : "light";

  // (Re)create the map when the container mounts. Theme changes restyle the
  // existing map below instead of recreating it.
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    registerPmtilesProtocol();

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: buildMapStyle(theme, initialLevel),
      bounds: [
        [initialBounds[0], initialBounds[1]],
        [initialBounds[2], initialBounds[3]],
      ],
      fitBoundsOptions: { padding: 24 },
      attributionControl: false,
      dragRotate: false,
      pitchWithRotate: false,
      touchPitch: false,
    });

    map.addControl(
      new maplibregl.AttributionControl({
        compact: true,
        customAttribution: "Boundaries: DOSM (CC BY 4.0)",
      }),
      "bottom-right",
    );
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    map.keyboard.enable();

    map.on("load", () => {
      setLoadedMap(map);
      onLoad?.(map);
    });

    mapRef.current = map;
    return () => {
      mapRef.current = null;
      setLoadedMap(null);
      map.remove();
    };
    // Intentionally mount-only: initial props are constructor-time inputs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Restyle on theme change. setStyle resets feature-state; consumers
  // re-apply selection via the map's "styledata" event if they need to.
  const lastThemeRef = useRef(theme);
  useEffect(() => {
    const map = mapRef.current;
    if (!map || lastThemeRef.current === theme) return;
    lastThemeRef.current = theme;
    map.setStyle(buildMapStyle(theme, initialLevel));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme]);

  return (
    <div
      role="region"
      aria-label={ariaLabel}
      className={cn("relative isolate size-full overflow-hidden", className)}
    >
      {/* maplibre-gl.css forces .maplibregl-map to position:relative, which
          would defeat absolute/inset positioning — size explicitly instead. */}
      <div ref={containerRef} className="size-full" data-testid="map-canvas" />
      <MapContext.Provider value={loadedMap}>{children}</MapContext.Provider>
    </div>
  );
}
