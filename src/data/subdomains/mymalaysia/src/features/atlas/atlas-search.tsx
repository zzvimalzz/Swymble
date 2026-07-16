"use client";

import { Landmark, Layers as LayersIcon, MapPin, Table2 } from "lucide-react";

import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { listDatasetManifests } from "@/services/dataset-registry";
import { DISTRICT_META, STATE_META } from "@/maps/generated/boundary-meta";

import { DATA_LAYERS, type AtlasLayerDef } from "./layer-registry";

interface AtlasSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectState: (code: number) => void;
  onSelectDistrict: (fid: number) => void;
  onActivateLayer: (layer: AtlasLayerDef) => void;
  onOpenData: () => void;
}

const STATE_NAME_BY_CODE = new Map(STATE_META.map((s) => [s.code, s.name]));

/**
 * The workspace search: places, layers, and datasets in one box. Selecting
 * a place flies the camera there and opens the inspector.
 */
export function AtlasSearch({
  open,
  onOpenChange,
  onSelectState,
  onSelectDistrict,
  onActivateLayer,
  onOpenData,
}: AtlasSearchProps) {
  const run = (action: () => void) => {
    onOpenChange(false);
    action();
  };

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Search Malaysia"
      description="Find states, districts, layers, and datasets"
    >
      <Command>
        <CommandInput
          placeholder="Search states, districts, layers…"
          data-testid="atlas-search-input"
        />
        <CommandList>
          <CommandEmpty>Nothing found.</CommandEmpty>
          <CommandGroup heading="Layers">
            {DATA_LAYERS.map((layer) => (
              <CommandItem
                key={layer.id}
                value={`layer ${layer.title}`}
                onSelect={() => run(() => onActivateLayer(layer))}
              >
                <LayersIcon aria-hidden />
                <span>{layer.title}</span>
                <span className="ml-2 truncate text-xs text-muted-foreground">{layer.group}</span>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="States">
            {STATE_META.map((state) => (
              <CommandItem
                key={state.code}
                value={`state ${state.name}`}
                onSelect={() => run(() => onSelectState(state.code))}
              >
                <Landmark aria-hidden />
                <span>{state.name}</span>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="Districts">
            {DISTRICT_META.map((district) => (
              <CommandItem
                key={district.id}
                value={`district ${district.name} ${STATE_NAME_BY_CODE.get(district.stateCode)}`}
                onSelect={() => run(() => onSelectDistrict(district.id))}
              >
                <MapPin aria-hidden />
                <span>{district.name}</span>
                <span className="ml-2 truncate text-xs text-muted-foreground">
                  {STATE_NAME_BY_CODE.get(district.stateCode)}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="Datasets">
            {listDatasetManifests().map((manifest) => (
              <CommandItem
                key={manifest.id}
                value={`dataset ${manifest.title}`}
                onSelect={() => run(onOpenData)}
              >
                <Table2 aria-hidden />
                <span>{manifest.title}</span>
                <span className="ml-2 truncate text-xs text-muted-foreground">
                  {manifest.source.portal}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </Command>
    </CommandDialog>
  );
}
