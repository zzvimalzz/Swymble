# Search visibility plan

Written because `site:swymble.com` returns nothing, and because asking ChatGPT or Claude what
Swymble is produces either a blank or a confident answer about a different product. This
document is the diagnosis, the changes made in this repo, and the list of things only the domain
owner can do — which is where most of the remaining work is.

---

## 1. Diagnosis

### The site is not "deindexed". It was never discovered.

The technical SEO on this repo was already better than most: a sitemap, a
crawler-friendly `robots.txt` that names the AI crawlers explicitly, per-route meta tags stamped
into static HTML, and a full Puppeteer prerender so crawlers that don't run JavaScript still see
real page text. None of that causes a crawl.

A search engine reaches a new site in one of two ways:

1. **It follows a link to it from a page it already crawls.**
2. **It is told the site exists**, through Search Console / Bing Webmaster Tools.

Swymble has neither. A web search for "swymble.com" returns only similarly-spelled domains, and
a search for "Swymble software studio" returns Swyvel, Swym and Swyble. There is no evidence the
domain has ever been submitted, and nothing external links to it. `robots.txt` and `sitemap.xml`
are instructions for a crawler that has already arrived — they do not summon one.

**This is the single biggest cause, and no amount of on-site work fixes it.** Section 3 is the
fix, and it takes about twenty minutes.

### The brand name has strong competition

"Swymble" is one letter away from several established products — Swyvel (dance studio software),
Swym (a Shopify wishlist platform with a large review footprint), Swyble, SWYM App. A search
engine with no signal for "Swymble" assumes a typo and serves those instead. That is not
permanent, but it means the entity signals have to be unambiguous and, crucially, corroborated
somewhere other than this site.

### `www.swymble.com` was broken

The subdomain router in `index.html` treated any label before `.swymble.com` as a subdomain app.
`www` matched, so `https://www.swymble.com/` was rewritten to `/subdomains/www/index.html` —
which does not exist — and every www visitor and every crawl of a www link landed on the 404
handler. Fixed (see section 2).

### The labs had nothing to index

MyDompet, Territory, Cortex, MyBirth, what2watch and Watch Paint Dry existed only as cards in the
`/labs` grid. There was no URL for "MyDompet", so there was no page for a search engine to rank
against that name and nothing for an assistant to cite. Fixed (see section 2).

### Why AI assistants don't know what Swymble is

Two separate mechanisms, and it is worth not confusing them:

- **Training knowledge** comes from large crawls of the web. A model learns an entity when
  multiple independent sources describe it consistently. One self-published site is not enough,
  and it is not something a deploy can change.
- **Live retrieval** — ChatGPT search, Claude's web search, Perplexity — runs a search at answer
  time. ChatGPT's browsing and Copilot lean on **Bing's** index; Perplexity runs its own crawler
  plus third-party indexes.

So live retrieval is the reachable target, and it is gated on exactly the same thing as ordinary
search: being in the index. Getting into **Bing** specifically is what makes ChatGPT able to
answer "what is Swymble?" — which is why IndexNow (section 2) and Bing Webmaster Tools
(section 3) are on this list rather than treated as an afterthought to Google.

---

## 2. What changed in this repo

| Change | Where | Why |
| --- | --- | --- |
| `www` no longer treated as a subdomain app; redirects to the apex host | `index.html`, `vite.config.ts` | www.swymble.com served a 404 to visitors and crawlers |
| Per-lab pages at `/labs/<id>` | `src/views/desktop/DesktopLabDetail.tsx`, `src/data/labs/*.ts` | Gives every lab a URL, a title, a description and enough prose to rank for and be quoted from |
| Long-form `detail` content for all six labs | `src/data/labs/*.ts` | A page that restates its own card has nothing to rank on |
| Product / breadcrumb / FAQ structured data per lab | `src/utils/labSeo.ts` | Ties each product to the Swymble organisation rather than leaving it a free-floating name |
| `CollectionPage` + `ItemList` on `/labs` | `src/views/desktop/DesktopLabs.tsx` | States that the page is an index of six named products |
| Sitewide entity graph: `Organization` + `Person` + `WebSite`, with `@id` anchors | `index.html` | One consistent entity across every page, with `alternateName`, location, founder and contact |
| `AboutPage` on `/about` and `ProfilePage` on `/resume`, each with `mainEntity` pointing at the anchors above | `src/utils/pageSeo.ts` | Names which *page* is the authoritative description of which entity. Without it, `/about` is a page that mentions Swymble; with it, `/about` is declared to be the page **about** Swymble — the link a "what is Swymble?" query resolves through |
| "In plain language" FAQ on `/about`, plus `FAQPage` schema | `src/data/home/faq.ts`, `src/components/desktop/About/FaqPanel.tsx` | The site never actually *stated* what Swymble is in indexable prose. This is the block answer engines quote |
| Lab URLs in the sitemap, with `lastmod` | `scripts/generate-sitemap.mjs` | 14 indexable URLs, up from 7 |
| Generated `llms.txt` + new `llms-full.txt` | `scripts/generate-llms.mjs` | Every lab described in plain text, generated from the same data the site renders so it cannot drift |
| RSS feed at `/feed.xml` | `scripts/generate-feed.mjs` | A second machine-readable door; aggregators and crawlers poll feeds faster than they re-crawl pages |
| Google / Bing verification meta tags, env-driven | `vite.config.ts` | Makes section 3 a variable change rather than a code change |
| A `.md` twin of every content page, typed `<link>` relations, WebMCP tools | see [`agent-readiness.md`](agent-readiness.md) | Assistants that fetch a page get the answer as clean text instead of 40 KB of markup around it |
| IndexNow key file + post-deploy submission | `scripts/generate-indexnow-key.mjs`, `scripts/submit-indexnow.mjs` | Direct "these URLs exist" ping to Bing — the one discovery channel that does not require a link first |

