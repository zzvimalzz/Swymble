/* ═══════════════════════════════════════════════════════════
   SILHOUETTES — every closed outline in this project, as one number per angle.

   A silhouette is `r(θ)` sampled at the SAME 64 angles, whatever shape it is. That one decision
   buys three things, and the third is the reason it is worth a file:

     · any two shapes have points that correspond one to one, so morphing between them is a
       `lerp` over 64 numbers and there is no path-morphing library anywhere near this project;
     · `radiusAtAngle` answers "where is my edge, in that direction" for anything that has to sit
       on the outline rather than inside it;
     · a shape can be *modulated by the clock* — see Wisp — without any of it being special-cased.

   Borrowed wholesale from bloub (`src/bot/shape.ts`), whose whole premise is a silhouette in
   motion. The one change is the output: bloub emits an SVG `d` string, this strokes a canvas.

   **Pure, and no DOM** apart from `tracePath`, which only ever calls path methods on a context.
   `tests/silhouette.test.js` covers the rest.
   ═══════════════════════════════════════════════════════════ */

import { TAU, lerp } from '../core/math.js'

/** 64 is enough that a Catmull-Rom through them is smooth at the pixel on a 600px body. */
export const PROFILE_SAMPLES = 64

const ANGLES = Array.from({ length: PROFILE_SAMPLES }, (_, i) => (i / PROFILE_SAMPLES) * TAU)
const COS = ANGLES.map(Math.cos)
const SIN = ANGLES.map(Math.sin)

/* ── building profiles ─────────────────────────────────── */

export const circleProfile = (r = 1) => new Array(PROFILE_SAMPLES).fill(r)

/** Scales a profile so its widest point is `max`. Everything is normalised, so shapes weigh the same. */
export function normalise(radii, max = 1) {
  const peak = Math.max(...radii)
  if (!(peak > 0)) return radii
  const k = max / peak
  return radii.map((r) => r * k)
}

export const maxRadius = (radii) => Math.max(...radii)

/**
 * Scales a profile so its HALF-WIDTH — the mean of its two horizontal radii — is `w`.
 *
 * **Not `normalise`, and the difference is the whole reason bodies work.** Matching shapes on
 * their widest point sounds right and is wrong here: a Droplet's widest point is its spike, so
 * normalising on it shrinks the actual body to 0.53 of every other one, and the eye pair — which
 * is a fixed size and sits along the horizontal — then hangs out of both sides of it. Matching on
 * width means every body presents the same span to the eyes it has to hold, and is free to be as
 * tall, pointed or lopsided as it likes above and below them.
 *
 * The vertical consequence is handled elsewhere: `Body.frame` measures the true maximum, so a tall
 * body simply draws smaller in a circular frame rather than crossing it.
 */
export function fitWidth(radii, w = 1) {
  const across = (radii[0] + radii[PROFILE_SAMPLES / 2]) / 2
  if (!(across > 0)) return radii
  const k = w / across
  return radii.map((r) => r * k)
}

/**
 * A circle deformed by low harmonics: irregular, and still smooth everywhere. `terms` is a list of
 * `[frequency, amplitude, phase]`. Two or three low ones read as *grown*; anything above about 6
 * reads as a gear.
 */
export const harmonicProfile = (terms) =>
  ANGLES.map((a) => terms.reduce((r, [f, amp, ph]) => r + amp * Math.cos(f * a + ph), 1))

/** Superellipse `|x/sx|^n + |y/sy|^n = 1`. n = 2 is an ellipse, n ≈ 4 a squircle. */
export const superellipseProfile = (n, sx = 1, sy = 1) =>
  ANGLES.map((_, i) => (Math.abs(COS[i] / sx) ** n + Math.abs(SIN[i] / sy) ** n) ** (-1 / n))

/**
 * The radial profile of the UNION of discs: the furthest ray/circle intersection in each
 * direction. Exact as long as the origin is inside the union — and it is what gives a cloud its
 * lobes with no boolean path operation anywhere.
 */
export function unionOfCirclesProfile(circles) {
  const out = new Array(PROFILE_SAMPLES).fill(0)
  for (let i = 0; i < PROFILE_SAMPLES; i++) {
    const dx = COS[i]
    const dy = SIN[i]
    let best = 0
    for (const c of circles) {
      const b = dx * c.x + dy * c.y
      const disc = b * b - (c.x * c.x + c.y * c.y - c.r * c.r)
      if (disc < 0) continue
      const t = b + Math.sqrt(disc)
      if (t > best) best = t
    }
    out[i] = best
  }
  return out
}

