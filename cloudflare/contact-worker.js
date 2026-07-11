/**
 * Swymble contact form API worker.
 *
 * Handles POST /api/contact from the swymble.com marketing site (both the
 * desktop and mobile contact forms share this one endpoint). Validates and
 * spam-checks the submission, rate-limits by IP, and delivers the message
 * via Cloudflare Email Routing (Email Workers "send_email" binding) — no
 * third-party form service is involved.
 *
 * ---------------------------------------------------------------------------
 * DEPLOYMENT — dashboard route (this file is paste-friendly for the Workers
 * "Quick edit" editor, matching the other files in this cloudflare/ folder)
 * ---------------------------------------------------------------------------
 * 1. Workers & Pages → Create → paste this file's contents as a new Worker,
 *    e.g. name it `swymble-contact`.
 * 2. Settings → Variables → add:
 *      - Plaintext var  CONTACT_TO          = hello@swymble.com (optional,
 *                                              this is the default if unset).
 *                                              Cosmetic only — this is what
 *                                              shows up in the email's "To:"
 *                                              header, it does NOT need to be
 *                                              a verified destination address.
 *      - Plaintext var  CONTACT_FROM        = contact@swymble.com (REQUIRED —
 *                                              must be a mailbox/address on a
 *                                              domain that has Email Routing
 *                                              enabled, i.e. swymble.com)
 *      - Plaintext var  CONTACT_DELIVER_TO  = (REQUIRED — see step 3 below;
 *                                              defaults to CONTACT_TO if
 *                                              unset, which will fail unless
 *                                              CONTACT_TO happens to already
 *                                              be a verified destination)
 * 3. Settings → Bindings → add:
 *      - KV Namespace binding, variable name `CONTACT_KV`.
 *        Create the namespace first under Storage & Databases → KV →
 *        Create namespace (e.g. `swymble-contact-rate-limit`), then bind it
 *        here. If this binding is missing, the worker fails OPEN (it logs a
 *        warning and skips rate limiting) rather than breaking the form.
 *      - Email → "Send email" binding, variable name `CONTACT_EMAIL`,
 *        destination address = the SAME address you set as CONTACT_DELIVER_TO
 *        above. This must be a *verified* Destination Address (Email → Email
 *        Routing → Destination Addresses — the address itself, confirmed via
 *        the email Cloudflare sends it, not just a domain with a routing rule
 *        pointing at it). A custom-domain alias like hello@swymble.com does
 *        NOT qualify on its own even if it has an active routing rule —
 *        routing rules govern *inbound* mail, not a Worker's send binding.
 *        If your verified destination is a plain external mailbox (e.g. a
 *        Gmail address from Email Routing setup), use that as both
 *        CONTACT_DELIVER_TO and the binding's destination address; the email
 *        will still visually read "To: hello@swymble.com" in the client
 *        thanks to CONTACT_TO above.
 * 4. Zone → swymble.com → Email → Email Routing → make sure routing is
 *    turned ON for the zone (needed for any Email Worker to send, even
 *    though this worker doesn't route *inbound* mail — Email Routing must
 *    simply be enabled on the zone).
 * 5. Workers & Pages → swymble-contact → Settings → Triggers → Routes →
 *    Add route:
 *      Route:  swymble.com/api/contact*
 *      Zone:   swymble.com
 *    GOTCHA: swymble.com is served by GitHub Pages, fronted by Cloudflare
 *    DNS/proxy. A Worker route on swymble.com/api/* intercepts the request
 *    at Cloudflare's edge BEFORE it ever reaches GitHub Pages — GitHub Pages
 *    never sees /api/contact requests. This is the intended architecture;
 *    no changes are needed on the GitHub Pages side.
 *
 * ---------------------------------------------------------------------------
 * DEPLOYMENT — wrangler CLI (uses contact-worker.wrangler.toml next to this
 * file)
 * ---------------------------------------------------------------------------
 * 1. wrangler kv namespace create CONTACT_KV
 *      → copy the returned `id` into contact-worker.wrangler.toml under
 *        [[kv_namespaces]].
 * 2. Enable Email Routing on the swymble.com zone (dashboard: Email → Email
 *    Routing → Enable), and verify your actual destination mailbox address
 *    (dashboard: Email → Email Routing → Destination Addresses — this is
 *    typically a plain external mailbox, not a swymble.com alias; a
 *    hello@swymble.com-style address with only a routing rule does NOT
 *    count as verified for a send_email binding's destination).
 *    Email Routing setup cannot currently be scripted with wrangler; it must
 *    be done once in the dashboard.
 * 3. wrangler secret put CONTACT_TO           (cosmetic "To:" header only —
 *                                              or leave unset to default to
 *                                              hello@swymble.com)
 *    wrangler secret put CONTACT_FROM         (must be @swymble.com)
 *    wrangler secret put CONTACT_DELIVER_TO   (must be the verified
 *                                              destination address from
 *                                              step 2 — this is the actual
 *                                              delivery target)
 *    — or set them as plain [vars] in the toml if they're not sensitive.
 * 4. wrangler deploy --config cloudflare/contact-worker.wrangler.toml
 *      This publishes the worker AND (per the toml's [[routes]] block)
 *      attaches it to swymble.com/api/contact* automatically.
 *
 * ---------------------------------------------------------------------------
 * API CONTRACT
 * ---------------------------------------------------------------------------
 * POST /api/contact
 *   Body: { name, email, project, website, startedAt }
 *     - website:   honeypot field, must arrive empty
 *     - startedAt: epoch ms captured when the client form mounted
 *   Responses:
 *     200 { ok: true }                                   — sent (or silently
 *                                                           dropped honeypot)
 *     422 { ok: false, error: 'validation', fields: {} }  — bad input
 *     429 { ok: false, error: 'too_fast' }                — submitted too
 *                                                           quickly / bad
 *                                                           timing signal
 *     429 { ok: false, error: 'rate_limited' }             — too many
 *                                                           requests from IP
 *     502 { ok: false, error: 'delivery_failed' }          — email send
 *                                                           threw
 *     400 { ok: false, error: 'bad_request' }              — malformed JSON
 *     404 { ok: false, error: 'not_found' }                — wrong method
 *                                                           or path
 * OPTIONS /api/contact — CORS preflight, see corsHeaders() below.
 */

