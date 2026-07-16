"use client";

import { ArrowUpRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { SourceAttribution } from "@/components/source-attribution";
import { listDatasetManifests } from "@/services/dataset-registry";

import type { AtlasData } from "../atlas-data";
import { DATA_LAYERS } from "../layer-registry";

interface DataPanelProps {
  data: AtlasData | null;
}

/** The data catalogue: every dataset, its provenance, and freshness. */
export function DataPanel({ data }: DataPanelProps) {
  const manifests = listDatasetManifests();

  return (
    <div className="space-y-3 p-4">
      <p className="text-xs text-muted-foreground">
        Everything on this platform traces to an official source. Artifacts are versioned and
        refreshed by a scheduled pipeline; quality is computed from each dataset&apos;s declared
        cadence.
      </p>
      <ul className="space-y-3">
        {manifests.map((manifest) => {
          const layer = DATA_LAYERS.find((l) => l.datasetId === manifest.id);
          const series = layer?.metric && data ? data.metrics[layer.metric] : null;
          return (
            <li key={manifest.id} className="rounded-lg border border-border/60 p-3">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-sm font-medium">{manifest.title}</h3>
                <Badge variant="outline" className="shrink-0 font-mono text-[10px]">
                  tier {manifest.tier} · {manifest.cadence}
                </Badge>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{manifest.description}</p>
              <SourceAttribution
                manifest={manifest}
                updatedAt={series?.updatedAt ?? null}
                quality={series?.quality ?? "ok"}
                className="mt-2"
              />
              <a
                href={manifest.source.url}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-brand-selat underline-offset-4 hover:underline"
              >
                Open at {manifest.source.portal}
                <ArrowUpRight className="size-3" aria-hidden />
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
