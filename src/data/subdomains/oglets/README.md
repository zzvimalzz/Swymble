# oglets

> An **Oglet** is a small creature made mostly of eyes, drawn from a weighted genome.
> You get one, it lives in your browser, and it watches you.

Lives at `https://oglets.swymble.com/`. Grown from the prototype at
`.docs/pets/swymble-pets.html`; the plan for where it goes next is
`.docs/OGLETS.md`.

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
index.html            the shell: nav bar, the views, nothing else
src/
  main.js             the entry — wires pages to the one animation loop
  core/               math, Spring, colour, the canvas colours
  genome/             genes · tiers · roll · codec · names · hash · character  (pure, tested)
  state/              storage (pure, tested) · session (this browser's Oglet)
  emotions/           expressions · drives · face
  render/             eye geometry · Body · silhouette · soulless · decor · thoughts · tears · hearts
  behaviour/          oglet · attention · social · sleep · play · pet · beats · separate
  world/              stage · canvas · input · loop · motion · world
  ui/                 router · home · hatch · genome-page · gallery · sheet · thumbs
  *.dev.js/.css       benches — the Assets contact sheet and the Lab. Stripped from every build.
  styles/             base · nav · home · world · genome · gallery · hatch
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

## The pages

Routing is by hash on real `<a>` links, so a page can be shared and read by a
crawler.

| Page | What it is |
| --- | --- |
| **Home** | The landing, and the only page with no bar on it — a door does not need a menu. The name, and one button. The O of the wordmark is an eye that follows your cursor and blinks (`ui/home.js`, CSS transitions, no ticker); Enter opens the world out of the button itself (`ui/transition.js`). **Everybody starts here, every time.** A bare `oglets.swymble.com` is always the landing — it used to send a returning visitor straight to their Oglet, which meant the one link anybody is given opened onto a nameless canvas. `#/world` and the rest still open directly, so bookmarks and refreshes are unaffected. |
| **Hatch** | `#/hatch`, and only ever once. A first visit opens onto an **egg** whose shell is drawn from the tier of the creature already inside it, and which takes five minutes — tapping halves it, leaving does not restart it. See `.docs/OGLETS.md` §9. |
| **World** | The live canvas. One Oglet, drag it, poke it, stroke it, throw it and play catch. Its own attention, moods and sleep. |
| **Lab** | `#/lab`, **temporary**. A throwaway world with a picker for every gene and for Soulless, and buttons that fire the three beats by hand. The bench from `.docs/OGLETS.md` §2 that was built, used and deleted — back, and still on the temporary shelf beside Assets rather than in the product. |
| **Genome** | Your Oglet at size — id, traits, rarity — then every mutation it could have drawn. Built the first time it is opened. Each card is a real render, in a circle, with one mutation changed; tap one to open it and read its lore. |

## Inside it

| Piece | What it does |
| --- | --- |
| `genome/genes.js` | The five categorical genes — shape, pupil, eye colour, pupil colour, body — their bands and lore. A mutation declares its tier; its weight is derived from the band. A gene carries at least two mutations of every tier — except a sparse one, which is `body` and only `body`. The interface calls these **mutations**; the data model keeps `allele`, because inheritance will need the word. |
| `genome/genes.js` · `body` | **The sparse gene, and the only one.** An Oglet has no body — `bare` is 98.5% of every roll, and the four empty bands fall to it (`assignWeights`). **One body per rare tier**, because the band it sits in is the whole statement about it: Circle 1.2%, Cloud 0.299%, Wisp 0.001%. `bare` must stay at index 0: it is what `geneOf()` and every nine-character code predating the gene fall back to. |
| `render/silhouette.js` | Every closed outline as `r(θ)` at the same 64 angles, so any two correspond point for point and a morph is a `lerp`. Ported from bloub. `FORMS` is the shape catalogue and the `body` gene names one of them — two lists on purpose, which is how Pebble is a Soulless body without being a mutation. Bodies are matched on **width**, not their widest point. |
| `render/soulless.js` | **A theme, not a gene** — no allele, no weight, nothing in `GENES`. Drawn instead from its own stream on the id at **0.00001%, one in ten million**, in a tier of its own above God and out of its own black-and-white egg. White body, ink capsules, no pupil, so it expresses with **shape** rather than lids: `SOUL_FACES` is bloub's measured table in bloub's own units. |
| `render/decor.js` · `behaviour/beats.js` | Orbit, Burst and Comet. An arc is a 3D circle and **half of it is drawn before the creature**, so the creature occludes it. Every arc is scaled by the creature's own `frame` and its plane tilted until it clears — bloub runs its planes edge-on because its body collapses to a dot under every arc, and ours does not. **Nothing in an Oglet's logic plays one**: `#/assets` and `#/lab` are the only callers. |
| `genome/derive.js` | **An Oglet is a hash.** 128 CSPRNG bits, stored as its id, and `genomeOf(id)` redraws the exact creature forever. Every gene reads its own stream (`streamFor(id, gene)`), which is what lets a gene be added later without redrawing anybody — and what lets an Oglet age from the same id via an epoch. |
| `genome/tiers.js` / `rarity.js` | Seven tiers cut by occurrence, and an Oglet's own rarity scored one trait at a time rather than by multiplying odds. `.docs/OGLETS.md` §2 has the tables. |
| `genome/codec.js` | The first release's nine-character code, both ways. Still read, because an Oglet from before ids existed keeps the face it has always had. |
| `render/body.js` | Genome + expression + gaze + blink. Draws an Oglet and knows nothing about the world, so the thumbnails and the landing portrait reuse it. |
| `render/thoughts.js` / `tears.js` / `hearts.js` | The three channels a face does not have to share: question marks for `thinking`, blue drops for `crying`, rising hearts for `petted`. All seeded off the Oglet, so its thoughts, its tears and its fondness are its own. When a new emotion would have to fight the lids for room, it gets one of these instead. |
| `behaviour/oglet.js` | One inhabitant: drives, sleep phases, solo behaviour, social states (`approach` → `engage` → `play`), drag and poke. |
| `behaviour/play.js` | **Catch** — the one thing here you do rather than watch. Carry it, put it down, and it comes after your cursor; reach it and it pops and comes again. Ten catches wears it out and it goes to sleep. |
| `behaviour/pet.js` | **Stroking it.** A pet and a shake are the same gesture at different speeds — 25–380 px/s against 420+, and a fast passage wipes the stroke history. Two ways in, because a phone has no hover: swept across it free-handed, or stroked while held. **A stroke is a pass *across* it**, and both halves of that matter — the reversal may land anywhere, because a finger sweeps far wider than the creature, but it only counts if the hand has been over the creature since the last one. That is what makes it work on a touchscreen and what stops a cursor merely passing by from reading as affection. It buys the most bond of anything you can do. |
| `ui/gallery.js` | `#/gallery` — **every** one of the 186,592 categorical combinations, and then the three Soulless, which are not combinations at all and sit at the very end where the ordering rule already puts them, commonest first, numbered. Virtualised: ~36 pooled cards inside a spacer the height of the whole wall, re-pointed by `Thumb.retarget()`, keyed as a *ring* so one row of scrolling only re-points one row of cards. |
| `render/egg.js` | One glossy shell per tier, patterned from the creature's own seed, plus the crack progression and the shatter. **The egg tells you what is in it** — that is what makes a five-minute wait a tell rather than a loading bar. |
| `world/motion.js` | The phone as an input: tilt is gravity (and a little depth), a device shake is the same upset a hand shake is. Permission is asked from the first touch, because iOS will only ask inside a gesture. Absent everywhere else, and nothing downstream notices. |
| `world/stage.js` | The three shared mutables: `view`, `ptr`, `population`. Mutate in place, never reassign. |
| `core/dev.js` | **What exists only on a bench.** `#/assets` and `#/lab` are tools, not pages, and they are gated three ways at once: the build never copies a `*.dev.*` file, the router leaves their routes out, and `main.js` imports them dynamically so a stripped file is never requested. Their stylesheets are attached by the pages themselves, because a static `<link>` to a stripped file is a 404 on every production load. |
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
