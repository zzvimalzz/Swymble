# Labs Data

`SWYMBLE_LABS` drives the `/labs` page (desktop and mobile). Each lab lives in its own file,
named after its `id` (e.g. `cortex.ts`, `mybirth.ts`), exporting a single `SwymbleLab` as its
default export. `index.ts` discovers every file in this folder automatically (via
`import.meta.glob`) and aggregates them, sorted by `order` — you never need to edit it.

Every lab also gets its own page at `/labs/<id>`, built from the same file. That page is what a
search engine ranks for the lab's name and what an AI assistant cites when asked what the lab is,
so it is worth filling in the optional `detail` block rather than leaving the page to restate the
card. It is picked up automatically by the sitemap, the prerenderer and `llms.txt` — see
`scripts/lib/lab-data.mjs`.

## Adding a lab
Copy an existing file (e.g. `territory.ts`), rename it to the new lab's id (e.g. `newlab.ts`),
and fill in the data. That's it — no other file needs to change.

## Template
```ts
// src/data/labs/lab-id.ts
import type { SwymbleLab } from '../types';
import { createSubdomainUrl } from '../../utils/siteUrls';

const lab: SwymbleLab = {
  id: 'lab-id',
  title: 'LAB NAME',
  seoName: 'Lab Name',                 // normally-cased name for titles/structured data
  category: 'CATEGORY LABEL',
  categoryColor: '#efff04',            // optional accent
  image: '/images/lab-logo.png',
  status: 'In Development',            // 'In Development' | 'Private Beta' | 'Live' | 'Archived'
  visibility: 'teaser',                // see below
  publicSummary: 'Public-safe summary.',
  safeHighlights: ['Highlight one', 'Highlight two'],
  tags: ['TagA', 'TagB'],
  updatedAt: 'May 2026',
  order: 60,                           // display order on /labs, ascending — see below
  blogCategoryId: 'lab-folder',        // optional; READ BLOG → /blog?category=<id>
  blogLink: '/blog/lab-post',          // optional; direct fallback if no category id
  actions: [
    { label: 'Visit Website', href: createSubdomainUrl('territory'), kind: 'external' },
    { label: 'Request Access', href: 'mailto:hello@swymble.com?subject=Lab%20Access', kind: 'mailto', variant: 'secondary' },
  ],

  // Optional — powers the lab's own page at /labs/lab-id. Omit it and the page still exists,
  // built from the fields above; fill it in and the page has something to rank for.
  detail: {
    oneLiner: 'Lab Name is a … .',     // ≤160 chars, self-contained, names the lab
    tagline: 'What It Is',             // 3-5 words, goes in the <title> after the name
    overview: ['Paragraph one.', 'Paragraph two.'],
    features: [{ title: 'Capability', body: 'One or two sentences.' }],
    specs: [{ label: 'Status', value: 'In development' }],
    faq: [{ question: 'What is Lab Name?', answer: 'A complete answer that stands alone.' }],
  },
};

export default lab;
```

## Field notes
- `id` must match the filename (minus `.ts`) and must be unique — it doubles as the React key,
  the `blogCategoryId` lookup target, and the lab's public URL at `/labs/<id>`. Renaming it
  changes that URL, so treat it as permanent once the page has been indexed.
- `seoName`: the lab's name in normal casing. `title` is upper case for the card grid's type
  treatment; a page title, a structured-data `name` or an assistant's answer should not shout.
  Defaults to `title` when omitted.
- `detail.oneLiner`: doubles as the page's meta description, so keep it under 160 characters and
  make it a complete sentence that names the lab — it is what gets quoted out of context.
- `detail.faq`: rendered on the page *and* emitted as `FAQPage` structured data. Write answers
  that make sense without the surrounding page.
- `order`: controls display order on `/labs`, ascending. Leave gaps of 10 (10, 20, 30, …) between
  existing labs so a new one can be slotted in without renumbering everything else.
- `visibility`: `'public'` fully visible · `'teaser'` visible with limited detail ·
  `'private'` hidden from the public page.
- `actions[].kind`: `'internal'` (route path) · `'external'` (full URL, new tab) · `'mailto'`.
- For a lab on a swymble.com subdomain use `createSubdomainUrl('<name>')`; for a lab on its own
  domain (like Watch Paint Dry) use the full canonical URL as a plain string.
- Keep copy public-safe — no private architecture or secrets, even for teaser entries.

## Removing a lab
Delete its file. `index.ts` picks up the change automatically.
