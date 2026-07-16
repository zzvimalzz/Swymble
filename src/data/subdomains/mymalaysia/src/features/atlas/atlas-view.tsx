"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Box, Database, Info, Layers as LayersIcon, Radio, Search, X } from "lucide-react";
import type { Map as MaplibreMap } from "maplibre-gl";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  easeToPitch,
  flyToBbox,
  MapView,
  setChoroplethRamp,
  setChoroplethValues,
  setExtrusionHeights,
  setExtrusionRamp,
  setExtrusionVisible,
  setLayerOpacity,
  setLayerVisible,
  setSelectionOutline,
  setTransitData,
} from "@/components/map";
import { fetchVehiclePositions, type TransitSnapshot } from "@/services/transit-client";
import { useTheme } from "next-themes";
import { EXTRUSION_MAX_HEIGHT, LAYER_IDS, MAP_COLORS } from "@/maps/style";
import {
  DISTRICT_META,
  MALAYSIA_BBOX,
  STATE_META,
  type Bbox,
} from "@/maps/generated/boundary-meta";

import { loadAtlasData, valuesForYear, type AtlasData } from "./atlas-data";
import { AtlasSearch } from "./atlas-search";
import { ATLAS_LAYERS, DATA_LAYERS, type AtlasLayerDef, type MetricId } from "./layer-registry";
import {
  parseAtlasParams,
  type AtlasPanel,
  type AtlasSelection,
  type LayerState,
} from "./atlas-state";
import { DataPanel } from "./panels/data-panel";
import { InspectorPanel } from "./panels/inspector-panel";
import { LayersPanel } from "./panels/layers-panel";
import { LivePanel } from "./panels/live-panel";
import { TimelineBar } from "./timeline-bar";

const CAMERA_PRESETS: Array<{ id: string; label: string; bbox: Bbox }> = [
  { id: "malaysia", label: "Malaysia", bbox: MALAYSIA_BBOX },
  { id: "peninsular", label: "Peninsular", bbox: [99.6, 1.2, 104.6, 6.8] },
  { id: "borneo", label: "Borneo", bbox: [109.5, 0.85, 119.3, 7.4] },
];

const PANEL_TITLES: Record<AtlasPanel, string> = {
  layers: "Layers",
  inspector: "Inspector",
  data: "Data",
  live: "Live",
};

function initialLayerState(): Record<string, LayerState> {
  return Object.fromEntries(
    ATLAS_LAYERS.map((l) => [l.id, { visible: l.defaultVisible, opacity: l.defaultOpacity }]),
  );
}

/**
 * The Atlas: MyMalaysia as one continuous map workspace. A single MapLibre
 * instance hosts every lens — layers, inspector, data catalogue, live board,
 * timeline — which change panels and paint, never the map itself.
 */
