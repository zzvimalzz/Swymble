import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

// Two build modes:
//  - default: OpenNext → Cloudflare Workers (the canonical deployment)
//  - NEXT_OUTPUT=export: fully static export (out/), used when the app is
//    built as a swymble subdomain and served from GitHub Pages behind the
//    mymalaysia subdomain worker. Every current route is static, so both
//    modes ship identical pages.
const isStaticExport = process.env.NEXT_OUTPUT === "export";

const nextConfig: NextConfig = {
  ...(isStaticExport ? { output: "export" as const, trailingSlash: true } : {}),
  // Pin the workspace root: when this app runs as a swymble subtree, Next
  // would otherwise infer the swymble repo root from its lockfile and warn.
  turbopack: { root: process.cwd() },
  // Cloudflare Workers has no built-in Next.js image optimizer (and static
  // export forbids it). Site imagery is predominantly SVG/vector; revisit
  // with Cloudflare Images if raster photography ever becomes significant.
  images: { unoptimized: true },
};

export default nextConfig;

// Enables Cloudflare bindings (R2, KV, ...) inside `next dev`.
if (!isStaticExport) {
  initOpenNextCloudflareForDev();
}
