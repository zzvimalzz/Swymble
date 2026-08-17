import { describe, expect, it } from 'vitest'
import { BEATS, BURST, COMET, ORBIT } from '../src/behaviour/beats.js'
import { COMET_RIBBONS, RINGS, particles } from '../src/render/decor.js'

/* A beat is the one thing in this project's motion layer that is a pure function of time, and this
   file is why that was worth insisting on: none of it needs a canvas, a clock or a creature. */

const frames = (def, end, step = 1 / 60) => {
  const out = []
  for (let u = 0; u <= end + 1e-9; u += step) out.push({ u, f: def.sample(u, 1) })
  return out
}

describe('every beat', () => {
  it('is a pure function of its own local time', () => {
    for (const def of Object.values(BEATS)) {
      const at = Number.isFinite(def.dur) ? def.dur * 0.4 : 1.3
      expect(JSON.stringify(def.sample(at, 1)), def.id).toBe(JSON.stringify(def.sample(at, 1)))
    }
  })

  it('never produces a frame the renderer would have to guard against', () => {
    for (const def of Object.values(BEATS)) {
      for (const { u, f } of frames(def, Number.isFinite(def.dur) ? def.dur : 3)) {
        const where = `${def.id} @ ${u.toFixed(2)}`
        for (const a of f.arcs ?? []) {
          expect(a.opacity, `${where} opacity`).toBeGreaterThanOrEqual(0)
          expect(a.opacity, `${where} opacity`).toBeLessThanOrEqual(1)
          expect(a.seed, `${where} seed`).toBeTruthy()
        }
        if (f.scale != null) expect(f.scale, `${where} scale`).toBeGreaterThan(0)
        if (f.eyeAlpha != null) {
          expect(f.eyeAlpha, `${where} eyeAlpha`).toBeGreaterThanOrEqual(0)
          expect(f.eyeAlpha, `${where} eyeAlpha`).toBeLessThanOrEqual(1)
        }
      }
    }
  })

  /* A beat that is still visible when its slot empties leaves a frame with rings in it and then
     nothing — a cut. Every scripted beat has to have faded itself out by the time it ends. */
  it('leaves nothing on screen at the moment it expires', () => {
    for (const def of Object.values(BEATS)) {
      if (!Number.isFinite(def.dur)) continue
      const last = def.sample(def.dur, 1)
      for (const a of last.arcs ?? []) expect(a.opacity, `${def.id} arc`).toBeLessThan(0.02)
      for (const d of last.dots ?? []) expect(d.opacity, `${def.id} dot`).toBeLessThan(0.02)
      if (last.scale != null) expect(last.scale, `${def.id} scale`).toBeCloseTo(1, 2)
      if (last.eyeAlpha != null) expect(last.eyeAlpha, `${def.id} eyeAlpha`).toBeCloseTo(1, 2)
    }
  })
})

describe('orbit', () => {
  it('brings its rings in one at a time and takes them all away', () => {
    const at = (u) => ORBIT.sample(u).arcs.map((a) => a.opacity)
    expect(at(0).every((o) => o === 0)).toBe(true)
    // by a third of a second the first ring is up and the last is not
    const early = at(0.34)
    expect(early[0]).toBeGreaterThan(early[RINGS.length - 1])
    expect(at(1.3).every((o) => o > 0.5)).toBe(true)
    expect(at(ORBIT.dur).every((o) => o < 0.02)).toBe(true)
  })

  it('draws every ring and adds none of its own', () => {
    expect(ORBIT.sample(1.3).arcs).toHaveLength(RINGS.length)
  })
})

describe('burst', () => {
  const scaleAt = (u) => BURST.sample(u).scale

  it('collapses to a speck and comes all the way back', () => {
    expect(scaleAt(0)).toBeCloseTo(1, 2)
    expect(scaleAt(0.7)).toBeCloseTo(0.166, 2)
    expect(scaleAt(BURST.dur)).toBeCloseTo(1, 2)
  })

  it('never overshoots on the way in or out — the body has no bounce', () => {
    for (const { f } of frames(BURST, BURST.dur)) {
      expect(f.scale).toBeLessThanOrEqual(1.0001)
      expect(f.scale).toBeGreaterThanOrEqual(0.16)
    }
  })

  /* The face has to be gone before the shape is, and back after it. A burst that keeps its eyes on
     through the collapse is a creature being shrunk rather than a creature coming apart. */
  it('takes the face off before the collapse and puts it back after the regrow', () => {
    expect(BURST.sample(0.34).eyeAlpha).toBeCloseTo(0, 2)
    expect(BURST.sample(0.7).eyeAlpha).toBeCloseTo(0, 2)
    expect(BURST.sample(1.6).eyeAlpha).toBeCloseTo(0, 2)
    expect(BURST.sample(2.1).eyeAlpha).toBeCloseTo(1, 2)
  })

  it('puts its particles behind the core, where they are swallowed', () => {
    expect(BURST.sample(0.5).dotsBehind).toBe(true)
  })
})

