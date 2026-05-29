import type { SwymbleSkillCategory } from './types';

// TECH PLANET SECTION
// - category: orbital domain shown around the core planet
// - context: short copy shown when the orbit is focused
// - items[].name: moon label shown in the scene and hover tooltip
// - items[].color: hex color used for moon glow and orbit accents
// - items[].moonModelId: optional model pin; valid ids are moon-01 through moon-08
export const SWYMBLE_TECH_PLANET: SwymbleSkillCategory[] = [
  {
    category: 'LANGUAGES',
    context: 'Core syntax, type systems, and everyday problem solving.',
    items: [
      { name: 'PHP', color: '#777BB4', moonModelId: 'moon-01' },
      { name: 'Python', color: '#3776AB', moonModelId: 'moon-02' },
      { name: 'HTML/CSS', color: '#E34F26', moonModelId: 'moon-03' },
      { name: 'PL/SQL', color: '#F29111', moonModelId: 'moon-04' },
      { name: 'JavaScript', color: '#F7DF1E', moonModelId: 'moon-05' },
      { name: 'TypeScript', color: '#3178C6', moonModelId: 'moon-06' },
    ],
  },
  {
    category: 'Backend & APIs',
    context: 'Server logic, integrations, and reliable application foundations.',
    items: [
      { name: 'REST APIs', color: '#0096D6', moonModelId: 'moon-07' },
      { name: 'Batch Jobs', color: '#A8B9CC', moonModelId: 'moon-08' },
      { name: 'Workflow Logic', color: '#10A54A', moonModelId: 'moon-01' },
    ],
  },
  {
    category: 'Databases & DevOps',
    context: 'Data storage, delivery pipelines, and production operations.',
    items: [
      { name: 'PostgreSQL', color: '#336791', moonModelId: 'moon-08' },
      { name: 'MySQL', color: '#4479A1', moonModelId: 'moon-07' },
      { name: 'Neo4j', color: '#018BFF', moonModelId: 'moon-06' },
      { name: 'Docker', color: '#2496ED', moonModelId: 'moon-05' },
      { name: 'CI/CD Pipelines', color: '#F05032', moonModelId: 'moon-04' },
      { name: 'Linux', color: '#FCC624', moonModelId: 'moon-03' },
    ],
  },
  {
    category: 'AI & Data',
    context: 'Retrieval, orchestration, and intelligent data workflows.',
    items: [
      { name: 'Retrieval-Augmented Generation (RAG)', color: '#FF6A00', moonModelId: 'moon-02' },
      { name: 'Vector & Graph Search', color: '#00B4AB', moonModelId: 'moon-01' },
      { name: 'Multi-Agent Orchestration', color: '#9B59B6', moonModelId: 'moon-03' },
      { name: 'Claude Code', color: '#D19A66', moonModelId: 'moon-04' },
      { name: 'ChatGPT Codex', color: '#10A37F', moonModelId: 'moon-05' },
    ],
  },
  {
    category: 'Domains',
    context: 'The product spaces and business systems I build for.',
    items: [
      { name: 'Fintech & Banking Systems', color: '#1E3A8A', moonModelId: 'moon-06' },
      { name: 'Loan Origination', color: '#16A34A', moonModelId: 'moon-07' },
      { name: 'Production Support', color: '#DC2626', moonModelId: 'moon-08' },
      { name: 'AI Automation Systems', color: '#7C3AED', moonModelId: 'moon-01' },
    ],
  },
];