import { EmailMessage } from 'cloudflare:email';

const ALLOWED_ORIGINS = new Set([
  'https://swymble.com',
  'https://www.swymble.com',
  'http://localhost:5173',
]);

const RATE_LIMIT_WINDOW_SECONDS = 600; // 10 minutes
const RATE_LIMIT_MAX_REQUESTS = 5;
const MIN_FORM_FILL_MS = 3000; // honest humans take at least this long
const MAX_STARTED_AT_AGE_MS = 24 * 60 * 60 * 1000; // 24h — stale/replayed timestamp

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin') ?? '';
    const cors = corsHeaders(origin);

    if (url.pathname !== '/api/contact') {
      return jsonResponse({ ok: false, error: 'not_found' }, 404, cors);
    }

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors });
    }

    if (request.method !== 'POST') {
      return jsonResponse({ ok: false, error: 'not_found' }, 404, cors);
    }

    let payload;
    try {
      payload = await request.json();
    } catch {
      return jsonResponse({ ok: false, error: 'bad_request' }, 400, cors);
    }

    const ip = request.headers.get('CF-Connecting-IP') ?? 'unknown';
    const userAgent = request.headers.get('User-Agent') ?? 'unknown';

    // --- Spam checks (cheap, run before validation/rate limit spend) -------
    const website = typeof payload.website === 'string' ? payload.website.trim() : '';
    if (website) {
      console.log(`contact_honeypot ip=${ip}`);
      return jsonResponse({ ok: true }, 200, cors);
    }

    const startedAt = Number(payload.startedAt);
    const now = Date.now();
    const hasValidStartedAt =
      Number.isFinite(startedAt) && startedAt <= now && now - startedAt <= MAX_STARTED_AT_AGE_MS;

    if (!hasValidStartedAt || now - startedAt < MIN_FORM_FILL_MS) {
      return jsonResponse({ ok: false, error: 'too_fast' }, 429, cors);
    }

    // --- Rate limiting (fail-open if KV binding is missing) ----------------
    const rateLimited = await isRateLimited(env, ip);
    if (rateLimited) {
      return jsonResponse({ ok: false, error: 'rate_limited' }, 429, cors);
    }

    // --- Validation ----------------------------------------------------------
    const { values, fields } = validate(payload);
    if (Object.keys(fields).length > 0) {
      return jsonResponse({ ok: false, error: 'validation', fields }, 422, cors);
    }

    // --- Delivery ------------------------------------------------------------
    try {
      await sendContactEmail(env, { ...values, ip, userAgent });
    } catch (error) {
      console.error('contact_delivery_failed', error instanceof Error ? error.message : error);
      return jsonResponse({ ok: false, error: 'delivery_failed' }, 502, cors);
    }

    const emailDomain = values.email.split('@')[1] ?? 'unknown';
    console.log(`contact_ok name_len=${values.name.length} email_domain=${emailDomain} ip=${ip}`);
    return jsonResponse({ ok: true }, 200, cors);
  },
};

// -----------------------------------------------------------------------------
// CORS
// -----------------------------------------------------------------------------

