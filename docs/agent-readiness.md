# Agent readiness

Companion to [`search-visibility.md`](search-visibility.md). That document is about being *found*;
this one is about what happens when an automated client — a crawler, an assistant with browsing,
an agent driving a browser — actually arrives.

It covers what this repo now does, the two steps that can only happen in Cloudflare, and — at
some length, because it is the more important half — the discovery documents this site
deliberately does **not** publish.

---

## 1. What shipped

### Markdown twin for every content page

`scripts/generate-markdown.mjs` writes a `.md` alongside each page at build time:

```
https://swymble.com/labs/mydompet      →  the site
https://swymble.com/labs/mydompet.md   →  the same content, ~3 KB, no markup
```

Covered: `/`, `/about`, `/labs`, every `/labs/<id>`, `/projects`, `/blog`, every `/blog/<id>`.

The Markdown is generated from `src/data`, not converted from the built HTML — converting would
tie the output to the DOM and break silently the first time a component is restyled. Each file
carries front matter with its title, description and canonical URL, so an agent knows what it is
holding and where the human version lives.

`/contact` and `/resume` have none, on purpose: the contact page is a form with nothing to read,
and the resume is assembled from the career graph at render time, so a Markdown copy would be a
second renderer to keep correct rather than a second view of the same data.
`scripts/lib/markdown-routes.mjs` is the single source of truth for which routes have one, shared
by the script that writes them and the script that advertises them.

### Typed links (RFC 8288)

Every page's `<head>` now carries the relations a static host can express — all registered IANA
relation types, no invented ones:

| Relation | Target |
| --- | --- |
| `canonical` | the page's own URL |
| `alternate` `type="text/markdown"` | that page's `.md` twin (per route — see below) |
| `alternate` `type="application/rss+xml"` | `/feed.xml` |
| `describedby` | `/llms.txt` |
| `author` | `/about` |

`scripts/prerender-meta.mjs` stamps the Markdown link per route and **removes** it on routes with
no `.md`. That removal is the whole point: the element lives in `index.html` pointing at the
homepage's `/index.md`, so without it `/contact` would have advertised the homepage's Markdown and
sent an agent asking about contact details a page about Swymble Labs instead.

### WebMCP tools

`src/hooks/useWebMcp.ts` registers five read-only tools with `navigator.modelContext` when the
browser supports it:

- `get_swymble_overview` — what Swymble is, services, contact, full FAQ
- `list_swymble_labs` — every lab, optionally filtered by status
- `get_swymble_lab` — one lab in full: overview, features, specs, FAQ
- `list_swymble_projects` — shipped client work
- `search_swymble_writing` — blog search by keyword

Feature-detected and wrapped in a `try`, so it is a no-op in every browser that lacks the API —
which today is nearly all of them.

**Everything is read-only, deliberately.** There is no `submit_contact_form` tool. An agent that
can send mail on a visitor's behalf without the visitor typing it is a spam vector aimed at your
own inbox, and the form is one click away for the human who actually wants it.

---

## 2. Two things only Cloudflare can do

GitHub Pages cannot set custom response headers. Both of these need the edge.

### 2.1 `Link` response headers

The HTML carries the relations above, but an agent issuing a `HEAD` request, or reading headers
before parsing a body, never sees them. Two options:

**Option A — Transform Rule (no code in the request path, lowest risk).**
Cloudflare dashboard → `swymble.com` → Rules → Transform Rules → **Modify Response Header** →
Create. Match `hostname equals swymble.com`, then *Set static* header `Link` to:

```
</llms.txt>; rel="describedby"; type="text/plain", </llms-full.txt>; rel="describedby"; type="text/plain", </sitemap.xml>; rel="sitemap"; type="application/xml", </feed.xml>; rel="alternate"; type="application/rss+xml", </about>; rel="author", </>; rel="home"
```

This is static, so it cannot carry the per-page `alternate type="text/markdown"` link — the HTML
still does. Good enough, and it takes two minutes.

**Option B — the Worker (`cloudflare/agent-discovery-worker.js`).**
Adds per-page Markdown links *and* content negotiation (2.2). Deploy with:

```bash
npx wrangler deploy --config cloudflare/agent-discovery-worker.wrangler.toml
```

⚠️ Its route is `swymble.com/*`, so it sits in front of the entire site. It is written to be
additive — it skips assets and `/api/`, never rewrites HTML, and falls through to the normal page
whenever anything is unexpected — but deploy it when you can watch the site afterwards. Rollback
is `wrangler delete`; the site is served by GitHub Pages either way and every `.md` stays
reachable at its own URL.

### 2.2 `Accept: text/markdown` negotiation

Right now an agent gets Markdown by knowing the `.md` convention. With negotiation it just asks:

```bash
curl -H "Accept: text/markdown" https://swymble.com/labs/mydompet
```

Two ways to get there:

- **Cloudflare's own "Markdown for Agents"** (dashboard toggle, zero code) —
  <https://developers.cloudflare.com/fundamentals/reference/markdown-for-agents/>. Converts your
  HTML on the fly. Easiest path; the conversion is generic rather than hand-shaped.
- **The Worker above**, which serves the pre-built `.md` files. Better output, because the
  Markdown was written as Markdown rather than derived from a page full of animated sections.

