"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Map as MaplibreMap } from "maplibre-gl";

import { MapView } from "@/components/map";
import { fetchArtifact } from "@/services/artifact-client";
import { computeQuality } from "@/services/dataset-registry";
import {
  gdpDistrictPayloadSchema,
  householdIncomeDistrictPayloadSchema,
  populationDistrictPayloadSchema,
} from "@/types/dataset-payloads";
import { STATE_META, type DistrictMeta } from "@/maps/generated/boundary-meta";

import { buildGdpIndex, buildIncomeIndex, buildPopulationIndex, type MetricId } from "./data";
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

/**
 * Explorer foundation: engine map + reading pane, selection flowing both
 * ways (map click ↔ sidebar list), camera following the selection. Map-side
 * mechanics live in the imperative controller; React mirrors its state.
 */
export function ExplorerView() {
  const controllerRef = useRef<ExplorerMapController | null>(null);
  const [selection, setSelection] = useState<ExplorerSelection>(COUNTRY_SELECTION);
  const [metric, setMetric] = useState<MetricId>("population");
  const [data, setData] = useState<ExplorerData>(EMPTY_DATA);

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

  const onMapLoad = useCallback((map: MaplibreMap) => {
    const controller = createExplorerMapController(map, setSelection);
    controllerRef.current = controller;
    controller.enterCountry();
  }, []);

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
        className="h-[45dvh] min-h-0 shrink-0 border-t border-border/60 lg:h-auto lg:w-88 lg:border-t-0 lg:border-r"
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
        <MapView initialLevel="states" onLoad={onMapLoad} ariaLabel="Malaysia Explorer map" />
      </div>
    </div>
  );
}
