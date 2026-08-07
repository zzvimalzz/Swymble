// Full-page prerendering for crawlers that don't execute JavaScript.
//
// prerender-meta.mjs stamps correct <title>/meta tags into dist/<route>/index.html, but the body
// is still just `<div id="root"></div>` until React mounts. Google's crawler renders JS and is
// fine with that; GPTBot, ClaudeBot, PerplexityBot, and most other AI/answer-engine crawlers
// fetch raw HTML and don't run JS, so today they see meta tags but no real page content.
//
// This script runs *after* prerender-meta.mjs and vite build, boots the built dist/ over a local
// static server, opens each indexable route in a headless browser, waits for the app to finish
// its initial render, and overwrites that route's index.html with the fully rendered DOM. Real
// visitors still get the interactive SPA — React just re-renders over the snapshot on load
// (no hydration is attempted, so there's a brief flash, same tradeoff tools like react-snap make).
//
// If a route's snapshot fails for any reason (timeout, render error), we log a warning and leave
// the meta-only file from prerender-meta.mjs in place rather than failing the whole build.
import { createServer } from 'node:http';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer';
import { ROOT_DIR, loadRouteData, loadBlogPosts } from './lib/route-data.mjs';
import { loadLabs, labRoutePath } from './lib/lab-data.mjs';
import { readMetaContent, replaceMetaContent } from './lib/html-meta.mjs';

const DIST_DIR = path.join(ROOT_DIR, 'dist');
const SNAPSHOT_TIMEOUT_MS = 20_000;

/**
 * Social meta that prerender-meta.mjs, not the app, is the authority on.
 *
 * For most tags the two agree — both derive from src/data — so capturing the DOM loses nothing.
 * These three are the exception. prerender-meta.mjs checks dist/images/og/manifest.json and falls
 * back to the site's default card for any lab whose social card failed to render, and it stamps a
 * per-lab og:image:alt; useRouteSeo.ts has no way to know which cards exist, so it names
 * /images/og/<id>.png unconditionally and uses the generic sitewide alt text. Capturing the DOM
 * over the top therefore threw the fallback away on every build where the snapshot succeeded —
 * which is every build — leaving a failed card advertising an og:image that 404s. That unfurls
 * worse than the generic card the manifest exists to fall back to.
 */
const PRESERVED_SOCIAL_META = [
  ['property', 'og:image'],
  ['property', 'og:image:alt'],
  ['name', 'twitter:image'],
];

const CONTENT_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
};

const fileExists = async (filePath) => {
  try {
    const stat = await fs.stat(filePath);
    return stat.isFile();
  } catch {
    return false;
  }
};

const resolveDistFile = async (pathname) => {
  const cleanPath = pathname.split('?')[0].split('#')[0];
  const candidates = cleanPath.endsWith('/')
    ? [path.join(DIST_DIR, cleanPath, 'index.html')]
    : [path.join(DIST_DIR, cleanPath), path.join(DIST_DIR, cleanPath, 'index.html')];

  for (const candidate of candidates) {
    if (await fileExists(candidate)) {
      return candidate;
    }
  }

  return null;
};

const startStaticServer = () =>
  new Promise((resolve) => {
    const server = createServer(async (request, response) => {
      const url = new URL(request.url ?? '/', 'http://127.0.0.1');
      const filePath = await resolveDistFile(url.pathname);

      if (!filePath) {
        response.statusCode = 404;
        response.end('Not found');
        return;
      }

      const contentType = CONTENT_TYPES[path.extname(filePath).toLowerCase()] ?? 'application/octet-stream';
      response.setHeader('Content-Type', contentType);
      response.end(await fs.readFile(filePath));
    });

    server.listen(0, '127.0.0.1', () => resolve(server));
  });

