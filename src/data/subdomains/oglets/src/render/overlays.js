/* ═══════════════════════════════════════════════════════════
   OVERLAYS — what a God-line eye colour draws *on top of* its own iris.

   Called from inside `Body.drawEye`, after the eyeball is filled and before the pupil goes down,
   while the eye's own path is still clipping. That is why none of these has to worry about the
   silhouette: a vein cannot run off the edge of an eye it is drawn inside.

   Every one takes the Oglet's own `seed`, so two Oglets with the same mutation still do not look
   the same — the pattern is theirs, and it is the same on every device they are ever opened on.
   ═══════════════════════════════════════════════════════════ */

import { TAU } from '../core/math.js'

/** Cheap deterministic hash → 0…1. Same input, same star, every time. */
const rnd = (i) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

/**
 * VEINS — a bloodshot eye, and never the same one twice.
 *
 * Count, angle, length, thickness, bend and fork all come out of the Oglet's own seed, so this
 * is a fingerprint rather than a texture. They crawl in from the rim toward the pupil, never
 * quite reach it, and pulse very slightly, the way a tired eye does when you look closely.
 */
function veins(ctx, rx, ry, t, m, seed) {
  const s = (seed >>> 0) + (m < 0 ? 0 : 7919)
  const count = 7 + Math.floor(rnd(s) * 6) // 7…12, and it is *their* number
  ctx.save()
  ctx.lineCap = 'round'

  for (let i = 0; i < count; i++) {
    const k = s + i * 31
    const a = rnd(k) * TAU
    const pulse = 0.7 + 0.3 * Math.sin(t * (1.1 + rnd(k + 3) * 1.4) + i)
    const reach = 0.35 + rnd(k + 7) * 0.5
    const x0 = Math.cos(a) * rx * 1.05
    const y0 = Math.sin(a) * ry * 1.05
    const x1 = Math.cos(a) * rx * (1 - reach)
    const y1 = Math.sin(a) * ry * (1 - reach)
    const bend = (rnd(k + 11) - 0.5) * 0.7

    ctx.strokeStyle = `rgb(196 34 34 / ${(0.34 + rnd(k + 17) * 0.22) * pulse})`
    ctx.lineWidth = ry * (0.032 + rnd(k + 19) * 0.04)
    ctx.beginPath()
    ctx.moveTo(x0, y0)
    ctx.quadraticCurveTo((x0 + x1) / 2 - y0 * bend, (y0 + y1) / 2 + x0 * bend, x1, y1)
    ctx.stroke()

    if (rnd(k + 23) < 0.7) {
      // a fork, on most of them, at a point of its own along the vein
      const at = 0.35 + rnd(k + 29) * 0.4
      const fx = x0 + (x1 - x0) * at
      const fy = y0 + (y1 - y0) * at
      const away = (rnd(k + 37) - 0.5) * 0.5
      ctx.lineWidth *= 0.55
      ctx.beginPath()
      ctx.moveTo(fx, fy)
      ctx.quadraticCurveTo(fx + y0 * away, fy - x0 * away, x1 * 0.72 + y0 * away, y1 * 0.72 - x0 * away)
      ctx.stroke()
    }
  }
  ctx.restore()
}

/**
 * COSMOS — the eye is a window rather than a surface.
 *
 * Three layers of stars over a still nebula: the far field barely moves, the near field crosses
 * quickly, and the parallax between them is what turns a flat sprinkle into depth. The
 * background does not move at all — that is the whole trick.
 */
const LAYERS = [
  { count: 26, speed: 0.012, size: 0.022, bright: 0.45 },
  { count: 14, speed: 0.038, size: 0.036, bright: 0.72 },
  { count: 7, speed: 0.085, size: 0.055, bright: 1.0 },
]

function cosmos(ctx, rx, ry, t, m, seed) {
  const s = (seed >>> 0) + (m < 0 ? 0 : 4409)
  ctx.save()

  // the still ground — deep space, and it stays exactly where it is
  const wash = ctx.createLinearGradient(-rx, -ry, rx, ry)
  wash.addColorStop(0, 'rgb(88 44 160 / .55)')
  wash.addColorStop(0.5, 'rgb(20 22 60 / .15)')
  wash.addColorStop(1, 'rgb(180 60 140 / .38)')
  ctx.fillStyle = wash
  ctx.fillRect(-rx * 1.4, -ry * 1.4, rx * 2.8, ry * 2.8)

  LAYERS.forEach((layer, depth) => {
    for (let i = 0; i < layer.count; i++) {
      const k = s + depth * 613 + i * 41
      // wrap across twice the eye's width so a star leaving one side re-enters the other
      const u = (rnd(k) + t * layer.speed) % 1
      const x = u * 2.4 * rx - 1.2 * rx
      const y = (rnd(k + 5) * 2 - 1) * ry * 1.1
      const twinkle = 0.4 + 0.6 * Math.abs(Math.sin(t * (0.6 + rnd(k + 9) * 2) + i))
      const size = ry * layer.size * (0.7 + rnd(k + 13) * 0.6)
      ctx.fillStyle = `rgb(255 253 244 / ${(layer.bright * twinkle).toFixed(3)})`
      ctx.beginPath()
      ctx.ellipse(x, y, size, size, 0, 0, TAU)
      ctx.fill()
    }
  })
  ctx.restore()
}

