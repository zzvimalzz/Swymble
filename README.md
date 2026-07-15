# MyMalaysia

**Explore Malaysia through open public data.** A Swymble product — live at [mymalaysia.swymble.com](https://mymalaysia.swymble.com).

MyMalaysia aggregates, visualises, and explains Malaysian public data through premium interactive experiences: an explorable map of every state and district, live national indicators, and deep statistical storytelling built on official open sources (data.gov.my, OpenDOSM, Bank Negara Malaysia).

## Stack

- **Framework** — Next.js (App Router) · React · TypeScript
- **UI** — Tailwind CSS v4 · shadcn/ui (Radix) · Framer Motion · Lucide
- **Mapping** — MapLibre GL · PMTiles · OpenStreetMap
- **Data platform** — static-first: GitHub Actions ETL → versioned datasets on Cloudflare R2
- **Hosting** — Cloudflare Workers via OpenNext
- **Quality** — ESLint · Prettier · Vitest · Playwright · Storybook · Husky + lint-staged

## Getting started

Requires Node 22 (`.nvmrc`).

```bash
npm ci
npm run dev            # dev server on http://localhost:3000
```

## Commands

| Command                  | Purpose                                                     |
| ------------------------ | ----------------------------------------------------------- |
| `npm run dev`            | Development server                                          |
| `npm run build`          | Production build (`next build`)                             |
| `npm run start`          | Serve the production build                                  |
| `npm run lint` / `:fix`  | ESLint                                                      |
| `npm run format`         | Prettier write (`format:check` in CI)                       |
| `npm run typecheck`      | TypeScript, no emit                                         |
| `npm test`               | Unit tests (Vitest, jsdom)                                  |
| `npm run test:storybook` | Renders every story headlessly + a11y checks                |
| `npm run e2e`            | Playwright end-to-end tests                                 |
| `npm run storybook`      | Storybook on http://localhost:6006                          |
| `npm run preview`        | Build + preview the Cloudflare Worker locally               |
| `npm run deploy`         | Build + deploy to Cloudflare Workers (needs wrangler login) |

## Architecture

The platform is **static-first**: almost all Malaysian public data changes monthly/quarterly/annually, so datasets are ingested, validated, and versioned by scheduled GitHub Actions, published to Cloudflare R2 as typed JSON/Parquet/PMTiles, and served through edge caching — no database until a feature genuinely needs one. Realtime feeds (weather, transit) proxy official public APIs.

- `docs/` — architecture and decision records
- `src/` — application source (see `docs/architecture.md` for the folder contract)
- `.github/workflows/ci.yml` — lint, format, typecheck, unit tests, build, e2e smoke
- `.github/workflows/deploy.yml` — OpenNext build → Cloudflare Workers (gated on the `ENABLE_CLOUDFLARE_DEPLOY` repo variable; see file header for setup)

## Deployment

Pushes to `main` deploy to Cloudflare Workers once the repo has `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID` secrets and `ENABLE_CLOUDFLARE_DEPLOY=true`. The custom domain `mymalaysia.swymble.com` is attached via the `routes` block in `wrangler.jsonc`.

## Data licensing

Statistical data © Department of Statistics Malaysia and originating agencies, used under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Every dataset surfaced in the product carries source attribution, licence, and last-updated metadata by design.
