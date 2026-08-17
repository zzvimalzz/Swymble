/* THE DEX — which alleles you have actually met.

   Two ways to meet one, and neither of them is a slot machine:

   1. **Your own Oglet's five traits** are known the moment it hatches. You live with them.
   2. **Opening a card** on the Genome page meets that allele. Looking is the verb, because
      there is no reroll button in this game to spam — one deliberate pass through the
      catalogue is exploration, not a grind, and it leaves you with a page you have *been*
      through rather than one that was handed to you.

   When breeding lands, a third way arrives on its own: an allele you actually bred. */

import { CATS, GENES } from '../genome/index.js'
import { mine, persist } from './session.js'

const key = (cat, allele) => `${cat}:${allele}`

export const isFound = (cat, allele) => mine.dex.includes(key(cat, allele))

/** @returns {boolean} true if this was the first time. */
export function discover(cat, allele) {
  if (isFound(cat, allele)) return false
  mine.dex.push(key(cat, allele))
  persist()
  return true
}

/** Your own Oglet's traits, known from the start. Called once at boot. */
export function seedFromMine() {
  for (const cat of CATS) discover(cat, mine.genome[cat])
}

export const progressOf = (cat) => ({
  found: GENES[cat].filter((a) => isFound(cat, a.id)).length,
  total: GENES[cat].length,
})

export function totalProgress() {
  return CATS.reduce(
    (sum, cat) => {
      const { found, total } = progressOf(cat)
      return { found: sum.found + found, total: sum.total + total }
    },
    { found: 0, total: 0 },
  )
}
