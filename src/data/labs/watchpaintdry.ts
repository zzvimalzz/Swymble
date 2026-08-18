import type { SwymbleLab } from '../types';

const lab: SwymbleLab = {
  id: 'watchpaintdry',
  title: 'WATCH PAINT DRY',
  seoName: 'Watch Paint Dry',
  category: 'DIGITAL ZEN',
  categoryColor: '#f2aebf',
  image: '/images/labs/watchpaintdry_logo.png',
  status: 'Live',
  visibility: 'public',
  publicSummary:
    'A deliberately pointless relaxation toy on its own domain: a wall of fresh paint, a timer counting how long you have stared at it, and achievements for your patience.',
  safeHighlights: [
    'Patience levels and unlockable achievements, stored locally with no accounts',
    'Ambient audio scenes and slow-changing backdrops',
    'Session stats: longest stare, total visits, total clicks',
  ],
  tags: ['Zen', 'Toy', 'Public'],
  updatedAt: 'Jul 2026',
  order: 40,
  detail: {
    oneLiner:
      'Watch Paint Dry is a free browser toy: a wall of fresh paint, a timer counting how long you stare at it, and achievements for your patience.',
    tagline: 'A Pointless Relaxation Toy',
    overview: [
      'Watch Paint Dry is exactly what the name says, taken seriously. You open it, a wall of fresh paint starts drying, and a timer counts how long you have watched. That is the entire premise.',
      'What makes it stick is that the pointlessness is fully built out. Staring earns patience levels and unlockable achievements, and the site keeps your session stats — longest stare, total visits, total clicks — so there is a record of time you deliberately wasted. Everything is stored locally in your browser; there are no accounts.',
      'Ambient audio scenes and slow-changing backdrops make it usable as a background: a piece of digital zen rather than a joke you close after ten seconds.',
      'Watch Paint Dry lives on its own domain at watchpaintdry.net, built and deployed from the Swymble monorepo.',
    ],
    features: [
      {
        title: 'Patience levels and achievements',
        body: 'Unlockables for how long you last, stored locally in the browser with no account required.',
      },
      {
        title: 'Ambient scenes',
        body: 'Ambient audio and slow-changing backdrops, made to leave running in the background.',
      },
      {
        title: 'Session stats',
        body: 'Longest stare, total visits and total clicks, kept as a record of time well wasted.',
      },
    ],
    specs: [
      { label: 'Where', value: 'www.watchpaintdry.net' },
      { label: 'Price', value: 'Free, no account needed' },
      { label: 'Data storage', value: 'Local browser storage only' },
      { label: 'Status', value: 'Live' },
    ],
    faq: [
      {
        question: 'What is Watch Paint Dry?',
        answer:
          'Watch Paint Dry is a free browser toy by Swymble Labs. It shows a wall of fresh paint drying and times how long you stare at it, with patience levels, achievements and session stats stored locally in your browser.',
      },
      {
        question: 'Where can I play Watch Paint Dry?',
        answer:
          'Watch Paint Dry is live at https://www.watchpaintdry.net. It runs in the browser with no account or download.',
      },
    ],
  },
  actions: [
    {
      label: 'VISIT SITE',
      href: 'https://www.watchpaintdry.net/',
      kind: 'external',
    },
  ],
};

export default lab;
