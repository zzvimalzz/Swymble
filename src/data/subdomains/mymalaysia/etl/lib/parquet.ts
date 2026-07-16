export type ParquetRow = Record<string, unknown>;

// hyparquet is ESM-only; dynamic import keeps this module loadable from the
// CJS context tsx uses in this repo (and from vitest's ESM context alike).
async function loadHyparquet() {
  const [{ parquetReadObjects, parquetSchema, parquetMetadataAsync }, { compressors }] =
    await Promise.all([import("hyparquet"), import("hyparquet-compressors")]);
  return { parquetReadObjects, parquetSchema, parquetMetadataAsync, compressors };
}

async function download(url: string): Promise<ArrayBuffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} downloading ${url}`);
  }
  return response.arrayBuffer();
}

/**
 * Downloads a parquet file and returns its rows as plain objects.
 * DOSM/data.gov.my files are small (kilobytes to a few megabytes), so
 * whole-file reads are fine.
 */
export async function readParquetFromUrl(url: string): Promise<ParquetRow[]> {
  const { parquetReadObjects, compressors } = await loadHyparquet();
  const file = await download(url);
  return parquetReadObjects({ file, compressors });
}

/** Column names of a parquet file (for diagnostics and validation). */
export async function readParquetColumns(url: string): Promise<string[]> {
  const { parquetSchema, parquetMetadataAsync } = await loadHyparquet();
  const file = await download(url);
  const metadata = await parquetMetadataAsync(file);
  return parquetSchema(metadata).children.map((c) => c.element.name);
}
