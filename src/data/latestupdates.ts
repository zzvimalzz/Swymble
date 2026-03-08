import type { SwymbleLatestUpdateCard } from './types';

// LATEST UPDATES DATA GUIDE
// - This array controls the manual cards in the Latest Updates carousel.
// - The first card ("New on blog") is automatic and is NOT configured here.
// - Add, remove, or reorder objects below to change what users see.
//
// Typical card ideas:
// - release notes / changelog highlights
// - roadmap milestones / upcoming features
// - lab experiment updates
// - collaboration announcements
// - event or availability notices
//
// Optional CTA behavior:
// - For internal links, use ctaHref like "/blog" or "/labs".
// - For external links, use full URLs like "https://example.com".
// - Omit ctaLabel/ctaHref if a card should be informational only.
export const SWYMBLE_LATEST_UPDATES: SwymbleLatestUpdateCard[] = [
//   {
//     id: 'build-queue',
//     kicker: 'What is next',
//     title: 'Build Queue',
//     description: 'Drop quick progress notes here for upcoming experiments, launches, and polish passes.',
//     ctaLabel: 'Open Labs',
//     ctaHref: '/labs',
//   },
//   {
//     id: 'community-signal',
//     kicker: 'Community signal',
//     title: 'Ideas to Add',
//     description: 'Feature requests, mini changelog highlights, and release dates can rotate in this carousel next.',
//     ctaLabel: 'Read Blog',
//     ctaHref: '/blog',
//   },
];
