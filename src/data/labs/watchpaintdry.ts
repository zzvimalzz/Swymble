import type { SwymbleLab } from '../types';

const lab: SwymbleLab = {
  id: 'watchpaintdry',
  title: 'WATCH PAINT DRY',
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
  actions: [
    {
      label: 'OPEN WATCH PAINT DRY',
      href: 'https://www.watchpaintdry.net/',
      kind: 'external',
    },
  ],
};

export default lab;
