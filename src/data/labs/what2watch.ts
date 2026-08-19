import type { SwymbleLab } from '../types';
import { createSubdomainUrl } from '../../utils/siteUrls';

const lab: SwymbleLab = {
  id: 'what2watch',
  title: 'WHAT2WATCH',
  seoName: 'what2watch',
  category: 'FILM DISCOVERY',
  categoryColor: '#e6b237',
  image: '/images/labs/what2watch_logo.png',
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
  detail: {
    oneLiner:
      'what2watch is a free Swymble Labs web app that packs tens of thousands of movies and shows into one interactive voronoi wall you can browse by mood.',
    tagline: 'Movie Discovery Wall',
    overview: [
      'what2watch is an answer to the scrolling problem: instead of a vertical list of ten posters at a time, it renders the whole catalogue as a single living wall. Tens of thousands of movies and shows are packed into one screen as a force-directed voronoi mosaic of poster tiles that you can wander around, zoom into and pull apart.',
      'The wall is not a static image. It runs on the GPU, streams posters live from public film APIs, and rebuilds itself in place when you change what you are looking for — filter by mood, by type or by genre and the mosaic re-packs around the new selection rather than reloading a new page of results.',
      'For the times when you genuinely do not want to choose, there is a surprise-me jump, a title search, and a hotkey that throws you at a random pick.',
      'what2watch is live at what2watch.swymble.com.',
    ],
    features: [
      {
        title: 'GPU voronoi wall',
        body: 'The catalogue is packed into one screen as a force-directed voronoi mosaic, with posters streamed live from public film APIs.',
      },
      {
        title: 'Mood, type and genre filters',
        body: 'Changing a filter rebuilds the wall in place instead of loading a new page of results.',
      },
      {
        title: 'Surprise me',
        body: 'Title search, surprise-me jumps and a hotkey for a random pick, for when browsing is not the point.',
      },
    ],
    specs: [
      { label: 'Where', value: 'what2watch.swymble.com' },
      { label: 'Price', value: 'Free, no account needed' },
      { label: 'Built with', value: 'WebGL, public film APIs' },
      { label: 'Status', value: 'Live' },
    ],
    faq: [
      {
        question: 'What is what2watch?',
        answer:
          'what2watch is a free web app from Swymble Labs for deciding what to watch. It shows tens of thousands of movies and shows as one interactive, force-directed voronoi wall of poster tiles that you can filter by mood, type or genre.',
      },
      {
        question: 'Where can I use what2watch?',
        answer:
          'what2watch is live at https://what2watch.swymble.com. It runs in the browser and needs no account.',
      },
    ],
  },
  actions: [
    {
      label: 'VISIT SITE',
      href: createSubdomainUrl('what2watch'),
      kind: 'external',
    },
  ],
};

export default lab;
