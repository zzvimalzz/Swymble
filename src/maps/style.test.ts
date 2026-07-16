import { describe, expect, it } from "vitest";

import { BOUNDARY_SOURCES } from "@/maps/sources";
import { buildMapStyle, LAYER_IDS, MAP_COLORS } from "@/maps/style";

describe("buildMapStyle", () => {
  it("declares every boundary source with a promoted feature id", () => {
    const style = buildMapStyle("light", "states");
    for (const source of Object.values(BOUNDARY_SOURCES)) {
      const declared = style.sources[source.id];
      expect(declared).toBeDefined();
      expect(declared).toMatchObject({ type: "geojson", promoteId: source.promoteId });
    }
  });

  it("only references declared sources from layers", () => {
    const style = buildMapStyle("dark", "districts");
    const sourceIds = new Set(Object.keys(style.sources));
    for (const layer of style.layers) {
      if ("source" in layer && layer.source) {
        expect(sourceIds.has(layer.source as string)).toBe(true);
      }
    }
  });

  it("shows exactly the requested boundary level initially", () => {
    const style = buildMapStyle("light", "states");
    const byId = Object.fromEntries(style.layers.map((l) => [l.id, l]));
    expect(byId[LAYER_IDS.statesFill].layout?.visibility).toBe("visible");
    expect(byId[LAYER_IDS.districtsFill].layout?.visibility).toBe("none");

    const flipped = buildMapStyle("light", "districts");
    const flippedById = Object.fromEntries(flipped.layers.map((l) => [l.id, l]));
    expect(flippedById[LAYER_IDS.statesFill].layout?.visibility).toBe("none");
    expect(flippedById[LAYER_IDS.districtsFill].layout?.visibility).toBe("visible");
  });

  it("ships the 3D extrusion layer hidden by default", () => {
    const style = buildMapStyle("light", "states");
    const extrusion = style.layers.find((l) => l.id === LAYER_IDS.districtsExtrusion);
    expect(extrusion).toBeDefined();
    expect(extrusion?.layout?.visibility).toBe("none");
  });

  it("themes differ where it matters", () => {
    expect(MAP_COLORS.light.water).not.toBe(MAP_COLORS.dark.water);
    expect(MAP_COLORS.light.selected).not.toBe(MAP_COLORS.dark.selected);
  });
});