/**
 * LIGHTNING — a low grey sky behind the eye, and every so often the whole thing goes white.
 *
 * The storm is on a fixed cycle so the flash is an *event* rather than a shimmer: nothing at all
 * for a few seconds, then two hard frames of white and a bolt, then dark again. Which strike it
 * is (`Math.floor`) seeds the bolt, so no two are the same and none of them is random.
 */
function lightning(ctx, rx, ry, t, m, seed) {
  const s = (seed >>> 0) + (m < 0 ? 0 : 2749)
  ctx.save()

  // cloud banks: three soft bands drifting very slowly, darker toward the bottom
  for (let i = 0; i < 3; i++) {
    const y = (-0.5 + i * 0.45) * ry + Math.sin(t * 0.11 + i) * ry * 0.06
    const band = ctx.createLinearGradient(0, y - ry * 0.4, 0, y + ry * 0.4)
    band.addColorStop(0, 'rgb(12 14 20 / 0)')
    band.addColorStop(0.5, `rgb(12 14 20 / ${0.2 + i * 0.12})`)
    band.addColorStop(1, 'rgb(12 14 20 / 0)')
    ctx.fillStyle = band
    ctx.fillRect(-rx * 1.4, y - ry * 0.4, rx * 2.8, ry * 0.8)
  }

  const CYCLE = 3.4
  const strike = Math.floor(t / CYCLE + rnd(s) * 10)
  const phase = (t / CYCLE + rnd(s) * 10) % 1

  /* Real lightning strobes: a hard first flash, a gap, then a weaker return stroke. A single
     fade-in-fade-out reads as a lamp on a dimmer, which is the opposite of the point. */
  const flash =
    phase < 0.035 ? 1 - phase / 0.035
    : phase < 0.06 ? 0
    : phase < 0.1 ? 0.55 * (1 - (phase - 0.06) / 0.04)
    : 0

  if (flash > 0.02) {
    ctx.fillStyle = `rgb(226 236 255 / ${(flash * 0.5).toFixed(3)})`
    ctx.fillRect(-rx * 1.4, -ry * 1.4, rx * 2.8, ry * 2.8)

    const k = s + strike * 977
    const bolts = 2 + Math.floor(rnd(k) * 2) // two or three at once, never just the one
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    for (let b = 0; b < bolts; b++) {
      const j = k + b * 313
      const steps = 7 + Math.floor(rnd(j) * 4)
      const startX = (rnd(j + 1) * 1.8 - 0.9) * rx
      const drift = (rnd(j + 2) - 0.5) * 0.9

      // walk it down, remembering every joint so a fork can start from one of them
      const pts = [[startX, -ry * 1.15]]
      for (let i = 1; i <= steps; i++) {
        const px = pts[i - 1][0] + (rnd(j + i * 7) - 0.5) * rx * 0.55 + (drift * rx) / steps
        pts.push([px, -ry * 1.15 + (i / steps) * ry * 2.3])
      }

      const glow = `rgb(150 190 255 / ${(0.3 * flash).toFixed(3)})`
      const core = `rgb(255 255 255 / ${(0.5 + flash * 0.5).toFixed(3)})`
      // a wide soft pass under a thin bright one — a bolt is a hot line inside a halo
      for (const [width, colour] of [[ry * 0.16, glow], [ry * 0.05 * (1 - b * 0.25), core]]) {
        ctx.strokeStyle = colour
        ctx.lineWidth = width
        ctx.beginPath()
        ctx.moveTo(pts[0][0], pts[0][1])
        for (const p of pts.slice(1)) ctx.lineTo(p[0], p[1])
        ctx.stroke()
      }

      // one or two forks per bolt, peeling off a joint and dying out short of the ground
      const forks = Math.floor(rnd(j + 40) * 2) + 1
      ctx.strokeStyle = core
      ctx.lineWidth = ry * 0.03
      for (let f = 0; f < forks; f++) {
        const at = 1 + Math.floor(rnd(j + 50 + f) * (steps - 2))
        const [fx, fy] = pts[at]
        const away = (rnd(j + 70 + f) - 0.5) * rx * 1.1
        ctx.beginPath()
        ctx.moveTo(fx, fy)
        ctx.lineTo(fx + away * 0.5, fy + ry * 0.3)
        ctx.lineTo(fx + away, fy + ry * 0.72)
        ctx.stroke()
      }
    }
  }
  ctx.restore()
}

export const OVERLAYS = { veins, cosmos, lightning }
