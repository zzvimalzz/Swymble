# merged_easteregg — the specimens

What two labs become when someone forces their bubbles together on `/labs`.

This is an easter egg. Nothing in here is a product: it is never linked, never listed, never in
the sitemap or `llms.txt`, and it is not in the prerendered HTML. A specimen only exists once
somebody has made one with their own hands.

## How it is reached

On desktop `/labs`, drag one bubble against a barrier it cannot escape — the nav, a heading, the
edge of the stage — and press another into it. Hold about two fifths of a second at a fifth of the
bubbles' width of overlap and they merge. The card stays until it is closed; closing it is what
pulls the two labs apart again.

The mechanics live in `src/components/desktop/Labs/`: `bubbleFusion.ts` decides when a squeeze
gives, `fusionLore.ts` looks the pair up here, and `BubbleField.tsx` owns the frame loop.

## One file per pair

Named `<a>-<b>.ts` after the two lab ids **in the order `/labs` lists them** — newest first, which
is the order in `data/labs/index.ts`. `index.ts` globs this folder, so a new file is picked up with
no registration. The lookup key comes from the file's own `pair` field, not its name: rename a file
without updating its contents and it stops matching rather than describing the wrong two labs.

Seven labs make 21 pairs and all 21 are written. Add a lab and you owe seven more — until then the
generator in `fusionLore.ts` covers the gap by mashing the two labs' real copy together, so a new
lab can never produce a blank card.

```ts
import type { SwymbleMergedLab } from '../../types';

const merged: SwymbleMergedLab = {
  pair: ['oglets', 'cortex'],
  name: 'BRAINOGLE',
  category: 'COGNITIVE OPTICS',
  tagline: 'A proprietary cognitive platform that grew the eyes it needed and then a few more.',
  highlights: [
    'Long-context memory of everything it has looked at, which is everything',
    'Forty-six thousand reachable expressions, all of them attentive',
  ],
  tag: 'TOO MANY EYES',
  image: '/images/labs/merged_easteregg/oglets-cortex.svg',
};

export default merged;
```

| Field | What it is |
| --- | --- |
| `pair` | The two lab ids, in page order. The lookup key. |
| `name` | What it calls itself. Case is yours — `WALLEYE` and `OogleMap: Oglets Territory` both work. A name, not a slash-pair: never `MYDOMPET × OGLETS`. One line, up to 40 characters. |
| `category` | Something that sounds like a real category and is not: `SURVEILLANCE FINANCE`. |
| `tagline` | One sentence selling something that should not exist. |
| `highlights` | Claims, in the voice of a real feature list. One to six — the card grows to fit. |
| `tag` | The chip where a lab card carries its status. `LEAKING`, `DO NOT INHALE`. Optional — `UNSTABLE` when left out. Caps, up to 40 characters; a long one wraps onto its own line. |
| `image` | The mark, `/images/labs/merged_easteregg/<a>-<b>.<ext>` — SVG, PNG, WebP or AVIF. The *name* is fixed by the pairing; the format is not. |

## Writing one

**It is an app somebody installed.** That is the single thing that makes these work. Not a concept,
not a phenomenon — a product with a subscription, a customer support line, a leaderboard and a
settings screen somebody removed. Write about the thing on their phone.

It keeps a completely straight face, it talks to the reader directly, and it escalates: the tagline
sells the mechanic, the first highlight is almost reasonable, and by the last one the product is a
threat.

- **Name it like a real product**, with a cultural hook. A pun on one people already use
  (`Netflux`, `OogleMap`, `IMDb: You`, `Skip Intro`), something mythological or loaded
  (`Ouroboros`, `Argus`, `Malakims`, `Manifest Destiny`), or a plain phrase said with a straight
  face (`Squatter's Rights`, `Monopoly IRL`). A version suffix is free comedy — `Birthright Plus+`,
  `Rear Window 18+`. Never a portmanteau of the two lab names: that is what the generator does for
  a pairing nobody has written yet.
- **Give the reader instructions and warnings**, not descriptions. "Do not answer the door."
  "Careful whatever you do, because it is watching." "Try not to change in front of it." Second
  person, imperative, and faintly too late.
- **Turn the real product against itself.** "Can't be used to find your way, but can be used to
  find you." Lift actual promises out of `safeHighlights` and `publicSummary` and point them the
  wrong way.
- **The long list is the joke.** `Side effects include:` and then a comma list that starts
  plausible and ends somewhere it should not. Not on every card, or it stops landing.
- **Close on customer service.** `Please call customer support if…`, `PSA:…`, `Seek help from…` —
  a support line for a catastrophe, offered sincerely.

Keep it public-safe, like everything in `data/` — no private architecture, no client names. And
never add an action, a link or a route: it is not a page and must never become one.

## What is checked, and what is not

`merged.test.ts` holds three tests, and they are all about mistakes that fail **silently**: a
pairing nobody has written, a pair listed in the wrong order (the lookup key is built in page
order, so a reversed pair is never found and the reader quietly gets generated copy), and a mark
that is not on disk.

Everything above about voice, names, length and tone is guidance. **None of it is asserted, and it
should stay that way** — an earlier version of that file required upper-case names, exactly two
highlights and a short tag, and each of those went red on writing that was perfectly good.

## The mark

`public/images/labs/merged_easteregg/<a>-<b>.svg`, a 120×120 viewBox with a transparent ground.

Each is one lab's shape with the other grafted into it, and the graft is meant to look wrong: a
wallet with an eye pushing through the slot, a brain melting into drips, a map pin with an eyeball
for a head. Colours come from the two parents' `categoryColor`, so a specimen is visibly made of
those two labs before anyone reads a word.

Marks may be drawn by hand or rendered from the two real logos — see PROMPT.md for the generator
prompt and the per-pair briefs. Whatever the source, keep the file name and update `image` to match
the extension; `merged.test.ts` checks that the mark is there and that `image` agrees with it.

Watch the weight. A rendered mark embedded as base64 inside an SVG wrapper runs to about 1.2MB for
something drawn at 104px on the card; exporting the raster directly as PNG or WebP is several times
smaller and decodes faster. Only one is ever loaded at a time — the `<img>` mounts when a specimen
is made — so this is a courtesy rather than a page-weight emergency.
