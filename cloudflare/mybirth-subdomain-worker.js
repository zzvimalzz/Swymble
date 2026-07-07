const ORIGIN_HOST = 'swymble.com';
const MYBIRTH_PREFIX = '/subdomains/mybirth';
const ROOT_ASSET_PREFIXES = ['/models/'];

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

    originUrl.pathname = `${MYBIRTH_PREFIX}/404.html`;
    const notFound = await fetch(new Request(originUrl, request));
    return new Response(notFound.body, { status: 404, headers: notFound.headers });
  },
};

function toOriginPath(pathname) {
  if (ROOT_ASSET_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return pathname;
  }

  const normalizedPath = pathname === '/' ? '/index.html' : pathname;
  return `${MYBIRTH_PREFIX}${normalizedPath.startsWith('/') ? normalizedPath : `/${normalizedPath}`}`;
}

function hasFileExtension(pathname) {
  return /\.[a-z0-9]+$/i.test(pathname.split('/').pop() || '');
}
