import type { Metadata } from "next";

import { MapHarness } from "./map-harness";

/**
 * Engine verification harness — not a product page. Exercises the mapping
 * engine end-to-end (boundaries, hover, selection, level switching, camera)
 * so regressions surface in e2e before any module ships on it. Excluded from
 * the route registry, the sitemap, and search indexing.
 */
export const metadata: Metadata = {
  title: "Map engine harness",
  robots: { index: false, follow: false },
};

export default function DevMapPage() {
  return <MapHarness />;
}
