# Data Guide

All site content lives here as plain TypeScript objects. `config.ts` is the single aggregation
point — every file below is assembled into `SWYMBLE_DATA` there — and all types live in
`types.ts`. **Each folder has its own README** with copy-paste templates and editing notes.

## Directory map

| Folder | Files | Feeds | Guide |
|---|---|---|---|
| `home/` | `branding.ts`, `socials.ts`, `positioning.ts`, `latestupdates.ts`, `services.ts`, `process.ts`, `universe.ts` | homepage sections (branding and socials are also used site-wide in nav/footer) | [home/README.md](home/README.md) |
| `projects/` | `projects.ts` | project cards | [projects/README.md](projects/README.md) |
| `about/` | `about.ts`, `career/` | about copy and the interactive git-graph career repository | [about/README.md](about/README.md) |
| `labs/` | one file per lab, named after its id (e.g. `cortex.ts`), plus `index.ts` aggregator | labs entries | [labs/README.md](labs/README.md) |
| `blog/` | `meta.ts`, `posts/` | blog categories and one file per post | [blog/README.md](blog/README.md) |
| `subdomains/` | one folder per subdomain site | static/app subdomain sources | [subdomains/README.md](subdomains/README.md) |

## Rules that apply everywhere

- Add/remove/reorder entries by editing the arrays — the UI renders whatever is here, in order.
- Images are paths under `public/` (e.g. `/images/foo.png`).
- Internal links are route paths from `src/routes.ts` (e.g. `/labs`, `/blog/my-post`); external
  links are full URLs.
- `blog/` and `subdomains/` paths are load-bearing: `scripts/lib/route-data.mjs` regex-reads
  `blog/posts/*.ts`, and `vite.config.ts` + `scripts/lib/subdomains.mjs` scan `subdomains/*` —
  don't move those folders without updating the scripts.
- Keep copy public-safe (no private architecture, credentials, or client secrets).
