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
    /** Sequential choropleth ramp (magnitude): one hue, light → dark. */
    rampLow: string;
    rampHigh: string;
  }
> = {
  light: {
    water: "#f3f4f7",
    land: "#e2e4ea",
    landHover: "#c7d3ec",
    selected: "#2f55a4",
    boundary: "#fbfbfc",
    boundaryStrong: "#9aa1b0",
    rampLow: "#dde6f6",
    rampHigh: "#1c3f8c",
  },
  dark: {
    water: "#14161d",
    land: "#272b36",
    landHover: "#33415e",
    selected: "#8fb0f0",
    boundary: "#14161d",
    boundaryStrong: "#4a5060",
    rampLow: "#232c40",
    rampHigh: "#a5c2f7",
  },
};

export const LAYER_IDS = {
  background: "background",
  statesFill: "states-fill",
  statesLine: "states-line",
  districtsFill: "districts-fill",
  districtsLine: "districts-line",
  districtsChoropleth: "districts-choropleth",
  districtsExtrusion: "districts-extrusion",
  selectionOutline: "selection-outline",
  transitVehicles: "transit-vehicles",
} as const;

export const TRANSIT_SOURCE_ID = "transit-vehicles-source";

/**
 * Agency identity colors for live transit (categorical, both themes chosen
 * for the dark ink and light paper alike; each pairs with a surface ring).
 */
export const TRANSIT_AGENCY_COLORS: Record<string, string> = {
  ktmb: "#e0364e",
  "rapid-bus-kl": "#12b5cb",
  "rapid-bus-penang": "#2fb344",
  "rapid-bus-kuantan": "#a06be0",
};
export const TRANSIT_FALLBACK_COLOR = "#8b93a3";

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
 * Fill opacity driven by the "muted" feature-state: when a state is
 * focused, the other states stay visible as dimmed context.
 */
function boundaryFillOpacity(): DataDrivenPropertyValueSpecification<number> {
  return ["case", ["boolean", ["feature-state", "muted"], false], 0.35, 1];
}

/**
 * The engine's data overlay: every source and layer MyMalaysia adds on top
 * of whatever ground it renders over. Today the ground is a flat colored
 * canvas; when basemap tiles come online (NEXT_PUBLIC_BASEMAP_STYLE_URL)
 * the same overlay is merged onto that style instead — no refactor.
 */
export function buildDataOverlay(
  theme: MapTheme,
  initialLevel: BoundaryLevel,
): Pick<StyleSpecification, "sources" | "layers"> {
  const colors = MAP_COLORS[theme];

  return {
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
      [TRANSIT_SOURCE_ID]: {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      },
    },
    layers: [
      {
        id: LAYER_IDS.statesFill,
        type: "fill",
        source: BOUNDARY_SOURCES.states.id,
        layout: { visibility: initialLevel === "states" ? "visible" : "none" },
        paint: {
          "fill-color": boundaryFillColor(colors),
          "fill-opacity": boundaryFillOpacity(),
        },
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
      // Choropleth surface: colored by a normalised 0..1 "value" feature-state
      // (set per active data layer), sequential single-hue ramp. Hidden until
      // a data layer enables it; uniform opacity is the layer's opacity knob.
      {
        id: LAYER_IDS.districtsChoropleth,
        type: "fill",
        source: BOUNDARY_SOURCES.districts.id,
        layout: { visibility: "none" },
        paint: {
          "fill-color": [
            "interpolate",
            ["linear"],
            ["coalesce", ["feature-state", "value"], -1],
            -1,
            colors.land,
            0,
            colors.rampLow,
            1,
            colors.rampHigh,
          ],
          "fill-opacity": 0.85,
        },
      },
      // Selection outline: rides above every fill/choropleth so a selected
      // feature stays visible regardless of the color underneath.
      {
        id: LAYER_IDS.selectionOutline,
        type: "line",
        source: BOUNDARY_SOURCES.districts.id,
        filter: ["==", ["get", "fid"], -1],
        paint: {
          "line-color": colors.selected,
          "line-width": 2.5,
        },
      },
      // Live transit vehicles: agency-colored dots over everything else,
      // fed by GTFS-Realtime via setData on an interval. Hidden until the
      // transit layer is toggled on.
      {
        id: LAYER_IDS.transitVehicles,
        type: "circle",
        source: TRANSIT_SOURCE_ID,
        layout: { visibility: "none" },
        paint: {
          "circle-radius": ["interpolate", ["linear"], ["zoom"], 5, 2.5, 10, 5, 14, 8],
          // Flattened [key, color, …] pairs defeat the tuple type of the
          // match expression — the shape is correct, assert it.
          "circle-color": [
            "match",
            ["get", "agency"],
            ...Object.entries(TRANSIT_AGENCY_COLORS).flat(),
            TRANSIT_FALLBACK_COLOR,
          ] as unknown as DataDrivenPropertyValueSpecification<string>,
          "circle-stroke-color": colors.boundary,
          "circle-stroke-width": 1.5,
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
          // Selection/hover must win over the height ramp — otherwise the
          // highlight only shows on the flat fill layer beneath the prism.
          "fill-extrusion-color": [
            "case",
            ["boolean", ["feature-state", "selected"], false],
            colors.selected,
            ["boolean", ["feature-state", "hover"], false],
            colors.landHover,
            [
              "interpolate",
              ["linear"],
              ["coalesce", ["feature-state", "height"], 0],
              0,
              colors.land,
              EXTRUSION_MAX_HEIGHT,
              colors.selected,
            ],
          ],
          "fill-extrusion-opacity": 0.9,
        },
      },
    ],
  };
}

/** Full style for the default ground: a flat colored canvas + the overlay. */
export function buildMapStyle(theme: MapTheme, initialLevel: BoundaryLevel): StyleSpecification {
  const colors = MAP_COLORS[theme];
  const overlay = buildDataOverlay(theme, initialLevel);

  return {
    version: 8,
    sources: overlay.sources,
    layers: [
      {
        id: LAYER_IDS.background,
        type: "background",
        paint: { "background-color": colors.water },
      },
      ...overlay.layers,
    ],
  };
}

/**
 * Merges the data overlay onto an external basemap style (vector tiles,
 * terrain-ready) fetched from NEXT_PUBLIC_BASEMAP_STYLE_URL. Basemap layers
 * stay below; our sources/layers append on top. Colliding ids are ours.
 */
export function mergeOntoBasemap(
  basemap: StyleSpecification,
  theme: MapTheme,
  initialLevel: BoundaryLevel,
): StyleSpecification {
  const overlay = buildDataOverlay(theme, initialLevel);
  const overlayIds = new Set(overlay.layers.map((l) => l.id));
  return {
    ...basemap,
    sources: { ...basemap.sources, ...overlay.sources },
    layers: [...basemap.layers.filter((l) => !overlayIds.has(l.id)), ...overlay.layers],
  };
}
