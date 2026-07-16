"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Box } from "lucide-react";
import type { Map as MaplibreMap } from "maplibre-gl";

import { Button } from "@/components/ui/button";
import { easeToPitch, MapView, setExtrusionHeights, setExtrusionVisible } from "@/components/map";
import { fetchArtifact } from "@/services/artifact-client";
import { computeQuality } from "@/services/dataset-registry";
import {
  gdpDistrictPayloadSchema,
  householdIncomeDistrictPayloadSchema,
  populationDistrictPayloadSchema,
} from "@/types/dataset-payloads";
import { EXTRUSION_MAX_HEIGHT } from "@/maps/style";
import { DISTRICT_META, STATE_META, type DistrictMeta } from "@/maps/generated/boundary-meta";

import {
  buildGdpIndex,
  buildIncomeIndex,
  buildPopulationIndex,
  computeExtrusionHeights,
  type MetricId,
} from "./data";
import { createExplorerMapController, type ExplorerMapController } from "./map-controller";
import { COUNTRY_SELECTION, type ExplorerSelection } from "./selection";
import { ExplorerSidebar, type ExplorerData } from "./sidebar";

const EMPTY_DATA: ExplorerData = {
  population: null,
  income: null,
  gdp: null,
  updatedAt: null,
  quality: "unavailable",
};

const STATE_NAME_BY_CODE = new Map(STATE_META.map((s) => [s.code, s.name]));

/**
 * Explorer foundation: engine map + reading pane, selection flowing both
 * ways (map click ↔ sidebar list), camera following the selection, and an
 * optional 3D mode where district prisms encode the active metric. Map-side
 * mechanics live in the imperative controller; React mirrors its state.
 */
export function ExplorerView() {
  const searchParams = useSearchParams();
  const controllerRef = useRef<ExplorerMapController | null>(null);
  const mapRef = useRef<MaplibreMap | null>(null);
  const [selection, setSelection] = useState<ExplorerSelection>(COUNTRY_SELECTION);
  const [metric, setMetric] = useState<MetricId>("population");
  const [data, setData] = useState<ExplorerData>(EMPTY_DATA);
  const [threeD, setThreeD] = useState(false);
  const [mapReady, setMapReady] = useState(false);

  // Load the three launch artifacts once, client-side.
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [population, income, gdp] = await Promise.all([
          fetchArtifact("population-district", populationDistrictPayloadSchema),
          fetchArtifact("household-income-district", householdIncomeDistrictPayloadSchema),
          fetchArtifact("gdp-district", gdpDistrictPayloadSchema),
        ]);
        if (cancelled) return;
        setData({
          population: buildPopulationIndex(population.data),
          income: buildIncomeIndex(income.data),
          gdp: buildGdpIndex(gdp.data),
          updatedAt: population.updatedAt,
          quality: computeQuality("annual", population.updatedAt),
        });
      } catch (error) {
        console.error("Explorer data load failed:", error);
        if (!cancelled) setData({ ...EMPTY_DATA, quality: "unavailable" });
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => () => controllerRef.current?.dispose(), []);

  const onMapLoad = useCallback(
    (map: MaplibreMap) => {
      const controller = createExplorerMapController(map, setSelection);
      controllerRef.current = controller;
      mapRef.current = map;

      // Deep link: /explorer?state=<code> opens straight into that state.
      const stateParam = Number(searchParams.get("state"));
      const stateMeta = STATE_META.find((s) => s.code === stateParam);
      if (stateMeta) {
        controller.enterState(stateMeta.code, stateMeta.name);
      } else {
        controller.enterCountry();
      }
      setMapReady(true);
    },
    // The param is only consumed at mount; later changes go through the UI.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // 3D mode: prism visibility, metric-driven heights, pitched camera.
  // Re-applies after style reloads (theme switch wipes feature-state).
  const appliedPitchRef = useRef(false);
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    const apply = () => {
      if (!map.getLayer("districts-extrusion")) return;
      setExtrusionVisible(map, threeD);
      if (threeD) {
        setExtrusionHeights(
          map,
          computeExtrusionHeights(
            metric,
            data,
            DISTRICT_META,
            STATE_NAME_BY_CODE,
            EXTRUSION_MAX_HEIGHT,
          ),
        );
      }
    };

    apply();
    // Pitch only when the toggle actually changes — an unconditional easeTo
    // would cancel in-flight camera flights (e.g. the deep-link state fly).
    if (appliedPitchRef.current !== threeD) {
      appliedPitchRef.current = threeD;
      easeToPitch(map, threeD ? 55 : 0);
    }
    map.on("styledata", apply);
    return () => {
      map.off("styledata", apply);
    };
  }, [threeD, metric, data, mapReady]);

  const onSelectState = useCallback((code: number) => {
    const meta = STATE_META.find((s) => s.code === code);
    if (meta) controllerRef.current?.enterState(meta.code, meta.name);
  }, []);

  const onSelectDistrict = useCallback((district: DistrictMeta) => {
    controllerRef.current?.enterDistrict(district);
  }, []);

  const onBack = useCallback(() => {
    const controller = controllerRef.current;
    if (!controller) return;
    if (selection.level === "district") {
      controller.enterState(selection.stateCode, selection.stateName);
    } else {
      controller.enterCountry();
    }
  }, [selection]);

  return (
    <div className="flex h-[calc(100dvh-3.5rem)] flex-col-reverse lg:flex-row">
      <aside
        aria-label="Explorer data panel"
        className="h-[45dvh] min-h-0 shrink-0 border-t border-border/60 lg:h-auto lg:w-88 lg:border-t-0 lg:border-r xl:w-[26rem] 2xl:w-[30rem]"
      >
        <ExplorerSidebar
          selection={selection}
          data={data}
          metric={metric}
          onMetricChange={setMetric}
          onSelectState={onSelectState}
          onSelectDistrict={onSelectDistrict}
          onBack={onBack}
        />
      </aside>
      <div className="min-h-0 flex-1">
        <MapView initialLevel="states" onLoad={onMapLoad} ariaLabel="Malaysia Explorer map">
          <div className="absolute top-3 left-3 z-10">
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
          </div>
        </MapView>
      </div>
    </div>
  );
}
