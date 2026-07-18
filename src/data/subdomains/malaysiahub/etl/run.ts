import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { DATASET_MANIFESTS } from "@datasets";
import type { ArtifactEnvelope, DatasetManifest } from "@/types/dataset";

import { readParquetFromUrl } from "./lib/parquet";
import { TRANSFORMS } from "./transforms";

/**
 * The tabular ETL pipeline: download → validate → transform → version →
 * publish. Driven entirely by the manifests in datasets/.
 *
 *   npm run etl                  # all tabular datasets
 *   npm run etl -- fuel-price    # a subset
 *
 * Artifacts are written to public/data/ (committed — deterministic builds
 * and tests). The GitHub Actions workflow (etl.yml) runs this on a weekly
 * schedule, opens a data-update PR, and mirrors artifacts to Cloudflare R2
 * when uploads are enabled. Geo artifacts are built separately by
 * etl/geo/*.mjs (npm run etl:geo).
 *
 * A failed dataset never publishes: the last good committed artifact stays
 * live, and the run exits non-zero so CI flags it.
 */

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function processDataset(manifest: DatasetManifest): Promise<void> {
  const spec = TRANSFORMS[manifest.id];
  if (!spec) {
    throw new Error(`No transform registered for dataset "${manifest.id}" (etl/transforms.ts)`);
  }

  console.log(`[${manifest.id}] downloading ${manifest.upstream.url}`);
  const rows = await readParquetFromUrl(manifest.upstream.url);
  console.log(`[${manifest.id}] ${rows.length} upstream rows`);

  const { data, updatedAt, rowCount } = spec.transform(rows);
  if (rowCount < spec.minRows) {
    throw new Error(`[${manifest.id}] only ${rowCount} rows after transform (min ${spec.minRows})`);
  }
  spec.payloadSchema.parse(data);

  const now = new Date();
  const envelope: ArtifactEnvelope = {
    datasetId: manifest.id,
    version: now.toISOString().slice(0, 10),
    updatedAt,
    publishedAt: now.toISOString(),
    rowCount,
    source: manifest.source,
    data,
  };

  const outPath = path.join(repoRoot, "public", manifest.artifact.path);
  await mkdir(path.dirname(outPath), { recursive: true });
  await writeFile(outPath, JSON.stringify(envelope));
  console.log(
    `[${manifest.id}] published ${manifest.artifact.path} ` +
      `(${rowCount} rows, data as of ${updatedAt.slice(0, 10)})`,
  );
}

async function main(): Promise<void> {
  const requestedIds = process.argv.slice(2).filter((a) => !a.startsWith("-"));

  const tabular = DATASET_MANIFESTS.filter((m) => m.upstream.kind === "parquet").filter(
    (m) => requestedIds.length === 0 || requestedIds.includes(m.id),
  );

  if (tabular.length === 0) {
    console.error(`No tabular datasets matched ${JSON.stringify(requestedIds)}`);
    process.exit(1);
  }

  let failures = 0;
  for (const manifest of tabular) {
    try {
      await processDataset(manifest);
    } catch (error) {
      failures += 1;
      console.error(`[${manifest.id}] FAILED:`, error instanceof Error ? error.message : error);
    }
  }

  if (failures > 0) {
    console.error(`${failures}/${tabular.length} datasets failed — nothing broken was published.`);
    process.exit(1);
  }
  console.log(`All ${tabular.length} datasets published.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
