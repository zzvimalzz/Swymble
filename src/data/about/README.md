# About Data

| File | Section |
|---|---|
| `about.ts` | About page heading + paragraphs |
| `techstack.ts` | tech stack strip (3D skills scene on the About page) |

## about.ts
Paragraphs render in order; add/remove items to change length.
```ts
export const SWYMBLE_ABOUT = {
  title: 'ABOUT ME',
  paragraphs: ['Paragraph one.', 'Paragraph two.', 'Paragraph three.'],
};
```

## techstack.ts
Categories are skill domains; items are individual technologies. Same shape as the home
universe (`SwymbleSkillCategory`), so the notes there apply too.
```ts
export const SWYMBLE_TECH_STACK = [
  {
    category: 'LANGUAGES',
    context: 'Copy shown when the category is focused.',
    proof: [{ label: 'Swymble Labs', href: '/labs' }],   // "SEEN IN" links, optional
    items: [
      {
        name: 'TypeScript',
        color: '#3178C6',
        description: 'Typed frontend application code.', // optional tooltip copy
        moonModelId: 'moon-01',                           // optional; moon-01 … moon-08
        proof: [{ label: 'This site', href: '/' }],       // falls back to category proof
      },
    ],
  },
];
```
`proof[].href` is an internal route or a full external URL (detected by the `http` prefix).
