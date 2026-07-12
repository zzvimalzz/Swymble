# Labs Data

`labs.ts` drives the `/labs` page (desktop and mobile).

## Template
```ts
import { createSubdomainUrl } from '../../utils/siteUrls';

export const SWYMBLE_LABS = [
  {
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
    blogCategoryId: 'lab-folder',        // optional; READ BLOG → /blog?category=<id>
    blogLink: '/blog/lab-post',          // optional; direct fallback if no category id
    actions: [
      { label: 'Visit Website', href: createSubdomainUrl('territory'), kind: 'external' },
      { label: 'Request Access', href: 'mailto:hello@swymble.com?subject=Lab%20Access', kind: 'mailto', variant: 'secondary' },
    ],
  },
];
```

## Field notes
- `visibility`: `'public'` fully visible · `'teaser'` visible with limited detail ·
  `'private'` hidden from the public page.
- `actions[].kind`: `'internal'` (route path) · `'external'` (full URL, new tab) · `'mailto'`.
- For a lab on a swymble.com subdomain use `createSubdomainUrl('<name>')`; for a lab on its own
  domain (like Watch Paint Dry) use the full canonical URL as a plain string.
- Keep copy public-safe — no private architecture or secrets, even for teaser entries.
