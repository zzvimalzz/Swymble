# MalaysiaHub — Strategy & MVP Plan

**Status:** Draft for approval · July 2026
**Supersedes:** the "MyMalaysia" product framing (map-first Atlas). The
codebase, design system, ETL, and hosting survive; the *product* does not.

MalaysiaHub is the daily operating system for living in Malaysia — one place
to check fuel prices, convert ringgit, estimate your salary and tax, plan a
trip, and find the government service you need, instead of ten separate
portals. It replaces MyMalaysia at **malaysiahub.swymble.com**.

This is the tight, decision-grade plan the founder approved in place of a
nine-document set. It records what we keep, what we rebuild, the MVP scope,
and why the architecture stays static-first.

---

## 1. Audit — what exists today

MyMalaysia is a **production** Next.js 16 + React 19 app, not a prototype:

- **Identity (ADR-0004):** "the map is the application." One persistent
  MapLibre workspace at `/map`; datasets are layers; Explorer/Live/Economy/
  Population are lenses. Routes today: `/map`, `/live`, `/transit`,
  `/population`, `/economy`, `/data/[id]`.
- **Architecture (ADR-0001, Accepted):** static-first. GitHub Actions ETL →
  versioned JSON/Parquet/PMTiles on Cloudflare R2 → edge cache. Live feeds
  (fuel via BUDI95, FX, weather, GTFS transit) proxied through thin Workers.
  **No database, no auth, no server API.**
- **Real depth:** ETL pipelines (`etl/` — parquet, GTFS-Realtime, geo
  boundaries), Storybook + a11y, Playwright e2e, Vitest, husky/lint-staged,
  OpenNext → Cloudflare Workers deploy.
- **Design system (`docs/design-system.md`):** token-driven, Bricolage
  Grotesque / Instrument Sans / IBM Plex Mono, blue=interface /
  gold=editorial, WCAG-AA both themes, reduced-motion contract. Genuinely
  strong — the single biggest asset we carry forward.
- **Clean seams:** single route registry (`src/config/navigation.ts`),
  identity in `src/config/site.ts`, feature-first `src/features/*`, a working
  command palette (`command-palette.tsx`) — reusable as global search.

### Verdict per asset

| Asset | Decision | Why |
|---|---|---|
| Design system, tokens, fonts, motion | **Keep as-is** | Best-in-class; the visual bar the brief demands already exists |
| App shell (layout, header, footer, providers, theming) | **Keep, re-skin** | Sound; needs new nav + wordmark |
| Route registry pattern (`navigation.ts`) | **Keep, repopulate** | Right pattern; new routes |
| Command palette | **Keep → become global search** | Already the MVP's search primitive |
| ETL + R2 + live-feed Workers (fuel, FX, weather, transit) | **Keep** | Static-first-compatible; powers Home widgets directly |
| The map / Atlas (`/map`, `features/atlas`, `features/live`, layer registry) | **Demote to one "Explore" pillar** | Too valuable to delete; no longer the product. *Opt-out available if founder wants it fully cut.* |
| Home page (`features/home` — Mission/Philosophy/Roadmap/etc.) | **Rebuild** | Editorial marketing page → personalized daily dashboard |
| `site.ts` identity, README, ADR framing, wordmark, OG | **Rewrite** | Rebrand to MalaysiaHub |
| Standalone-page modules `/economy`, `/population` | **Fold into Explore** | Become map lenses / Data section, not top-level nav |

Nothing is kept "because it exists" — each line above has a reason.

---

## 2. Migration: MyMalaysia → MalaysiaHub

Net effect: same repo and infra, new product on top.

1. **Rebrand identity** — `site.ts`, wordmark, metadata/OG, README, `env`
   default URL → `malaysiahub.swymble.com`. Add the new subdomain worker +
   DNS (mirrors the mymalaysia worker; retire the old route or 301 it).
2. **New IA** — repopulate `navigation.ts` with the pillars in §4.
3. **New Home** — replace `features/home` with the daily dashboard.
4. **Demote the map** — `/map` and its lenses move under an **Explore**
   pillar; `/economy` + `/population` stop being top-level.
5. **Add the daily-OS features** — Finance, Government, Transport, Search,
   local-first accounts (§4).
6. **Cleanup** (§8) — delete dead marketing sections, stale copy, unused
   assets, and rewrite the ADRs to reflect the new product.

Because it's a **git subtree**, all of this happens in the standalone
`../mymalaysia` repo (renamed) and syncs into swymble via
`git subtree pull`. We do **not** hand-edit divergent copies.

---

## 3. Users (tight)

Four personas carry the MVP; the rest are post-MVP.

- **The working professional (primary).** Wants: payday math (salary→net,
  EPF, PCB tax), fuel before the commute, ringgit vs. USD/SGD. Returns
  daily for the dashboard; would pay for saved scenarios + alerts.
- **The planner / parent.** Wants: loan & savings math, public-holiday
  countdown for trips, "how do I renew road tax / passport." Returns weekly;
  pays for household planning tools.
- **The newcomer (expat / fresh grad).** Wants: the government directory —
  what a service is, documents needed, official link, time/cost. Returns
  during onboarding to Malaysian life; converts via depth of guidance.
- **The commuter.** Wants: fuel, transit status, toll cost. Returns daily;
  the live data is the hook.

Shared truth: they each currently open 3–6 tabs. MalaysiaHub is one.

---

## 4. Information architecture (MVP)

Six pillars in `navigation.ts`. Everything is a lens on official open data.

