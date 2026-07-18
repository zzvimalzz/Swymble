# src/maps

Everything the MapLibre engine consumes (Milestone 6):

- Map style definitions (light + dark), designed in-house — the basemap is
  part of the design system.
- Layer definitions for boundaries, choropleths, and point layers.
- Boundary metadata linking geometry ids to `src/constants` code tables.

Heavy geometry itself (PMTiles/GeoJSON artifacts) is produced by `etl/` and
served from R2 — never committed here.
