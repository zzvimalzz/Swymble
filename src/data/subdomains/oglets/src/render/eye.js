/* ═══════════════════════════════════════════════════════════
   EYE GEOMETRY — pure path building. No state, no genome lookups, no canvas settings beyond
   the path itself, so `Body` can compose these in any order and the Genome page's cards reuse
   exactly the same shapes as the world.

   An eye shape picks ONE of five path modes, and the mode is whichever field it sets:

     poly   a rounded polygon, with a radius per corner   (Pixel, Capsule, Arch, Wedge, Kite…)
     — none —  four beziers through top/right/bottom/left  (Round, Egg, Bean, Dome, Bell,
               Pick, Kidney)

   The bezier mode is the expressive one and the others are the graphic ones. Reach for a bezier
   first: it is the only mode that reads as *grown* rather than *drawn*.
   ═══════════════════════════════════════════════════════════ */

import { TAU } from '../core/math.js'

/** Half the angle between the two eyes on the imaginary head sphere. */
export const PHI = 0.42
/** How far a gaze of ±1 turns the head, in radians. */
export const YAW = 0.5
export const PITCH = 0.34

/**
 * Places one eye on a sphere and returns its projected normal. `m` is -1 or +1 — the side.
 * This is what makes an Oglet turn rather than slide: the far eye genuinely foreshortens.
 */
export function eyeXform(m, yaw, pitch) {
  const ca = Math.cos(yaw)
  const sa = Math.sin(yaw)
  const n0x = m * Math.sin(PHI)
  const n0z = Math.cos(PHI)
  const nx = n0x * ca + n0z * sa
  let nz = -n0x * sa + n0z * ca
  const cb = Math.cos(pitch)
  const sb = Math.sin(pitch)
  const ny = nz * sb
  nz = nz * cb
  return {
    nx,
    ny,
    nz,
    fx: Math.sqrt(Math.max(0, 1 - nx * nx)),
    fy: Math.sqrt(Math.max(0, 1 - ny * ny)),
  }
}

/**
 * The eyeball outline.
 *
 * `m` mirrors the shape between the two eyes, so an asymmetric one (Kidney, Crescent) always
 * turns its notch inward. `top` is the extra height the perspective turn asks for.
 */
export function eyePath(ctx, shape, rx, ry, m, top, t = 0) {
  if (shape.god === 'flames') return flamePath(ctx, rx, ry, m, t)
  if (shape.poly) return polyPath(ctx, shape, rx, ry, m, top)

  const side = ry * (shape.side ?? 0)
  // `notch` pulls the inner anchor in toward the middle — a bite on the side facing the other
  // eye. Bowing the two inner edges instead would push this anchor OUT, which is a snout.
  const inner = rx * (1 - (shape.notch ?? 0))
  // `base` lifts the bottom anchor. Above the side anchors it becomes a scoop, and the two
  // low corners turn into the widest points — that is the whole trick behind Bell.
  const A = { x: 0, y: -ry * (1 + top) }
  const B = { x: rx * m, y: side }
  const C = { x: 0, y: ry * (shape.base ?? 1) }
  const D = { x: -inner * m, y: side }
  const kT = shape.kT + top * 0.2
  const kI = shape.kI + top * 0.2
  ctx.beginPath()
  ctx.moveTo(A.x, A.y)
  ctx.bezierCurveTo(A.x + (B.x - A.x) * kT, A.y, B.x, B.y + (A.y - B.y) * kT, B.x, B.y)
  ctx.bezierCurveTo(B.x, B.y + (C.y - B.y) * shape.kO, B.x + (C.x - B.x) * shape.kO, C.y, C.x, C.y)
  ctx.bezierCurveTo(C.x + (D.x - C.x) * shape.kB, C.y, D.x, D.y + (C.y - D.y) * shape.kB, D.x, D.y)
  ctx.bezierCurveTo(D.x, D.y + (A.y - D.y) * kI, D.x + (A.x - D.x) * kI, A.y, A.x, A.y)
  ctx.closePath()
}

/**
 * A polygon with a radius on every corner, given in unit space (−1…1) and scaled by rx/ry.
 * `round` is one number or one per corner — per-corner is what makes an Arch: two corners fully
 * rounded into a semicircle and two left square.
 */
/**
 * FLAMES — a God-line shape, and the only outline here that is not the same twice.
 *
 * A polar outline sampled every few degrees: `reach` stretches it upward, `taper` narrows it
 * toward the tip, and three sine waves at different speeds do the flickering. The two eyes are
 * phase-shifted by `m` so they never burn in step, which is most of why it reads as fire rather
 * than as a wobbling blob.
 */
