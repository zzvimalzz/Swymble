// Page-level structured data for the two routes that exist to describe an entity.
//
// index.html declares the sitewide graph — Organization, Person, WebSite — each with an `@id`.
// What it cannot say is which *page* is the authoritative description of which node. Without that
// link, /about is a page that happens to contain the word Swymble a lot; with it, /about is
// declared to be the page about the Swymble organisation, and /resume the page about the person
// behind it. That is the statement a search engine needs in order to attach a query like "what is
// Swymble?" to an entity rather than to a bag of matching words, and it is the same statement an
// answer engine leans on when deciding which page to quote.
//
// Everything here references the existing `@id` anchors instead of restating name, logo or
// description. Redefining a node is how a site ends up with two Organizations that happen to share
// a name, which is worse than not describing it twice.

import { SITE_URL } from '../routes';

const ORGANIZATION_ID = `${SITE_URL}/#organization`;
const PERSON_ID = `${SITE_URL}/#person`;
const WEBSITE_ID = `${SITE_URL}/#website`;
const LOGO_ID = `${SITE_URL}/#logo`;

type PageDescriptor = {
  path: string;
  title: string;
  description: string;
};

/**
 * `AboutPage` for /about and `ProfilePage` for /resume, or null for every other route.
 *
 * Both types are ones Google documents support for; the pairing that matters is `mainEntity`,
 * which is the field that says "this page's subject is that node" rather than merely mentioning
 * it. `about` carries the same target for consumers that read one and not the other.
 */
export const pageEntityJsonLd = ({ path, title, description }: PageDescriptor) => {
  const url = `${SITE_URL}${path}`;

  const base = {
    '@context': 'https://schema.org',
    '@id': `${url}#webpage`,
    url,
    name: title,
    description,
    isPartOf: { '@id': WEBSITE_ID },
    inLanguage: 'en',
  };

  if (path === '/about') {
    return {
      ...base,
      '@type': 'AboutPage',
      about: { '@id': ORGANIZATION_ID },
      mainEntity: { '@id': ORGANIZATION_ID },
      primaryImageOfPage: { '@id': LOGO_ID },
    };
  }

  if (path === '/resume') {
    return {
      ...base,
      '@type': 'ProfilePage',
      about: { '@id': PERSON_ID },
      mainEntity: { '@id': PERSON_ID },
    };
  }

  return null;
};
