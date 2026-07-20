import type { SwymbleCareerRepository } from '../../types';
import { createSubdomainUrl } from '../../../utils/siteUrls';

// CAREER REPOSITORY (About page git-graph)
// One array, every branch in it. To add a branch — including forking off an existing one — add a
// new object below with a unique `id` and a `parentBranchId` pointing at the branch it forks
// from (omit parentBranchId only for the trunk, 'main'); the graph engine works out fork/merge
// points and column order from that plus each node's date, so there's nothing else to wire up.
// See README.md for the full field reference and a copy-paste template.
export const SWYMBLE_CAREER: SwymbleCareerRepository = [
  {
    id: 'main',
    label: 'main',
    category: 'career',
    status: 'ongoing',
    nodes: [
      {
        id: 'main-spm',
        type: 'education',
        title: 'SPM',
        org: 'SMK Bandar Sri Damansara 2',
        date: '2019',
        description: 'Completed SPM and graduated from high school.',
      },
      {
        id: 'main-foundation',
        type: 'education',
        title: 'Foundation in Science',
        org: 'SEGi University',
        date: '2020',
        endDate: '2021',
        results: 'CGPA 3.83/4.00',
        description: 'Enrolled and completed the Foundation in Science program.',
      },
      {
        id: 'main-foundation-deans-list',
        type: 'milestone',
        title: "Dean's List",
        org: 'SEGi University',
        date: '12-2020',
        description: 'Recognized for academic performance.',
      },
      {
        id: 'main-degree',
        type: 'education',
        title: 'Bachelor of Computer Science (Hons), Cyber Security',
        org: 'SEGi University',
        date: '2021',
        endDate: '2024',
        results: 'CGPA 3.60/4.00 — second-class upper honors',
        description: 'Cyber security-focused computer science degree.',
        tech: ['C', 'C++', 'Python', 'Java', 'SQL', 'Linux', 'Threat Analysis', 'Network Security', 'Cryptography'],
      },
      {
        id: 'main-degree-award',
        type: 'award',
        title: 'Final Year Project Award',
        org: 'SEGi University',
        date: '11-2023',
        description: 'Recognized for outstanding achievement in conceptualizing, designing, and implementing an innovative idea.',
      },
      {
        id: 'main-degree-deans-list',
        type: 'milestone',
        title: "Dean's List",
        org: 'SEGi University',
        date: '12-2023',
        description: 'Recognized for academic performance.',
      },
      {
        id: 'main-degree-exhibition-award',
        type: 'award',
        title: 'Final Year Project Exhibition Award',
        org: 'SEGi University',
        date: '08-2024',
        description: 'Silver award for outstanding achievement in conceptualizing, designing, and implementing an innovative idea.',
      },
      {
        id: 'main-aia-internship',
        type: 'employment',
        title: 'AIA Internship',
        org: 'AIA',
        date: '06-2024',
        endDate: '09-2024',
        description: 'Technology internship — practical experience in software development and IT operations.',
        tech: ['Python', 'Selenium', 'ChromeDriver', 'Pandas', 'NumPy', 'Agile Methodologies'],
      },
      {
        id: 'main-juristech',
        type: 'employment',
        title: 'JurisTech',
        org: 'Juris Technologies Sdn Bhd',
        date: '04-2025',
        endDate: 'Present',
        description: [
          'Developed and maintained enterprise loan origination and collections systems across telecommunications, banking, government-linked finance, and collections domains, supporting high-volume financial operations.',
          'Owned full-cycle Change Request delivery as Technical Lead: requirements, backend design, development, UAT, and production deployment — including the end-to-end PTP Eligibility CR for Maxis with batch pipelines and automated messaging workflows.',
          'Resolved critical production incidents under strict SLAs covering workflow defects, billing discrepancies, bulk upload failures, and third-party integration breakages.',
        ],
        tech: ['PHP', 'SQL', 'DB2', 'MariaDB', 'MongoDB', 'PL/SQL', 'JavaScript', 'Git', 'Docker', 'CI/CD', 'REST APIs'],
      },
      {
        id: 'main-masters',
        type: 'education',
        title: 'Masters of Cyber Security',
        org: 'University Malaya',
        date: '2025', // TODO: confirm exact start date
        description: 'Pursuing a Masters degree alongside full-time work at JurisTech.',
      },
      {
        id: 'main-present',
        type: 'milestone',
        title: 'Present',
        date: '10-2026',
        isFuture: true,
      },
    ],
  },
  {
    id: 'swymble',
    label: 'swymble',
    category: 'project',
    parentBranchId: 'main',
    status: 'ongoing',
    nodes: [
      {
        id: 'swymble-founded',
        type: 'employment',
        title: 'Freelance Full Stack Developer',
        date: '01-2026',
        endDate: 'Present',
        description:
          'Design, develop, and deploy production websites end-to-end for Malaysian SMB clients as a solo engineer — requirements scoping, UI/UX, implementation, deployment, and post-launch support.',
      },
      {
        id: 'swymble-first-client',
        type: 'project',
        title: 'First Client — IB Solutions',
        date: '04-2026',
        description: 'Landed the first client project and delivered it end-to-end as a solo technical consultant.',
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
  },
  {
    // TODO: dates below shifted to stay after swymble's 04-2026 founding — confirm the real timeline.
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
        date: '04-2026',
        description: 'Scoping the company profile and product requirements.',
      },
      {
        id: 'ibsolutions-design',
        type: 'project',
        title: 'Design',
        org: 'IB Solutions',
        date: '05-2026',
        description: 'Visual direction and UX for the client site.',
      },
      {
        id: 'ibsolutions-development',
        type: 'project',
        title: 'Development',
        org: 'IB Solutions',
        date: '06-2026',
        description: 'Build phase — enterprise-grade discipline at client-project size.',
      },
      {
        id: 'ibsolutions-launch',
        type: 'project',
        title: 'Launch',
        org: 'IB Solutions',
        date: '07-2026',
        description: 'Shipped and handed over.',
        links: [{ label: 'View project', href: '/projects#ib-solutions' }],
      },
    ],
  },
  {
    // TODO: launch date shifted to stay after swymble's founding — confirm the real date.
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
        date: '08-2026',
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
  },
  {
    // TODO: launch date shifted to stay after swymble's founding — confirm the real date.
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
        date: '09-2026',
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
  },
];
