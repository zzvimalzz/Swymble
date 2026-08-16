/* The nine-character code: a whole Oglet, written down.

   Four characters of categorical alleles, five of quantised continuous genes. It is what the
   Genome page prints and what the browser stores, so the format on screen and the format on
   disk can never disagree. */

import { clamp } from '../core/math.js'
import { CATS, CODED, GENES, RANGES } from './genes.js'
import { hash } from './hash.js'

const C36 = '0123456789abcdefghijklmnopqrstuvwxyz'

export const CODE_LENGTH = CATS.length + CODED.length

/**
 * Lengths this decoder still understands. Every entry is a *past* code format: the number of
 * categorical characters it carried. Genes are appended to the end of `CATS`, so an older code
 * simply stops early and the genes it never knew about take their common allele.
 *
 * Add to this list when a gene is added; never remove from it.
 */
const PAST_CATS = [4]

export function encode(g) {
  const allele = (cat) => C36[GENES[cat].findIndex((x) => x.id === g[cat])]
  const quantise = (key) => {
    const [a, b] = RANGES[key]
    return C36[clamp(Math.round(((g[key] - a) / (b - a)) * 35), 0, 35)]
  }
  return (CATS.map(allele).join('') + CODED.map(quantise).join('')).toUpperCase()
}

/**
 * The inverse of encode(). Returns null for anything that is not a real code, so a hand-typed
 * or corrupted one degrades to "start fresh" rather than to a broken creature.
 *
 * asymW/asymH are not encoded — nine characters is the budget — so they are derived from a
 * hash of the code instead. That keeps a code round-trippable *and* means the same code always
 * draws the same Oglet, which is the property share links and storage actually depend on.
 */
export function decode(code) {
  if (typeof code !== 'string') return null
  const s = code.trim().toLowerCase()

  // how many categorical characters this code carries — the current format, or a past one
  const cats = [CATS.length, ...PAST_CATS].find((n) => s.length === n + CODED.length)
  if (cats == null) return null

  const g = {}
  for (const [i, cat] of CATS.entries()) {
    if (i >= cats) {
      g[cat] = GENES[cat][0].id // a gene this code predates: it takes the common allele
      continue
    }
    const index = C36.indexOf(s[i])
    if (index < 0 || index >= GENES[cat].length) return null
    g[cat] = GENES[cat][index].id
  }
  for (const [i, key] of CODED.entries()) {
    const index = C36.indexOf(s[cats + i])
    if (index < 0) return null
    const [a, b] = RANGES[key]
    g[key] = a + (b - a) * (index / 35)
  }

  const h = hash(s)
  g.asymW = 0.95 + ((h >>> 3) % 111) / 1000
  g.asymH = 0.96 + ((h >>> 11) % 81) / 1000
  return g
}
