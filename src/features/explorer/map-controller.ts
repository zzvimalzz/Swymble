import type { Map as MaplibreMap } from "maplibre-gl";

import {
  bindBoundaryInteractions,
  flyToBbox,
  setBoundaryLevel,
  setDistrictStateFilter,
  setSelectedFeature,
  type FeatureId,
} from "@/components/map";
import {
  DISTRICT_META,
  MALAYSIA_BBOX,
  STATE_META,
  type DistrictMeta,
} from "@/maps/generated/boundary-meta";

import { COUNTRY_SELECTION, type ExplorerSelection } from "./selection";

/**
 * Imperative navigation controller for the Explorer map. Owns the MapLibre
 * side of selection (feature-state, level visibility, filters, camera) and
 * reports every transition through `onSelectionChange` — React state stays
 * a pure mirror of it.
 */
export interface ExplorerMapController {
  enterCountry: () => void;
  enterState: (stateCode: number, stateName: string) => void;
  enterDistrict: (district: DistrictMeta) => void;
  dispose: () => void;
}

export function createExplorerMapController(
  map: MaplibreMap,
  onSelectionChange: (selection: ExplorerSelection) => void,
): ExplorerMapController {
  let unbind: (() => void) | null = null;
  let selectedDistrict: FeatureId | null = null;

  function clearDistrictSelection() {
    setSelectedFeature(map, "districts", null, selectedDistrict);
    selectedDistrict = null;
  }

  function enterCountry() {
    clearDistrictSelection();
    setBoundaryLevel(map, "states");
    setDistrictStateFilter(map, null);
    unbind?.();
    unbind = bindBoundaryInteractions(map, "states", {
      onSelect: (feature) => {
        const meta = STATE_META.find((s) => s.code === feature.id);
        if (meta) enterState(meta.code, meta.name);
      },
    });
    flyToBbox(map, MALAYSIA_BBOX, { padding: 24 });
    onSelectionChange(COUNTRY_SELECTION);
  }

  function enterState(stateCode: number, stateName: string) {
    clearDistrictSelection();
    setBoundaryLevel(map, "districts");
    setDistrictStateFilter(map, stateCode);
    unbind?.();
    unbind = bindBoundaryInteractions(map, "districts", {
      onSelect: (feature) => {
        const meta = DISTRICT_META.find((d) => d.id === feature.id);
        if (meta) enterDistrict(meta);
      },
    });
    const stateMeta = STATE_META.find((s) => s.code === stateCode);
    if (stateMeta) flyToBbox(map, stateMeta.bbox);
    onSelectionChange({ level: "state", stateCode, stateName });
  }

  function enterDistrict(district: DistrictMeta) {
    const state = STATE_META.find((s) => s.code === district.stateCode);
    setSelectedFeature(map, "districts", district.id, selectedDistrict);
    selectedDistrict = district.id;
    flyToBbox(map, district.bbox, { padding: 64 });
    onSelectionChange({
      level: "district",
      stateCode: district.stateCode,
      stateName: state?.name ?? "",
      districtId: district.id,
      districtName: district.name,
    });
  }

  return {
    enterCountry,
    enterState,
    enterDistrict,
    dispose: () => unbind?.(),
  };
}
