/* Drawing a genome, and reading the odds of one.

   Every function here takes its randomness as an argument so the test suite can seed it, and
   so a future Daily Oglet can hand in a date-seeded PRNG without touching the roller. */

import { CATS, GENES, RANGES, geneOf } from './genes.js'

export function rollFrom(list, rng = Math.random) {
  let r = rng() * list.reduce((s, x) => s + x.w, 0)
  for (const x of list) {
    if ((r -= x.w) <= 0) return x
  }
  return list[list.length - 1]
}

export function randomGenome(rng = Math.random) {
  const between = (a, b) => a + rng() * (b - a)
  const g = {}
  for (const cat of CATS) g[cat] = rollFrom(GENES[cat], rng).id
  // continuous genes — these carry personality and small look drift
  g.gap = between(...RANGES.gap)
  g.pupilSize = between(...RANGES.pupilSize)
  g.asymW = between(0.95, 1.06)
  g.asymH = between(0.96, 1.04)
  g.pace = between(...RANGES.pace)
  g.temper = between(...RANGES.temper)
  g.sociable = between(...RANGES.sociable)
  return g
}

/** The odds of drawing this exact combination of categorical alleles. */
export function odds(g) {
  return CATS.reduce((p, c) => p * geneOf(c, g[c]).w, 1)
}

/** How many categorical combinations exist at all. Printed on the Genome page. */
export const combinations = () => CATS.reduce((n, c) => n * GENES[c].length, 1)
