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

```
index.html        # markup + fonts + backdrop layers
src/
  main.js         # orchestration: form, fetches, rendering, animations, starfield
  moon.js         # three.js moon — procedural lunar texture + phase-accurate lighting
  astro.js        # moon phase + zodiac/birthstone/flower/age (all deterministic)
  apis.js         # Open-Meteo geocoding + weather, Wikipedia on-this-day (fail-soft)
  data.js         # curated movies/songs by year + leaders by country + country list
  ticket.js       # the space boarding-pass finale
  style.css       # the whole visual system
```

## Notes & ideas

- The moon is **draggable** (OrbitControls) and slowly auto-rotates.
- "Save / print ticket" uses the browser's print dialog (print-to-PDF works well).
- Curated datasets cover ~1940–2025 and 16 countries. Extending them is just
  editing `src/data.js`.
- To wire up real per-day movie/song charts later, swap the curated lookups in
  `main.js` for an API call in `apis.js` (e.g. TMDB) — the render code already
  handles a missing result.
