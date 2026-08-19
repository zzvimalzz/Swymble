/* The stage every Oglet stands on: how big the canvas is, where your pointer is, and who else
   is here. It is deliberately three plain objects rather than a class — the behaviour layer
   reads them constantly and passing them down five call frames bought nothing.

   Mutate `view` and `ptr` in place; never reassign them, or the imports elsewhere go stale. */

/** Canvas size in CSS pixels. */
export const view = { w: 0, h: 0 }

/**
 * The pointer. `last` is when it moved (seconds, performance clock), `moved` is how far it has
 * travelled since it went down — that is what separates a poke from a drag — and `seen` stays
 * true once you have shown any sign of life at all. `lift` is when a **finger** last came off the
 * glass, and only a finger ever writes it — see `attentive`.
 */
export const ptr = { x: -1e5, y: -1e5, px: 0, py: 0, in: false, last: -1e9, down: false, t0: 0, moved: 0, seen: false, lift: -1e9 }

/** Everybody currently in the world. One, today; the array is what makes more than one free. */
export const population = []

export const minSide = () => Math.min(view.w, view.h)

/** Seconds a cursor resting on the canvas still counts for after it last moved. */
const ATTENTION = 3.2
/**
 * The same for a finger, measured from when it **left** rather than from when it last moved.
 *
 * **A cursor can rest on the canvas and a finger cannot**, and that asymmetry is why an Oglet felt
 * so much more alone on a phone. `ptr.in` is cleared by `pointerleave`, which on touch fires the
 * instant you lift — so `attentive` went false between every tap, the world took the "nobody is
 * here" branch of `chooseAttention` almost permanently, and the creature spent its life musing at
 * the ceiling. Longer than `ATTENTION` on purpose: a tap is the whole of a touch user's presence,
 * so it has to be worth more than a mouse twitch.
 */
const ATTENTION_TOUCH = 6

/**
 * True when you count as being *there*: a cursor on the page that moved recently, or a finger that
 * was on the glass recently. Only a touch or a pen ever sets `ptr.lift`, so a mouse can never
 * reach the second clause and desktop behaviour is bit-identical to what it was.
 */
export const attentive = (now) =>
  (ptr.in && now - ptr.last < ATTENTION) || now - ptr.lift < ATTENTION_TOUCH
