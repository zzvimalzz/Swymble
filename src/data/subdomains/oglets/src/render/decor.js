/* ═══════════════════════════════════════════════════════════
   DECOR — the rings, the ribbons and the particles. Ported from bloub's `src/bot/decor.ts`.

   **Every number here is measured, not chosen.** bloub's constants come from a reference video cut
   at 10fps and its README is explicit that rounding them to friendlier values is what breaks the
   effect. Three of them are counter-intuitive enough to be worth knowing before correcting
   anything: the orbit planes are seen nearly edge-on (`k ≤ 0.45`), the burst particles spiral
   *inward* and are swallowed rather than flying away, and **the comet's dot does not move** — it
   stays put and the trail orbits it.

   ── the one idea worth the whole file ──
   An arc is a **3D circle in orthographic projection**, and `strokeArc` draws only the half of it
   on one side of z = 0. The back half is stroked before the creature and the front half after, so
   the creature occludes the middle of every ring. That depth sort is the entire difference between
   an orbit and a drawing of an orbit, and it is also why these are allowed to exist at all:
   `.docs/OGLETS.md` §2 records that the `glow` gene was built and deleted because an effect drawn behind
   the creature reads as scenery it is standing in front of. A ring that passes *through* is not
   behind anything.
   ═══════════════════════════════════════════════════════════ */

import { hsl } from '../core/color.js'
import { TAU, clamp } from '../core/math.js'

