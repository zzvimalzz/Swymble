// Routes malaysiahub.swymble.com to the static Next.js export served from
// the swymble.com origin under /subdomains/malaysiahub/.
//
// The export uses trailing-slash routes (each page is <route>/index.html),
// so extensionless paths map to their directory index — GitHub Pages would
// otherwise answer with a redirect that leaks the origin URL.
//
// Note: the app can alternatively be deployed as its own Cloudflare Worker
// (OpenNext) with malaysiahub.swymble.com as a custom domain — see the
// malaysiahub repo's wrangler.jsonc. Use one or the other, not both.
const ORIGIN_HOST = 'swymble.com';
const MALAYSIAHUB_PREFIX = '/subdomains/malaysiahub';

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

    originUrl.pathname = `${MALAYSIAHUB_PREFIX}/404.html`;
    const notFound = await fetch(new Request(originUrl, request));
    return new Response(notFound.body, { status: 404, headers: notFound.headers });
  },
};

function toOriginPath(pathname) {
  if (hasFileExtension(pathname)) {
    return `${MALAYSIAHUB_PREFIX}${pathname}`;
  }
  const withSlash = pathname.endsWith('/') ? pathname : `${pathname}/`;
  return `${MALAYSIAHUB_PREFIX}${withSlash}index.html`;
}

function hasFileExtension(pathname) {
  return /\.[a-z0-9]+$/i.test(pathname.split('/').pop() || '');
}
