# oglets

> An **Oglet** is a small creature made mostly of eyes, drawn from a weighted genome.
> You get one, it lives in your browser, and it watches you.

Lives at `https://oglets.swymble.com/`. Grown from the prototype at
`.docs/pets/swymble-pets.html`; the plan for where it goes next is
`.docs/Oglets-Plan/`.

## Shape of it

A **plain subdomain**: no `package.json`, no build step of its own. The root
build copies this folder verbatim to `dist/subdomains/oglets/`
(`copySubdomainSitesToDist()` in `vite.config.ts` skips only folders carrying a
`package.json`, and leaves `tests/` behind). Zero dependencies, zero network
calls.

Two files:

- `genome.js` — the pure layer. Gene tables, `encode`/`decode`, the name bank,
  the storage shape. No DOM, so the repo's vitest suite covers it
  (`tests/genome.test.js`, run by `npm test` at the root). It is loaded as a
  plain ES module, which needs no build — but it does mean the page must be
  served over HTTP, not opened over `file://`.
- `index.html` — markup, CSS, and everything that draws or moves.

## Run it

```bash
npm run dev:main          # from the repo root
```

Then open <http://oglets.localhost:5173/>. The dev server resolves the hostname
label to this folder; no config change is needed.

```bash
npm run build             # writes dist/subdomains/oglets/
npm run preview           # then http://localhost:4173/subdomains/oglets/
```

## Inside it

| Piece | What it does |
| --- | --- |
| `GENES` | The four categorical genes — shape, pupil, palette, finish — and their weights. Weights are the *only* source of rarity. |
| `encode` / `decode` | Nine characters, both ways. The code is what gets stored and what the Genome tab prints, so the two can never disagree. |
| `Body` | Genome + expression + gaze + blink. Draws an Oglet and knows nothing about the world, so the catalogue thumbnails reuse it. |
| `Oglet` | One inhabitant: drives, sleep phases, solo behaviour, social states (`approach` → `engage` → `play`), drag and poke. |
| Genome tab | Built lazily on first open; thumbnails idle at 30fps and skip anything off-screen. |

Two rules worth keeping:

1. **The expression system is lid geometry.** The upper lid's inner and outer
   heights move independently, and the gap between those two numbers *is* the
   emotion. Nothing is a sprite swap.
2. **No expression is ever picked at random.** Every one is caused by a drive —
   `bond`, `cheer`, `ignored`, `annoy`, `lonely` — and sadness in particular only
   comes from being ignored while you are on the page. An Oglet by itself is
   content by itself.

## Yours

One Oglet, rolled on first visit, stored under `oglets:v1` as its code alone.
An unreadable or outdated code hatches a new one rather than throwing. There is
deliberately no reroll button: being able to replace it on a whim is what would
stop it mattering.

## Deploying

`cloudflare/oglets-subdomain-worker.js` maps `oglets.swymble.com` onto
`/subdomains/oglets/` on the swymble.com origin. Steps in its header and in
`cloudflare/oglets-subdomain-worker.wrangler.toml`.
