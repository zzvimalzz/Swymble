import type { SwymblePositioning } from '../types';
import { SWYMBLE_BLOG_POSTS } from '../blog/posts';
import { SWYMBLE_LABS } from '../labs';
import { SWYMBLE_PROJECTS } from '../projects/projects';

// POSITIONING SECTION (replaces the old homepage "PROJECTS" carousel)
// - statement: first string is the headline, the rest render as body paragraphs
// - statementLink: optional — if its label appears verbatim in a statement paragraph,
//   that substring becomes a link
// - stats: label/value pairs shown as the big counter row. Values are DERIVED from the
//   data layer (projects/labs/blog arrays), so they update on their own as content is
//   added — edit projects.ts / labs/ / blog/posts, not a number here.
export const SWYMBLE_POSITIONING: SwymblePositioning = {
  statement: [
    'A software engineer and a one-person studio in Kuala Lumpur.',
    'Backend systems, APIs and AI platforms for clients, plus a lab of my own products, a few write-ups, and one deliberately pointless masterpiece.',
  ],
  statementLink: {
    label: 'one deliberately pointless masterpiece',
    href: 'https://www.watchpaintdry.net/',
  },
  stats: [
    {
      id: 'projects',
      label: 'SHIPPED & LIVE',
      value: SWYMBLE_PROJECTS.length + SWYMBLE_LABS.filter((lab) => lab.status === 'Live').length,
    },
    {
      id: 'labs',
      label: 'STILL BUILDING',
      value: SWYMBLE_LABS.filter((lab) => lab.status !== 'Live' && lab.visibility !== 'private').length,
    },
    { id: 'notes', label: 'Blog Posts', value: SWYMBLE_BLOG_POSTS.length },
  ],
};
