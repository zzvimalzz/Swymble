import type { SwymblePositioning } from '../types';
import { SWYMBLE_LABS } from '../labs/labs';
import { SWYMBLE_PROJECTS } from '../projects/projects';
import { SWYMBLE_BLOG_POSTS } from '../blog/posts';

// POSITIONING (homepage chapter 02) — replaces the old "What You'll Find Here" cards.
// One claim, three counters. Counter values are DERIVED from the data layer so they
// stay true automatically as content is added ("every readout is true").

const liveCount =
  SWYMBLE_LABS.filter((lab) => lab.status === 'Live').length +
  SWYMBLE_PROJECTS.filter((project) => project.status === 'Live').length;

const inDevelopmentCount = SWYMBLE_LABS.filter((lab) => lab.status !== 'Live').length;

export const SWYMBLE_POSITIONING: SwymblePositioning = {
  statement: [
    'The one-engineer software studio of a fintech systems developer in Kuala Lumpur.',
    'Daylight goes to banking-grade production systems. The rest goes here — client products built end to end, experiments shipped in public, and one deliberately pointless masterpiece.',
  ],
  // "one deliberately pointless masterpiece" points at Watch Paint Dry.
  statementLink: {
    label: 'one deliberately pointless masterpiece',
    href: 'https://www.watchpaintdry.net/',
  },
  stats: [
    { id: 'live', label: 'SHIPPED & LIVE', value: liveCount },
    { id: 'in-dev', label: 'IN THE LAB', value: inDevelopmentCount },
    { id: 'notes', label: 'FIELD NOTES', value: SWYMBLE_BLOG_POSTS.length },
  ],
};
