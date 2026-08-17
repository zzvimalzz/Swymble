/* ═══════════════════════════════════════════════════════════
   DRIVES — the reasons an Oglet feels anything.

   Every expression it ever wears is traced back to one of these, so nothing it feels is
   arbitrary. Keep it that way: if you want a new mood, add the reason for it here first.

   annoy   — being mashed
   held    — a hand resting on it
   bond    — how attached it is to you; the only drive that survives a refresh
   cheer   — good things banked, spent on a smile
   ignored — seconds you have been on the page without coming near
   lonely  — only ever built from being ignored
   idle    — seconds since you last showed any sign of life
   ═══════════════════════════════════════════════════════════ */

import { clamp, rand } from '../core/math.js'

export function createDrives() {
  return { annoy: 0, idle: rand(0, 6), held: 0, bond: 0, cheer: 0, ignored: 0, lonely: 0 }
}

/**
 * One frame of feeling.
 *
 * `senses` is what the world can tell about you this frame: `attentive` (you have moved
 * recently), `near` / `close` (how far the pointer is), `pressing` (held down on it) and
 * `alone` (nobody else in the world).
 *
 * Being on its own is not sad: an Oglet alone in an empty room entertains itself quite
 * happily. What actually stings is you being *here* and not coming near — so loneliness is
 * built from `ignored`, never from a plain absence of company.
 */
export function updateDrives(o, dt, senses) {
  const d = o.drive

  d.idle += dt
  d.annoy = Math.max(0, d.annoy - dt * (d.held > 0.8 ? 0.02 : 0.09))
  if (senses.attentive) d.idle = 0

  if (senses.pressing) {
    d.held += dt
    if (d.held > 0.5 && d.annoy < 0.45) d.annoy = Math.max(0, d.annoy - dt * 0.35)
  } else {
    d.held = Math.max(0, d.held - dt * 2)
  }

  if (o.phase !== 'awake' || o.dragging) return

  if (d.held > 0.35) {
    d.bond = clamp(d.bond + dt * 0.05, 0, 1)
    d.cheer = clamp(d.cheer + dt * 0.5, 0, 2)
    d.ignored = 0
  } else if (senses.attentive && senses.close) {
    d.bond = clamp(d.bond + dt * 0.012, 0, 1)
    d.cheer = clamp(d.cheer + dt * 0.16, 0, 2)
    d.ignored = 0
  } else if (senses.attentive && senses.alone) {
    d.ignored += dt
  } else {
    d.ignored = Math.max(0, d.ignored - dt * 0.5)
  }

  if (d.annoy > 0.6) d.bond = Math.max(0, d.bond - dt * 0.04)
  if (o.attn === 'user' && d.ignored > 18) d.lonely = clamp(d.lonely + dt * 0.06, 0, 1)
  else if (d.ignored < 1) d.lonely = Math.max(0, d.lonely - dt * 0.35)

  d.cheer = Math.max(0, d.cheer - dt * 0.05) // an unspent good mood fades rather than banking up
}

/**
 * Being upset, and what happens when it keeps happening.
 *
 * A creature that scowls at the tenth jab exactly as it scowled at the first is a state machine.
 * `angers` counts the times it has actually lost its temper with you, and past `GIVES_UP` it
 * stops scowling and gives up instead — sad, and half the time crying. That is the difference
 * between annoying it and bullying it, and it is the only place on the site where *repeating*
 * an action changes what it means.
 *
 * The counter fades: `FORGETS` of not being upset takes one off it, so nothing here is
 * permanent and an Oglet you were once rough with can be got back.
 */
export const GIVES_UP = 3
const FORGETS = 45

/**
 * The face a fresh mistreatment earns, and the count that goes with it. Crying only ever comes
 * out of *this* — the momentary reaction — never out of the sustained look below, because a face
 * held for as long as `annoy` stays high is a mood, and crying is not a mood.
 */
export function upsetFace(o, now) {
  o.angers++
  o.angerAt = now
  if (o.angers >= GIVES_UP) return Math.random() < 0.5 ? 'crying' : 'sad'
  // a sweet Oglet has no scowl in it and gives up a beat earlier than a sharp one
  return o.g.temper < 0.9 && o.angers >= 2 ? 'crying' : 'angry'
}

/** The face it *wears* while `annoy` stays high, once the reaction beat has run out. */
export const upsetLook = (o) => (o.angers >= GIVES_UP ? 'sad' : 'angry')

/** Called every frame: an old grudge is not a grudge. */
export function forgive(o, now) {
  if (o.angers > 0 && now - o.angerAt > FORGETS) {
    o.angers--
    o.angerAt = now
  }
}

/** What a poke does to the drives. Returns the expression it earned, or null for none. */
export function pokeDrives(o, now) {
  const d = o.drive
  o.taps.push(now)
  o.taps = o.taps.filter((t) => now - t < 3)
  d.annoy = clamp(d.annoy + (0.17 + o.taps.length * 0.06) * o.g.temper, 0, 1.3)
  d.ignored = 0

  if (d.annoy > 0.5) return upsetFace(o, now)
  if (d.annoy > 0.28) return 'sad'
  // one poke, on its own, is a hello rather than a jab — mashing is what earns the scowl above
  if (o.taps.length === 1) {
    d.cheer = clamp(d.cheer + 0.85, 0, 2)
    d.lonely = Math.max(0, d.lonely - 0.4)
  }
  return null
}

/* ── being shaken ─────────────────────────────────────────
   Carrying it about is fine and it rather likes it. Whipping it back and forth is not, and the
   two are told apart by *direction reversals*, not by speed: a long fast sweep across the room
   is one movement, and four changes of mind inside a second and a half is a shake.

   `SHAKE_SPEED` is therefore **not** a "you are shaking it hard enough" threshold — it only
   throws away jitter, so a hand resting still does not clock up reversals from noise. It has to
   sit well *below* the speed of a real swing: the reversal happens as the velocity passes
   through zero, so gating it high means the interesting frames are exactly the ones discarded,
   and no shake is ever seen however hard you shake it. It is comfortably above the idle drift
   (`DASH` is 250) and comfortably below a carry. */
const SHAKE_SPEED = 420
const SHAKE_WINDOW = 1.5
const SHAKE_FLIPS = 4

export const createShake = () => ({ dir: 0, flips: [], until: 0 })

/** @returns {boolean} true on the frame a shake is recognised. */
export function trackShake(o, now) {
  const s = o.shake
  const v = o.b.vx
  if (Math.abs(v) < SHAKE_SPEED) return false

  const dir = Math.sign(v)
  if (s.dir !== 0 && dir !== s.dir) s.flips.push(now)
  s.dir = dir
  s.flips = s.flips.filter((t) => now - t < SHAKE_WINDOW)

  if (s.flips.length < SHAKE_FLIPS || now < s.until) return false
  s.flips.length = 0
  s.until = now + 1.2 // one shake per beat, however long you keep going
  o.drive.annoy = clamp(o.drive.annoy + 0.34 * o.g.temper, 0, 1.3)
  o.drive.cheer = 0
  return true
}
