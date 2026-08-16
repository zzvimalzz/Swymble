import { describe, expect, it } from 'vitest'
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

  it('stores the id and nothing about the appearance', () => {
    const raw = JSON.parse(packOglet(oglet))
    expect(Object.keys(raw).sort()).toEqual(['born', 'bond', 'dex', 'id', 'seen', 'v'].sort())
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
