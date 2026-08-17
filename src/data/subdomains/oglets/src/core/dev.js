/* ═══════════════════════════════════════════════════════════
   THE BENCH FLAG — what exists only while somebody is working on this.

   `#/assets` (the contact sheet) and `#/lab` (the throwaway world) are tools, not pages. They are
   how the shells, the faces, the bodies and the beats can be *looked at* rather than waited for,
   and `.docs/OGLETS.md` §2 already recorded the lesson from the last time one of them shipped: *"a
   public page that exists for the author's convenience is a page the visitor has to skip past.
   The tool was right; the route was wrong."*

   So they are gated in three places at once, and each one is doing a different job:

   1. **`vite.config.ts` never copies them.** Anything named `*.dev.js` or `*.dev.css` is dropped
      from `dist/` alongside `tests/`. They are not merely hidden in production — they are absent.
   2. **`ui/router.js` leaves their routes out**, so `#/lab` typed into a production URL bar falls
      back to Home the same way any other unknown hash does.
   3. **`main.js` imports them dynamically**, only under this flag. That is what makes (1) safe: a
      file that is never in the bundle is also never requested, so stripping it cannot 404.

   Their stylesheets are attached by the pages themselves (`useDevStyles`) rather than by a `<link>`
   in `index.html`, for the same reason — a static link to a stripped file is a 404 on every
   production load.
   ═══════════════════════════════════════════════════════════ */

/**
 * True only where somebody is actually building this: a dev server, a local preview, a LAN
 * address. Read once at load — the hostname does not change under a running page.
 *
 * Deliberately a hostname test and not a build-time define: this subdomain has **no build step**
 * (see the README), so there is nothing to substitute a constant into. The hostname is the only
 * thing available that is true in one place and false in the other.
 */
export const DEV =
  typeof location !== 'undefined' &&
  /^(?:localhost|127\.0\.0\.1|\[::1\]|0\.0\.0\.0)$|(?:^|\.)localhost$|\.local$/.test(location.hostname)

/** Routes that only exist on a bench. Kept here so the router and the nav agree by construction. */
export const DEV_ROUTES = ['assets', 'lab']

/** Attaches a bench stylesheet at runtime. Never referenced from `index.html` — see the header. */
export function useDevStyles(href) {
  if (document.querySelector(`link[data-dev="${href}"]`)) return
  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = href
  link.dataset.dev = href
  document.head.appendChild(link)
}
