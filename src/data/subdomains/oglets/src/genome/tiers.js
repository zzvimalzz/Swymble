/* ═══════════════════════════════════════════════════════════
   RARITY TIERS — seven bands of probability, not seven thresholds.

   A tier is **a share of every roll**. Whatever gene you are drawing, you have a 60% chance of
   landing on a Common mutation and a 0.001% chance of landing on a God one; the bands sum to
   exactly 1. A mutation declares which band it belongs to, and its weight is that band's share
   divided between the mutations in it — see `genes.js#assignWeights`.

   That is the opposite of how this started. It used to be "a trait is rare because its weight is
   small", with the tier read back off the weight — which sounds principled and quietly made
   Common and Uncommon **unreachable**, because two Commons in one gene would have needed 120% of
   the probability mass. Declaring the band and deriving the weight is the model that survives
   contact with a quota.

   `points` is what a trait contributes to its Oglet's overall rarity score — see rarity.js — and
   it is deliberately not linear: a Void trait is worth more than two Rare ones, because being
   extraordinary once beats being odd twice.
   ═══════════════════════════════════════════════════════════ */

export const TIERS = [
  { id: 'common', name: 'Common', spawn: 0.6, c: 't0', stars: 1, points: 0 },
  { id: 'uncommon', name: 'Uncommon', spawn: 0.25, c: 't1', stars: 2, points: 1 },
  { id: 'rare', name: 'Rare', spawn: 0.1, c: 't2', stars: 3, points: 2 },
  { id: 'epic', name: 'Epic', spawn: 0.035, c: 't3', stars: 4, points: 3 },
  { id: 'legendary', name: 'Legendary', spawn: 0.012, c: 't4', stars: 5, points: 4 },
  { id: 'void', name: 'Void', spawn: 0.00299, c: 't5', stars: 6, points: 6 },
  { id: 'god', name: 'God', spawn: 0.00001, c: 't6', stars: 7, points: 10 },
]

/**
 * Every gene must offer **at least two mutations in every tier**, and no more than four
 * Legendary, Void or God. Two is what stops a band being a single mutation you either have or do
 * not; four is what stops the rare end of a gene becoming a treasure chest.
 * `tests/rarity.test.js` enforces both, and the spawn bands make both satisfiable.
 */
export const TIER_QUOTA = { min: 2, maxRare: { legendary: 4, void: 4, god: 4 } }

export const tierById = (id) => TIERS.find((t) => t.id === id) ?? TIERS[0]

/** The tier a mutation is in. It says so itself — nothing is inferred from its weight. */
export const tierOfAllele = (allele) => tierById(allele?.tier)

/** Position in the ladder, 0 = Common. Drives the star count and the colour class. */
export const tierIndex = (tier) => TIERS.indexOf(tier)

/**
 * A chance, written the way a reader can compare two of them. Big numbers get no decimals, small
 * ones get two, and a God-line 0.0005 gets significant figures rather than rounding to "0.00%".
 */
export function chanceText(w) {
  const v = w * 100
  if (v >= 5) return `${Math.round(v)}%`
  if (v >= 0.1) return `${v.toFixed(2)}%`
  return `${Number(v.toPrecision(2))}%`
}
