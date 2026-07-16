import { z } from "zod";

import { env } from "@/config/env";
import { getDatasetManifest } from "@/services/dataset-registry";
import { artifactEnvelopeSchema, type ArtifactEnvelope } from "@/types/dataset";

/**
 * Fetches dataset artifacts from the data lake, validates the envelope and
 * payload, and memoises per session. The only place dataset content is
 * fetched — components never call fetch themselves.
 */

class ArtifactError extends Error {
  constructor(
    readonly datasetId: string,
    message: string,
    readonly cause?: unknown,
  ) {
    super(`[${datasetId}] ${message}`);
    this.name = "ArtifactError";
  }
}

const memo = new Map<string, Promise<ArtifactEnvelope>>();

function artifactUrl(path: string): string {
  return new URL(path, `${env.NEXT_PUBLIC_DATA_BASE_URL}/`).toString();
}

async function fetchAndValidate<T>(
  datasetId: string,
  payloadSchema: z.ZodType<T>,
): Promise<ArtifactEnvelope<T>> {
  const manifest = getDatasetManifest(datasetId);
  const url = artifactUrl(manifest.artifact.path);

  let response: Response;
  try {
    // Artifacts are versioned and republished on the ETL cadence; an hour of
    // edge/browser caching is always safe.
    response = await fetch(url, { next: { revalidate: 3600 } });
  } catch (cause) {
    throw new ArtifactError(datasetId, `network failure fetching ${url}`, cause);
  }
  if (!response.ok) {
    throw new ArtifactError(datasetId, `HTTP ${response.status} fetching ${url}`);
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch (cause) {
    throw new ArtifactError(datasetId, "artifact is not valid JSON", cause);
  }

  const envelope = artifactEnvelopeSchema.safeParse(body);
  if (!envelope.success) {
    throw new ArtifactError(datasetId, `invalid envelope: ${envelope.error.message}`);
  }
  if (envelope.data.datasetId !== datasetId) {
    throw new ArtifactError(
      datasetId,
      `envelope belongs to "${envelope.data.datasetId}" — wrong artifact at ${url}`,
    );
  }

  const payload = payloadSchema.safeParse(envelope.data.data);
  if (!payload.success) {
    throw new ArtifactError(datasetId, `invalid payload: ${payload.error.message}`);
  }

  return { ...envelope.data, data: payload.data };
}

/**
 * Fetch a dataset artifact, validated against `payloadSchema`. Concurrent
 * and repeat calls share one in-flight promise per dataset; failures are
 * not memoised so the next call retries.
 */
export function fetchArtifact<T>(
  datasetId: string,
  payloadSchema: z.ZodType<T>,
): Promise<ArtifactEnvelope<T>> {
  const cached = memo.get(datasetId);
  if (cached) return cached as Promise<ArtifactEnvelope<T>>;

  const promise = fetchAndValidate(datasetId, payloadSchema).catch((error) => {
    memo.delete(datasetId);
    throw error;
  });
  memo.set(datasetId, promise as Promise<ArtifactEnvelope>);
  return promise;
}

/** Test hook: clears the artifact memo. */
export function clearArtifactMemo(): void {
  memo.clear();
}

export { ArtifactError };
