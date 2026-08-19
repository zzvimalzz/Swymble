import { describe, expect, it } from 'vitest'
import {
  BEATS,
  FLASH,
  FULL,
  MAX_CRACKS,
  MAX_HELP,
  TAP_GAP,
  TAP_HELP,
  beatAt,
  creditTap,
  flashAt,
  flashCovers,
  flashLength,
  progressOf,
  remainingOf,
} from '../src/ui/hatch-beats.js'
import { packOglet, unpackOglet } from '../src/state/storage.js'
import { newId } from '../src/genome/index.js'

describe('the schedule', () => {
  it('runs five minutes, and tapping can take off exactly half', () => {
    expect(FULL).toBe(300)
    expect(MAX_HELP).toBe(FULL / 2)
  })

  it('ends on a break, and the beats run forward to exactly 1', () => {
    expect(BEATS[BEATS.length - 1].until).toBe(1)
    expect(BEATS[BEATS.length - 1].id).toBe('break')
    let prev = 0
    for (const b of BEATS) {
      expect(b.until).toBeGreaterThan(prev)
      prev = b.until
    }
  })

  it('never lets a crack heal', () => {
    let cracks = -1
    for (let s = 0; s <= FULL; s += 0.5) {
      const at = beatAt(s)
      expect(at.cracks).toBeGreaterThanOrEqual(cracks)
      expect(at.cracks).toBeLessThanOrEqual(MAX_CRACKS)
      cracks = at.cracks
    }
  })

  it('never lets the rocking go backwards, and keeps it inside 0…1', () => {
    let rock = -1
    for (let s = 0; s <= FULL; s += 0.5) {
      const at = beatAt(s)
      expect(at.rock).toBeGreaterThanOrEqual(rock - 1e-9)
      expect(at.rock).toBeLessThanOrEqual(1 + 1e-9)
      rock = at.rock
    }
  })

  it('starts still and finishes broken', () => {
    expect(beatAt(0).id).toBe('arrival')
    expect(beatAt(0).cracks).toBe(0)
    expect(beatAt(0).rock).toBe(0)
    expect(beatAt(FULL).done).toBe(true)
    expect(beatAt(FULL).id).toBe('break')
  })

  it('reaches the break however far past the end it is asked', () => {
    for (const s of [FULL, FULL + 1, FULL * 10, 1e9]) expect(beatAt(s).done).toBe(true)
  })

  it('shows the first crack well before the end, so the wait has a middle', () => {
    expect(beatAt(FULL * 0.1).cracks).toBe(0)
    expect(beatAt(FULL * 0.35).cracks).toBeGreaterThan(0)
    expect(beatAt(FULL * 0.9).cracks).toBeGreaterThan(2)
  })
})

describe('progress', () => {
  it('is derived from the clock, so leaving does not restart it', () => {
    const laid = 1_000_000
    expect(progressOf(laid, 0, laid)).toBe(0)
    expect(progressOf(laid, 0, laid + 60_000)).toBe(60)
    expect(progressOf(laid, 0, laid + 999_000)).toBe(FULL) // clamped, never overdue
  })

  it('treats a missing timestamp as not started', () => {
    expect(progressOf(0, 40, 1e9)).toBe(0)
  })

  it('adds banked taps, and never more than the cap', () => {
    const laid = 5_000
    expect(progressOf(laid, 30, laid + 10_000)).toBe(40)
    expect(progressOf(laid, 9999, laid)).toBe(MAX_HELP)
  })

  it('counts down in whole seconds', () => {
    expect(remainingOf(0)).toBe(FULL)
    expect(remainingOf(FULL)).toBe(0)
    expect(remainingOf(FULL + 50)).toBe(0)
  })
})

describe('tapping', () => {
  it('pays for a tap, and refuses one that came too soon', () => {
    expect(creditTap(0, 0, TAP_GAP + 0.01)).toBe(TAP_HELP)
    expect(creditTap(0, 0, TAP_GAP / 2)).toBeNull()
  })

  /* The hint under the egg says "a second off, every time" and it is the only promise the page
     makes about the wait, now that the button that skipped it is gone. */
  it('takes exactly one second off, because that is what the egg says it does', () => {
    expect(TAP_HELP).toBe(1)
    const laid = 1_000
    const before = progressOf(laid, 0, laid + 60_000)
    expect(progressOf(laid, creditTap(0, 0, TAP_GAP + 0.01), laid + 60_000)).toBe(before + 1)
  })

  it('makes the floor cost 150 taps — a lever, not a second button', () => {
    let help = 0
    let taps = 0
    while (help < MAX_HELP) {
      help = creditTap(help, 0, ++taps * (TAP_GAP + 0.1)) ?? help
    }
    expect(taps).toBe(MAX_HELP / TAP_HELP)
    // and the gap means those taps cannot be spent faster than 0.6s apart
    expect(taps * TAP_GAP).toBeGreaterThan(60)
  })

  it('cannot be mashed past the cap', () => {
    let help = 0
    for (let i = 0; i < 500; i++) help = creditTap(help, 0, (i + 1) * (TAP_GAP + 0.1)) ?? help
    expect(help).toBe(MAX_HELP)
  })

  it('halves the wait at the cap and no further', () => {
    const laid = 1_000 // not 0: a falsy timestamp means "not laid yet", not "laid at the epoch"
    expect(progressOf(laid, MAX_HELP, laid + 150_000)).toBe(FULL)
    expect(progressOf(laid, MAX_HELP, laid + 149_000)).toBeLessThan(FULL)
  })
})

