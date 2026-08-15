# swyms

> A small world of one-eyed creatures — **Swyms** — each drawn from a weighted genome.

Lives at `https://swyms.swymble.com/`. Source of the original prototype:
`.docs/pets/swymble-pets.html` (kept as-is apart from the naming and the
`<head>` metadata).

## Shape of it

This is a **plain subdomain**: no `package.json`, no build step of its own. The
root build copies this folder verbatim to `dist/subdomains/swyms/`
(`copySubdomainSitesToDist()` in `vite.config.ts` skips only folders that carry a
`package.json`). Everything — markup, CSS and the whole simulation — is inside
`index.html`, single file, zero dependencies, zero network calls.

## Run it

```bash
npm run dev:main          # from the repo root
```

Then open <http://swyms.localhost:5173/>. The dev server resolves the hostname
label to this folder; no config change is needed.

```bash
npm run build             # writes dist/subdomains/swyms/
npm run preview
```

## Inside index.html

| Piece | What it does |
| --- | --- |
| `GENES` | The four categorical genes — shape, pupil, palette, finish — with their weights. Weights are the *only* source of rarity. |
| `Body` | Genome + expression + gaze + blink. Draws a Swym and knows nothing about the world, so the catalogue thumbnails reuse it. |
| `Swym` | One inhabitant: drives, sleep phases, social states (`approach` → `engage` → `play`), drag and poke. |
| `separate()` | Positional relaxation so two Swyms never overlap. |
| Genome tab | Built lazily on first open; thumbnails idle at 30fps and skip anything off-screen. |

The expression system is the lid geometry: the upper lid's inner and outer
heights move independently, and the gap between those two numbers *is* the
emotion.

## Deploying

The Worker that maps `swyms.swymble.com` onto `/subdomains/swyms/` on the
swymble.com origin is `cloudflare/swyms-subdomain-worker.js` — steps in its
header and in `cloudflare/swyms-subdomain-worker.wrangler.toml`.
