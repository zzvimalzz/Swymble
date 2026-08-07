// Pushes the site's URLs to IndexNow after a deploy.
//
// Why this matters more than it looks: ChatGPT's browsing and Copilot both read Bing's index, and
// Bing is the search engine IndexNow was built for. A brand-new domain with no inbound links can
// wait weeks to be crawled on its own; IndexNow is a direct "these URLs exist, come and look"
// ping, and it is the one discovery channel that does not depend on someone else linking first.
// Yandex and Seznam share the same protocol and endpoint.
//
// Setup (once):
//   1. Generate a key:  node -e "console.log(crypto.randomUUID().replace(/-/g,''))"
//   2. Put it in the build environment as INDEXNOW_KEY. In GitHub Actions a repository *variable*
//      is enough — the key is published at the URL below, so it is not a secret.
//   3. This script writes public/<key>.txt at build time, which is how the endpoint verifies that
//      whoever is submitting controls the domain.
//
// With no INDEXNOW_KEY set the script does nothing and exits cleanly, so the build works
// unchanged until the key is configured.
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { ROOT_DIR } from './lib/route-data.mjs';

const ENDPOINT = 'https://api.indexnow.org/indexnow';
const SITEMAP_PATH = path.join(ROOT_DIR, 'public', 'sitemap.xml');
const HOST = 'swymble.com';

const extractLocs = (xml) => [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);

/**
 * Prefers the sitemap that is actually live, since that is by definition what the search engine
 * is being told to go and fetch. Falls back to the committed copy when the site is unreachable —
 * running before the first deploy, or from a machine that cannot reach it.
 */
const readSitemapUrls = async () => {
  try {
    const response = await fetch(`https://${HOST}/sitemap.xml`);

    if (response.ok) {
      const urls = extractLocs(await response.text());
      if (urls.length > 0) return urls;
    }

    console.warn(`[indexnow] Live sitemap unavailable (HTTP ${response.status}) — using the committed copy.`);
  } catch (error) {
    console.warn(`[indexnow] Could not fetch the live sitemap (${error.message}) — using the committed copy.`);
  }

  return extractLocs(await fs.readFile(SITEMAP_PATH, 'utf8'));
};

const run = async () => {
  const key = process.env.INDEXNOW_KEY?.trim();

  if (!key) {
    console.log('[indexnow] INDEXNOW_KEY not set — skipping submission.');
    return;
  }

  if (!/^[A-Za-z0-9-]{8,128}$/.test(key)) {
    console.warn('[indexnow] INDEXNOW_KEY must be 8-128 characters, letters/digits/dashes only — skipping.');
    return;
  }

  const urlList = await readSitemapUrls();

  if (urlList.length === 0) {
    console.warn('[indexnow] Sitemap contained no URLs — nothing to submit.');
    return;
  }

  const response = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ host: HOST, key, keyLocation: `https://${HOST}/${key}.txt`, urlList }),
  });

  // 200 and 202 both mean accepted; 422 usually means the key file isn't reachable yet, which is
  // expected the very first time this runs (the deploy publishing the key file is the same one
  // calling this). Either way a failed ping is not a reason to fail a deploy that already worked.
  if (response.ok) {
    console.log(`[indexnow] Submitted ${urlList.length} URL(s) — HTTP ${response.status}.`);
    return;
  }

  console.warn(`[indexnow] Submission rejected — HTTP ${response.status} ${response.statusText}.`);
};

run().catch((error) => {
  console.warn('[indexnow] Submission failed (non-fatal):', error.message);
});
