# Labs Data

`SWYMBLE_LABS` drives the `/labs` page (desktop and mobile). Each lab lives in its own file,
named after its `id` (e.g. `cortex.ts`, `mybirth.ts`), exporting a single `SwymbleLab` as its
default export. `index.ts` discovers every file in this folder automatically (via
`import.meta.glob`) and aggregates them, sorted by `order` — you never need to edit it.

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
  category: 'CATEGORY LABEL',
  categoryColor: '#efff04',            // optional accent
  image: '/images/lab-logo.png',
  status: 'In Development',            // 'In Development' | 'Private Beta' | 'Live'
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
};

export default lab;
```

## Field notes
- `id` must match the filename (minus `.ts`) and must be unique — it also doubles as the React
  key and the `blogCategoryId` lookup target.
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
