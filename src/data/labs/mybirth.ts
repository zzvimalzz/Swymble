import type { SwymbleLab } from '../types';
import { createSubdomainUrl } from '../../utils/siteUrls';

const lab: SwymbleLab = {
  id: 'mybirth',
  title: 'MYBIRTH',
  seoName: 'MyBirth',
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
  detail: {
    oneLiner:
      'MyBirth is a free web app that rebuilds the day you were born — moon phase, weather, headlines, music and film — as a shareable keepsake archive.',
    tagline: 'The Day You Were Born',
    overview: [
      'MyBirth takes a name, a birth date and a birthplace and reconstructs that specific day as a cinematic archive: the phase of the moon overhead, the weather, the headlines, the music and film people were paying attention to, and the symbols traditionally attached to that date.',
      'Everything it shows is pulled live from public, key-free data sources at the moment you ask for it, so the archive is assembled per request rather than read out of a pre-written table of stock facts.',
      'The result is built to be given away. Each archive has its own shareable URL and ends in a keepsake certificate with a phase-accurate rendering of that night’s moon, which is what makes it work as a birthday gift rather than a novelty lookup.',
      'MyBirth is live at mybirth.swymble.com.',
    ],
    features: [
      {
        title: 'Live public data',
        body: 'Astronomy, weather, news, music and film details are fetched from key-free public sources when the archive is generated.',
      },
      {
        title: 'Phase-accurate moon',
        body: 'The moon shown on the keepsake certificate is rendered for the actual phase on the birth date, not a generic illustration.',
      },
      {
        title: 'Shareable birth story URL',
        body: 'Every archive gets its own link, so it can be sent as a gift or kept as a memento.',
      },
    ],
    specs: [
      { label: 'Where', value: 'mybirth.swymble.com' },
      { label: 'Price', value: 'Free, no account needed' },
      { label: 'Inputs', value: 'Name, birth date, birthplace' },
      { label: 'Status', value: 'Live' },
    ],
    faq: [
      {
        question: 'What is MyBirth?',
        answer:
          'MyBirth is a free web app from Swymble Labs that turns a name, birth date and birthplace into a cinematic archive of the moon, weather, headlines, music, film and symbols from that exact day.',
      },
      {
        question: 'Where can I use MyBirth?',
        answer:
          'MyBirth is live at https://mybirth.swymble.com. It runs in the browser and does not require an account.',
      },
    ],
  },
  actions: [
    {
      label: 'VISIT SITE',
      href: createSubdomainUrl('mybirth'),
      kind: 'external',
    },
  ],
};

export default lab;
