// Routes mymalaysia.swymble.com to the static Next.js export served from
// the swymble.com origin under /subdomains/mymalaysia/.
//
// The export uses trailing-slash routes (each page is <route>/index.html),
// so extensionless paths map to their directory index — GitHub Pages would
// otherwise answer with a redirect that leaks the origin URL.
//
// Note: the app can alternatively be deployed as its own Cloudflare Worker
// (OpenNext) with mymalaysia.swymble.com as a custom domain — see the
// mymalaysia repo's wrangler.jsonc. Use one or the other, not both.
const ORIGIN_HOST = 'swymble.com';
const MYMALAYSIA_PREFIX = '/subdomains/mymalaysia';

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

    originUrl.pathname = `${MYMALAYSIA_PREFIX}/404.html`;
    const notFound = await fetch(new Request(originUrl, request));
    return new Response(notFound.body, { status: 404, headers: notFound.headers });
  },
};

function toOriginPath(pathname) {
  if (hasFileExtension(pathname)) {
    return `${MYMALAYSIA_PREFIX}${pathname}`;
  }
  const withSlash = pathname.endsWith('/') ? pathname : `${pathname}/`;
  return `${MYMALAYSIA_PREFIX}${withSlash}index.html`;
}

function hasFileExtension(pathname) {
  return /\.[a-z0-9]+$/i.test(pathname.split('/').pop() || '');
}
