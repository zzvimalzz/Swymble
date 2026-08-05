import type { SwymbleLab } from '../types';

const lab: SwymbleLab = {
  id: 'territory',
  title: 'TERRITORY',
  seoName: 'Territory',
  category: 'FITNESS & GAMING',
  categoryColor: 'red',
  image: '/images/labs/territory_logo.png',
  status: 'In Development',
  visibility: 'teaser',
  publicSummary:
    'A fitness gamification tracker that turns your real-world movement into claimable territory on a virtual map, designed to motivate active lifestyles through exploration and competition.',
  safeHighlights: [
    'Private alpha testing underway',
    'Clean and engaging map-based UX',
  ],
  tags: ['Fitness', 'Gaming', 'Private'],
  updatedAt: 'May 2026',
  order: 50,
  detail: {
    oneLiner:
      'Territory is a fitness gamification app from Swymble Labs that turns real-world movement into claimable territory on a virtual map.',
    tagline: 'Fitness Map Game',
    overview: [
      'Territory is a fitness tracker built as a map game. Instead of reporting your activity back to you as a chart, it converts the ground you actually cover into territory you claim on a virtual map — the further you move, the more of the map is yours.',
      'The design goal is motivation through exploration and competition rather than through streaks and guilt: covering new ground is the reward, and holding ground against other players is the reason to keep going.',
      'Territory is in development and currently in private alpha testing, with the map-based interface as the main focus of that round.',
    ],
    specs: [
      { label: 'Category', value: 'Fitness and gaming' },
      { label: 'Availability', value: 'Private alpha' },
      { label: 'Status', value: 'In development' },
    ],
    faq: [
      {
        question: 'What is Territory?',
        answer:
          'Territory is a fitness gamification app by Swymble Labs. It tracks your real-world movement and turns the distance you cover into territory you claim on a virtual map.',
      },
      {
        question: 'Can I try Territory?',
        answer:
          'Not yet publicly. Territory is in development and currently running a private alpha. Get in touch through swymble.com/contact to ask about access.',
      },
    ],
  },
};

export default lab;
