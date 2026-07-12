// Shared route/blog metadata loader used by generate-sitemap.mjs, generate-robots.mjs, and
// prerender-meta.mjs, so all three read from the same source instead of drifting apart.
//
// Route metadata comes from `import()`-ing src/routes.ts directly — Node 24 (pinned in .nvmrc,
// used by CI) strips its type-only import natively. If that import ever fails (older Node, a
// non-erasable syntax creeping into routes.ts), we fall back to regex extraction so the build
// never hard-fails on this.
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const ROOT_DIR = path.resolve(__dirname, '..', '..');
export const ROUTES_PATH = path.join(ROOT_DIR, 'src', 'routes.ts');
export const POSTS_DIR = path.join(ROOT_DIR, 'src', 'data', 'blog', 'posts');

const splitTopLevelObjects = (text) => {
  const blocks = [];
  let depth = 0;
  let start = -1;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (char === '{') {
      if (depth === 0) start = i;
      depth += 1;
    } else if (char === '}') {
      depth -= 1;
      if (depth === 0 && start !== -1) {
        blocks.push(text.slice(start, i + 1));
        start = -1;
      }
    }
  }

  return blocks;
};

const loadRouteDataViaRegex = async () => {
  const source = await fs.readFile(ROUTES_PATH, 'utf8');

  const siteName = source.match(/export const SITE_NAME = ['"`]([^'"`]+)['"`]/)?.[1] ?? 'SWYMBLE';
  const siteUrl = source.match(/export const SITE_URL = ['"`]([^'"`]+)['"`]/)?.[1] ?? 'https://swymble.com';
  const defaultImageTemplate =
    source.match(/export const DEFAULT_SEO_IMAGE = `([^`]+)`/)?.[1] ?? '${SITE_URL}/images/logo-with-name.png';
  const defaultImage = defaultImageTemplate.replace(/\$\{SITE_URL\}/g, siteUrl);

  const arrayMatch = source.match(/export const SITE_ROUTES: SiteRoute\[\] = \[([\s\S]*?)\n\];/);
  const routeBlocks = splitTopLevelObjects(arrayMatch?.[1] ?? '');

  const routes = routeBlocks
    .map((block) => {
      const routePath = block.match(/path:\s*['"`]([^'"`]+)['"`]/)?.[1];
      const seoTitleRaw = block.match(/seoTitle:\s*`([^`]*)`/)?.[1] ?? '';
      const seoTitle = seoTitleRaw.replace(/\$\{SITE_NAME\}/g, siteName);
      const seoDescription = block.match(/seoDescription:\s*['"`]([^'"`]+)['"`]/s)?.[1] ?? '';
      const shouldIndex = block.match(/shouldIndex:\s*(true|false)/)?.[1] !== 'false';

      return { path: routePath, seoTitle, seoDescription, shouldIndex };
    })
    .filter((route) => Boolean(route.path));

  return { siteUrl, siteName, defaultImage, routes };
};

export const loadRouteData = async () => {
  try {
    const moduleUrl = pathToFileURL(ROUTES_PATH).href;
    const routesModule = await import(moduleUrl);

    return {
      siteUrl: routesModule.SITE_URL,
      siteName: routesModule.SITE_NAME,
      defaultImage: routesModule.DEFAULT_SEO_IMAGE,
      routes: routesModule.SITE_ROUTES,
      usedFallback: false,
    };
  } catch (error) {
    console.warn(
      `[route-data] Native TS import of routes.ts failed (${error.message}) — falling back to regex extraction.`,
    );
    const fallbackData = await loadRouteDataViaRegex();
    return { ...fallbackData, usedFallback: true };
  }
};

// Blog post metadata is always regex-extracted (never imported), to avoid coupling this script
// to whatever the post files pull in.
export const loadBlogPosts = async () => {
  const entries = await fs.readdir(POSTS_DIR, { withFileTypes: true });
  const postFiles = entries
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter((fileName) => fileName.endsWith('.ts') && fileName !== 'index.ts')
    .sort();

  const posts = [];

  for (const fileName of postFiles) {
    const filePath = path.join(POSTS_DIR, fileName);
    const source = await fs.readFile(filePath, 'utf8');
    const fallbackId = fileName.replace(/\.ts$/, '');

    // Only look before the `content:` block array — keeps us from ever matching a field with the
    // same name (title, etc.) nested inside a post's rich content blocks.
    const metaSection = source.split(/\bcontent\s*:\s*\[/)[0];

    const id = metaSection.match(/\bid\s*:\s*['"`]([^'"`]+)['"`]/)?.[1] ?? fallbackId;
    const title = metaSection.match(/\btitle\s*:\s*['"`]([^'"`]+)['"`]/)?.[1] ?? id;
    const summary = metaSection.match(/\bsummary\s*:\s*['"`]([^'"`]+)['"`]/)?.[1] ?? '';
    const dateMatch = metaSection.match(/\bdate\s*:\s*['"`](\d{4}-\d{2}-\d{2})['"`]/)?.[1] ?? null;
    const coverImage = metaSection.match(/\bcoverImage\s*:\s*['"`]([^'"`]+)['"`]/)?.[1] ?? null;

    posts.push({ id, title, summary, lastmod: dateMatch, coverImage });
  }

  return posts;
};
