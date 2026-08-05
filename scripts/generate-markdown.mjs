// Generates a Markdown representation of each page into dist/, alongside the HTML.
//
// An agent fetching https://swymble.com/labs/mydompet gets a React shell, a prerendered DOM, and
// about 40 KB of markup wrapped around 3 KB of actual answer. https://swymble.com/labs/mydompet.md
// gives it the answer and nothing else. That is the whole point: fewer tokens, no parsing, no
// chance of an agent quoting a CSS class name.
//
// The Markdown is generated from src/data — the same source the pages render from — rather than
// converted out of the built HTML. Converting would couple the output to the DOM structure and
// break quietly the first time a component is restyled.
//
// Discovery: every page's HTML carries `<link rel="alternate" type="text/markdown">` pointing at
// its .md file (see scripts/prerender-meta.mjs), and cloudflare/agent-discovery-worker.js turns
// that into a real Link response header plus `Accept: text/markdown` content negotiation on the
// HTML URL itself. See docs/agent-readiness.md.
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { ROOT_DIR, loadRouteData, loadBlogPosts } from './lib/route-data.mjs';
import { loadLabs, labRoutePath, labSeoTitle } from './lib/lab-data.mjs';
import { readExportedObjectArray, readObjectArrayField, readStringArrayField } from './lib/ts-source.mjs';
import { hasMarkdown, markdownFileFor, markdownUrlFor } from './lib/markdown-routes.mjs';

const DIST_DIR = path.join(ROOT_DIR, 'dist');
const ABOUT_PATH = path.join(ROOT_DIR, 'src', 'data', 'about', 'about.ts');
const FAQ_PATH = path.join(ROOT_DIR, 'src', 'data', 'home', 'faq.ts');
const SERVICES_PATH = path.join(ROOT_DIR, 'src', 'data', 'home', 'services.ts');
const PROJECTS_PATH = path.join(ROOT_DIR, 'src', 'data', 'projects', 'projects.ts');

const SUMMARY =
  'Swymble is a one-person software studio and engineering lab based in Kuala Lumpur, Malaysia. ' +
  'It builds websites, apps and AI systems for businesses as client work, and develops its own ' +
  'experimental products under the name Swymble Labs.';

/**
 * Front matter, so an agent knows what it is holding before it reads a word of it. Kept to the
 * four fields that are always meaningful: what this is, where the human version lives, and when.
 */
const frontMatter = ({ title, description, canonical }) =>
  ['---', `title: ${JSON.stringify(title)}`, `description: ${JSON.stringify(description)}`, `canonical: ${canonical}`, '---', ''].join('\n');

const section = (heading, level = 2) => `${'#'.repeat(level)} ${heading}`;

/** Writes dist/<route>.md — `/` becomes dist/index.md. */
const writeMarkdown = async (routePath, content) => {
  const relative = markdownFileFor(routePath);
  const outFile = path.join(DIST_DIR, relative);
  await fs.mkdir(path.dirname(outFile), { recursive: true });
  await fs.writeFile(outFile, content, 'utf8');
  return relative;
};

const buildHome = ({ siteUrl, routes, labs, faq, services }) => {
  const lines = [
    frontMatter({ title: 'Swymble', description: SUMMARY, canonical: `${siteUrl}/` }),
    '# Swymble',
    '',
    SUMMARY,
    '',
    section('What Swymble does'),
    '',
  ];

  for (const service of services) {
    lines.push(`- **${service.title}** — ${service.desc}`);
  }

  lines.push('', section('Swymble Labs'), '');
  for (const lab of labs) {
    lines.push(`- [${lab.seoName}](${siteUrl}${labRoutePath(lab)}) — ${lab.detail?.oneLiner ?? lab.publicSummary}`);
  }

  if (faq.length) {
    lines.push('', section('Common questions'), '');
    for (const entry of faq.slice(0, 3)) {
      lines.push(`**${entry.question}**`, '', entry.answer, '');
    }
    lines.push(`All questions: ${siteUrl}/about.md`, '');
  }

  lines.push(section('Pages'), '');
  for (const route of routes.filter((route) => route.shouldIndex !== false && route.path !== '/')) {
    // Link the Markdown twin where there is one, the HTML page otherwise. Pointing at a .md that
    // was never written would hand an agent a 404 in the one place it is most likely to follow.
    const href = hasMarkdown(route.path) ? markdownUrlFor(siteUrl, route.path) : `${siteUrl}${route.path}`;
    lines.push(`- [${route.label}](${href}) — ${route.seoDescription}`);
  }

  lines.push('', section('Contact'), '', `Email: hello@swymble.com`, `Contact form: ${siteUrl}/contact`, '');
  return lines.join('\n');
};