```
/                Home        Personalized daily dashboard (widgets)
/finance         Finance     Calculators: salary/EPF/PCB, loan, savings,
                             compound interest, currency converter
/government      Government  Directory: passport, licence, road tax, income
                             tax, EPF, SOCSO, business reg, healthcare
/transport       Transport   Fuel prices, transit status, toll calculator
/explore         Explore     The map/Atlas (demoted), + Population/Economy
                             data as lenses
  ⌘K             Search      Global command palette across all of the above
```

- **Home** aggregates: weather + AQI, fuel prices, FX, public-holiday
  countdown, transit status, quick-calculator launchers, featured government
  service, latest data updates. Authenticated (local) users reorder/toggle
  widgets; anonymous users get a sensible default.
- **Government** pages share one template: Overview · Requirements ·
  Documents · Estimated time & cost · Official links · Guidance. Content is
  static, versioned, source-attributed — no scraping of gated portals.
- **Explore** keeps the map's value without it being the whole product.

Why each exists: Home = the daily habit; Finance = the highest-frequency
utility; Government = the highest-value-when-needed utility; Transport = the
daily live hook; Explore = differentiation + reuse; Search = the glue.

---

## 5. MVP scope

**In (V1, must feel premium, all static-first):**

- Home dashboard with live widgets (fuel, FX, weather/AQI, holiday
  countdown, transit status) + quick-calculator launchers.
- Finance: salary→net + EPF + PCB estimator, loan calculator, savings /
  compound-interest calculator, currency converter (rates from the existing
  FX worker).
- Government directory: the 8 services above, shared template, real
  attributed content.
- Transport: fuel board (reuse existing), transit status (reuse), toll
  calculator.
- Global search (command palette) across pages, calculators, services.
- Local-first "accounts": bookmarks, saved calculations, recently viewed,
  dashboard layout — all in `localStorage`, no login. Export/import JSON.
- Explore: existing map, re-homed.

**Out (post-MVP / later waves):**

- Real auth, cross-device sync, server database → the wave that reverses
  ADR-0001 (§7).
- Monetization / paid tiers (§6) — designed now, built later.
- AI assistant — needs server compute; explicitly deferred with the DB wave.
- News aggregation — licensing/sourcing work; post-MVP.

The MVP is a **complete, polished daily utility** with zero standing cost.

---

## 6. Monetization (designed, not built in V1)

Free stays genuinely useful — never paywall a basic calculator or a fuel
price. Paid = automation, memory, and intelligence.

- **Free** — all calculators, directory, live data, local-only saves.
- **Plus** — cross-device sync, alerts (fuel drop, FX target, tax
  deadlines), unlimited saved scenarios, custom dashboards, no-friction
  export. *This is the first thing that requires the backend wave.*
- **Pro** — the AI assistant (ask across your data), scenario comparison,
  advanced planning (retirement projections), priority data freshness.
- **Enterprise (future)** — API access to the cleaned datasets, embeds.

Rule: everything a government portal gives free, MalaysiaHub gives free.

---

## 7. Architecture decision — static-first holds

We **keep ADR-0001** for the MVP. Every V1 feature fits it:

- Calculators are pure client-side TypeScript (deterministic math; unit
  tested). Malaysian rules (EPF %, PCB bands, SST) live in versioned config,
  not a DB.
- Directory content is static, versioned, source-attributed.
- Live data already comes from the existing edge Workers + R2.
- "Accounts" are `localStorage` (+ JSON export), so V1 has no PII, no auth
  surface, no standing cost.

**When ADR-0001 gets revisited:** the moment we build Plus (cross-device
sync + alerts) or Pro (AI). That is a deliberate later wave — edge database
(e.g. D1 / Turso) + an auth provider + Stripe — designed against the same
R2 data lake ADR-0001 already anticipates. Not in the MVP.

Everything else (feature-first folders, tokens, testing pyramid, OpenNext →
Cloudflare) is unchanged.

---

## 8. Cleanup (before + during MVP)

- Delete rebuilt/dead home sections (Mission, Philosophy, Roadmap,
  Technology marketing blocks) and any assets they alone reference.
- Rewrite `site.ts`, README, root metadata/OG, wordmark → MalaysiaHub.
- Rewrite ADRs: keep 0001 (static-first) + 0002 (MapLibre) + 0003
  (Cloudflare); replace 0004 (map-first) with a new ADR — "daily-OS product,
  map demoted to Explore pillar."
- Standardize: pillars own `src/features/{finance,government,transport}`;
  calculators as pure functions in `features/finance/lib` with tests.
- Keep files ≤400 LOC; update `docs/architecture.md` folder contract.

---

## 9. Roadmap — independently deployable milestones

Each milestone ships on its own and leaves the app coherent.

- **M0 — Rebrand & shell.** Identity, wordmark, metadata, nav registry,
  Explore re-home of the map. *Ships: MalaysiaHub-branded app, map intact.*
- **M1 — Finance.** Calculator engine + salary/EPF/PCB, loan, savings,
  currency. *Ships: the highest-frequency utility, fully tested.*
- **M2 — Home dashboard.** Widget grid over live feeds + calculator
  launchers; local dashboard layout. *Ships: the daily habit.*
- **M3 — Government directory.** Template + 8 services.
- **M4 — Transport.** Toll calculator; re-home fuel + transit.
- **M5 — Search & local accounts.** Command palette across everything;
  bookmarks / saved / recent / export.
- **M6 — Polish.** Awwwards-grade motion pass, a11y audit, SEO, Lighthouse,
  Playwright coverage.

Later waves (post-MVP): **W1** backend (auth + edge DB + sync + alerts,
launches Plus) · **W2** AI assistant (launches Pro).

**Build order this session:** M0 → M1 first (rebrand groundwork, then the
Finance vertical slice as the proof of the new product), reviewing at each
milestone.
