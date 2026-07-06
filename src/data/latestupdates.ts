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
  {
    id: 'mybirth-launch',
    kicker: 'New lab',
    title: 'MyBirth is live',
    description:
      'A cinematic birthday archive that rebuilds the moon, weather, public signals, and keepsakes from the day someone arrived.',
    ctaLabel: 'Open MyBirth',
    ctaHref: 'https://mybirth.swymble.com',
  },
];
