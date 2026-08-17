// Routes oglets.swymble.com to the Oglets build served from the main swymble.com origin
// (dist/subdomains/oglets/) — same pattern as mybirth-subdomain-worker.js and
// what2watch-subdomain-worker.js.
//
// Deploy either way:
//   npx wrangler deploy --config cloudflare/oglets-subdomain-worker.wrangler.toml
//   ...or paste this file into the dashboard's Workers "Quick edit" editor and attach
//      oglets.swymble.com by hand (how the other two subdomain workers were deployed).
//
// The toml attaches oglets.swymble.com as a Custom Domain, so wrangler creates the proxied DNS
// record itself — unlike mybirth/what2watch/watchpaintdry, which sit on zone routes because
// their hostnames already had records. See that file's header if the deploy hits error 100117.
const ORIGIN_HOST = 'swymble.com';
const OGLETS_PREFIX = '/subdomains/oglets';

export default {
  async fetch(request) {
    const incomingUrl = new URL(request.url);
    const originUrl = new URL(request.url);

    originUrl.protocol = 'https:';
    originUrl.hostname = ORIGIN_HOST;
    originUrl.port = '';
    originUrl.pathname = toOriginPath(incomingUrl.pathname);

    const response = await fetch(new Request(originUrl, request));

    if (response.status !== 404 || hasFileExtension(incomingUrl.pathname)) {
      return revalidated(response);
    }

    // Extensionless miss — the site is a single page, so serve it rather than a 404.
    originUrl.pathname = `${OGLETS_PREFIX}/index.html`;
    return revalidated(await fetch(new Request(originUrl, request)));
  },
};

/**
 * Serve everything with `no-cache`, which means "you may keep it, but ask before you use it".
 *
 * **This subdomain has no build step**, so it ships native ES modules under permanent names —
 * `src/main.js` is `src/main.js` forever, with no content hash to change when its contents do.
 * GitHub Pages sends `max-age=600` on all of it, and against unhashed modules that is not merely
 * stale, it is *broken*: for ten minutes after a deploy the edge serves whichever mixture of old
 * and new files each node happens to hold, and an old `main.js` importing a module the new build
 * renamed or removed takes the whole page down with it. That happened, live, when the two bench
 * files were renamed to `*.dev.js`.
 *
 * `no-cache` keeps the ETag round trip — a 304 is a few hundred bytes — so the cost is one
 * conditional request per file and the site can never be assembled from two different builds.
 * If this subdomain ever gains a bundler with hashed filenames, delete this and cache hard.
 */
function revalidated(response) {
  const headers = new Headers(response.headers);
  headers.set('cache-control', 'no-cache');
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function toOriginPath(pathname) {
  const normalizedPath = pathname === '/' ? '/index.html' : pathname;
  return `${OGLETS_PREFIX}${normalizedPath.startsWith('/') ? normalizedPath : `/${normalizedPath}`}`;
}

function hasFileExtension(pathname) {
  return /\.[a-z0-9]+$/i.test(pathname.split('/').pop() || '');
}
