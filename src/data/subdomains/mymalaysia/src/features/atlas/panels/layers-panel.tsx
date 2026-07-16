"use client";

import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { SourceAttribution } from "@/components/source-attribution";
import { getDatasetManifest } from "@/services/dataset-registry";
import { MAP_COLORS } from "@/maps/style";
import { useTheme } from "next-themes";

import type { AtlasData } from "../atlas-data";
import { ATLAS_LAYERS, type AtlasLayerDef } from "../layer-registry";
import type { LayerState } from "../atlas-state";

interface LayersPanelProps {
  layerState: Record<string, LayerState>;
  data: AtlasData | null;
  onToggle: (layer: AtlasLayerDef, visible: boolean) => void;
  onOpacity: (layer: AtlasLayerDef, opacity: number) => void;
}

/** Continuous-ramp legend for the active data layer. */
function RampLegend({ data, layer }: { data: AtlasData | null; layer: AtlasLayerDef }) {
  const { resolvedTheme } = useTheme();
  const colors = MAP_COLORS[resolvedTheme === "dark" ? "dark" : "light"];
  const series = layer.metric && data ? data.metrics[layer.metric] : null;
  if (!series) return null;

  return (
    <div className="mt-2">
      <div
        className="h-2 w-full rounded-full"
        style={{ background: `linear-gradient(to right, ${colors.rampLow}, ${colors.rampHigh})` }}
        aria-hidden
      />
      <div className="mt-1 flex justify-between font-mono text-[10px] text-muted-foreground">
        <span>{series.format(series.domain.min)}</span>
        {series.scale === "sqrt" && <span>√ scale</span>}
        <span>{series.format(series.domain.max)}</span>
      </div>
    </div>
  );
}

/**
 * The layer manager: grouped toggles, opacity, legends, per-layer source
 * attribution with live quality. Data layers behave as an exclusive set.
 */
export function LayersPanel({ layerState, data, onToggle, onOpacity }: LayersPanelProps) {
  const groups = [...new Set(ATLAS_LAYERS.map((l) => l.group))];

  return (
    <div className="space-y-6 p-4">
      {groups.map((group) => (
        <section key={group} aria-label={group}>
          <h3 className="mb-2 font-mono text-xs tracking-widest text-muted-foreground uppercase">
            {group}
          </h3>
          <ul className="space-y-4">
            {ATLAS_LAYERS.filter((l) => l.group === group).map((layer) => {
              const state = layerState[layer.id];
              const series = layer.metric && data ? data.metrics[layer.metric] : null;
              return (
                <li key={layer.id} className="rounded-lg border border-border/60 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-medium">{layer.title}</div>
                      <p className="mt-0.5 text-xs text-muted-foreground">{layer.description}</p>
                    </div>
                    <Switch
                      checked={state.visible}
                      onCheckedChange={(checked) => onToggle(layer, checked)}
                      aria-label={`Toggle ${layer.title}`}
                      data-testid={`layer-toggle-${layer.id}`}
                    />
                  </div>

                  {state.visible && (
                    <div className="mt-3 space-y-2">
                      <div className="flex items-center gap-3">
                        <span className="w-14 shrink-0 font-mono text-[10px] text-muted-foreground uppercase">
                          opacity
                        </span>
                        <Slider
                          value={[Math.round(state.opacity * 100)]}
                          min={10}
                          max={100}
                          step={5}
                          onValueChange={([v]) => onOpacity(layer, v / 100)}
                          aria-label={`${layer.title} opacity`}
                        />
                      </div>
                      {layer.kind === "data" && <RampLegend data={data} layer={layer} />}
                    </div>
                  )}

                  {layer.datasetId && state.visible && (
                    <SourceAttribution
                      manifest={getDatasetManifest(layer.datasetId)}
                      updatedAt={series?.updatedAt ?? null}
                      quality={series?.quality ?? "ok"}
                      className="mt-3"
                    />
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
