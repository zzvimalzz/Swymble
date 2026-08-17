/* ═══════════════════════════════════════════════════════════
   BEATS — short scripted events, as pure functions of their own local time.

   `.docs/OGLETS.md` §6 asks for exactly this and calls it the missing vocabulary: *"reactions as
   short scripted beats, not just faces… the 'wait, did you see that?' moments that hold
   attention."* Everything an Oglet does today is either a sprung target or an instantaneous
   impulse (`S.pop = 1`); nothing is a timeline. These are the timelines.

   **A beat is `sample(u) → a frame`, and nothing else.** No clock, no state, no DOM — the one
   thing in this project's motion layer that is a pure function of time, which is why
   `tests/beats.test.js` can cover it in a repo with no DOM test environment, and why a beat can be
   scrubbed to any instant on `#/assets` instead of being waited for.

   Four rules, each of them earned by something already in this codebase:

   1. **A beat never sets an expression.** `emotions/face.js#settleFace` owns the face; a beat that
      wrote to `body.expr` would be a second author of the same channel and the two would fight. It
      may *ask* for one at the moment it starts, the way `wake()` does.
   2. **A beat starts under a blink** where the silhouette changes, because a blink is what hides a
      discontinuity — that is bloub's `blinkIn` and it is why its state changes do not snap.
   3. **A beat is replaced, never queued.** A queued beat plays after the thing that caused it is
      over, which reads as a delayed reaction rather than a reaction.
   4. **One at a time, one creature at a time.** Six gradient-stroked arcs is cheap; sixty is not,
      and `.docs/OGLETS.md` §11 puts the ceiling at 10–12 Oglets with an O(n²) separation pass.
   ═══════════════════════════════════════════════════════════ */

import { clamp } from '../core/math.js'
import { COMET_RIBBONS, RINGS, particles } from '../render/decor.js'

/** bloub's transition curve. Exponential ease-out, and the body never overshoots. */
const easeOutQuint = (t) => 1 - (1 - t) ** 5

/**
 * ORBIT — six rainbow rings in 3D orbit, entering one at a time.
 *
 * **What it means: it has lost the plot.** Wired to `crazy`, which already exists, is already
 * earned by playing catch rather than by anything unpleasant, and is already the one face where an
 * Oglet's two eyes disagree with each other. Rings around a creature that has come apart with
 * excitement is the same sentence twice, which is what you want from an effect.
 *
 * Shorter than bloub's 3.4s: there the orbit is a state in a catalogue you sit and watch, here it
 * is something that happens to a creature you are playing with.
 */
export const ORBIT = {
  id: 'orbit',
  dur: 2.6,
  sample(u) {
    // in over 0.6s, out over the last 0.7 — and each ring arrives 0.11s after the one before, so
    // the bouquet assembles rather than appearing
    const fade = clamp(u / 0.6, 0, 1) * clamp((2.6 - u) / 0.7, 0, 1)
    /* IT OPENS OUTWARD, AND ONLY OUTWARD. Growth starts at exactly 1 and rises — never below it —
       so the clearance rule in `render/decor.js` is a floor the animation cannot dip under. An
       earlier version ramped from 0.82 and looked better for it, and spent the first tenth of a
       second drawing rings through the face: `MIN_CLEAR × 0.82` is 0.93, which is inside the
       creature. A test pins both halves of this.
       So the arrival is carried by the fade and the stagger, and the expansion runs the whole beat:
       1 → 1.34 as it assembles, then on to 1.54 as it goes, which reads as a wave leaving. */
    const grow = 1 + 0.34 * easeOutQuint(clamp(u / 0.9, 0, 1)) + 0.2 * clamp((u - 1.75) / 0.85, 0, 1)
    return {
      arcs: RINGS.map((seed, i) => ({
        seed, t: u, grow,
        opacity: fade * clamp((u - i * 0.11) / 0.28, 0, 1),
      })),
    }
  },
}

/**
 * BURST — it comes apart, and puts itself back together.
 *
 * Collapse to 0.166 over 0.7s on an ease-out with no bounce, five particles spiralling inward and
 * swallowed, then a regrow from 1.5s. Eyes fade back in slightly behind the body, so what returns
 * is a shape first and a face second.
 *
 * **What it means: a sneeze.** `.docs/OGLETS.md` §11 asks for rare one-offs at about one per ninety
 * seconds and calls them the moments that hold attention. Deliberately **not** the shake or the
 * poke: mistreatment already has an outcome in `emotions/drives.js` — a scowl, then giving up —
 * and answering it with the best-looking effect on the site rewards the thing the drive model
 * spends all its effort discouraging.
 *
 * `scale` is applied to the whole creature rather than to a body, so this works identically on the
 * 98.5% of Oglets that have no body: what collapses and reassembles is simply *them*.
 */
export const BURST = {
  id: 'burst',
  dur: 2.4,
  blinkIn: true,
  sample(u) {
    const collapse = 1 - 0.834 * easeOutQuint(clamp(u / 0.7, 0, 1))
    const regrow = easeOutQuint(clamp((u - 1.5) / 0.7, 0, 1))
    return {
      scale: collapse + (1 - collapse) * regrow,
      // the face comes back after the shape does — 0.1s is enough to read as two events
      eyeAlpha: u < 0.34 ? clamp(1 - u / 0.34, 0, 1) : clamp((u - 1.6) / 0.4, 0, 1),
      dots: particles(u),
      dotsBehind: true,
    }
  },
}

/**
 * COMET — four ribbons orbiting the creature while it is moving fast.
 *
 * **The only one of the three that is a state rather than a script**, so it takes a `level` from
 * the caller and ramps rather than running a timeline: it lasts exactly as long as its cause does.
 * `dur` is `Infinity` and the beat slot is not used for it at all — `Body.comet` is.
 *
 * bloub collapses its body to a dot underneath this. That is dropped: an Oglet mid-chase has to
 * stay readable as an Oglet, and the squash-and-stretch already in `Oglet.draw` is the body
 * deformation that belongs to speed.
 */
export const COMET = {
  id: 'comet',
  dur: Infinity,
  sample(u, level = 1) {
    // it opens with its level rather than on a clock, so the trail widens *with* the speed that
    // causes it. Never under 1, for the same reason as Orbit.
    const grow = 1 + 0.16 * clamp(level, 0, 1)
    return { arcs: COMET_RIBBONS.map((seed) => ({ seed, t: u, grow, opacity: level })) }
  },
}

export const BEATS = { orbit: ORBIT, burst: BURST, comet: COMET }
