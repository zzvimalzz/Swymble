import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

import { clearArtifactMemo, fetchArtifact } from "@/services/artifact-client";

const payloadSchema = z.array(z.object({ year: z.number(), value: z.number() }));

function envelope(overrides: Record<string, unknown> = {}) {
  return {
    datasetId: "fuel-price",
    version: "2026-07-15",
    updatedAt: "2026-07-14T00:00:00Z",
    publishedAt: "2026-07-15T01:00:00Z",
    rowCount: 2,
    source: {
      provider: "Ministry of Finance Malaysia",
      portal: "data.gov.my",
      url: "https://data.gov.my/data-catalogue/fuelprice",
      licence: "CC BY 4.0",
      licenceUrl: "https://creativecommons.org/licenses/by/4.0/",
    },
    data: [
      { year: 2025, value: 2.05 },
      { year: 2026, value: 2.05 },
    ],
    ...overrides,
  };
}

function mockFetchOnce(body: unknown, ok = true, status = 200) {
  return vi.spyOn(globalThis, "fetch").mockResolvedValue({
    ok,
    status,
    json: async () => body,
  } as Response);
}

beforeEach(() => clearArtifactMemo());
afterEach(() => vi.restoreAllMocks());

describe("fetchArtifact", () => {
  it("fetches, validates, and types an artifact", async () => {
    const spy = mockFetchOnce(envelope());
    const result = await fetchArtifact("fuel-price", payloadSchema);
    expect(result.data[0].value).toBe(2.05);
    expect(result.updatedAt).toBe("2026-07-14T00:00:00Z");
    expect(spy).toHaveBeenCalledOnce();
    const url = spy.mock.calls[0][0];
    expect(String(url)).toContain("/data/fuel-price/latest.json");
  });

  it("memoises concurrent and repeat calls", async () => {
    const spy = mockFetchOnce(envelope());
    await Promise.all([
      fetchArtifact("fuel-price", payloadSchema),
      fetchArtifact("fuel-price", payloadSchema),
    ]);
    await fetchArtifact("fuel-price", payloadSchema);
    expect(spy).toHaveBeenCalledOnce();
  });

  it("rejects HTTP errors and does not memoise failures", async () => {
    const spy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce({ ok: false, status: 404, json: async () => ({}) } as Response)
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => envelope() } as Response);

    await expect(fetchArtifact("fuel-price", payloadSchema)).rejects.toThrow(/HTTP 404/);
    await expect(fetchArtifact("fuel-price", payloadSchema)).resolves.toBeTruthy();
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it("rejects envelopes for the wrong dataset", async () => {
    mockFetchOnce(envelope({ datasetId: "gdp-district" }));
    await expect(fetchArtifact("fuel-price", payloadSchema)).rejects.toThrow(/wrong artifact/);
  });

  it("rejects invalid payloads", async () => {
    mockFetchOnce(envelope({ data: [{ year: "2025" }] }));
    await expect(fetchArtifact("fuel-price", payloadSchema)).rejects.toThrow(/invalid payload/);
  });

  it("rejects unknown dataset ids", async () => {
    await expect(fetchArtifact("does-not-exist", payloadSchema)).rejects.toThrow(
      /Unknown dataset id/,
    );
  });
});
