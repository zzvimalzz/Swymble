import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const SITE_URL = 'https://swymble.com';
const POSTS_DIR = path.join(ROOT_DIR, 'src', 'data', 'blog', 'posts');
const OUTPUT_PATH = path.join(ROOT_DIR, 'public', 'sitemap.xml');

const STATIC_ROUTES = [
  { path: '/', changefreq: 'weekly', priority: '1.0' },
  { path: '/projects', changefreq: 'monthly', priority: '0.8' },
  { path: '/labs', changefreq: 'weekly', priority: '0.8' },
  { path: '/about', changefreq: 'monthly', priority: '0.7' },
  { path: '/blog', changefreq: 'weekly', priority: '0.8' },
];

const escapeXml = (value) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

const normalizeDate = (value) => {
  if (!value) return null;
  const trimmed = value.trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(trimmed) ? trimmed : null;
};

const parsePostFile = (fileContent, fallbackId) => {
  const idMatch = fileContent.match(/\bid\s*:\s*['"`]([^'"`]+)['"`]/);
  const dateMatch = fileContent.match(/\bdate\s*:\s*['"`](\d{4}-\d{2}-\d{2})['"`]/);

  return {
    id: (idMatch?.[1] ?? fallbackId).trim(),
    lastmod: normalizeDate(dateMatch?.[1] ?? null),
  };
};

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

const toAbsoluteUrl = (routePath) => {
  if (routePath === '/') {
    return `${SITE_URL}/`;
  }

  return `${SITE_URL}${routePath}`;
};

const getBlogRoutes = async () => {
  const entries = await fs.readdir(POSTS_DIR, { withFileTypes: true });
  const postFiles = entries
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter((fileName) => fileName.endsWith('.ts') && fileName !== 'index.ts')
    .sort();

  const routes = [];

  for (const fileName of postFiles) {
    const filePath = path.join(POSTS_DIR, fileName);
    const fileContent = await fs.readFile(filePath, 'utf8');
    const fallbackId = fileName.replace(/\.ts$/, '');
    const postMeta = parsePostFile(fileContent, fallbackId);

    routes.push({
      path: `/blog/${postMeta.id}`,
      changefreq: 'monthly',
      priority: '0.7',
      lastmod: postMeta.lastmod,
    });
  }

  return routes;
};

const generateSitemapXml = async () => {
  const blogRoutes = await getBlogRoutes();
  const allRoutes = [...STATIC_ROUTES, ...blogRoutes];

  const xmlNodes = allRoutes.map((route) =>
    buildUrlNode({
      loc: toAbsoluteUrl(route.path),
      changefreq: route.changefreq,
      priority: route.priority,
      lastmod: route.lastmod,
    })
  );

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...xmlNodes,
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
