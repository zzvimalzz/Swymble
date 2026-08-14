/* ============================================================
   analytics.js: the measurement the plan is gated on.

   MERGE-PLAN §7 sets a hard gate on Phase 3: not a line of subscription
   code until four weeks of data show more than 2,000 sessions a month
   *and* archive completion above roughly 40%. Nothing has been measuring
   either number, which means the gate cannot be opened or closed. This
   is the smallest thing that fixes that.

   ── The rule this module exists to not break ──

   §4.1 sells "works with no account, nothing leaves the device" as a
   headline feature. An analytics script is the one thing on the site that
   sends anything anywhere, so it is held to a stricter standard than the
   rest of the code:

     · No cookies, no fingerprinting, no cross-site identifier. That rules
       out Google Analytics outright, as §7 already says.
     · No personal data ever leaves. Not a name, not a birth date, not a
       place, not a chart. `track()` accepts an event name from a fixed
       list and properties from a fixed list of *values*; anything else is
       dropped rather than sent. Free text cannot reach the wire.
     · Do Not Track and Global Privacy Control are honoured. Most vendors
       ignore DNT; we do not.
     · Unconfigured, the whole module is inert. It ships disabled, so
       nothing is collected until somebody deliberately turns it on.

   ── Choosing a provider ──

   Plausible and Umami both work the same way: one script tag, one global
   function, EU-hosted or self-hosted, no cookies. Either satisfies the
   gate on its own because both count sessions and custom events.

   Cloudflare Web Analytics is worth knowing about as well: it is free,
   cookieless, and this site already runs on Cloudflare, so it needs no new
   vendor at all. It gives the sessions number with zero code. What it does
   not give is custom events, so it cannot answer the archive-completion
   half of the gate by itself.
   ============================================================ */

/*
   Off until somebody fills this in. Set `provider` to "plausible" or
   "umami" and supply the matching fields.

     plausible: { provider: "plausible", domain: "mybirth.swymble.com",
                  src: "https://plausible.io/js/script.js" }
     umami:     { provider: "umami", websiteId: "…",
                  src: "https://analytics.example.com/script.js" }
*/
const CONFIG = {
  provider: null,
  domain: "mybirth.swymble.com",
  src: "",
  websiteId: "",
};

/*
   The events, and nothing outside this list is sent.

   The two that matter for the gate are `archive_start` and
   `archive_complete`: completion rate is the second over the first. The
   rest are cheap and answer questions the plan will ask next, like
   whether the Daily Sky is actually a habit and whether the birth-time
   ask converts.
*/
export const EVENTS = {
  ARCHIVE_START: "archive_start",        // a day was submitted for recovery
  ARCHIVE_READY: "archive_ready",        // the result finished painting
  ARCHIVE_COMPLETE: "archive_complete",  // the reader reached the last chapter
  TODAY_OPEN: "today_open",              // the Daily Sky was opened
  TODAY_READ: "today_read",              // a reading was shown, not the time gate
  TIME_ADDED: "time_added",              // the birth-time ask converted
  KEEPSAKE: "keepsake",                  // certificate or ticket exported
  SHARE_COPY: "share_copy",              // the link was copied
  PERSON_SAVED: "person_saved",
  PEOPLE_OPEN: "people_open",
};
const ALLOWED = new Set(Object.values(EVENTS));

/*
   Property values are enumerated too, not just the keys. A name or a date
   cannot be passed by accident because only these strings survive.
*/
const ALLOWED_PROPS = {
  kind: new Set(["certificate_png", "certificate_pdf", "ticket", "link"]),
  entry: new Set(["form", "link"]),
  theme: new Set(["paper", "ink"]),
  had_time: new Set(["yes", "no"]),
};

let ready = false;

/** Do Not Track, or Global Privacy Control, or a browser that sends both. */
function optedOut() {
  try {
    return navigator.globalPrivacyControl === true
      || navigator.doNotTrack === "1"
      || window.doNotTrack === "1"
      || navigator.msDoNotTrack === "1";
  } catch {
    return false;
  }
}

/** Load the provider's script once, if there is one and we are allowed to. */
export function initAnalytics() {
  if (ready || !CONFIG.provider || !CONFIG.src || optedOut()) return;
  ready = true;

  const s = document.createElement("script");
  s.defer = true;
  s.src = CONFIG.src;
  if (CONFIG.provider === "plausible") {
    s.dataset.domain = CONFIG.domain;
  } else if (CONFIG.provider === "umami") {
    s.dataset.websiteId = CONFIG.websiteId;
  }
  document.head.appendChild(s);
}

/**
 * Record one event.
 *
 * Silent and harmless when unconfigured, when the visitor has opted out,
 * or when the script failed to load, which is the normal state in
 * development and must never be a thing the rest of the code checks for.
 */
export function track(event, props = {}) {
  if (!ALLOWED.has(event)) return;                    // unknown event, dropped
  if (!CONFIG.provider || optedOut()) return;

  // keep only enumerated keys with enumerated values
  const safe = {};
  for (const [k, v] of Object.entries(props)) {
    if (ALLOWED_PROPS[k]?.has(v)) safe[k] = v;
  }

  try {
    if (CONFIG.provider === "plausible" && typeof window.plausible === "function") {
      window.plausible(event, Object.keys(safe).length ? { props: safe } : undefined);
    } else if (CONFIG.provider === "umami" && window.umami?.track) {
      window.umami.track(event, safe);
    }
  } catch { /* analytics must never break the page */ }
}

/**
 * Fire `archive_complete` when the reader actually reaches the end.
 *
 * "Completion" needs a definition or the gate's 40% means nothing. It is
 * defined here as *the last chapter entering the viewport*: the reader
 * scrolled the whole archive rather than bouncing off the hero. Fires at
 * most once per page, and does nothing if the marker is missing.
 */
export function watchCompletion(root) {
  const last = root?.querySelector("#cert-view, .cert-stage")
    || root?.querySelector(".r-foot");
  if (!last || !("IntersectionObserver" in window)) return;

  const obs = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      track(EVENTS.ARCHIVE_COMPLETE);
      obs.disconnect();
    }
  }, { threshold: 0.2 });
  obs.observe(last);
}

/** Whether anything is being collected at all, for the footer to be honest about. */
export function analyticsActive() {
  return !!CONFIG.provider && !optedOut();
}
