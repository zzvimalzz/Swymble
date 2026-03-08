import type { SwymbleLab } from './types';

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
// - primaryAction is the main CTA button.
// - primaryAction.kind:
//   - 'internal' -> route path (e.g. /blog/cortex-part-1)
//   - 'external' -> full URL (opens new tab)
//   - 'mailto'   -> email link
//
// Blog wiring:
// - blogCategoryId -> routes READ BLOG button to /blog?category=<id>
// - blogLink       -> direct blog route fallback if no category id is provided
// - If both are present, blogCategoryId takes priority for folder filtering.
export const SWYMBLE_LABS: SwymbleLab[] = [
  {
    id: 'cortex',
    title: 'CORTEX',
    category: 'ARTIFICIAL INTELLIGENCE',
    image: '/cortex_logo.png',
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
    primaryAction: {
      label: 'REQUEST PRIVATE DEMO',
      href: 'mailto:hello@swymble.com?subject=CORTEX%20Private%20Demo',
      kind: 'mailto',
    },
  },
  {
    id: 'alias-vault',
    title: 'ALIAS VAULT',
    category: 'PRIVACY TOOL',
    image: '/white-logo.png',
    status: 'Private Beta',
    visibility: 'teaser',
    publicSummary:
      'A privacy-first alias management concept designed to reduce personal email exposure across signups and transactional workflows.',
    safeHighlights: [
      'Disposable identity workflows',
      'Admin and abuse-control policy layer',
      'Private usability validation',
    ],
    tags: ['Privacy', 'Security', 'Beta'],
    updatedAt: 'Mar 2026',
    primaryAction: {
      label: 'JOIN BETA WAITLIST',
      href: 'mailto:hello@swymble.com?subject=Alias%20Vault%20Beta%20Waitlist',
      kind: 'mailto',
    },
  },
];
