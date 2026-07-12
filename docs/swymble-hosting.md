# SWYMBLE Hosting Plan

## Current recommendation

Keep SWYMBLE on GitHub Pages for the current static site and deploy MyBirth as a built subdomain folder inside the same Pages artifact.

Why:

- The main SWYMBLE site and MyBirth are static Vite builds.
- MyBirth currently uses key-free client-side integrations and does not need a server.
- GitHub Pages keeps hosting cost and maintenance low.
- The existing GitHub Actions workflow already publishes `dist/`.

## Build and deploy flow

1. Install the main site dependencies with `npm ci`.
2. Install MyBirth dependencies with `npm ci --prefix src/data/subdomains/mybirth`.
3. Run `npm run build`.
4. The root app builds into `dist/`.
5. The MyBirth subdomain app builds from `src/data/subdomains/mybirth/` into `dist/subdomains/mybirth/`.
6. GitHub Pages publishes the whole `dist/` artifact.

## Cloudflare setup for MyBirth

Create DNS for `mybirth.swymble.com` in Cloudflare and route it through a Worker.

Worker source:

```text
cloudflare/mybirth-subdomain-worker.js
```

Worker route:

```text
mybirth.swymble.com/*
```

Behavior:

- `https://mybirth.swymble.com/` fetches `https://swymble.com/subdomains/mybirth/index.html`.
- `https://mybirth.swymble.com/assets/...` fetches `https://swymble.com/subdomains/mybirth/assets/...`.
- Unknown extensionless paths fall back to the MyBirth index page.

## Cloudflare setup for what2watch

Same pattern as MyBirth. The what2watch app builds from
`src/data/subdomains/what2watch/` into `dist/subdomains/what2watch/` as part
of `npm run build` (the GitHub Actions workflow already installs its
dependencies and builds it).

One-time Cloudflare setup:

1. **Create the Worker** — Cloudflare dashboard → Workers & Pages →
   Create → Worker, name it `what2watch-subdomain`, then paste the contents
   of `cloudflare/what2watch-subdomain-worker.js` and Deploy.
2. **Add the DNS record** — dashboard → your `swymble.com` zone → DNS →
   Add record: type `CNAME`, name `what2watch`, target `swymble.com`,
   proxy status **Proxied** (orange cloud). The target barely matters
   because the Worker intercepts the request, but it must be proxied.
3. **Attach the route** — the Worker's Settings → Domains & Routes →
   Add route: `what2watch.swymble.com/*`, zone `swymble.com`.
   (Alternatively add it as a Custom Domain `what2watch.swymble.com`,
   which creates the DNS record for you and replaces step 2.)

Behavior:

- `https://what2watch.swymble.com/` fetches `https://swymble.com/subdomains/what2watch/index.html`.
- `https://what2watch.swymble.com/assets/...` fetches `https://swymble.com/subdomains/what2watch/assets/...`.
- Unknown extensionless paths fall back to the what2watch index page.

Note: the what2watch engine runs single-threaded in production unless
cross-origin isolation headers (COOP/COEP) are added — GitHub Pages cannot
set them, but the Worker could inject them on responses if multithreading is
ever needed. The current presets run fine without it.

## Cloudflare setup for Watch Paint Dry (custom domain)

Watch Paint Dry lives in this repo as a plain static subdomain folder
(`src/data/subdomains/watchpaintdry/`, copied to
`dist/subdomains/watchpaintdry/` on build) but is served on its own domain,
`www.watchpaintdry.net`, instead of a swymble.com subdomain. The folder
carries a `CNAME` file naming that domain, which
`scripts/lib/subdomains.mjs` reads so generated SEO files use the right
host.

One-time Cloudflare setup (full steps in the header comment of
`cloudflare/watchpaintdry-worker.js`):

1. Add the `watchpaintdry.net` zone to Cloudflare (update nameservers at
   the registrar; SSL is handled by Cloudflare from then on).
2. Create a Worker from `cloudflare/watchpaintdry-worker.js`.
3. Add proxied DNS records for `@` and `www`, and attach routes
   `watchpaintdry.net/*` and `www.watchpaintdry.net/*` to the Worker.
4. Verify the site, then disable GitHub Pages on the old standalone
   `watchpaintdry` repo so the domain has a single deployment source.

Behavior:

- `https://watchpaintdry.net/*` 301-redirects to `https://www.watchpaintdry.net/*` (canonical host).
- `https://www.watchpaintdry.net/` fetches `https://swymble.com/subdomains/watchpaintdry/index.html`.
- `robots.txt`, `sitemap.xml`, `llms.txt`, and `preview.png` are served the same way from the folder.

Until the Worker is live, the old standalone repo's GitHub Pages
deployment keeps serving the domain — nothing breaks during the
transition.

## When to move to AWS

Do not move to AWS just for the current static site.

Revisit AWS when SWYMBLE needs one or more of these:

- payments or gift checkout
- user accounts
- server-side generated certificates or stories
- private admin tools
- custom cache/header control beyond GitHub Pages
- separate staging and production environments

If AWS becomes necessary, prefer AWS Amplify Hosting first. Use S3 plus CloudFront only when low-level infrastructure control is worth the extra setup.
