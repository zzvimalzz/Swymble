/* ═══════════════════════════════════════════════════════════
   THOUGHTS — the question marks that drift up while it is thinking.

   An Oglet has no mouth, no hands and no speech bubble, so a thought has to be *shown*. Three
   marks rise from above its head on staggered loops, each one swaying as it goes and fading out
   before it reaches the top of its own arc. Nothing here is random per frame: every mark is a
   function of the Oglet's seed and the clock, so it is the same thought every time it has it.

   `amount` is the ramp from `Body.think` — the marks fade in when the thinking face arrives and
   fade out under it, rather than popping the instant the expression changes.
   ═══════════════════════════════════════════════════════════ */

const MARKS = 3
const RISE = 3.4 // seconds for one mark to travel its whole arc

/**
 * @param {CanvasRenderingContext2D} ctx origin at the body centre
 * @param {number} R the body radius in pixels
 * @param {number} t seconds
 * @param {number} seed the Oglet's own seed, so its thoughts are its own
 * @param {number} edge how far out the creature actually reaches, in pixels. Marks are placed
 *   against THIS and sized against `R`: on a bodied Oglet the silhouette is three times the eye
 *   radius, and a thought placed in eye radii is a thought drawn inside the body.
 * @param {number} amount 0…1 ramp
 * @param {string} colour taken from the eye, so the thought belongs to the creature
 */
export function drawThoughts(ctx, R, t, seed, amount, colour, edge = R) {
  if (amount <= 0.01) return

  ctx.save()
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = colour

  for (let i = 0; i < MARKS; i++) {
    /* Staggered so they never leave together, and offset by the seed so two Oglets side by side
       are not thinking in lockstep. */
    const phase = ((t / RISE + i / MARKS + ((seed >> (i * 5)) & 31) / 31) % 1 + 1) % 1

    /* Out fast, gone slow: the mark is fully there for the middle of its life and thins at both
       ends, so nothing ever appears or vanishes on a hard edge. */
    const fade = Math.sin(phase * Math.PI) ** 0.8
    if (fade <= 0.02) continue

    const size = R * (0.5 + i * 0.1) * (0.74 + phase * 0.44)
    const sway = Math.sin(phase * 5.2 + i * 2.1) * edge * 0.16
    const x = edge * (0.42 + i * 0.22) + sway
    const y = -edge * (1.04 + phase * 0.66)

    ctx.globalAlpha = amount * fade * 0.85
    ctx.font = `700 ${size.toFixed(2)}px ui-rounded, "Nunito", system-ui, sans-serif`
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(Math.sin(phase * 3.1 + i) * 0.22)
    ctx.fillText('?', 0, 0)
    ctx.restore()
  }

  ctx.restore()
}
