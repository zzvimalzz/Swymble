"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import maplibregl, { type Map as MaplibreMap, type StyleSpecification } from "maplibre-gl";
import { useTheme } from "next-themes";
import { Protocol } from "pmtiles";

import { env } from "@/config/env";
import { MALAYSIA_BBOX, type Bbox } from "@/maps/generated/boundary-meta";
import type { BoundaryLevel } from "@/maps/sources";
import { buildMapStyle, mergeOntoBasemap, LAYER_IDS, type MapTheme } from "@/maps/style";
import { cn } from "@/lib/utils";

import "maplibre-gl/dist/maplibre-gl.css";

// The pmtiles:// protocol is registered once per session so any style can
// reference PMTiles archives (basemap, terrain, future data tiles).
let pmtilesRegistered = false;
function registerPmtilesProtocol() {
  if (pmtilesRegistered) return;
  const protocol = new Protocol();
  maplibregl.addProtocol("pmtiles", protocol.tile);
  pmtilesRegistered = true;
}

/**
 * Resolves the style for the current theme: the flat data canvas by
 * default, or the configured basemap style with the data overlay merged on
 * top (NEXT_PUBLIC_BASEMAP_STYLE_URL). Falls back to the canvas if the
 * basemap can't be fetched — the data experience never goes down with it.
 */
async function resolveStyle(theme: MapTheme, level: BoundaryLevel): Promise<StyleSpecification> {
  const basemapUrl = env.NEXT_PUBLIC_BASEMAP_STYLE_URL;
  if (!basemapUrl) return buildMapStyle(theme, level);
  try {
    const response = await fetch(basemapUrl);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const basemap = (await response.json()) as StyleSpecification;
    return mergeOntoBasemap(basemap, theme, level);
  } catch (error) {
    console.error(`basemap style failed (${basemapUrl}), using data canvas:`, error);
    return buildMapStyle(theme, level);
  }
}

/**
 * Enables 3D terrain + hillshading when a DEM source is configured
 * (NEXT_PUBLIC_TERRAIN_DEM_URL). No-op otherwise. Re-run after setStyle.
 */
function ensureTerrain(map: MaplibreMap) {
  const demUrl = env.NEXT_PUBLIC_TERRAIN_DEM_URL;
  if (!demUrl || map.getSource("dem")) return;
  map.addSource("dem", { type: "raster-dem", url: demUrl, tileSize: 256 });
  map.setTerrain({ source: "dem", exaggeration: 1.4 });
  map.addLayer(
    {
      id: "hillshade",
      type: "hillshade",
      source: "dem",
      paint: { "hillshade-exaggeration": 0.35 },
    },
    LAYER_IDS.statesFill,
  );
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
 * The mapping engine's host component: theme-aware style (flat canvas today,
 * basemap/terrain when configured), pmtiles protocol, camera bounds, and a
 * context handing the raw MapLibre instance to overlay children. Every
 * module's map builds on this — it is created once and restyled, never
 * recreated.
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
    let cancelled = false;

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
      if (cancelled) return;
      ensureTerrain(map);
      setLoadedMap(map);
      onLoad?.(map);
      // Upgrade to the configured basemap asynchronously; the flat canvas
      // renders immediately so first paint never waits on a style fetch.
      if (env.NEXT_PUBLIC_BASEMAP_STYLE_URL) {
        void resolveStyle(theme, initialLevel).then((style) => {
          if (!cancelled && mapRef.current === map) map.setStyle(style);
        });
      }
    });

    mapRef.current = map;
    return () => {
      cancelled = true;
      mapRef.current = null;
      setLoadedMap(null);
      map.remove();
    };
    // Intentionally mount-only: initial props are constructor-time inputs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Restyle on theme change. setStyle resets feature-state; consumers
  // re-apply their state via the map's "styledata" event.
  const lastThemeRef = useRef(theme);
  useEffect(() => {
    const map = mapRef.current;
    if (!map || lastThemeRef.current === theme) return;
    lastThemeRef.current = theme;
    void resolveStyle(theme, initialLevel).then((style) => {
      if (mapRef.current === map) {
        map.setStyle(style);
        map.once("styledata", () => ensureTerrain(map));
      }
    });
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