const buildAbout = ({ siteUrl, route, about, faq }) => {
  const lines = [
    frontMatter({ title: 'About Swymble', description: route.seoDescription, canonical: `${siteUrl}/about` }),
    '# About Swymble',
    '',
    `${about.role} · ${about.location}`,
    '',
  ];

  for (const paragraph of about.intro) {
    lines.push(paragraph, '');
  }

  for (const entry of about.readme) {
    lines.push(section(entry.heading), '', entry.body, '');
  }

  if (faq.length) {
    lines.push(section('Frequently asked'), '');
    for (const entry of faq) {
      lines.push(section(entry.question, 3), '', entry.answer, '');
    }
  }

  return lines.join('\n');
};

const buildLabsIndex = ({ siteUrl, route, labs }) => {
  const lines = [
    frontMatter({ title: 'Swymble Labs', description: route.seoDescription, canonical: `${siteUrl}/labs` }),
    '# Swymble Labs',
    '',
    'Independent products built by Swymble outside client work.',
    '',
  ];

  for (const lab of labs) {
    lines.push(section(lab.seoName, 2), '');
    lines.push(`${lab.detail?.oneLiner ?? lab.publicSummary}`, '');
    lines.push(`Status: ${lab.status} · Category: ${lab.category} · Updated: ${lab.updatedAt}`, '');
    lines.push(`Full description: ${siteUrl}${labRoutePath(lab)}.md`, '');
  }

  return lines.join('\n');
};

const buildLab = ({ siteUrl, lab }) => {
  const canonical = `${siteUrl}${labRoutePath(lab)}`;
  const lines = [
    frontMatter({
      title: labSeoTitle(lab, 'Swymble'),
      description: lab.detail?.oneLiner ?? lab.publicSummary,
      canonical,
    }),
    `# ${lab.seoName}`,
    '',
    lab.detail?.oneLiner ?? lab.publicSummary,
    '',
    `Status: ${lab.status} · Category: ${lab.category} · Updated: ${lab.updatedAt}`,
    '',
  ];

  if (lab.tags.length) {
    lines.push(`Tags: ${lab.tags.join(', ')}`, '');
  }

  lines.push(section(`What ${lab.seoName} is`), '');
  for (const paragraph of lab.detail?.overview?.length ? lab.detail.overview : [lab.publicSummary]) {
    lines.push(paragraph, '');
  }

  if (lab.detail?.features?.length) {
    lines.push(section('How it works'), '');
    for (const feature of lab.detail.features) {
      lines.push(`- **${feature.title}** — ${feature.body}`);
    }
    lines.push('');
  }

  if (lab.safeHighlights.length) {
    lines.push(section('Highlights'), '');
    for (const highlight of lab.safeHighlights) {
      lines.push(`- ${highlight}`);
    }
    lines.push('');
  }

  if (lab.detail?.specs?.length) {
    lines.push(section('At a glance'), '', '| | |', '| --- | --- |');
    for (const spec of lab.detail.specs) {
      lines.push(`| ${spec.label} | ${spec.value} |`);
    }
    lines.push('');
  }

  if (lab.detail?.faq?.length) {
    lines.push(section('Frequently asked'), '');
    for (const entry of lab.detail.faq) {
      lines.push(section(entry.question, 3), '', entry.answer, '');
    }
  }

  lines.push(section('More'), '', `- Swymble Labs index: ${siteUrl}/labs.md`, `- About Swymble: ${siteUrl}/about.md`, '');
  return lines.join('\n');
};

const buildProjects = ({ siteUrl, route, projects }) => {
  const lines = [
    frontMatter({ title: 'Swymble projects', description: route.seoDescription, canonical: `${siteUrl}/projects` }),
    '# Client projects',
    '',
    'Work Swymble has shipped for clients.',
    '',
  ];

  for (const project of projects) {
    lines.push(section(project.title), '');
    lines.push(`Client: ${project.client} · Category: ${project.category} · Status: ${project.status}`, '');
    lines.push(project.description, '');
    if (project.link) lines.push(`Live at: ${project.link}`, '');
  }

  return lines.join('\n');
};