function flamePath(ctx, rx, ry, m, t) {
  const N = 120
  const sway = Math.sin(t * 1.9 + m * 1.7) * 0.14
  ctx.beginPath()
  for (let i = 0; i <= N; i++) {
    const a = -Math.PI / 2 + (i / N) * TAU
    const up = Math.max(0, -Math.sin(a)) // 1 straight up, 0 at the sides and below
    const lean = Math.cos(a) // −1 inner side … +1 outer side

    /* Three tongues, not one. `main` is the tall centre one; `licks` puts two shorter ones
       either side of it and runs them up and down at their own rate, which is what stops the
       whole thing reading as a single wobbling leaf. */
    const main = 0.85 * up ** 1.7
    const licks = 0.62 * up ** 1.05 * Math.max(0, Math.sin(lean * 7.5 + t * 4.5 + m * 2))
    const curl = 0.22 * up ** 2 * Math.sin(t * 9 + lean * 6 + m) // the tips whip over
    const reach = 1 + main + licks

    // fire is fat at the bottom and pinched at the top, and only the top may move
    const taper = 1 - 0.66 * up ** 1.15
    const wob = up * up
    const flick =
      1 +
      wob * (0.16 * Math.sin(a * 4 + t * 9 + m) + 0.1 * Math.sin(a * 9 - t * 14 + m * 2))

    const x = Math.cos(a) * rx * taper * flick + (sway + curl) * rx * up
    const y = Math.sin(a) * ry * reach * flick
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.closePath()
}

function polyPath(ctx, shape, rx, ry, m, top) {
  const scale = Math.min(rx, ry)
  const pts = shape.poly.map(([x, y]) => [x * rx * m, (y < 0 ? y * (1 + top) : y) * ry])
  const radii = shape.poly.map(
    (_, i) => (Array.isArray(shape.round) ? shape.round[i] : (shape.round ?? 0.2)) * scale,
  )
  ctx.beginPath()
  roundedPoly(ctx, pts, radii)
}

/**
 * A closed polygon with a fillet on every corner, drawn with arcTo — which rounds a reflex
 * corner as happily as a convex one, so a plus sign comes out soft on all twelve of them.
 * Each radius is clamped to half its shorter edge so a fillet can never eat its own side.
 */
export function roundedPoly(ctx, pts, radii) {
  const n = pts.length
  const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]
  const len = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1])

  const start = mid(pts[n - 1], pts[0])
  ctx.moveTo(start[0], start[1])
  for (let i = 0; i < n; i++) {
    const prev = pts[(i - 1 + n) % n]
    const cur = pts[i]
    const next = pts[(i + 1) % n]
    const to = mid(cur, next)
    const r = Math.max(0, Math.min(radii[i], len(prev, cur) / 2, len(cur, next) / 2))
    ctx.arcTo(cur[0], cur[1], to[0], to[1], r)
    ctx.lineTo(to[0], to[1])
  }
  ctx.closePath()
}

/** True when a shape closes by shrinking rather than by having a lid drawn across it. */
export const squashes = (shape) => shape.lids === 'squash'

/**
 * A lid, as a clipping region. `a` and `bv` are its inner and outer heights — the gap between
 * those two numbers is the whole expression system, so they are deliberately independent.
 * The path runs far past the eye on both sides so it can be used as a clip without seams.
 */
export function lidPath(ctx, rx, ry, m, a, bv, upper) {
  const xi = -2.4 * rx * m
  const xo = 2.4 * rx * m
  const sg = upper ? 1 : -1
  const base = upper ? -ry * 1.25 : ry * 1.25
  const yi = base + sg * a * (2.5 * ry)
  const yo = base + sg * bv * (2.5 * ry)
  const cy = (yi + yo) / 2 + (upper ? ry * 0.1 * Math.max(a, bv) : -ry * 0.9 * Math.max(a, bv))
  ctx.beginPath()
  ctx.moveTo(xi * 40, yi)
  ctx.lineTo(xi, yi)
  ctx.quadraticCurveTo(0, cy, xo, yo)
  ctx.lineTo(xo * 40, yo)
  ctx.lineTo(xo * 40, sg * ry * 80)
  ctx.lineTo(xi * 40, sg * ry * 80)
  ctx.closePath()
}

