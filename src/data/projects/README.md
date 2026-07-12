# Projects Data

`projects.ts` drives the home carousel cards and the full `/projects` page.

## Template
```ts
export const SWYMBLE_PROJECTS = [
  {
    title: 'Project Name',
    category: 'Category Label',
    categoryColor: '#ff9f43',            // optional; accent for the category tag
    client: 'Client Name',               // or null for personal builds
    image: '/project-logo.png',
    landingImage: '/project-landing.png',// optional; wide shot on the project page
    mobileImage: '/project-mobile.png',  // optional; mobile swipe deck image
    description: 'Short public-facing summary.',
    link: 'https://example.com',         // optional; live site
    blogLink: '/blog/project-name',      // optional; related write-up
    status: 'Live',                      // 'Live' | 'In Development' | 'Pending'
    outcomes: ['Shipped X', 'Improved Y'],            // optional bullet list
    stack: ['React', 'Vite'],                          // optional tech tags
    testimonial: { quote: 'Great work.', author: 'Client, Company' }, // optional
  },
];
```

## Notes
- The home carousel deep-links to `/projects#<title-slugified>` (lowercased, spaces → dashes) —
  changing a title changes its anchor.
- Three or fewer projects render as a grid instead of a carousel on desktop.
