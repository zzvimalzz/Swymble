import { LAYER_IDS } from "@/maps/style";

/**
 * Layers are first-class objects: everything the workspace shows on the map
 * is declared here — engine wiring, grouping, color identity, legend, and
 * the dataset it derives from (attribution/metadata). Data layers
 * (choropleths) are exclusive with one another; base and live layers toggle
 * independently.
 */

export type AtlasLayerKind = "base" | "data" | "live";

export type MetricId = "population" | "income" | "gdp";

/** Theme-pair of colors (hex, WebGL paint can't read CSS vars). */
export interface ThemedColor {
  light: string;
  dark: string;
}

/**
 * Heat ramp for magnitude on the map: low → mid → high stops
 * (green → yellow → red — "more is hotter"), themed per surface. A
 * multi-hue sequential is the deliberate "semantic heat" exception and
 * always ships with the gradient legend in the layer card.
 */
export interface MetricRamp {
  light: { low: string; mid: string; high: string };
  dark: { low: string; mid: string; high: string };
}

/** One heat scale for every metric — consistency beats per-layer ramps. */
export const HEAT_RAMP: MetricRamp = {
  light: { low: "#1f9d55", mid: "#e3a008", high: "#c81e1e" },
  dark: { low: "#4ade80", mid: "#facc15", high: "#f05252" },
};

export interface AtlasLayerDef {
  id: string;
  kind: AtlasLayerKind;
  title: string;
  group: "Boundaries" | "People" | "Economy" | "Transit";
  description: string;
  /** Engine layer ids this layer controls (visibility/opacity). */
  engineLayers: string[];
  /** For data layers: the metric rendered as choropleth/extrusion. */
  metric?: MetricId;
  /** Identity color for this layer's UI (dot, sparkline, legend). */
  accent: ThemedColor;
  /** For data layers: the sequential single-hue map ramp. */
  ramp?: MetricRamp;
  /** Dataset manifest id backing this layer (attribution, metadata). */
  datasetId?: string;
  /** Attribution line for layers without a dataset manifest (live feeds). */
  attribution?: string;
  defaultVisible: boolean;
  defaultOpacity: number;
}

export const ATLAS_LAYERS: AtlasLayerDef[] = [
  {
    id: "state-boundaries",
    kind: "base",
    title: "State boundaries",
    group: "Boundaries",
    description: "The 16 states and federal territories.",
    engineLayers: [LAYER_IDS.statesLine],
    accent: { light: "#5a6472", dark: "#8b93a3" },
    datasetId: "boundaries-states",
    defaultVisible: true,
    defaultOpacity: 1,
  },
  {
    id: "district-boundaries",
    kind: "base",
    title: "District boundaries",
    group: "Boundaries",
    description: "All 160 administrative districts.",
    engineLayers: [LAYER_IDS.districtsFill, LAYER_IDS.districtsLine],
    accent: { light: "#5a6472", dark: "#8b93a3" },
    datasetId: "boundaries-districts",
    defaultVisible: true,
    defaultOpacity: 1,
  },
  {
    id: "population",
    kind: "data",
    title: "Population",
    group: "People",
    description: "People per district, annual from the 2020 Census onwards.",
    engineLayers: [LAYER_IDS.districtsChoropleth],
    metric: "population",
    accent: { light: "#2f55a4", dark: "#8fb0f0" },
    ramp: HEAT_RAMP,
    datasetId: "population-district",
    defaultVisible: true,
    defaultOpacity: 0.85,
  },
  {
    id: "median-income",
    kind: "data",
    title: "Median household income",
    group: "People",
    description: "Gross monthly household income (median), from HIES.",
    engineLayers: [LAYER_IDS.districtsChoropleth],
    metric: "income",
    accent: { light: "#0d7d70", dark: "#4fd1c5" },
    ramp: HEAT_RAMP,
    datasetId: "household-income-district",
    defaultVisible: false,
    defaultOpacity: 0.85,
  },
  {
    id: "gdp",
    kind: "data",
    title: "GDP",
    group: "Economy",
    description: "Real GDP, all sectors, constant 2015 prices.",
    engineLayers: [LAYER_IDS.districtsChoropleth],
    metric: "gdp",
    accent: { light: "#9a6200", dark: "#f2b23e" },
    ramp: HEAT_RAMP,
    datasetId: "gdp-district",
    defaultVisible: false,
    defaultOpacity: 0.85,
  },
  {
    id: "transit",
    kind: "live",
    title: "Live transit vehicles",
    group: "Transit",
    description:
      "KTM Komuter trains and Rapid buses (KL, Penang, Kuantan), live every 30 seconds. MRT/LRT positions aren't published upstream yet.",
    engineLayers: [LAYER_IDS.transitVehicles],
    accent: { light: "#c2273b", dark: "#f16a7c" },
    attribution: "GTFS-Realtime · data.gov.my · refreshed every 30 s",
    defaultVisible: false,
    defaultOpacity: 1,
  },
];

export const DATA_LAYERS = ATLAS_LAYERS.filter((l) => l.kind === "data");
export const BASE_LAYERS = ATLAS_LAYERS.filter((l) => l.kind === "base");

export function getAtlasLayer(id: string): AtlasLayerDef | undefined {
  return ATLAS_LAYERS.find((l) => l.id === id);
}
