import type { SwymbleResume } from './types';

// RESUME (/resume — the one-page employer view)
//
// This file is an OVERLAY, not a second copy of the career. Roles, education and projects are
// read out of about/career/index.ts by utils/resumeModel.ts, so adding a job there puts it on the
// resume with no edit here. What lives below is only the part a CV needs and the site doesn't:
//
// - summary      the two or three sentences an employer reads first
// - excludeNodeIds  the career entries a CV leaves off (pre-degree education)
// - bullets      tighter, resume-voice rewrites keyed by career node id; anything without an
//                entry falls back to that node's own `description`
// - skillGroups  the skills matrix, grouped the way a CV groups it rather than as logo chips
export const SWYMBLE_RESUME: SwymbleResume = {
  // Falls back to the brand name ("SWYMBLE") while this is unset. Put a legal name here if the
  // employer version should read as a person rather than as the studio.
  // name: 'Your Name',
  name: 'Vimal',
  headline: 'Software Engineer · Backend, Platform & AI Systems',

  summary: [
    'I am a Software engineer with production experience on enterprise fintech platforms, where the data is money-critical, the audit trail matters and downtime has an SLA attached. Technical Lead on change delivery end to end: requirements, backend design, implementation, UAT and production deployment.',
    'I also run Swymble, a one-person studio shipping client websites and products solo, and builds AI, mobile and web products in the same stack. BSc (Hons) Computer Science specialising in Cyber Security; Masters of Cyber Security from October 2026.',
  ],

  excludeNodeIds: ['main-spm', 'foundation-program'],

  bullets: {
    'employment-juristech': [
      'Built and maintained enterprise platforms handling high-volume, money-critical operations across several industries and regulatory regimes.',
      'Technical Lead on change delivery end to end — requirements, backend design, implementation, UAT and production deployment.',
      'Owned batch pipelines, automated messaging workflows and the third-party integrations feeding them.',
      'Front line for critical production incidents under strict SLAs: workflow defects, data discrepancies, bulk upload failures and integration breakages.',
    ],
    'swymble-founded': [
      'Founded a one-person studio delivering production websites for Malaysian SMB clients: scoping, design, build, deployment and post-launch support.',
      'Ships solo end to end — brand and UI through to hosting, SEO and monitoring.',
    ],
    'employment-ibsolutions': [
      'Ongoing consulting engagement taken on through Swymble rather than as an in-house hire, after first delivering their build as a client.',
    ],
    'internship-aia': [
      'Worked across operations and product management during the final semester of the degree.',
      'Built Python and Selenium automation that took manual steps out of recurring operational processes.',
    ],
    'degree-program': [
      'Specialised in cyber security — threat analysis, network security and cryptography — alongside core software engineering.',
    ],
    'main-masters': ['Starting October 2026, taken alongside full-time work.'],
  },

  skillGroups: [
    {
      id: 'languages',
      label: 'Languages',
      items: ['PHP', 'TypeScript', 'JavaScript', 'Python', 'SQL / PL-SQL', 'Java', 'C / C++'],
    },
    {
      id: 'backend',
      label: 'Backend & data',
      items: [
        'REST APIs',
        'Batch pipelines',
        'DB2',
        'MariaDB / MySQL',
        'PostgreSQL',
        'MongoDB',
        'Redis',
        'Neo4j',
      ],
    },
    {
      id: 'frontend',
      label: 'Frontend & mobile',
      items: ['React', 'Next.js', 'React Native (Expo)', 'Vite', 'Three.js / WebGL'],
    },
    {
      id: 'platform',
      label: 'Platform & delivery',
      items: ['Docker', 'CI/CD', 'AWS', 'Cloudflare Workers', 'Linux', 'Git / GitHub Actions'],
    },
    {
      id: 'practice',
      label: 'Ways of working',
      items: [
        'Change-request delivery',
        'Incident response under SLA',
        'UAT & production deploy',
        'Agile',
        'Threat analysis',
        'Cryptography',
      ],
    },
  ],
};