/** bloub's PRNG, verbatim, so the seeds below land on its measured values and not near them. */
function createRng(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * The colour wheel the arcs run on: a full circle of hues at constant lightness, measured at
 * S 45–62% and L 50–67%. Not flat colours — every arc carries a gradient along its own length,
 * which is what stops six rings reading as six coloured wires.
 */
const wheel = (hue) => hsl(hue, 0.55, 0.62)

/* ── an arc ─────────────────────────────────────────────────
   Geometry is in **eye-radius units**, like everything else a `Body` draws, and the caller passes
   the scale. `a` is the semi-major axis, `k` the flattening (b/a), `tilt` the on-screen angle of
   the major axis, `sweep` the fraction of a turn actually drawn. */

/**
 * Strokes the half of one arc on the given side of the creature. `side` −1 draws what is behind,
 * +1 what is in front; call it twice with the body drawn in between.
 *
 * The arc lives in the plane spanned by u = (cos tilt, sin tilt, 0) and v = (−sin tilt·k,
 * cos tilt·k, kz). Only `z`'s sign is used, and only to decide which pass a point belongs to.
 */
export function strokeArc(ctx, seed, t, scale, opacity, side, grow = 1) {
  if (opacity <= 0.012) return
  const spin = seed.phase + t * seed.speed * TAU
  const cu = Math.cos(seed.tilt)
  const su = Math.sin(seed.tilt)
  const kz = Math.sqrt(Math.max(0, 1 - seed.k * seed.k))
  const span = seed.sweep * TAU
  const N = 44
  // `grow` expands the whole plane without touching its shape, so a beat can open outward. The
  // stroke width is left alone on purpose: a ring that thickens as it grows reads as zooming in.
  const A = seed.a * grow

  const gx = cu * A * scale
  const gy = su * A * scale
  const grad = ctx.createLinearGradient(
    seed.cx * scale - gx, seed.cy * scale - gy,
    seed.cx * scale + gx, seed.cy * scale + gy,
  )
  grad.addColorStop(0, wheel(seed.hue))
  grad.addColorStop(0.5, wheel(seed.hue + seed.hueSpan * 0.5))
  grad.addColorStop(1, wheel(seed.hue + seed.hueSpan))

  ctx.save()
  ctx.globalAlpha = opacity
  ctx.strokeStyle = grad
  ctx.lineWidth = seed.width * scale
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.beginPath()
  let pen = false
  for (let i = 0; i <= N; i++) {
    const th = spin + (i / N) * span
    const ct = Math.cos(th)
    const st = Math.sin(th)
    // `st * kz` is z up to a positive factor, and only its sign is wanted
    if ((st * kz < 0 ? -1 : 1) !== side) {
      pen = false // the arc left this side; the next point on it starts a new subpath
      continue
    }
    const x = (A * (ct * cu - st * su * seed.k) + seed.cx) * scale
    const y = (A * (ct * su + st * cu * seed.k) + seed.cy) * scale
    if (pen) ctx.lineTo(x, y)
    else {
      ctx.moveTo(x, y)
      pen = true
    }
  }
  ctx.stroke()
  ctx.restore()
}

/* ── clearance ──────────────────────────────────────────────
   **The one place this departs from bloub, deliberately and for a reason worth writing down.**

   bloub's orbit planes are seen nearly edge-on — flattening `k ≤ 0.45`, measured off the video —
   and its comet ribbons are flatter still at 0.176. It gets away with that because in every state
   that carries an arc, **its body has collapsed to a dot**: the burst shrinks the ball to 0.166 and
   the comet to 0.129, so an ellipse passing close to the centre passes through empty space.

   Ours does not collapse. An Oglet keeps its size and its face through all three, so an edge-on
   ellipse does not orbit it — it cuts across it, through the eyes, once a turn. There is no tuning
   that fixes that: an ellipse whose minor axis is small necessarily passes near its own centre.

   So every arc here is given a **minimum projected minor radius**: whatever the seed asks for,
   `k` is raised until `a · k` clears `MIN_CLEAR`. The planes come out tilted rather than edge-on,
   which reads as a swirl around the creature instead of a blade through it — and the depth split
   survives intact, because `kz = √(1 − k²)` is still well clear of zero at k = 0.9.
   ═══════════════════════════════════════════════════════ */

/** In frame units — the caller scales by the creature's own extent, so 1.14 is 14% outside it. */
const MIN_CLEAR = 1.14

/** The flattening a plane actually gets: what it asked for, or enough to clear the creature. */
const clearing = (a, k) => Math.min(0.97, Math.max(k, MIN_CLEAR / a))

/* ── the orbit rings ────────────────────────────────────── */

const RING_RNG = createRng(0xa11ce)

/**
 * Six rings, semi-major 1.30–1.45 of the creature's own extent — **larger than it**, which is what
 * makes them read as orbits around it rather than as a pattern on it. ~3.3 turns a second, and
 * each one sweeps only 0.6–0.85 of its circle so the bouquet never closes into a solid halo.
 */
export const RINGS = Array.from({ length: 6 }, (_, i) => {
  const a = 1.3 + RING_RNG() * 0.15
  return {
    a,
    k: clearing(a, 0.62 + RING_RNG() * 0.33),
    tilt: (i / 6) * Math.PI + RING_RNG() * 0.5,
    speed: 3 + RING_RNG() * 0.7,
    phase: RING_RNG() * TAU,
    sweep: 0.6 + RING_RNG() * 0.25,
    hue: (i * 360) / 6 + RING_RNG() * 30,
    hueSpan: 60 + RING_RNG() * 60,
    width: 0.05 + RING_RNG() * 0.012,
    cx: 0,
    cy: 0.06,
  }
})

/* ── the comet's trail ──────────────────────────────────── */

const COMET_RNG = createRng(0xc0e7)

/**
 * Four ribbons in a tight beam: a = 0.85, b = 0.15, major axis at +34°, ~210°/s, and phases only
 * 10–20° apart so they read as one trail with depth rather than as four separate arcs.
 *
 * **The dot stays put and the trail orbits it.** bloub's README lists this among the things that
 * are counter-intuitive and correct, and it is why this works on a creature being thrown across a
 * canvas: a trail that follows the path draws the path, and the path of a thrown Oglet is a mess.
 * An orbit is legible at any velocity.
 */
export const COMET_RIBBONS = Array.from({ length: 4 }, (_, i) => {
  const d = i - 1.5
  const a = 1.5 * (1 + d * 0.04)
  return {
    a,
    // bloub's 0.176 is far inside the creature here — see the clearance note above. What survives
    // the raise is the *beam*: four planes within a few degrees of each other, so they still read
    // as one trail with thickness rather than as four separate rings.
    k: clearing(a, 0.66 * (1 + d * 0.05)),
    tilt: (34 * Math.PI) / 180 + d * 0.035,
    speed: 210 / 360,
    phase: -i * 0.045 + COMET_RNG() * 0.012,
    sweep: 0.34,
    hue: i * 85 + COMET_RNG() * 20,
    hueSpan: 80,
    width: 0.085,
    cx: 0,
    cy: 0,
  }
})

/* ── the burst particles ────────────────────────────────── */

const P_RNG = createRng(0xbeef)

/**
 * Five, born 0.2s apart, each living 0.62s, and each starting **outside the creature** — the same
 * clearance rule the arcs get, for the same reason. bloub spawns them at 0.58–0.76 of a ball that
 * has already collapsed; ours spawn at 1.0–1.3 of a creature that is still collapsing.
 */
const PARTICLES = Array.from({ length: 5 }, (_, i) => ({
  birth: i * 0.2,
  angle: P_RNG() * TAU,
  rho: 1 + P_RNG() * 0.3,
}))

/**
 * Where the particles are at `u` seconds into a burst.
 *
 * They do **not** fly outward. They spiral *in* — radius × 0.75 every tenth of a second, angle
 * +100°/s — growing as they go, and are swallowed by the core. An explosion that throws pieces
 * away is an explosion; this is a thing coming apart and putting itself back together, which is
 * what makes it survivable rather than alarming.
 *
 * `depth` is 0 far out and 1 at the centre; the caller fades them into the background by it, so
 * the ones still outside read as further away.
 */
export function particles(u) {
  const out = []
  for (const p of PARTICLES) {
    const v = u - p.birth
    if (v < 0 || v > 0.62) continue
    const rho = p.rho * Math.pow(0.78, v * 10)
    const a = p.angle + (v * 100 * Math.PI) / 180
    out.push({
      x: Math.cos(a) * rho,
      y: Math.sin(a) * rho,
      r: 0.05 + 0.03 * clamp(v / 0.55, 0, 1),
      depth: clamp(1 - rho / 1.3, 0, 1),
      opacity: clamp(v / 0.06, 0, 1) * clamp((0.62 - v) / 0.08, 0, 1),
    })
  }
  return out
}

/** Paints a set of particles. `colour` is the creature's, so its pieces are its own. */
export function drawDots(ctx, dots, scale, colour) {
  if (!dots?.length) return
  ctx.save()
  ctx.fillStyle = colour
  for (const d of dots) {
    // fading with depth rather than mixing toward the background: on a field this dark the two
    // look the same, and one of them does not need a colour-space round trip per particle
    ctx.globalAlpha = d.opacity * (0.3 + 0.7 * d.depth)
    ctx.beginPath()
    ctx.ellipse(d.x * scale, d.y * scale, d.r * scale, d.r * scale, 0, 0, TAU)
    ctx.fill()
  }
  ctx.restore()
}
