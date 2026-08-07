// Generates dist/site-data.json — the site's public content as structured JSON.
//
// This exists so the MCP server (cloudflare/mcp-worker.js) has a data source. The alternative
// was baking the content into the Worker at deploy time, which would mean the Worker silently
// serving last month's labs until someone remembered to redeploy it. Fetching a file that the
// site build regenerates means the MCP server is correct by construction: publish a lab, and the
// next deploy updates both the page and the tool that describes it.
//
// Everything here is already public — it is the same data the pages render and llms-full.txt
// describes. `private` labs are filtered out upstream in loadLabs() and never reach this file.
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { ROOT_DIR, loadRouteData, loadBlogPosts } from './lib/route-data.mjs';
import { loadLabs, labRoutePath } from './lib/lab-data.mjs';
import { readExportedObjectArray } from './lib/ts-source.mjs';
import { markdownUrlFor } from './lib/markdown-routes.mjs';

const DIST_DIR = path.join(ROOT_DIR, 'dist');
const OUTPUT_PATH = path.join(DIST_DIR, 'site-data.json');
const FAQ_PATH = path.join(ROOT_DIR, 'src', 'data', 'home', 'faq.ts');
const SERVICES_PATH = path.join(ROOT_DIR, 'src', 'data', 'home', 'services.ts');
const PROJECTS_PATH = path.join(ROOT_DIR, 'src', 'data', 'projects', 'projects.ts');

const SUMMARY =
  'Swymble is a one-person software studio and engineering lab based in Kuala Lumpur, Malaysia. ' +
  'It builds websites, apps and AI systems for businesses as client work, and develops its own ' +
  'experimental products under the name Swymble Labs.';

const run = async () => {
  const [{ siteUrl }, labs, blogPosts, faqSource, servicesSource, projectsSource] = await Promise.all([
    loadRouteData(),
    loadLabs(),
    loadBlogPosts(),
    fs.readFile(FAQ_PATH, 'utf8'),
    fs.readFile(SERVICES_PATH, 'utf8'),
    fs.readFile(PROJECTS_PATH, 'utf8'),
  ]);

  const payload = {
    // Bumped only on a breaking shape change, so a deployed Worker can refuse data it cannot read
    // rather than returning half-populated tool results.
    schemaVersion: 1,
    site: {
      name: 'Swymble',
      url: siteUrl,
      summary: SUMMARY,
      location: 'Kuala Lumpur, Malaysia',
      contact: { email: 'hello@swymble.com', form: `${siteUrl}/contact` },
    },
    services: readExportedObjectArray(servicesSource, 'SWYMBLE_SERVICES', ['title', 'desc']).map((service) => ({
      title: service.title,
      description: service.desc,
    })),
    faq: readExportedObjectArray(faqSource, 'SWYMBLE_FAQ', ['question', 'answer']),
    labs: labs.map((lab) => ({
      id: lab.id,
      name: lab.seoName,
      category: lab.category,
      status: lab.status,
      summary: lab.detail?.oneLiner || lab.publicSummary,
      tags: lab.tags,
      highlights: lab.safeHighlights,
      overview: lab.detail?.overview ?? [lab.publicSummary],
      features: lab.detail?.features ?? [],
      specs: lab.detail?.specs ?? [],
      faq: lab.detail?.faq ?? [],
      updatedAt: lab.updatedAt,
      page: `${siteUrl}${labRoutePath(lab)}`,
      markdown: markdownUrlFor(siteUrl, labRoutePath(lab)),
    })),
    projects: readExportedObjectArray(projectsSource, 'SWYMBLE_PROJECTS', [
      'title',
      'category',
      'client',
      'description',
      'link',
      'status',
    ]).map((project) => ({ ...project, link: project.link || null })),
    posts: blogPosts.map((post) => ({
      id: post.id,
      title: post.title,
      summary: post.summary,
      date: post.lastmod,
      url: `${siteUrl}/blog/${post.id}`,
    })),
  };

  await fs.mkdir(DIST_DIR, { recursive: true });
  await fs.writeFile(OUTPUT_PATH, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  console.log(
    `[site-data] Wrote ${path.relative(ROOT_DIR, OUTPUT_PATH)} — ${payload.labs.length} labs, ` +
      `${payload.projects.length} projects, ${payload.posts.length} posts, ${payload.faq.length} FAQ entries.`,
  );
};

run().catch((error) => {
  console.error('[site-data] Failed to generate site data:', error);
  process.exitCode = 1;
});
