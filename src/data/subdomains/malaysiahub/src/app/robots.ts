import type { MetadataRoute } from "next";

// Required for the static-export build mode (swymble subdomain embed).
export const dynamic = "force-static";

import { site } from "@/config/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/" }],
    sitemap: new URL("/sitemap.xml", site.url).toString(),
  };
}
