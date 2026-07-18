# datasets

Dataset **manifests** — one file per dataset, the single source of truth
consumed by both the ETL pipeline (`etl/`) and the app's dataset registry
(`src/services`).

A manifest declares (schema arrives with Milestone 7):

- id, title, module, description
- upstream source: endpoint/URL, provider, licence
- refresh schedule (cron) and expected cadence
- output artifacts (JSON/Parquet/PMTiles paths in R2)
- validation expectations (row counts, required fields, value ranges)

No data files live here — artifacts are produced by `etl/` and published to
R2.
