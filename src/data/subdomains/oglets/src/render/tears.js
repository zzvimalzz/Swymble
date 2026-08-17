/* ═══════════════════════════════════════════════════════════
   TEARS — the channel that carries `crying`.

   Sad already owns the lids, and it owns them about as hard as a lid can be owned. Making
   crying *sadder* would mean spending lid heights that sad has already spent, and the two would
   stop being tellable apart — the same trap `content` fell into before it became `focus`. So
   crying takes almost nothing from the face and says itself out here instead, the way `thinking`
   says itself with question marks (`render/thoughts.js`).

   A drop wells on the lower lid, swells, then falls under something like gravity, stretching as
   it goes and thinning out before it lands anywhere. Two per eye on staggered loops, phased off
   the Oglet's own seed, so the pair never drips in lockstep and the same Oglet always cries the
   same way.

   **Tears are blue, not the eye's colour.** Water takes its colour from the light, not from what
   it is running out of — a tear made of a God-line iris would be a moving gradient falling
   through the dark, which reads as a special effect rather than as crying. Pearl was the first
   try and it read as a bead of light; on a field this dark the only thing that says *wet* is a
   colour, and blue is the one everybody already reads as water.
   ═══════════════════════════════════════════════════════════ */

import { TEAR, TEAR_GLINT } from '../core/theme.js'

/** Per eye. Two is a cry; one is a leak, and three is a joke. */
const DROPS = 2
/** Seconds for one drop, from nothing to gone. */
const CYCLE = 2.4
/** The share of that spent gathering on the lid before it lets go. */
const WELL = 0.28
/** How far below the lid a drop gets, in eye radii, before it thins out. */
const FALL = 2.3

/** A drop: pointed at the top, round at the bottom, which is the way a falling one sits. */
function dropPath(ctx, r) {
  ctx.beginPath()
  ctx.moveTo(0, -r * 2)
  ctx.bezierCurveTo(r * 0.92, -r * 0.72, r, r * 0.28, 0, r)
  ctx.bezierCurveTo(-r, r * 0.28, -r * 0.92, -r * 0.72, 0, -r * 2)
  ctx.closePath()
}

/**
 * @param {CanvasRenderingContext2D} ctx origin at the body centre
 * @param {number} R the body radius in pixels
 * @param {number} t seconds
 * @param {number} seed the Oglet's own seed, so its tears are its own
 * @param {number} amount 0…1 ramp, from `Body.cry`
 * @param {{m: number, x: number, y: number, ry: number}[]} eyes centre and half-height per eye
 */
export function drawTears(ctx, R, t, seed, amount, eyes) {
  if (amount <= 0.01) return

  ctx.save()

  for (const eye of eyes) {
    /* Off the outer corner, which is where a tear actually leaves an eye — and, on this
       creature, the only edge that is not facing its own twin. The offset is a share of the
       eye's half-*width*: Slab is 1.24 wide and 0.76 tall, so measuring it in half-heights would
       start the drop somewhere in the middle of the eye. */
    const x0 = eye.x + eye.rx * 0.58 * eye.m
    const y0 = eye.y + eye.ry * 0.82

    for (let i = 0; i < DROPS; i++) {
      const bits = (seed >> (i * 6 + (eye.m > 0 ? 11 : 0))) & 63
      const phase = ((t / CYCLE + i / DROPS + bits / 63) % 1 + 1) % 1

      let x = x0
      let y = y0
      let r = R * 0.13
      let stretch = 1
      let alpha

      if (phase < WELL) {
        // gathering: it swells on the lid and does not move
        const q = phase / WELL
        r *= 0.45 + q * 0.55
        alpha = q
      } else {
        // falling: distance goes with the square of the time, the way a dropped thing does
        const q = (phase - WELL) / (1 - WELL)
        y += FALL * R * q * q
        x += eye.m * R * 0.1 * q + Math.sin(q * 4.1 + bits) * R * 0.04
        stretch = 1 + q * 0.55
        r *= 1 - q * 0.18
        // gone before it lands on anything: there is no floor in this world to land on
        alpha = Math.min(1, (1 - q) / 0.34)
      }

      if (alpha <= 0.02) continue
      ctx.save()
      ctx.translate(x, y)
      ctx.scale(1 / stretch ** 0.4, stretch)

      ctx.globalAlpha = amount * alpha * 0.78
      ctx.fillStyle = TEAR
      dropPath(ctx, r)
      ctx.fill()

      /* The glint. A flat blob reads as a bead; one bright spot high on it reads as something
         with water's depth, and it costs one ellipse. */
      ctx.globalAlpha = amount * alpha * 0.95
      ctx.fillStyle = TEAR_GLINT
      ctx.beginPath()
      ctx.ellipse(-r * 0.3, -r * 0.34, r * 0.27, r * 0.34, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    }
  }

  ctx.globalAlpha = 1
  ctx.restore()
}
