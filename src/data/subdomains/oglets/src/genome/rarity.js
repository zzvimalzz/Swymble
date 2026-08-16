/* ═══════════════════════════════════════════════════════════
   HOW RARE AN OGLET IS.

   Not the product of its odds. Multiplying the four weights together gives a number that is honest
   but useless as a label — every Oglet alive is somewhere between 1 in 41 and 1 in 208,000, so
   read against per-trait thresholds they would *all* come out Void.

   So an Oglet's rarity is scored from **how unusual each of its traits is**, one at a time. Each
   trait pays out the `points` of its own tier (Common 0 … Void 6 … God 10) and the total picks a
   tier off the ladder below. The scheme is deliberately legible: the page can show you all four
   traits, what each was worth, and the sum — nobody has to take the label on faith.

   The "1 in N" line is still the true combination odds. Two different questions, both answered.
   ═══════════════════════════════════════════════════════════ */

import { CATS, GENES, geneOf } from './genes.js'
import { tierById, tierIndex, tierOfAllele } from './tiers.js'

/**
 * Score → tier. Cut against the real tables, not by feel: four genes, each carrying at least two
 * mutations of every tier, gives a score whose distribution is known exactly, and the steps are
 * placed so the verdicts come out in roughly the same proportions as the spawn bands themselves —
 * Common 57%, Uncommon 29%, Rare 11%, Epic 2.7%, Legendary 0.6%, Void 0.1%.
 *
 * God is deliberately out of ordinary reach: four Void traits is 24, which is the God step and
 * about one Oglet in 10¹⁰, so in practice God means a God-line trait — which is the point of
 * having them.
 *
 * **Re-read this whenever a gene table changes.** `maxRarityPoints()` moves with the tables,
 * and a ladder tuned to an old ceiling quietly inflates every verdict on the site. It has been
 * re-cut six times, most recently when the glow gene was removed and five genes became four.
 */
export const RARITY_LADDER = [
  { min: 24, tier: 'god' },
  { min: 11, tier: 'void' },
  { min: 9, tier: 'legendary' },
  { min: 7, tier: 'epic' },
  { min: 5, tier: 'rare' },
  { min: 3, tier: 'uncommon' },
  { min: 0, tier: 'common' },
]

/** One row per categorical gene: the allele, how common it is, and what it was worth. */
export function traitsOf(g) {
  return CATS.map((cat) => {
    const allele = geneOf(cat, g[cat])
    const tier = tierOfAllele(allele)
    return { cat, allele, weight: allele.w, tier, points: tier.points }
  })
}

/**
 * The whole verdict: every trait, the points they add up to, and the tier that buys.
 * `rarest` is the single most unusual trait, which is what the copy calls out by name.
 */
export function rarityOf(g) {
  const traits = traitsOf(g)
  const points = traits.reduce((sum, t) => sum + t.points, 0)
  const step = RARITY_LADDER.find((s) => points >= s.min) ?? RARITY_LADDER[RARITY_LADDER.length - 1]
  const rarest = traits.reduce((a, b) => (tierIndex(b.tier) > tierIndex(a.tier) ? b : a))
  /* A God-line mutation carries the whole creature. It is not a shape, it is a rendering — an
     Oglet that has one is not "mostly ordinary with an odd eye", it is a different object. */
  const divine = traits.some((t) => t.tier.id === 'god')
  return { traits, points, tier: divine ? tierById('god') : tierById(step.tier), rarest }
}

/** The best score the current tables can produce — the ceiling printed on the Genome page. */
export const maxRarityPoints = () =>
  CATS.reduce((sum, cat) => sum + Math.max(...GENES[cat].map((a) => tierOfAllele(a).points)), 0)
