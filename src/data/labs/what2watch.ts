import type { SwymbleLab } from '../types';
import { createSubdomainUrl } from '../../utils/siteUrls';

const lab: SwymbleLab = {
  id: 'what2watch',
  title: 'WHAT2WATCH',
  category: 'FILM DISCOVERY',
  categoryColor: '#e6b237',
  image: '/images/what2watch_logo.png',
  status: 'Live',
  visibility: 'public',
  publicSummary:
    'A living wall of movies and shows packed into one interactive screen: a force-directed voronoi mosaic of poster tiles you can wander, filter by mood, or let surprise you.',
  safeHighlights: [
    'GPU voronoi wall with live poster streaming from public film APIs',
    'Mood, type and genre filters that rebuild the wall in place',
    'Surprise-me jumps, title search and a hotkey for random picks',
  ],
  tags: ['WebGL', 'Movies', 'Public'],
  updatedAt: 'Jul 2026',
  order: 30,
  actions: [
    {
      label: 'OPEN WHAT2WATCH',
      href: createSubdomainUrl('what2watch'),
      kind: 'external',
    },
  ],
};

export default lab;
