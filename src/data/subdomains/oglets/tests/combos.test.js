import { describe, expect, it } from 'vitest'
import {
  CATS,
  COMBO_COUNT,
  GENES,
  RADIX,
  combinations,
  comboAt,
  comboIds,
  comboOrder,
  comboRank,
  comboScore,
  geneOf,
  odds,
  rarityOf,
  tierOfAllele,
} from '../src/genome/index.js'

/** A canonical genome for a combination — the continuous genes pinned, as the gallery pins them. */
const CANON = { gap: 1.05, pupilSize: 0.29, asymW: 1, asymH: 1, pace: 1, temper: 1.05, sociable: 1 }
const genomeOfCombo = (n) => ({ ...CANON, ...comboIds(n) })

describe('walking the categorical space', () => {
  it('counts the same space `combinations()` does', () => {
    expect(COMBO_COUNT).toBe(combinations())
    expect(RADIX).toEqual(CATS.map((c) => GENES[c].length))
  })

  it('is a bijection — every index a distinct combination, and all of them covered', () => {
    const seen = new Set()
    for (let n = 0; n < COMBO_COUNT; n++) {
      const ids = comboIds(n)
      seen.add(CATS.map((c) => ids[c]).join('|'))
    }
    expect(seen.size).toBe(COMBO_COUNT)
  })

  it('decomposes with the last gene varying fastest', () => {
    expect(comboAt(0)).toEqual(CATS.map(() => 0))
    const last = RADIX.length - 1
    expect(comboAt(1)[last]).toBe(1)
    expect(comboAt(COMBO_COUNT - 1)).toEqual(RADIX.map((r) => r - 1))
  })

  it('only ever names alleles that exist', () => {
    for (const n of [0, 1, 777, 12345, COMBO_COUNT - 1]) {
      const ids = comboIds(n)
      for (const cat of CATS) expect(geneOf(cat, ids[cat])).toBeTruthy()
    }
  })
})

describe('scoring a combination', () => {
  it('agrees with rarityOf and odds on every gene of a sample', () => {
    // a spread across the space rather than the first few, which are all Common
    for (const n of [0, 3, 41, 500, 4321, 20000, 30011, COMBO_COUNT - 1]) {
      const g = genomeOfCombo(n)
      const cheap = comboScore(n)
      const full = rarityOf(g)
      expect(cheap.points).toBe(full.points)
      expect(cheap.tier.id).toBe(full.tier.id)
      expect(cheap.chance).toBeCloseTo(odds(g), 12)
    }
  })

  it('promotes a God-line combination whatever else it drew', () => {
    // find the first combination carrying a God allele and check it comes out God
    let found = null
    for (let n = 0; n < COMBO_COUNT && found === null; n++) {
      const ids = comboIds(n)
      if (CATS.some((c) => tierOfAllele(geneOf(c, ids[c])).id === 'god')) found = n
    }
    expect(found).not.toBeNull()
    expect(comboScore(found).tier.id).toBe('god')
  })
})

describe('the order', () => {
  const order = comboOrder()

  it('is a permutation of the whole space', () => {
    expect(order).toHaveLength(COMBO_COUNT)
    expect(new Set(order).size).toBe(COMBO_COUNT)
  })

  /* One assertion for half a million comparisons, on purpose: `expect()` costs microseconds and
     the space grew elevenfold when the `body` gene landed, so calling it per item turned a
     millisecond loop into a nine-second one and timed the suite out. The failure message carries
     the offending index, which is the only thing the per-item version gave that this does not. */
  it('runs commonest first, and never goes backwards', () => {
    let bad = null
    let prev = comboScore(order[0])
    for (let i = 1; i < order.length && bad === null; i++) {
      const cur = comboScore(order[i])
      // within a score, the likelier one leads
      if (cur.points < prev.points || (cur.points === prev.points && cur.chance > prev.chance + 1e-15)) {
        bad = `at ${i}: ${prev.points}pts/${prev.chance} then ${cur.points}pts/${cur.chance}`
      }
      prev = cur
    }
    expect(bad).toBeNull()
  })

  it('is stable across calls — the same array, not a fresh sort', () => {
    expect(comboOrder()).toBe(order)
  })

  it('gives every combination a rank matching its position', () => {
    for (const i of [0, 1, 99, 8888, COMBO_COUNT - 1]) {
      expect(comboRank(order[i])).toBe(i + 1)
    }
  })
})
