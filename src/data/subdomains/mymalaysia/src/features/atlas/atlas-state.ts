import type { MetricId } from "./layer-registry";

/** Per-layer UI state, keyed by atlas layer id. */
export interface LayerState {
  visible: boolean;
}

export type AtlasPanel = "layers" | "inspector" | "data" | "live";

export type AtlasSelection =
  { kind: "district"; fid: number } | { kind: "state"; code: number } | null;

export interface AtlasUrlParams {
  /** DOSM state code to open focused on. */
  state: number | null;
  /** Panel to open initially. */
  panel: AtlasPanel | null;
  /** Data layer (metric) to activate initially. */
  layer: MetricId | null;
  /** Open with the live transit layer on. */
  transit: boolean;
}

export function parseAtlasParams(searchParams: URLSearchParams): AtlasUrlParams {
  const state = Number(searchParams.get("state"));
  const panel = searchParams.get("panel");
  const layer = searchParams.get("layer");
  return {
    state: Number.isInteger(state) && state > 0 ? state : null,
    panel: panel === "layers" || panel === "data" || panel === "live" ? panel : null,
    layer: layer === "population" || layer === "income" || layer === "gdp" ? layer : null,
    transit: layer === "transit",
  };
}
