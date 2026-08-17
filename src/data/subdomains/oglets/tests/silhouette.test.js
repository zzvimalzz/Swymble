import { describe, expect, it } from 'vitest'
import { GENES, geneOf } from '../src/genome/index.js'
import {
  FORMS,
  PROFILE_SAMPLES,
  blendProfile,
  breatheProfile,
  circleProfile,
  harmonicProfile,
  hullOfCircles,
  maxRadius,
  normalise,
  profileFromPolygon,
  profileOf,
  radiusAtAngle,
  regularPolygonProfile,
  superellipseProfile,
  unionOfCirclesProfile,
} from '../src/render/silhouette.js'

const TAU = Math.PI * 2

/* The renderer is not tested here — there is no DOM environment in this project. The geometry is,
   because it is pure, and because every body in the catalogue is a handful of numbers that either
   describe a shape or quietly describe a spike. */

describe('a radial profile', () => {
  const ALL = () => [
    circleProfile(1),
    harmonicProfile([[2, 0.075, 0.5], [3, 0.035, 2.1]]),
    superellipseProfile(4.2),
    unionOfCirclesProfile([{ x: -0.4, y: 0.2, r: 0.5 }, { x: 0.4, y: 0.2, r: 0.5 }]),
    profileFromPolygon(hullOfCircles(-0.42, 0, 0.62, 0.42, 0, 0.62)),
    regularPolygonProfile(6, 1.04, 0.28),
  ]

  /* THE property the whole file exists for: every shape is sampled at the same angles, so any two
     of them correspond point for point and a morph is a lerp. Break this and blending two bodies
     silently interpolates a radius against an unrelated one. */
  it('is always the same length, whatever built it', () => {
    for (const radii of ALL()) expect(radii).toHaveLength(PROFILE_SAMPLES)
  })

  it('never has a negative or non-finite radius', () => {
    for (const radii of ALL()) {
      for (const r of radii) {
        expect(Number.isFinite(r)).toBe(true)
        expect(r).toBeGreaterThan(0)
      }
    }
  })

  it('normalises to a known widest point', () => {
    for (const radii of ALL()) expect(maxRadius(normalise(radii, 1.04))).toBeCloseTo(1.04, 12)
  })
})

describe('the shape builders', () => {
  it('draws a circle as a constant radius', () => {
    const c = circleProfile(0.7)
    expect(Math.min(...c)).toBeCloseTo(0.7, 12)
    expect(Math.max(...c)).toBeCloseTo(0.7, 12)
  })

  // the union is exact as long as the origin is inside it, which is the documented precondition
  it('reduces the union of one circle at the origin to that circle', () => {
    const one = unionOfCirclesProfile([{ x: 0, y: 0, r: 0.6 }])
    for (const r of one) expect(r).toBeCloseTo(0.6, 10)
  })

  it('makes a union at least as big as its biggest member everywhere it reaches', () => {
    const lobes = [{ x: -0.5, y: 0, r: 0.5 }, { x: 0.5, y: 0, r: 0.5 }, { x: 0, y: 0, r: 0.55 }]
    const u = unionOfCirclesProfile(lobes)
    expect(Math.min(...u)).toBeGreaterThanOrEqual(0.55 - 1e-9)
    expect(Math.max(...u)).toBeCloseTo(1, 6) // the far side of a lobe, at 0.5 + 0.5
  })

  it('makes a lozenge wider than it is tall', () => {
    const lozenge = profileFromPolygon(hullOfCircles(-0.42, 0, 0.62, 0.42, 0, 0.62))
    expect(radiusAtAngle(lozenge, 0)).toBeCloseTo(1.04, 2) // along the axis: 0.42 + 0.62
    expect(radiusAtAngle(lozenge, Math.PI / 2)).toBeCloseTo(0.62, 2) // across it: just the radius
  })

  it('makes a hexagon whose corners stick out further than its flats', () => {
    const hex = regularPolygonProfile(6, 1, 0.2, 0)
    // a corner sits at 0°, the middle of a flat at 30°
    expect(radiusAtAngle(hex, 0)).toBeGreaterThan(radiusAtAngle(hex, Math.PI / 6))
  })

  it('turns a superellipse into a circle at n = 2', () => {
    for (const r of superellipseProfile(2)) expect(r).toBeCloseTo(1, 10)
  })
})

describe('radiusAtAngle', () => {
  const radii = harmonicProfile([[2, 0.1, 0], [3, 0.05, 1]])

  it('agrees with the array at the sample angles', () => {
    for (let i = 0; i < PROFILE_SAMPLES; i++) {
      expect(radiusAtAngle(radii, (i / PROFILE_SAMPLES) * TAU)).toBeCloseTo(radii[i], 10)
    }
  })

  it('wraps, in both directions and more than once round', () => {
    for (const a of [0.3, 1.7, 4.4]) {
      expect(radiusAtAngle(radii, a + TAU * 3)).toBeCloseTo(radiusAtAngle(radii, a), 10)
      expect(radiusAtAngle(radii, a - TAU * 2)).toBeCloseTo(radiusAtAngle(radii, a), 10)
    }
  })
})

