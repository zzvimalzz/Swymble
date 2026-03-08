# Swymble Blog Authoring Guide

This folder is the source of truth for all blog content.

## File Structure
- `meta.ts`: blog-level data (title, description, empty state, categories).
- `posts/`: one file per blog post.
- `posts/index.ts`: auto-loads all `posts/*.ts` files and sorts by date (newest first).
- `index.ts`: merges `meta` + `posts` into `SWYMBLE_BLOG`.

## Quick Start: Add A New Post
1. Create `posts/<your-post-id>.ts`.
2. Export your post as the file's **default export**.
3. Ensure every `categories` id exists in `meta.ts`.

## Blog Meta Reference (`meta.ts`)
```ts
type SwymbleBlogStateMeta = {
  title: string;
  description: string;
  emptyStateMsg: string;
  categories: Array<{
    id: string;
    label: string;
    description?: string;
  }>;
};
```

Category behavior:
- `id`: internal key used by posts and URL filter (`?category=<id>`).
- `label`: visible folder/pill label.
- `description`: hover hint text.

## Post Object Reference (`posts/*.ts`)
```ts
type SwymbleBlogPost = {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  summary: string;
  tags: string[];
  categories: string[]; // must match meta category ids
  coverImage?: string;
  content: SwymbleBlogContentBlock[];
};
```

## Content Block Types

### 1) Paragraph
```ts
{ type: 'paragraph', text: 'Single line' }
{ type: 'paragraph', text: ['Line 1', 'Line 2'] }
{ type: 'paragraph', text: ['Indented paragraph'], indent: 1 }
```

### 2) Question
```ts
{ type: 'question', text: 'What would this feel like?' }
```

### 3) Quote
```ts
{ type: 'quote', text: 'Memory is continuity.', cite: 'Cortex Notes' }
```

### 4) List
```ts
{ type: 'list', style: 'bullet', items: ['Item A', 'Item B'] }
{ type: 'list', style: 'numbered', items: ['Step 1', 'Step 2'] }
```

### 5) Spacer
```ts
{ type: 'spacer', size: 'sm' }
{ type: 'spacer', size: 'md' }
{ type: 'spacer', size: 'lg' }
```

### 6) Image
```ts
{ type: 'image', src: '/cortex_website.png' }
{ type: 'image', src: '/cortex_website.png', caption: 'System overview' }
```

### 7) Heading
```ts
{ type: 'heading', text: 'Main Section', level: 2 }
{ type: 'heading', text: 'Subsection', level: 3 }
{ type: 'heading', text: 'Micro Section', level: 4 }
```

### 8) Code
```ts
{ type: 'code', language: 'typescript', code: 'const x = 1;' }
```

## Rich Text Syntax (inside `text`, `items`, and `caption`)
- Bold: `**bold**`
- Italic: `*italic*`
- Underline: `__underline__`
- Inline code: `` `code` ``

Line breaks:
- Use array form for cleaner long content: `text: ['line 1', 'line 2']`
- Or use `\n` inside a single string.

## Heading Levels Guide
- `level: 2`: primary section title in article body.
- `level: 3`: subsection under a level 2 section.
- `level: 4`: small callout/sub-subsection heading.

## Indent Levels Guide
Use `indent` on `paragraph`, `question`, `quote`, and `list`:
- `0`: no indent (default)
- `1`: small indent
- `2`: medium indent
- `3`: large indent

## Quote/Apostrophe Safety
Use backticks for long text with apostrophes and quotes to avoid escaping issues:
```ts
text: `There's a layer of "temporal intelligence" that tracks change over time.`
```

## Recommended Writing Pattern
- Keep one paragraph block per idea.
- Use `question` for dramatic prompts.
- Use `list` for structured concepts.
- Use `spacer` to break dense sections.

## Full Post Template
```ts
import type { SwymbleBlogPost } from '../../types';

export const MY_NEW_POST: SwymbleBlogPost = {
  id: 'my-new-post',
  title: 'My New Post',
  date: '2026-03-09',
  summary: 'Short summary shown in cards.',
  tags: ['AI', 'R&D'],
  categories: ['cortex'],
  coverImage: '/cortex_website.png',
  content: [
    { type: 'heading', text: 'Section Title', level: 2 },
    {
      type: 'paragraph',
      text: [
        `Long text supports apostrophes like it's and quotes like "this".`,
        'Second line here.',
      ],
    },
    { type: 'question', text: 'What if memory worked this way?' },
    {
      type: 'list',
      style: 'bullet',
      items: ['**Point A** details', '*Point B* details'],
      indent: 1,
    },
    { type: 'spacer', size: 'sm' },
    {
      type: 'quote',
      text: 'Memory is continuity.',
      cite: 'Internal notes',
    },
    {
      type: 'code',
      language: 'typescript',
      code: 'console.log("hello");',
    },
  ],
};

export default MY_NEW_POST;
```

## Zero Manual Registration
- You do not need to import your new post in `posts/index.ts`.
- `posts/index.ts` uses `import.meta.glob` to discover every `*.ts` file in `posts/` automatically.
- Keep one post per file and export `default`.
