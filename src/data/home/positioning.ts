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
    'The one-engineer software studio a developer in Kuala Lumpur.',
    'Daylight goes to a fulltime job and a Masters Degree while the rest of it comes here, for fun builds, client projects, blog posts, and one deliberately pointless masterpiece.',
  ],
  statementLink: {
    label: 'one deliberately pointless masterpiece',
    href: 'https://www.watchpaintdry.net/',
  },
  stats: [
    { id: 'projects', label: 'SHIPPED & LIVE', value: SWYMBLE_PROJECTS.length },
    { id: 'labs', label: 'IN THE LAB', value: SWYMBLE_LABS.length },
    { id: 'notes', label: 'Blog Posts', value: SWYMBLE_BLOG_POSTS.length },
  ],
};
