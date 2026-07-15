# etl

The ingestion pipeline (Milestone 8), run by scheduled GitHub Actions —
never by the app.

Stages per dataset, driven by its manifest in `datasets/`:

1. **Download** the upstream source (raw responses snapshotted for
   insurance).
2. **Validate** against the manifest's expectations — a failed validation
   aborts publication and leaves the last good version live.
3. **Transform** into typed JSON (app consumption), Parquet (analytical/
   archival), and PMTiles (geometry).
4. **Version & publish** to Cloudflare R2 with the metadata envelope
   (source, licence, last-updated, quality status).

TypeScript, executed with the same Node version as the app. Shares schemas
via `src/types` and pure helpers via `src/lib` only.
