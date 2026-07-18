import type { DatasetManifest } from "@/types/dataset";

export const gdpDistrict: DatasetManifest = {
  id: "gdp-district",
  title: "GDP by district",
  description:
    "Annual real gross domestic product at district level for the five main economic sectors, at constant 2015 prices.",
  module: "economy",
  tier: "A",
  cadence: "annual",
  source: {
    provider: "Department of Statistics Malaysia",
    portal: "OpenDOSM",
    url: "https://open.dosm.gov.my/data-catalogue/gdp_district_real_supply",
    licence: "CC BY 4.0",
    licenceUrl: "https://creativecommons.org/licenses/by/4.0/",
  },
  upstream: {
    kind: "parquet",
    url: "https://storage.dosm.gov.my/gdp/gdp_district_real_supply.parquet",
  },
  artifact: {
    path: "data/gdp-district/latest.json",
    format: "json",
  },
};
