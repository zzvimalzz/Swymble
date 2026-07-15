# Architecture

This document is the folder contract and the high-level data flow. It changes
rarely; decision rationale lives in [docs/adr/](./adr/).

## System overview

MyMalaysia is a **static-first data platform**. Malaysian public data changes
mostly monthly/quarterly/annually, so the platform ships data as versioned
static artifacts rather than querying a database:

```
official sources (data.gov.my, OpenDOSM, BNM, GTFS, ...)
        │  scheduled GitHub Actions (etl/)
        ▼
validate → transform → version
        │
        ▼
Cloudflare R2  (typed JSON · Parquet · PMTiles)
        │  edge-cached fetches
        ▼
Next.js app on Cloudflare Workers (OpenNext)
        +  workers/ for realtime proxies (weather, transit)
```

There is deliberately **no database, no auth, no server-side API framework**
in v1 (see ADR-0001). Realtime feeds proxy official public APIs at the edge.

## Rendering strategy

Pages are static or ISR — regenerated on the ETL cadence, never per-request
SSR for data pages. Interactive exploration happens client-side against
versioned artifacts fetched from R2.

## Folder contract

Top level:

| Folder      | Contract                                                                                                                                                               |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/`      | Application source. Everything importable lives here.                                                                                                                  |
| `docs/`     | Architecture, ADRs, runbooks. Updated in the same PR as the code.                                                                                                      |
| `datasets/` | Dataset **manifests**: one file per dataset describing source, licence, refresh schedule, output artifacts. Consumed by both `etl/` and the app's dataset registry.    |
| `etl/`      | Ingestion pipeline run by scheduled GitHub Actions (Milestone 8). Node/TypeScript scripts: download → validate → transform → publish to R2. Never imported by the app. |
| `workers/`  | Standalone Cloudflare Workers that are not the Next.js app (e.g. realtime proxy). Each has its own wrangler config.                                                    |
| `e2e/`      | Playwright end-to-end specs.                                                                                                                                           |
| `public/`   | Files served verbatim at the site root (favicons, manifest, OG images).                                                                                                |

Inside `src/`:

| Folder            | Contract                                                                                                                                                                                                                                                                                                                             |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `src/app/`        | Routes only, and thin: metadata + composition of feature components. No business logic, no data munging.                                                                                                                                                                                                                             |
| `src/features/`   | One folder per product module (`home/`, `explorer/`, `economy/`, ...). A feature owns its components, hooks, and logic, and exposes a small public surface via its `index.ts`. Features may import shared code; **features never import other features** — shared needs graduate to `components/`, `hooks/`, `lib/`, or `services/`. |
| `src/components/` | Shared presentational components. `ui/` is shadcn/ui-managed (edited only via the shadcn CLI or deliberate overrides); `layout/` is the global shell (nav, footer); anything else shared goes at the root of `components/`.                                                                                                          |
| `src/hooks/`      | Shared React hooks with no feature knowledge.                                                                                                                                                                                                                                                                                        |
| `src/services/`   | Data access: the dataset registry client, R2 fetch layer, realtime API clients. The only layer allowed to `fetch`.                                                                                                                                                                                                                   |
| `src/lib/`        | Pure utilities (no React, no IO). Safe to import from anywhere, imports nothing above it.                                                                                                                                                                                                                                            |
| `src/maps/`       | Map styles, layer definitions, boundary metadata for the MapLibre engine.                                                                                                                                                                                                                                                            |
| `src/types/`      | Cross-cutting TypeScript types (dataset metadata model, geo entities). Feature-local types stay in the feature.                                                                                                                                                                                                                      |
| `src/config/`     | Runtime configuration: validated env (`env.ts`), site metadata, navigation. Values that could differ between environments.                                                                                                                                                                                                           |
| `src/constants/`  | True constants of the domain (state codes, module ids). Values that could never differ between environments.                                                                                                                                                                                                                         |
| `src/styles/`     | Design tokens and global styles (`src/app/globals.css` stays the Tailwind entry and imports from here).                                                                                                                                                                                                                              |
| `src/assets/`     | Importable static assets (SVGs, illustrations). Fonts load via `next/font`.                                                                                                                                                                                                                                                          |
| `src/test/`       | Test setup and shared test utilities.                                                                                                                                                                                                                                                                                                |

## Dependency direction

```
app → features → { components, hooks, services, maps }
                  services → { lib, types, config, constants }
                  everything → { lib, types, constants }
```

Anything that would reverse an arrow is an architecture change — write an ADR
first.

## Conventions

- Files ≤ ~400 lines; split before 500.
- No hardcoded internal routes or external endpoints in components — routes
  come from `src/config/`, endpoints from `src/config/env.ts` or dataset
  manifests.
- Unit tests colocate as `*.test.ts(x)`; stories colocate as `*.stories.tsx`.
- Every dataset surfaced in the UI must carry source, licence, last-updated,
  and quality status (the metadata model in `src/types/`).
