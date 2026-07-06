import type { SwymbleLab } from './types';
import { createSubdomainUrl } from '../utils/siteUrls';

// LABS SECTION
// Notes:
// - Keep copy public-safe (no private architecture/secrets).
// - visibility controls public rendering:
//   - 'public': fully visible
//   - 'teaser': visible with limited detail
//   - 'private': hidden from public Labs page
// - status allowed values: 'In Development' | 'Private Beta' | 'Live'
//
// Actions:
// - actions supports multiple CTAs per lab card.
// - action.kind:
//   - 'internal' -> route path (e.g. /blog/cortex-part-1)
//   - 'external' -> full URL (opens new tab)
//   - 'mailto'   -> email link
// Blog wiring:
// - blogCategoryId -> routes READ BLOG button to /blog?category=<id>
// - blogLink       -> direct blog route fallback if no category id is provided
// - If both are present, blogCategoryId takes priority for folder filtering.
export const SWYMBLE_LABS: SwymbleLab[] = [
  {
    id: 'cortex',
    title: 'CORTEX',
    category: 'ARTIFICIAL INTELLIGENCE',
    image: '/images/cortex_logo.png',
    status: 'In Development',
    visibility: 'teaser',
    publicSummary:
      'A proprietary cognitive platform focused on long-context memory and operator decision support for complex digital workflows.',
    safeHighlights: [
      'Private architecture under active R&D',
      'Operator-first UX experiments',
      'Controlled pilot evaluations in progress',
    ],
    tags: ['AI', 'R&D', 'Private'],
    updatedAt: 'Mar 2026',
    blogCategoryId: 'cortex',
    actions: [
      {
        label: 'REQUEST PRIVATE DEMO',
        href: 'mailto:hello@swymble.com?subject=CORTEX%20Private%20Demo',
        kind: 'mailto',
      },
    ],
  },
  {
    id: 'mybirth',
    title: 'MYBIRTH',
    category: 'BIRTH ARCHIVE',
    categoryColor: '#74e3d0',
    image: '/images/mybirth_mark.svg',
    status: 'Live',
    visibility: 'public',
    publicSummary:
      'A cinematic birth archive that reconstructs the moon, weather, headlines, music, film, symbols, and keepsakes from the day someone arrived.',
    safeHighlights: [
      'Live key-free public data integrations',
      'Phase-accurate moon and keepsake certificate',
      'Shareable birth story URL for gifts and memories',
    ],
    tags: ['Astronomy', 'Storytelling', 'Public'],
    updatedAt: 'Jun 2026',
    actions: [
      {
        label: 'OPEN MYBIRTH',
        href: createSubdomainUrl('mybirth'),
        kind: 'external',
      },
    ],
  },
  {
    id: 'what2watch',
    title: 'WHAT2WATCH',
    category: 'FILM DISCOVERY',
    categoryColor: '#e6b237',
    image: '/images/what2watch_logo.png',
    status: 'Live',
    visibility: 'public',
    publicSummary:
      'A living wall of movies and shows packed into one interactive screen — a force-directed voronoi mosaic of poster tiles you can wander, filter by mood, or let surprise you.',
    safeHighlights: [
      'GPU voronoi wall with live poster streaming from public film APIs',
      'Mood, type and genre filters that rebuild the wall in place',
      'Surprise-me jumps, title search and a Space hotkey for random picks',
    ],
    tags: ['WebGL', 'Movies', 'Public'],
    updatedAt: 'Jul 2026',
    actions: [
      {
        label: 'OPEN WHAT2WATCH',
        href: createSubdomainUrl('what2watch'),
        kind: 'external',
      },
    ],
  },
  {
    id: 'territory',
    title: 'TERRITORY',
    category: 'FITNESS & GAMING',
    categoryColor: 'red',
    image: '/images/territory_logo.png',
    status: 'In Development',
    visibility: 'teaser',
    publicSummary:
      'A fitness gamification tracker that turns your real-world movement into claimable territory on a virtual map, designed to motivate active lifestyles through exploration and competition.',
    safeHighlights: [
      'Private alpha testing underway',
      'Clean and engaging map-based UX',
    ],
    tags: ['Fitness', 'Gaming', 'Private'],
    updatedAt: 'May 2026',
  },
];
