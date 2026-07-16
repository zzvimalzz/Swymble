import type { DatasetManifest } from "@/types/dataset";

export const householdIncomeDistrict: DatasetManifest = {
  id: "household-income-district",
  title: "Household income by district",
  description:
    "Mean and median gross monthly household income at district level from the Household Income and Expenditure Survey.",
  module: "population",
  tier: "A",
  cadence: "biennial",
  source: {
    provider: "Department of Statistics Malaysia",
    portal: "OpenDOSM",
    url: "https://open.dosm.gov.my/data-catalogue/hh_income_district",
    licence: "CC BY 4.0",
    licenceUrl: "https://creativecommons.org/licenses/by/4.0/",
  },
  upstream: {
    kind: "parquet",
    url: "https://storage.dosm.gov.my/hies/hh_income_district.parquet",
  },
  artifact: {
    path: "data/household-income-district/latest.json",
    format: "json",
  },
};
