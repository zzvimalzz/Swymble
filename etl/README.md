# etl

The ingestion pipeline. Run on a weekly schedule by GitHub Actions
(`.github/workflows/etl.yml`), never by the app.

## Tabular pipeline (`run.ts`)

Driven entirely by the manifests in `datasets/`:

1. **Download** the upstream parquet from its official source.
2. **Transform** (`transforms.ts`, pure + unit-tested): slice the upstream
   cube to the app-ready payload; the data vintage (`updatedAt`) is derived
   from the newest date _in the data_, never the run time.
3. **Validate**: minimum row count + the shared Zod payload schema
   (`src/types/dataset-payloads.ts` — the same schema the app validates
   with after fetching).
4. **Version & publish**: wrap in the artifact envelope (version = run
   date, rowCount, source, licence) and write to `public/data/…`.

A failed dataset publishes nothing — the last good artifact stays live and
the run exits non-zero.

```bash
npm run etl                  # all tabular datasets
npm run etl -- fuel-price    # subset
npm run etl:geo              # boundary + homepage geometry artifacts
```

## Geo pipeline (`geo/*.mjs`)

`build-boundaries.mjs` produces the map engine's simplified state/district
GeoJSON (`public/maps/`) and the generated boundary metadata
(`src/maps/generated/`). `build-home-map.mjs` produces the homepage's
inline SVG geometry. Both cache downloads in `geo/.cache/` (gitignored).

## Publication model

Artifacts are **committed** (`public/data/`, `public/maps/`): builds are
deterministic, tests never need the network, and data updates arrive as
reviewable PRs opened by the scheduled workflow — a row-count collapse or
weird vintage is visible in the diff before it deploys.

`upload-r2.mjs` additionally mirrors artifacts to the `mymalaysia-data` R2
bucket when the `ENABLE_R2_UPLOAD` repo variable is true (needs
`CLOUDFLARE_API_TOKEN` with R2 write + `CLOUDFLARE_ACCOUNT_ID`). Keys mirror
the `public/` layout, so pointing `NEXT_PUBLIC_DATA_BASE_URL` at the R2
custom domain is the only switch needed to move serving off-origin.

## Adding a dataset

1. Write its manifest in `datasets/` and list it in `datasets/index.ts`.
2. Add its payload schema to `src/types/dataset-payloads.ts`.
3. Register its transform in `etl/transforms.ts` (with a test).
4. Run `npm run etl -- <id>` and commit the artifact.