describe('the flash', () => {
  it('is dark before the shell is apart', () => {
    expect(flashAt(-1)).toBe(0)
    expect(flashAt(0)).toBe(0)
    expect(flashCovers(-0.01)).toBe(false)
  })

  it('reaches total cover, and nothing less', () => {
    // the swap depends on this: anything under 1 leaves the egg visible through it
    expect(flashAt(FLASH.up)).toBe(1)
    expect(flashAt(FLASH.up + FLASH.hold / 2)).toBe(1)
    expect(flashCovers(FLASH.up)).toBe(true)
  })

  it('holds the cover long enough for the swap, then lets go', () => {
    expect(flashAt(FLASH.up + FLASH.hold - 0.01)).toBe(1)
    expect(flashAt(FLASH.up + FLASH.hold + 0.01)).toBeLessThan(1)
    expect(flashAt(FLASH.up + FLASH.hold + FLASH.fade)).toBe(0)
    expect(flashAt(999)).toBe(0)
  })

  it('never goes backwards on the way up or forwards on the way down', () => {
    let prev = -1
    for (let l = 0; l <= FLASH.up; l += 0.005) {
      const v = flashAt(l)
      expect(v).toBeGreaterThanOrEqual(prev - 1e-9)
      prev = v
    }
    prev = 2
    for (let l = FLASH.up + FLASH.hold; l <= flashLength() + 0.5; l += 0.01) {
      const v = flashAt(l)
      expect(v).toBeLessThanOrEqual(prev + 1e-9)
      prev = v
    }
  })

  it('stays inside 0…1 for every input, however silly', () => {
    for (const l of [-1e6, -0.001, 0, 0.05, 1, 3, 1e6, NaN]) {
      const v = flashAt(l)
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThanOrEqual(1)
    }
  })

  it('covers just as completely under reduced motion — only slower', () => {
    // the cover is the mechanism, not the decoration: losing it would show the swap
    expect(flashAt(FLASH.calmUp, true)).toBe(1)
    expect(flashCovers(FLASH.calmUp, true)).toBe(true)
    // and it must not strobe: nowhere near full at the moment the brisk one already is
    expect(flashAt(FLASH.up, true)).toBeLessThan(0.25)
    expect(flashLength(true)).toBeGreaterThan(flashLength())
  })

  it('agrees with itself about when the cover starts', () => {
    for (const calm of [false, true]) {
      const at = calm ? FLASH.calmUp : FLASH.up
      expect(flashCovers(at - 0.001, calm)).toBe(false)
      expect(flashAt(at - 0.001, calm)).toBeLessThan(1)
      expect(flashCovers(at, calm)).toBe(true)
      expect(flashAt(at, calm)).toBe(1)
    }
  })
})

describe('the egg, stored', () => {
  const base = { id: newId(), bond: 0, born: 1, seen: 2, dex: [] }

  it('round-trips an unhatched egg', () => {
    const packed = packOglet({ ...base, hatched: false, eggAt: 1234000, eggHelp: 42 })
    const back = unpackOglet(packed)
    expect(back.hatched).toBe(false)
    expect(back.eggAt).toBe(1234000)
    expect(back.eggHelp).toBe(42)
  })

  it('counts a record saved before eggs existed as already hatched', () => {
    // exactly what a v2 record looked like before this field
    const old = JSON.stringify({ v: 2, id: base.id, bond: 0, born: 1, seen: 2, dex: [] })
    expect(unpackOglet(old).hatched).toBe(true)
    const v1 = JSON.stringify({ v: 1, code: base.id, bond: 0, born: 1, seen: 2, dex: [] })
    expect(unpackOglet(v1)?.hatched).toBe(true)
  })

  it('refuses junk in the egg fields without losing the Oglet', () => {
    const raw = JSON.stringify({ v: 2, id: base.id, dex: [], eggAt: 'soon', eggHelp: Infinity, hatched: false })
    const back = unpackOglet(raw)
    expect(back).toBeTruthy()
    expect(back.eggAt).toBe(0)
    expect(back.eggHelp).toBe(0)
    expect(back.hatched).toBe(false)
  })
})
