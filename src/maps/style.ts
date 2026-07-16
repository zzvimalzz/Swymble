import type { DataDrivenPropertyValueSpecification, StyleSpecification } from "maplibre-gl";

import { BOUNDARY_SOURCES, type BoundaryLevel } from "@/maps/sources";

export type MapTheme = "light" | "dark";

/**
 * Colors mirror src/styles/tokens.css. WebGL paint can't resolve CSS custom
 * properties, so the token values are restated here as hex — change both
 * files together (guarded by a design-review note in tokens.css).
 */
export const MAP_COLORS: Record<
  MapTheme,
  {
    water: string;
    land: string;
    landHover: string;
    selected: string;
    boundary: string;
    boundaryStrong: string;
  }
> = {
  light: {
    water: "#f3f4f7",
    land: "#e2e4ea",
    landHover: "#c7d3ec",
    selected: "#2f55a4",
    boundary: "#fbfbfc",
    boundaryStrong: "#9aa1b0",
  },
  dark: {
    water: "#14161d",
    land: "#272b36",
    landHover: "#33415e",
    selected: "#8fb0f0",
    boundary: "#14161d",
    boundaryStrong: "#4a5060",
  },
};

export const LAYER_IDS = {
  background: "background",
  statesFill: "states-fill",
  statesLine: "states-line",
  districtsFill: "districts-fill",
  districtsLine: "districts-line",
  districtsExtrusion: "districts-extrusion",
} as const;

/** Ceiling of the 3D prisms, in metres. Heights are set via feature-state. */
export const EXTRUSION_MAX_HEIGHT = 150_000;

export const FILL_LAYER_BY_LEVEL: Record<BoundaryLevel, string> = {
  states: LAYER_IDS.statesFill,
  districts: LAYER_IDS.districtsFill,
};

/** Fill color driven by hover/selected feature-state. */
function boundaryFillColor(
  colors: (typeof MAP_COLORS)[MapTheme],
): DataDrivenPropertyValueSpecification<string> {
  return [
    "case",
    ["boolean", ["feature-state", "selected"], false],
    colors.selected,
    ["boolean", ["feature-state", "hover"], false],
    colors.landHover,
    colors.land,
  ];
}

/**
 * Builds the engine's style: a boundary-first data canvas (no street
 * basemap — deliberate, see docs/adr/0002). Both boundary levels are always
 * present; visibility is toggled by the layer system so switching levels
 * never refetches data.
 */
export function buildMapStyle(theme: MapTheme, initialLevel: BoundaryLevel): StyleSpecification {
  const colors = MAP_COLORS[theme];

  return {
    version: 8,
    sources: {
      [BOUNDARY_SOURCES.states.id]: {
        type: "geojson",
        data: BOUNDARY_SOURCES.states.url,
        promoteId: BOUNDARY_SOURCES.states.promoteId,
      },
      [BOUNDARY_SOURCES.districts.id]: {
        type: "geojson",
        data: BOUNDARY_SOURCES.districts.url,
        promoteId: BOUNDARY_SOURCES.districts.promoteId,
      },
    },
    layers: [
      {
        id: LAYER_IDS.background,
        type: "background",
        paint: { "background-color": colors.water },
      },
      {
        id: LAYER_IDS.statesFill,
        type: "fill",
        source: BOUNDARY_SOURCES.states.id,
        layout: { visibility: initialLevel === "states" ? "visible" : "none" },
        paint: { "fill-color": boundaryFillColor(colors) },
      },
      {
        id: LAYER_IDS.statesLine,
        type: "line",
        source: BOUNDARY_SOURCES.states.id,
        layout: { visibility: initialLevel === "states" ? "visible" : "none" },
        paint: {
          "line-color": colors.boundary,
          "line-width": ["interpolate", ["linear"], ["zoom"], 4, 0.75, 8, 1.5],
        },
      },
      {
        id: LAYER_IDS.districtsFill,
        type: "fill",
        source: BOUNDARY_SOURCES.districts.id,
        layout: { visibility: initialLevel === "districts" ? "visible" : "none" },
        paint: { "fill-color": boundaryFillColor(colors) },
      },
      {
        id: LAYER_IDS.districtsLine,
        type: "line",
        source: BOUNDARY_SOURCES.districts.id,
        layout: { visibility: initialLevel === "districts" ? "visible" : "none" },
        paint: {
          "line-color": colors.boundary,
          "line-width": ["interpolate", ["linear"], ["zoom"], 4, 0.5, 9, 1.25],
        },
      },
      // 3D mode: district prisms. Heights arrive via feature-state (set from
      // the active dataset), color ramps from land to the interface blue with
      // height. Hidden until a view enables 3D.
      {
        id: LAYER_IDS.districtsExtrusion,
        type: "fill-extrusion",
        source: BOUNDARY_SOURCES.districts.id,
        layout: { visibility: "none" },
        paint: {
          "fill-extrusion-height": ["coalesce", ["feature-state", "height"], 0],
          "fill-extrusion-color": [
            "interpolate",
            ["linear"],
            ["coalesce", ["feature-state", "height"], 0],
            0,
            colors.land,
            EXTRUSION_MAX_HEIGHT,
            colors.selected,
          ],
          "fill-extrusion-opacity": 0.9,
        },
      },
    ],
  };
}
