import type { DatasetManifest } from "@/types/dataset";

export const fuelPrice: DatasetManifest = {
  id: "fuel-price",
  title: "Fuel prices",
  description:
    "Weekly retail prices of RON95, RON97, and diesel set under the Automatic Pricing Mechanism, since 2017.",
  module: "live",
  tier: "A",
  cadence: "weekly",
  source: {
    provider: "Ministry of Finance Malaysia",
    portal: "data.gov.my",
    url: "https://data.gov.my/data-catalogue/fuelprice",
    licence: "CC BY 4.0",
    licenceUrl: "https://creativecommons.org/licenses/by/4.0/",
  },
  upstream: {
    kind: "parquet",
    url: "https://storage.data.gov.my/commodities/fuelprice.parquet",
  },
  artifact: {
    path: "data/fuel-price/latest.json",
    format: "json",
  },
};