/* ═══════════════════════════════════════════════════════════
   PUPILS. Each one is a filled path in the pupil colour, sometimes with a second pass in the
   iris colour on top — that is how Ring and Target get their holes without any compositing.
   `size` is the pupilSize gene; `rx`/`ry` are the eye's, so every pupil scales with its eye.
   ═══════════════════════════════════════════════════════════ */

function starShape(ctx, px, py, r, inner) {
  const outer = [
    [px, py - r],
    [px + r, py],
    [px, py + r],
    [px - r, py],
  ]
  const waist = [
    [px + r * inner, py - r * inner],
    [px + r * inner, py + r * inner],
    [px - r * inner, py + r * inner],
    [px - r * inner, py - r * inner],
  ]
  ctx.moveTo(outer[0][0], outer[0][1])
  for (let i = 0; i < 4; i++) {
    ctx.quadraticCurveTo(waist[i][0], waist[i][1], outer[(i + 1) % 4][0], outer[(i + 1) % 4][1])
  }
  ctx.closePath()
}

function heartShape(ctx, px, py, r) {
  ctx.moveTo(px, py + r * 0.92)
  ctx.bezierCurveTo(px - r * 1.5, py - r * 0.18, px - r * 0.6, py - r * 1.25, px, py - r * 0.38)
  ctx.bezierCurveTo(px + r * 0.6, py - r * 1.25, px + r * 1.5, py - r * 0.18, px, py + r * 0.92)
  ctx.closePath()
}

/**
 * HYPNOTIC — a God-line pupil: a two-armed spiral that never stops turning.
 *
 * Two things make it read as *hypnotic* rather than as a drawing of a spiral. The arms come in
 * pairs, so the negative space between them is a spiral too; and the radius is offset by the
 * clock and wrapped, so the whole pattern appears to pour inward forever while the rotation
 * carries it round. One rotating arm is a pinwheel; this is a drain.
 */
