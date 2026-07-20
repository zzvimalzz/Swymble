import type { SwymbleCareerBranch } from '../../types';

// TODO: confirm exact dates below — seeded to be chronologically consistent with the existing
// bio in data/about/about.ts (enterprise fintech background, Technical Lead for Change Requests,
// currently full-time employed while pursuing a Masters), not pulled from a verified record.
const branch: SwymbleCareerBranch = {
  id: 'main',
  label: 'main',
  category: 'career',
  status: 'ongoing',
  nodes: [
    {
      id: 'main-spm',
      type: 'education',
      title: 'SPM',
      date: '2013',
      description: 'Sijil Pelajaran Malaysia — secondary school completion.',
    },
    {
      id: 'main-segi',
      type: 'education',
      title: 'SEGi University',
      org: 'SEGi University',
      date: '2014',
      description: 'Started a degree in Computer Science.',
    },
    {
      id: 'main-deans-list',
      type: 'milestone',
      title: "Dean's List",
      org: 'SEGi University',
      date: '2016',
      description: 'Recognized for academic performance.',
    },
    {
      id: 'main-aia-internship',
      type: 'employment',
      title: 'AIA Internship',
      org: 'AIA',
      date: '2017',
      description: 'Internship in the insurance sector — first production-adjacent work.',
    },
    {
      id: 'main-graduation',
      type: 'education',
      title: 'Graduation',
      org: 'SEGi University',
      date: '2018',
      description: 'Completed the degree in Computer Science.',
    },
    {
      id: 'main-juristech',
      type: 'employment',
      title: 'JurisTech',
      org: 'JurisTech',
      date: '2018',
      description:
        'Joined as a software engineer building and supporting fintech and banking systems for enterprise clients across banking and telco. Technical Lead for Change Requests, owning the full lifecycle from requirements to production deployment; resolved high-priority incidents under strict SLAs.',
      tech: ['PHP', 'PL/SQL', 'REST APIs', 'Batch Jobs'],
    },
    {
      id: 'main-masters',
      type: 'education',
      title: 'Masters',
      org: 'University Malaya',
      date: '2023',
      description: 'Pursuing a Masters degree alongside full-time work at JurisTech.',
    },
    {
      id: 'main-present',
      type: 'milestone',
      title: 'Present',
      date: '2026',
      description:
        'Daylight goes to JurisTech and the Masters degree; the rest goes to Swymble — client work, labs, and one deliberately pointless masterpiece.',
    },
  ],
};

export default branch;
