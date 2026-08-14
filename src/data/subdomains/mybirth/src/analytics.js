/* ============================================================
   analytics.js: enough measurement to decide what to build next.

   ── What this is for ──

   Not vanity. Four expensive bets in the roadmap are already predicted by
   things this file can count:

     · person_saved, more than once per visitor, is demand for the friends
       and comparison work. If nobody saves a second person, that pillar
       has no audience.
     · keepsake exports are the people who would buy a printed poster.
     · archive_complete over archive_start says whether the archive is
       worth deepening or whether the Daily Sky is the real product.
     · today_read with had_time=no says whether requiring a birth time
       costs more than it buys.

   Those are months of work each. Guessing at them is the expensive option.

   ── The rule this module exists to not break ──

   The landing page no longer promises that nothing leaves the device,
   because accounts are coming and a promise the product is about to break
   is worse than none. That changes nothing here. Measurement should be
   able to say how the product is doing without knowing who anyone is, so
   this module is held to a stricter standard than the rest of the code:

     · No cookies, no fingerprinting, no cross-site identifier. That rules
       out Google Analytics outright.
     · No personal data ever leaves. Not a name, not a birth date, not a
       place, not a chart. `track()` accepts an event name from a fixed
       list and properties from a fixed list of *values*; anything else is
       dropped rather than sent. Free text cannot reach the wire.
     · Do Not Track and Global Privacy Control are honoured. Most vendors
       ignore DNT; we do not.
     · Unconfigured, the whole module is inert.

   ── Why there is a registry rather than a provider name ──

   This started as a single `provider` string, which quietly assumed the
   answer would only ever be one vendor. It will not be. Cloudflare Web
   Analytics is free, cookieless, needs no new supplier because the site
   already runs on Cloudflare, and answers "is anyone coming" today. It
   cannot do custom events, so it can never answer the four questions
   above. Plausible and Umami can, and are worth paying for once there is
   enough traffic for those numbers to mean anything rather than to be
   twenty people and noise.

   So providers are a list, each declaring what it is capable of. Pageview
   counting and event counting are separate capabilities. Adding Plausible
   later is filling in a token, not a rewrite, and the two run side by side
   without either one knowing about the other.
   ============================================================ */

/*
   ── Turning it on ──

   Cloudflare: Dashboard, Analytics & Logs, Web Analytics, add
   mybirth.swymble.com, and copy the token out of the snippet it shows you.
   Paste it below. The token is public by design and appears in the page
   source of every site that uses it, so committing it is not a leak.

   Plausible: sign up, then set `src` and clear nothing else. Custom events
   start flowing the moment the token is present, because every call site
   is already wired and verified.

   Umami: self-hosted alternative to Plausible, same capabilities.
*/
const CONFIG = {
  cloudflare: {
    token: "",
  },
  plausible: {
    domain: "mybirth.swymble.com",
    src: "",                       // "https://plausible.io/js/script.js"
  },
  umami: {
    websiteId: "",
    src: "",
  },
};

/*
   What each provider is and is not able to do.

   `events: false` is the important field. Cloudflare will accept a script
   tag and count pageviews and then silently ignore every custom event sent
   to it, which would look exactly like working. Declaring the limit means
   the module knows the difference and can say so.
*/
const PROVIDERS = {
  cloudflare: {
    label: "Cloudflare Web Analytics",
    events: false,
    on: (c) => !!c.token,
    script: (c) => ({
      src: "https://static.cloudflareinsights.com/beacon.min.js",
      attrs: { "data-cf-beacon": JSON.stringify({ token: c.token }) },
    }),
    send: null,                    // no custom events, by design
  },
  plausible: {
    label: "Plausible",
    events: true,
    on: (c) => !!c.src,
    script: (c) => ({ src: c.src, attrs: { "data-domain": c.domain } }),
    send: (event, props) => {
      if (typeof window.plausible !== "function") return;
      window.plausible(event, Object.keys(props).length ? { props } : undefined);
    },
  },
  umami: {
    label: "Umami",
    events: true,
    on: (c) => !!c.src && !!c.websiteId,
    script: (c) => ({ src: c.src, attrs: { "data-website-id": c.websiteId } }),
    send: (event, props) => window.umami?.track?.(event, props),
  },
};

