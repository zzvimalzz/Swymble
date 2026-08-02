import type { SwymbleAbout } from '../types';

// ABOUT PAGE
// The page reads as a git repository. Each field below feeds one section of it — see
// README.md in this folder for the field-by-field reference.
export const SWYMBLE_ABOUT: SwymbleAbout = {
  title: 'ABOUT ME',
  repo: 'swymble engineer',
  role: 'Software Engineer · Entrepreneur',
  location: 'Kuala Lumpur, Malaysia',
  availability: {
    state: 'open',
    label: 'Open for client work',
  },
  intro: [
    'Software engineer. I work on backend systems, APIs and AI platforms, the kind that handle real volume and are not allowed to quietly get it wrong.',
    'Swymble is my studio and my lab: client builds, my own products, and whatever I wanted to find out whether I could make work.',
  ],

  readme: [
    {
      id: 'engineering',
      heading: 'Engineering',
      body: 'I build backend systems and APIs: workflow engines, batch pipelines, integrations between things that were never designed to talk to each other, and the authorisation logic around them. Most of that experience came from enterprise platforms where the data is money-critical, the audit trail matters and downtime has an SLA attached. I have led change delivery end to end, from requirements through design, build, UAT and production deploy, and spent plenty of time on the incident side of it too.',
    },
    {
      id: 'studio',
      heading: 'Studio',
      body: 'Swymble takes client work: company profiles, product builds and AI-powered systems, delivered solo end to end. Scoping, UI/UX, implementation, deploy, and the support afterwards. What started as one client turned into an ongoing consulting engagement, which is roughly how I like it to go.',
      proof: [
        { label: 'IB Solutions', href: '/projects#ib-solutions' },
        { label: 'All projects', href: '/projects' },
      ],
    },
    {
      id: 'lab',
      heading: 'Lab',
      body: 'The rest is R&D. Cortex, an AI platform with persistent memory and a hybrid retrieval architecture over pgvector and Redis, plus a multi-provider LLM gateway with failover. MyDompet, an offline-first money tracker that keeps every transaction on your own phone. What2Watch, a force-directed voronoi wall of films. MyBirth, a cinematic birth archive. And one deliberately pointless masterpiece that is exactly what its name says.',
      proof: [
        { label: 'Swymble Labs', href: '/labs' },
        { label: 'Watch Paint Dry', href: 'https://www.watchpaintdry.net/' },
        { label: 'Write-ups', href: '/blog' },
      ],
    },
  ],

  pullQuote: 'Build it like it has to survive production, whatever size it is.',

  stack: [
    {
      id: 'php',
      name: 'PHP',
      icon: '/images/stack_icons/php.png',
      role: 'Primary language at work',
      usedIn: ['JurisTech loan origination', 'Collections platforms', 'Client builds'],
    },
    {
      id: 'typescript',
      name: 'TypeScript',
      icon: '/images/stack_icons/typescript.png',
      role: 'Primary language outside work',
      usedIn: ['Swymble', 'What2Watch', 'MyBirth', 'MyDompet'],
    },
    {
      id: 'javascript',
      name: 'JavaScript',
      icon: '/images/stack_icons/javascript.png',
      role: 'Enterprise front ends and tooling',
      usedIn: ['JurisTech UI work', 'Browser extensions', 'Canvas and WebGL scenes'],
    },
    {
      id: 'python',
      name: 'Python',
      icon: '/images/stack_icons/python.png',
      role: 'Automation and data',
      usedIn: ['AIA internship automation', 'Selenium tooling', 'Pandas and NumPy'],
    },
    {
      id: 'react',
      name: 'React',
      icon: '/images/stack_icons/react.png',
      role: 'UI everywhere, web and native',
      usedIn: ['Swymble', 'What2Watch', 'MyDompet (React Native)'],
    },
    {
      id: 'nextjs',
      name: 'Next.js',
      icon: '/images/stack_icons/nextjs.png',
      role: 'Client sites that need routing and SSR',
      usedIn: ['Client builds'],
    },
    {
      id: 'vite',
      name: 'Vite',
      icon: '/images/stack_icons/vite.png',
      role: 'Build tool of choice',
      usedIn: ['Swymble', 'What2Watch', 'MyBirth'],
    },
    {
      id: 'nodejs',
      name: 'Node.js',
      icon: '/images/stack_icons/nodejs.png',
      role: 'Services, scripts, build pipelines',
      usedIn: ['Prerender and SEO tooling', 'Client APIs'],
    },
    {
      id: 'threejs',
      name: 'Three.js',
      icon: '/images/stack_icons/threejs.png',
      role: 'Real-time 3D on the web',
      usedIn: ['Swymble universe scene', 'MyBirth'],
    },
    {
      id: 'postgresql',
      name: 'PostgreSQL',
      icon: '/images/stack_icons/postgresql.png',
      role: 'Relational default for new builds',
      usedIn: ['Client projects'],
    },
    {
      id: 'mysql',
      name: 'MySQL / MariaDB',
      icon: '/images/stack_icons/mysql.png',
      role: 'Production databases at work',
      usedIn: ['JurisTech platforms', 'Client hosting'],
    },
    {
      id: 'mongodb',
      name: 'MongoDB',
      icon: '/images/stack_icons/mongodb.png',
      role: 'Document storage',
      usedIn: ['JurisTech services'],
    },
    {
      id: 'redis',
      name: 'Redis',
      icon: '/images/stack_icons/redis.png',
      role: 'Caching and queues',
      usedIn: ['Client projects'],
    },
    {
      id: 'neo4j',
      name: 'Neo4j',
      icon: '/images/stack_icons/neo4j.png',
      role: 'Graph storage',
      usedIn: ['Cortex R&D'],
    },
    {
      id: 'docker',
      name: 'Docker',
      icon: '/images/stack_icons/docker.png',
      role: 'Local environments and CI images',
      usedIn: ['JurisTech', 'Every personal project'],
    },
    {
      id: 'aws',
      name: 'AWS',
      icon: '/images/stack_icons/aws.png',
      role: 'Hosting and deployment',
      usedIn: ['Client infrastructure'],
    },
    {
      id: 'linux',
      name: 'Linux',
      icon: '/images/stack_icons/linux.png',
      role: 'Where the production systems live',
      usedIn: ['Server administration', 'Daily driver'],
    },
    {
      id: 'github',
      name: 'GitHub',
      icon: '/images/stack_icons/github.png',
      role: 'Version control and CI',
      usedIn: ['Every project', 'Actions pipelines'],
    },
    {
      id: 'claude',
      name: 'Claude',
      icon: '/images/stack_icons/claude.png',
      role: 'AI-assisted delivery',
      usedIn: ['Cortex R&D', 'Day-to-day build work'],
    },
    {
      id: 'chatgpt',
      name: 'ChatGPT',
      icon: '/images/stack_icons/chatgpt.png',
      role: 'AI-assisted delivery',
      usedIn: ['Research and drafting'],
    },
  ],

  skillDomains: [
    {
      id: 'backend',
      label: 'Backend and delivery',
      items: [
        'REST APIs',
        'PL/SQL',
        'Batch pipelines',
        'Change Request delivery',
        'Incident response under SLA',
        'CI/CD',
      ],
    },
    {
      id: 'mobile',
      label: 'Mobile',
      items: ['React Native', 'Expo (SDK 54)', 'EAS builds', 'On-device SQLite', 'Offline-first'],
    },
    {
      id: 'security',
      label: 'Security',
      items: [
        'Threat analysis',
        'Network security',
        'Cryptography',
        'Ed25519 signing',
        'Regulatory workflows',
      ],
    },
  ],

  config: [
    { key: 'user.role', value: 'software engineer' },
    { key: 'user.location', value: 'Kuala Lumpur, MY' },
    { key: 'user.email', value: 'hello@swymble.com', href: 'mailto:hello@swymble.com' },
    { key: 'core.editor', value: 'vscode' },
    { key: 'core.principle', value: 'make it correct, then make it fast' },
    { key: 'init.defaultBranch', value: 'main' },
    { key: 'alias.ship', value: 'build && deploy && sleep' },
    { key: 'alias.debug', value: 'read the logs, then read them again' },
    { key: 'fun.pointlessMasterpiece', value: 'watchpaintdry.net', href: 'https://www.watchpaintdry.net/' },
    { key: 'commit.gpgSign', value: 'true' },
    { key: 'pull.rebase', value: 'true (merge commits are a mess)' },
  ],

  currently: [
    {
      id: 'building',
      label: 'Building',
      value: 'Cortex',
      detail: 'An AI platform with persistent memory and hybrid retrieval. Private R&D.',
    },
    {
      id: 'shipping',
      label: 'Shipping',
      value: 'Client work through Swymble',
      detail: 'Company profiles, product builds, AI-powered systems.',
    },
    {
      id: 'joining',
      label: 'Joining',
      value: 'IB Solutions',
      detail: 'Technology Consultant from September 2026, after building their site as a client.',
    },
    {
      id: 'learning',
      label: 'Learning',
      value: 'Masters of Cyber Security',
      detail: 'Universiti Malaya, starting October 2026, alongside full-time work.',
    },
    {
      id: 'avoiding',
      label: 'Avoiding',
      value: 'Meetings that could have been a Jira comment',
    },
  ],
};
