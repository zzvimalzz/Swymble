import { promises as fs } from 'node:fs';
import path from 'node:path';
import { ROOT_DIR, loadRouteData, loadBlogPosts } from './lib/route-data.mjs';
import { loadLabs, labRoutePath } from './lib/lab-data.mjs';

const OUTPUT_PATH = path.join(ROOT_DIR, 'public', 'sitemap.xml');

const STATIC_ROUTE_META = {
  '/': { changefreq: 'weekly', priority: '1.0' },
  '/projects': { changefreq: 'monthly', priority: '0.8' },
  '/labs': { changefreq: 'weekly', priority: '0.8' },
  '/contact': { changefreq: 'monthly', priority: '0.8' },
  '/about': { changefreq: 'monthly', priority: '0.7' },
  '/resume': { changefreq: 'monthly', priority: '0.7' },
  '/blog': { changefreq: 'weekly', priority: '0.8' },
};
const DEFAULT_ROUTE_META = { changefreq: 'monthly', priority: '0.6' };

const escapeXml = (value) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

const buildUrlNode = ({ loc, changefreq, priority, lastmod }) => {
  const lines = ['  <url>', `    <loc>${escapeXml(loc)}</loc>`];

  if (lastmod) {
    lines.push(`    <lastmod>${escapeXml(lastmod)}</lastmod>`);
  }

  if (changefreq) {
    lines.push(`    <changefreq>${escapeXml(changefreq)}</changefreq>`);
  }

  if (priority) {
    lines.push(`    <priority>${escapeXml(priority)}</priority>`);
  }

  lines.push('  </url>');
  return lines.join('\n');
};

const toAbsoluteUrl = (siteUrl, routePath) => (routePath === '/' ? `${siteUrl}/` : `${siteUrl}${routePath}`);

/**
 * `updatedAt` on a lab is human copy ("Aug 2026"), which is not a date a sitemap can carry.
 * Parsed into the first of that month it becomes a valid W3C date and a useful recrawl signal;
 * anything unparseable is simply left off rather than guessed at.
 */
const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

const toLastmod = (updatedAt) => {
  const match = /^([A-Za-z]{3})[a-z]*\s+(\d{4})$/.exec(updatedAt?.trim() ?? '');
  if (!match) return undefined;

  const monthIndex = MONTHS.indexOf(match[1].toLowerCase());
  if (monthIndex < 0) return undefined;

  return `${match[2]}-${String(monthIndex + 1).padStart(2, '0')}-01`;
};

const generateSitemapXml = async () => {
  const [{ siteUrl, routes }, blogPosts, labs] = await Promise.all([
    loadRouteData(),
    loadBlogPosts(),
    loadLabs(),
  ]);

  // SITE_ROUTES is the single source of truth (src/routes.ts) — adding a page there and setting
  // shouldIndex: true is enough for it to show up here automatically, no separate list to update.
  const pageNodes = routes
    .filter((route) => route.shouldIndex !== false)
    .map((route) => {
      const meta = STATIC_ROUTE_META[route.path] ?? DEFAULT_ROUTE_META;
      return buildUrlNode({ loc: toAbsoluteUrl(siteUrl, route.path), ...meta });
    });

  // Each lab's own page. These are the URLs that give MyDompet, Territory and the rest something
  // to be indexed *as* — before they existed, every lab was a fragment of one /labs document and
  // there was nothing for a search engine to return for the product's own name.
  const labNodes = labs.map((lab) =>
    buildUrlNode({
      loc: toAbsoluteUrl(siteUrl, labRoutePath(lab)),
      changefreq: 'monthly',
      priority: '0.7',
      lastmod: toLastmod(lab.updatedAt),
    }),
  );

  const blogNodes = blogPosts.map((post) =>
    buildUrlNode({
      loc: toAbsoluteUrl(siteUrl, `/blog/${post.id}`),
      changefreq: 'monthly',
      priority: '0.7',
      lastmod: post.lastmod,
    }),
  );

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...pageNodes,
    ...labNodes,
    ...blogNodes,
    '</urlset>',
    '',
  ].join('\n');
};

const run = async () => {
  const sitemapXml = await generateSitemapXml();
  await fs.writeFile(OUTPUT_PATH, sitemapXml, 'utf8');
  console.log('Generated sitemap:', OUTPUT_PATH);
};

run().catch((error) => {
  console.error('Failed to generate sitemap:', error);
  process.exitCode = 1;
});
