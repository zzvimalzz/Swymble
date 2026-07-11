import type { SwymbleWhatIDo } from './types';

// WHAT I DO SECTION
// - title: card title (usually uppercase)
// - colorHex/colorRgb: used by gradient and hover effects in the UI
// - desc: card description text
export const SWYMBLE_WHAT_I_DO: SwymbleWhatIDo[] = [
  {
    title: 'SOFTWARE ENGINEERING',
    colorHex: '#EFFF04',
    colorRgb: '239, 255, 4',
    desc: 'Production engineering across fintech, banking, and enterprise systems. The discipline behind everything I ship.',
  },
  {
    title: 'BUILDS AND EXPERIMENTS',
    colorHex: '#FF003C',
    colorRgb: '255, 0, 60',
    desc: 'Apps, tools, and prototypes shipped in public. Ideas tested fast and turned into working products.',
  },
  {
    title: 'WEB, WRITING, AND LIFE',
    colorHex: '#00F0FF',
    colorRgb: '0, 240, 255',
    desc: "The websites I make, the stories behind them, blog posts, travel notes, and what I'm building next.",
  },
];