const buildBlogIndex = ({ siteUrl, route, blogPosts }) => {
  const lines = [
    frontMatter({ title: 'Swymble blog', description: route.seoDescription, canonical: `${siteUrl}/blog` }),
    '# Blog',
    '',
    'Writing on software engineering, AI systems and building in public.',
    '',
  ];

  for (const post of blogPosts) {
    lines.push(`- [${post.title}](${siteUrl}/blog/${post.id}) — ${post.summary}${post.lastmod ? ` (${post.lastmod})` : ''}`);
  }

  lines.push('', `Feed: ${siteUrl}/feed.xml`, '');
  return lines.join('\n');
};

/**
 * Post bodies are rich content blocks (headings, code, callouts) rather than plain strings, so
 * the .md carries the abstract and points at the HTML rather than half-rendering the article.
 * Whole-post Markdown would mean a second renderer to keep correct; llms-full.txt already covers
 * the "give an assistant everything" case.
 */
const buildBlogPost = ({ siteUrl, post }) => {
  const canonical = `${siteUrl}/blog/${post.id}`;
  return [
    frontMatter({ title: post.title, description: post.summary, canonical }),
    `# ${post.title}`,
    '',
    ...(post.lastmod ? [`Published: ${post.lastmod}`, ''] : []),
    post.summary,
    '',
    `Full article: ${canonical}`,
    '',
  ].join('\n');
};

const loadAbout = async () => {
  const source = await fs.readFile(ABOUT_PATH, 'utf8');
  return {
    role: /\brole\s*:\s*'([^']*)'/.exec(source)?.[1] ?? '',
    location: /\blocation\s*:\s*'([^']*)'/.exec(source)?.[1] ?? '',
    intro: readStringArrayField(source, 'intro'),
    readme: readObjectArrayField(source, 'readme', ['heading', 'body']),
  };
};

const run = async () => {
  const [{ siteUrl, routes }, labs, blogPosts, about, faqSource, servicesSource, projectsSource] = await Promise.all([
    loadRouteData(),
    loadLabs(),
    loadBlogPosts(),
    loadAbout(),
    fs.readFile(FAQ_PATH, 'utf8'),
    fs.readFile(SERVICES_PATH, 'utf8'),
    fs.readFile(PROJECTS_PATH, 'utf8'),
  ]);

  const faq = readExportedObjectArray(faqSource, 'SWYMBLE_FAQ', ['question', 'answer']);
  const services = readExportedObjectArray(servicesSource, 'SWYMBLE_SERVICES', ['title', 'desc']);
  const projects = readExportedObjectArray(projectsSource, 'SWYMBLE_PROJECTS', [
    'title',
    'category',
    'client',
    'description',
    'link',
    'status',
  ]);

  const routeFor = (routePath) => routes.find((route) => route.path === routePath);
  const written = [];

  written.push(await writeMarkdown('/', buildHome({ siteUrl, routes, labs, faq, services })));

  const aboutRoute = routeFor('/about');
  if (aboutRoute) {
    written.push(await writeMarkdown('/about', buildAbout({ siteUrl, route: aboutRoute, about, faq })));
  }

  const labsRoute = routeFor('/labs');
  if (labsRoute) {
    written.push(await writeMarkdown('/labs', buildLabsIndex({ siteUrl, route: labsRoute, labs })));
  }

  for (const lab of labs) {
    written.push(await writeMarkdown(labRoutePath(lab), buildLab({ siteUrl, lab })));
  }

  const projectsRoute = routeFor('/projects');
  if (projectsRoute && projects.length) {
    written.push(await writeMarkdown('/projects', buildProjects({ siteUrl, route: projectsRoute, projects })));
  }

  const blogRoute = routeFor('/blog');
  if (blogRoute) {
    written.push(await writeMarkdown('/blog', buildBlogIndex({ siteUrl, route: blogRoute, blogPosts })));
  }

  for (const post of blogPosts) {
    written.push(await writeMarkdown(`/blog/${post.id}`, buildBlogPost({ siteUrl, post })));
  }

  console.log(`[markdown] Wrote ${written.length} Markdown page(s): ${written.join(', ')}`);
};

run().catch((error) => {
  console.error('[markdown] Failed to generate Markdown pages:', error);
  process.exitCode = 1;
});
