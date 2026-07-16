import type { Map as MaplibreMap, MapGeoJSONFeature } from "maplibre-gl";

import { BOUNDARY_SOURCES, type BoundaryLevel } from "@/maps/sources";
import { FILL_LAYER_BY_LEVEL, LAYER_IDS } from "@/maps/style";

export type FeatureId = number;

export interface BoundaryEventHandlers {
  /** Fired when the hovered feature changes; null when leaving the layer. */
  onHover?: (feature: MapGeoJSONFeature | null) => void;
  /** Fired on click. */
  onSelect?: (feature: MapGeoJSONFeature) => void;
}

/**
 * Wires hover + click interactions for one boundary level using MapLibre
 * feature-state (no re-render per mousemove). Returns a cleanup function.
 */
export function bindBoundaryInteractions(
  map: MaplibreMap,
  level: BoundaryLevel,
  handlers: BoundaryEventHandlers = {},
): () => void {
  const layerId = FILL_LAYER_BY_LEVEL[level];
  const sourceId = BOUNDARY_SOURCES[level].id;
  let hoveredId: FeatureId | null = null;

  const clearHover = () => {
    if (hoveredId !== null) {
      map.setFeatureState({ source: sourceId, id: hoveredId }, { hover: false });
      hoveredId = null;
    }
  };

  const onMouseMove = (event: { features?: MapGeoJSONFeature[] }) => {
    const feature = event.features?.[0];
    if (!feature || feature.id == null) return;
    if (feature.id === hoveredId) return;
    clearHover();
    hoveredId = feature.id as FeatureId;
    map.setFeatureState({ source: sourceId, id: hoveredId }, { hover: true });
    map.getCanvas().style.cursor = "pointer";
    handlers.onHover?.(feature);
  };

  const onMouseLeave = () => {
    clearHover();
    map.getCanvas().style.cursor = "";
    handlers.onHover?.(null);
  };

  const onClick = (event: { features?: MapGeoJSONFeature[] }) => {
    const feature = event.features?.[0];
    if (feature) handlers.onSelect?.(feature);
  };

  map.on("mousemove", layerId, onMouseMove);
  map.on("mouseleave", layerId, onMouseLeave);
  map.on("click", layerId, onClick);

  return () => {
    map.off("mousemove", layerId, onMouseMove);
    map.off("mouseleave", layerId, onMouseLeave);
    map.off("click", layerId, onClick);
    clearHover();
  };
}

/**
 * Marks a single feature as selected within a boundary source, clearing the
 * previous selection. Pass null to clear.
 */
export function setSelectedFeature(
  map: MaplibreMap,
  level: BoundaryLevel,
  id: FeatureId | null,
  previousId: FeatureId | null,
): void {
  const sourceId = BOUNDARY_SOURCES[level].id;
  if (previousId !== null) {
    map.setFeatureState({ source: sourceId, id: previousId }, { selected: false });
  }
  if (id !== null) {
    map.setFeatureState({ source: sourceId, id }, { selected: true });
  }
}

/**
 * Restricts the district layers to one state's districts (null clears the
 * filter). Used when drilling into a state.
 */
export function setDistrictStateFilter(map: MaplibreMap, stateCode: number | null): void {
  const filter = stateCode === null ? null : (["==", ["get", "code_state"], stateCode] as const);
  const f = filter as Parameters<typeof map.setFilter>[1];
  map.setFilter(LAYER_IDS.districtsFill, f);
  map.setFilter(LAYER_IDS.districtsLine, f);
  map.setFilter(LAYER_IDS.districtsExtrusion, f);
}

/** Shows/hides the 3D district prisms. */
export function setExtrusionVisible(map: MaplibreMap, visible: boolean): void {
  map.setLayoutProperty(LAYER_IDS.districtsExtrusion, "visibility", visible ? "visible" : "none");
}

/**
 * Sets each district prism's height (metres) via feature-state. Districts
 * absent from `heights` fall back to 0.
 */
export function setExtrusionHeights(
  map: MaplibreMap,
  heights: ReadonlyArray<{ id: FeatureId; height: number }>,
): void {
  const sourceId = BOUNDARY_SOURCES.districts.id;
  for (const { id, height } of heights) {
    map.setFeatureState({ source: sourceId, id }, { height });
  }
}

/** Toggles which boundary level is visible. Both stay loaded. */
export function setBoundaryLevel(map: MaplibreMap, level: BoundaryLevel): void {
  const showStates = level === "states" ? "visible" : "none";
  const showDistricts = level === "districts" ? "visible" : "none";
  map.setLayoutProperty(LAYER_IDS.statesFill, "visibility", showStates);
  map.setLayoutProperty(LAYER_IDS.statesLine, "visibility", showStates);
  map.setLayoutProperty(LAYER_IDS.districtsFill, "visibility", showDistricts);
  map.setLayoutProperty(LAYER_IDS.districtsLine, "visibility", showDistricts);
}
