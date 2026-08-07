// Everything a lab's own page at /labs/<id> needs in order to be found: its URL, its title and
// description, and its structured data.
//
// This module is deliberately dependency-light — its only import is a type — because the build
// scripts (scripts/lib/route-data.mjs) `import()` it directly under Node to generate the sitemap,
// the prerendered HTML and llms.txt. If the page title in a search result ever disagrees with the
// title in the sitemap, it is because someone added a second copy of this logic somewhere.

import type { SwymbleLab } from '../data/types';

export const SWYMBLE_SITE_URL = 'https://swymble.com';
export const SITE_NAME = 'SWYMBLE';
export const LABS_ROUTE = '/labs';

/** Meta descriptions get truncated by search engines somewhere around here. */
const DESCRIPTION_BUDGET = 160;

export const labRoutePath = (labId: string) => `${LABS_ROUTE}/${labId}`;

export const labCanonicalUrl = (labId: string) => `${SWYMBLE_SITE_URL}${labRoutePath(labId)}`;

/**
 * The lab's name in normal casing. `title` is upper case because the card grid's type treatment
 * wants it that way; a page title, a JSON-LD `name` or an assistant's answer does not.
 */
export const labDisplayName = (lab: SwymbleLab) => lab.seoName ?? lab.title;

/**
 * `<Name> — <what it is> | SWYMBLE Labs`.
 *
 * The name comes first because that is the query these pages exist to win ("mydompet",
 * "swymble territory"); the tagline is there so the result also matches the far more common
 * searches where someone describes the thing instead of naming it.
 */
export const labSeoTitle = (lab: SwymbleLab) => {
  const name = labDisplayName(lab);
  return lab.detail?.tagline
    ? `${name} — ${lab.detail.tagline} | ${SITE_NAME} Labs`
    : `${name} | ${SITE_NAME} Labs`;
};

/** Prefers the hand-written one-liner, which is built to stand alone; falls back to the card copy. */
export const labSeoDescription = (lab: SwymbleLab) => {
  const source = lab.detail?.oneLiner ?? lab.publicSummary;

  if (source.length <= DESCRIPTION_BUDGET) {
    return source;
  }

  // Cut on a word boundary rather than mid-word — a description ending in "…encr" reads as broken.
  const clipped = source.slice(0, DESCRIPTION_BUDGET - 1);
  const lastSpace = clipped.lastIndexOf(' ');
  return `${(lastSpace > 0 ? clipped.slice(0, lastSpace) : clipped).replace(/[,;:.\s]+$/, '')}…`;
};

/** The lab's live URL, if it has one (mybirth.swymble.com, watchpaintdry.net, …). */
export const labExternalUrl = (lab: SwymbleLab) => {
  const actions = lab.actions?.length ? lab.actions : lab.primaryAction ? [lab.primaryAction] : [];
  return actions.find((action) => action.kind === 'external')?.href;
};

/** The lab's logo — a product image, which is what structured data wants. */
export const labImageUrl = (lab: SwymbleLab) =>
  /^https?:\/\//i.test(lab.image) ? lab.image : `${SWYMBLE_SITE_URL}${lab.image}`;

/**
 * The lab's 1200x630 social card, rendered at build time by scripts/generate-og-cards.mjs.
 *
 * Deliberately not the logo: logos are square, social cards are 1.91:1, and a shared link that
 * letterboxes a small square on a grey field is the least informative version of a page that has
 * a name, a pitch and a status to show.
 */
export const labSocialImageUrl = (lab: SwymbleLab) => `${SWYMBLE_SITE_URL}/images/og/${lab.id}.png`;

/**
 * A live lab is a real, usable application; an unreleased one is not, and calling it a
 * SoftwareApplication that anyone can go and run would be a false claim in structured data.
 */
const labSchemaType = (lab: SwymbleLab) => (lab.status === 'Live' ? 'SoftwareApplication' : 'CreativeWork');

/**
 * The lab page's structured data, as a @graph:
 *
 * - the product itself, attributed to the sitewide Organization node declared in index.html, so
 *   search engines and assistants tie "MyDompet" to "Swymble" rather than treating them as two
 *   unrelated things;
 * - breadcrumbs, so the page shows its place in the site rather than floating;
 * - FAQPage, when the lab has questions — this is the block that answer engines lift verbatim
 *   when someone asks "what is <lab>?".
 */
export const labJsonLd = (lab: SwymbleLab) => {
  const url = labCanonicalUrl(lab.id);
  const name = labDisplayName(lab);
  const externalUrl = labExternalUrl(lab);

  const product: Record<string, unknown> = {
    '@type': labSchemaType(lab),
    '@id': `${url}#product`,
    name,
    alternateName: lab.title === name ? undefined : lab.title,
    url: externalUrl ?? url,
    description: lab.detail?.oneLiner ?? lab.publicSummary,
    image: labImageUrl(lab),
    applicationCategory: lab.category
      .toLowerCase()
      .replace(/\b\w/g, (character) => character.toUpperCase()),
    keywords: lab.tags.join(', '),
    creator: { '@id': `${SWYMBLE_SITE_URL}/#organization` },
    publisher: { '@id': `${SWYMBLE_SITE_URL}/#organization` },
    isPartOf: { '@type': 'CreativeWorkSeries', name: `${SITE_NAME} Labs`, url: `${SWYMBLE_SITE_URL}${LABS_ROUTE}` },
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
  };

  if (lab.status === 'Live') {
    // Only claim a price for something a person can actually go and use right now.
    product.offers = { '@type': 'Offer', price: '0', priceCurrency: 'USD', availability: 'https://schema.org/InStock' };
  }

  const graph: Record<string, unknown>[] = [
    // Drop the keys left undefined above rather than serialising `"alternateName": undefined`.
    Object.fromEntries(Object.entries(product).filter(([, value]) => value !== undefined)),
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${SWYMBLE_SITE_URL}/` },
        { '@type': 'ListItem', position: 2, name: 'Labs', item: `${SWYMBLE_SITE_URL}${LABS_ROUTE}` },
        { '@type': 'ListItem', position: 3, name, item: url },
      ],
    },
  ];

  if (lab.detail?.faq?.length) {
    graph.push({
      '@type': 'FAQPage',
      '@id': `${url}#faq`,
      mainEntity: lab.detail.faq.map((entry) => ({
        '@type': 'Question',
        name: entry.question,
        acceptedAnswer: { '@type': 'Answer', text: entry.answer },
      })),
    });
  }

  return { '@context': 'https://schema.org', '@graph': graph };
};

/** ItemList for /labs — tells a crawler the page is an index of N named things, and what they are. */
export const labsIndexJsonLd = (labs: SwymbleLab[]) => ({
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  '@id': `${SWYMBLE_SITE_URL}${LABS_ROUTE}#collection`,
  name: `${SITE_NAME} Labs`,
  url: `${SWYMBLE_SITE_URL}${LABS_ROUTE}`,
  description:
    'Experimental products built by Swymble Labs, from AI research to mobile apps and browser toys.',
  isPartOf: { '@id': `${SWYMBLE_SITE_URL}/#website` },
  mainEntity: {
    '@type': 'ItemList',
    itemListOrder: 'https://schema.org/ItemListOrderAscending',
    numberOfItems: labs.length,
    itemListElement: labs.map((lab, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: labDisplayName(lab),
      description: lab.detail?.oneLiner ?? lab.publicSummary,
      url: labCanonicalUrl(lab.id),
    })),
  },
});
