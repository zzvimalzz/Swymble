# ADR-0003: Cloudflare Workers hosting via OpenNext (not Vercel)

**Status:** Accepted · Phase 1 review, July 2026

## Context

The swymble.com zone, existing subdomain Workers, and the planned R2 data
lake already live on Cloudflare. Vercel is the lower-friction Next.js host
but splits the platform across two vendors and meters bandwidth.

## Decision

Deploy the Next.js app to Cloudflare Workers with `@opennextjs/cloudflare`.
`malaysiahub.swymble.com` attaches as a Worker custom domain on the existing
zone. App, realtime proxy workers, object storage, and DNS live under one
account with no egress fees.

## Consequences

- Pages must be static/ISR (regenerated on the ETL cadence), which is also
  the performance-correct choice; per-request SSR is avoided by design.
- `next/image` optimization is unavailable on Workers — imagery is
  SVG/vector-first; revisit with Cloudflare Images if raster becomes
  significant.
- OpenNext tracks Next.js releases with a small lag; Next upgrades wait for
  OpenNext compatibility. Vercel remains the documented fallback if this
  friction ever outweighs consolidation.
