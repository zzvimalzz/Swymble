import { describe, expect, it } from 'vitest'
import {
  AGEING,
  CATS,
  GENES,
  SOULLESS_CHANCE,
  SOULLESS_TIER,
  chanceText,
  encode,
  genomeOf,
  groupId,
  hatchId,
  isId,
  newId,
  randomGenome,
  soullessIndex,
  streamFor,
  tierById,
} from '../src/genome/index.js'

const seeded = (seed) => {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}

describe('an id', () => {
  it('is 32 hex characters', () => {
    for (let i = 0; i < 50; i++) expect(newId()).toMatch(/^[0-9a-f]{32}$/)
  })

  it('is never the same twice', () => {
    const seen = new Set()
    for (let i = 0; i < 5000; i++) seen.add(newId())
    expect(seen.size).toBe(5000)
  })

  it('recognises its own kind, and nothing else', () => {
    expect(isId(newId())).toBe(true)
    expect(isId(newId().toUpperCase())).toBe(true)
    for (const bad of ['', 'abc', null, undefined, 42, {}, 'g'.repeat(32), '0'.repeat(31)]) {
      expect(isId(bad), String(bad)).toBe(false)
    }
  })

  it('prints in readable groups', () => {
    expect(groupId('0123456789abcdef0123456789abcdef')).toBe('01234567 89ABCDEF 01234567 89ABCDEF')
  })
})

describe('the genome an id draws', () => {
  it('is the same every single time', () => {
    for (let i = 0; i < 200; i++) {
      const id = newId()
      expect(genomeOf(id)).toEqual(genomeOf(id))
    }
  })

  it('does not care about case or surrounding space', () => {
    const id = newId()
    expect(genomeOf(` ${id.toUpperCase()} `)).toEqual(genomeOf(id))
  })

  it('is a complete, valid genome', () => {
    for (let i = 0; i < 500; i++) {
      const g = genomeOf(newId())
      for (const cat of CATS) {
        expect(GENES[cat].some((a) => a.id === g[cat]), `${cat}=${g[cat]}`).toBe(true)
      }
      for (const key of ['gap', 'pupilSize', 'pace', 'temper', 'sociable', 'asymW', 'asymH']) {
        expect(Number.isFinite(g[key]), key).toBe(true)
      }
    }
  })

  it('spreads across the tables in roughly the declared weights', () => {
    const counts = new Map()
    const runs = 20000
    for (let i = 0; i < runs; i++) {
      const g = genomeOf(newId())
      counts.set(g.iris, (counts.get(g.iris) ?? 0) + 1)
    }
    for (const allele of GENES.iris) {
      expect((counts.get(allele.id) ?? 0) / runs, allele.id).toBeCloseTo(allele.w, 1)
    }
  })

  it('still draws a first-release nine-character code', () => {
    const code = encode(randomGenome(seeded(7)))
    const back = genomeOf(code)
    expect(back).not.toBeNull()
    for (const cat of CATS) expect(back[cat]).toBe(genomeOf(code.toLowerCase())[cat])
  })

  it('returns null for anything that is neither', () => {
    for (const bad of ['', 'nope', null, undefined, 42, {}, 'Z12345678']) {
      expect(genomeOf(bad), String(bad)).toBeNull()
    }
  })

  it('hatches an id and its creature together', () => {
    const { id, genome } = hatchId()
    expect(isId(id)).toBe(true)
    expect(genome).toEqual(genomeOf(id))
  })
})

/* A Soulless is not a gene — no allele, no weight, nothing in `GENES` — so it is drawn from its own
   stream on the id. These are the properties that buys, and the reason it was done that way. */
describe('the Soulless draw', () => {
  it('is one in ten million, which is what the page prints', () => {
    expect(SOULLESS_CHANCE).toBe(1e-7)
    expect(chanceText(SOULLESS_CHANCE)).toBe('0.00001%')
    // a hundred times rarer than a God-line mutation, which is the rarest thing a gene can offer
    expect(SOULLESS_CHANCE * 100).toBeLessThan(tierById('god').spawn)
    expect(SOULLESS_TIER.stars).toBeGreaterThan(tierById('god').stars)
  })

  it('says no to essentially everybody, and the same no every time', () => {
    let any = 0
    for (let i = 0; i < 4000; i++) {
      const id = newId()
      const first = soullessIndex(id, 3)
      expect(soullessIndex(id, 3)).toBe(first)
      if (first >= 0) any++
    }
    expect(any).toBe(0) // 4,000 draws against 1-in-10,000,000
  })

  /* The whole reason for a private stream: adding this disturbed nobody. An id that was drawing a
     creature before it existed draws exactly the same one now, because no gene shares its sequence. */
  it('does not touch a single gene', () => {
    for (let i = 0; i < 200; i++) {
      const id = newId()
      const before = genomeOf(id)
      soullessIndex(id, 3)
      expect(genomeOf(id)).toEqual(before)
    }
  })

  it('answers in range, or −1, and never anything else', () => {
    for (const count of [1, 3, 9]) {
      for (let i = 0; i < 500; i++) {
        const n = soullessIndex(newId(), count)
        expect(n === -1 || (Number.isInteger(n) && n >= 0 && n < count)).toBe(true)
      }
    }
    expect(soullessIndex(newId(), 0)).toBe(-1)
  })

  /* Forced past the gate, the *which* has to spread — otherwise the two rarer themes are decoration
     on a creature nobody will ever see twice. Read straight off the stream, as the real draw does. */
  it('spreads across the themes once it does say yes', () => {
    const seen = new Set()
    for (let i = 0; i < 500 && seen.size < 3; i++) {
      const draw = streamFor(newId(), 'soulless')
      draw() // the gate, discarded — this is the roll it would have failed
      seen.add(Math.floor(draw() * 3) % 3)
    }
    expect(seen.size).toBe(3)
  })
})

describe('the streams a gene is drawn from', () => {
  // This is the property that lets a gene be ADDED later without redrawing anybody.
  it('gives every gene its own independent sequence', () => {
    const id = newId()
    const a = streamFor(id, 'iris')
    const b = streamFor(id, 'crest-that-does-not-exist-yet')
    expect(a()).not.toBe(b())
    // and drawing from one does not advance the other
    const fresh = streamFor(id, 'iris')
    a()
    a()
    expect(fresh()).toBe(streamFor(id, 'iris')())
  })

  it('ignores the epoch for a gene that does not age', () => {
    const id = newId()
    expect(genomeOf(id, { epoch: 9 })).toEqual(genomeOf(id))
  })

  it('would redraw an ageing gene, and only that gene', () => {
    const id = newId()
    AGEING.add('iris')
    try {
      const young = streamFor(id, 'iris', 0)()
      const old = streamFor(id, 'iris', 4)()
      expect(old).not.toBe(young)
      expect(streamFor(id, 'shape', 4)()).toBe(streamFor(id, 'shape', 0)())
    } finally {
      AGEING.delete('iris')
    }
  })
})
