import type { MetadataRoute } from "next";

// Required for the static-export build mode (swymble subdomain embed).
export const dynamic = "force-static";

import { DATASET_MANIFESTS } from "@datasets";
import { liveRoutes } from "@/config/navigation";
import { site } from "@/config/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = liveRoutes.map((route) => ({
    url: new URL(route.path, site.url).toString(),
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: route.path === "/" ? 1 : 0.8,
  }));
  const datasets = DATASET_MANIFESTS.map((manifest) => ({
    url: new URL(`/data/${manifest.id}`, site.url).toString(),
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));
  return [...pages, ...datasets];
}
