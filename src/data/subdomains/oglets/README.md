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

Everything is native ES modules — no bundler, no transpile. That means the page
must be served over HTTP, never opened over `file://`, and that an import needs
its real `.js` extension.

```
index.html            the shell: nav bar, three views, nothing else
src/
  main.js             the entry — wires pages to the one animation loop
  core/               math, Spring, colour, the two canvas colours
  genome/             genes · tiers · roll · codec · names · hash  (pure, tested)
  state/              storage (pure, tested) · session (this browser's Oglet)
  emotions/           expressions · drives · face
  render/             eye geometry · Body
  behaviour/          oglet · attention · social · sleep · separate
  world/              stage · canvas · input · loop · world
  ui/                 router · home · genome-page · sheet · thumbs
  styles/             base · nav · home · world · genome
tests/                run by `npm test` at the repo root
```

The dividing line: **`genome/` and `state/storage.js` are pure and covered by
vitest; everything else draws, moves or touches the DOM.** This project has no
DOM test environment, so anything worth testing has to be extracted into a pure
function first.

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

## The four pages

Routing is by hash — `#/`, `#/world`, `#/genome` — on real `<a>`
links, so a page can be shared and read by a crawler.

| Page | What it is |
| --- | --- |
| **Home** | The landing, and the only page with no bar on it — a door does not need a menu. The name, and one button. The O of the wordmark is an eye that follows your cursor and blinks (`ui/home.js`, CSS transitions, no ticker); Enter opens the world out of the button itself (`ui/transition.js`). A first-time visitor starts here; a returning one goes straight to the world. |
| **World** | The live canvas. One Oglet, drag and poke, its own attention and moods. |
| **Genome** | Your Oglet at size — id, traits, rarity — then every mutation it could have drawn. Built the first time it is opened. Each card is a real render, in a circle, with one mutation changed; tap one to open it and read its lore. |

## Inside it

| Piece | What it does |
| --- | --- |
| `genome/genes.js` | The four categorical genes — shape, pupil, eye colour, pupil colour — their bands and lore. A mutation declares its tier; its weight is derived from the band. A gene carries at least two mutations of every tier. The interface calls these **mutations**; the data model keeps `allele`, because inheritance will need the word. |
| `genome/derive.js` | **An Oglet is a hash.** 128 CSPRNG bits, stored as its id, and `genomeOf(id)` redraws the exact creature forever. Every gene reads its own stream (`streamFor(id, gene)`), which is what lets a gene be added later without redrawing anybody — and what lets an Oglet age from the same id via an epoch. |
| `genome/tiers.js` / `rarity.js` | Seven tiers cut by occurrence, and an Oglet's own rarity scored one trait at a time rather than by multiplying odds. `.docs/Oglets-Plan/03-GENOME.md` has the tables. |
| `genome/codec.js` | The first release's nine-character code, both ways. Still read, because an Oglet from before ids existed keeps the face it has always had. |
| `render/body.js` | Genome + expression + gaze + blink. Draws an Oglet and knows nothing about the world, so the thumbnails and the landing portrait reuse it. |
| `behaviour/oglet.js` | One inhabitant: drives, sleep phases, solo behaviour, social states (`approach` → `engage` → `play`), drag and poke. |
| `world/stage.js` | The three shared mutables: `view`, `ptr`, `population`. Mutate in place, never reassign. |
| `world/loop.js` | One `requestAnimationFrame` for the whole site. Each view registers a ticker and decides whether the frame concerns it. |

Three rules worth keeping:

1. **The expression system is lid geometry.** The upper lid's inner and outer
   heights move independently, and the gap between those two numbers *is* the
   emotion. Nothing is a sprite swap.
2. **No expression is ever picked at random.** Every one is caused by a drive —
   `bond`, `cheer`, `ignored`, `annoy`, `lonely` — and sadness in particular only
   comes from being ignored while you are on the page. An Oglet by itself is
   content by itself.
3. **Rarity is never declared.** A tier is a *reading* of an allele's weight.
   Nothing in the roller consults `tiers.js`.
4. **Nothing on the site is smaller than 12px.** Type that has to be leaned into
   is not quiet, it is missing.

## Yours

One Oglet, hatched on first visit and stored under `oglets:v2` as its id alone —
no appearance is saved, because the id redraws it. An unreadable or outdated
record hatches a new one rather than throwing. There is deliberately no reroll
button: being able to replace it on a whim is what would stop it mattering.

## Deploying

`cloudflare/oglets-subdomain-worker.js` maps `oglets.swymble.com` onto
`/subdomains/oglets/` on the swymble.com origin. Steps in its header and in
`cloudflare/oglets-subdomain-worker.wrangler.toml`.