/** The providers actually switched on, each paired with its own config. */
const active = () =>
  Object.entries(PROVIDERS)
    .map(([name, provider]) => ({ name, provider, config: CONFIG[name] || {} }))
    .filter(({ provider, config }) => provider.on(config));

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

/*
   Dry run.

   With no provider configured, track() returns immediately, which means
   there is no way to find out whether the events are wired correctly until
   after somebody has signed up for an analytics service. That is the wrong
   order: a fortnight of a silently broken call site is a fortnight of data
   the gate needs and does not have.

   So `?analytics=debug`, or the key below, prints every event that would
   have been sent, along with the properties that survived the filter.
   Nothing leaves the page in this mode. It is diagnostics, not collection.
*/
const DEBUG = (() => {
  try {
    if (new URLSearchParams(location.search).get("analytics") === "debug") {
      localStorage.setItem("mybirth:analytics-debug", "1");
      return true;
    }
    return localStorage.getItem("mybirth:analytics-debug") === "1";
  } catch {
    return false;
  }
})();

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

/** Load every configured provider's script once, if we are allowed to. */
export function initAnalytics() {
  if (ready || optedOut()) return;
  ready = true;

  const on = active();
  if (DEBUG) {
    const withEvents = on.filter(({ provider }) => provider.events).map(({ provider }) => provider.label);
    console.info(
      `[analytics] dry run. providers: ${on.map(({ provider }) => provider.label).join(", ") || "none"}`,
      withEvents.length
        ? `· custom events go to ${withEvents.join(", ")}`
        : "· nothing configured records custom events, so only pageviews are counted"
    );
  }

  for (const { provider, config } of on) {
    const { src, attrs } = provider.script(config);
    const s = document.createElement("script");
    s.defer = true;
    s.src = src;
    for (const [k, v] of Object.entries(attrs || {})) s.setAttribute(k, v);
    document.head.appendChild(s);
  }
}

/**
 * Record one event.
 *
 * Silent and harmless when unconfigured, when the visitor has opted out,
 * or when the script failed to load, which is the normal state in
 * development and must never be a thing the rest of the code checks for.
 */
export function track(event, props = {}) {
  if (!ALLOWED.has(event)) {
    // an unknown event is a typo at a call site, and silence hides it
    if (DEBUG) console.warn(`[analytics] dropped unknown event: ${event}`);
    return;
  }

  // keep only enumerated keys with enumerated values
  const safe = {};
  const dropped = [];
  for (const [k, v] of Object.entries(props)) {
    if (ALLOWED_PROPS[k]?.has(v)) safe[k] = v;
    else dropped.push(`${k}=${v}`);
  }

  if (DEBUG) {
    console.info(
      `[analytics] ${event}`,
      Object.keys(safe).length ? safe : "",
      dropped.length ? `(dropped: ${dropped.join(", ")})` : ""
    );
  }
  if (optedOut()) return;

  // to every provider that can actually record an event, and no further
  for (const { provider } of active()) {
    if (!provider.send) continue;
    try {
      provider.send(event, safe);
    } catch { /* analytics must never break the page */ }
  }
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
  return active().length > 0 && !optedOut();
}

/**
 * What is switched on and what it is capable of.
 *
 * `events` being false while `pageviews` is true is the state this whole
 * registry exists to make visible: Cloudflare on its own counts visits and
 * silently discards every custom event, which from the outside is
 * indistinguishable from working. Anything reasoning about the numbers
 * should be able to ask rather than assume.
 */
export function analyticsCapabilities() {
  const on = active();
  return {
    providers: on.map(({ provider }) => provider.label),
    pageviews: on.length > 0,
    events: on.some(({ provider }) => provider.events),
    optedOut: optedOut(),
  };
}