export function AtlasView() {
  const searchParams = useSearchParams();
  const mapRef = useRef<MaplibreMap | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [data, setData] = useState<AtlasData | null>(null);
  // Deep-link params seed the initial state once; later navigation happens
  // in-app (the URL is an entry point, not a live mirror).
  const [initialParams] = useState(() =>
    parseAtlasParams(new URLSearchParams(searchParams.toString())),
  );
  const [layerState, setLayerState] = useState<Record<string, LayerState>>(() => {
    const state = initialLayerState();
    if (initialParams.layer) {
      for (const dataLayer of DATA_LAYERS) {
        state[dataLayer.id].visible = dataLayer.metric === initialParams.layer;
      }
    }
    if (initialParams.transit) state.transit.visible = true;
    return state;
  });
  const [transit, setTransit] = useState<TransitSnapshot | null>(null);
  const [yearByMetric, setYearByMetric] = useState<Partial<Record<MetricId, number>>>({});
  const [threeD, setThreeD] = useState(false);
  const [selection, setSelection] = useState<AtlasSelection>(() =>
    initialParams.state ? { kind: "state", code: initialParams.state } : null,
  );
  const [panel, setPanel] = useState<AtlasPanel | null>(
    initialParams.panel ?? (initialParams.state ? "inspector" : "layers"),
  );
  const [searchOpen, setSearchOpen] = useState(false);

  const { resolvedTheme } = useTheme();
  const mapTheme = resolvedTheme === "dark" ? "dark" : "light";

  const activeDataLayer = useMemo(
    () => DATA_LAYERS.find((l) => layerState[l.id]?.visible) ?? null,
    [layerState],
  );
  const transitVisible = layerState.transit?.visible ?? false;
  const activeSeries =
    activeDataLayer?.metric && data ? data.metrics[activeDataLayer.metric] : null;
  const activeYear =
    activeSeries && activeDataLayer?.metric
      ? (yearByMetric[activeDataLayer.metric] ?? activeSeries.years[activeSeries.years.length - 1])
      : null;

  // ---- data load ----
  useEffect(() => {
    let cancelled = false;
    loadAtlasData()
      .then((loaded) => {
        if (!cancelled) setData(loaded);
      })
      .catch((error) => console.error("atlas data load failed:", error));
    return () => {
      cancelled = true;
    };
  }, []);

  // ---- selection actions (stable refs for map handlers) ----
  const selectDistrict = useCallback((fid: number, fly = true) => {
    const district = DISTRICT_META.find((d) => d.id === fid);
    if (!district) return;
    setSelection({ kind: "district", fid });
    setPanel("inspector");
    const map = mapRef.current;
    if (map && fly) flyToBbox(map, district.bbox, { padding: 96, maxZoom: 8.5 });
  }, []);

  const selectState = useCallback((code: number) => {
    const state = STATE_META.find((s) => s.code === code);
    if (!state) return;
    setSelection({ kind: "state", code });
    setPanel("inspector");
    const map = mapRef.current;
    if (map) flyToBbox(map, state.bbox, { padding: 72 });
  }, []);

  const onMapLoad = useCallback(
    (map: MaplibreMap) => {
      mapRef.current = map;
      // Unified picking: query rendered features topmost-first so the 3D
      // prisms are hit-tested against their real extruded geometry — at a
      // pitched angle a tower must select ITS district, not whatever flat
      // polygon hides behind it.
      const pickableLayers = () =>
        [
          LAYER_IDS.districtsExtrusion,
          LAYER_IDS.districtsChoropleth,
          LAYER_IDS.districtsFill,
        ].filter((id) => map.getLayer(id) && map.getLayoutProperty(id, "visibility") === "visible");
      map.on("click", (event) => {
        const feature = map.queryRenderedFeatures(event.point, { layers: pickableLayers() })[0];
        if (feature?.id != null) selectDistrict(feature.id as number, false);
      });
      map.on("mousemove", (event) => {
        const hit = map.queryRenderedFeatures(event.point, { layers: pickableLayers() }).length;
        map.getCanvas().style.cursor = hit ? "pointer" : "";
      });
      // Deep-linked state: fly there now that the camera exists.
      if (initialParams.state) {
        const state = STATE_META.find((s) => s.code === initialParams.state);
        if (state) flyToBbox(map, state.bbox, { padding: 72 });
      }
      setMapReady(true);
    },
    [selectDistrict, initialParams.state],
  );

  // ---- layer actions ----
  const activateDataLayer = useCallback((layer: AtlasLayerDef) => {
    setLayerState((current) => {
      const next = { ...current };
      for (const dataLayer of DATA_LAYERS) {
        next[dataLayer.id] = { ...next[dataLayer.id], visible: dataLayer.id === layer.id };
      }
      return next;
    });
  }, []);

  const toggleLayer = useCallback(
    (layer: AtlasLayerDef, visible: boolean) => {
      if (layer.kind === "data" && visible) {
        activateDataLayer(layer);
        return;
      }
      setLayerState((current) => ({
        ...current,
        [layer.id]: { ...current[layer.id], visible },
      }));
    },
    [activateDataLayer],
  );

  const setOpacity = useCallback((layer: AtlasLayerDef, opacity: number) => {
    setLayerState((current) => ({
      ...current,
      [layer.id]: { ...current[layer.id], opacity },
    }));
  }, []);

  // ---- paint the map from state (and re-paint after style reloads) ----
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    const apply = () => {
      if (!map.getLayer(LAYER_IDS.districtsChoropleth)) return;

      // Base + live layers: plain visibility/opacity from state.
      for (const layer of ATLAS_LAYERS) {
        const state = layerState[layer.id];
        if (layer.kind !== "data") {
          for (const engineLayer of layer.engineLayers) {
            setLayerVisible(map, engineLayer, state.visible);
            setLayerOpacity(map, engineLayer, state.opacity);
          }
        }
      }

      const showChoropleth = Boolean(activeSeries) && !threeD;
      setLayerVisible(map, LAYER_IDS.districtsChoropleth, showChoropleth);
      setExtrusionVisible(map, Boolean(activeSeries) && threeD);
      if (activeDataLayer) {
        setLayerOpacity(map, LAYER_IDS.districtsChoropleth, layerState[activeDataLayer.id].opacity);
        // Each data layer paints in its own hue — identity carried from the
        // layer card through the map ramp and 3D prisms.
        if (activeDataLayer.ramp) {
          const ramp = activeDataLayer.ramp[mapTheme];
          const colors = MAP_COLORS[mapTheme];
          setChoroplethRamp(map, { ...ramp, land: colors.land });
          setExtrusionRamp(map, { ...ramp, selected: colors.selected, hover: colors.landHover });
        }
      }

      if (activeSeries && activeYear !== null) {
        const values = valuesForYear(activeSeries, activeYear);
        setChoroplethValues(map, values);
        if (threeD) {
          setExtrusionHeights(
            map,
            values.map((v) => ({
              id: v.id,
              height: v.value === null ? 0 : Math.round(v.value * EXTRUSION_MAX_HEIGHT),
            })),
          );
        }
      }

      // Style reloads reset the transit source — re-seed the last snapshot.
      if (transitVisible && transit) setTransitData(map, transit.collection);

      setSelectionOutline(map, selection?.kind === "district" ? selection.fid : null);
    };

    apply();
    map.on("styledata", apply);
    return () => {
      map.off("styledata", apply);
    };
  }, [
    mapReady,
    layerState,
    activeDataLayer,
    activeSeries,
    activeYear,
    threeD,
    selection,
    mapTheme,
    transit,
    transitVisible,
  ]);

  // Live transit polling while the layer is on (30 s, matching upstream).
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || !transitVisible) return;
    let cancelled = false;
    const poll = async () => {
      try {
        const snapshot = await fetchVehiclePositions();
        if (cancelled || !mapRef.current) return;
        setTransitData(mapRef.current, snapshot.collection);
        setTransit(snapshot);
      } catch (error) {
        console.error("transit poll failed:", error);
      }
    };
    void poll();
    const timer = setInterval(poll, 30_000);
    return () => {
      cancelled = true;
      clearInterval(timer);
      setTransit(null);
      if (mapRef.current) {
        setTransitData(mapRef.current, { type: "FeatureCollection", features: [] });
      }
    };
  }, [transitVisible, mapReady]);

  // Pitch only when the 3D toggle changes (never cancel other flights).
  const appliedPitchRef = useRef(false);
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || appliedPitchRef.current === threeD) return;
    appliedPitchRef.current = threeD;
    easeToPitch(map, threeD ? 55 : 0);
  }, [threeD, mapReady]);

  const togglePanel = (next: AtlasPanel) => setPanel((current) => (current === next ? null : next));

  const railButtons: Array<{ panel: AtlasPanel; icon: typeof LayersIcon; label: string }> = [
    { panel: "layers", icon: LayersIcon, label: "Layers" },
    { panel: "inspector", icon: Info, label: "Inspector" },
    { panel: "data", icon: Database, label: "Data" },
    { panel: "live", icon: Radio, label: "Live" },
  ];

  return (
    <div className="flex h-[calc(100dvh-3.5rem)]">
      {/* workspace rail */}
      <nav
        aria-label="Workspace"
        className="flex w-14 shrink-0 flex-col items-center gap-1 border-r border-border/60 bg-background py-3"
      >
        <Button
          size="icon"
          variant="ghost"
          aria-label="Search Malaysia"
          onClick={() => setSearchOpen(true)}
          data-testid="atlas-search-button"
        >
          <Search className="size-5" aria-hidden />
        </Button>
        <div className="my-2 h-px w-8 bg-border/60" aria-hidden />
        {railButtons.map(({ panel: id, icon: Icon, label }) => (
          <Button
            key={id}
            size="icon"
            variant={panel === id ? "secondary" : "ghost"}
            aria-label={label}
            aria-pressed={panel === id}
            onClick={() => togglePanel(id)}
            data-testid={`rail-${id}`}
          >
            <Icon className="size-5" aria-hidden />
          </Button>
        ))}
      </nav>

      {/* contextual panel */}
      {panel && (
        <aside
          aria-label={`${PANEL_TITLES[panel]} panel`}
          className="flex w-full max-w-[24rem] min-w-0 shrink-0 flex-col border-r border-border/60 bg-background sm:w-[24rem]"
        >
          <div className="flex items-center justify-between border-b border-border/60 px-4 py-2.5">
            <h1 className="font-mono text-xs tracking-widest uppercase">{PANEL_TITLES[panel]}</h1>
            <Button
              size="icon"
              variant="ghost"
              aria-label="Close panel"
              onClick={() => setPanel(null)}
            >
              <X className="size-4" aria-hidden />
            </Button>
          </div>
          <ScrollArea className="min-h-0 flex-1">
            {panel === "layers" && (
              <LayersPanel
                layerState={layerState}
                data={data}
                transit={transit}
                onToggle={toggleLayer}
                onOpacity={setOpacity}
              />
            )}
            {panel === "inspector" && (
              <InspectorPanel
                selection={selection}
                data={data}
                onSelectDistrict={(fid) => selectDistrict(fid)}
              />
            )}
            {panel === "data" && <DataPanel data={data} />}
            {panel === "live" && <LivePanel />}
          </ScrollArea>
        </aside>
      )}

      {/* the map */}
      <div className="relative min-w-0 flex-1">
        <MapView initialLevel="districts" onLoad={onMapLoad} ariaLabel="MyMalaysia atlas">
          <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5">
            <Button
              size="sm"
              variant={threeD ? "default" : "secondary"}
              aria-pressed={threeD}
              onClick={() => setThreeD((v) => !v)}
              className="gap-1.5 shadow-sm"
              data-testid="toggle-3d"
            >
              <Box className="size-4" aria-hidden />
              3D
            </Button>
            <div className="flex flex-col gap-1" role="group" aria-label="Camera presets">
              {CAMERA_PRESETS.map((preset) => (
                <Button
                  key={preset.id}
                  size="sm"
                  variant="secondary"
                  className="justify-start shadow-sm"
                  onClick={() => {
                    const map = mapRef.current;
                    if (map) flyToBbox(map, preset.bbox, { padding: 32 });
                  }}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          </div>

          {activeSeries && activeYear !== null && (
            <div className="absolute bottom-5 left-1/2 z-10 -translate-x-1/2">
              <TimelineBar
                years={activeSeries.years}
                year={activeYear}
                label={activeSeries.label}
                onYearChange={(year) => {
                  if (activeDataLayer?.metric) {
                    setYearByMetric((current) => ({
                      ...current,
                      [activeDataLayer.metric!]: year,
                    }));
                  }
                }}
              />
            </div>
          )}
        </MapView>
      </div>

      <AtlasSearch
        open={searchOpen}
        onOpenChange={setSearchOpen}
        onSelectState={selectState}
        onSelectDistrict={(fid) => selectDistrict(fid)}
        onActivateLayer={(layer) => {
          activateDataLayer(layer);
          setPanel("layers");
        }}
        onOpenData={() => setPanel("data")}
      />
    </div>
  );
}
