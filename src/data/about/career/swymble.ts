import type { SwymbleCareerBranch } from '../../types';
import { createSubdomainUrl } from '../../../utils/siteUrls';

// TODO: confirm exact dates below — seeded to be chronologically consistent with existing data
// (labs.ts updatedAt fields, projects.ts) rather than a verified record.

const swymbleBranch: SwymbleCareerBranch = {
  id: 'feature/swymble',
  label: 'feature/swymble',
  category: 'project',
  parentBranchId: 'main',
  splitAfterNodeId: 'main-juristech',
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

const ibsolutionsBranch: SwymbleCareerBranch = {
  id: 'client/ibsolutions',
  label: 'client/ibsolutions',
  category: 'project',
  parentBranchId: 'feature/swymble',
  splitAfterNodeId: 'swymble-first-client',
  mergesBackAfterNodeId: 'ibsolutions-launch',
  status: 'merged',
  nodes: [
    {
      id: 'ibsolutions-discovery',
      type: 'project',
      title: 'Discovery',
      org: 'IB Solutions',
      date: '2020-06',
      description: 'Scoping the company profile and product requirements.',
    },
    {
      id: 'ibsolutions-design',
      type: 'project',
      title: 'Design',
      org: 'IB Solutions',
      date: '2020-08',
      description: 'Visual direction and UX for the client site.',
    },
    {
      id: 'ibsolutions-development',
      type: 'project',
      title: 'Development',
      org: 'IB Solutions',
      date: '2020-10',
      description: 'Build phase — enterprise-grade discipline at client-project size.',
    },
    {
      id: 'ibsolutions-launch',
      type: 'project',
      title: 'Launch',
      org: 'IB Solutions',
      date: '2021-01',
      description: 'Shipped and handed over.',
      links: [{ label: 'View project', href: '/projects#ib-solutions' }],
    },
  ],
};

const watchpaintdryBranch: SwymbleCareerBranch = {
  id: 'product/watchpaintdry',
  label: 'product/watchpaintdry',
  category: 'project',
  parentBranchId: 'feature/swymble',
  splitAfterNodeId: 'swymble-first-client',
  status: 'ongoing',
  nodes: [
    {
      id: 'watchpaintdry-launch',
      type: 'project',
      title: 'Watch Paint Dry',
      date: '2021-06',
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

const what2watchBranch: SwymbleCareerBranch = {
  id: 'product/what2watch',
  label: 'product/what2watch',
  category: 'project',
  parentBranchId: 'feature/swymble',
  splitAfterNodeId: 'swymble-first-client',
  status: 'ongoing',
  nodes: [
    {
      id: 'what2watch-launch',
      type: 'project',
      title: 'What2Watch',
      date: '2025-03',
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

export default [swymbleBranch, ibsolutionsBranch, watchpaintdryBranch, what2watchBranch];
