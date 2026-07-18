import type { MetadataRoute } from "next";

// Required for the static-export build mode (swymble subdomain embed).
export const dynamic = "force-static";

import { site } from "@/config/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: site.name,
    short_name: site.name,
    description: site.description,
    start_url: "/",
    display: "standalone",
    background_color: "#14161d",
    theme_color: "#14161d",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
