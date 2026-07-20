import type { SwymbleLab } from '../types';
import { createSubdomainUrl } from '../../utils/siteUrls';

const lab: SwymbleLab = {
  id: 'mybirth',
  title: 'MYBIRTH',
  category: 'BIRTH ARCHIVE',
  categoryColor: '#74e3d0',
  image: '/images/mybirth_logo.png',
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
  order: 20,
  actions: [
    {
      label: 'OPEN MYBIRTH',
      href: createSubdomainUrl('mybirth'),
      kind: 'external',
    },
  ],
};

export default lab;
