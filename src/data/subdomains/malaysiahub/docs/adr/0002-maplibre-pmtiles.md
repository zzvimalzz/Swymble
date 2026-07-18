# ADR-0002: MapLibre GL + PMTiles instead of Mapbox GL

**Status:** Accepted · Phase 1 review, July 2026

## Context

Mapbox GL bills per map load and its v2+ licence forbids self-hosted
workarounds. MalaysiaHub is a free product whose success metric is traffic —
popularity would convert directly into invoices.

## Decision

MapLibre GL (open fork, feature parity for our needs, first-class deck.gl
interop) with self-hosted PMTiles on Cloudflare R2 (zero egress fees) built
from OpenStreetMap via Protomaps tooling. Malaysia's ~160 district boundaries
ship as a small PMTiles/GeoJSON artifact from the ETL pipeline.

## Consequences

- Basemap cost is zero at any traffic level.
- We own map styling end-to-end (this is where the design investment goes
  regardless of vendor).
- No Mapbox-proprietary features (Standard style, their geocoder); geocoding,
  if ever needed, is a separate decision.