const routeFilePath = (routePath) => {
  const outDir = routePath === '/' ? DIST_DIR : path.join(DIST_DIR, routePath.replace(/^\//, ''));
  return path.join(outDir, 'index.html');
};

const writeRouteFile = async (routePath, html) => {
  const outFile = routeFilePath(routePath);
  await fs.mkdir(path.dirname(outFile), { recursive: true });
  await fs.writeFile(outFile, html, 'utf8');
};

/** Copies the tags listed in PRESERVED_SOCIAL_META from the stamped file back into the snapshot. */
const preserveSocialMeta = (snapshotHtml, stampedHtml) => {
  if (!stampedHtml) return snapshotHtml;

  let html = snapshotHtml;

  for (const [attr, attrValue] of PRESERVED_SOCIAL_META) {
    const stamped = readMetaContent(stampedHtml, attr, attrValue);
    if (stamped !== null) {
      html = replaceMetaContent(html, attr, attrValue, stamped, '[prerender-snapshot]');
    }
  }

  return html;
};

const snapshotRoute = async (page, baseUrl, routePath) => {
  const url = `${baseUrl}${routePath}`;

  // Read before navigating: this is prerender-meta.mjs's output, and the page about to be
  // captured will have overwritten some of it client-side. Missing is survivable — capture the
  // page anyway rather than losing the whole snapshot over the social tags.
  const stampedHtml = await fs.readFile(routeFilePath(routePath), 'utf8').catch(() => null);

  await page.goto(url, { waitUntil: 'networkidle0', timeout: SNAPSHOT_TIMEOUT_MS });

  await page.waitForFunction(
    () => {
      const loaderGone = !document.querySelector('.app-loading');
      const main = document.querySelector('#main-content');
      const hasText = (main?.textContent ?? '').trim().length > 40;
      return loaderGone && hasText;
    },
    { timeout: SNAPSHOT_TIMEOUT_MS },
  );

  // Scroll through the page before capturing: entrance animations are viewport-triggered
  // (whileInView, once: true), so without this pass every below-fold section would be
  // frozen into the snapshot at opacity 0 with its entrance transform still applied.
  // Sweeping to the bottom fires them all; they settle at full opacity and stay there.
  await page.evaluate(async () => {
    const step = Math.max(200, Math.floor(window.innerHeight * 0.7));
    for (let y = 0; y <= document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((resolve) => setTimeout(resolve, 120));
    }
    window.scrollTo(0, 0);
  });
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // The sweep mounts lazy below-fold sections; if one of them throws (a browser feature this
  // headless environment lacks), React unmounts the whole root and content() would capture an
  // empty shell. In that case reload and capture without sweeping — below-fold entrances stay
  // at their pre-animation state in that snapshot, but all text content is present.
  const stillRendered = await page.evaluate(
    () => (document.querySelector('#main-content')?.textContent ?? '').trim().length > 40,
  );

  if (!stillRendered) {
    console.warn(`[prerender-snapshot] ${routePath}: app unmounted during scroll sweep — recapturing without sweep.`);
    await page.goto(url, { waitUntil: 'networkidle0', timeout: SNAPSHOT_TIMEOUT_MS });
    await page.waitForFunction(
      () => {
        const loaderGone = !document.querySelector('.app-loading');
        const main = document.querySelector('#main-content');
        return loaderGone && (main?.textContent ?? '').trim().length > 40;
      },
      { timeout: SNAPSHOT_TIMEOUT_MS },
    );
  }

  const html = preserveSocialMeta(await page.content(), stampedHtml);
  await writeRouteFile(routePath, html);
};

const run = async () => {
  const [{ routes }, blogPosts, labs] = await Promise.all([loadRouteData(), loadBlogPosts(), loadLabs()]);

  const routePaths = routes.filter((route) => route.shouldIndex !== false).map((route) => route.path);
  const labPaths = labs.map((lab) => labRoutePath(lab));
  const blogPaths = blogPosts.map((post) => `/blog/${post.id}`);
  const allPaths = [...new Set([...routePaths, ...labPaths, ...blogPaths])];

  const server = await startStaticServer();
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  });

  let succeeded = 0;
  let failed = 0;

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900, isMobile: false, hasTouch: false });

    for (const routePath of allPaths) {
      try {
        await snapshotRoute(page, baseUrl, routePath);
        console.log(`[prerender-snapshot] Snapshotted ${routePath}`);
        succeeded += 1;
      } catch (error) {
        console.warn(
          `[prerender-snapshot] Skipping ${routePath} (${error.message}) — leaving meta-only prerender in place.`,
        );
        failed += 1;
      }
    }
  } finally {
    await browser.close();
    server.close();
  }

  console.log(`[prerender-snapshot] Done — ${succeeded} snapshotted, ${failed} skipped.`);
};

run().catch((error) => {
  console.error('[prerender-snapshot] Failed to run:', error);
  console.error('[prerender-snapshot] Continuing build with meta-only prerenders (non-fatal).');
});
