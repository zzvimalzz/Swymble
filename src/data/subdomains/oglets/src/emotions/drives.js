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

/** What a poke does to the drives. Returns the expression it earned, or null for none. */
export function pokeDrives(o, now) {
  const d = o.drive
  o.taps.push(now)
  o.taps = o.taps.filter((t) => now - t < 3)
  d.annoy = clamp(d.annoy + (0.17 + o.taps.length * 0.06) * o.g.temper, 0, 1.3)
  d.ignored = 0

  if (d.annoy > 0.5) return 'angry'
  if (d.annoy > 0.28) return 'sad'
  // one poke, on its own, is a hello rather than a jab — mashing is what earns the scowl above
  if (o.taps.length === 1) {
    d.cheer = clamp(d.cheer + 0.85, 0, 2)
    d.lonely = Math.max(0, d.lonely - 0.4)
  }
  return null
}
