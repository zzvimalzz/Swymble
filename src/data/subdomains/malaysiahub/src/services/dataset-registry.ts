import { DATASET_MANIFESTS } from "@datasets";
import {
  datasetManifestSchema,
  type DatasetManifest,
  type QualityStatus,
  type RefreshCadence,
} from "@/types/dataset";

/**
 * The dataset registry: typed access to every manifest plus quality-status
 * computation. Metadata is static (bundled); artifact *content* comes
 * through src/services/artifact-client.
 */

const byId = new Map<string, DatasetManifest>(DATASET_MANIFESTS.map((m) => [m.id, m]));

export function getDatasetManifest(id: string): DatasetManifest {
  const manifest = byId.get(id);
  if (!manifest) {
    throw new Error(`Unknown dataset id "${id}" — is its manifest listed in datasets/index.ts?`);
  }
  return manifest;
}

export function listDatasetManifests(filter?: {
  module?: DatasetManifest["module"];
}): DatasetManifest[] {
  if (!filter?.module) return [...DATASET_MANIFESTS];
  return DATASET_MANIFESTS.filter((m) => m.module === filter.module);
}

/** Validates every manifest — run by tests so a bad manifest fails CI. */
export function validateAllManifests(): void {
  for (const manifest of DATASET_MANIFESTS) {
    datasetManifestSchema.parse(manifest);
  }
  if (byId.size !== DATASET_MANIFESTS.length) {
    throw new Error("Duplicate dataset ids in datasets/index.ts");
  }
}

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * How long after `updatedAt` a dataset is still "ok", per cadence. Roughly
 * two refresh periods — generous enough for upstream publication lag,
 * strict enough that a broken pipeline becomes visible.
 */
const STALE_AFTER_MS: Record<RefreshCadence, number> = {
  realtime: 15 * 60 * 1000,
  hourly: 3 * 60 * 60 * 1000,
  daily: 3 * DAY_MS,
  weekly: 15 * DAY_MS,
  monthly: 65 * DAY_MS,
  quarterly: 200 * DAY_MS,
  annual: 750 * DAY_MS,
  biennial: 1500 * DAY_MS,
  static: Number.POSITIVE_INFINITY,
};

/**
 * Quality as shown to users. `updatedAt` comes from the fetched artifact
 * envelope; pass null when the artifact couldn't be fetched at all.
 */
export function computeQuality(
  cadence: RefreshCadence,
  updatedAt: string | null,
  now: Date = new Date(),
): QualityStatus {
  if (updatedAt === null) return "unavailable";
  const updated = Date.parse(updatedAt);
  if (Number.isNaN(updated)) return "degraded";
  const age = now.getTime() - updated;
  return age <= STALE_AFTER_MS[cadence] ? "ok" : "stale";
}
