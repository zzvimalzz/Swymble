import type { MetadataRoute } from "next";

// Required for the static-export build mode (swymble subdomain embed).
export const dynamic = "force-static";

import { liveRoutes } from "@/config/navigation";
import { site } from "@/config/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return liveRoutes.map((route) => ({
    url: new URL(route.path, site.url).toString(),
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: route.path === "/" ? 1 : 0.8,
  }));
}
