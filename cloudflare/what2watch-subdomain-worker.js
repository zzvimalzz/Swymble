const ORIGIN_HOST = 'swymble.com';
const WHAT2WATCH_PREFIX = '/subdomains/what2watch';

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

    originUrl.pathname = `${WHAT2WATCH_PREFIX}/index.html`;
    return fetch(new Request(originUrl, request));
  },
};

function toOriginPath(pathname) {
  const normalizedPath = pathname === '/' ? '/index.html' : pathname;
  return `${WHAT2WATCH_PREFIX}${normalizedPath.startsWith('/') ? normalizedPath : `/${normalizedPath}`}`;
}

function hasFileExtension(pathname) {
  return /\.[a-z0-9]+$/i.test(pathname.split('/').pop() || '');
}
