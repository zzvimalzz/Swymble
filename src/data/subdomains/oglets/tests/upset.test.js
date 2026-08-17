import { describe, expect, it, vi } from 'vitest'
import { GIVES_UP, forgive, upsetFace, upsetLook } from '../src/emotions/drives.js'

/** The parts of an Oglet the upset rules actually touch. */
const oglet = (temper = 1.2) => ({ angers: 0, angerAt: 0, g: { temper } })

describe('losing its temper, and giving up', () => {
  it('scowls the first times and gives up on the third', () => {
    const o = oglet()
    expect(upsetFace(o, 0)).toBe('angry')
    expect(upsetFace(o, 1)).toBe('angry')
    expect(o.angers).toBe(2)

    vi.spyOn(Math, 'random').mockReturnValue(0.9) // the coin that is not crying
    expect(upsetFace(o, 2)).toBe('sad')
    expect(o.angers).toBe(GIVES_UP)
    vi.restoreAllMocks()
  })

  it('cries on half of the times it gives up', () => {
    const o = oglet()
    o.angers = GIVES_UP - 1
    vi.spyOn(Math, 'random').mockReturnValue(0.1)
    expect(upsetFace(o, 0)).toBe('crying')
    vi.restoreAllMocks()
  })

  it('lets a sweet-tempered one give up a beat early', () => {
    const sweet = oglet(0.8)
    expect(upsetFace(sweet, 0)).toBe('angry') // even a sweet one squares up once
    expect(upsetFace(sweet, 1)).toBe('crying')

    const sharp = oglet(1.3)
    expect(upsetFace(sharp, 0)).toBe('angry')
    expect(upsetFace(sharp, 1)).toBe('angry')
  })

  it('never sustains crying — the held face is only ever angry or sad', () => {
    const o = oglet()
    for (let i = 0; i < 8; i++) {
      expect(['angry', 'sad']).toContain(upsetLook(o))
      o.angers = i
    }
  })

  it('wears the sad look exactly once it has given up', () => {
    const o = oglet()
    o.angers = GIVES_UP - 1
    expect(upsetLook(o)).toBe('angry')
    o.angers = GIVES_UP
    expect(upsetLook(o)).toBe('sad')
  })
})

describe('forgiving', () => {
  it('drops one grudge at a time, and only after a wait', () => {
    const o = oglet()
    o.angers = 2
    o.angerAt = 100

    forgive(o, 120) // too soon
    expect(o.angers).toBe(2)

    forgive(o, 200)
    expect(o.angers).toBe(1)
    forgive(o, 200) // the clock restarted with the last forgiveness
    expect(o.angers).toBe(1)

    forgive(o, 300)
    expect(o.angers).toBe(0)
    forgive(o, 1e6) // and never goes negative
    expect(o.angers).toBe(0)
  })

  it('brings it back from having given up', () => {
    const o = oglet()
    o.angers = GIVES_UP
    o.angerAt = 0
    expect(upsetLook(o)).toBe('sad')
    for (let t = 100; t <= 400; t += 100) forgive(o, t)
    expect(o.angers).toBeLessThan(GIVES_UP)
    expect(upsetLook(o)).toBe('angry')
  })
})
