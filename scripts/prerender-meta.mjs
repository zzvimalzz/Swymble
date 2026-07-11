// Post-build SEO stamping.
//
// The SPA (dist/index.html) always ships the homepage's <title>/meta tags — useRouteSeo only
// rewrites them client-side, after hydration, so crawlers and link-unfurlers that don't execute
// JS see homepage metadata for every route. This script fixes that for GitHub Pages by writing a
// per-route copy of index.html (dist/<route>/index.html) with the correct tags already baked in.
// GitHub Pages serves that file on direct navigation to the route; React Router + useRouteSeo take
// over on hydration and keep things in sync from there, so this only needs to get the *initial*
// paint right.
//
// Route metadata comes straight from src/routes.ts. Node 24 (the version pinned in .nvmrc and used
// by the GitHub Actions build) strips TypeScript types natively, and routes.ts's only import
// (`import type { ReactElement } from 'react'`) is type-only and erasable, so `import()`-ing the
// .ts file directly works without a build step. If that ever stops working (older Node, a
// non-erasable syntax creeping into routes.ts, etc.) we fall back to the same regex-extraction
// approach scripts/generate-sitemap.mjs uses, so the build never hard-fails on this.
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const DIST_DIR = path.join(ROOT_DIR, 'dist');
const INDEX_HTML_PATH = path.join(DIST_DIR, 'index.html');
const ROUTES_PATH = path.join(ROOT_DIR, 'src', 'routes.ts');
const POSTS_DIR = path.join(ROOT_DIR, 'src', 'data', 'blog', 'posts');

const escapeHtml = (value) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// ---------------------------------------------------------------------------
// Route metadata: native TS import, falling back to regex extraction.
// ---------------------------------------------------------------------------

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

const loadRouteData = async () => {
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
      `[prerender-meta] Native TS import of routes.ts failed (${error.message}) — falling back to regex extraction.`,
    );
    const fallbackData = await loadRouteDataViaRegex();
    return { ...fallbackData, usedFallback: true };
  }
};

// ---------------------------------------------------------------------------
// Blog post metadata — always regex-extracted (mirrors generate-sitemap.mjs). We deliberately
// don't import the post files: they're plain data today, but importing them would couple this
// script to whatever they pull in later.
// ---------------------------------------------------------------------------

const loadBlogPosts = async () => {
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
    const coverImage = metaSection.match(/\bcoverImage\s*:\s*['"`]([^'"`]+)['"`]/)?.[1] ?? null;

    posts.push({ id, title, summary, coverImage });
  }

  return posts;
};

// ---------------------------------------------------------------------------
// HTML stamping — targeted regex replacement of the tags useRouteSeo.ts also manages client-side.
// Everything else in index.html (the subdomain-redirect script, hashed asset tags, JSON-LD, etc.)
// is left byte-identical.
// ---------------------------------------------------------------------------

const replaceTitle = (html, title) => html.replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(title)}</title>`);

const replaceMetaContent = (html, attr, attrValue, content) => {
  const pattern = new RegExp(`(<meta ${attr}="${escapeRegExp(attrValue)}" content=")[^"]*(")`);

  if (!pattern.test(html)) {
    console.warn(`[prerender-meta] Could not find <meta ${attr}="${attrValue}"> to stamp.`);
    return html;
  }

  return html.replace(pattern, (_match, pre, post) => `${pre}${escapeHtml(content)}${post}`);
};

const replaceCanonical = (html, href) => {
  const pattern = /(<link rel="canonical" href=")[^"]*(")/;

  if (!pattern.test(html)) {
    console.warn('[prerender-meta] Could not find <link rel="canonical"> to stamp.');
    return html;
  }

  return html.replace(pattern, (_match, pre, post) => `${pre}${escapeHtml(href)}${post}`);
};

const stampHtml = (baseHtml, { title, description, canonicalUrl, ogType, image }) => {
  let html = baseHtml;
  html = replaceTitle(html, title);
  html = replaceMetaContent(html, 'name', 'description', description);
  html = replaceCanonical(html, canonicalUrl);
  html = replaceMetaContent(html, 'property', 'og:type', ogType);
  html = replaceMetaContent(html, 'property', 'og:title', title);
  html = replaceMetaContent(html, 'property', 'og:description', description);
  html = replaceMetaContent(html, 'property', 'og:url', canonicalUrl);
  html = replaceMetaContent(html, 'property', 'og:image', image);
  html = replaceMetaContent(html, 'name', 'twitter:title', title);
  html = replaceMetaContent(html, 'name', 'twitter:description', description);
  html = replaceMetaContent(html, 'name', 'twitter:image', image);
  return html;
};

const toAbsoluteImageUrl = (siteUrl, image, defaultImage) => {
  if (!image) return defaultImage;
  if (/^https?:\/\//i.test(image)) return image;
  return `${siteUrl}${image.startsWith('/') ? '' : '/'}${image}`;
};

const writeRouteFile = async (routePath, html) => {
  const outDir = path.join(DIST_DIR, routePath.replace(/^\//, ''));
  const outFile = path.join(outDir, 'index.html');
  await fs.mkdir(outDir, { recursive: true });
  await fs.writeFile(outFile, html, 'utf8');
  console.log(`[prerender-meta] Wrote ${path.relative(ROOT_DIR, outFile)}`);
};

const run = async () => {
  const [routeData, blogPosts, baseHtml] = await Promise.all([
    loadRouteData(),
    loadBlogPosts(),
    fs.readFile(INDEX_HTML_PATH, 'utf8'),
  ]);

  const { siteUrl, siteName, defaultImage, routes, usedFallback } = routeData;

  if (usedFallback) {
    console.log('[prerender-meta] Route metadata source: regex extraction (native TS import unavailable).');
  } else {
    console.log('[prerender-meta] Route metadata source: native TS import of src/routes.ts.');
  }

  let writtenCount = 0;

  for (const route of routes) {
    // '/' already has the correct (homepage) metadata baked into dist/index.html by the build.
    if (route.path === '/') continue;

    if (route.shouldIndex === false) {
      console.log(`[prerender-meta] Skipping ${route.path} (shouldIndex: false)`);
      continue;
    }

    const canonicalUrl = `${siteUrl}${route.path}`;
    const html = stampHtml(baseHtml, {
      title: route.seoTitle,
      description: route.seoDescription,
      canonicalUrl,
      ogType: 'website',
      image: defaultImage,
    });

    await writeRouteFile(route.path, html);
    writtenCount += 1;
  }

  for (const post of blogPosts) {
    const routePath = `/blog/${post.id}`;
    const canonicalUrl = `${siteUrl}${routePath}`;
    const image = toAbsoluteImageUrl(siteUrl, post.coverImage, defaultImage);

    const html = stampHtml(baseHtml, {
      title: `${post.title} | ${siteName} Blog`,
      description: post.summary,
      canonicalUrl,
      ogType: 'article',
      image,
    });

    await writeRouteFile(routePath, html);
    writtenCount += 1;
  }

  console.log(`[prerender-meta] Done — wrote ${writtenCount} static route file(s).`);
};

run().catch((error) => {
  console.error('[prerender-meta] Failed to prerender route metadata:', error);
  process.exitCode = 1;
});