The Worker sets `Vary: Accept` on negotiated responses. That matters more than it looks: without
it, Cloudflare's cache would serve one representation to everyone and whichever request arrived
first would decide whether humans or agents get the right thing.

### 2.3 Verifying

```bash
curl -sI https://swymble.com/ | grep -i '^link:'
curl -sI -H "Accept: text/markdown" https://swymble.com/labs/mydompet | grep -i 'content-type\|vary'
curl -s https://swymble.com/labs/mydompet.md | head -20
```

---

## 3. What this site deliberately does not publish

An agent-readiness audit will flag all of the following as missing. They are missing because
publishing them would be false. Each one is a promise about a capability, and a discovery document
describing a capability that does not exist is worse than no document: it sends an agent down a
path that dead-ends, and it costs it a round trip and a retry to find that out.

Swymble is a static marketing and portfolio site on GitHub Pages. It has no user accounts, no
public API, no MCP server and no published skills.

### `/.well-known/openid-configuration`, `/.well-known/oauth-authorization-server`

**Not published — there is no authorization server.** These documents advertise
`authorization_endpoint`, `token_endpoint` and `jwks_uri`. Swymble has none of them. An agent
that found this file would attempt an OAuth flow against URLs that return 404. The audit's own
wording is conditional — *"if your site has protected APIs"* — and this one does not.

### `/.well-known/oauth-protected-resource`

**Not published — there is no protected resource.** Same reasoning. This document exists to tell
an agent which authorization servers can mint tokens for a resource; with no resource and no
authorization server it would be an empty promise pointing at another empty promise.

### `/auth.md`

**Not published.** It documents agent *registration* against the OAuth metadata above. Without
either of those it has nothing to describe.

### `/.well-known/api-catalog` (RFC 9727)

**Not published — and this one is a judgement call worth stating.** Swymble has exactly one HTTP
endpoint: `POST /api/contact`, the Cloudflare Worker behind the contact form. It is technically an
API, so a catalog listing it would not be a lie.

It would be a bad idea. A catalog entry is an invitation, and the thing being advertised is a
write endpoint that sends email to a personal inbox. The Worker rate-limits by IP and spam-checks
submissions, but publishing a machine-readable pointer to it invites exactly the traffic those
defences exist to absorb. There is no read API, no OpenAPI spec and no documentation to link as
`service-desc` or `service-doc`, so the catalog would consist of one entry whose only real
function is advertising a spam target.

If Swymble ever ships a public read API, this becomes the right thing to publish. Today it is
not.

### `/.well-known/mcp/server-card.json` (SEP-1649)

**Not published — there is no MCP server.** The card's required fields are a transport endpoint
and a capability list. Pointing at a `wss://` or `https://` endpoint that does not exist gives an
agent a connection failure instead of an answer.

Worth noting: this is the one on the list that would be genuinely *useful* to build. A small
Cloudflare Worker MCP server exposing the same five tools the WebMCP hook already defines — labs,
projects, writing, overview — would let any MCP client query Swymble without a browser. The tool
definitions in `src/hooks/useWebMcp.ts` are most of the design work already. That is a project,
not a metadata file, and it should ship before the card that advertises it.

### `/.well-known/agent-skills/index.json`

**Not published — there are no skills to index.** This lists instruction documents a site
publishes *for* agents to follow. Swymble does not author any. An index with an empty `skills`
array, or one padded with a contrived "how to brief Swymble on a project" document nobody wrote
for real use, is noise in a namespace whose value depends on entries being real.

### DNS-AID records (`_index._agents.swymble.com`)

**Not published, for two reasons.**

First, it is an
[individual IETF draft](https://datatracker.ietf.org/doc/draft-mozleywilliams-dnsop-dnsaid/), not
a standard — `draft-mozleywilliams-dnsop-dnsaid` has not been adopted by a working group, so its
record format can still change. Committing DNS records to a moving target has a real cost and no
current consumer.

Second, and more decisively: these records advertise *agent endpoints* — an A2A agent, an MCP
server — via SVCB/HTTPS records with `alpn` and `endpoint` parameters. Swymble operates neither.
The records would resolve to nothing.

Should that change — if the MCP server above ever gets built — the DNS work is genuinely the
right follow-up, and the draft's DNSSEC recommendation matters then: Cloudflare can sign the zone
with one toggle under DNS → Settings → DNSSEC.

---

## 4. Summary

| Recommendation | Status |
| --- | --- |
| Markdown for agents | ✅ `.md` twin for every content page; negotiation needs 2.2 |
| `Link` headers (RFC 8288) | ✅ in HTML; response headers need 2.1 |
| WebMCP | ✅ five read-only tools, feature-detected |
| API catalog (RFC 9727) | ❌ no public read API; the one write endpoint should not be advertised |
| OAuth / OIDC discovery | ❌ no authorization server |
| OAuth protected resource | ❌ no protected resource |
| `auth.md` | ❌ depends on the two above |
| MCP server card | ❌ no MCP server — worth *building* first, see §3 |
| Agent skills index | ❌ no skills authored |
| DNS-AID | ❌ unadopted draft, and no agent endpoints to advertise |

The honest position is that a static portfolio site is *already* close to fully agent-ready once
its content is fetchable as clean text and its links are typed. That is what shipped. The rest of
the checklist describes an application, and the right time to publish those documents is the day
the application behind them exists.
