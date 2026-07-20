# Home Data

Everything the homepage renders, in page order. `branding.ts` and `socials.ts` also feed the
nav/footer on every page, but they're edited here since the homepage is where they're most
visible.

| File | Section |
|---|---|
| `branding.ts` | hero name/tagline, marquee text, contact intro |
| `socials.ts` | social links (footer + contact) |
| `positioning.ts` | homepage claim + shipped/lab/blog note counters |
| `latestupdates.ts` | latest update cards |
| `services.ts` | "WORK WITH ME" service cards |
| `process.ts` | "WORK WITH ME" 01–04 process steps |
| `universe.ts` | desktop 3D "SWYMBLE UNIVERSE" scene |

## branding.ts
```ts
export const SWYMBLE_BRANDING = {
  name: 'SWYMBLE',                       // nav/footer/hero brand text
  tagline: 'Short brand statement.',     // hero subtext
  marquee: 'PROJECTS - BLOG - LABS',     // moving headline band
  endCardMobileImage: '/images/white-logo.png', // end of mobile project swipe
  contactIntro: 'Line shown above the contact form.',
};
```

## socials.ts
Icons are Lucide components — import the icon at the top of the file.
```ts
import { Github } from 'lucide-react';

export const SWYMBLE_SOCIALS = [
  { id: 'gh', name: 'GITHUB', link: 'https://github.com/username', icon: Github },
];
```

## positioning.ts — claim + counters
Replaces the old homepage "PROJECTS" carousel. `statement[0]` renders as the headline; the rest
render as body paragraphs. `statementLink` (optional) turns its `label` into a link wherever that
exact substring appears in a statement paragraph. `stats[].value` should stay wired to
`.length` on the real data arrays (`projects.ts`/`labs/`/`blog/posts`) rather than a hand-typed
number, so the counters can never drift out of sync with the content.
```ts
export const SWYMBLE_POSITIONING = {
  statement: [
    'Headline sentence.',
    'Body paragraph, can mention a link label like watch paint dry.',
  ],
  statementLink: { label: 'watch paint dry', href: 'https://example.com' },
  stats: [
    { id: 'projects', label: 'SHIPPED & LIVE', value: SWYMBLE_PROJECTS.length },
    { id: 'labs', label: 'IN THE LAB', value: SWYMBLE_LABS.length },
    { id: 'notes', label: 'FIELD NOTES', value: SWYMBLE_BLOG_POSTS.length },
  ],
};
```

## latestupdates.ts
`ctaLabel`/`ctaHref` are optional — omit both for a card without a button.
```ts
export const SWYMBLE_LATEST_UPDATES = [
  {
    id: 'release-note',
    kicker: 'Latest update',
    title: 'Feature shipped',
    description: 'Short public-facing update copy.',
    ctaLabel: 'Read More',
    ctaHref: '/blog',
  },
];
```

## services.ts — "WORK WITH ME" cards
`colorHex`/`colorRgb` drive the card's hover glow; keep them the same color in both notations.
```ts
export const SWYMBLE_SERVICES = [
  {
    id: 'product-builds',
    title: 'PRODUCT BUILDS',
    colorHex: '#00F0FF',
    colorRgb: '0, 240, 255',
    desc: 'Short descriptive sentence.',
  },
];
```

## process.ts — engagement steps
`step` is the printed number label; keep it two digits. The desktop rail is designed for four
steps (it folds to 2×2 below 1500px), but any count renders.
```ts
export const SWYMBLE_PROCESS = [
  { id: 'discover', step: '01', title: 'DISCOVER', desc: 'What happens in this step.' },
];
```

## universe.ts — desktop 3D scene
Orbits are *kinds of work*; moons are *real shipped things*.
```ts
export const SWYMBLE_UNIVERSE = [
  {
    category: 'CLIENT WORK',                       // orbit label
    context: 'Copy shown when the orbit is focused.',
    proof: [{ label: 'IB Solutions', href: '/projects#ib-solutions' }], // "SEEN IN" links
    items: [
      {
        name: 'IB Solutions',                      // moon label
        color: '#ff9f43',                          // moon glow / orbit accent
        moonModelId: 'moon-01',                    // optional; moon-01 … moon-08
        proof: [{ label: 'Case study', href: '/projects#ib-solutions' }], // falls back to orbit proof
      },
    ],
  },
];
```
`proof[].href` is an internal route or a full external URL (detected by the `http` prefix).
