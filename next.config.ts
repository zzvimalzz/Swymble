import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const nextConfig: NextConfig = {
  // Cloudflare Workers has no built-in Next.js image optimizer. Site imagery
  // is predominantly SVG/vector; revisit with Cloudflare Images if raster
  // photography ever becomes significant.
  images: { unoptimized: true },
};

export default nextConfig;

// Enables Cloudflare bindings (R2, KV, ...) inside `next dev`.
initOpenNextCloudflareForDev();
