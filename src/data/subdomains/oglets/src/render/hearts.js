/* ═══════════════════════════════════════════════════════════
   HEARTS — the channel that carries `petted`.

   Third of its kind, after `thoughts.js` and `tears.js`, and for the same reason each time: the
   lids are one channel and every expression has to share them. `petted` already spends nearly
   all of it — lids down from both sides onto a belled lower lid — so there is nothing left to
   say *why* with, and without these it reads as a creature going to sleep.

   Two of them, rising on staggered loops from either side of the head, drifting apart as they
   go and beating slightly as they rise. Phased off the Oglet's own seed like everything else
   here, so the same Oglet is always fond of you in the same rhythm.

   **They are drawn in the eye's own colour**, unlike tears — a tear is water and belongs to
   nobody, but affection is the creature's, and taking its colour is what makes it read as
   something coming *out of* it rather than a sticker over it.
   ═══════════════════════════════════════════════════════════ */

const HEARTS = 2
const RISE = 2.8

/** A heart, as two lobes over a point. Cheap, and the only cute shape on the site. */
function heartPath(ctx, r) {
  ctx.beginPath()
  ctx.moveTo(0, r * 0.98)
  ctx.bezierCurveTo(-r * 1.32, r * 0.06, -r * 0.72, -r * 1.06, 0, -r * 0.34)
  ctx.bezierCurveTo(r * 0.72, -r * 1.06, r * 1.32, r * 0.06, 0, r * 0.98)
  ctx.closePath()
}

/**
 * @param {CanvasRenderingContext2D} ctx origin at the body centre
 * @param {number} R the body radius in pixels
 * @param {number} t seconds
 * @param {number} seed the Oglet's own seed
 * @param {number} amount 0…1 ramp, from `Body.love`
 * @param {number} edge how far out the creature actually reaches, in pixels — see `drawThoughts`
 * @param {string} colour taken from the eye, so the fondness belongs to the creature
 */
export function drawHearts(ctx, R, t, seed, amount, colour, edge = R) {
  if (amount <= 0.01) return

  ctx.save()
  ctx.fillStyle = colour

  for (let i = 0; i < HEARTS; i++) {
    const side = i % 2 ? 1 : -1
    const bits = ((seed >> (i * 6 + 3)) & 31) / 31
    const phase = ((t / RISE + i / HEARTS + bits) % 1 + 1) % 1

    /* Full through the middle of its life and thin at both ends, so nothing ever appears or
       disappears on a hard edge — the same fade the thought marks use. */
    const fade = Math.sin(phase * Math.PI) ** 0.75
    if (fade <= 0.02) continue

    // a beat: it swells a little twice on the way up, which is the whole reason it is a heart
    const beat = 1 + Math.sin(phase * 12 + i) * 0.09
    const size = R * (0.3 + bits * 0.1) * (0.72 + phase * 0.5) * beat
    const x = side * edge * (0.72 + phase * 0.5) + Math.sin(phase * 3.1 + i * 2) * edge * 0.1
    const y = -edge * (1.02 + phase * 0.7)

    ctx.globalAlpha = amount * fade * 0.82
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(side * 0.18 + Math.sin(phase * 2.4 + i) * 0.12)
    heartPath(ctx, size)
    ctx.fill()
    ctx.restore()
  }

  ctx.restore()
}
