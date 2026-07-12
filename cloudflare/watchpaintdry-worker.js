// Routes watchpaintdry.net to the WatchPaintDry build served from the main swymble.com origin
// (dist/subdomains/watchpaintdry/) — same pattern as mybirth-subdomain-worker.js, but on the
// watchpaintdry.net zone instead of a swymble.com subdomain.
//
// Deployed via wrangler from the repo root (config: watchpaintdry-worker.wrangler.toml):
//   npx wrangler deploy --config cloudflare/watchpaintdry-worker.wrangler.toml
// The toml attaches the watchpaintdry.net / www.watchpaintdry.net custom domains (which
// requires the watchpaintdry.net zone to exist on the Cloudflare account — wrangler creates
// the DNS records itself). Once the Worker serves the domain, disable GitHub Pages on the
// old standalone repo so the domain has a single deployment source.
//
// The apex 301-redirects to www so every URL matches the site's canonical form
// (https://www.watchpaintdry.net/). The *.workers.dev host serves content directly instead
// of redirecting, so the deployment can be previewed before the domain is attached.
const ORIGIN_HOST = 'swymble.com';
const CANONICAL_HOST = 'www.watchpaintdry.net';
const SITE_PREFIX = '/subdomains/watchpaintdry';

export default {
  async fetch(request) {
    const incomingUrl = new URL(request.url);
    const isPreviewHost = incomingUrl.hostname.endsWith('.workers.dev');

    if (!isPreviewHost && incomingUrl.hostname !== CANONICAL_HOST) {
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