All of it is generated from `src/data`, so adding a lab or a post updates the sitemap, the
prerendered pages, `llms.txt` and the feed on the next build with no extra edit.

### Verify locally

```bash
npm run generate:seo   # sitemap, robots, llms.txt, llms-full.txt, feed.xml, indexnow key
npm run build:main     # + prerendered HTML for every route
npm test               # data-integrity checks, including title/description length budgets
```

---

## 3. What only you can do

Ordered by impact. The first two are the whole ballgame.

### 3.1 Google Search Console — 10 minutes, do this first

1. Go to <https://search.google.com/search-console> and add a **Domain** property for
   `swymble.com` (this covers www and every subdomain in one property).
2. Verify with a DNS TXT record in Cloudflare. If you would rather verify by HTML tag, set the
   `GOOGLE_SITE_VERIFICATION` repository variable instead — the build injects the meta tag.
3. **Sitemaps → submit `https://swymble.com/sitemap.xml`.**
4. **URL Inspection → Request Indexing** for, at minimum: `/`, `/about`, `/labs`, and each of the
   six `/labs/<id>` pages. This is the manual nudge that gets a linkless domain its first crawl.
5. Come back in a few days and read **Pages → Why pages aren't indexed**. "Discovered – currently
   not indexed" means it knows about the URL but hasn't judged it worth crawling: that is a
   link/authority problem, and section 3.4 is the answer. "Crawled – currently not indexed" means
   it fetched the page and passed: that is a content problem.

### 3.2 Bing Webmaster Tools — 5 minutes, and this is what ChatGPT reads

1. <https://www.bing.com/webmasters> → **Import from Google Search Console** (fastest path).
2. Submit the same sitemap.
3. Generate an IndexNow key and add it as a repository variable:
   ```bash
   node -e "console.log(crypto.randomUUID().replace(/-/g,''))"
   ```
   → GitHub → Settings → Secrets and variables → Actions → **Variables** → `INDEXNOW_KEY`.
   From then on every deploy publishes `/<key>.txt` and pings Bing with the sitemap's URLs.
   (Optionally also set `BING_SITE_VERIFICATION` for the meta-tag route.)

None of these three values is a secret — they are published in the site — so repository
*variables* are correct, not secrets.

### 3.3 Check Cloudflare is not blocking the crawlers you want

Cloudflare sits in front of `swymble.com`, and a few of its defaults will quietly undo everything
above. In the dashboard for the `swymble.com` zone:

- **SSL/TLS → Overview**: must be **Full** or **Full (strict)**. `Flexible` in front of GitHub
  Pages produces a redirect loop, which crawlers record as a dead site.
- **Security → Bots**: if **"Block AI Scrapers and Crawlers"** is on, it blocks GPTBot,
  ClaudeBot and PerplexityBot at the edge no matter what `robots.txt` says. You want these
  crawlers, so turn it off.
- **Security**: "Under Attack" mode and aggressive managed challenges will challenge crawlers.
  Leave the zone on the normal security level.
- **DNS**: confirm what `www` points at. The code change makes www redirect to the apex from the
  browser, but a proper 301 at the edge (a Cloudflare redirect rule, `www.swymble.com/*` →
  `https://swymble.com/$1`) is better — it happens without JavaScript, which is what a crawler
  wants.

Quick check that the door is open, from any machine:

