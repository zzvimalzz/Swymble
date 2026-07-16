import type { DatasetManifest } from "@/types/dataset";

export const populationDistrict: DatasetManifest = {
  id: "population-district",
  title: "Population by district",
  description:
    "Annual population at district level by sex, age group, and ethnicity, from the 2020 Census onwards.",
  module: "population",
  tier: "A",
  cadence: "annual",
  source: {
    provider: "Department of Statistics Malaysia",
    portal: "OpenDOSM",
    url: "https://open.dosm.gov.my/data-catalogue/population_district",
    licence: "CC BY 4.0",
    licenceUrl: "https://creativecommons.org/licenses/by/4.0/",
  },
  upstream: {
    kind: "parquet",
    url: "https://storage.dosm.gov.my/population/population_district.parquet",
  },
  artifact: {
    path: "data/population-district/latest.json",
    format: "json",
  },
};
