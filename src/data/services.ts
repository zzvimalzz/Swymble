import type { SwymbleService } from './types';

// SERVICES SECTION (studio offering, shown in "WORK WITH ME")
// - title: card title (usually uppercase)
// - colorHex/colorRgb: used by gradient and hover effects in the UI
// - desc: card description text
export const SWYMBLE_SERVICES: SwymbleService[] = [
  {
    id: 'web',
    title: 'WEB & PRODUCT ENGINEERING',
    colorHex: '#EFFF04',
    colorRgb: '239, 255, 4',
    desc: 'Marketing sites, company profiles, and full product builds. Designed, engineered, and shipped end to end.',
  },
  {
    id: 'backend',
    title: 'BACKEND & PLATFORM SYSTEMS',
    colorHex: '#FF003C',
    colorRgb: '255, 0, 60',
    desc: 'APIs, integrations, batch processing, and workflows built to fintech production standards.',
  },
  {
    id: 'ai',
    title: 'AI & AUTOMATION',
    colorHex: '#00F0FF',
    colorRgb: '0, 240, 255',
    desc: 'RAG pipelines, intelligent agents, and automation systems that turn manual work into products.',
  },
];
