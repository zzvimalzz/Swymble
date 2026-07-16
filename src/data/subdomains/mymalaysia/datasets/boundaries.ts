import type { DatasetManifest } from "@/types/dataset";

export const boundariesStates: DatasetManifest = {
  id: "boundaries-states",
  title: "State boundaries",
  description:
    "Administrative boundaries of Malaysia's 16 states and federal territories, simplified for interactive mapping.",
  module: "explorer",
  tier: "C",
  cadence: "static",
  source: {
    provider: "Department of Statistics Malaysia",
    portal: "DOSM geodata",
    url: "https://github.com/dosm-malaysia/data-open",
    licence: "CC BY 4.0",
    licenceUrl: "https://creativecommons.org/licenses/by/4.0/",
  },
  upstream: {
    kind: "geojson",
    url: "https://raw.githubusercontent.com/dosm-malaysia/data-open/main/datasets/geodata/administrative_1_state.geojson",
  },
  artifact: {
    path: "data/boundaries/states.geojson",
    format: "geojson",
  },
};

export const boundariesDistricts: DatasetManifest = {
  id: "boundaries-districts",
  title: "District boundaries",
  description:
    "Administrative boundaries of Malaysia's 160 districts, simplified for interactive mapping, with nationally unique feature ids.",
  module: "explorer",
  tier: "C",
  cadence: "static",
  source: {
    provider: "Department of Statistics Malaysia",
    portal: "DOSM geodata",
    url: "https://github.com/dosm-malaysia/data-open",
    licence: "CC BY 4.0",
    licenceUrl: "https://creativecommons.org/licenses/by/4.0/",
  },
  upstream: {
    kind: "geojson",
    url: "https://raw.githubusercontent.com/dosm-malaysia/data-open/main/datasets/geodata/administrative_2_district.geojson",
  },
  artifact: {
    path: "data/boundaries/districts.geojson",
    format: "geojson",
  },
};
