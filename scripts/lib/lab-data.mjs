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

  // `visibility` is read from the WHOLE source, not from cardBody, and defaults to 'private'.
  //
  // Both parts matter. This one field is the only gate keeping an unreleased product out of the
  // sitemap, llms.txt, site-data.json (which the MCP server serves to any client), the .md twins
  // and the IndexNow submission — so where it happens to sit in the file must not decide whether
  // the product is published. Reading only the slice before `detail:` meant a lab that declared
  // `visibility` after its detail block would silently parse as public. There is no nested
  // `visibility` key inside `detail` for the wider search to collide with.
  //
  // Defaulting to 'private' means a parse failure hides a lab from the generated files rather
  // than exposing one. The data-integrity test asserts this parser and the app agree on exactly
  // which labs are public, so a lab disappearing here fails CI instead of going unnoticed.
  const visibility = readStringField(source, 'visibility') ?? 'private';

  return {
    id: readStringField(cardBody, 'id') ?? fallbackId,
    title,
    // Mirrors labDisplayName() in src/utils/labSeo.ts.
    seoName: readStringField(cardBody, 'seoName') ?? title,
    category: readStringField(cardBody, 'category') ?? '',
    // Public-root path to the lab's logo, e.g. '/images/labs/mydompet_logo.png'. Used by
    // generate-og-cards.mjs to put the product mark on the lab's social card.
    image: readStringField(cardBody, 'image') ?? '',
    status: readStringField(cardBody, 'status') ?? '',
    visibility,
    publicSummary: readStringField(cardBody, 'publicSummary') ?? '',
    safeHighlights: readStringArrayField(cardBody, 'safeHighlights'),
    tags: readStringArrayField(cardBody, 'tags'),
    updatedAt: readStringField(cardBody, 'updatedAt') ?? '',
    order: Number(/\border\s*:\s*(\d+)/.exec(cardBody)?.[1] ?? '999'),
    // Optional hand-set brand colour. generate-lab-palette.mjs prefers it over the hue it would
    // otherwise pull out of the logo.
    accentColor: readStringField(cardBody, 'accentColor') ?? '',
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
 * Every lab that is allowed on the public site, newest-updated first. `private` labs are filtered
 * out here rather than by each caller, so a lab can never be excluded from /labs but still be
 * listed in the sitemap or described in llms.txt.
 */
const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

/** Mirrors labRecency() in src/data/labs/index.ts. Unparseable copy sorts last, never first. */
const labRecency = (updatedAt) => {
  const match = /^([A-Za-z]{3})[a-z]*\s+(\d{4})$/.exec((updatedAt ?? '').trim());
  if (!match) return -1;
  const month = MONTHS.indexOf(match[1].toLowerCase());
  return month < 0 ? -1 : Number(match[2]) * 12 + month;
};

/** Mirrors compareLabs() in src/data/labs/index.ts. */
const compareLabs = (a, b) =>
  labRecency(b.updatedAt) - labRecency(a.updatedAt) || a.order - b.order || a.id.localeCompare(b.id);

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

  return labs.filter((lab) => lab.visibility !== 'private').sort(compareLabs);
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
