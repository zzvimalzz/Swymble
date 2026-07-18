# ADR-0004: The map is the application (Atlas workspace)

**Status:** Accepted · Phase 3, July 2026

## Context

The Phase 2 foundation shipped Explorer and Live as separate pages. Using
the product made the seams obvious: every module wanted the same map, the
same selection model, and the same data registry — navigating between pages
threw that context away. The product direction is a geospatial platform
(Google Earth / ArcGIS / OWID energy), not a set of dashboards.

## Decision

One workspace at `/map` ("the Atlas") owns a **single persistent MapLibre
instance**. Former modules become _lenses_ on it:

- **Layers** — every dataset is a first-class layer object
  (`src/features/atlas/layer-registry.ts`): engine wiring, grouping,
  legend, opacity, dataset link for attribution/quality. Data layers
  (choropleths over the same district geometry) are mutually exclusive;
  base layers compose freely.
- **Inspector** — clicking any district (or searching) opens contextual
  details with trends; the map never unmounts.
- **Timeline** — the active data layer's years drive a scrub/play bar;
  choropleth, 3D prisms, and figures move together. Values are normalised
  against a fixed cross-year domain so change over time is real.
- **Live** — the realtime board (fuel, weather) docks as a panel.
- **Search** — states, districts, layers, datasets; selecting flies the
  camera.

`/explorer` and `/live` remain as client-side redirect stubs (the static
export can't do server redirects). The route registry shrinks to Home +
Map.

## Map richness is progressive, not deferred refactoring

The engine now separates its **data overlay** (sources + layers we own)
from the **ground** it renders over. Today the ground is the flat canvas;
`NEXT_PUBLIC_BASEMAP_STYLE_URL` (a full MapLibre style, e.g. Protomaps over
PMTiles on R2) swaps in roads/buildings/land-use/labels via
`mergeOntoBasemap` with zero code changes, and
`NEXT_PUBLIC_TERRAIN_DEM_URL` enables 3D terrain + hillshading the same
way. Both wait only on the R2 bucket.

## Consequences

- New datasets ship as layer definitions, not pages — the IA never grows
  another sibling app.
- One map instance means all lens switches are paint/panel operations;
  nothing re-fetches boundaries or re-creates WebGL contexts.
- Exclusive data layers are a deliberate GIS-honesty constraint: two
  choropleths on the same polygons cannot blend legibly. Comparison UX
  (side-by-side, swipe) is a future lens, not simultaneous paint.
- The homepage remains the marketing/editorial entry; the Atlas is the
  product.
