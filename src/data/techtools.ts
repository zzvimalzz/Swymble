import type { SwymbleSkillCategory } from './types';

// TECH & TOOLS SECTION
// - category: heading shown in the skill area
// - items[].name: label shown in tooltip/legend
// - items[].color: hex color used in segmented bars
// - items[].level: percentage (0-100) used for segment width
export const SWYMBLE_TECH_TOOLS: SwymbleSkillCategory[] = [
  {
    category: 'LANGUAGES',
    items: [
      { name: 'PHP', color: '#777BB4', level: 80 },
      { name: 'Python', color: '#3776AB', level: 60 },
      { name: 'HTML/CSS', color: '#E34F26', level: 45 },
      { name: 'PL/SQL', color: '#F29111', level: 60 },
      { name: 'JavaScript', color: '#F7DF1E', level: 55 },
      { name: 'TypeScript', color: '#3178C6', level: 45 },
    ],
  },
  {
    category: 'Backend & APIs',
    items: [
      { name: 'REST APIs', color: '#0096D6', level: 70 },
      { name: 'Batch Jobs', color: '#A8B9CC', level: 65 },
      { name: 'Workflow Logic', color: '#10A54A', level: 75 },
    ],
  },
  {
    category: 'Databases & DevOps',
    items: [
      { name: 'PostgreSQL', color: '#336791', level: 55 },
      { name: 'MySQL', color: '#4479A1', level: 40 },
      { name: 'Neo4j', color: '#018BFF', level: 45 },
      { name: 'Docker', color: '#2496ED', level: 55 },
      { name: 'CI/CD Pipelines', color: '#F05032', level: 60 },
      { name: 'Linux', color: '#FCC624', level: 40 },
    ],
  },
  {
    category: 'AI & Data',
    items: [
      { name: 'Retrieval-Augmented Generation (RAG)', color: '#FF6A00', level: 65 },
      { name: 'Vector & Graph Search', color: '#00B4AB', level: 60 },
      { name: 'Multi-Agent Orchestration', color: '#9B59B6', level: 55 },
      { name: 'Claude Code', color: '#D19A66', level: 45 },
      { name: 'ChatGPT Codex', color: '#10A37F', level: 45 },
    ],
  },
  {
    category: 'Domains',
    items: [
      { name: 'Fintech & Banking Systems', color: '#1E3A8A', level: 85 },
      { name: 'Loan Origination', color: '#16A34A', level: 80 },
      { name: 'Production Support', color: '#DC2626', level: 80 },
      { name: 'AI Automation Systems', color: '#7C3AED', level: 65 },
    ],
  },
];
