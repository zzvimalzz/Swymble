# Blog Data

| File | Content |
|---|---|
| `meta.ts` | blog page copy + category folders |
| `posts/` | one file per post, re-exported through `posts/index.ts` |

**Heads-up:** `scripts/lib/route-data.mjs` regex-reads post metadata (`id`, `title`, `summary`,
`date`, `coverImage`) straight from `posts/*.ts` for the sitemap and prerendering — keep those
fields as plain string literals above the `content:` array.

## meta.ts
```ts
export const SWYMBLE_BLOG_META = {
  title: 'BLOG',
  description: 'Read through my thoughts...',
  emptyStateMsg: 'No posts yet.',
  categories: [
    {
      id: 'cortex',                       // referenced by posts' `categories`
      label: 'CORTEX',
      description: 'Folder description shown on hover/title.',
      categoryColor: '#00e5ff',
    },
  ],
};
```

## Adding a post
1. Create `posts/my-post.ts` (template below).
2. Re-export it from `posts/index.ts`.
3. It appears on `/blog`, in the sitemap, and gets prerendered automatically on the next build.

```ts
import type { SwymbleBlogPost } from '../../types';

const MY_POST: SwymbleBlogPost = {
  id: 'my-post',                          // becomes /blog/my-post
  title: 'My Post',
  date: '2026-03-09',                     // YYYY-MM-DD; used as datePublished/lastmod
  summary: 'Short summary shown in cards and meta description.',
  tags: ['AI', 'R&D'],
  categories: ['cortex'],                 // must match ids in meta.ts
  coverImage: '/images/cortex_website.png', // optional; used as the post's og:image
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

Block types: `paragraph`, `heading` (level 2–4), `quote`, `question`, `list` (bullet/numbered),
`image`, `code`, `spacer` (sm/md/lg). `paragraph`/`question`/`quote`/`list` accept `indent` 0–3.
