/* One requestAnimationFrame for the whole site.

   Every view registers a ticker and decides for itself whether this frame concerns it. That is
   why switching pages costs nothing: the world stops being drawn the instant it is hidden,
   without anybody cancelling or restarting a loop. */

import { clamp } from '../core/math.js'

const tickers = new Set()
let running = false

/** @returns {() => void} an unsubscribe, for anything that ever needs to stop. */
export function addTicker(fn) {
  tickers.add(fn)
  return () => tickers.delete(fn)
}

export function startLoop() {
  if (running) return
  running = true
  let last = performance.now() / 1000

  const frame = (ms) => {
    const t = ms / 1000
    // clamped so a backgrounded tab does not resume with a one-minute timestep
    const dt = clamp(t - last, 0, 1 / 24)
    last = t
    /* One throwing ticker used to take the whole site down: the exception escaped before the
       next requestAnimationFrame was ever queued, so the loop simply stopped and every page
       froze mid-frame — no Zzz, no waking up, nothing anywhere moving again until a reload.
       A ticker that throws is now dropped and reported; the rest of the site keeps running. */
    for (const tick of tickers) {
      try {
        tick(dt, t)
      } catch (err) {
        tickers.delete(tick)
        console.error('oglets: ticker removed after it threw', err)
      }
    }
    requestAnimationFrame(frame)
  }

  requestAnimationFrame(frame)
}
