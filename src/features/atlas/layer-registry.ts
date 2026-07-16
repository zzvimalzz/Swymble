import { LAYER_IDS } from "@/maps/style";

/**
 * Layers are first-class objects: everything the workspace shows on the map
 * is declared here — engine wiring, grouping, legend, and the dataset it
 * derives from (for attribution/metadata). Data layers (choropleths) are
 * exclusive with one another; base layers toggle independently.
 */

export type AtlasLayerKind = "base" | "data";

export type MetricId = "population" | "income" | "gdp";

export interface AtlasLayerDef {
  id: string;
  kind: AtlasLayerKind;
  title: string;
  group: "Boundaries" | "People" | "Economy";
  description: string;
  /** Engine layer ids this layer controls (visibility/opacity). */
  engineLayers: string[];
  /** For data layers: the metric rendered as choropleth/extrusion. */
  metric?: MetricId;
  /** Dataset manifest id backing this layer (attribution, metadata). */
  datasetId?: string;
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
    datasetId: "gdp-district",
    defaultVisible: false,
    defaultOpacity: 0.85,
  },
];

export const DATA_LAYERS = ATLAS_LAYERS.filter((l) => l.kind === "data");
export const BASE_LAYERS = ATLAS_LAYERS.filter((l) => l.kind === "base");

export function getAtlasLayer(id: string): AtlasLayerDef | undefined {
  return ATLAS_LAYERS.find((l) => l.id === id);
}
