# what2watch

*Lost in the algorithm? Get lost in this instead.*

A living wall of movies and shows, packed into a single screen as an interactive
force-directed voronoi diagram. Lives at `what2watch.swymble.com`.

This is a Swymble Labs remix built directly on top of
[nothing-to-watch](https://github.com/gnovotny/nothing-to-watch) (React 19,
Three.js/OGL, a custom multithreaded WebGL2 "voroforce" engine) — same engine,
own branding (gold/amber accent, new tagline, own copy in the About panel).

## Running

```bash
npm install
npm run dev        # http://localhost:5175
npm run build       # writes to ../../../../dist/subdomains/what2watch
npm run preview
```

No `.env.local` is required anymore — all env vars have code fallbacks
(`/media` for textures, `/json` for film info, 1 atlas layer per version).
`TMDB_API_KEY` in `.env.local` is only read by `scripts/fetch-tmdb-movies.mjs`
at data-refresh time; it is never bundled into the client.

## What's different from upstream

- Branding: title/meta/OG tags, intro headline, gold/amber accent color
  (`app/styles.css`), favicon, About panel copy (`app/cmps/views/about/about.tsx`)
- `app/config.ts`: contact email points to `hello@swymble.com`; source code link
  still credits the original upstream repo
- Landing: no preset/film-count picker — defaults to Minimal (Mobile on small
  screens) with 1,000 films, adjustable later in Settings. The overlay always
  waits for an explicit Enter click and shows a themed loading animation while
  media preloads; the engine intro animation is gated on that click too.
- Dynamic poster tiles: every cell's in-grid tile is streamed at runtime
  through the engine's "uncompressed-single" media version (v3), resolved per
  cell id to the TMDB image CDN (movies) or TVmaze CDN (shows) — see
  `getCellPosterUrl` in `app/vf/utils/films.ts` and
  `app/vf/integrations/media.ts`. The baked poster atlases in `public/media`
  remain only as an instant placeholder while posters stream in.
- Cell pool: filtered by the active type/genre filters, then deterministically
  shuffled (fixed seed) so movies AND TV shows mix within the 216 reachable
  cell ids. The filter panel's Apply re-streams the poster tiles in place -
  no page reload - keeping titles and tiles in sync. Preset/film-count
  changes still reload but re-enter behind the loader (no landing screen).
- Filter panel extras: mood quick-filters (curated genre bundles), a live
  match-count readout, and a "Find on the wall" title search that jumps to
  and selects the matching cell.
- Random pick: Space jumps to a random title matching the filters (same code
  path as "Surprise me"); a top-left logo button reveals the hotkey tip.
- Hover info is a static top-right panel (top strip on small screens), not a
  pointer-following float; a selected film's card stays put until another
  tile is explicitly selected.
- "Gold cinema" grade: the idle-wall duotone constants in
  `app/vf/config/display/main.frag` (and the chaos post shader) are tuned to
  warm amber/gold instead of upstream's neutral gray.
- Low FPS alert only appears when settings can actually be lowered (heavier
  preset than Minimal/Mobile or more than 1,000 films).
- Test suite (vitest/testing-library/playwright) was not carried over — this is
  a standalone visual remix, not a fork under active parallel development

## How it works

See the upstream project's README for the full technical breakdown of the
voroforce simulation, GPU voronoi rendering, and poster texture atlas system —
none of that changed here.
