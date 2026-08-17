/* ═══════════════════════════════════════════════════════════
   CHARACTER — the name for what the behaviour genes were already doing.

   `pace`, `temper` and `sociable` have driven behaviour since the world was built, and no page
   has ever mentioned them. A character is a **read** of those three numbers, not a fourth gene:
   nothing new is rolled, nothing new is stored, and every existing Oglet already has one.

   That is deliberate. A rolled `nature` gene would sit *beside* the numbers that actually decide
   how it acts and could contradict them — an Oglet labelled "Placid" with a temper of 1.38 is a
   lie the moment you poke it. Derived, the label can only ever describe what you are about to
   see, which is the whole point of putting a name on it.

   Two rings:

   1. **Eight temperaments** — each axis above or below its own midpoint. Every Oglet has one.
   2. **Four extremes** — a single axis in the outer 5%, which overrides the octant because a
      creature that flares at one poke is not "quick, sharp and warm", it is Tinder.

   `shareOf()` computes the real odds from the same constants that decide them, so nothing here
   is a hand-tuned percentage that can drift from the code.
   ═══════════════════════════════════════════════════════════ */

import { RANGES } from './genes.js'

/** How far into an axis counts as an extreme. Four of them, and they cost ~19% between them. */
export const EXTREME = 0.05

export const AXES = ['pace', 'temper', 'sociable']

/** The two ends of each axis, low first — the words the table and the page both use. */
export const AXIS_ENDS = {
  pace: ['slow', 'quick'],
  temper: ['sweet', 'sharp'],
  sociable: ['shy', 'warm'],
}

/** Each axis as 0…1 across its own range, so three genes with three different spans compare. */
export function axesOf(genome) {
  const out = {}
  for (const key of AXES) {
    const [lo, hi] = RANGES[key]
    const n = (genome[key] - lo) / (hi - lo)
    out[key] = Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 0.5
  }
  return out
}

/**
 * `tell` is the thing you can actually watch happen — no character is described by an adjective
 * that never reaches the screen. `bias` names the code path it leans on, so wiring one later is
 * a lookup rather than an argument.
 */
export const CHARACTERS = [
  /* ── the eight ──────────────────────────────────────────── */
  { id: 'lull', name: 'Lull', kind: 'temperament',
    axes: { pace: 'slow', temper: 'sweet', sociable: 'shy' },
    tell: 'Asleep before you have finished reading this, and delighted to be woken.',
    bias: 'sleepAfter shortens; drift radius stays small' },
  { id: 'hearth', name: 'Hearth', kind: 'temperament',
    axes: { pace: 'slow', temper: 'sweet', sociable: 'warm' },
    tell: 'Will not come to you. Is very pleased indeed when you come to it.',
    bias: 'bond climbs faster; approach is rare, engage is long' },
  { id: 'sulk', name: 'Sulk', kind: 'temperament',
    axes: { pace: 'slow', temper: 'sharp', sociable: 'shy' },
    tell: 'Slow to move and quick to mind. Holds the scowl a beat past the reason for it.',
    bias: 'annoy decays slower; angry expressions run long' },
  { id: 'bramble', name: 'Bramble', kind: 'temperament',
    axes: { pace: 'slow', temper: 'sharp', sociable: 'warm' },
    tell: 'Wants the company and complains about it the entire time it has it.',
    bias: 'seeks a partner, then emotes angry inside engage' },
  { id: 'flit', name: 'Flit', kind: 'temperament',
    axes: { pace: 'quick', temper: 'sweet', sociable: 'shy' },
    tell: 'Never in the same place twice, and never cross about anything.',
    bias: 'nextDrift is short; speck beats muse' },
  { id: 'spark', name: 'Spark', kind: 'temperament',
    axes: { pace: 'quick', temper: 'sweet', sociable: 'warm' },
    tell: 'The one that bumps into you on purpose and pops about it.',
    bias: 'cheer banks fast; leans into the pointer harder' },
  { id: 'skitter', name: 'Skitter', kind: 'temperament',
    axes: { pace: 'quick', temper: 'sharp', sociable: 'shy' },
    tell: 'Startles at everything, including, on a bad day, itself.',
    bias: 'startle chance and duration both up; blinks more' },
  { id: 'tussle', name: 'Tussle', kind: 'temperament',
    axes: { pace: 'quick', temper: 'sharp', sociable: 'warm' },
    tell: 'Plays rough. Takes the chase role, bumps hard, apologises never.',
    bias: 'play is entered more often and always as chase' },

  /* ── the four extremes ──────────────────────────────────── */
  { id: 'tinder', name: 'Tinder', kind: 'extreme', on: 'temper', end: 'high',
    tell: 'One poke is one poke too many. Goes straight past sad to angry.',
    bias: 'pokeDrives crosses 0.5 on the first tap' },
  { id: 'placid', name: 'Placid', kind: 'extreme', on: 'temper', end: 'low',
    tell: 'You can mash it flat and it stays mildly interested in you.',
    bias: 'annoy barely accumulates; never scowls at a stranger' },
  { id: 'magnet', name: 'Magnet', kind: 'extreme', on: 'sociable', end: 'high',
    tell: 'Cannot be in a room with another Oglet without trying to fix that.',
    bias: 'soc.nextTry is almost always ready' },
  { id: 'drowse', name: 'Drowse', kind: 'extreme', on: 'pace', end: 'low',
    tell: 'Everything it does, it does about two-thirds as fast as it should.',
    bias: 'pace scales the steer spring, the blink interval and the drift' },
]

