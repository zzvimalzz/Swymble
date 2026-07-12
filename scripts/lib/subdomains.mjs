// Discovers every folder under src/data/subdomains/, so sitemap/robots generation picks up new
// subdomains automatically instead of needing a manually maintained list.
//
// - "App" subdomains (own package.json — mybirth, what2watch) own their SEO files under their
//   own public/ dir, since they're independent Vite projects. We only read those files here.
// - "Plain" subdomains (no package.json — copied verbatim to dist/subdomains/<name>/) get a
//   minimal robots.txt/sitemap.xml/llms.txt scaffolded the first time they're seen, so a brand
//   new subdomain folder is crawlable by default without extra manual steps.
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { ROOT_DIR } from './route-data.mjs';

const SUBDOMAINS_ROOT = path.join(ROOT_DIR, 'src', 'data', 'subdomains');

const fileExists = async (filePath) => {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
};

const isAppSubdomain = (subdomainRoot) => fileExists(path.join(subdomainRoot, 'package.json'));

// A subdomain folder can carry a CNAME file (GitHub Pages convention, kept when a site is
// merged in from its own repo) naming the custom domain it is served on — e.g. watchpaintdry
// lives at www.watchpaintdry.net, not watchpaintdry.swymble.com. That domain is what scaffolded
// SEO files and robots.txt sitemap listings must use.
const resolveDomain = async (name, subdomainRoot) => {
  const cnamePath = path.join(subdomainRoot, 'CNAME');

  if (await fileExists(cnamePath)) {
    const firstLine = (await fs.readFile(cnamePath, 'utf8')).trim().split(/\r?\n/)[0]?.trim();
    if (firstLine) return firstLine;
  }

  return `${name}.swymble.com`;
};

const seoFilesRoot = async (subdomainRoot) => {
  const publicDir = path.join(subdomainRoot, 'public');
  return (await isAppSubdomain(subdomainRoot)) ? publicDir : subdomainRoot;
};

const scaffoldPlainSubdomainSeoFiles = async (name, filesRoot, domain) => {
  const robotsPath = path.join(filesRoot, 'robots.txt');
  const sitemapPath = path.join(filesRoot, 'sitemap.xml');
  const llmsPath = path.join(filesRoot, 'llms.txt');

  if (!(await fileExists(robotsPath))) {
    await fs.writeFile(
      robotsPath,
      `User-agent: *\nAllow: /\n\nSitemap: https://${domain}/sitemap.xml\n`,
      'utf8',
    );
    console.log(`[subdomains] Scaffolded robots.txt for new subdomain "${name}".`);
  }

  if (!(await fileExists(sitemapPath))) {
    const today = new Date().toISOString().slice(0, 10);
    await fs.writeFile(
      sitemapPath,
      [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
        '  <url>',
        `    <loc>https://${domain}/</loc>`,
        `    <lastmod>${today}</lastmod>`,
        '    <changefreq>monthly</changefreq>',
        '    <priority>0.6</priority>',
        '  </url>',
        '</urlset>',
        '',
      ].join('\n'),
      'utf8',
    );
    console.log(`[subdomains] Scaffolded sitemap.xml for new subdomain "${name}".`);
  }

  if (!(await fileExists(llmsPath))) {
    await fs.writeFile(
      llmsPath,
      [
        `# ${name}`,
        '',
        `> Describe what ${domain} is here — this file is read by AI assistants`,
        '> (ChatGPT, Claude, Perplexity, etc.) that support the llms.txt convention.',
        '',
        '## Contact',
        '',
        'Site: https://swymble.com',
        '',
      ].join('\n'),
      'utf8',
    );
    console.log(`[subdomains] Scaffolded llms.txt for new subdomain "${name}" — fill in the description.`);
  }
};

const extractSitemapUrl = (robotsContent) => robotsContent.match(/^Sitemap:\s*(\S+)/im)?.[1] ?? null;

/**
 * Returns [{ name, domain, filesRoot, sitemapUrl, isApp }] for every subdomain folder.
 * Plain subdomains missing SEO files get them scaffolded as a side effect.
 */
export const discoverSubdomains = async () => {
  if (!(await fileExists(SUBDOMAINS_ROOT))) {
    return [];
  }

  const entries = await fs.readdir(SUBDOMAINS_ROOT, { withFileTypes: true });
  const results = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const name = entry.name;
    const subdomainRoot = path.join(SUBDOMAINS_ROOT, name);
    const isApp = await isAppSubdomain(subdomainRoot);
    const filesRoot = await seoFilesRoot(subdomainRoot);
    const domain = await resolveDomain(name, subdomainRoot);

    if (!isApp) {
      await scaffoldPlainSubdomainSeoFiles(name, filesRoot, domain);
    }

    const robotsPath = path.join(filesRoot, 'robots.txt');
    const robotsContent = (await fileExists(robotsPath)) ? await fs.readFile(robotsPath, 'utf8') : '';
    const sitemapUrl = extractSitemapUrl(robotsContent) ?? `https://${domain}/sitemap.xml`;

    results.push({
      name,
      domain,
      filesRoot,
      sitemapUrl,
      isApp,
    });
  }

  return results.sort((a, b) => a.name.localeCompare(b.name));
};
