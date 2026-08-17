/* Small numeric helpers, shared by everything that moves or draws.
   Kept in one place so the renderer and the behaviour layer cannot drift into two
   subtly different easings. */

export const TAU = Math.PI * 2

export const clamp = (v, a, b) => (v < a ? a : v > b ? b : v)
export const lerp = (a, b, t) => a + (b - a) * t

/** Ken Perlin's smootherstep — zero first *and* second derivative at both ends. */
export const smootherstep = (t) => t * t * t * (t * (t * 6 - 15) + 10)

export const rand = (a, b) => a + Math.random() * (b - a)
export const pick = (a) => a[Math.floor(Math.random() * a.length)]

/**
 * One step of an exponential approach towards `target`, at rate `k` per second.
 *
 * **Use this and never `v += (target - v) * dt * k`.** That form is a first-order approximation
 * that diverges with the frame time: a thumbnail ticking at 30fps (`ui/thumbs.js#thumbTicker`)
 * ramped measurably faster than the world did at 60, and a frame that landed on `world/loop.js`'s
 * 1/24s clamp jumped visibly. `1 − e^(−k·dt)` is the exact solution and costs one `exp`.
 *
 * A Spring is still the right tool for anything that should arrive with weight. This is for the
 * plain fades behind a channel — the question marks, the tears, the hearts.
 */
export const approach = (v, target, k, dt) => v + (target - v) * (1 - Math.exp(-k * dt))
