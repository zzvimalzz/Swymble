import type { Map as MaplibreMap } from "maplibre-gl";

import {
  bindBoundaryInteractions,
  flyToBbox,
  setBoundaryLevel,
  setDistrictStateFilter,
  setMutedStates,
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

const ALL_STATE_IDS = STATE_META.map((s) => s.code);

/**
 * Imperative navigation controller for the Explorer map. Owns the MapLibre
 * side of selection (feature-state, level visibility, filters, camera) and
 * reports every transition through `onSelectionChange` — React state stays
 * a pure mirror of it.
 *
 * State focus keeps the whole country on screen: the other states stay
 * visible but dimmed (muted feature-state) and remain clickable to switch
 * focus directly.
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
  const unbinders: Array<() => void> = [];
  let selectedDistrict: FeatureId | null = null;
  let focusedState: FeatureId | null = null;

  function unbindAll() {
    while (unbinders.length) unbinders.pop()?.();
  }

  function clearDistrictSelection() {
    setSelectedFeature(map, "districts", null, selectedDistrict);
    selectedDistrict = null;
  }

  function enterCountry() {
    clearDistrictSelection();
    focusedState = null;
    setBoundaryLevel(map, "states");
    setDistrictStateFilter(map, null);
    setMutedStates(map, ALL_STATE_IDS, null);
    unbindAll();
    unbinders.push(
      bindBoundaryInteractions(map, "states", {
        onSelect: (feature) => {
          const meta = STATE_META.find((s) => s.code === feature.id);
          if (meta) enterState(meta.code, meta.name);
        },
      }),
    );
    flyToBbox(map, MALAYSIA_BBOX, { padding: 24 });
    onSelectionChange(COUNTRY_SELECTION);
  }

  function enterState(stateCode: number, stateName: string) {
    clearDistrictSelection();
    focusedState = stateCode;
    // Dimmed country context beneath the focused state's districts.
    setBoundaryLevel(map, "both");
    setDistrictStateFilter(map, stateCode);
    setMutedStates(map, ALL_STATE_IDS, stateCode);
    unbindAll();
    unbinders.push(
      bindBoundaryInteractions(map, "districts", {
        onSelect: (feature) => {
          const meta = DISTRICT_META.find((d) => d.id === feature.id);
          if (meta) enterDistrict(meta);
        },
      }),
      // Dimmed states stay clickable to switch focus directly.
      bindBoundaryInteractions(map, "states", {
        onSelect: (feature) => {
          if (feature.id === focusedState) return;
          const meta = STATE_META.find((s) => s.code === feature.id);
          if (meta) enterState(meta.code, meta.name);
        },
      }),
    );
    const stateMeta = STATE_META.find((s) => s.code === stateCode);
    if (stateMeta) flyToBbox(map, stateMeta.bbox, { padding: 72 });
    onSelectionChange({ level: "state", stateCode, stateName });
  }

  function enterDistrict(district: DistrictMeta) {
    const state = STATE_META.find((s) => s.code === district.stateCode);
    setSelectedFeature(map, "districts", district.id, selectedDistrict);
    selectedDistrict = district.id;
    // maxZoom keeps neighbouring districts (and 3D prism tops) in frame —
    // without it, small districts pull the camera inside the extrusions.
    flyToBbox(map, district.bbox, { padding: 96, maxZoom: 8.5 });
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
    dispose: unbindAll,
  };
}
