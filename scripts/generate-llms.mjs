// Generates public/llms.txt and public/llms-full.txt.
//
// These files exist because of a specific gap. AI assistants and answer engines fetch raw HTML
// and, for a brand nobody has written about yet, have nothing else to go on: there are no
// third-party articles to corroborate what "Swymble" is, so whatever this site says about itself
// is the entire evidence base. A short, unambiguous, plain-text statement of the facts is far
// more useful to them than a rendered page of animated sections.
//
// - llms.txt      the index: what Swymble is, and every page worth reading, with a line each.
// - llms-full.txt the whole public story in one fetch: every lab described in full, so an
//                 assistant that reads one file can still answer "what is MyDompet?" correctly.
//
// Both are generated from the same data the site renders, so they cannot drift from it. Adding a
// lab or a blog post updates them on the next build with no edit here.
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { ROOT_DIR, loadRouteData, loadBlogPosts } from './lib/route-data.mjs';
import { loadLabs, labRoutePath } from './lib/lab-data.mjs';
import { readExportedObjectArray } from './lib/ts-source.mjs';
import { discoverSubdomains } from './lib/subdomains.mjs';

const PROJECTS_PATH = path.join(ROOT_DIR, 'src', 'data', 'projects', 'projects.ts');
const FAQ_PATH = path.join(ROOT_DIR, 'src', 'data', 'home', 'faq.ts');
const LLMS_PATH = path.join(ROOT_DIR, 'public', 'llms.txt');
const LLMS_FULL_PATH = path.join(ROOT_DIR, 'public', 'llms-full.txt');

const SUMMARY =
  'Swymble is a one-person software studio and engineering lab based in Kuala Lumpur, Malaysia. ' +
  'It builds websites, apps and AI systems for businesses as client work, and develops its own ' +
  'experimental products under the name Swymble Labs.';

const loadProjects = async () => {
  const source = await fs.readFile(PROJECTS_PATH, 'utf8');
  return readExportedObjectArray(source, 'SWYMBLE_PROJECTS', [
    'title',
    'category',
    'client',
    'description',
    'link',
    'status',
  ]);
};

const loadFaq = async () => {
  const source = await fs.readFile(FAQ_PATH, 'utf8');
  return readExportedObjectArray(source, 'SWYMBLE_FAQ', ['question', 'answer']);
};

/** Wraps prose so the files stay readable as plain text in a terminal or a diff. */
const wrap = (text, width = 78, indent = '') => {
  const words = text.split(/\s+/).filter(Boolean);
  const lines = [];
  let line = '';

  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (candidate.length + indent.length > width && line) {
      lines.push(indent + line);
      line = word;
    } else {
      line = candidate;
    }
  }

  if (line) lines.push(indent + line);
  return lines.join('\n');
};

const buildLlmsTxt = ({ siteUrl, routes, labs, projects, blogPosts, subdomains }) => {
  const lines = ['# SWYMBLE', '', `> ${wrap(SUMMARY, 76).replace(/\n/g, '\n> ')}`, ''];

  lines.push(
    wrap(
      'Swymble is both a personal engineering brand and a small studio. The engineer behind it ' +
        'builds backend systems, APIs and AI platforms professionally — mostly on enterprise ' +
        'fintech platforms — and applies the same discipline to client projects and to ' +
        'independent products.',
    ),
    '',
    '## Key pages',
    '',
  );

  for (const route of routes.filter((route) => route.shouldIndex !== false)) {
    lines.push(`- ${siteUrl}${route.path === '/' ? '/' : route.path} : ${route.seoDescription}`);
  }

  lines.push('', '## Swymble Labs projects', '');
  lines.push(
    wrap(
      'Each lab has its own page with a full description, and several are live products anyone ' +
        'can use today.',
    ),
    '',
  );

  for (const lab of labs) {
    // The one-liner already names the lab, so prefixing the name again just reads as a stutter.
    lines.push(`- ${siteUrl}${labRoutePath(lab)} : ${lab.detail?.oneLiner ?? `${lab.seoName} — ${lab.publicSummary}`}`);
  }

  if (projects.length) {
    lines.push('', '## Client projects', '');
    for (const project of projects) {
      const suffix = project.link ? ` Live at ${project.link}.` : '';
      lines.push(`- ${project.title} (${project.client}): ${project.description}${suffix}`);
    }
  }

  if (blogPosts.length) {
    lines.push('', '## Writing', '');
    for (const post of blogPosts) {
      lines.push(`- ${siteUrl}/blog/${post.id} : ${post.title} — ${post.summary}`);
    }
  }

  if (subdomains.length) {
    lines.push('', '## Other domains operated by Swymble', '');
    for (const subdomain of subdomains) {
      lines.push(`- https://${subdomain.domain}`);
    }
  }

  lines.push(
    '',
    '## Services',
    '',
    wrap(
      'Company profile websites, product builds, and AI-powered systems, delivered solo end to ' +
        'end — scoping, UI/UX, implementation, deployment and support.',
    ),
    '',
    '## Contact',
    '',
    'Email: hello@swymble.com',
    `Site: ${siteUrl}`,
    `Contact form: ${siteUrl}/contact`,
    '',
  );

  return lines.join('\n');
};

