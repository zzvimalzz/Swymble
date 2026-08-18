import type { SwymbleLab } from '../types';

const lab: SwymbleLab = {
  id: 'cortex',
  title: 'CORTEX',
  seoName: 'Cortex',
  category: 'ARTIFICIAL INTELLIGENCE',
  image: '/images/labs/cortex_logo.png',
  status: 'Archived',
  visibility: 'public',
  publicSummary:
    'A proprietary cognitive platform focused on long-context memory and operator decision support for complex digital workflows.',
  safeHighlights: [
    'Private architecture under active R&D',
    'Operator-first UX experiments',
    'Controlled pilot evaluations in progress',
  ],
  tags: ['AI', 'R&D', 'Private'],
  updatedAt: 'Mar 2026',
  order: 10,
  detail: {
    oneLiner:
      'Cortex is a Swymble Labs AI platform built around persistent long-context memory and operator decision support for complex digital workflows.',
    tagline: 'AI Memory Platform',
    overview: [
      'Cortex is Swymble’s AI research project: a cognitive platform whose whole premise is that an assistant is only useful over a long engagement if it can remember one. It is aimed at operator decision support — the person driving a complex digital workflow — rather than at one-off question answering.',
      'Architecturally it is built on persistent memory with a hybrid retrieval layer over pgvector and Redis, fronted by a multi-provider LLM gateway with failover so no single model provider is a single point of failure.',
      'The interface side is treated as its own research problem. Cortex’s UX experiments are operator-first: what a person needs to see to trust and correct a system that is holding context on their behalf.',
      'Cortex is under active R&D, with the detailed architecture private and controlled pilot evaluations in progress.',
    ],
    features: [
      {
        title: 'Persistent long-context memory',
        body: 'Context carries across sessions instead of resetting, which is what makes the platform useful for ongoing work rather than single questions.',
      },
      {
        title: 'Hybrid retrieval',
        body: 'Retrieval runs over pgvector and Redis together, trading off semantic recall against latency.',
      },
      {
        title: 'Multi-provider LLM gateway',
        body: 'Model calls route through a gateway with failover across providers, so one provider outage is not a platform outage.',
      },
      {
        title: 'Operator-first UX',
        body: 'The interface research focuses on what an operator needs in order to trust, inspect and correct the system’s memory.',
      },
    ],
    specs: [
      { label: 'Category', value: 'Artificial intelligence, R&D' },
      { label: 'Retrieval', value: 'pgvector and Redis hybrid' },
      { label: 'Model access', value: 'Multi-provider gateway with failover' },
      { label: 'Status', value: 'In development — controlled pilots' },
    ],
    faq: [
      {
        question: 'What is Cortex?',
        answer:
          'Cortex is an AI platform built by Swymble Labs. It focuses on persistent long-context memory and operator decision support, using a hybrid pgvector and Redis retrieval layer behind a multi-provider LLM gateway.',
      },
      {
        question: 'Is Cortex publicly available?',
        answer:
          'No. Cortex is under active R&D with a private architecture and controlled pilot evaluations. Private demos can be requested by email at hello@swymble.com.',
      },
    ],
  },
  blogCategoryId: 'cortex',
};

export default lab;
