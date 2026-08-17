/* ═══════════════════════════════════════════════════════════
   COMBINATIONS — the whole categorical space, addressable by number.

   `roll.js#combinations()` has always been able to *count* the space. This can walk it: every one
   of the 186,592 ways the five categorical genes can be arranged, indexable, scorable and
   sortable, so `#/gallery` can show all of them rather than a sample.

   **A combination is the five categorical genes and nothing else.** The five continuous genes are
   real numbers and would make the space uncountable, so a canonical combination pins them — the
   same reasoning `ui/specimen.js` uses for a mutation card, and the reason two Oglets with
   identical genes can still be told apart in the world.

   Everything here is pure and none of it builds an object per combination. Scoring 186,592 of them
   through `rarityOf()` would allocate ~190,000 trait records to throw all of them away; the
   tables are flattened once into plain number arrays instead, and a score is then five lookups.
   That is the difference between a page that opens and a page that hangs.
   ═══════════════════════════════════════════════════════════ */

import { CATS, GENES } from './genes.js'
import { RARITY_LADDER } from './rarity.js'
import { tierById, tierOfAllele } from './tiers.js'

/** How many alleles each gene has, in `CATS` order. The last gene varies fastest. */
export const RADIX = CATS.map((cat) => GENES[cat].length)

/** Every arrangement of the five categorical genes. 186,592 of them, today. */
export const COMBO_COUNT = RADIX.reduce((n, r) => n * r, 1)

/* The tables as bare numbers, built once at load: a tier's points and an allele's weight per
   gene, and whether it is God-line. Nothing here is read often enough to justify a Map. */
const POINTS = CATS.map((cat) => GENES[cat].map((a) => tierOfAllele(a).points))
const WEIGHT = CATS.map((cat) => GENES[cat].map((a) => a.w))
const DIVINE = CATS.map((cat) => GENES[cat].map((a) => Boolean(a.god)))

/* The rarity ladder, flattened once. `RARITY_LADDER.find(s => points >= s.min)` allocates a
   closure on every call, and this is called once per combination — which was half a million
   closures per pass the moment the `body` gene landed. */
const LADDER_MIN = RARITY_LADDER.map((s) => s.min)
const LADDER_TIER = RARITY_LADDER.map((s) => tierById(s.tier))
const GOD = tierById('god')

function tierForPoints(points) {
  for (let i = 0; i < LADDER_MIN.length; i++) if (points >= LADDER_MIN[i]) return LADDER_TIER[i]
  return LADDER_TIER[LADDER_TIER.length - 1]
}

/**
 * The nth combination as one allele index per gene, in `CATS` order.
 *
 * `out` is there so the hot paths below can reuse one array. Walking half a million combinations
 * while allocating a five-element array for each of them is most of the cost of opening the
 * gallery, and none of the work.
 */
export function comboAt(n, out = new Array(RADIX.length)) {
  let rest = n
  for (let i = RADIX.length - 1; i >= 0; i--) {
    out[i] = rest % RADIX[i]
    rest = Math.floor(rest / RADIX[i])
  }
  return out
}

/** Shared by `comboScore`, which consumes it before returning. Never handed out. */
const SCRATCH = new Array(RADIX.length)

/** The nth combination as `{ shape, pupil, iris, core, body }` allele ids. */
export function comboIds(n) {
  const at = comboAt(n)
  const out = {}
  CATS.forEach((cat, i) => (out[cat] = GENES[cat][at[i]].id))
  return out
}

/**
 * What the nth combination is worth, without allocating a trait record.
 *
 * `points` and the ladder are exactly `rarityOf()`'s, including the rule that any God-line trait
 * carries the whole creature — if the two ever disagree, this is the copy that is wrong.
 */
export function comboScore(n) {
  const at = comboAt(n, SCRATCH)
  let points = 0
  let chance = 1
  let divine = false
  for (let i = 0; i < at.length; i++) {
    points += POINTS[i][at[i]]
    chance *= WEIGHT[i][at[i]]
    if (DIVINE[i][at[i]]) divine = true
  }
  return { points, chance, tier: divine ? GOD : tierForPoints(points) }
}

/**
 * Every index, commonest first — rarity points ascending, and where two score the same the
 * likelier of the two leads. Both keys are exact integers or products of exact table values, so
 * the order is identical on every device and between loads.
 *
 * Computed on the first call and kept: it is a few milliseconds and one array of 186,592 numbers,
 * and the alternative is doing it again on every scroll.
 */
let ordered = null
export function comboOrder() {
  if (ordered) return ordered
  const points = new Int8Array(COMBO_COUNT)
  const chance = new Float64Array(COMBO_COUNT)
  const index = new Array(COMBO_COUNT)
  /* Digits are carried forward rather than recomputed. The last gene varies fastest, so counting
     up is one increment and a carry — not five divisions and a `Math.floor` — and none of it
     allocates. Half a million combinations is the difference between a page that opens and a page
     that hangs, and it went up by an order of magnitude when the `body` gene landed. */
  const at = new Array(RADIX.length).fill(0)
  const last = RADIX.length - 1
  for (let n = 0; n < COMBO_COUNT; n++) {
    let p = 0
    let c = 1
    for (let i = 0; i <= last; i++) {
      p += POINTS[i][at[i]]
      c *= WEIGHT[i][at[i]]
    }
    /* Raw points, and deliberately not "God-line sorts last": the order is by how unusual a
       combination is, and `comboScore` reports the same number. A test walks the whole order
       against it, so the two cannot drift. */
    points[n] = p
    chance[n] = c
    index[n] = n
    for (let i = last; i >= 0; i--) {
      if (++at[i] < RADIX[i]) break
      at[i] = 0
    }
  }
  index.sort((a, b) => points[a] - points[b] || chance[b] - chance[a])
  ordered = index
  return ordered
}

/** Where a given combination sits in that order, 1-based. The number printed on its card. */
let ranks = null
export function comboRank(n) {
  if (!ranks) {
    const order = comboOrder()
    ranks = new Int32Array(COMBO_COUNT)
    for (let i = 0; i < order.length; i++) ranks[order[i]] = i + 1
  }
  return ranks[n]
}
