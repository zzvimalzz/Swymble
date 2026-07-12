import type { SwymbleUniverseOrbit } from '../types';

// SWYMBLE UNIVERSE SECTION
// - category: orbit shown around the core planet — a kind of work, not a tech stack
// - context: short copy shown when the orbit is focused
// - proof: "SEEN IN" links shown when the orbit/moon is focused — real projects, labs, or
//   posts that shipped. Item-level proof falls back to the orbit's proof when absent. href is
//   an internal route (e.g. '/labs', '/projects#ib-solutions', '/blog/cortex-part-1') or a full
//   external URL (detected at render time by an 'http' prefix).
// - items[].name: moon label shown in the scene and hover tooltip — a real shipped thing
// - items[].color: hex color used for moon glow and orbit accents
// - items[].moonModelId: optional model pin; valid ids are moon-01 through moon-08
export const SWYMBLE_UNIVERSE: SwymbleUniverseOrbit[] = [
  {
    category: 'CLIENT WORK',
    context: 'Products designed and shipped for businesses.',
    items: [
      {
        name: 'IB Solutions',
        color: '#ff9f43',
        moonModelId: 'moon-01',
        description: 'Company profile for a Malaysian corporate training firm. Designed and built end to end.',
        proof: [
          { label: 'View project', href: '/projects#ib-solutions' },
          { label: 'Visit site', href: 'https://ibsolutions.com.my' },
        ],
      },
    ],
  },
  {
    category: 'LABS',
    context: 'Experiments and products built in the open.',
    items: [
      {
        name: 'MyBirth',
        color: '#74e3d0',
        moonModelId: 'moon-02',
        description: 'A cinematic birthday archive that rebuilds the moon, weather, and headlines from the day you arrived.',
        proof: [
          { label: 'Open MyBirth', href: 'https://mybirth.swymble.com' },
          { label: 'In the lab', href: '/labs' },
        ],
      },
      {
        name: 'What2Watch',
        color: '#e6b237',
        moonModelId: 'moon-03',
        description: 'A living wall of movies and shows in one interactive screen.',
        proof: [
          { label: 'Open What2Watch', href: 'https://what2watch.swymble.com' },
          { label: 'In the lab', href: '/labs' },
        ],
      },
      {
        name: 'CORTEX',
        color: '#9B59B6',
        moonModelId: 'moon-04',
        description: 'A proprietary cognitive platform in private R&D.',
        proof: [
          { label: 'In the lab', href: '/labs' },
          { label: 'Read the story', href: '/blog/cortex-part-1' },
        ],
      },
      {
        name: 'Territory',
        color: '#DC2626',
        moonModelId: 'moon-05',
        description: 'Fitness gamification: real world movement claims territory on a virtual map.',
        proof: [{ label: 'In the lab', href: '/labs' }],
      },
    ],
  },
  {
    category: 'WRITING',
    context: 'Notes and stories from the build log.',
    items: [
      {
        name: 'The Blog',
        color: '#00F0FF',
        moonModelId: 'moon-06',
        description: 'Engineering notes, stories, and lessons from what I build.',
        proof: [{ label: 'Read the blog', href: '/blog' }],
      },
    ],
  },
  {
    category: 'THE ENGINEER',
    context: 'The enterprise background behind the studio.',
    items: [
      {
        name: 'About',
        color: '#EFFF04',
        moonModelId: 'moon-07',
        description: 'Fintech and banking systems, production support, and technical leadership.',
        proof: [{ label: 'About me', href: '/about' }],
      },
    ],
  },
];
