import type { SwymbleCareerBranch } from '../../types';

// TODO: confirm exact dates below — seeded to be chronologically consistent with existing data
// (labs.ts updatedAt fields, projects.ts) rather than a verified record.
const branch: SwymbleCareerBranch = {
  id: 'swymble',
  label: 'swymble',
  category: 'project',
  parentBranchId: 'main',
  status: 'ongoing',
  nodes: [
    {
      id: 'swymble-founded',
      type: 'milestone',
      title: 'Swymble founded',
      date: '2019',
      description: 'The one-engineer software studio, built alongside the fulltime job.',
    },
    {
      id: 'swymble-first-client',
      type: 'project',
      title: 'First Client',
      date: '2020',
      description: 'Landed the first client project — the studio starts taking outside work.',
    },
    {
      id: 'swymble-next-client',
      type: 'project',
      title: 'Next Client',
      date: '2027',
      description: 'The next client engagement, whoever it turns out to be.',
      isFuture: true,
    },
    {
      id: 'swymble-growth',
      type: 'milestone',
      title: 'Company Growth',
      date: '2028',
      description: 'Scaling the studio beyond a one-engineer operation.',
      isFuture: true,
    },
  ],
};

export default branch;
