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
 *
 * **`sparse` is the one exemption**, and it exists for exactly one kind of gene: one whose
 * ordinary outcome is *nothing at all*. `body` is it — an Oglet has no body, and the mutation is
 * that a very few of them do.
 *
 * A sparse gene leaves its common bands empty and their share falls to its default allele
 * (`genes.js#assignWeights`). It is excused `min` entirely, including in the bands it populates,
 * and that is deliberate rather than lenient: with one body per rare tier, **the band a body sits
 * in is the entire statement about it**, and a second body in the same band says the two are
 * interchangeable when the point is that they are not. The reason `min` exists everywhere else —
 * that a band should not be one mutation you either have or do not — is exactly the property a
 * sparse gene wants.
 *
 * Three rules replace it, all tested: the default holds at least `sparseFloor` of the roll, or
 * "sparse" is a word rather than a fact; it is the allele at index 0, because that is what
 * `geneOf()` and every code predating the gene fall back to; and `maxRare` still applies, so the
 * rare end cannot quietly become a catalogue.
 */
export const TIER_QUOTA = {
  min: 2,
  maxRare: { legendary: 4, void: 4, god: 4 },
  sparse: ['body'],
  sparseFloor: 0.95,
}

/**
 * SOULLESS — a tier of its own, and deliberately **not in `TIERS`**.
 *
 * `TIERS` is the ladder a *gene* is cut against: its bands sum to one roll, `assignWeights()` walks
 * it, and the quota test demands mutations in every one of them. A Soulless is not a mutation and
 * has no allele, so putting it in that list would break all three at once and would be a lie about
 * what it is.
 *
 * It is rolled instead from its own stream on the id (`genome/derive.js#soullessIndex`), at
 * **0.00001% — one in ten million**, which is a hundred times rarer than a God-line mutation and
 * the rarest thing on the site by an order of magnitude. Eight stars, because there is nothing
 * above it.
 */
export const SOULLESS_TIER = {
  id: 'soulless', name: 'Soulless', spawn: 1e-7, c: 't7', stars: 8, points: 0,
}

export const tierById = (id) =>
  (id === 'soulless' ? SOULLESS_TIER : TIERS.find((t) => t.id === id)) ?? TIERS[0]

/** The tier a mutation is in. It says so itself — nothing is inferred from its weight. */
export const tierOfAllele = (allele) => tierById(allele?.tier)

/** Position in the ladder, 0 = Common. Drives the star count and the colour class. */
export const tierIndex = (tier) => TIERS.indexOf(tier)

/**
 * A chance, written the way a reader can compare two of them. Big numbers get no decimals, small
 * ones get two, and a God-line 0.0005 gets significant figures rather than rounding to "0.00%".
 */
const SUPERS = ['⁰', '¹', '²', '³', '⁴', '⁵', '⁶', '⁷', '⁸', '⁹']

/**
 * "1 in …", written so it fits on a card.
 *
 * A God-line combination is about one in 10²¹, and `toLocaleString()` renders that as
 * `1,199,999,999,999,999,000,000` — twenty-six characters of mostly zeroes, wrapping onto three
 * lines and lying about its own precision in the bargain. Three registers instead:
 *
 *   under a million   every digit, grouped — these are numbers a reader can hold
 *   under a quadrillion   compact (1.2M, 340B) — still a quantity anybody recognises
 *   above that   `1.2 × 10²¹`, because past a point the exponent *is* the information
 */
export function oddsText(chance) {
  if (!(chance > 0)) return '1 in ∞'
  const n = 1 / chance
  if (n < 1e6) return `1 in ${Math.round(n).toLocaleString()}`
  if (n < 1e15) {
    const compact = new Intl.NumberFormat(undefined, { notation: 'compact', maximumFractionDigits: 1 })
    return `1 in ${compact.format(n)}`
  }
  const exp = Math.floor(Math.log10(n))
  const mantissa = (n / 10 ** exp).toFixed(1)
  const sup = String(exp).replace(/\d/g, (d) => SUPERS[+d])
  return `1 in ${mantissa} × 10${sup}`
}

export function chanceText(w) {
  const v = w * 100
  if (v >= 5) return `${Math.round(v)}%`
  if (v >= 0.1) return `${v.toFixed(2)}%`
  return `${Number(v.toPrecision(2))}%`
}
