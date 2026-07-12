// Routes watchpaintdry.net to the WatchPaintDry build served from the main swymble.com origin
// (dist/subdomains/watchpaintdry/) — same pattern as mybirth-subdomain-worker.js, but on the
// watchpaintdry.net zone instead of a swymble.com subdomain.
//
// One-time Cloudflare setup (the watchpaintdry.net zone must be on Cloudflare):
//   1. Workers & Pages → Create → Worker, name it `watchpaintdry-site`, paste this file, Deploy.
//   2. In the watchpaintdry.net zone, add proxied DNS records for `@` and `www`
//      (e.g. A @ 192.0.2.1 / CNAME www watchpaintdry.net — targets are placeholders; the
//      Worker intercepts every request, but the records must exist and be proxied).
//   3. Worker Settings → Domains & Routes → add routes `watchpaintdry.net/*` and
//      `www.watchpaintdry.net/*`, zone watchpaintdry.net.
//   4. After confirming the Worker serves the site, disable GitHub Pages on the old
//      standalone repo so the domain has a single deployment source.
//
// The apex 301-redirects to www so every URL matches the site's canonical form
// (https://www.watchpaintdry.net/).
const ORIGIN_HOST = 'swymble.com';
const CANONICAL_HOST = 'www.watchpaintdry.net';
const SITE_PREFIX = '/subdomains/watchpaintdry';

export default {
  async fetch(request) {
    const incomingUrl = new URL(request.url);

    if (incomingUrl.hostname !== CANONICAL_HOST) {
      incomingUrl.protocol = 'https:';
      incomingUrl.hostname = CANONICAL_HOST;
      return Response.redirect(incomingUrl.toString(), 301);
    }

    const originUrl = new URL(request.url);
    originUrl.protocol = 'https:';
    originUrl.hostname = ORIGIN_HOST;
    originUrl.port = '';
    originUrl.pathname = toOriginPath(incomingUrl.pathname);

    const response = await fetch(new Request(originUrl, request));

    if (response.status !== 404 || hasFileExtension(incomingUrl.pathname)) {
      return response;
    }

    // Single-page toy: extensionless misses fall back to the index page with a 404 status.
    originUrl.pathname = `${SITE_PREFIX}/index.html`;
    const fallback = await fetch(new Request(originUrl, request));
    return new Response(fallback.body, { status: 404, headers: fallback.headers });
  },
};

function toOriginPath(pathname) {
  const normalizedPath = pathname === '/' ? '/index.html' : pathname;
  return `${SITE_PREFIX}${normalizedPath.startsWith('/') ? normalizedPath : `/${normalizedPath}`}`;
}

function hasFileExtension(pathname) {
  return /\.[a-z0-9]+$/i.test(pathname.split('/').pop() || '');
}
