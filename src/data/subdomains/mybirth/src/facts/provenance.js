/* ============================================================
   provenance.js: where every displayed number came from.

   ── Why this exists ──

   The product's only real claim is that the things on the page are true.
   That claim was being carried by prose: a sentence beside a figure saying
   where it came from. Prose is not load-bearing. A copy-trimming pass
   removed those sentences in one afternoon and the curated tables — a US
   singles chart, a sixteen-country list of heads of government, a straight
   line drawn between census anchors — were left reading as per-day lookups
   for the whole world. Nothing broke. Nothing failed to build. The page
   simply began asserting things it could not stand behind.

   So provenance stops being something a fact is described with and becomes
   something a fact *is*. `movieOfYear` no longer returns a string; it
   returns a value carrying its own source. A render site that forgets to
   ask about the source gets `[object Object]` on screen, which is a bug
   anyone notices in a second. A render site that forgets a *sentence* gets
   a page that looks perfect and lies.

   ── The kinds ──

   Six, and the distinctions are the ones a reader would actually care
   about. "Computed" and "curated" are both honest and are not the same
   promise. "Convention" and "interpreted" are both unfalsifiable and are
   also not the same promise: a birthstone is a real tradition somebody
   else wrote down, a lucky colour is something we made up.
   ============================================================ */

export const KIND = {
  /** Arithmetic, on this device, from the date and place. Reproducible. */
  COMPUTED: "computed",
  /** A real observation somebody recorded at the time. */
  MEASURED: "measured",
  /** Fetched from a public source, now, over the network. */
  LIVE: "live",
  /** A table we compiled by hand. True, and narrower than it looks. */
  CURATED: "curated",
  /** A cultural list with no author and no proof. Birthstones, flowers. */
  CONVENTION: "convention",
  /** Written by us. Not derived from anything. */
  INTERPRETED: "interpreted",
};

const KINDS = new Set(Object.values(KIND));

/** How each kind introduces itself, in the reader's words rather than ours. */
const KIND_LABEL = {
  [KIND.COMPUTED]: "Worked out on your device",
  [KIND.MEASURED]: "Recorded at the time",
  [KIND.LIVE]: "Looked up just now",
  [KIND.CURATED]: "From a list we compiled",
  [KIND.CONVENTION]: "A tradition, not a measurement",
  [KIND.INTERPRETED]: "Written, not calculated",
};

const FACT = Symbol("fact");

/**
 * Bind a value to the account of where it came from.
 *
 * `source.method` is required and is the sentence a sceptic would ask for:
 * not "Wikipedia" but what was read and how. `source.scope` is the field
 * that would have prevented the whole problem — it names the limit of the
 * claim, so a US chart cannot be shown as a worldwide one by omission.
 */
export function fact(value, source) {
  if (value == null) return null;
  if (!source || !KINDS.has(source.kind)) {
    throw new Error(`provenance: a fact needs a known kind, got ${JSON.stringify(source)}`);
  }
  if (!source.method) {
    throw new Error(`provenance: ${source.kind} fact is missing its method`);
  }
  return Object.freeze({ [FACT]: true, value, source: Object.freeze({ ...source }) });
}

export const isFact = (x) => Boolean(x && x[FACT]);

/** The value, for anything that only wants the value. */
export const valueOf = (x) => (isFact(x) ? x.value : x);

/**
 * The marker.
 *
 * Deliberately small and unlabelled: a reader who does not care should not
 * have to read anything, and a reader who does gets the full account in one
 * press. It is a real button because it does something, and it carries its
 * own text so nothing has to be looked up when it is pressed.
 */
export function mark(f) {
  if (!isFact(f)) {
    throw new Error("provenance: mark() was given something with no source");
  }
  const { kind, method, scope, url } = f.source;
  const detail = [KIND_LABEL[kind], scope ? `Covers: ${scope}` : "", method]
    .filter(Boolean)
    .join(" · ");
  return `<button type="button" class="prov prov--${kind}"
    data-prov="${escAttr(detail)}"${url ? ` data-prov-url="${escAttr(url)}"` : ""}
    aria-label="Where this came from: ${escAttr(detail)}">
    <span aria-hidden="true">?</span>
  </button>`;
}

/**
 * The scope, rendered inline where it changes what the figure means.
 *
 * A marker is enough for "how do you know this". It is not enough when the
 * answer narrows the claim itself: "the US number one" has to be on the
 * page, not one press behind it, because a reader who never presses would
 * otherwise walk away believing something untrue.
 */
export function scopeNote(f) {
  const scope = isFact(f) ? f.source.scope : null;
  return scope ? `<span class="prov-scope">${esc(scope)}</span>` : "";
}

/* ---------- the panel ---------- */

/**
 * One listener for every marker on the page, and one panel they all share.
 * Delegated because the render sites are template strings that are replaced
 * wholesale, and per-marker listeners would leak on every re-render.
 */
export function wireProvenance(root = document) {
  if (root.__provWired) return;
  root.__provWired = true;

  root.addEventListener("click", (e) => {
    const btn = e.target.closest?.(".prov");
    if (!btn) { closePanel(); return; }
    e.preventDefault();
    e.stopPropagation();
    openPanel(btn);
  });
  addEventListener("keydown", (e) => { if (e.key === "Escape") closePanel(); });
  /*
     Scrolling away closes the panel, since it is anchored to a marker that
     has moved. But pressing a marker near the edge of the viewport makes
     the browser scroll it into view, and closing on *any* scroll meant the
     panel opened and shut inside the same frame — it never appeared at all.
     So it takes a deliberate scroll, not the one the press itself caused.
  */
  addEventListener("scroll", () => {
    if (panel && Math.abs(scrollY - openedAt) > 40) closePanel();
  }, { passive: true });
  addEventListener("resize", closePanel);
}

let panel = null;
let openedAt = 0;

function openPanel(btn) {
  if (panel?.__owner === btn) { closePanel(); return; }
  closePanel();
  openedAt = scrollY;

  panel = document.createElement("div");
  panel.className = "prov-panel";
  panel.setAttribute("role", "dialog");
  panel.__owner = btn;
  const url = btn.dataset.provUrl;
  panel.innerHTML = `
    <p>${esc(btn.dataset.prov || "")}</p>
    ${url ? `<a href="${escAttr(url)}" target="_blank" rel="noopener">Look it up</a>` : ""}`;
  document.body.appendChild(panel);

  // anchored to the marker, then nudged back inside the viewport rather than
  // allowed to hang off the edge on a phone
  const r = btn.getBoundingClientRect();
  const w = panel.offsetWidth;
  const left = Math.min(Math.max(10, r.left + r.width / 2 - w / 2), innerWidth - w - 10);
  const below = r.bottom + 10;
  const fitsBelow = below + panel.offsetHeight < innerHeight - 10;
  panel.style.left = `${left}px`;
  panel.style.top = `${fitsBelow ? below : r.top - panel.offsetHeight - 10}px`;
  requestAnimationFrame(() => panel?.classList.add("is-open"));
  btn.setAttribute("aria-expanded", "true");
}

function closePanel() {
  if (!panel) return;
  panel.__owner?.setAttribute("aria-expanded", "false");
  panel.remove();
  panel = null;
}

/* ---------- escaping ---------- */
// local copies: this module is imported by data.js, and reaching back into
// main.js for a helper would make the dependency circular

function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}

const escAttr = esc;
