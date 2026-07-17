import type { DatasetManifest } from "@/types/dataset";

import { boundariesDistricts, boundariesStates } from "./boundaries";
import { fuelPrice } from "./fuel-price";
import { gdpDistrict } from "./gdp-district";
import { householdIncomeDistrict } from "./household-income-district";
import { populationDistrict } from "./population-district";
import { transitNetworkManifests } from "./transit-networks";

/**
 * Every dataset manifest, in one list. The ETL pipeline iterates this to
 * know what to ingest; the app's registry (src/services/dataset-registry)
 * reads it to serve metadata. Add a dataset by adding its manifest file and
 * listing it here — nothing else to keep in sync.
 */
export const DATASET_MANIFESTS: DatasetManifest[] = [
  populationDistrict,
  gdpDistrict,
  householdIncomeDistrict,
  fuelPrice,
  boundariesStates,
  boundariesDistricts,
  ...transitNetworkManifests,
];
