/**
 * Swymble agent-discovery worker.
 *
 * GitHub Pages serves the site and cannot set custom response headers, so two things that only
 * exist at the HTTP layer are impossible from the repo alone:
 *
 *   1. `Link:` response headers (RFC 8288). The HTML carries the same relations as <link>
 *      elements, but an agent that issues a HEAD request, or reads headers before parsing a body,
 *      never sees those.
 *   2. `Accept: text/markdown` content negotiation. Every page has a .md twin at <path>.md
 *      (scripts/generate-markdown.mjs), but without negotiation an agent has to know the
 *      convention rather than simply asking for what it wants.
 *
 * This Worker adds both at Cloudflare's edge, in front of the existing Pages origin. It is
 * additive: it never changes the HTML, never touches assets, and if it is removed the site
 * carries on serving exactly as it does now — the .md files stay reachable at their own URLs and
 * the <link> elements stay in the markup.
 *
 * ---------------------------------------------------------------------------
 * DEPLOYMENT
 * ---------------------------------------------------------------------------
 * Either paste this into the Workers "Quick edit" editor (matching the other files in this
 * folder), or deploy with wrangler:
 *
 *   npx wrangler deploy --config cloudflare/agent-discovery-worker.wrangler.toml
 *
 * IMPORTANT: this Worker's route is `swymble.com/*`, which means it sits in front of the whole
 * site. Deploy it when you can watch the site afterwards, not right before going away for a week.
 * The subdomain workers (mybirth, what2watch) run on their own hostnames and are unaffected; the
 * contact worker's `swymble.com/api/contact*` route is more specific and still wins.
 */

/** Paths that never need discovery headers — assets, and the machine files that are already terminal. */
const SKIP_PREFIXES = ['/assets/', '/images/', '/models/', '/subdomains/', '/api/'];

/** Routes with a Markdown twin. Mirrors scripts/lib/markdown-routes.mjs — keep the two in step. */
const MARKDOWN_ROUTES = new Set(['/', '/about', '/labs', '/projects', '/blog']);

const hasMarkdown = (pathname) => {
  const path = pathname.length > 1 && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
  return MARKDOWN_ROUTES.has(path) || path.startsWith('/labs/') || path.startsWith('/blog/');
};

const markdownPathFor = (pathname) => {
  const path = pathname.length > 1 && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
  return path === '/' ? '/index.md' : `${path}.md`;
};

/**
 * The highest q-value the Accept header gives to any of `ranges`, or 0 if it names none of them.
 * An absent or unparseable `q` parameter means 1, which is what RFC 9110 specifies for absent.
 */
const acceptQuality = (accept, ...ranges) => {
  let best = 0;

  for (const entry of accept.split(',')) {
    const [range, ...parameters] = entry.trim().split(';').map((part) => part.trim());

    if (!ranges.includes(range.toLowerCase())) continue;

    const quality = parameters.find((parameter) => /^q=/i.test(parameter));
    const parsed = quality ? Number(quality.slice(2)) : 1;
    const value = Number.isFinite(parsed) ? parsed : 1;

    if (value > best) best = value;
  }

  return best;
};

/**
 * True when the client asked for Markdown *in preference to* HTML — compared by q-value, not by
 * presence, because a human's browser must never be handed a .md file.
 *
 * Browsers send `Accept: text/html,application/xhtml+xml,...,*​/*;q=0.8`. They never name
 * `text/markdown`, so the first check alone settles them; the comparison below is what stops a
 * client that lists both (`text/markdown;q=0.1, text/html`) from being read as wanting Markdown
 * when it plainly said the opposite.
 *
 * The wildcard is compared with `>=` rather than `>` on purpose. `Accept: text/markdown, *​/*` is
 * the common agent header, and both entries carry q=1 — but the client named `text/markdown`
 * explicitly and matched HTML only through a catch-all, and a more specific media range wins the
 * match. Explicitly-named `text/html` still needs to be strictly beaten.
 */
const prefersMarkdown = (request) => {
  const accept = (request.headers.get('Accept') ?? '').toLowerCase();
  const markdown = acceptQuality(accept, 'text/markdown');

  if (markdown <= 0) return false;

  const html = acceptQuality(accept, 'text/html', 'application/xhtml+xml');
  const wildcard = acceptQuality(accept, 'text/*', '*/*');

  return markdown > html && markdown >= wildcard;
};

/**
 * The typed links this site offers, per RFC 8288.
 *
 * All IANA-registered relation types bar one: `sitemap` is not in the registry, but it is the
 * long-standing de-facto name for exactly this and no registered relation covers it. `home` was
 * here and is now `index` — `home` is an HTML4 link type that never made it into the registry, so
 * it was a string an agent has no way to interpret, which is the thing this list exists to avoid.
 */
const buildLinkHeader = (url, { includeMarkdown }) => {
  const origin = 'https://swymble.com';
  const links = [
    `<${url.pathname}>; rel="canonical"`,
    `<${origin}/llms.txt>; rel="describedby"; type="text/plain"`,
    `<${origin}/llms-full.txt>; rel="describedby"; type="text/plain"`,
    `<${origin}/sitemap.xml>; rel="sitemap"; type="application/xml"`,
    `<${origin}/feed.xml>; rel="alternate"; type="application/rss+xml"; title="SWYMBLE Blog"`,
    `<${origin}/about>; rel="author"`,
    `<${origin}/>; rel="index"`,
  ];

  if (includeMarkdown) {
    links.push(`<${origin}${markdownPathFor(url.pathname)}>; rel="alternate"; type="text/markdown"`);
  }

  return links.join(', ');
};

const isHtmlResponse = (response) => (response.headers.get('Content-Type') ?? '').includes('text/html');

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (SKIP_PREFIXES.some((prefix) => url.pathname.startsWith(prefix))) {
      return fetch(request);
    }

    const markdownAvailable = hasMarkdown(url.pathname);

    // Content negotiation: serve the .md twin from its real URL, but keep the requested URL as
    // the address. `Vary: Accept` is essential — without it Cloudflare's cache would serve one
    // representation to everyone, and whichever request arrived first would decide whether
    // humans or agents get the right thing.
    if (markdownAvailable && prefersMarkdown(request) && request.method === 'GET') {
      const markdownUrl = new URL(url);
      markdownUrl.pathname = markdownPathFor(url.pathname);

      const markdownResponse = await fetch(new Request(markdownUrl, request));

      if (markdownResponse.ok) {
        const headers = new Headers(markdownResponse.headers);
        headers.set('Content-Type', 'text/markdown; charset=utf-8');
        headers.set('Vary', 'Accept');
        headers.set('Link', buildLinkHeader(url, { includeMarkdown: true }));
        headers.set('X-Robots-Tag', 'noindex');

        return new Response(markdownResponse.body, { status: 200, headers });
      }
      // Fall through to HTML if the .md is missing — a stale MARKDOWN_ROUTES entry should
      // degrade to the normal page, not to a 404.
    }

    const response = await fetch(request);

    // Only decorate documents. Adding Link headers to a font or a hashed JS bundle is noise, and
    // rebuilding those responses for no reason costs latency on every asset the page loads.
    if (!isHtmlResponse(response)) {
      return response;
    }

    const headers = new Headers(response.headers);
    headers.set('Link', buildLinkHeader(url, { includeMarkdown: markdownAvailable }));

    if (markdownAvailable) {
      headers.append('Vary', 'Accept');
    }

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  },
};
