// Reads src/data/labs/*.ts for the build scripts (sitemap, prerendering, llms.txt).
//
// Why parse instead of `import()`: two lab files import a value (`createSubdomainUrl`) from
// '../../utils/siteUrls' with no file extension. Node strips TypeScript types happily, but ESM
// resolution rejects an extensionless relative specifier, so a native import of those modules
// fails outright. Rather than special-casing them — or reshaping data files to suit a build
// script — the fields the scripts need are read out of the source directly, the same approach
// loadBlogPosts() already takes for src/data/blog/posts/*.ts.
//
// What the scripts need is only the flat metadata: ids, names, descriptions, and the long-form
// copy that goes into llms-full.txt. The rendered page content and its JSON-LD come from the
// React app itself, captured by scripts/prerender-snapshot.mjs in a real browser, so nothing
// here has to reproduce the page.
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { ROOT_DIR } from './route-data.mjs';
import {
  findBlockStart,
  readBalancedBlock,
  readObjectArrayField,
  readStringArrayField,
  readStringField,
} from './ts-source.mjs';

export const LABS_DIR = path.join(ROOT_DIR, 'src', 'data', 'labs');

const parseLabSource = (source, fallbackId) => {
  // Split the card fields from the `detail` block so a key that exists in both (there is none
  // today, but `tagline` and `title` are the kind of name that gets reused) can't cross over.
  const detailStart = findBlockStart(source, 'detail', '{');
  const detailBody = detailStart === null ? '' : (readBalancedBlock(source, detailStart, '{', '}') ?? '');
  const cardBody = detailStart === null ? source : source.slice(0, detailStart);

  const title = readStringField(cardBody, 'title') ?? fallbackId;

  return {
    id: readStringField(cardBody, 'id') ?? fallbackId,
    title,
    // Mirrors labDisplayName() in src/utils/labSeo.ts.
    seoName: readStringField(cardBody, 'seoName') ?? title,
    category: readStringField(cardBody, 'category') ?? '',
    status: readStringField(cardBody, 'status') ?? '',
    visibility: readStringField(cardBody, 'visibility') ?? 'public',
    publicSummary: readStringField(cardBody, 'publicSummary') ?? '',
    safeHighlights: readStringArrayField(cardBody, 'safeHighlights'),
    tags: readStringArrayField(cardBody, 'tags'),
    updatedAt: readStringField(cardBody, 'updatedAt') ?? '',
    order: Number(/\border\s*:\s*(\d+)/.exec(cardBody)?.[1] ?? '999'),
    detail: detailBody
      ? {
          oneLiner: readStringField(detailBody, 'oneLiner') ?? '',
          tagline: readStringField(detailBody, 'tagline') ?? '',
          overview: readStringArrayField(detailBody, 'overview'),
          features: readObjectArrayField(detailBody, 'features', ['title', 'body']),
          specs: readObjectArrayField(detailBody, 'specs', ['label', 'value']),
          faq: readObjectArrayField(detailBody, 'faq', ['question', 'answer']),
        }
      : null,
  };
};

/**
 * Every lab that is allowed on the public site, in display order. `private` labs are filtered
 * out here rather than by each caller, so a lab can never be excluded from /labs but still be
 * listed in the sitemap or described in llms.txt.
 */
export const loadLabs = async () => {
  const entries = await fs.readdir(LABS_DIR, { withFileTypes: true });
  const labFiles = entries
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter((fileName) => fileName.endsWith('.ts') && fileName !== 'index.ts')
    .sort();

  const labs = [];

  for (const fileName of labFiles) {
    const source = await fs.readFile(path.join(LABS_DIR, fileName), 'utf8');
    labs.push(parseLabSource(source, fileName.replace(/\.ts$/, '')));
  }

  return labs.filter((lab) => lab.visibility !== 'private').sort((a, b) => a.order - b.order);
};

/** Mirrors labSeoTitle() / labSeoDescription() in src/utils/labSeo.ts. */
export const labRoutePath = (lab) => `/labs/${lab.id}`;

export const labSeoTitle = (lab, siteName = 'SWYMBLE') =>
  lab.detail?.tagline
    ? `${lab.seoName} — ${lab.detail.tagline} | ${siteName} Labs`
    : `${lab.seoName} | ${siteName} Labs`;

export const labSeoDescription = (lab) => {
  const source = lab.detail?.oneLiner || lab.publicSummary;
  if (source.length <= 160) return source;

  const clipped = source.slice(0, 159);
  const lastSpace = clipped.lastIndexOf(' ');
  return `${(lastSpace > 0 ? clipped.slice(0, lastSpace) : clipped).replace(/[,;:.\s]+$/, '')}…`;
};
