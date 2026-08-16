import { describe, expect, it } from 'vitest'
import {
  CATS,
  CODED,
  GENES,
  RANGES,
  combinations,
  decode,
  encode,
  geneOf,
  nameOf,
  odds,
  randomGenome,
  rollFrom,
} from '../src/genome/index.js'

/** A deterministic generator, so a failure here is always reproducible. */
const seeded = (seed) => {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}

describe('the gene tables', () => {
  it('gives every gene weights that sum to 1', () => {
    for (const [name, alleles] of Object.entries(GENES)) {
      const total = alleles.reduce((sum, allele) => sum + allele.w, 0)
      expect(total, `${name} weights`).toBeCloseTo(1, 6)
    }
  })

  it('gives every mutation a unique id, a name and a line of lore', () => {
    for (const [name, alleles] of Object.entries(GENES)) {
      const ids = alleles.map((allele) => allele.id)
      expect(new Set(ids).size, `${name} ids`).toBe(ids.length)
      for (const allele of alleles) {
        expect(allele.name?.length, `${name}.${allele.id} name`).toBeGreaterThan(0)
        expect(allele.lore?.length, `${name}.${allele.id} lore`).toBeGreaterThan(0)
        expect(allele.lore.length, `${name}.${allele.id} lore length`).toBeLessThanOrEqual(120)
      }
    }
  })

  it('keeps every categorical gene inside one code character', () => {
    for (const cat of CATS) expect(GENES[cat].length, cat).toBeLessThanOrEqual(36)
  })

  it('falls back to the first allele rather than throwing on an unknown id', () => {
    expect(geneOf('shape', 'not-a-shape')).toBe(GENES.shape[0])
  })

  it('draws alleles in proportion to their weight', () => {
    const rng = seeded(7)
    const counts = new Map()
    for (let i = 0; i < 20000; i++) {
      const allele = rollFrom(GENES.iris, rng)
      counts.set(allele.id, (counts.get(allele.id) ?? 0) + 1)
    }
    for (const allele of GENES.iris) {
      expect((counts.get(allele.id) ?? 0) / 20000, allele.id).toBeCloseTo(allele.w, 1)
    }
  })

  it('counts the categorical combinations from the tables themselves', () => {
    expect(combinations()).toBe(CATS.reduce((n, c) => n * GENES[c].length, 1))
  })
})

describe('the code', () => {
  it('round-trips every categorical allele exactly', () => {
    const rng = seeded(11)
    for (let i = 0; i < 3000; i++) {
      const genome = randomGenome(rng)
      const back = decode(encode(genome))
      for (const cat of CATS) expect(back[cat], `${cat} @ ${i}`).toBe(genome[cat])
    }
  })

  it('round-trips continuous genes to within one quantisation step', () => {
    const rng = seeded(23)
    for (let i = 0; i < 3000; i++) {
      const genome = randomGenome(rng)
      const back = decode(encode(genome))
      for (const key of CODED) {
        const [low, high] = RANGES[key]
        expect(Math.abs(back[key] - genome[key]), `${key} @ ${i}`).toBeLessThanOrEqual((high - low) / 70 + 1e-9)
      }
    }
  })

  it('draws the same Oglet from the same code every time, asymmetry included', () => {
    const code = encode(randomGenome(seeded(3)))
    expect(decode(code)).toEqual(decode(code.toLowerCase()))
    expect(decode(code).asymW).toBe(decode(code).asymW)
  })

  it('is uppercase and alphanumeric, one character per gene', () => {
    const code = encode(randomGenome(seeded(5)))
    expect(code).toMatch(/^[0-9A-Z]+$/)
    expect(code.length).toBe(CATS.length + CODED.length)
  })

  it('returns null for anything that is not a code', () => {
    for (const bad of ['', 'ABC', 'A'.repeat(12), null, undefined, 42, {}, '!!!!!!!!!', 'Z12345678']) {
      expect(decode(bad), String(bad)).toBeNull()
    }
  })

  it('rejects a code whose allele index is out of range', () => {
    // position 3 is the pupil-colour gene, which has fourteen alleles — index 35 cannot exist
    expect(decode('000z000000')).toBeNull()
  })
})

describe('odds', () => {
  it('multiplies only the categorical weights', () => {
    const genome = { shape: 'round', pupil: 'dot', iris: 'moss', core: 'ash' }
    // read from the tables rather than hard-coded, so a re-weighting cannot make this a lie
    const expected = CATS.reduce((product, cat) => product * geneOf(cat, genome[cat]).w, 1)
    expect(odds(genome)).toBeCloseTo(expected, 12)
    expect(expected).toBeGreaterThan(0)
  })

  // the tier ladder itself is covered in rarity.test.js
  it('gives every gene weights that a roll can actually reach', () => {
    for (const cat of CATS) for (const allele of GENES[cat]) expect(allele.w, allele.id).toBeGreaterThan(0)
  })
})

describe('names', () => {
  it('gives the same code the same name, forever', () => {
    const code = encode(randomGenome(seeded(13)))
    expect(nameOf(code)).toBe(nameOf(code))
    expect(nameOf(decode(code))).toBe(nameOf(code))
  })

  it('is a plain capitalised word', () => {
    const rng = seeded(17)
    for (let i = 0; i < 200; i++) {
      expect(nameOf(randomGenome(rng))).toMatch(/^[A-Z][a-z]{2,8}$/)
    }
  })

  it('spreads across the bank rather than collapsing onto a few names', () => {
    const rng = seeded(19)
    const names = new Set()
    for (let i = 0; i < 600; i++) names.add(nameOf(randomGenome(rng)))
    expect(names.size).toBeGreaterThan(120)
  })
})
