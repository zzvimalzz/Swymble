/* ═══════════════════════════════════════════════════════════
   COMBINATIONS — the whole categorical space, addressable by number.

   `roll.js#combinations()` has always been able to *count* the space. This can walk it: every one
   of the 46,648 ways the four categorical genes can be arranged, indexable, scorable and
   sortable, so `#/gallery` can show all of them rather than a sample.

   **A combination is the four categorical genes and nothing else.** The five continuous genes are
   real numbers and would make the space uncountable, so a canonical combination pins them — the
   same reasoning `ui/specimen.js` uses for a mutation card, and the reason two Oglets with
   identical genes can still be told apart in the world.

   Everything here is pure and none of it builds an object per combination. Scoring 46,648 of them
   through `rarityOf()` would allocate ~190,000 trait records to throw all of them away; the
   tables are flattened once into plain number arrays instead, and a score is then four lookups.
   That is the difference between a page that opens and a page that hangs.
   ═══════════════════════════════════════════════════════════ */

import { CATS, GENES } from './genes.js'
import { RARITY_LADDER } from './rarity.js'
import { tierById, tierOfAllele } from './tiers.js'

/** How many alleles each gene has, in `CATS` order. The last gene varies fastest. */
export const RADIX = CATS.map((cat) => GENES[cat].length)

/** Every arrangement of the four categorical genes. 46,648 of them, today. */
export const COMBO_COUNT = RADIX.reduce((n, r) => n * r, 1)

/* The tables as bare numbers, built once at load: a tier's points and an allele's weight per
   gene, and whether it is God-line. Nothing here is read often enough to justify a Map. */
const POINTS = CATS.map((cat) => GENES[cat].map((a) => tierOfAllele(a).points))
const WEIGHT = CATS.map((cat) => GENES[cat].map((a) => a.w))
const DIVINE = CATS.map((cat) => GENES[cat].map((a) => Boolean(a.god)))

/** The nth combination as one allele index per gene, in `CATS` order. */
export function comboAt(n) {
  const out = new Array(RADIX.length)
  let rest = n
  for (let i = RADIX.length - 1; i >= 0; i--) {
    out[i] = rest % RADIX[i]
    rest = Math.floor(rest / RADIX[i])
  }
  return out
}

/** The nth combination as `{ shape, pupil, iris, core }` allele ids. */
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
  const at = comboAt(n)
  let points = 0
  let chance = 1
  let divine = false
  for (let i = 0; i < at.length; i++) {
    points += POINTS[i][at[i]]
    chance *= WEIGHT[i][at[i]]
    if (DIVINE[i][at[i]]) divine = true
  }
  const step = RARITY_LADDER.find((s) => points >= s.min) ?? RARITY_LADDER[RARITY_LADDER.length - 1]
  return { points, chance, tier: divine ? tierById('god') : tierById(step.tier) }
}

/**
 * Every index, commonest first — rarity points ascending, and where two score the same the
 * likelier of the two leads. Both keys are exact integers or products of exact table values, so
 * the order is identical on every device and between loads.
 *
 * Computed on the first call and kept: it is a few milliseconds and one array of 46,648 numbers,
 * and the alternative is doing it again on every scroll.
 */
let ordered = null
export function comboOrder() {
  if (ordered) return ordered
  const points = new Int8Array(COMBO_COUNT)
  const chance = new Float64Array(COMBO_COUNT)
  const index = new Array(COMBO_COUNT)
  for (let n = 0; n < COMBO_COUNT; n++) {
    const s = comboScore(n)
    points[n] = s.points
    chance[n] = s.chance
    index[n] = n
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
