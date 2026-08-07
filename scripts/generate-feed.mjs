// Generates public/feed.xml — an RSS 2.0 feed of the blog.
//
// A feed is a second, machine-readable front door to the site's writing. Feed readers, aggregators
// and several crawlers poll feeds directly and pick up new posts far faster than they re-crawl a
// page they last saw a while ago, which matters for a domain that has yet to earn frequent crawls.
// It is also the format most syndication and "what's new" tooling expects, so having one is a
// precondition for the site's writing being picked up anywhere other than by someone visiting it.
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { ROOT_DIR, loadRouteData, loadBlogPosts } from './lib/route-data.mjs';

const OUTPUT_PATH = path.join(ROOT_DIR, 'public', 'feed.xml');

const escapeXml = (value) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

/** RSS wants RFC 822 dates; posts carry plain YYYY-MM-DD. Undated posts simply get no pubDate. */
const toRfc822 = (isoDate) => {
  if (!isoDate) return null;

  const parsed = new Date(`${isoDate}T00:00:00Z`);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toUTCString();
};

const buildItem = ({ post, siteUrl }) => {
  const url = `${siteUrl}/blog/${post.id}`;
  const pubDate = toRfc822(post.lastmod);

  return [
    '    <item>',
    `      <title>${escapeXml(post.title)}</title>`,
    `      <link>${escapeXml(url)}</link>`,
    `      <guid isPermaLink="true">${escapeXml(url)}</guid>`,
    ...(pubDate ? [`      <pubDate>${escapeXml(pubDate)}</pubDate>`] : []),
    `      <description>${escapeXml(post.summary)}</description>`,
    '    </item>',
  ].join('\n');
};

const run = async () => {
  const [{ siteUrl, siteName }, blogPosts] = await Promise.all([loadRouteData(), loadBlogPosts()]);

  // Newest first — the order a reader expects, and what most aggregators assume.
  const posts = [...blogPosts].sort((a, b) => (b.lastmod ?? '').localeCompare(a.lastmod ?? ''));
  const latest = toRfc822(posts[0]?.lastmod);

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    '  <channel>',
    `    <title>${escapeXml(siteName)} Blog</title>`,
    `    <link>${escapeXml(`${siteUrl}/blog`)}</link>`,
    `    <description>Notes on software engineering, AI systems and building in public from ${escapeXml(siteName)}.</description>`,
    '    <language>en</language>',
    `    <atom:link href="${escapeXml(`${siteUrl}/feed.xml`)}" rel="self" type="application/rss+xml" />`,
    ...(latest ? [`    <lastBuildDate>${escapeXml(latest)}</lastBuildDate>`] : []),
    ...posts.map((post) => buildItem({ post, siteUrl })),
    '  </channel>',
    '</rss>',
    '',
  ].join('\n');

  await fs.writeFile(OUTPUT_PATH, xml, 'utf8');
  console.log(`Generated feed: ${OUTPUT_PATH} (${posts.length} item(s))`);
};

run().catch((error) => {
  console.error('Failed to generate feed:', error);
  process.exitCode = 1;
});
