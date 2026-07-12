import type { SwymbleProcessStep } from '../types';

// PROCESS SECTION (studio engagement steps, shown in "WORK WITH ME")
// - step: two-digit step number string, e.g. '01'
// - title: step title (usually uppercase)
// - desc: step description text
export const SWYMBLE_PROCESS: SwymbleProcessStep[] = [
  {
    id: 'discover',
    step: '01',
    title: 'DISCOVER',
    desc: 'A call or a message. We map what you need, what it costs, and what done looks like.',
  },
  {
    id: 'design',
    step: '02',
    title: 'DESIGN',
    desc: 'Structure, flow, and visual direction. You see the shape of the product before any code.',
  },
  {
    id: 'build',
    step: '03',
    title: 'BUILD',
    desc: 'Short, visible iterations. You watch it come alive and steer while change is cheap.',
  },
  {
    id: 'ship',
    step: '04',
    title: 'SHIP & RUN',
    desc: 'Launch, hosting, monitoring, and the production details that keep it running. Handled.',
  },
];
