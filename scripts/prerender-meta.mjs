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
import { ROOT_DIR, loadRouteData, loadBlogPosts } from './lib/route-data.mjs';
import { loadLabs, labRoutePath, labSeoTitle, labSeoDescription } from './lib/lab-data.mjs';
import { hasMarkdown, markdownUrlFor } from './lib/markdown-routes.mjs';

const DIST_DIR = path.join(ROOT_DIR, 'dist');
const INDEX_HTML_PATH = path.join(DIST_DIR, 'index.html');

const escapeHtml = (value) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Mirrors src/utils/jsonLd.ts — see that file for the reasoning. `JSON.stringify` leaves `<`
 * alone, so a `</script>` sequence in the data would close the element early and the rest would
 * be parsed as HTML. Not reachable while every value is a repo-authored constant; escaped anyway
 * so it stays unreachable if that ever changes.
 */
const serializeJsonLd = (data) => JSON.stringify(data).replace(/</g, '\\u003c');

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

/**
 * Points this route's `<link rel="alternate" type="text/markdown">` at its own .md twin
 * (scripts/generate-markdown.mjs writes them). Without this every page would advertise the
 * homepage's Markdown, which is worse than advertising none — an agent would follow it and
 * quietly answer about the wrong page.
 */
const replaceMarkdownAlternate = (html, href) => {
  const pattern = /(<link rel="alternate" type="text\/markdown" href=")[^"]*(")/;

  if (!pattern.test(html)) {
    console.warn('[prerender-meta] Could not find <link rel="alternate" type="text/markdown"> to stamp.');
    return html;
  }

  // No Markdown twin for this route — drop the element rather than leaving it. The tag lives in
  // index.html pointing at the homepage's /index.md, so a route without its own .md would
  // otherwise inherit that one and send an agent asking about /contact the homepage instead.
  if (!href) {
    return html.replace(/\s*<link rel="alternate" type="text\/markdown" href="[^"]*"\s*\/>/, '');
  }

  return html.replace(pattern, (_match, pre, post) => `${pre}${escapeHtml(href)}${post}`);
};

const stampHtml = (baseHtml, { title, description, canonicalUrl, ogType, image, imageAlt, markdownUrl }) => {
  let html = baseHtml;
  html = replaceTitle(html, title);
  html = replaceMetaContent(html, 'name', 'description', description);
  html = replaceCanonical(html, canonicalUrl);
  html = replaceMarkdownAlternate(html, markdownUrl);
  html = replaceMetaContent(html, 'property', 'og:type', ogType);
  html = replaceMetaContent(html, 'property', 'og:title', title);
  html = replaceMetaContent(html, 'property', 'og:description', description);
  html = replaceMetaContent(html, 'property', 'og:url', canonicalUrl);
  html = replaceMetaContent(html, 'property', 'og:image', image);
  if (imageAlt) {
    html = replaceMetaContent(html, 'property', 'og:image:alt', imageAlt);
  }
  html = replaceMetaContent(html, 'name', 'twitter:title', title);
  html = replaceMetaContent(html, 'name', 'twitter:description', description);
  html = replaceMetaContent(html, 'name', 'twitter:image', image);
  return html;
};

// Blog posts additionally get article:published_time and the same BlogPosting/BreadcrumbList
// JSON-LD that useRouteSeo.ts manages client-side, injected before </head>. This is the no-JS
// fallback path — prerender-snapshot.mjs normally overwrites these files with the fully rendered
// DOM (which already contains the hook's output), but if a snapshot fails this file is what
// crawlers see.
const injectArticleHead = (html, { title, description, canonicalUrl, image, datePublished, siteName, siteUrl }) => {
  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: title,
    description,
    ...(datePublished ? { datePublished } : {}),
    image,
    url: canonicalUrl,
    mainEntityOfPage: { '@type': 'WebPage', '@id': canonicalUrl },
    author: { '@type': 'Organization', name: siteName, url: siteUrl },
    publisher: {
      '@type': 'Organization',
      name: siteName,
      logo: { '@type': 'ImageObject', url: `${siteUrl}/images/icon-512.png` },
    },
  };
  const breadcrumbsJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${siteUrl}/` },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: `${siteUrl}/blog` },
      { '@type': 'ListItem', position: 3, name: title },
    ],
  };

  const snippetLines = [];
  if (datePublished) {
    snippetLines.push(`    <meta property="article:published_time" content="${escapeHtml(datePublished)}" />`);
  }
  snippetLines.push(
    `    <script type="application/ld+json" data-swymble-jsonld="article">${serializeJsonLd(articleJsonLd)}</script>`,
    `    <script type="application/ld+json" data-swymble-jsonld="breadcrumbs">${serializeJsonLd(breadcrumbsJsonLd)}</script>`,
  );

  return html.replace('</head>', `${snippetLines.join('\n')}\n  </head>`);
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
  const [routeData, blogPosts, labs, baseHtml] = await Promise.all([
    loadRouteData(),
    loadBlogPosts(),
    loadLabs(),
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
      markdownUrl: hasMarkdown(route.path) ? markdownUrlFor(siteUrl, route.path) : null,
    });

    await writeRouteFile(route.path, html);
    writtenCount += 1;
  }

  // Lab pages. Unlike blog posts these get no JSON-LD injected here: the lab graph
  // (SoftwareApplication + breadcrumbs + FAQPage) is built by src/utils/labSeo.ts and rendered
  // by the app, and prerender-snapshot.mjs captures it from the real DOM. Reproducing that graph
  // in this script would mean two copies of it, drifting apart the first time a field changes.
  // Which labs actually got a social card rendered this build. generate-og-cards.mjs is
  // non-fatal by design, so trusting that every card exists would mean a failed render leaves a
  // page advertising an og:image that 404s — which unfurls worse than the generic card it
  // replaced. Absent manifest (cards not run at all) means every lab falls back.
  const renderedCards = new Set(
    await fs
      .readFile(path.join(DIST_DIR, 'images', 'og', 'manifest.json'), 'utf8')
      .then((raw) => JSON.parse(raw).cards ?? [])
      .catch(() => []),
  );

  for (const lab of labs) {
    const routePath = labRoutePath(lab);
    const canonicalUrl = `${siteUrl}${routePath}`;
    const image = renderedCards.has(lab.id) ? `${siteUrl}/images/og/${lab.id}.png` : defaultImage;

    const html = stampHtml(baseHtml, {
      title: labSeoTitle(lab, siteName),
      description: labSeoDescription(lab),
      canonicalUrl,
      ogType: 'website',
      image,
      imageAlt: `${lab.seoName} — a ${siteName} Labs project`,
      markdownUrl: markdownUrlFor(siteUrl, routePath),
    });

    await writeRouteFile(routePath, html);
    writtenCount += 1;
  }

  for (const post of blogPosts) {
    const routePath = `/blog/${post.id}`;
    const canonicalUrl = `${siteUrl}${routePath}`;
    const image = toAbsoluteImageUrl(siteUrl, post.coverImage, defaultImage);

    let html = stampHtml(baseHtml, {
      title: `${post.title} | ${siteName} Blog`,
      description: post.summary,
      canonicalUrl,
      ogType: 'article',
      image,
      imageAlt: post.title,
      markdownUrl: markdownUrlFor(siteUrl, routePath),
    });
    html = injectArticleHead(html, {
      title: post.title,
      description: post.summary,
      canonicalUrl,
      image,
      datePublished: post.lastmod,
      siteName,
      siteUrl,
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
