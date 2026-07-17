"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Map as MaplibreMap, MapMouseEvent } from "maplibre-gl";

import {
  flyToBbox,
  MapView,
  setLayerVisible,
  setTransitNetworkData,
  setTransitNetworkVisible,
  setTransitRouteHighlight,
  setTransitVehicleHighlight,
  useCursorTip,
} from "@/components/map";
import { Button } from "@/components/ui/button";
import { fetchVehiclePositions, type TransitSnapshot } from "@/services/transit-client";
import {
  loadTransitNetworks,
  resolveRouteId,
  routesToGeoJson,
  stopsToGeoJson,
  type TransitNetworkIndex,
} from "@/services/transit-network";
import { LAYER_IDS } from "@/maps/style";
import type { Bbox } from "@/maps/generated/boundary-meta";

import { arrivalsForStop, upcomingStopsForVehicle, vehicleKey } from "./eta";
import { createLiveMotion, type LiveMotionController } from "./live-motion";
import { TransitPanel, type TransitSelectionView } from "./transit-panel";

type TransitSelection = { kind: "stop"; stopId: string } | { kind: "vehicle"; key: string } | null;

const CAMERA_PRESETS: Array<{ id: string; label: string; bbox: Bbox }> = [
  { id: "klang-valley", label: "Klang Valley", bbox: [101.3, 2.85, 101.95, 3.35] },
  { id: "penang", label: "Penang", bbox: [100.15, 5.1, 100.6, 5.6] },
  { id: "kuantan", label: "Kuantan", bbox: [103.2, 3.7, 103.45, 3.95] },
];

const PICKABLE_LAYERS = [
  LAYER_IDS.transitVehicles,
  LAYER_IDS.transitStations,
  LAYER_IDS.transitStops,
];

/**
 * The living transit map: the full network skeleton (route lines in their
 * official colors, stations, bus stops) with live vehicles gliding along
 * it. Click a stop to see what's approaching and how far out it is; click
 * a vehicle to follow its route and next stops. Positions poll every 30 s
 * (GTFS-Realtime); ETAs are estimates measured along the route shape.
 */
