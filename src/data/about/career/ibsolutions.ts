import type { SwymbleCareerBranch } from '../../types';

// TODO: confirm exact dates — seeded to be plausible, not a verified record.
const branch: SwymbleCareerBranch = {
  id: 'ibsolutions',
  label: 'client/ibsolutions',
  category: 'project',
  parentBranchId: 'swymble',
  status: 'merged',
  nodes: [
    {
      id: 'ibsolutions-discovery',
      type: 'project',
      title: 'Discovery',
      org: 'IB Solutions',
      date: '06-2020',
      description: 'Scoping the company profile and product requirements.',
    },
    {
      id: 'ibsolutions-design',
      type: 'project',
      title: 'Design',
      org: 'IB Solutions',
      date: '08-2020',
      description: 'Visual direction and UX for the client site.',
    },
    {
      id: 'ibsolutions-development',
      type: 'project',
      title: 'Development',
      org: 'IB Solutions',
      date: '10-2020',
      description: 'Build phase — enterprise-grade discipline at client-project size.',
    },
    {
      id: 'ibsolutions-launch',
      type: 'project',
      title: 'Launch',
      org: 'IB Solutions',
      date: '01-2021',
      description: 'Shipped and handed over.',
      links: [{ label: 'View project', href: '/projects#ib-solutions' }],
    },
  ],
};

export default branch;
