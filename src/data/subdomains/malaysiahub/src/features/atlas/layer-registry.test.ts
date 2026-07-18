import { describe, expect, it } from "vitest";

import { getDatasetManifest } from "@/services/dataset-registry";
import { LAYER_IDS } from "@/maps/style";

import { ATLAS_LAYERS, DATA_LAYERS } from "./layer-registry";

describe("atlas layer registry", () => {
  it("has unique ids", () => {
    const ids = ATLAS_LAYERS.map((l) => l.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("references only real engine layers", () => {
    const engineIds = new Set(Object.values(LAYER_IDS));
    for (const layer of ATLAS_LAYERS) {
      for (const engineLayer of layer.engineLayers) {
        expect(engineIds.has(engineLayer as never), `${layer.id} → ${engineLayer}`).toBe(true);
      }
    }
  });

  it("references only registered datasets", () => {
    for (const layer of ATLAS_LAYERS) {
      if (layer.datasetId) {
        expect(() => getDatasetManifest(layer.datasetId!)).not.toThrow();
      }
    }
  });

  it("every data layer carries a metric and exactly one default is visible", () => {
    for (const layer of DATA_LAYERS) {
      expect(layer.metric, layer.id).toBeDefined();
    }
    expect(DATA_LAYERS.filter((l) => l.defaultVisible)).toHaveLength(1);
  });
});