export function TransitView() {
  const mapRef = useRef<MaplibreMap | null>(null);
  const motionRef = useRef<LiveMotionController | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [index, setIndex] = useState<TransitNetworkIndex | null>(null);
  const [snapshot, setSnapshot] = useState<TransitSnapshot | null>(null);
  const [selection, setSelection] = useState<TransitSelection>(null);
  const tip = useCursorTip();

  const onMapLoad = useCallback((map: MaplibreMap) => {
    mapRef.current = map;
    setMapReady(true);
  }, []);

  // ---- static network: load once, then feed the map (and re-feed after
  // style reloads, which reset GeoJSON sources) ----
  useEffect(() => {
    let cancelled = false;
    loadTransitNetworks()
      .then((loaded) => {
        if (!cancelled) setIndex(loaded);
      })
      .catch((error) => console.error("transit network load failed:", error));
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || !index) return;
    const routes = routesToGeoJson(index);
    const stops = stopsToGeoJson(index);
    const apply = () => {
      if (!map.getLayer(LAYER_IDS.transitRoutes)) return;
      setTransitNetworkData(map, routes, stops);
      setTransitNetworkVisible(map, true);
      setLayerVisible(map, LAYER_IDS.transitVehicles, true);
      motionRef.current?.refresh();
    };
    apply();
    map.on("styledata", apply);
    return () => {
      map.off("styledata", apply);
    };
  }, [mapReady, index]);

  // ---- live vehicles: 30 s poll, tweened between updates ----
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    const controller = createLiveMotion(map);
    motionRef.current = controller;

    let cancelled = false;
    const poll = async () => {
      try {
        const next = await fetchVehiclePositions();
        if (cancelled) return;
        controller.update(next.collection.features);
        setSnapshot(next);
      } catch (error) {
        console.error("transit poll failed:", error);
      }
    };
    void poll();
    const timer = setInterval(poll, 30_000);
    return () => {
      cancelled = true;
      clearInterval(timer);
      motionRef.current = null;
      controller.dispose();
    };
  }, [mapReady]);

  // ---- picking + cursor tooltip (vehicles above stations above stops) ----
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    const pickable = () => PICKABLE_LAYERS.filter((id) => map.getLayer(id));

    const onClick = (event: MapMouseEvent) => {
      const feature = map.queryRenderedFeatures(event.point, { layers: pickable() })[0];
      if (!feature) {
        setSelection(null);
        return;
      }
      if (feature.layer.id === LAYER_IDS.transitVehicles) {
        setSelection({
          kind: "vehicle",
          key: vehicleKey(feature.properties as Parameters<typeof vehicleKey>[0]),
        });
      } else {
        setSelection({ kind: "stop", stopId: String(feature.properties.stopId) });
      }
    };

    const onMove = (event: MapMouseEvent) => {
      const feature = map.queryRenderedFeatures(event.point, { layers: pickable() })[0];
      map.getCanvas().style.cursor = feature ? "pointer" : "";
      if (!feature) {
        tip.hide();
        return;
      }
      const props = feature.properties as Record<string, string | null>;
      if (feature.layer.id === LAYER_IDS.transitVehicles) {
        const routeId = index
          ? resolveRouteId(index, props.route ?? null, props.tripId ?? null)
          : (props.route ?? null);
        const route = routeId ? index?.routesById.get(routeId) : null;
        tip.show(
          event.point,
          route ? `${route.shortName || route.id} · ${route.longName}` : (props.label ?? "Vehicle"),
          props.label ? String(props.label) : undefined,
        );
      } else {
        tip.show(
          event.point,
          String(props.name ?? "Stop"),
          feature.layer.id === LAYER_IDS.transitStations ? "Station" : "Bus stop",
        );
      }
    };

    const onLeave = () => tip.hide();
    map.on("click", onClick);
    map.on("mousemove", onMove);
    map.getCanvas().addEventListener("mouseleave", onLeave);
    return () => {
      map.off("click", onClick);
      map.off("mousemove", onMove);
      map.getCanvas().removeEventListener("mouseleave", onLeave);
    };
  }, [mapReady, index, tip]);

  // ---- selection view (recomputed as fresh positions arrive) ----
  const selectionView = useMemo<TransitSelectionView>(() => {
    if (!selection || !index) return null;
    const vehicles = snapshot?.collection.features ?? [];

    if (selection.kind === "stop") {
      const stop = index.stopsById.get(selection.stopId);
      if (!stop) return null;
      const network = index.networks.find((n) => n.network === stop.network);
      return {
        kind: "stop",
        name: stop.name,
        networkLabel: network?.label ?? stop.network,
        routeShortNames: stop.routeIds.map((id) => index.routesById.get(id)?.shortName || id),
        arrivals: arrivalsForStop(selection.stopId, vehicles, index),
      };
    }

    const feature = vehicles.find((v) => vehicleKey(v.properties) === selection.key);
    if (!feature) return null;
    const props = feature.properties;
    const routeId = resolveRouteId(index, props.route, props.tripId ?? null);
    const route = routeId ? index.routesById.get(routeId) : null;
    const network = index.networks.find((n) => n.network === props.agency);
    return {
      kind: "vehicle",
      title: props.label ?? route?.shortName ?? "Vehicle",
      routeName: route ? `${route.shortName || route.id} · ${route.longName}` : null,
      routeColor: route?.color ?? null,
      agencyLabel: network?.label ?? props.agency,
      speedKmh: typeof props.speed === "number" && props.speed > 0 ? props.speed : null,
      stops: upcomingStopsForVehicle(feature, index).stops,
    };
  }, [selection, snapshot, index]);

  // ---- map highlight follows the selection ----
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    let routeId: string | null = null;
    let vehicleId: string | null = null;
    if (selection && index && snapshot) {
      if (selection.kind === "vehicle") {
        const feature = snapshot.collection.features.find(
          (v) => vehicleKey(v.properties) === selection.key,
        );
        routeId = feature
          ? resolveRouteId(index, feature.properties.route, feature.properties.tripId)
          : null;
        vehicleId = feature?.properties.vehicleId ?? null;
      } else {
        const stop = index.stopsById.get(selection.stopId);
        routeId = stop && stop.routeIds.length === 1 ? stop.routeIds[0] : null;
      }
    }
    setTransitRouteHighlight(map, routeId);
    setTransitVehicleHighlight(map, vehicleId);
  }, [selection, index, snapshot, mapReady]);

  return (
    <div className="relative h-[calc(100dvh-3.5rem)]">
      <MapView initialLevel="states" onLoad={onMapLoad} ariaLabel="Live transit map">
        <TransitPanel
          snapshot={snapshot}
          index={index}
          selection={selectionView}
          onClear={() => setSelection(null)}
        />
        <div
          className="absolute top-3 right-13 z-10 flex flex-col gap-1"
          role="group"
          aria-label="Camera presets"
        >
          {CAMERA_PRESETS.map((preset) => (
            <Button
              key={preset.id}
              size="sm"
              variant="secondary"
              className="justify-start shadow-sm"
              onClick={() => {
                const map = mapRef.current;
                if (map) flyToBbox(map, preset.bbox, { padding: 48 });
              }}
            >
              {preset.label}
            </Button>
          ))}
        </div>
        <div {...tip.props} data-testid="map-tooltip" />
      </MapView>
    </div>
  );
}