```bash
curl -sI -A "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)" https://swymble.com/
curl -sI -A "GPTBot" https://swymble.com/
```

Both should be `200`. A `403` means Cloudflare, not the site.

### 3.4 Earn some links — the actual gating factor

A domain with zero inbound links gets crawled rarely and ranks nowhere, and "Discovered –
currently not indexed" in Search Console is Google saying exactly that. These are real, and
mostly free:

**Do first — you already own these surfaces:**
- GitHub: set the repo's **homepage** field to `https://swymble.com`, add topics, and link
  Swymble from your profile README and profile site field. `github.com/zzvimalzz` is already in
  the site's `sameAs`; make the link point both ways.
- LinkedIn: website field on the profile, plus one post per shipped lab.
- Any other bio you control — X, Instagram, Reddit, Dev.to.

**Then — genuinely postable, because the products are actually interesting:**
- **Watch Paint Dry** is tailor-made for r/InternetIsBeautiful, Product Hunt and Show HN.
- **what2watch** fits r/SideProject, r/dataisbeautiful and Product Hunt.
- **MyBirth** fits Product Hunt and gift/keepsake roundups.
- Cross-post the Cortex blog series to dev.to or Hashnode with a `rel=canonical` back to
  `swymble.com/blog/...`. You get the link and the readership without duplicate-content risk.

**Later, once two or more independent sources mention Swymble:**
- Create a **Wikidata** item. It is one of the highest-signal entity sources for both search
  engines and language models, and it is what makes "Swymble" resolvable as a distinct thing
  rather than a misspelling of Swyvel. It needs external sources first — do not attempt it before
  section 3.4 has produced some.

### 3.5 Make the subdomains point home

`mybirth.swymble.com` and `what2watch.swymble.com` link to `https://swymble.com` but not to their
own lab pages; `watchpaintdry.net` links to `/labs`. Point each one at its specific page —
`https://swymble.com/labs/mybirth`, `/labs/what2watch`, `/labs/watchpaintdry` — so the
association between the product and its write-up is explicit. `watchpaintdry.net` is a separate
domain, so that link is a genuine external backlink and worth more than the others.

### 3.6 Always qualify the name off-site

Given the Swyvel/Swym/Swyble collision, never write the bare word in an external bio. Write
"Swymble — a software studio" or "Swymble (swymble.com)". Every corroborating mention that pairs
the name with the category makes the entity easier to disambiguate.

### 3.7 Publish

One blog post is not a content footprint. The build-in-public material is already there — the
Cortex architecture, the offline-first design in MyDompet, the voronoi wall in what2watch. Each
write-up is a page that can rank for something other than the brand name, which is how a site
gets its first non-brand traffic.

---

## 4. Decisions still open

Per-lab social cards used to be listed here. They shipped — `scripts/generate-og-cards.mjs`
renders one per lab at build time; see [`agent-readiness.md`](agent-readiness.md) §1.5.

What is left needs your details, not code:

- **Use a full name.** The site names the engineer only as "Vimal" (in `src/data/resume.ts`),
  which is what the `Person` entity in `index.html` uses. A full name plus a LinkedIn URL in
  `sameAs` would let search engines and assistants connect the studio, the person and their work
  history into one entity instead of three loose ones. It is a privacy trade-off, so it is your
  call — but it is a real signal.
- **More `sameAs` profiles.** The `Organization` and `Person` entities list only
  `https://github.com/zzvimalzz`. `sameAs` is how an entity is corroborated across the web, and
  one link is the weakest possible version of it. Every profile you actually control — LinkedIn,
  X, Product Hunt, dev.to — belongs in both arrays in `index.html`. This is the single cheapest
  entity signal left, and it is blocked only on you pasting the URLs.

---

## 5. What "working" looks like

| When | What to expect |
| --- | --- |
| Within a day of the IndexNow ping | Bing Webmaster Tools shows the URLs as submitted |
| 3–14 days after requesting indexing | `site:swymble.com` starts returning pages; Search Console's Pages report shows Indexed counts |
| 2–6 weeks, with some links in place | Brand queries ("swymble", "swymble labs") return the site; lab names start returning their own pages |
| 1–3 months | Assistants with live search can answer "what is Swymble?" from `/about` and `llms.txt` |
| 6+ months, with sustained external mentions | The entity may start appearing in model training data — this is the slow one and it depends entirely on section 3.4 |

Check the structured data any time with Google's
[Rich Results Test](https://search.google.com/test/rich-results) and
[Schema Markup Validator](https://validator.schema.org/) against `https://swymble.com/about` and
`https://swymble.com/labs/mydompet`.
