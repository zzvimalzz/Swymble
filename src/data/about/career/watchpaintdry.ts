import type { SwymbleCareerBranch } from '../../types';

// TODO: confirm exact dates — seeded to be plausible, not a verified record.
const branch: SwymbleCareerBranch = {
  id: 'watchpaintdry',
  label: 'product/watchpaintdry',
  category: 'project',
  parentBranchId: 'swymble',
  status: 'ongoing',
  nodes: [
    {
      id: 'watchpaintdry-launch',
      type: 'project',
      title: 'Watch Paint Dry',
      date: '06-2021',
      description:
        'One deliberately pointless masterpiece: a wall of fresh paint, a timer, and achievements for your patience — on its own domain.',
      tech: ['Zen', 'Toy'],
      links: [{ label: 'Visit site', href: 'https://www.watchpaintdry.net/' }],
    },
    {
      id: 'watchpaintdry-future',
      type: 'project',
      title: 'New achievements',
      date: '2027',
      description: 'More patience levels and unlockables.',
      isFuture: true,
    },
  ],
};

export default branch;
