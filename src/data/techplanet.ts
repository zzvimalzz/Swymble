import type { SwymbleSkillCategory } from './types';

// TECH PLANET SECTION
// - category: orbital domain shown around the core planet
// - context: short copy shown when the orbit is focused
// - items[].name: moon label shown in the scene and hover tooltip
// - items[].color: hex color used for moon glow and orbit accents
// - items[].description: optional label text shown below the moon name
export const SWYMBLE_TECH_PLANET: SwymbleSkillCategory[] = [
  {
    category: 'LANGUAGES',
    context: 'Core syntax, type systems, and everyday problem solving.',
    items: [
      { name: 'PHP', color: '#777BB4', description: 'Backend delivery and server-rendered systems.' },
      { name: 'Python', color: '#3776AB', description: 'Automation, scripting, and data workflows.' },
      { name: 'HTML/CSS', color: '#E34F26', description: 'Responsive interfaces and layout systems.' },
      { name: 'PL/SQL', color: '#F29111', description: 'Database logic and enterprise reporting.' },
      { name: 'JavaScript', color: '#F7DF1E', description: 'Interactive browser experiences.' },
      { name: 'TypeScript', color: '#3178C6', description: 'Typed frontend application code.' },
    ],
  },
  {
    category: 'Backend & APIs',
    context: 'Server logic, integrations, and reliable application foundations.',
    items: [
      { name: 'REST APIs', color: '#0096D6', description: 'Clean contracts for connected products.' },
      { name: 'Batch Jobs', color: '#A8B9CC', description: 'Scheduled processing and operational tasks.' },
      { name: 'Workflow Logic', color: '#10A54A', description: 'Business rules that keep systems moving.' },
    ],
  },
  {
    category: 'Databases & DevOps',
    context: 'Data storage, delivery pipelines, and production operations.',
    items: [
      { name: 'PostgreSQL', color: '#336791', description: 'Relational data modeling and querying.' },
      { name: 'MySQL', color: '#4479A1', description: 'Practical application data storage.' },
      { name: 'Neo4j', color: '#018BFF', description: 'Graph relationships and connected data.' },
      { name: 'Docker', color: '#2496ED', description: 'Portable local and deployment environments.' },
      { name: 'CI/CD Pipelines', color: '#F05032', description: 'Repeatable build and release flow.' },
      { name: 'Linux', color: '#FCC624', description: 'Shell workflows and server operations.' },
    ],
  },
  {
    category: 'AI & Data',
    context: 'Retrieval, orchestration, and intelligent data workflows.',
    items: [
      { name: 'Retrieval-Augmented Generation (RAG)', color: '#FF6A00', description: 'Grounded answers from structured knowledge.' },
      { name: 'Vector & Graph Search', color: '#00B4AB', description: 'Semantic lookup and relationship discovery.' },
      { name: 'Multi-Agent Orchestration', color: '#9B59B6', description: 'Coordinated workflows across AI tools.' },
      { name: 'Claude Code', color: '#D19A66', description: 'Agentic coding and implementation support.' },
      { name: 'ChatGPT Codex', color: '#10A37F', description: 'Code generation and product iteration.' },
    ],
  },
  {
    category: 'Domains',
    context: 'The product spaces and business systems I build for.',
    items: [
      { name: 'Fintech & Banking Systems', color: '#1E3A8A', description: 'Secure workflows for financial products.' },
      { name: 'Loan Origination', color: '#16A34A', description: 'Application journeys and approval logic.' },
      { name: 'Production Support', color: '#DC2626', description: 'Stability, triage, and operational fixes.' },
      { name: 'AI Automation Systems', color: '#7C3AED', description: 'Automated assistants for real workflows.' },
    ],
  },
];