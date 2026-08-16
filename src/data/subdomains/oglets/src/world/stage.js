/* The stage every Oglet stands on: how big the canvas is, where your pointer is, and who else
   is here. It is deliberately three plain objects rather than a class — the behaviour layer
   reads them constantly and passing them down five call frames bought nothing.

   Mutate `view` and `ptr` in place; never reassign them, or the imports elsewhere go stale. */

/** Canvas size in CSS pixels. */
export const view = { w: 0, h: 0 }

/**
 * The pointer. `last` is when it moved (seconds, performance clock), `moved` is how far it has
 * travelled since it went down — that is what separates a poke from a drag — and `seen` stays
 * true once you have shown any sign of life at all.
 */
export const ptr = { x: -1e5, y: -1e5, px: 0, py: 0, in: false, last: -1e9, down: false, t0: 0, moved: 0, seen: false }

/** Everybody currently in the world. One, today; the array is what makes more than one free. */
export const population = []

export const minSide = () => Math.min(view.w, view.h)

/** True when your pointer counts as attentive: on the page and moved in the last few seconds. */
export const attentive = (now) => ptr.in && now - ptr.last < 3.2
