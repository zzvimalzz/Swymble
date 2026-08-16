/* The way in.

   Entering the world is the one navigation on this site that should feel like something
   happening rather than a page changing, so the world arrives as a circle opening out of the
   button you pressed: the dark ground of the world growing until it is everywhere, the route
   switching behind it, then the cover lifting.

   Anyone who has asked their system for less motion gets the plain switch. */

import { WELL } from '../core/theme.js'

const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * @param {Element} origin the element the circle grows from
 * @param {() => void} swap called at full cover — the route change nobody should see happen
 */
export function radialEnter(origin, swap) {
  if (reducedMotion() || typeof Element.prototype.animate !== 'function') {
    swap()
    return
  }

  const r = origin.getBoundingClientRect()
  const x = r.left + r.width / 2
  const y = r.top + r.height / 2
  // the far corner, so the circle is never caught mid-growth by the edge of the screen
  const reach = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y))

  /* Two parts: the ground filling in behind a clipped circle, and a hairline ring riding its
     edge. The ring is what makes the sweep legible — ink and well are four values apart, so
     without it the fill is a change nobody can see happening. */
  const cover = document.createElement('div')
  cover.className = 'wipe'
  cover.style.background = WELL
  cover.style.clipPath = `circle(0px at ${x}px ${y}px)`

  const ring = document.createElement('div')
  ring.className = 'wipe-ring'
  ring.style.left = `${x}px`
  ring.style.top = `${y}px`
  ring.style.width = ring.style.height = `${reach * 2}px`

  document.body.append(cover, ring)

  const timing = { duration: 460, easing: 'cubic-bezier(.4,0,.2,1)', fill: 'forwards' }
  const done = () => {
    cover.remove()
    ring.remove()
  }

  ring.animate(
    [
      { transform: 'translate(-50%,-50%) scale(0)', opacity: 1 },
      { transform: 'translate(-50%,-50%) scale(1)', opacity: 0 },
    ],
    timing,
  )

  cover
    .animate(
      [{ clipPath: `circle(0px at ${x}px ${y}px)` }, { clipPath: `circle(${reach}px at ${x}px ${y}px)` }],
      timing,
    )
    .finished.then(() => {
      swap()
      ring.remove()
      return cover.animate([{ opacity: 1 }, { opacity: 0 }], {
        duration: 420,
        easing: 'ease-out',
        fill: 'forwards',
      }).finished
    })
    .then(done)
    .catch(() => {
      // an interrupted animation must never leave the page under a lid
      swap()
      done()
    })
}
