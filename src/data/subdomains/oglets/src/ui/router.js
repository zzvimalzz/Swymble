/* Six pages, one hash. `#/`, `#/world`, `#/genome`, `#/gallery`, `#/hatch`, `#/assets`.

   Real links rather than buttons, so a page can be shared, opened in a new tab and read by a
   crawler. An unknown hash falls back to Home rather than showing nothing.

   `assets` (the contact sheet) and `lab` (the throwaway world) are benches, and they exist **only
   on a bench**: `core/dev.js` keeps them out of this list in production, so `#/lab` typed into a
   production URL falls back to Home like any other hash that names nothing. */

import { DEV, DEV_ROUTES } from '../core/dev.js'

export const ROUTES = ['home', 'world', 'genome', 'gallery', 'hatch', ...(DEV ? DEV_ROUTES : [])]

const hashOf = (route) => (route === 'home' ? '#/' : `#/${route}`)

/**
 * null means "no route was asked for" — a bare URL, or a hash that names nothing we have. Only
 * then does the caller's `initial` get a say, which is what sends a returning visitor straight
 * to their Oglet while `#/` still means the landing page.
 */
function routeFromHash() {
  if (!location.hash) return null
  const raw = location.hash.replace(/^#\/?/, '').trim().toLowerCase()
  if (!raw) return 'home'
  return ROUTES.includes(raw) ? raw : null
}

export function createRouter({ views, links, indicator, initial = 'home', onEnter }) {
  let current = null

  /* The underline is one sliding element, not a border per link. Its position is written as two
     custom properties so the movement is a plain CSS transition and never a layout thrash. */
  function moveIndicator(activeLink) {
    if (!indicator) return
    if (!activeLink) {
      indicator.style.setProperty('--ink-o', '0')
      return
    }
    indicator.style.setProperty('--ink-x', `${activeLink.offsetLeft}px`)
    indicator.style.setProperty('--ink-w', `${activeLink.offsetWidth}px`)
    indicator.style.setProperty('--ink-o', '1')
  }

  function go(route) {
    const next = ROUTES.includes(route) ? route : 'home'
    current = next

    /* Hand back control from the pre-paint rule in `index.html`.
       That rule unhides the booted view with an ID selector — it has to, to beat
       `.view[hidden]{display:none}` — which means it *also* beats this line hiding that same view
       again. Left in place, the page you first loaded stayed painted under every page after it,
       as a ghost. It has done its job by now: the router is running, and from here `hidden` is
       the only thing that decides what is on screen. */
    document.getElementById('bootView')?.remove()

    for (const [name, el] of Object.entries(views)) el.hidden = name !== next

    let active = null
    for (const link of links) {
      const on = link.dataset.route === next
      link.classList.toggle('on', on)
      if (on) {
        active = link
        link.setAttribute('aria-current', 'page')
      } else {
        link.removeAttribute('aria-current')
      }
    }

    if (location.hash !== hashOf(next)) history.replaceState(null, '', hashOf(next))

    /* A page that throws while building itself takes only itself down.
       `world/loop.js` learned this the hard way — one throwing ticker used to stop every animation
       on the site — and the same shape of bug lives here: `onEnter` is where the Genome catalogue,
       the Gallery wall and the Lab are constructed, and an exception escaping it would abort the
       rest of `go()`. The view has already been swapped by the time we get here, so the worst case
       is an empty page rather than the wrong one, and the navigation itself always completes. */
    try {
      onEnter?.(next)
    } catch (err) {
      console.error(`oglets: the ${next} page threw while opening`, err)
    }
    // after onEnter, because the bar is hidden on the landing and has no boxes to measure there
    moveIndicator(active)
  }

  addEventListener('resize', () => moveIndicator(links.find((l) => l.classList.contains('on'))))

  addEventListener('hashchange', () => go(routeFromHash() ?? 'home'))
  go(routeFromHash() ?? initial)

  return {
    go,
    get current() {
      return current
    },
    is: (route) => current === route,
  }
}
