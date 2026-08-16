/* Three pages, one hash. `#/`, `#/world`, `#/genome`.

   Real links rather than buttons, so a page can be shared, opened in a new tab and read by a
   crawler. An unknown hash falls back to Home rather than showing nothing. */

export const ROUTES = ['home', 'world', 'genome']

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
    onEnter?.(next)
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
