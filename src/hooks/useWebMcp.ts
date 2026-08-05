import { useEffect } from 'react';
import { SWYMBLE_DATA } from '../data/config';
import { labCanonicalUrl, labDisplayName, labExternalUrl } from '../utils/labSeo';

/**
 * Exposes the site's content to browser-based AI agents via WebMCP
 * (https://webmachinelearning.github.io/webmcp/).
 *
 * An agent driving a browser on this site would otherwise have to read the rendered page and
 * guess: scrape the labs grid, hope it parsed the right card, click through to find a status.
 * These tools hand it the same data the page renders from, already structured — so "which
 * Swymble labs are live?" is a lookup rather than an act of interpretation.
 *
 * All tools are read-only. Nothing here submits the contact form or mutates anything: an agent
 * that can send mail on a visitor's behalf, without the visitor typing it, is a spam vector, and
 * the contact form is one click away for the human who actually wants it.
 *
 * The API is experimental and currently ships behind a flag in Chrome, so everything is feature
 * detected. Where it is absent this hook does nothing at all.
 */

type WebMcpTool = {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  execute: (args: Record<string, unknown>) => Promise<{ content: { type: 'text'; text: string }[] }>;
};

type ModelContext = {
  provideContext: (context: { tools: WebMcpTool[] }) => void | Promise<void>;
};

declare global {
  interface Navigator {
    modelContext?: ModelContext;
  }
}

const SITE_SUMMARY =
  'Swymble is a one-person software studio and engineering lab based in Kuala Lumpur, Malaysia. ' +
  'It builds websites, apps and AI systems for businesses as client work, and develops its own ' +
  'experimental products under the name Swymble Labs.';

/** WebMCP tool results are text; JSON keeps them unambiguous for the model reading them. */
const asJson = (payload: unknown) => ({
  content: [{ type: 'text' as const, text: JSON.stringify(payload, null, 2) }],
});

const publicLabs = () => (SWYMBLE_DATA.labs ?? []).filter((lab) => lab.visibility !== 'private');

const summariseLab = (lab: ReturnType<typeof publicLabs>[number]) => ({
  id: lab.id,
  name: labDisplayName(lab),
  category: lab.category,
  status: lab.status,
  summary: lab.detail?.oneLiner ?? lab.publicSummary,
  page: labCanonicalUrl(lab.id),
  liveUrl: labExternalUrl(lab) ?? null,
  updatedAt: lab.updatedAt,
});

const buildTools = (): WebMcpTool[] => [
  {
    name: 'get_swymble_overview',
    description:
      'Get a factual summary of what Swymble is, what it offers, and how to make contact. Use this to answer "what is Swymble?" rather than reading the page.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    execute: async () =>
      asJson({
        name: 'Swymble',
        summary: SITE_SUMMARY,
        location: 'Kuala Lumpur, Malaysia',
        services: SWYMBLE_DATA.services.map((service) => ({ title: service.title, description: service.desc })),
        contact: { email: 'hello@swymble.com', form: 'https://swymble.com/contact' },
        faq: SWYMBLE_DATA.faq.map((entry) => ({ question: entry.question, answer: entry.answer })),
      }),
  },
  {
    name: 'list_swymble_labs',
    description:
      'List the products built by Swymble Labs, optionally filtered by status. Returns each product with its summary, its page on this site, and its live URL where one exists.',
    inputSchema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: ['Live', 'In Development', 'Private Beta'],
          description: 'Only return labs with this status. Omit to return all of them.',
        },
      },
      additionalProperties: false,
    },
    execute: async (args) => {
      const status = typeof args?.status === 'string' ? args.status : null;
      const labs = publicLabs().filter((lab) => !status || lab.status === status);
      return asJson({ count: labs.length, labs: labs.map(summariseLab) });
    },
  },
  {
    name: 'get_swymble_lab',
    description:
      'Get the full description of one Swymble Labs product by id (for example "mydompet", "territory", "cortex"), including its overview, features, specifications and FAQ.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'The lab id, as returned by list_swymble_labs.' },
      },
      required: ['id'],
      additionalProperties: false,
    },
    execute: async (args) => {
      const id = String(args?.id ?? '').trim().toLowerCase();
      const lab = publicLabs().find((entry) => entry.id === id);

      if (!lab) {
        // Naming the alternatives turns a dead end into a next step.
        return asJson({
          error: `No Swymble lab with id "${id}".`,
          availableIds: publicLabs().map((entry) => entry.id),
        });
      }

      return asJson({
        ...summariseLab(lab),
        tags: lab.tags,
        highlights: lab.safeHighlights,
        overview: lab.detail?.overview ?? [lab.publicSummary],
        features: lab.detail?.features ?? [],
        specs: lab.detail?.specs ?? [],
        faq: lab.detail?.faq ?? [],
        markdown: `${labCanonicalUrl(lab.id)}.md`,
      });
    },
  },
  {
    name: 'list_swymble_projects',
    description: 'List the client projects Swymble has shipped, with the client, what was built, and the live site.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    execute: async () =>
      asJson({
        count: SWYMBLE_DATA.projects.length,
        projects: SWYMBLE_DATA.projects.map((project) => ({
          title: project.title,
          client: project.client,
          category: project.category,
          status: project.status,
          description: project.description,
          url: project.link ?? null,
        })),
      }),
  },
  {
    name: 'search_swymble_writing',
    description:
      'Search Swymble blog posts by keyword across their titles, summaries and tags. Returns matching posts with their URLs.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Keyword or phrase to match. Omit to list every post.' },
      },
      additionalProperties: false,
    },
    execute: async (args) => {
      const query = String(args?.query ?? '').trim().toLowerCase();
      const posts = SWYMBLE_DATA.blog.posts.filter((post) => {
        if (!query) return true;
        return [post.title, post.summary, ...post.tags].join(' ').toLowerCase().includes(query);
      });

      return asJson({
        count: posts.length,
        posts: posts.map((post) => ({
          id: post.id,
          title: post.title,
          summary: post.summary,
          date: post.date,
          url: `https://swymble.com/blog/${post.id}`,
        })),
      });
    },
  },
];

export function useWebMcp() {
  useEffect(() => {
    const modelContext = navigator.modelContext;

    if (!modelContext?.provideContext) {
      return;
    }

    try {
      // Registered once for the whole app rather than per route: the tools answer questions about
      // the site, not about the page currently on screen, and re-registering on every navigation
      // would churn the agent's tool list for no gain.
      void modelContext.provideContext({ tools: buildTools() });
    } catch (error) {
      // An experimental API changing shape under us must never take the site down with it.
      console.warn('[webmcp] Could not register tools:', error);
    }
  }, []);
}