describe('blending two profiles', () => {
  const a = circleProfile(0.5)
  const b = superellipseProfile(4.2)

  it('is exact at both ends', () => {
    expect(blendProfile(a, b, 0)).toEqual(a)
    expect(blendProfile(a, b, 1)).toEqual(b)
  })

  it('sits between them everywhere in the middle', () => {
    const mid = blendProfile(a, b, 0.5)
    for (let i = 0; i < PROFILE_SAMPLES; i++) {
      expect(mid[i]).toBeCloseTo((a[i] + b[i]) / 2, 12)
    }
  })

  it('writes into the array it is given rather than allocating', () => {
    const out = new Array(PROFILE_SAMPLES).fill(0)
    expect(blendProfile(a, b, 0.5, out)).toBe(out)
  })
})

describe('the shape catalogue', () => {
  it('gives Bare no silhouette at all, which is what an Oglet is', () => {
    expect(profileOf(geneOf('body', 'bare').form)).toBeNull()
    expect(profileOf(undefined)).toBeNull()
    expect(profileOf('not-a-form')).toBeNull()
  })

  it('builds every named form into a usable profile', () => {
    for (const name of Object.keys(FORMS)) {
      const radii = profileOf(name)
      expect(radii, name).toHaveLength(PROFILE_SAMPLES)
      for (const r of radii) expect(Number.isFinite(r) && r > 0, `${name} radius`).toBe(true)
    }
  })

  /* Every body the gene table names has to exist here, and Pebble has to exist here WITHOUT being
     in the gene table — it is a Soulless body only. The catalogue and the gene are two different
     lists on purpose, and this is the test that says so. */
  it('carries every form the body gene names, and at least one it does not', () => {
    for (const allele of GENES.body) {
      if (!allele.form) continue
      expect(FORMS[allele.form], `${allele.id} → ${allele.form}`).toBeTruthy()
    }
    expect(FORMS.pebble).toBeTruthy()
    expect(GENES.body.some((a) => a.form === 'pebble')).toBe(false)
  })

  /* A body has to HOLD a pair of eyes, and the pair lives along the horizontal: at full gaze it
     reaches about 2.4 eye-radii out and roughly 1.7 up, and `BODY_UNIT` is 3.1. So the number that
     matters is the narrowest the body gets **in the band the eyes occupy** — ±45° of horizontal,
     both sides — and not its global minimum, which for a Droplet is the tip of its point and for a
     Mound is its crown. Neither of those is anywhere near an eye.

     0.72 of the body's width is about 2.23 eye-radii: enough that a Round eye is never touched and
     a Slab's outer corner is clipped at full yaw, which is the effect and not a fault. This is the
     first number to look at when a new body reads wrong on `#/assets`. */
  const EYE_BAND = []
  for (let i = 0; i < PROFILE_SAMPLES; i++) {
    const a = (i / PROFILE_SAMPLES) * TAU
    if (Math.abs(Math.cos(a)) >= Math.cos(Math.PI / 4)) EYE_BAND.push(i)
  }

  it('keeps every form wide enough where the eyes are to hold them', () => {
    for (const name of Object.keys(FORMS)) {
      const radii = profileOf(name)
      const narrowest = Math.min(...EYE_BAND.map((i) => radii[i]))
      expect(narrowest, name).toBeGreaterThan(0.72)
    }
  })

  it('gives every form the same width, so none of them presents more of itself to the eyes', () => {
    for (const name of Object.keys(FORMS)) {
      const radii = profileOf(name)
      expect((radii[0] + radii[PROFILE_SAMPLES / 2]) / 2, name).toBeCloseTo(FORMS[name].width ?? 1, 10)
    }
  })

  /* Height is free — that is the point of matching on width — but not unbounded: `Body.frame` is
     `BODY_UNIT × max`, and a thumbnail divides by it, so a body twice as tall as it is wide draws
     at half size in its circle and stops being something you can look at. */
  it('keeps every form inside the frame a card can give it', () => {
    for (const name of Object.keys(FORMS)) {
      expect(maxRadius(profileOf(name)), name).toBeLessThan(1.3)
    }
  })

  it('hands back the same cached array for the same name', () => {
    expect(profileOf('cloud')).toBe(profileOf('cloud'))
  })
})

describe('Wisp', () => {
  const base = profileOf('wisp')

  it('is never the same shape twice, and never far from itself', () => {
    const out = new Array(PROFILE_SAMPLES)
    const at = (t) => [...breatheProfile(base, t, 12345, out)]
    const a = at(0)
    const b = at(1.4)
    expect(a).not.toEqual(b)
    for (let i = 0; i < PROFILE_SAMPLES; i++) {
      // inside the ±12% the static frame in `render/body.js` reserves for it
      expect(Math.abs(b[i] / base[i] - 1), `sample ${i}`).toBeLessThan(0.12)
    }
  })

  it('gives two Oglets different outlines from the same base', () => {
    const one = [...breatheProfile(base, 3, 11, new Array(PROFILE_SAMPLES))]
    const two = [...breatheProfile(base, 3, 987, new Array(PROFILE_SAMPLES))]
    expect(one).not.toEqual(two)
  })
})
