/* The landing page: one live detail, and no copy at all.

   The O of the wordmark is an eye. It follows your cursor, it blinks, and if you leave it alone
   it looks around the room — which is the entire argument for opening the door, made without a
   sentence. Motion is CSS transitions rather than a ticker, so this page costs no frames. */

import { clamp, rand } from '../core/math.js'

/** How far the pupil may travel from centre, in SVG user units (the iris is 46 × 53). Kept
    short on purpose: pushed any further into the corner, the O stops reading as an O. */
const TRAVEL_X = 12
const TRAVEL_Y = 11
/** Seconds of stillness before it stops waiting for you and entertains itself. */
const IDLE_AFTER = 3.4

export function mountHome({ wordmark }) {
  const pupil = wordmark.querySelector('.eye-pupil')
  const eye = wordmark.querySelector('.eye')
  if (!pupil || !eye) return

  let lastMove = -1e9
  let idleTimer = 0

  const look = (x, y) => {
    pupil.style.transform = `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px)`
  }

  const blink = () => {
    wordmark.classList.add('blink')
    setTimeout(() => wordmark.classList.remove('blink'), rand(85, 120))
    setTimeout(blink, rand(2600, 7000))
  }
  setTimeout(blink, rand(1200, 3000))

  /* Looks somewhere of its own choosing, then keeps doing it until you come back. */
  const wander = () => {
    clearTimeout(idleTimer)
    idleTimer = setTimeout(() => {
      if (performance.now() / 1000 - lastMove > IDLE_AFTER) {
        look(rand(-TRAVEL_X, TRAVEL_X) * 0.8, rand(-TRAVEL_Y, TRAVEL_Y) * 0.7)
      }
      wander()
    }, rand(1800, 4200))
  }
  wander()

  addEventListener(
    'pointermove',
    (e) => {
      const r = eye.getBoundingClientRect()
      if (!r.width) return // the page is hidden; nothing to aim at
      lastMove = performance.now() / 1000
      // the whole viewport maps to the pupil's small range, so a flick across the screen reads
      const dx = clamp((e.clientX - (r.left + r.width / 2)) / (innerWidth * 0.34), -1, 1)
      const dy = clamp((e.clientY - (r.top + r.height / 2)) / (innerHeight * 0.34), -1, 1)
      look(dx * TRAVEL_X, dy * TRAVEL_Y)
    },
    { passive: true },
  )
}