function corsHeaders(origin) {
  const headers = {
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };

  if (ALLOWED_ORIGINS.has(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
  }

  return headers;
}

function jsonResponse(body, status, cors) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...cors },
  });
}

// -----------------------------------------------------------------------------
// Rate limiting
// -----------------------------------------------------------------------------

async function isRateLimited(env, ip) {
  if (!env.CONTACT_KV) {
    console.warn('contact_rate_limit_skipped: CONTACT_KV binding missing, failing open');
    return false;
  }

  const key = `rl:${ip}`;
  const current = await env.CONTACT_KV.get(key);
  const count = current ? parseInt(current, 10) || 0 : 0;

  if (count >= RATE_LIMIT_MAX_REQUESTS) {
    return true;
  }

  // Best-effort counter — CF KV isn't strongly consistent/atomic, so under
  // heavy concurrent bursts a handful of extra requests may slip through.
  // That's an acceptable tradeoff for a low-traffic contact form.
  await env.CONTACT_KV.put(key, String(count + 1), { expirationTtl: RATE_LIMIT_WINDOW_SECONDS });
  return false;
}

// -----------------------------------------------------------------------------
// Validation (mirrors src/hooks/useContactForm.ts client-side rules)
// -----------------------------------------------------------------------------

const NAME_PATTERN = /^[a-zA-Z][a-zA-Z\s'.,-]*$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function sanitizeInput(value) {
  return String(value ?? '')
    .replace(/[<>]/g, '')
    .replace(/[\x00-\x1F\x7F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function validateName(value) {
  if (!value) return 'name is required';
  if (value.length < 2) return 'name must be at least 2 characters';
  if (value.length > 60) return 'name must be 60 characters or less';
  if (!NAME_PATTERN.test(value)) return 'name contains invalid characters';
  return '';
}

function validateProject(value) {
  if (!value) return 'project details are required';
  if (value.length < 3) return 'project details are too short';
  if (value.length > 120) return 'project details must be 120 characters or less';
  return '';
}

function validateEmail(value) {
  if (!value) return 'email is required';
  if (value.length > 120) return 'email must be 120 characters or less';
  if (!EMAIL_PATTERN.test(value)) return 'please enter a valid email address';
  return '';
}

function validate(payload) {
  const name = sanitizeInput(payload.name);
  const project = sanitizeInput(payload.project);
  const email = sanitizeInput(payload.email);

  const fields = {};
  const nameError = validateName(name);
  const projectError = validateProject(project);
  const emailError = validateEmail(email);

  if (nameError) fields.name = nameError;
  if (projectError) fields.project = projectError;
  if (emailError) fields.email = emailError;

  return { values: { name, project, email }, fields };
}

// -----------------------------------------------------------------------------
// Email delivery
// -----------------------------------------------------------------------------

async function sendContactEmail(env, { name, project, email, ip, userAgent }) {
  // Cloudflare's send_email binding only allows delivery to a *verified*
  // Destination Address on the account (Email -> Email Routing -> Destination
  // Addresses) — a custom-domain alias like hello@swymble.com does not qualify
  // just because it has an active routing rule; routing rules govern inbound
  // mail, not a Worker's outbound send binding. So the technical envelope
  // recipient (CONTACT_DELIVER_TO) must be that verified address, while the
  // "To:" header shown in the email body (CONTACT_TO) can still cosmetically
  // read hello@swymble.com — the message will land in the verified inbox
  // looking exactly like mail sent to the swymble.com address.
  const displayTo = env.CONTACT_TO || 'hello@swymble.com';
  const deliverTo = env.CONTACT_DELIVER_TO || displayTo;
  const from = env.CONTACT_FROM;

  if (!from) {
    throw new Error('CONTACT_FROM env var is not configured');
  }

  if (!env.CONTACT_EMAIL) {
    throw new Error('CONTACT_EMAIL send_email binding is not configured');
  }

  const messageId = `${crypto.randomUUID()}@swymble.com`;
  const date = new Date().toUTCString();
  const subject = `New inquiry from ${name} via swymble.com`;

  const bodyLines = [
    `Name: ${name}`,
    `Email: ${email}`,
    `Looking to build: ${project}`,
    `IP: ${ip}`,
    `User-Agent: ${userAgent}`,
    `Timestamp: ${date}`,
  ];

  const raw = [
    `From: "Swymble Contact" <${from}>`,
    `To: ${displayTo}`,
    `Reply-To: ${email}`,
    `Subject: ${subject}`,
    `Date: ${date}`,
    `Message-ID: <${messageId}>`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=utf-8',
    'Content-Transfer-Encoding: 7bit',
    '',
    bodyLines.join('\n'),
    '',
  ].join('\r\n');

  const message = new EmailMessage(from, deliverTo, raw);
  await env.CONTACT_EMAIL.send(message);
}
