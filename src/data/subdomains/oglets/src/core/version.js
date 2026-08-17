/* ═══════════════════════════════════════════════════════════
   SELF-HEALING AFTER A DEPLOY — how a tab that is already open finds out it is stale.

   This subdomain has no build step, so its modules ship under permanent names with no content
   hash. `cloudflare/oglets-subdomain-worker.js` answers half of that by forcing `no-cache`, which
   guarantees that *a reload* gets the current build. It cannot do anything about a tab nobody
   reloads — and this is an ambient page people leave open for days.

   Nothing else in the app touches the network after load, so this file is the only thing that
   would ever notice a deploy. It polls one small file:

   - `version.txt` is written into `dist/subdomains/<name>/` by `writeBuildStamp()` in
     `vite.config.ts`, and holds a **content hash of everything published**. A rebuild that
     changed nothing produces the same stamp, so an unrelated deploy never reloads anybody.
   - The first successful read is the baseline — the version this tab is running. There is no
     stamp inlined in the HTML to compare against, and deliberately so: that would mean rewriting
     `index.html` at build time, and the whole point of this subdomain is that it is copied.
   - **A reload only ever happens while the tab is hidden.** Being yanked out of a page mid-stroke
     is worse than running yesterday's build for another minute. Nothing is lost by waiting and
     nothing is lost by the reload either — `state/session.js` persists on `pagehide`, and the
     egg's progress is derived from a stored timestamp rather than counted in frames.

   If the file is missing — `vite dev` serves the source tree, which has no `version.txt` — the
   first read fails and the whole thing switches itself off. `npm run preview` serves real built
   output and does exercise it.
   ═══════════════════════════════════════════════════════════ */

/** Where the stamp lives, resolved from this module rather than from the document — the routes
    are hashes, so the document URL is not a reliable base to count directories from. */
const STAMP_URL = new URL('../../version.txt', import.meta.url)

/** Five minutes. A hidden tab's timers are throttled well below this anyway. */
const EVERY = 5 * 60e3

/** Stamps this tab has already reloaded for, so a bad one cannot bounce it forever. */
const RELOADED_KEY = 'oglets:reloaded-for'

/**
 * **The whole policy, as a pure function**, because there is no DOM test environment here.
 *
 * @param baseline  the stamp this tab loaded with, or null before the first read succeeded
 * @param latest    the stamp just read from the server
 * @param hidden    whether the tab is currently in the background
 * @param reloaded  stamps this tab has already reloaded for
 * @returns `'none'` — nothing to do · `'wait'` — stale, but somebody is looking at it ·
 *          `'reload'` — stale and unwatched
 */
export function reloadDecision(baseline, latest, hidden, reloaded = []) {
  if (!baseline || !latest || latest === baseline) return 'none'
  /* Two edge nodes disagreeing mid-deploy would otherwise ping-pong a tab between two builds
     forever: reload onto B, see A, reload onto A, see B. Refusing a stamp twice ends it at two. */
  if (reloaded.includes(latest)) return 'none'
  return hidden ? 'reload' : 'wait'
}

const session = {
  read() {
    try {
      return (sessionStorage.getItem(RELOADED_KEY) ?? '').split(',').filter(Boolean)
    } catch {
      return [] // private mode, a disabled store — neither is worth a broken page
    }
  },
  add(stamp) {
    try {
      sessionStorage.setItem(RELOADED_KEY, [...session.read(), stamp].join(','))
    } catch {
      /* then the ping-pong guard is gone, and the `latest === baseline` test still holds */
    }
  },
}

/**
 * Start watching. Safe to call once at the end of `main.js`; does nothing anywhere the stamp is
 * not published, and never throws at somebody who just opened the page.
 */
export function watchVersion() {
  let baseline = null
  let pending = null
  let stopped = false

  const read = async () => {
    const response = await fetch(STAMP_URL, { cache: 'no-store' })
    if (!response.ok) throw new Error(String(response.status))
    return (await response.text()).trim()
  }

  const apply = (latest) => {
    switch (reloadDecision(baseline, latest, document.hidden, session.read())) {
      case 'reload':
        session.add(latest)
        location.reload()
        break
      case 'wait':
        pending = latest // taken up by the visibilitychange handler below
        break
    }
  }

  const check = async () => {
    if (stopped) return
    let latest
    try {
      latest = await read()
    } catch {
      /* No stamp here, or no network. A missing one is the dev server and is permanent, so stop
         rather than log a 404 every five minutes; a flaky network gets the next tick. */
      if (baseline === null) stopped = true
      return
    }
    if (baseline === null) baseline = latest
    else apply(latest)
  }

  document.addEventListener('visibilitychange', () => {
    if (stopped) return
    if (!document.hidden) {
      check() // back at the keyboard: the cheapest moment to learn there is a new build
      return
    }
    if (pending) {
      session.add(pending)
      location.reload()
    }
  })

  check()
  setInterval(check, EVERY)
}