const BY_ID = new Map(CHARACTERS.map((c) => [c.id, c]))
const TEMPERAMENTS = CHARACTERS.filter((c) => c.kind === 'temperament')
const BY_OCTANT = new Map(
  TEMPERAMENTS.map((c) => [`${c.axes.pace}/${c.axes.temper}/${c.axes.sociable}`, c]),
)

export const characterById = (id) => BY_ID.get(id) ?? null

/**
 * The character an Oglet has. Pure, and stable for the life of an id — the genes it reads are
 * drawn from the id and never redrawn.
 *
 * The extremes are checked in order and the order is part of the odds: a creature that is both
 * the top 5% of temper and the top 5% of sociable is Tinder, because the temper is the thing you
 * will notice first.
 */
export function characterOf(genome) {
  const a = axesOf(genome)
  if (a.temper >= 1 - EXTREME) return BY_ID.get('tinder')
  if (a.temper <= EXTREME) return BY_ID.get('placid')
  if (a.sociable >= 1 - EXTREME) return BY_ID.get('magnet')
  if (a.pace <= EXTREME) return BY_ID.get('drowse')

  const end = (key) => AXIS_ENDS[key][a[key] < 0.5 ? 0 : 1]
  return BY_OCTANT.get(`${end('pace')}/${end('temper')}/${end('sociable')}`)
}

/**
 * How often each character comes up, worked out from `EXTREME` and the midpoints rather than
 * written down. The extremes bite into specific halves — Tinder only ever eats `sharp`, Drowse
 * only `slow` — which is why the eight are not eight equal slices, and why this is computed.
 */
export function shares() {
  const e = EXTREME
  const out = {
    tinder: e,
    placid: e,
    magnet: (1 - 2 * e) * e,
    drowse: (1 - 2 * e) * (1 - e) * e,
  }
  // what each half of each axis has left once the extremes above have taken their bite
  const left = {
    pace: { slow: 0.5 - e, quick: 0.5 },
    temper: { sweet: 0.5 - e, sharp: 0.5 - e },
    sociable: { shy: 0.5, warm: 0.5 - e },
  }
  for (const c of TEMPERAMENTS) {
    out[c.id] = left.pace[c.axes.pace] * left.temper[c.axes.temper] * left.sociable[c.axes.sociable]
  }
  return out
}

export const shareOf = (character) => shares()[character?.id ?? character] ?? 0
