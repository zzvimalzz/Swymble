/* ═══════════════════════════════════════════════════════════
   GLITCH — a God-line rendering: the creature, but the signal carrying it is failing.

   Same trick as Pixel — draw the whole creature once into an offscreen canvas and composite it
   back — but here it comes back in horizontal bands, each one shoved sideways, with the colour
   channels pulling apart at the edges. That fringe used to live on Pixel, where it read as a
   broken screen rather than a creature made of pixels. Here being broken *is* the mutation.

   **It has to stutter, not shimmer.** Real corruption holds a wrong frame for a beat and then
   snaps back; a per-frame random offset just looks like static, and static has no character. So
   the whole thing is quantised to a `STEP`-per-second clock and hashed off that tick, which
   means a band holds its displacement for a few frames and every Oglet with this mutation
   breaks in its own way, forever, from its own seed.
   ═══════════════════════════════════════════════════════════ */

/** How far past the eye radius the offscreen box reaches; must clear the widest gaze. */
const SPAN = 6.4
/** Resolution of the offscreen copy. High enough that the creature itself stays clean. */
const RES = 320
/** Corruption ticks per second. Low enough to read as a hold, not a flicker. */
const STEP = 11

const CYAN = '#38f2ff'
const MAGENTA = '#ff2ea8'

const scratch = { size: 0, base: null, tint: null }

function ensure(n) {
  if (scratch.size === n) return
  for (const key of ['base', 'tint']) {
    const canvas = scratch[key] ?? document.createElement('canvas')
    canvas.width = canvas.height = n
    scratch[key] = canvas
  }
  scratch.size = n
}

/** Deterministic 0…1 from a pile of integers. Same tick + same seed = same corruption. */
function rnd(a, b, c) {
  let h = (a * 374761393 + b * 668265263 + c * 2246822519) >>> 0
  h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}

/** A flat-tinted copy of the base image, alpha kept. */
function tinted(colour) {
  const ctx = scratch.tint.getContext('2d')
  const n = scratch.size
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.globalCompositeOperation = 'source-over'
  ctx.clearRect(0, 0, n, n)
  ctx.drawImage(scratch.base, 0, 0)
  ctx.globalCompositeOperation = 'source-in'
  ctx.fillStyle = colour
  ctx.fillRect(0, 0, n, n)
  ctx.globalCompositeOperation = 'source-over'
  return scratch.tint
}

/**
 * @param {CanvasRenderingContext2D} ctx already translated to the creature's centre
 * @param {number} R the eye radius, in the same units as ctx
 * @param {number} t seconds
 * @param {number} seed the Oglet's own seed — its corruption is its own
 * @param {(c: CanvasRenderingContext2D) => void} paint draws the creature around the origin
 */
export function drawGlitched(ctx, R, t, seed, paint) {
  const span = R * SPAN
  const n = RES
  ensure(n)

  const base = scratch.base.getContext('2d')
  base.setTransform(1, 0, 0, 1, 0, 0)
  base.clearRect(0, 0, n, n)
  const scale = n / span
  base.setTransform(scale, 0, 0, scale, n / 2, n / 2)
  paint(base)

  const tick = Math.floor(t * STEP)
  /* Most ticks are quiet. A burst is worth having precisely because the frames around it are
     not — a creature that is broken all the time is just a texture. */
  const burst = rnd(seed, tick, 7) < 0.45
  const bands = burst ? 5 + Math.floor(rnd(seed, tick, 11) * 4) : 3
  const x0 = -span / 2
  const y0 = -span / 2

  /* Everything is done **per band**, never to the whole image. A full-frame channel split drawn
     under a torn creature does not fringe it, it replaces it: the clean pixels land somewhere
     else and all you see is cyan and magenta. Fringing the band and then covering it with that
     same band keeps the creature its own colour and leaves the split at the tear. */
  const cyan = burst ? tinted(CYAN) : null
  const magenta = burst ? tinted(MAGENTA) : null

  ctx.save()
  let cut = 0
  for (let i = 0; i < bands; i++) {
    const remaining = bands - i
    const h = i === bands - 1 ? n - cut : Math.max(1, Math.round(((n - cut) / remaining) * (0.6 + rnd(seed, tick, i) * 0.8)))
    const height = Math.min(h, n - cut)
    if (height <= 0) break

    /* Even a quiet tick tears a little. A God-line mutation that is invisible two frames out of
       three is not a mutation anyone can see they have. */
    const loud = burst && rnd(seed, tick, 100 + i) < 0.62
    const nudge = (rnd(seed, tick, 200 + i) - 0.5) * span
    const shift = loud ? nudge * 0.2 : nudge * 0.03
    const dy = y0 + (cut / n) * span
    const dh = (height / n) * span

    if (loud) {
      const pull = span * (0.014 + rnd(seed, tick, 13 + i) * 0.022)
      ctx.globalCompositeOperation = 'lighter'
      ctx.globalAlpha = 0.5
      ctx.drawImage(cyan, 0, cut, n, height, x0 + shift - pull, dy, span, dh)
      ctx.drawImage(magenta, 0, cut, n, height, x0 + shift + pull, dy, span, dh)
      ctx.globalAlpha = 1
      ctx.globalCompositeOperation = 'source-over'
    }

    ctx.drawImage(scratch.base, 0, cut, n, height, x0 + shift, dy, span, dh)

    /* A band that blows out: the same band drawn over itself additively, so only the creature's
       own pixels brighten. Filling a rectangle here would paint a grey box across the frame —
       the band is the width of the whole box, and the creature is only in the middle of it. */
    if (loud && rnd(seed, tick, 300 + i) < 0.3) {
      ctx.globalCompositeOperation = 'lighter'
      ctx.globalAlpha = 0.3 + rnd(seed, tick, 400 + i) * 0.35
      ctx.drawImage(scratch.base, 0, cut, n, height, x0 + shift, dy, span, dh)
      ctx.globalAlpha = 1
      ctx.globalCompositeOperation = 'source-over'
    }
    cut += height
  }

  ctx.restore()
}