describe('the burst particles', () => {
  it('spiral IN, and are gone by the time the body is back', () => {
    const radius = (u) => particles(u).map((p) => Math.hypot(p.x, p.y))
    const early = radius(0.05)
    const late = radius(0.45)
    expect(Math.max(...early)).toBeGreaterThan(Math.max(...late))
    expect(particles(1.6)).toHaveLength(0)
  })

  it('grows them as they fall in, and fades them at both ends of a life', () => {
    const born = particles(0.02)[0]
    const middle = particles(0.3)[0]
    expect(born.opacity).toBeLessThan(middle.opacity)
    expect(born.r).toBeLessThan(middle.r)
    // depth rises as they approach the centre, which is what the renderer fades them by
    expect(particles(0.5).every((p) => p.depth >= 0 && p.depth <= 1)).toBe(true)
  })
})

describe('comet', () => {
  it('never ends on its own — it lasts as long as its cause', () => {
    expect(COMET.dur).toBe(Infinity)
  })

  it('is driven entirely by the level it is handed', () => {
    expect(COMET.sample(1, 0).arcs.every((a) => a.opacity === 0)).toBe(true)
    expect(COMET.sample(1, 0.4).arcs.every((a) => a.opacity === 0.4)).toBe(true)
    expect(COMET.sample(1, 1).arcs).toHaveLength(COMET_RIBBONS.length)
  })

  /* The measurement that makes this work on a creature being thrown: the ribbons are a tight beam
     around a point, not a streak behind one.

     Phases within 0.2 of a turn — bloub measured 10–20° between ribbons and no more, and it is the
     small phase spread that makes four arcs read as one trail with thickness. The flattening is
     the looser of the two: ±24% either side of the mean, so the outermost ribbon is about 1.63×
     the innermost. (bloub's own comment says "±5%" and its code says otherwise; the code is the
     measurement and the comment is a slip. Ported as written.) */
  it('keeps its ribbons in one beam', () => {
    const phases = COMET_RIBBONS.map((s) => s.phase)
    expect(Math.max(...phases) - Math.min(...phases)).toBeLessThan(0.2)
    const ks = COMET_RIBBONS.map((s) => s.k)
    expect(Math.max(...ks) / Math.min(...ks)).toBeLessThan(1.7)
  })
})

describe('the arc seeds', () => {
  /* **The clearance rule, and it is the load-bearing test in this file.** Every arc is scaled by
     the creature's own extent, so an arc whose projected ellipse comes inside 1.0 in either axis
     is an arc drawn through the face. bloub can run its planes edge-on because its body collapses
     to a dot under every arc; ours does not collapse, so `render/decor.js#clearing` raises the
     flattening until the minor axis clears. Both axes, every seed, plus the tightest `grow` any
     beat applies. */
  const FLOOR = 1.02
  const tightest = (def) => {
    let low = Infinity
    for (let u = 0; u <= (Number.isFinite(def.dur) ? def.dur : 2); u += 1 / 30) {
      for (const a of def.sample(u, 0).arcs ?? []) low = Math.min(low, a.grow ?? 1)
      for (const a of def.sample(u, 1).arcs ?? []) low = Math.min(low, a.grow ?? 1)
    }
    return Number.isFinite(low) ? low : 1
  }

  it('never lets an arc pass inside the creature, on either axis', () => {
    for (const [def, seeds] of [[ORBIT, RINGS], [COMET, COMET_RIBBONS]]) {
      const grow = tightest(def)
      for (const s of seeds) {
        expect(s.a * grow, `${def.id} major`).toBeGreaterThan(FLOOR)
        expect(s.a * s.k * grow, `${def.id} minor`).toBeGreaterThan(FLOOR)
      }
    }
  })

  /* Clearing the creature must not cost the depth split: at k = 1 the plane is face-on, z is zero
     everywhere and there is no back half to occlude. Every seed has to keep real depth. */
  it('keeps every plane genuinely tilted, so half of it is still behind', () => {
    for (const s of [...RINGS, ...COMET_RIBBONS]) {
      expect(Math.sqrt(1 - s.k * s.k), `k=${s.k.toFixed(2)}`).toBeGreaterThan(0.2)
    }
  })

  it('is bigger than the creature, and draws less than a full turn', () => {
    for (const s of RINGS) {
      expect(s.a).toBeGreaterThan(1.25)
      expect(s.sweep).toBeLessThan(1)
      expect(s.width).toBeGreaterThan(0)
    }
  })

  it('spawns every burst particle outside the creature', () => {
    for (const p of particles(0.02)) expect(Math.hypot(p.x, p.y)).toBeGreaterThan(1)
  })

  it('spreads the six of them around the hue wheel', () => {
    const hues = RINGS.map((s) => ((s.hue % 360) + 360) % 360).sort((a, b) => a - b)
    for (let i = 1; i < hues.length; i++) expect(hues[i] - hues[i - 1]).toBeGreaterThan(20)
  })
})
