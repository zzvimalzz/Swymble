# About Data

| File | Section |
|---|---|
| `about.ts` | About page heading + intro paragraphs |
| `career/` | the interactive git-graph career repository — see [career/README.md](career/README.md) |

## about.ts
Paragraphs render in order; add/remove items to change length.
```ts
export const SWYMBLE_ABOUT = {
  title: 'ABOUT ME',
  paragraphs: ['Paragraph one.', 'Paragraph two.', 'Paragraph three.'],
};
```
