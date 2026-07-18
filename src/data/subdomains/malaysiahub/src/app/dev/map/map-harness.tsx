"use client";

import { useCallback, useRef, useState } from "react";
import type { Map as MaplibreMap, MapGeoJSONFeature } from "maplibre-gl";

import { Button } from "@/components/ui/button";
import {
  bindBoundaryInteractions,
  flyToBbox,
  MapView,
  setBoundaryLevel,
  setSelectedFeature,
  type FeatureId,
} from "@/components/map";
import { MALAYSIA_BBOX, STATE_META } from "@/maps/generated/boundary-meta";
import type { BoundaryLevel } from "@/maps/sources";

interface Selection {
  id: FeatureId;
  name: string;
}

/** Interactive exerciser for every engine capability. */
export function MapHarness() {
  const mapRef = useRef<MaplibreMap | null>(null);
  const unbindRef = useRef<(() => void) | null>(null);
  const [level, setLevel] = useState<BoundaryLevel>("states");
  const [hovered, setHovered] = useState<string | null>(null);
  const [selection, setSelection] = useState<Selection | null>(null);
  const selectionRef = useRef<Selection | null>(null);

  const bind = useCallback((map: MaplibreMap, nextLevel: BoundaryLevel) => {
    unbindRef.current?.();
    unbindRef.current = bindBoundaryInteractions(map, nextLevel, {
      onHover: (feature: MapGeoJSONFeature | null) => {
        setHovered(
          feature ? ((feature.properties.district ?? feature.properties.state) as string) : null,
        );
      },
      onSelect: (feature) => {
        const id = feature.id as FeatureId;
        const name = (feature.properties.district ?? feature.properties.state) as string;
        setSelectedFeature(map, nextLevel, id, selectionRef.current?.id ?? null);
        selectionRef.current = { id, name };
        setSelection({ id, name });
        const stateMeta = STATE_META.find((s) => s.code === feature.properties.code_state);
        if (stateMeta) flyToBbox(map, stateMeta.bbox);
      },
    });
  }, []);

  const onLoad = useCallback(
    (map: MaplibreMap) => {
      mapRef.current = map;
      bind(map, "states");
    },
    [bind],
  );

  const switchLevel = (nextLevel: BoundaryLevel) => {
    const map = mapRef.current;
    if (!map || nextLevel === level) return;
    setBoundaryLevel(map, nextLevel);
    setSelectedFeature(map, level, null, selectionRef.current?.id ?? null);
    selectionRef.current = null;
    setSelection(null);
    setHovered(null);
    setLevel(nextLevel);
    bind(map, nextLevel);
  };

  const reset = () => {
    const map = mapRef.current;
    if (!map) return;
    setSelectedFeature(map, level, null, selectionRef.current?.id ?? null);
    selectionRef.current = null;
    setSelection(null);
    flyToBbox(map, MALAYSIA_BBOX, { padding: 24 });
  };

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col">
      <div className="flex flex-wrap items-center gap-3 border-b border-border/60 px-4 py-3 sm:px-6">
        <span className="font-mono text-xs tracking-widest uppercase">engine harness</span>
        <div className="flex gap-1">
          <Button
            size="sm"
            variant={level === "states" ? "default" : "outline"}
            onClick={() => switchLevel("states")}
          >
            States
          </Button>
          <Button
            size="sm"
            variant={level === "districts" ? "default" : "outline"}
            onClick={() => switchLevel("districts")}
          >
            Districts
          </Button>
          <Button size="sm" variant="ghost" onClick={reset}>
            Reset view
          </Button>
        </div>
        <div className="ml-auto flex gap-4 font-mono text-xs text-muted-foreground">
          <span data-testid="hovered-name">{hovered ?? "—"}</span>
          <span data-testid="selected-name">{selection ? `selected: ${selection.name}` : ""}</span>
        </div>
      </div>
      <div className="min-h-0 flex-1">
        <MapView initialLevel="states" onLoad={onLoad} />
      </div>
    </div>
  );
}
