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
      return response;
    }

    // Extensionless miss — the site is a single page, so serve it rather than a 404.
    originUrl.pathname = `${OGLETS_PREFIX}/index.html`;
    return fetch(new Request(originUrl, request));
  },
};

function toOriginPath(pathname) {
  const normalizedPath = pathname === '/' ? '/index.html' : pathname;
  return `${OGLETS_PREFIX}${normalizedPath.startsWith('/') ? normalizedPath : `/${normalizedPath}`}`;
}

function hasFileExtension(pathname) {
  return /\.[a-z0-9]+$/i.test(pathname.split('/').pop() || '');
}
