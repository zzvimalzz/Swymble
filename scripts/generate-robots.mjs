// Generates public/robots.txt.
//
// Beyond the standard `User-agent: *` allow-all, this explicitly names AI assistant / answer
// engine crawlers. They'd already be allowed by the wildcard rule, but naming them:
//   1. documents intent, so a future `Disallow` added under `*` can't silently block them too
//   2. is how several of these bots' own docs recommend confirming access
//
// Sitemap discovery: the main sitemap is always listed, plus every subdomain's sitemap.xml,
// found automatically via scripts/lib/subdomains.mjs — add a new subdomain folder and its
// sitemap shows up here on the next build with no manual edit.
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { ROOT_DIR } from './lib/route-data.mjs';
import { discoverSubdomains } from './lib/subdomains.mjs';

const SITE_URL = 'https://swymble.com';
const OUTPUT_PATH = path.join(ROOT_DIR, 'public', 'robots.txt');

// Known AI assistant / answer-engine crawlers worth naming explicitly. Extend this list as new
// ones show up (OpenAI, Anthropic, Perplexity, and Google's AI-training-only crawler docs are
// the usual place to check for new user-agent names).
const AI_CRAWLER_USER_AGENTS = [
  'GPTBot',
  'ChatGPT-User',
  'OAI-SearchBot',
  'ClaudeBot',
  'Claude-Web',
  'anthropic-ai',
  'PerplexityBot',
  'Perplexity-User',
  'Google-Extended',
  'Applebot-Extended',
  'CCBot',
];

const buildRobotsTxt = (sitemapUrls) => {
  const lines = ['User-agent: *', 'Allow: /', ''];

  for (const userAgent of AI_CRAWLER_USER_AGENTS) {
    lines.push(`User-agent: ${userAgent}`, 'Allow: /', '');
  }

  for (const sitemapUrl of sitemapUrls) {
    lines.push(`Sitemap: ${sitemapUrl}`);
  }

  lines.push('');
  return lines.join('\n');
};

const run = async () => {
  const subdomains = await discoverSubdomains();
  const sitemapUrls = [`${SITE_URL}/sitemap.xml`, ...subdomains.map((subdomain) => subdomain.sitemapUrl)];

  await fs.writeFile(OUTPUT_PATH, buildRobotsTxt(sitemapUrls), 'utf8');
  console.log('Generated robots.txt:', OUTPUT_PATH);
  console.log('Sitemaps referenced:', sitemapUrls.join(', '));
};

run().catch((error) => {
  console.error('Failed to generate robots.txt:', error);
  process.exitCode = 1;
});
