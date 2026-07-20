import type { SwymbleCareerBranch } from '../../types';
import { createSubdomainUrl } from '../../../utils/siteUrls';

// TODO: confirm exact dates — seeded to be plausible, not a verified record.
const branch: SwymbleCareerBranch = {
  id: 'what2watch',
  label: 'product/what2watch',
  category: 'project',
  parentBranchId: 'swymble',
  status: 'ongoing',
  nodes: [
    {
      id: 'what2watch-launch',
      type: 'project',
      title: 'What2Watch',
      date: '03-2025',
      description:
        'A living wall of movies and shows: a force-directed voronoi mosaic of poster tiles you can wander, filter by mood, or let surprise you.',
      tech: ['WebGL', 'React', 'TypeScript'],
      links: [{ label: 'Open What2Watch', href: createSubdomainUrl('what2watch') }],
    },
    {
      id: 'what2watch-future',
      type: 'project',
      title: 'Next feature drop',
      date: '2027',
      description: 'More filters, more surprise.',
      isFuture: true,
    },
  ],
};

export default branch;