function drawSpiral(ctx, px, py, r, colour, t) {
  const turns = 3
  const arms = 2
  const reach = r * 1.3

  /* The arms have to be thinner than the gap between successive passes, or the spiral fills in
     and becomes a disc. Spacing is reach / (turns × arms); the width is deliberately just under
     it, so arm and gap are near-equal and the negative space spirals too. */
  ctx.save()
  ctx.translate(px, py)
  ctx.rotate(t * 2.2)
  ctx.strokeStyle = colour
  ctx.lineWidth = (reach / (turns * arms)) * 0.78
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  for (let arm = 0; arm < arms; arm++) {
    ctx.beginPath()
    for (let i = 0; i <= 180; i++) {
      const u = i / 180
      const a = u * TAU * turns + (arm * TAU) / arms
      const x = Math.cos(a) * reach * u
      const y = Math.sin(a) * reach * u
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.stroke()
  }
  ctx.restore()
}

/**
 * ECLIPSE — a God-line pupil: a black disc with a corona around it, turning very slowly. The
 * corona is a ring with one bright arc riding round it, so the light is never even and the
 * turning is something you can see rather than something you are told.
 */
function drawEclipse(ctx, px, py, r, colors, t) {
  const R = r * 1.5
  ctx.save()
  ctx.translate(px, py)

  /* The corona is atmosphere, not a ring of paint. It used to be one gradient with a fully
     opaque stop in it, which read as a solid orange donut with a hole punched in it — so it is
     now three faint passes that overlap: a wide haze, a brighter inner rim, and streamers. */
  ctx.globalCompositeOperation = 'lighter'

  const haze = ctx.createRadialGradient(0, 0, R * 0.6, 0, 0, R * 1.5)
  haze.addColorStop(0, 'rgb(0 0 0 / 0)')
  haze.addColorStop(0.22, colors.p)
  haze.addColorStop(1, 'rgb(0 0 0 / 0)')
  ctx.globalAlpha = 0.2
  ctx.fillStyle = haze
  ctx.fillRect(-R * 1.6, -R * 1.6, R * 3.2, R * 3.2)

  const rim = ctx.createRadialGradient(0, 0, R * 0.7, 0, 0, R * 0.98)
  rim.addColorStop(0, 'rgb(0 0 0 / 0)')
  rim.addColorStop(0.45, colors.p)
  rim.addColorStop(1, 'rgb(0 0 0 / 0)')
  ctx.globalAlpha = 0.34
  ctx.fillStyle = rim
  ctx.fillRect(-R * 1.1, -R * 1.1, R * 2.2, R * 2.2)

  /* Streamers: short arcs at uneven angles, drifting round and breathing at their own rates.
     An even ring reads as a drawn shape; an uneven one reads as something burning. */
  ctx.strokeStyle = colors.p
  ctx.lineCap = 'round'
  for (let i = 0; i < 5; i++) {
    const at = t * (0.16 + i * 0.035) + i * 1.32
    const span = 0.5 + Math.sin(t * 0.7 + i * 2.4) * 0.22
    ctx.globalAlpha = 0.12 + Math.sin(t * 1.1 + i * 1.7) * 0.06
    ctx.lineWidth = R * (0.09 + i * 0.012)
    ctx.beginPath()
    ctx.arc(0, 0, R * (0.84 + i * 0.06), at, at + span)
    ctx.stroke()
  }

  ctx.globalCompositeOperation = 'source-over'
  ctx.globalAlpha = 1
  ctx.fillStyle = '#08080b'
  ctx.beginPath()
  ctx.ellipse(0, 0, R * 0.72, R * 0.72, 0, 0, TAU)
  ctx.fill()
  ctx.restore()
}

export function drawPupil(ctx, pupil, size, rx, ry, px, py, colors, t = 0) {
  const r = rx * size

  if (pupil.god === 'hypno') {
    drawSpiral(ctx, px, py, r, colors.p, t)
    return
  }
  if (pupil.god === 'eclipse') {
    drawEclipse(ctx, px, py, r, colors, t)
    return
  }

  ctx.fillStyle = colors.p
  ctx.beginPath()

  switch (pupil.id) {
    case 'oval':
      ctx.ellipse(px, py, rx * 0.46, ry * 0.8, 0, 0, TAU)
      break
    case 'slit':
      ctx.ellipse(px, py, rx * 0.15, ry * 0.62, 0, 0, TAU)
      break
    case 'bar':
      ctx.ellipse(px, py, rx * 0.62, ry * 0.14, 0, 0, TAU)
      break
    case 'square':
      ctx.rect(px - r, py - r, r * 2, r * 2)
      break
    case 'rhomb':
      ctx.moveTo(px, py - r * 1.35)
      ctx.lineTo(px + r * 1.0, py)
      ctx.lineTo(px, py + r * 1.35)
      ctx.lineTo(px - r * 1.0, py)
      ctx.closePath()
      break
    case 'cross': {
      // twelve corners, every one filleted — a plus made of two rectangles has eight hard
      // notches in it and reads as a graphic rather than as part of a creature
      const a = r * 0.46
      const b = r * 1.5
      const pts = [
        [px - a, py - b], [px + a, py - b], [px + a, py - a], [px + b, py - a],
        [px + b, py + a], [px + a, py + a], [px + a, py + b], [px - a, py + b],
        [px - a, py + a], [px - b, py + a], [px - b, py - a], [px - a, py - a],
      ]
      roundedPoly(ctx, pts, pts.map(() => a * 0.62))
      break
    }
    case 'keyhole': {
      ctx.ellipse(px, py - r * 0.25, r, r, 0, 0, TAU)
      ctx.moveTo(px - r * 0.42, py - r * 0.1)
      ctx.lineTo(px + r * 0.42, py - r * 0.1)
      ctx.lineTo(px + r * 0.62, py + r * 1.35)
      ctx.lineTo(px - r * 0.62, py + r * 1.35)
      ctx.closePath()
      break
    }
    case 'spark':
      starShape(ctx, px, py, r * 1.55, 0.34)
      break
    case 'heart':
      heartShape(ctx, px, py, r * 1.2)
      break
    case 'ring':
    case 'target':
      ctx.ellipse(px, py, r * 1.35, r * 1.35, 0, 0, TAU)
      break
    default: // dot
      ctx.ellipse(px, py, r, r, 0, 0, TAU)
  }
  ctx.fill()

  // the holes: drawn in the iris colour rather than punched out, which keeps this one pass
  if (pupil.id === 'ring') {
    ctx.fillStyle = colors.e
    ctx.beginPath()
    ctx.ellipse(px, py, r * 0.58, r * 0.58, 0, 0, TAU)
    ctx.fill()
  } else if (pupil.id === 'target') {
    ctx.fillStyle = colors.e
    ctx.beginPath()
    ctx.ellipse(px, py, r * 0.92, r * 0.92, 0, 0, TAU)
    ctx.fill()
    ctx.fillStyle = colors.p
    ctx.beginPath()
    ctx.ellipse(px, py, r * 0.5, r * 0.5, 0, 0, TAU)
    ctx.fill()
  }
}

/**
 * SPHERE — a lighting pass, not a silhouette.
 *
 * Drawn last, over the finished eye and its pupil, inside the eye's own clip: a shadow gathering
 * at the bottom-right, a broad highlight at the top-left, and a thin rim light on the far edge.
 * Three gradients and the disc stops being a disc.
 */
export function drawSphereShading(ctx, rx, ry) {
  const r = Math.max(rx, ry)
  const lx = -rx * 0.38
  const ly = -ry * 0.42
  ctx.save()

  /* 1 — the body shadow, falling away from the light. Steep at the far edge and slow through
     the middle: a linear falloff reads as a disc with a gradient on it, not as a ball. */
  const shade = ctx.createRadialGradient(lx, ly, r * 0.05, lx * 0.2, ly * 0.2, r * 1.85)
  shade.addColorStop(0, 'rgb(0 0 0 / 0)')
  shade.addColorStop(0.4, 'rgb(0 0 0 / .1)')
  shade.addColorStop(0.72, 'rgb(0 0 0 / .46)')
  shade.addColorStop(1, 'rgb(0 0 0 / .86)')
  ctx.fillStyle = shade
  ctx.fillRect(-rx * 2, -ry * 2, rx * 4, ry * 4)

  /* 2 — occlusion: the whole rim darkens, which is what stops the lit side looking like a
     sticker laid on top. */
  const edge = ctx.createRadialGradient(0, 0, r * 0.6, 0, 0, r)
  edge.addColorStop(0, 'rgb(0 0 0 / 0)')
  edge.addColorStop(1, 'rgb(0 0 0 / .5)')
  ctx.fillStyle = edge
  ctx.fillRect(-rx * 2, -ry * 2, rx * 4, ry * 4)

  /* 3 — bounce. A dim fill from the shadow side, so the dark half has depth in it rather than
     being flat black. Real spheres are never lit from one direction only. */
  const bounce = ctx.createRadialGradient(rx * 0.55, ry * 0.6, 0, rx * 0.55, ry * 0.6, r * 1.1)
  bounce.addColorStop(0, 'rgb(160 190 255 / .2)')
  bounce.addColorStop(1, 'rgb(160 190 255 / 0)')
  ctx.fillStyle = bounce
  ctx.fillRect(-rx * 2, -ry * 2, rx * 4, ry * 4)

  /* 4 — the broad sheen, and 5 — a tight specular inside it. Two highlights, because one is a
     smudge and two is a wet surface. */
  const sheen = ctx.createRadialGradient(lx, ly, 0, lx, ly, r * 0.95)
  sheen.addColorStop(0, 'rgb(255 255 255 / .42)')
  sheen.addColorStop(0.5, 'rgb(255 255 255 / .08)')
  sheen.addColorStop(1, 'rgb(255 255 255 / 0)')
  ctx.fillStyle = sheen
  ctx.fillRect(-rx * 2, -ry * 2, rx * 4, ry * 4)

  const hot = ctx.createRadialGradient(lx, ly, 0, lx, ly, r * 0.3)
  hot.addColorStop(0, 'rgb(255 255 255 / .9)')
  hot.addColorStop(1, 'rgb(255 255 255 / 0)')
  ctx.fillStyle = hot
  ctx.fillRect(-rx * 2, -ry * 2, rx * 4, ry * 4)

  /* 6 — the rim light wrapping the far edge, which is the single strongest "there is a behind
     to this" cue there is. Kept soft: a hard terminator on a radial-shaded ball looks wrong. */
  ctx.strokeStyle = 'rgb(226 236 255 / .34)'
  ctx.lineWidth = r * 0.085
  ctx.beginPath()
  ctx.ellipse(0, 0, rx * 0.955, ry * 0.955, 0, Math.PI * 0.06, Math.PI * 0.92)
  ctx.stroke()
  ctx.restore()
}

/** The closed eye: one soft arc, drawn in the iris colour instead of an eyeball. */
export function drawClosedArc(ctx, rx, ry, color) {
  ctx.strokeStyle = color
  ctx.lineWidth = ry * 0.2
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(-rx * 0.78, ry * 0.1)
  ctx.quadraticCurveTo(0, ry * 0.1 + ry * 0.44, rx * 0.78, ry * 0.1)
  ctx.stroke()
}