/** The convex hull of two circles: a lozenge when they match, a teardrop when they do not. */
export function hullOfCircles(x1, y1, r1, x2, y2, r2, steps = 96) {
  const dx = x2 - x1
  const dy = y2 - y1
  const dist = Math.hypot(dx, dy) || 1e-6
  const base = Math.atan2(dy, dx)
  const spread = Math.acos(Math.max(-1, Math.min(1, (r1 - r2) / dist)))
  const pts = []
  for (let i = 0; i <= steps / 2; i++) {
    const a = base + spread + ((TAU - 2 * spread) * i) / (steps / 2)
    pts.push({ x: x1 + Math.cos(a) * r1, y: y1 + Math.sin(a) * r1 })
  }
  for (let i = 0; i <= steps / 2; i++) {
    const a = base - spread + (2 * spread * i) / (steps / 2)
    pts.push({ x: x2 + Math.cos(a) * r2, y: y2 + Math.sin(a) * r2 })
  }
  return pts
}

/**
 * Any polygon → a radial profile, by casting a ray from `(cx, cy)` at each of the 64 angles.
 * This is the escape hatch for a shape that does not want to be written as `r(θ)`. Run once at
 * load, never in a draw.
 */
export function profileFromPolygon(poly, cx = 0, cy = 0) {
  const radii = new Array(PROFILE_SAMPLES).fill(0)
  const n = poly.length
  for (let k = 0; k < PROFILE_SAMPLES; k++) {
    const dx = COS[k]
    const dy = SIN[k]
    let best = 0
    for (let i = 0; i < n; i++) {
      const a = poly[i]
      const b = poly[(i + 1) % n]
      const ex = b.x - a.x
      const ey = b.y - a.y
      const den = dx * ey - dy * ex
      if (Math.abs(den) < 1e-9) continue
      const px = a.x - cx
      const py = a.y - cy
      const t = (px * ey - py * ex) / den // distance along the ray
      const u = (px * dy - py * dx) / den // position along the edge
      if (t > best && u >= 0 && u <= 1) best = t
    }
    radii[k] = best
  }
  return radii
}

/**
 * A polygon with every corner filleted, by Minkowski sum with a disc: each edge is pushed out by
 * `rc` and each vertex becomes an arc of that radius. Vertices therefore go at the wanted radius
 * MINUS `rc`. Expects clockwise winding in screen space (y down).
 */
function roundedPolygon(verts, rc, arcSteps = 10) {
  const n = verts.length
  const out = []
  const normal = (a, b) => {
    const dx = b.x - a.x
    const dy = b.y - a.y
    const len = Math.hypot(dx, dy) || 1
    return Math.atan2(-dx / len, dy / len)
  }
  for (let i = 0; i < n; i++) {
    const prev = verts[(i - 1 + n) % n]
    const cur = verts[i]
    const next = verts[(i + 1) % n]
    const a0 = normal(prev, cur)
    const a1 = normal(cur, next)
    let d = a1 - a0
    while (d > Math.PI) d -= TAU
    while (d < -Math.PI) d += TAU
    for (let k = 0; k <= arcSteps; k++) {
      const a = a0 + (d * k) / arcSteps
      out.push({ x: cur.x + Math.cos(a) * rc, y: cur.y + Math.sin(a) * rc })
    }
  }
  return out
}

/** A regular polygon with soft corners, inscribed in `radius`. */
export function regularPolygonProfile(sides, radius, rc, rotationDeg = 0) {
  const rot = (rotationDeg * Math.PI) / 180
  const verts = Array.from({ length: sides }, (_, i) => {
    const a = rot + (i / sides) * TAU
    return { x: Math.cos(a) * (radius - rc), y: Math.sin(a) * (radius - rc) }
  })
  return profileFromPolygon(roundedPolygon(verts, rc))
}

/* ── reading and mixing them ───────────────────────────── */

/**
 * The radius in an arbitrary direction, interpolated between the two neighbouring samples.
 * What anything sitting ON the outline needs — bloub uses it to keep eyes from spilling out of a
 * non-circular body, and any future crest anchored to the edge will need exactly this.
 */
export function radiusAtAngle(radii, angle) {
  const n = radii.length
  const t = ((((angle / TAU) % 1) + 1) % 1) * n
  const i = Math.floor(t)
  return lerp(radii[i % n], radii[(i + 1) % n], t - i)
}

/** Mixes two profiles. `out` is reused — this is on the draw path and must not allocate. */
export function blendProfile(a, b, t, out = new Array(PROFILE_SAMPLES)) {
  for (let i = 0; i < PROFILE_SAMPLES; i++) out[i] = lerp(a[i], b[i], t)
  return out
}

/* ── drawing them ──────────────────────────────────────── */

/** Scratch, so tracing a silhouette at 60fps allocates nothing. */
const PTS = Array.from({ length: PROFILE_SAMPLES }, () => ({ x: 0, y: 0 }))

/**
 * Lays the profile onto a canvas as one closed path of cubic Béziers.
 *
 * Catmull-Rom with centred tangents at `tension = 1/6`: with 64 points that is smooth to the
 * pixel, and it is the reason a Cloud reads as an outline rather than as a 64-gon. Leaves the
 * path current, so the caller can `fill()` it, `clip()` to it, or both.
 */
