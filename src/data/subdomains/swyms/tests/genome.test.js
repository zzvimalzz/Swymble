import { describe, expect, it } from 'vitest'
import {
  CATS,
  GENES,
  STORAGE_KEY,
  decode,
  encode,
  geneOf,
  nameOf,
  odds,
  packSwym,
  randomGenome,
  rollFrom,
  tierOf,
  unpackSwym,
} from '../genome.js'

/** A deterministic generator, so a failure here is always reproducible. */
const seeded = (seed) => {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}

const CONTINUOUS = { gap: [0.98, 1.12], pupilSize: [0.25, 0.33], pace: [0.8, 1.3], temper: [0.7, 1.4], sociable: [0.6, 1.4] }

describe('the gene tables', () => {
  it('gives every gene weights that sum to 1', () => {
    for (const [name, alleles] of Object.entries(GENES)) {
      const total = alleles.reduce((sum, allele) => sum + allele.w, 0)
      expect(total, `${name} weights`).toBeCloseTo(1, 6)
    }
  })

  it('gives every allele a unique id and a name', () => {
    for (const [name, alleles] of Object.entries(GENES)) {
      const ids = alleles.map((allele) => allele.id)
      expect(new Set(ids).size, `${name} ids`).toBe(ids.length)
      expect(alleles.every((allele) => allele.name?.length > 0)).toBe(true)
    }
  })

  it('falls back to the first allele rather than throwing on an unknown id', () => {
    expect(geneOf('shape', 'not-a-shape')).toBe(GENES.shape[0])
  })

  it('draws alleles in proportion to their weight', () => {
    const rng = seeded(7)
    const counts = new Map()
    for (let i = 0; i < 20000; i++) {
      const allele = rollFrom(GENES.palette, rng)
      counts.set(allele.id, (counts.get(allele.id) ?? 0) + 1)
    }
    for (const allele of GENES.palette) {
      expect((counts.get(allele.id) ?? 0) / 20000, allele.id).toBeCloseTo(allele.w, 1)
    }
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
      for (const [key, [low, high]] of Object.entries(CONTINUOUS)) {
        expect(Math.abs(back[key] - genome[key]), `${key} @ ${i}`).toBeLessThanOrEqual((high - low) / 70 + 1e-9)
      }
    }
  })

  it('draws the same Swym from the same code every time, asymmetry included', () => {
    const code = encode(randomGenome(seeded(3)))
    expect(decode(code)).toEqual(decode(code.toLowerCase()))
    expect(decode(code).asymW).toBe(decode(code).asymW)
  })

  it('is nine characters, uppercase, and alphanumeric', () => {
    const code = encode(randomGenome(seeded(5)))
    expect(code).toMatch(/^[0-9A-Z]{9}$/)
  })

  it('returns null for anything that is not a code', () => {
    for (const bad of ['', 'ABC', 'A'.repeat(10), null, undefined, 42, {}, '!!!!!!!!!', 'Z12345678']) {
      expect(decode(bad), String(bad)).toBeNull()
    }
  })

  it('rejects a code whose allele index is out of range', () => {
    // position 0 is the shape gene, which has four alleles — index 9 cannot exist
    expect(decode('912345678')).toBeNull()
  })
})

describe('odds and tiers', () => {
  it('multiplies only the categorical weights', () => {
    const genome = { shape: 'round', pupil: 'dot', palette: 'moss', finish: 'matte' }
    expect(odds(genome)).toBeCloseTo(0.38 * 0.46 * 0.14 * 0.9, 10)
  })

  it('names a tier for every weight, rarest last', () => {
    expect(tierOf(0.5).name).toBe('Common')
    expect(tierOf(0.2).name).toBe('Uncommon')
    expect(tierOf(0.1).name).toBe('Rare')
    expect(tierOf(0.05).name).toBe('Epic')
    expect(tierOf(0).name).toBe('Legendary')
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

describe('storage', () => {
  const swym = { code: encode(randomGenome(seeded(29))), bond: 0.42, born: 1_700_000_000_000, seen: 1_700_000_900_000 }

  it('uses a versioned key', () => {
    expect(STORAGE_KEY).toBe('swyms:v1')
  })

  it('round-trips a saved Swym', () => {
    const back = unpackSwym(packSwym(swym))
    expect(back.code).toBe(swym.code)
    expect(back.bond).toBeCloseTo(swym.bond, 3)
    expect(back.born).toBe(swym.born)
    expect(back.seen).toBe(swym.seen)
    expect(back.name).toBe(nameOf(swym.code))
    expect(back.genome).toEqual(decode(swym.code))
  })

  it('clamps a bond that has been tampered with', () => {
    expect(unpackSwym(packSwym({ ...swym, bond: 9 })).bond).toBe(1)
    expect(unpackSwym(packSwym({ ...swym, bond: -3 })).bond).toBe(0)
    expect(unpackSwym(JSON.stringify({ v: 1, code: swym.code, bond: 'lots' })).bond).toBe(0)
  })

  it('returns null for anything unusable, so the page hatches a new one instead of throwing', () => {
    for (const bad of ['', 'not json', '{}', '[]', null, undefined, JSON.stringify({ v: 2, code: swym.code }), JSON.stringify({ v: 1, code: 'nope' })]) {
      expect(unpackSwym(bad), String(bad)).toBeNull()
    }
  })
})
