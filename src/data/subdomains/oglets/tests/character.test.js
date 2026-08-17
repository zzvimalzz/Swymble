import { describe, expect, it } from 'vitest'
import {
  AXES,
  AXIS_ENDS,
  CHARACTERS,
  EXTREME,
  RANGES,
  axesOf,
  characterOf,
  genomeOf,
  newId,
  shares,
} from '../src/genome/index.js'

/** A genome with the three behaviour axes pinned to given 0…1 positions. */
const at = (positions) => {
  const g = {}
  for (const key of AXES) {
    const [lo, hi] = RANGES[key]
    g[key] = lo + (positions[key] ?? 0.5) * (hi - lo)
  }
  return g
}

describe('the character table', () => {
  it('is twelve, with unique ids and every field filled in', () => {
    expect(CHARACTERS).toHaveLength(12)
    expect(new Set(CHARACTERS.map((c) => c.id)).size).toBe(12)
    for (const c of CHARACTERS) {
      expect(c.name).toBeTruthy()
      expect(c.tell).toBeTruthy()
      expect(c.bias).toBeTruthy()
    }
  })

  it('covers all eight octants exactly once', () => {
    const octants = CHARACTERS.filter((c) => c.kind === 'temperament')
    expect(octants).toHaveLength(8)
    const keys = octants.map((c) => `${c.axes.pace}/${c.axes.temper}/${c.axes.sociable}`)
    expect(new Set(keys).size).toBe(8)
    for (const c of octants) {
      for (const key of AXES) expect(AXIS_ENDS[key]).toContain(c.axes[key])
    }
  })
})

describe('reading a character off a genome', () => {
  it('gives every id one, and never undefined', () => {
    for (let i = 0; i < 400; i++) {
      const c = characterOf(genomeOf(newId()))
      expect(c).toBeTruthy()
      expect(CHARACTERS).toContain(c)
    }
  })

  it('is stable for the life of an id', () => {
    const id = newId()
    expect(characterOf(genomeOf(id)).id).toBe(characterOf(genomeOf(id)).id)
  })

  it('names the octant when nothing is extreme', () => {
    expect(characterOf(at({ pace: 0.2, temper: 0.2, sociable: 0.2 })).id).toBe('lull')
    expect(characterOf(at({ pace: 0.9, temper: 0.9, sociable: 0.9 })).id).toBe('tussle')
    expect(characterOf(at({ pace: 0.9, temper: 0.2, sociable: 0.9 })).id).toBe('spark')
  })

  it('lets an extreme axis override the octant', () => {
    expect(characterOf(at({ temper: 1 })).id).toBe('tinder')
    expect(characterOf(at({ temper: 0 })).id).toBe('placid')
    expect(characterOf(at({ sociable: 1 })).id).toBe('magnet')
    expect(characterOf(at({ pace: 0 })).id).toBe('drowse')
  })

  it('resolves two extremes at once in the documented order', () => {
    expect(characterOf(at({ temper: 1, sociable: 1, pace: 0 })).id).toBe('tinder')
    expect(characterOf(at({ sociable: 1, pace: 0 })).id).toBe('magnet')
  })

  it('normalises each axis across its own range', () => {
    const a = axesOf(at({ pace: 0.25, temper: 0.5, sociable: 0.75 }))
    expect(a.pace).toBeCloseTo(0.25, 6)
    expect(a.temper).toBeCloseTo(0.5, 6)
    expect(a.sociable).toBeCloseTo(0.75, 6)
  })
})

describe('the odds', () => {
  it('sum to one', () => {
    const total = Object.values(shares()).reduce((a, b) => a + b, 0)
    expect(total).toBeCloseTo(1, 10)
  })

  it('spends the documented share on the four extremes', () => {
    const s = shares()
    const rare = s.tinder + s.placid + s.magnet + s.drowse
    expect(rare).toBeGreaterThan(0.18)
    expect(rare).toBeLessThan(0.19)
    for (const id of ['tinder', 'placid', 'magnet', 'drowse']) {
      expect(s[id]).toBeLessThanOrEqual(EXTREME)
    }
  })

  it('matches what ids actually draw', () => {
    const N = 12000
    const seen = {}
    for (let i = 0; i < N; i++) {
      const id = characterOf(genomeOf(newId())).id
      seen[id] = (seen[id] ?? 0) + 1
    }
    const expected = shares()
    for (const c of CHARACTERS) {
      // every one of the twelve must be reachable, and near its computed share
      expect(seen[c.id] ?? 0).toBeGreaterThan(0)
      expect((seen[c.id] ?? 0) / N).toBeCloseTo(expected[c.id], 1)
    }
  })
})
