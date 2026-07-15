import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// Default config: fully static pages served from Worker assets.
// If ISR is adopted (dataset pages regenerating on the ETL cadence), add
// `incrementalCache: r2IncrementalCache` here with an R2 binding — planned
// alongside Milestone 8 (ETL) if needed.
export default defineCloudflareConfig();
