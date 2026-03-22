import type { SwymbleService } from './types';

export const SWYMBLE_SERVICES: SwymbleService[] = [
  {
    id: 'web-design',
    title: 'WEB DESIGN',
    colorHex: '#EFFF04',
    colorRgb: '239, 255, 4',
    summary:
      "I design websites for businesses that want to stand out. My approach is to create a unique, high-contrast aesthetic that captures your brand's true edge.",
    highlights: [
      'Custom layouts tailored to your brand identity',
      'Mobile-first responsive design',
      'UI/UX research and wireframing',
      'High-fidelity prototypes before development',
    ],
  },
  {
    id: 'web-development',
    title: 'WEB DEVELOPMENT',
    colorHex: '#FF003C',
    colorRgb: '255, 0, 60',
    summary:
      'From landing pages to full-stack web applications, I build fast, accessible, and production-ready websites using modern frameworks and best practices.',
    highlights: [
      'React, Next.js, and TypeScript development',
      'Performance-optimized builds with modern tooling',
      'SEO-friendly architecture and semantic HTML',
      'Third-party integrations (payments, forms, analytics)',
    ],
  },
  {
    id: 'web-maintenance',
    title: 'WEB MAINTENANCE',
    colorHex: '#00F0FF',
    colorRgb: '0, 240, 255',
    summary:
      'Your website is a living product. I provide ongoing support to keep it secure, up-to-date, and performing at its best so you can focus on your business.',
    highlights: [
      'Regular security patches and dependency updates',
      'Performance monitoring and optimization',
      'Content updates and feature enhancements',
      'Uptime monitoring and incident response',
    ],
  },
];