export function tracePath(ctx, radii, scale, { rot = 0, cx = 0, cy = 0, tension = 1 / 6 } = {}) {
  const n = PROFILE_SAMPLES
  const cr = Math.cos(rot)
  const sr = Math.sin(rot)
  for (let i = 0; i < n; i++) {
    const r = radii[i]
    const x = r * COS[i]
    const y = r * SIN[i]
    PTS[i].x = (x * cr - y * sr + cx) * scale
    PTS[i].y = (x * sr + y * cr + cy) * scale
  }
  ctx.beginPath()
  ctx.moveTo(PTS[0].x, PTS[0].y)
  for (let i = 0; i < n; i++) {
    const p0 = PTS[(i - 1 + n) % n]
    const p1 = PTS[i]
    const p2 = PTS[(i + 1) % n]
    const p3 = PTS[(i + 2) % n]
    ctx.bezierCurveTo(
      p1.x + (p2.x - p0.x) * tension,
      p1.y + (p2.y - p0.y) * tension,
      p2.x - (p3.x - p1.x) * tension,
      p2.y - (p3.y - p1.y) * tension,
      p2.x,
      p2.y,
    )
  }
  ctx.closePath()
}

/* ── the shape catalogue ───────────────────────────────── */

/**
 * **Every silhouette in the project, by name.** The `body` gene names one of these, and so does a
 * Soulless theme — which is the whole reason they live here rather than inline in either. Pebble
 * is in the catalogue and *not* in the gene table: it is a Soulless body only, and nothing about
 * this file cares which of the two is asking.
 *
 * The geometry lives here and the *name* lives in `genome/genes.js`, for the same reason the shape
 * gene keeps its bezier handles in the table and `render/eye.js` interprets them: the genome layer
 * is pure, tested and imported by node, and it should not have to know what a Minkowski sum is.
 */
export const FORMS = {
  /** The plain one. A body, and nothing said about it. */
  circle: { kind: 'circle' },
  /** bloub's `nuage`: five discs, wide below and two lobes above. */
  cloud: {
    kind: 'union',
    circles: [{ x: -0.44, y: 0.2, r: 0.54 }, { x: 0.46, y: 0.2, r: 0.5 }, { x: 0.02, y: 0.3, r: 0.6 },
      { x: -0.24, y: -0.3, r: 0.48 }, { x: 0.3, y: -0.24, r: 0.44 }],
  },
  /** bloub's `galet`: a circle bent by two low harmonics, so it is irregular and still smooth. */
  pebble: { kind: 'harmonic', terms: [[2, 0.075, 0.5], [3, 0.035, 2.1]] },
  /** Wisp's resting shape. It is never actually drawn at rest — see `breatheProfile`. */
  wisp: { kind: 'harmonic', terms: [[2, 0.06, 0.3], [3, 0.04, 2.6]] },
}

/**
 * The profile a named form builds. `null` for anything unnamed — Bare, and every ordinary Oglet.
 *
 * Cached by name: a profile is 64 numbers that never change, and rebuilding one per creature would
 * be 64 ray casts a hatch for nothing.
 */
const CACHE = new Map()

export function profileOf(name) {
  if (!name) return null // Bare — the ordinary Oglet, and there is nothing to draw
  const hit = CACHE.get(name)
  if (hit) return hit
  const form = FORMS[name]
  if (!form) return null
  const built = fitWidth(build(form), form.width ?? 1)
  CACHE.set(name, built)
  return built
}

function build(form) {
  switch (form.kind) {
    case 'circle':
      return circleProfile(1)
    case 'harmonic':
      return harmonicProfile(form.terms)
    case 'super':
      return superellipseProfile(form.n, form.sx ?? 1, form.sy ?? 1)
    case 'union':
      return unionOfCirclesProfile(form.circles)
    case 'hull':
      return profileFromPolygon(hullOfCircles(...form.a, ...form.b), form.cx ?? 0, form.cy ?? 0)
    case 'poly':
      return regularPolygonProfile(form.sides, form.radius, form.rc, form.rot ?? 0)
    default:
      return circleProfile(1)
  }
}

/**
 * WISP — a God-line body: a silhouette that never holds the same shape twice.
 *
 * Two low harmonics running at different rates and in opposite directions, so the outline is
 * always somewhere it has not been. The frequencies are deliberately co-prime with each other and
 * with nothing else on the creature, which is what stops it reading as a pulse.
 *
 * This is the mutation that could not exist without the profile system, and it is why the body
 * gene is built on `r(θ)` rather than on a path per shape.
 */
export function breatheProfile(base, t, seed, out) {
  const p = (seed % 1000) / 159.15
  for (let i = 0; i < PROFILE_SAMPLES; i++) {
    const a = ANGLES[i]
    out[i] = base[i] * (1 + 0.075 * Math.sin(3 * a + t * 1.05 + p) + 0.045 * Math.sin(5 * a - t * 0.68 + p * 1.7))
  }
  return out
}
