import type { SwymbleCareerRepository } from '../../types';
import { createSubdomainUrl } from '../../../utils/siteUrls';

// CAREER REPOSITORY (About page git-graph)
// One array, every branch in it. To add a branch, including forking off an existing one, add a
// new object below with a unique `id` and a `parentBranchId` pointing at the branch it forks
// from (omit parentBranchId only for the trunk, 'main'); the graph engine works out fork/merge
// points and lane order from that plus each node's date, so there's nothing else to wire up.
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
        description: 'Finished secondary school and sat SPM.',
      },
      {
        id: 'main-google-cybersecurity',
        type: 'award',
        title: 'Google Cybersecurity Certificate',
        org: 'Coursera',
        date: '2025',
        description: 'Professional certificate covering security operations, threat detection and incident response.',
      },
      {
        id: 'main-masters',
        type: 'education',
        title: 'Masters of Cyber Security',
        org: 'Universiti Malaya',
        date: '10-2026',
        isFuture: true,
        description: 'Starting October 2026.',
      },
    ],
  },
  {
    id: 'foundation',
    label: 'foundation',
    category: 'education',
    parentBranchId: 'main',
    status: 'merged',
    nodes: [
      {
        id: 'foundation-program',
        type: 'education',
        title: 'Foundation in Science',
        org: 'SEGi University, Kota Damansara',
        date: '2020',
        endDate: '2021',
        results: 'CGPA 3.83/4.00',
        description: 'One year foundation programme, taken before the degree.',
      },
      {
        id: 'foundation-deans-list',
        type: 'milestone',
        title: "Dean's List",
        org: 'SEGi University, Kota Damansara',
        date: '12-2020',
        description: 'Recognised for academic performance during the foundation programme.',
      },
    ],
  },
  {
    id: 'degree',
    label: 'degree',
    category: 'education',
    parentBranchId: 'main',
    status: 'merged',
    nodes: [
      {
        id: 'degree-program',
        type: 'education',
        title: 'BSc (Hons) Computer Science, Cyber Security',
        org: 'SEGi University, Kota Damansara',
        date: '2021',
        endDate: '2024',
        results: 'CGPA 3.60/4.00 · Second Class Honours, Upper Division',
        description:
          'Computer science degree specialising in cyber security, covering threat analysis, network security and cryptography alongside core software engineering.',
        tech: ['C', 'C++', 'Python', 'Java', 'SQL', 'Linux', 'Threat Analysis', 'Network Security', 'Cryptography'],
      },
      {
        id: 'degree-fyp-award',
        type: 'award',
        title: 'Innovative Idea Award',
        org: 'SEGi University Project Showcase',
        date: '11-2023',
        description: 'Awarded for the final year project, for conceptualising, designing and implementing an original idea.',
      },
      {
        id: 'degree-deans-list',
        type: 'milestone',
        title: "Dean's List",
        org: 'SEGi University, Kota Damansara',
        date: '12-2023',
        description: 'Recognised for academic performance during the degree.',
      },
      {
        id: 'degree-exhibition-award',
        type: 'award',
        title: 'Silver Award',
        org: 'MAHSA Engineering, Science & Technology Exhibition (ESTE)',
        date: '08-2024',
        description: 'Silver award for the final year project at the 2024 exhibition.',
      },
    ],
  },
  {
    id: 'internship',
    label: 'internship',
    category: 'career',
    parentBranchId: 'degree',
    status: 'merged',
    nodes: [
      {
        id: 'internship-aia',
        type: 'employment',
        title: 'Operations & Product Management Intern',
        org: 'AIA Malaysia',
        date: '06-2024',
        endDate: '09-2024',
        description:
          'Internship taken during the final semester of the degree, working across operations and product management and building automation to take manual work out of the process.',
        tech: ['Python', 'Selenium', 'ChromeDriver', 'Pandas', 'NumPy', 'Agile Methodologies'],
      },
    ],
  },
  {
    id: 'employment',
    label: 'employment',
    category: 'career',
    parentBranchId: 'main',
    status: 'ongoing',
    nodes: [
      {
        id: 'employment-juristech',
        type: 'employment',
        title: 'Software Engineer',
        org: 'Juris Technologies Sdn Bhd (JurisTech)',
        date: '04-2025',
        endDate: '09-2026',
        // Deliberately describes the class of system, not the client. Named end-customers from
        // enterprise work stay out of public copy.
        description: [
          'Built and maintained large enterprise platforms handling high-volume, money-critical operations, across several industries and regulatory regimes.',
          'Technical Lead on change delivery: requirements, backend design, implementation, UAT and production deployment, including batch pipelines and automated messaging workflows.',
          'On the front line for critical production incidents under strict SLAs, covering workflow defects, data discrepancies, bulk upload failures and third-party integration breakages.',
        ],
        tech: ['PHP', 'SQL', 'PL/SQL', 'DB2', 'MariaDB', 'MongoDB', 'JavaScript', 'Docker', 'CI/CD', 'REST APIs'],
      },
      {
        id: 'employment-ibsolutions',
        type: 'employment',
        title: 'Technology Consultant',
        org: 'IB Solutions, through Swymble',
        date: '09-2026',
        endDate: 'Present',
        isFuture: true,
        description:
          'Ongoing consulting engagement with IB Solutions, taken on through Swymble rather than as an in-house hire, after first delivering their build as a client.',
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
        org: 'Swymble',
        date: '01-2026',
        endDate: 'Present',
        description:
          'Started Swymble as a one-person studio: scoping, designing, building and deploying production websites end to end for Malaysian SMB clients, then supporting them after launch.',
      },
    ],
  },
  {
    // Still open on purpose: the engagement is ongoing, so the branch does not merge back.
    id: 'ibsolutions',
    label: 'client/ibsolutions',
    category: 'project',
    parentBranchId: 'swymble',
    status: 'ongoing',
    nodes: [
      {
        id: 'ibsolutions-engagement',
        type: 'project',
        title: 'First client: IB Solutions',
        org: 'IB Solutions',
        date: '03-2026',
        endDate: 'Present',
        description:
          'The first Swymble client. Scoped, designed, built and shipped the whole thing solo, and still working with them.',
        links: [{ label: 'View project', href: '/projects#ib-solutions' }],
      },
    ],
  },
  {
    // TODO: the five launch months below are inferred from each lab's `updatedAt` plus the order
    // they were built in. Confirm the real start dates and adjust.
    id: 'products',
    label: 'products',
    category: 'project',
    parentBranchId: 'swymble',
    status: 'ongoing',
    nodes: [
      {
        id: 'product-watchpaintdry',
        type: 'project',
        title: 'Watch Paint Dry',
        date: '02-2026',
        description:
          'One deliberately pointless masterpiece: a wall of fresh paint, a timer, and achievements for your patience, on its own domain.',
        tech: ['TypeScript', 'Vite', 'Canvas'],
        links: [{ label: 'Visit site', href: 'https://www.watchpaintdry.net/' }],
      },
      {
        id: 'product-cortex',
        type: 'project',
        title: 'Cortex',
        date: '03-2026',
        description:
          'A proprietary cognitive platform built around long-context memory and operator decision support. Private R&D.',
        tech: ['Neo4j', 'Python', 'Claude'],
        links: [{ label: 'Read the write-up', href: '/blog/cortex-part-1' }],
      },
      {
        id: 'product-mydompet',
        type: 'project',
        title: 'MyDompet',
        date: '04-2026',
        description:
          'An offline-first money tracker for Android and iOS. Everything lives in SQLite on the device, and Split Bill routes end-to-end encrypted packets through a relay that never sees an amount.',
        tech: ['React Native', 'Expo', 'SQLite', 'Ed25519', 'Cloudflare Workers'],
        links: [{ label: 'See it in the lab', href: '/labs' }],
      },
      {
        id: 'product-mybirth',
        type: 'project',
        title: 'MyBirth',
        date: '06-2026',
        description:
          'A cinematic birth archive that reconstructs the moon, weather, headlines, music, film and symbols from the day someone arrived.',
        tech: ['Three.js', 'TypeScript', 'Vite'],
        links: [{ label: 'Open MyBirth', href: createSubdomainUrl('mybirth') }],
      },
      {
        id: 'product-what2watch',
        type: 'project',
        title: 'What2Watch',
        date: '07-2026',
        description:
          'A living wall of films and shows: a force-directed voronoi mosaic of poster tiles you can wander, filter by mood, or let surprise you.',
        tech: ['WebGL', 'React', 'TypeScript'],
        links: [{ label: 'Open What2Watch', href: createSubdomainUrl('what2watch') }],
      },
    ],
  },
];
