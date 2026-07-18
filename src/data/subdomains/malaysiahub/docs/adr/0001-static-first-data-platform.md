# ADR-0001: Static-first data platform (no database in v1)

**Status:** Accepted · Phase 1 review, July 2026

## Context

The source data is dominated by monthly/quarterly/annual official statistics
(OpenDOSM, data.gov.my, BNM). Genuinely realtime feeds (GTFS vehicle
positions, weather) are already served by official public APIs. A day-one
FastAPI + PostgreSQL + PostGIS + Redis stack would add patching, migrations,
connection limits, and standing cost with no workload to justify it.

## Decision

Scheduled GitHub Actions ingest, validate, transform, and version datasets,
publishing typed JSON / Parquet / PMTiles to Cloudflare R2. The app reads
those artifacts through edge caching. Realtime upstreams are proxied by thin
Cloudflare Workers. Every artifact carries a metadata envelope: source,
licence, last-updated, refresh schedule, quality status.

## Consequences

- Zero standing infrastructure cost; upstream rate limits are hit a few times
  a day from CI instead of per-visitor.
- Upstream outages don't take the site down — it serves the last good
  snapshot.
- Cross-dataset ad-hoc queries and the AI Assistant will need server compute;
  the versioned Parquet lake in R2 is the designed load source for the
  PostgreSQL/PostGIS deployment when that wave arrives (revisit this ADR
  then).
