<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# MyMalaysia

Premium platform for exploring Malaysia through open public data. Production
product under the Swymble brand — never a demo; no placeholder pages, no mock
data presented as real.

## Ground rules

- Read [docs/architecture.md](docs/architecture.md) before adding files — it
  is the folder contract (dependency direction, feature isolation, where
  fetch is allowed). ADRs in [docs/adr/](docs/adr/) record decisions that are
  not up for casual reversal: static-first (no DB/auth/FastAPI in v1),
  MapLibre + PMTiles (no Mapbox), Cloudflare Workers hosting via OpenNext,
  and the map-first Atlas workspace (datasets become layers in
  `src/features/atlas/layer-registry.ts`, never new sibling pages).
- Files ≤ ~400 lines; split before 500.
- No hardcoded internal routes or external endpoints in components — use
  `src/config/`.
- Every dataset shown in the UI carries source, licence, last-updated, and
  quality status.
- Design bar: Apple keynote × modern data journalism. No generic dashboards,
  no gradient-blob hero cards, no filler marketing copy.

## Commands

`npm run dev` · `npm run lint` · `npm run typecheck` · `npm test` (Vitest
unit) · `npm run e2e` (Playwright) · `npm run storybook` · `npm run build` ·
`npm run preview` (Cloudflare Worker locally). CI runs all of them; husky +
lint-staged guard commits.

Data pipelines: `npm run etl` (tabular parquet), `npm run etl:geo`
(boundaries), `npm run etl:gtfs` (transit networks: GTFS Static →
`public/data/transit/*.json` — routes with official colors, stops, simplified
shapes; the skeleton the live GTFS-Realtime vehicles ride on). All artifacts
are committed; the scheduled ETL workflow refreshes them by PR.

## Transit specifics

- Live vehicle positions: GTFS-Realtime (browser-polled, CORS-open) for KTMB
  - Rapid buses. LRT/MRT positions are NOT published upstream — never fake
    them; rail lines/stations render from the static network instead.
- ETAs are estimates (distance along the route shape ÷ reported or default
  speed) and every surface must say so. The Prasarana Socket.IO feed and
  third-party APIs (MTREC) are not used: unofficial, cookie-gated, or
  rate-capped.
