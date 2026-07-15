/**
 * The datasets featured on the homepage — a hand-curated preview of what the
 * platform launches with. Superseded by the dataset registry (Milestone 7),
 * which becomes the single source of truth; this file then reads from it.
 */

export interface FeaturedDataset {
  name: string;
  detail: string;
  source: string;
  cadence: string;
}

export const FEATURED_DATASETS: FeaturedDataset[] = [
  {
    name: "Population by district",
    detail: "Every district by age group, sex, and ethnicity — census-grade, 2020 onwards.",
    source: "OpenDOSM",
    cadence: "annual",
  },
  {
    name: "GDP by district & sector",
    detail: "District-level output across the five main economic sectors.",
    source: "OpenDOSM",
    cadence: "annual",
  },
  {
    name: "Household income & inequality",
    detail: "Median income, poverty, and Gini by district from the HIES survey.",
    source: "OpenDOSM",
    cadence: "biennial",
  },
  {
    name: "Fuel prices",
    detail: "RON95, RON97, and diesel under the Automatic Pricing Mechanism.",
    source: "data.gov.my",
    cadence: "weekly",
  },
  {
    name: "Weather forecasts & warnings",
    detail: "MET Malaysia's 7-day forecasts and severe weather alerts, by town.",
    source: "data.gov.my",
    cadence: "hourly",
  },
  {
    name: "Live transit vehicles",
    detail: "Rapid KL, KTMB, and myBAS positions from the national GTFS feed.",
    source: "GTFS-Realtime",
    cadence: "30 s",
  },
  {
    name: "Exchange rates & OPR",
    detail: "Ringgit rates and the Overnight Policy Rate from the central bank.",
    source: "BNM OpenAPI",
    cadence: "daily",
  },
];
