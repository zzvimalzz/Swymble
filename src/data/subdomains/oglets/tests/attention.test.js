/* What an Oglet does when nobody is touching it — which, on a phone, is nearly always.

   Both halves of that sentence are tested here, because they were one bug between them: a touch
   device could not stay `attentive`, so the "on its own" branch of `chooseAttention` ran almost
   permanently, and that branch spent most of its time on the two attentions that wear a face. The
   result was an Oglet with question marks over its head as a resting state.

   Neither of these is a DOM test — `world/stage.js` is three plain objects and `chooseAttention`
   takes `attentive` as an argument — which is exactly why they can exist at all. */

import { beforeEach, describe, expect, it } from 'vitest'
import { chooseAttention } from '../src/behaviour/attention.js'
import { attentive, population, ptr } from '../src/world/stage.js'

/** The smallest thing `chooseAttention` will accept: no partner, awake, nothing owed to anybody. */
const lonelyOglet = () => ({
  soc: { state: 'none' },
  phase: 'awake',
  attn: 'wander',
  attnAt: 0,
  attnUntil: -1,
  drive: { bond: 0, lonely: 0, ignored: 0 },
  solo: {},
  peer: null,
  body: { glance() {} },
  aimAt: () => ({ x: 0, y: 0 }),
})

beforeEach(() => {
  population.length = 0
  ptr.seen = false
  ptr.in = false
  ptr.last = -1e9
  ptr.lift = -1e9
})

describe('being on its own', () => {
  /**
   * Every attention is re-rolled the moment the last one runs out, so what the creature *looks*
   * like is the share of TIME each one holds, not the share of rolls it wins. A `speck` is picked
   * half as often as a `wander` and lasts nearly twice as long.
   */
  const timeShare = (rolls = 60_000) => {
    const o = lonelyOglet()
    const held = { speck: 0, muse: 0, wander: 0, seek: 0, peer: 0, user: 0 }
    let clock = 0
    for (let i = 0; i < rolls; i++) {
      o.attnUntil = clock - 1 // always due
      chooseAttention(o, clock, false)
      held[o.attn] += o.attnUntil - clock
      clock = o.attnUntil
    }
    const total = Object.values(held).reduce((a, b) => a + b, 0)
    return Object.fromEntries(Object.entries(held).map(([k, v]) => [k, v / total]))
  }

  it('is mostly just wandering — neutral is the floor, not a minority', () => {
    const share = timeShare()
    // `wander` is the only solo attention that leaves the face alone (emotions/face.js)
    expect(share.wander).toBeGreaterThan(0.45)
  })

  it('does not spend its life thinking', () => {
    const share = timeShare()
    /* `muse` is the one that puts question marks up. At the old 30%-of-rolls it held ~29% of the
       clock and read as the creature's resting state, which is the bug this pins shut. */
    expect(share.muse).toBeLessThan(0.22)
  })

  it('still does all three — a floor is not a rut', () => {
    const share = timeShare()
    expect(share.speck).toBeGreaterThan(0.2)
    expect(share.muse).toBeGreaterThan(0.1)
  })
})

describe('whether you count as being there', () => {
  it('follows a cursor that is on the canvas and has moved recently', () => {
    ptr.in = true
    ptr.last = 100
    expect(attentive(101)).toBe(true)
    expect(attentive(110)).toBe(false) // sat still too long
  })

  it('does not count a cursor that left the page, however recently it moved', () => {
    ptr.in = false
    ptr.last = 100
    expect(attentive(100.1)).toBe(false)
  })

  /* The fix. `pointerleave` fires the instant a finger lifts, so `ptr.in` alone made a touch
     device inattentive between every single tap — see world/input.js#release. */
  it('keeps a finger present for a few seconds after it comes off the glass', () => {
    ptr.in = false
    ptr.last = -1e9
    ptr.lift = 100
    expect(attentive(100.1)).toBe(true)
    expect(attentive(104)).toBe(true)
    expect(attentive(110)).toBe(false)
  })

  it('never lets a mouse reach that clause — only a touch or a pen stamps `lift`', () => {
    ptr.in = false
    ptr.last = 100
    ptr.lift = -1e9 // a mouse release leaves this alone
    expect(attentive(100.5)).toBe(false)
  })
})
