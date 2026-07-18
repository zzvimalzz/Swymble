import type { GeoJSONSource, Map as MaplibreMap, MapGeoJSONFeature } from "maplibre-gl";
import type { FeatureCollection } from "geojson";

import { BOUNDARY_SOURCES, type BoundaryLevel } from "@/maps/sources";
import {
  EXTRUSION_MAX_HEIGHT,
  FILL_LAYER_BY_LEVEL,
  LAYER_IDS,
  TRANSIT_ROUTES_SOURCE_ID,
  TRANSIT_SOURCE_ID,
  TRANSIT_STOPS_SOURCE_ID,
} from "@/maps/style";

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
  /** Bind to a different layer over the same source (e.g. the choropleth). */
  layerIdOverride?: string,
): () => void {
  const layerId = layerIdOverride ?? FILL_LAYER_BY_LEVEL[level];
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

/**
 * Dims every state except `exceptId` (used while a state is focused).
 * Pass exceptId null to clear all muting.
 */
export function setMutedStates(
  map: MaplibreMap,
  allStateIds: ReadonlyArray<FeatureId>,
  exceptId: FeatureId | null,
): void {
  const sourceId = BOUNDARY_SOURCES.states.id;
  for (const id of allStateIds) {
    map.setFeatureState({ source: sourceId, id }, { muted: exceptId !== null && id !== exceptId });
  }
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

/**
 * Sets the choropleth layer's normalised values (0..1) via feature-state.
 * Districts with null data get -1, which the ramp renders as plain land.
 */
export function setChoroplethValues(
  map: MaplibreMap,
  values: ReadonlyArray<{ id: FeatureId; value: number | null }>,
): void {
  const sourceId = BOUNDARY_SOURCES.districts.id;
  for (const { id, value } of values) {
    map.setFeatureState({ source: sourceId, id }, { value: value ?? -1 });
  }
}

/** Shows/hides any engine layer by id. */
export function setLayerVisible(map: MaplibreMap, layerId: string, visible: boolean): void {
  if (!map.getLayer(layerId)) return;
  map.setLayoutProperty(layerId, "visibility", visible ? "visible" : "none");
}

const OPACITY_PROP_BY_TYPE: Record<string, string> = {
  fill: "fill-opacity",
  line: "line-opacity",
  "fill-extrusion": "fill-extrusion-opacity",
  circle: "circle-opacity",
  raster: "raster-opacity",
};

/** Sets a uniform opacity on any engine layer (0..1). */
export function setLayerOpacity(map: MaplibreMap, layerId: string, opacity: number): void {
  const layer = map.getLayer(layerId);
  if (!layer) return;
  const prop = OPACITY_PROP_BY_TYPE[layer.type];
  if (prop) map.setPaintProperty(layerId, prop, opacity);
}

/**
 * Repaints the choropleth's sequential ramp (per data layer identity).
 * `land` is the no-data color; low/high span normalised 0..1 values.
 */
export function setChoroplethRamp(
  map: MaplibreMap,
  ramp: { low: string; mid: string; high: string; land: string },
): void {
  if (!map.getLayer(LAYER_IDS.districtsChoropleth)) return;
  map.setPaintProperty(LAYER_IDS.districtsChoropleth, "fill-color", [
    "interpolate",
    ["linear"],
    ["coalesce", ["feature-state", "value"], -1],
    -1,
    ramp.land,
    0,
    ramp.low,
    0.5,
    ramp.mid,
    1,
    ramp.high,
  ]);
}

/** Repaints the 3D prism ramp, keeping selection/hover overrides intact. */
export function setExtrusionRamp(
  map: MaplibreMap,
  ramp: { low: string; mid: string; high: string; selected: string; hover: string },
): void {
  if (!map.getLayer(LAYER_IDS.districtsExtrusion)) return;
  map.setPaintProperty(LAYER_IDS.districtsExtrusion, "fill-extrusion-color", [
    "case",
    ["boolean", ["feature-state", "selected"], false],
    ramp.selected,
    ["boolean", ["feature-state", "hover"], false],
    ramp.hover,
    [
      "interpolate",
      ["linear"],
      ["coalesce", ["feature-state", "height"], 0],
      0,
      ramp.low,
      EXTRUSION_MAX_HEIGHT / 2,
      ramp.mid,
      EXTRUSION_MAX_HEIGHT,
      ramp.high,
    ],
  ]);
}

/** Replaces the live transit vehicles on the map. */
export function setTransitData(map: MaplibreMap, collection: FeatureCollection): void {
  const source = map.getSource(TRANSIT_SOURCE_ID) as GeoJSONSource | undefined;
  source?.setData(collection);
}

/** Loads the static transit network (route lines + stops) into the map. */
export function setTransitNetworkData(
  map: MaplibreMap,
  routes: FeatureCollection,
  stops: FeatureCollection,
): void {
  (map.getSource(TRANSIT_ROUTES_SOURCE_ID) as GeoJSONSource | undefined)?.setData(routes);
  (map.getSource(TRANSIT_STOPS_SOURCE_ID) as GeoJSONSource | undefined)?.setData(stops);
}

const TRANSIT_NETWORK_LAYERS = [
  LAYER_IDS.transitRoutes,
  LAYER_IDS.transitRoutesActive,
  LAYER_IDS.transitStops,
  LAYER_IDS.transitStations,
] as const;

/** Shows/hides the whole transit network skeleton. */
export function setTransitNetworkVisible(map: MaplibreMap, visible: boolean): void {
  for (const layerId of TRANSIT_NETWORK_LAYERS) setLayerVisible(map, layerId, visible);
}

/**
 * Highlights one route (selected vehicle or stop): the active layer filters
 * to it and the rest of the network fades back. Pass null to clear.
 */
export function setTransitRouteHighlight(map: MaplibreMap, routeId: string | null): void {
  if (!map.getLayer(LAYER_IDS.transitRoutesActive)) return;
  map.setFilter(LAYER_IDS.transitRoutesActive, [
    "==",
    ["get", "routeId"],
    routeId ?? "",
  ] as unknown as Parameters<typeof map.setFilter>[1]);
  // The base network fades while a route is highlighted.
  map.setPaintProperty(
    LAYER_IDS.transitRoutes,
    "line-opacity",
    routeId
      ? 0.18
      : ([
          "step",
          ["zoom"],
          ["match", ["get", "mode"], "rail", 0.9, 0],
          9.5,
          ["match", ["get", "mode"], "rail", 0.9, 0.45],
        ] as unknown as number),
  );
}

/** Halo around the selected live vehicle (matched by vehicleId). */
export function setTransitVehicleHighlight(map: MaplibreMap, vehicleId: string | null): void {
  if (!map.getLayer(LAYER_IDS.transitVehiclesActive)) return;
  map.setFilter(LAYER_IDS.transitVehiclesActive, [
    "==",
    ["get", "vehicleId"],
    vehicleId ?? "",
  ] as unknown as Parameters<typeof map.setFilter>[1]);
  setLayerVisible(map, LAYER_IDS.transitVehiclesActive, vehicleId !== null);
}

/** Moves the selection outline to one district (null clears it). */
export function setSelectionOutline(map: MaplibreMap, fid: FeatureId | null): void {
  if (!map.getLayer(LAYER_IDS.selectionOutline)) return;
  map.setFilter(LAYER_IDS.selectionOutline, [
    "==",
    ["get", "fid"],
    fid ?? -1,
  ] as unknown as Parameters<typeof map.setFilter>[1]);
}

/**
 * Toggles which boundary level is visible ("both" shows dimmed states as
 * context beneath the focused districts). All levels stay loaded.
 */
export function setBoundaryLevel(map: MaplibreMap, level: BoundaryLevel | "both"): void {
  const showStates = level === "states" || level === "both" ? "visible" : "none";
  const showDistricts = level === "districts" || level === "both" ? "visible" : "none";
  map.setLayoutProperty(LAYER_IDS.statesFill, "visibility", showStates);
  map.setLayoutProperty(LAYER_IDS.statesLine, "visibility", showStates);
  map.setLayoutProperty(LAYER_IDS.districtsFill, "visibility", showDistricts);
  map.setLayoutProperty(LAYER_IDS.districtsLine, "visibility", showDistricts);
}
