# Data Guide

## Directory map

Content files are grouped by the page (or site-wide concern) they feed. `config.ts` is still the
single aggregation point — everything below is assembled into `SWYMBLE_DATA` there, and all types
live in `types.ts`.

| Folder | Files | Feeds |
|---|---|---|
| `site/` | `branding.ts`, `socials.ts` | site-wide brand copy and social links |
| `home/` | `whatido.ts`, `latestupdates.ts`, `universe.ts` | home focus cards, latest updates, desktop 3D universe |
| `studio/` | `services.ts`, `process.ts` | "WORK WITH ME" services and engagement process |
| `projects/` | `projects.ts` | project cards |
| `about/` | `about.ts`, `techplanet.ts` | about copy and the tech planet stack strip |
| `labs/` | `labs.ts` | labs entries |
| `blog/` | `meta.ts`, `posts/` | blog categories and one file per post |
| `subdomains/` | one folder per subdomain site | static/app subdomain sources (see subdomains/README.md) |

`blog/` and `subdomains/` paths are load-bearing: `scripts/lib/route-data.mjs` regex-reads
`blog/posts/*.ts`, and `vite.config.ts` + `scripts/lib/subdomains.mjs` scan `subdomains/*` —
don't move those without updating the scripts.

## Branding
```ts
export const SWYMBLE_BRANDING = {
  name: 'SWYMBLE',
  tagline: 'Short brand statement.',
  marquee: 'PROJECTS - BLOG - LABS - STORY',
  endCardMobileImage: '/images/white-logo.png',
};
```

## About
```ts
export const SWYMBLE_ABOUT = {
  title: 'ABOUT ME',
  paragraphs: ['Paragraph one.', 'Paragraph two.', 'Paragraph three.'],
};
```

## What I Do
```ts
export const SWYMBLE_WHAT_I_DO = [
  {
    title: 'SOFTWARE ENGINEERING',
    colorHex: '#EFFF04',
    colorRgb: '239, 255, 4',
    desc: 'Short descriptive sentence.',
  },
];
```

## Projects
```ts
export const SWYMBLE_PROJECTS = [
  {
    title: 'Project Name',
    category: 'Category Label',
    categoryColor: '#ff9f43',
    client: 'Client Name',
    image: '/project-logo.png',
    landingImage: '/project-landing.png',
    mobileImage: '/project-mobile.png',
    description: 'Short public-facing summary.',
    link: 'https://example.com',
    blogLink: '/blog/project-name',
    status: 'Live',
  },
];
```

## Latest Updates
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

## Labs
```ts
export const SWYMBLE_LABS = [
  {
    id: 'lab-id',
    title: 'LAB NAME',
    category: 'CATEGORY LABEL',
    categoryColor: '#efff04',
    image: '/lab-logo.png',
    status: 'In Development',
    visibility: 'teaser',
    publicSummary: 'Public-safe summary.',
    safeHighlights: ['Highlight one', 'Highlight two'],
    tags: ['TagA', 'TagB'],
    updatedAt: 'May 2026',
    blogCategoryId: 'lab-folder',
    blogLink: '/blog/lab-post',
    actions: [
      { label: 'Visit Website', href: createSubdomainUrl('territory'), kind: 'external' },
      { label: 'Request Access', href: 'mailto:hello@swymble.com?subject=Lab%20Access', kind: 'mailto', variant: 'secondary' },
    ],
  },
];
```

## Socials
```ts
export const SWYMBLE_SOCIALS = [
  { id: 'gh', name: 'GITHUB', link: 'https://github.com/username', icon: Github },
];
```

## Tech Planet
```ts
export const SWYMBLE_TECH_PLANET = [
  {
    category: 'LANGUAGES',
    context: 'Core syntax, type systems, and everyday problem solving.',
    items: [{ name: 'TypeScript', color: '#3178C6', description: 'Typed frontend application code.' }],
  },
];
```

## Blog Meta
```ts
export const SWYMBLE_BLOG_META = {
  title: 'BLOG',
  description: 'Read through my thoughts...',
  emptyStateMsg: 'No posts yet.',
  categories: [
    {
      id: 'cortex',
      label: 'CORTEX',
      description: 'Folder description shown on hover/title.',
      categoryColor: '#00e5ff',
    },
  ],
};
```

## Blog Post
```ts
import type { SwymbleBlogPost } from '../../types';

const MY_POST: SwymbleBlogPost = {
  id: 'my-post',
  title: 'My Post',
  date: '2026-03-09',
  summary: 'Short summary shown in cards.',
  tags: ['AI', 'R&D'],
  categories: ['cortex'],
  coverImage: '/images/cortex_website.png',
  content: [
    { type: 'heading', text: 'Section Title', level: 2 },
    { type: 'paragraph', text: ['Line one.', 'Line two.'] },
    { type: 'question', text: 'What if memory worked this way?' },
    { type: 'list', style: 'bullet', items: ['Item A', 'Item B'], indent: 1 },
    { type: 'spacer', size: 'sm' },
    { type: 'quote', text: 'Memory is continuity.', cite: 'Internal notes' },
    { type: 'image', src: '/images/cortex_website.png', caption: 'System overview' },
    { type: 'code', language: 'typescript', code: 'console.log("hello");' },
  ],
};

export default MY_POST;
```

## Subdomains
Subdomains are not data-driven.

Create each subdomain as a full static site in:
```text
src/data/subdomains/<subdomain>/
```

See:
```text
src/data/subdomains/README.md
```