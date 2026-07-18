import { z } from "zod";

/**
 * The dataset metadata model — the contract shared by dataset manifests
 * (datasets/), the ETL pipeline (etl/), and the app's registry/services.
 * Every dataset surfaced in the UI carries this metadata by design.
 */

/** Source dependability tier from the Phase 1 research (A best → E none). */
export const dataTierSchema = z.enum(["A", "B", "C", "D", "E"]);
export type DataTier = z.infer<typeof dataTierSchema>;

export const refreshCadenceSchema = z.enum([
  "realtime",
  "hourly",
  "daily",
  "weekly",
  "monthly",
  "quarterly",
  "annual",
  "biennial",
  "static",
]);
export type RefreshCadence = z.infer<typeof refreshCadenceSchema>;

/** Quality of a dataset as presented to users. */
export const qualityStatusSchema = z.enum(["ok", "stale", "degraded", "unavailable"]);
export type QualityStatus = z.infer<typeof qualityStatusSchema>;

export const datasetSourceSchema = z.object({
  /** Publishing organisation, e.g. "Department of Statistics Malaysia". */
  provider: z.string().min(1),
  /** Human-readable portal name, e.g. "OpenDOSM". */
  portal: z.string().min(1),
  /** Canonical upstream page for the dataset. */
  url: z.url(),
  /** Licence name shown in attribution, e.g. "CC BY 4.0". */
  licence: z.string().min(1),
  licenceUrl: z.url(),
});
export type DatasetSource = z.infer<typeof datasetSourceSchema>;

export const datasetManifestSchema = z.object({
  /** Stable kebab-case identifier; also the artifact folder name in R2. */
  id: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
  title: z.string().min(1),
  description: z.string().min(10),
  /** Owning module (route id from src/config/navigation). */
  module: z.enum(["explorer", "live", "economy", "population", "transit"]),
  tier: dataTierSchema,
  cadence: refreshCadenceSchema,
  source: datasetSourceSchema,
  /** Where the ETL pipeline downloads from. */
  upstream: z.object({
    kind: z.enum(["parquet", "json-api", "geojson", "gtfs"]),
    url: z.url(),
  }),
  /** Artifact the app consumes, relative to the data base URL. */
  artifact: z.object({
    path: z.string().regex(/^data\/[a-z0-9/-]+\.(json|geojson)$/),
    format: z.enum(["json", "geojson"]),
  }),
});
export type DatasetManifest = z.infer<typeof datasetManifestSchema>;

/**
 * The JSON envelope the ETL publishes and the app consumes. `data` is
 * validated separately per dataset with its own payload schema.
 */
export const artifactEnvelopeSchema = z.object({
  datasetId: z.string(),
  /** Artifact version: the ETL run date (YYYY-MM-DD, UTC). */
  version: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  /** When the upstream data itself was last updated (ISO 8601). */
  updatedAt: z.iso.datetime(),
  /** When the ETL produced this artifact (ISO 8601). */
  publishedAt: z.iso.datetime(),
  rowCount: z.number().int().nonnegative(),
  source: datasetSourceSchema,
  data: z.unknown(),
});
export type ArtifactEnvelope<T = unknown> = Omit<z.infer<typeof artifactEnvelopeSchema>, "data"> & {
  data: T;
};
