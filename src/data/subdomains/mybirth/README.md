# mybirth

> A cinematic snapshot of the moon, the weather, the music and the world on the day you were born — ending with a one-of-a-kind boarding pass into your future.

Type a name, a date and a country. **mybirth** recovers your day: the exact
phase of the moon (rendered as a real, procedurally-textured 3D moon lit at the
true phase angle), the historical weather overhead, the defining song and film
of the year, the headlines of the date, who was steering the country, and a
custom space-flight ticket stamped just for you.

## Run it

```bash
npm install
npm run dev      # → http://localhost:5173
```

```bash
npm run build    # static bundle in ../../../../dist/subdomains/mybirth
npm run preview  # serve the built bundle
```

> Requires the repo Node version from `../../../../.nvmrc` for production builds.

## How the data is sourced

Honesty matters here — not everything is a live per-day lookup:

| Section | Source | Real per-day? |
|---|---|---|
| **Moon phase** | Computed locally from orbital mechanics (synodic month from a known new moon) | ✅ Accurate to the day |
| **Weather** | [Open-Meteo](https://open-meteo.com) ERA5 archive (from 1940), geocoded from your birthplace | ✅ Measured, live |
| **Headlines & "shares a birthday with"** | [Wikipedia](https://www.wikipedia.org) *On this day* REST feed | ✅ Live, by date |
| **Star sign, Chinese zodiac, birthstone, flower, weekday, lunar cycles lived** | Computed locally | ✅ Exact |
| **Top film / defining song** | Curated, hand-compiled dataset *by year* | 🟡 By year, labelled "from our archive" |
| **Head of government** | Curated dataset of ~16 major countries *by year* | 🟡 By year, labelled "from our archive" |

Every live call **fails soft**: if a feed is unreachable or a date/place isn't
covered, that section degrades gracefully instead of breaking the page. Curated
sections that don't reach a given year say so plainly.

No API keys, no account, no tracking.

## Project layout

Four folders, and the rule that keeps them apart is where a number comes
from: `sky/` computes, `facts/` looks up, `scene/` draws in 3D, `ui/`
returns HTML. `main.js` is the only file that is allowed to import from
more than one of them.

```
index.html          # markup + fonts + backdrop layers
src/
  main.js           # orchestration: form, fetches, rendering, animations, starfield
  style.css         # the whole visual system
  analytics.js      # a provider registry; inert until one is configured

  sky/              # deterministic, no network, checkable against an ephemeris
    astro.js        #   moon phase, zodiac, sectors, planet longitudes, returns
    reading.js      #   the daily reading: aspects in, cards out
    starfigures.js  #   the twelve constellations at real catalogue positions
    contents/       #   the written bank the readings are assembled from

  facts/            # everything looked up rather than derived
    provenance.js   #   the wrapper that makes a number carry its source
    data.js         #   curated films, songs, leaders, world population
    apis.js         #   Open-Meteo + Wikipedia, every call fail-soft
    places.js       #   countries and regions, loaded on first keystroke
    cosmos.js       #   gem colours and the stylised zodiac patterns

  scene/            # three.js
    viewer.js       #   one loader, one rAF loop, one lighting rig
    models.js       #   the four almanac objects
    moon.js         #   the phase-lit moon
    voxel.js        #   the voxel builder behind the almanac objects

  ui/               # surfaces: each export returns HTML
    today.js        #   the Daily Sky
    certificate.js  #   the flippable certificate of birth
    ticket.js       #   the boarding-pass finale
    fete.js         #   what the page does on the day itself
    glyphs.js       #   the zodiac and planet marks, as SVG

tests/              # vitest, run by the root suite (see the note below)
tools/              # offline generators and the two copy linters
```

### Tests

They live in `tests/` beside the code they cover, but they are run by the
**root** suite — `npm test` from the repository root — because this app
has no vitest of its own, and adding one would mean a second copy of the
runner for six files. The root `vite.config.ts` says the same thing next
to the `test.exclude` line that lets them through.

## Notes & ideas

- The moon is **draggable** (OrbitControls) and slowly auto-rotates.
- "Save / print ticket" uses the browser's print dialog (print-to-PDF works well).
- Curated datasets cover ~1940–2025 and 16 countries. Extending them is just
  editing `src/facts/data.js`.
- To wire up real per-day movie/song charts later, swap the curated lookups in
  `main.js` for an API call in `apis.js` (e.g. TMDB) — the render code already
  handles a missing result.