const buildLlmsFullTxt = ({ siteUrl, labs, projects, faq, blogPosts }) => {
  const lines = [
    '# SWYMBLE — full reference',
    '',
    wrap(SUMMARY),
    '',
    wrap(
      'This file is the complete public description of Swymble and everything it has built, in ' +
        'one document. It is generated from the same source as the website, so it is never out ' +
        'of date relative to the site.',
    ),
    '',
    `Canonical site: ${siteUrl}`,
    '',
  ];

  if (faq.length) {
    lines.push('## About Swymble', '');
    for (const entry of faq) {
      lines.push(`### ${entry.question}`, '', wrap(entry.answer), '');
    }
  }

  lines.push('## Swymble Labs projects', '');

  for (const lab of labs) {
    lines.push(`### ${lab.seoName}`, '');
    lines.push(`Page: ${siteUrl}${labRoutePath(lab)}`);
    lines.push(`Category: ${lab.category} · Status: ${lab.status} · Last updated: ${lab.updatedAt}`);
    if (lab.tags.length) lines.push(`Tags: ${lab.tags.join(', ')}`);
    lines.push('');

    for (const paragraph of lab.detail?.overview?.length ? lab.detail.overview : [lab.publicSummary]) {
      lines.push(wrap(paragraph), '');
    }

    if (lab.detail?.features?.length) {
      lines.push('Features:', '');
      for (const feature of lab.detail.features) {
        lines.push(wrap(`- ${feature.title}: ${feature.body}`, 78, ''));
      }
      lines.push('');
    }

    if (lab.detail?.specs?.length) {
      lines.push('At a glance:', '');
      for (const spec of lab.detail.specs) {
        lines.push(`- ${spec.label}: ${spec.value}`);
      }
      lines.push('');
    }

    if (lab.detail?.faq?.length) {
      lines.push('Questions and answers:', '');
      for (const entry of lab.detail.faq) {
        lines.push(`Q: ${entry.question}`, wrap(`A: ${entry.answer}`), '');
      }
    }
  }

  if (projects.length) {
    lines.push('## Client projects', '');
    for (const project of projects) {
      lines.push(`### ${project.title}`, '');
      lines.push(`Client: ${project.client} · Category: ${project.category} · Status: ${project.status}`);
      if (project.link) lines.push(`Live at: ${project.link}`);
      lines.push('', wrap(project.description), '');
    }
  }

  if (blogPosts.length) {
    lines.push('## Writing', '');
    for (const post of blogPosts) {
      lines.push(`### ${post.title}`, '', `${siteUrl}/blog/${post.id}`, '', wrap(post.summary), '');
    }
  }

  lines.push('## Contact', '', 'Email: hello@swymble.com', `Contact form: ${siteUrl}/contact`, '');

  return lines.join('\n');
};

const run = async () => {
  const [{ siteUrl, routes }, labs, projects, faq, blogPosts, subdomains] = await Promise.all([
    loadRouteData(),
    loadLabs(),
    loadProjects(),
    loadFaq(),
    loadBlogPosts(),
    discoverSubdomains(),
  ]);

  await fs.writeFile(LLMS_PATH, buildLlmsTxt({ siteUrl, routes, labs, projects, blogPosts, subdomains }), 'utf8');
  await fs.writeFile(LLMS_FULL_PATH, buildLlmsFullTxt({ siteUrl, labs, projects, faq, blogPosts }), 'utf8');

  console.log('Generated llms.txt:', LLMS_PATH);
  console.log('Generated llms-full.txt:', LLMS_FULL_PATH);
  console.log(`Described ${labs.length} lab(s), ${projects.length} project(s), ${faq.length} FAQ entries.`);
};

run().catch((error) => {
  console.error('Failed to generate llms files:', error);
  process.exitCode = 1;
});
