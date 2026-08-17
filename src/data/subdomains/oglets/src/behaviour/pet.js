/* ═══════════════════════════════════════════════════════════
   PETTING — stroking it, and what that does to it.

   **A pet and a shake are the same gesture at different speeds**, which is the whole design.
   Both are direction reversals; `emotions/drives.js#trackShake` wants them fast and while you
   have hold of it, and this wants them slow and while you do not. That symmetry is worth keeping
   if either is ever retuned: the only thing separating "you are being nice to it" from "you are
   being horrible to it" is how hard you are doing it.

   **Two ways in, because a phone has no hover.** On a desktop the pointer sweeps back and forth
   *across* the creature without touching it, and the reversals come off `ptr.x`. On a
   touchscreen pressing it picks it up, so there is nothing to sweep across — the stroke happens
   with it already in your hand, and the reversals come off the body's own velocity instead,
   which by then is a smoothed copy of your finger.

   That is where the speed split earns its keep. Held, a pet is 25–380 px/s and a shake starts at
   420, so the same gesture on the same finger is unambiguous: stroke it and it is fussed over,
   whip it and it is furious. Free-handed there is nothing to be confused with, so the band is
   wide.

   `level` is a ramp rather than a flag. Petting that switched on at the second stroke and off
   the instant you stopped would flicker every time you changed direction; ramped, it arrives
   over about half a second and leaves over rather longer, which is also how being fussed over
   actually feels.
   ═══════════════════════════════════════════════════════════ */

import { clamp } from '../core/math.js'
import { ptr } from '../world/stage.js'

/* Below `SLOW` it is a resting hand. `FAST` only throws out a genuine flung swipe, and it is
   deliberately generous: pointer events arrive batched, so two moves landing in one frame double
   the apparent speed, and a tight ceiling silently rejects an ordinary stroke. There is no need
   for it to be tight anyway — the thing a pet must not be confused with is a *shake*, and a
   shake only ever happens while you have hold of it, which is already excluded below. */
const SLOW = 30
const FAST = 4200
/* And the band while it *is* in your hand. The ceiling sits under `trackShake`'s 420 floor, so
   the two readings of the same gesture can never both fire. Keep them on either side of each
   other if either is ever retuned — that gap is the whole contract. */
const HELD_SLOW = 25
const HELD_FAST = 380
/** Strokes needed inside the window before it believes you. */
const STROKES = 2
const WINDOW = 1.7
/** How far outside its own radius the stroke still counts — a pet does not have to be accurate,
    and it leans toward your cursor while you do it, so the target is moving under your hand. */
const REACH = 1.7

export const createPet = () => ({ dir: 0, at: 0, strokes: [], level: 0, was: null })

/** True while it is actually being stroked, which is the only time the face is worn. */
export const isPetted = (o) => o.pet.level > 0.5

/**
 * One frame of it. Returns nothing — it moves `pet.level`, and `emotions/face.js` reads that.
 *
 * The reversal is counted off the *pointer*, not off the body: the body barely moves while it is
 * being stroked, so its own velocity says nothing, and a hand that has stopped moving still has
 * a last known direction that should not decay into a false reversal.
 */
export function updatePet(o, dt, now) {
  const p = o.pet
  const fade = () => {
    p.level = Math.max(0, p.level - dt * 0.9)
    p.was = null
    p.dir = 0
  }

  if (o.phase !== 'awake' || o.game.on || o.drive.annoy > 0.4) return fade()

  if (o.dragging) {
    /* In hand — the touchscreen case. The body's velocity is already a smoothed copy of your
       finger, which is better than the raw pointer here: pointer events arrive batched and the
       ceiling has to be tight to stay clear of a shake. */
    const speed = Math.abs(o.b.vx)
    if (speed > HELD_SLOW && speed < HELD_FAST) {
      const dir = Math.sign(o.b.vx)
      if (p.dir !== 0 && dir !== p.dir) p.strokes.push(now)
      p.dir = dir
    } else if (speed >= HELD_FAST) {
      /* A fast passage **wipes** the stroke history rather than merely not adding to it. Every
         swing of a shake passes through the pet band twice on its way through zero, so without
         this a good shaking quietly accumulates strokes and the creature ends up looking fussed
         over by the thing that just upset it. Fast movement is disqualifying, not neutral. */
      p.dir = 0
      p.strokes.length = 0
      p.level = Math.max(0, p.level - dt * 2.5)
    }
    p.was = null
  } else {
    if (!ptr.in || Math.hypot(ptr.x - o.cx, ptr.y - o.cy) >= o.rad * REACH) return fade()
    if (p.was !== null) {
      const dx = ptr.x - p.was
      const speed = Math.abs(dx) / Math.max(dt, 1e-3)
      if (speed > SLOW && speed < FAST) {
        const dir = Math.sign(dx)
        if (p.dir !== 0 && dir !== p.dir) p.strokes.push(now)
        p.dir = dir
      }
    }
    p.was = ptr.x
  }
  p.strokes = p.strokes.filter((t) => now - t < WINDOW)

  if (p.strokes.length >= STROKES) {
    p.level = clamp(p.level + dt * 2.2, 0, 1)
    const d = o.drive
    /* Being stroked is the fastest `bond` in the game — faster than being held, which is only
       you resting a hand on it. This is the one thing you can do that it has no complaint about
       at all, so it is the one thing that buys the most. */
    d.bond = clamp(d.bond + dt * 0.09, 0, 1)
    d.cheer = clamp(d.cheer + dt * 0.3, 0, 2)
    d.annoy = Math.max(0, d.annoy - dt * 0.5)
    d.lonely = Math.max(0, d.lonely - dt * 0.8)
    d.ignored = 0
    /* Forgiveness. You cannot pet it out of a sulk instantly, but you can pet it out of one:
       twelve seconds of being nice takes a grudge off, against 45 of merely leaving it alone. */
    if (o.angers > 0) o.angerAt = Math.min(o.angerAt, now - 33)
  } else {
    p.level = Math.max(0, p.level - dt * 0.6)
  }
}
