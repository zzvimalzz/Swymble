"use client";

import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { SourceAttribution } from "@/components/source-attribution";
import { getDatasetManifest } from "@/services/dataset-registry";
import { TRANSIT_AGENCIES, type TransitSnapshot } from "@/services/transit-client";
import { TRANSIT_AGENCY_COLORS, TRANSIT_FALLBACK_COLOR } from "@/maps/style";
import { themedColor } from "@/lib/theme-color";

import type { AtlasData } from "../atlas-data";
import { ATLAS_LAYERS, type AtlasLayerDef } from "../layer-registry";
import type { LayerState } from "../atlas-state";

interface LayersPanelProps {
  layerState: Record<string, LayerState>;
  data: AtlasData | null;
  transit: TransitSnapshot | null;
  onToggle: (layer: AtlasLayerDef, visible: boolean) => void;
  onOpacity: (layer: AtlasLayerDef, opacity: number) => void;
}

/**
 * Continuous heat legend. Colors use CSS light-dark() so the SSR HTML is
 * theme-independent (hydration-safe) yet flips live with the theme.
 */
function RampLegend({ data, layer }: { data: AtlasData | null; layer: AtlasLayerDef }) {
  const series = layer.metric && data ? data.metrics[layer.metric] : null;
  if (!series || !layer.ramp) return null;
  const low = themedColor({ light: layer.ramp.light.low, dark: layer.ramp.dark.low });
  const mid = themedColor({ light: layer.ramp.light.mid, dark: layer.ramp.dark.mid });
  const high = themedColor({ light: layer.ramp.light.high, dark: layer.ramp.dark.high });

  return (
    <div className="mt-2">
      <div
        className="h-2 w-full rounded-full"
        style={{ background: `linear-gradient(to right, ${low}, ${mid}, ${high})` }}
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

/** Per-agency legend + live counts for the transit layer. */
function TransitLegend({ transit }: { transit: TransitSnapshot | null }) {
  return (
    <div className="mt-2 space-y-1.5">
      {TRANSIT_AGENCIES.map((agency) => (
        <div key={agency.id} className="flex items-center gap-2 text-xs">
          <span
            className="inline-block size-2.5 rounded-full border border-background"
            style={{ background: TRANSIT_AGENCY_COLORS[agency.id] ?? TRANSIT_FALLBACK_COLOR }}
            aria-hidden
          />
          <span>{agency.label}</span>
          <span className="ml-auto font-mono text-muted-foreground tabular">
            {transit ? (transit.countByAgency[agency.id] ?? 0) : "…"}
          </span>
        </div>
      ))}
      {transit && (
        <p className="pt-1 font-mono text-[10px] text-muted-foreground">
          updated{" "}
          {transit.fetchedAt.toLocaleTimeString("en-MY", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          })}
        </p>
      )}
    </div>
  );
}

/**
 * The layer manager: grouped toggles, opacity, legends, per-layer source
 * attribution with live quality. Layer identity colors render via
 * light-dark() (hydration-safe). Data layers behave as an exclusive set
 * with exactly one always on; base and live layers compose.
 */
export function LayersPanel({ layerState, data, transit, onToggle, onOpacity }: LayersPanelProps) {
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
              const accent = themedColor(layer.accent);
              return (
                <li
                  key={layer.id}
                  className="rounded-lg border border-l-4 border-border/60 p-3"
                  style={{ borderLeftColor: state.visible ? accent : undefined }}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <span
                          className="inline-block size-2.5 shrink-0 rounded-full"
                          style={{ background: accent }}
                          aria-hidden
                        />
                        {layer.title}
                      </div>
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
                      {layer.id === "transit" && <TransitLegend transit={transit} />}
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
                  {layer.attribution && state.visible && (
                    <p className="mt-3 font-mono text-xs text-muted-foreground">
                      {layer.attribution}
                    </p>
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
