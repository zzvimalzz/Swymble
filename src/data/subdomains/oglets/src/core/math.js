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
