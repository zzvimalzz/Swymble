import { describe, expect, it } from 'vitest'
import { cleanName } from '../src/state/storage.js'

/* A chosen name is the first thing about an Oglet that is **not** derived from its id, so it is
   also the first thing that has to be cleaned: it is stored, and later rendered into the page. */
describe('a name somebody typed', () => {
  it('keeps letters, digits and the marks a name actually uses', () => {
    expect(cleanName('Pobble')).toBe('Pobble')
    expect(cleanName("O'Nix")).toBe("O'Nix")
    expect(cleanName('Jean-Luc 2')).toBe('Jean-Luc 2')
    expect(cleanName('Ünter Ω 김')).toBe('Ünter Ω 김')
  })

  it('drops anything that could be markup, because this ends up in the page', () => {
    expect(cleanName('</h2><script>')).toBe('h2script')
    expect(cleanName('a&b"c`d')).toBe('abcd')
    // asserted as a property rather than a string: the 18-character cap truncates this one, and
    // what matters is that nothing left in it can open a tag or close an attribute
    for (const nasty of ['<img src=x onerror=alert(1)>', '" onmouseover="x', '${alert(1)}', 'a<b>c']) {
      expect(cleanName(nasty), nasty).not.toMatch(/[<>&"`${}()=/\\]/)
    }
  })

  it('tidies whitespace and caps the length', () => {
    expect(cleanName('   spaced   out   ')).toBe('spaced out')
    expect(cleanName('x'.repeat(60))).toHaveLength(18)
  })

  it('returns nothing usable as empty, so the caller falls back to the derived name', () => {
    for (const bad of ['', '   ', '<<<>>>', null, undefined, 42, {}]) {
      expect(cleanName(bad), String(bad)).toBe('')
    }
  })
})
import { encode, genomeOf, nameOf, newId, randomGenome } from '../src/genome/index.js'
import { LEGACY_KEY, STORAGE_KEY, packOglet, unpackOglet } from '../src/state/storage.js'

const seeded = (seed) => {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}

describe('storage', () => {
  const oglet = { id: newId(), bond: 0.42, born: 1_700_000_000_000, seen: 1_700_000_900_000, dex: [] }

  it('uses versioned keys', () => {
    expect(STORAGE_KEY).toBe('oglets:v2')
    expect(LEGACY_KEY).toBe('oglets:v1')
  })

  it('round-trips a saved Oglet', () => {
    const back = unpackOglet(packOglet(oglet))
    expect(back.id).toBe(oglet.id)
    expect(back.bond).toBeCloseTo(oglet.bond, 3)
    expect(back.born).toBe(oglet.born)
    expect(back.seen).toBe(oglet.seen)
    expect(back.name).toBe(nameOf(oglet.id))
    expect(back.genome).toEqual(genomeOf(oglet.id))
    expect(back.legacy).toBe(false)
  })

  /* The point of this one is the *absence* of anything describing the creature — the id redraws
     it, so what is on screen and what is on disk cannot drift apart. The egg fields are progress
     through the hatch, not appearance, so they belong; a `shape` or a hex colour never would. */
  it('stores the id and nothing about the appearance', () => {
    const raw = JSON.parse(packOglet(oglet))
    expect(Object.keys(raw).sort()).toEqual(
      ['born', 'bond', 'dex', 'eggAt', 'eggHelp', 'hatched', 'id', 'seen', 'v'].sort(),
    )
  })

  it('keeps a first-release Oglet exactly as it was', () => {
    const code = encode(randomGenome(seeded(29)))
    const back = unpackOglet(JSON.stringify({ v: 1, code, bond: 0.2, born: 1, seen: 2 }))
    expect(back.id).toBe(code.toLowerCase())
    expect(back.legacy).toBe(true)
    expect(back.genome).toEqual(genomeOf(code))
    expect(back.name).toBe(nameOf(code.toLowerCase()))
  })

  it('clamps a bond that has been tampered with', () => {
    expect(unpackOglet(packOglet({ ...oglet, bond: 9 })).bond).toBe(1)
    expect(unpackOglet(packOglet({ ...oglet, bond: -3 })).bond).toBe(0)
    expect(unpackOglet(JSON.stringify({ v: 2, id: oglet.id, bond: 'lots' })).bond).toBe(0)
  })

  it('keeps only alleles that still exist in the dex', () => {
    const back = unpackOglet(packOglet({ ...oglet, dex: ['iris:void', 'iris:void', 'shape:gone', 'nonsense'] }))
    expect(back.dex).toEqual(['iris:void'])
  })

  it('returns null for anything unusable, so the page hatches a new one instead of throwing', () => {
    for (const bad of [
      '',
      'not json',
      '{}',
      '[]',
      null,
      undefined,
      JSON.stringify({ v: 3, id: oglet.id }),
      JSON.stringify({ v: 2, id: 'nope' }),
      JSON.stringify({ v: 1, code: 'nope' }),
    ]) {
      expect(unpackOglet(bad), String(bad)).toBeNull()
    }
  })
})
