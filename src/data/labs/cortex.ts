import type { SwymbleLab } from '../types';

const lab: SwymbleLab = {
  id: 'cortex',
  title: 'CORTEX',
  category: 'ARTIFICIAL INTELLIGENCE',
  image: '/images/labs/cortex_logo.png',
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
  order: 10,
  blogCategoryId: 'cortex',
  actions: [
    {
      label: 'REQUEST PRIVATE DEMO',
      href: 'mailto:hello@swymble.com?subject=CORTEX%20Private%20Demo',
      kind: 'mailto',
    },
  ],
};

export default lab;
