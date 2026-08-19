/* Canvas plumbing: device-pixel scaling, and keeping `view` honest about the CSS size.

   The device-pixel ratio is capped at 2.5 — past that you are paying for pixels nobody can
   see, on exactly the phones least able to afford them. */

import { view } from './stage.js'

export function createWorldCanvas(canvas) {
  const ctx = canvas.getContext('2d')

  function resize() {
    const dp = Math.min(devicePixelRatio || 1, 2.5)
    const rect = canvas.getBoundingClientRect()
    view.w = rect.width || innerWidth
    view.h = rect.height || innerHeight
    canvas.width = view.w * dp
    canvas.height = view.h * dp
    ctx.setTransform(dp, 0, 0, dp, 0, 0)
  }

  addEventListener('resize', resize)
  resize()
  return { ctx, resize }
}

/**
 * A small offscreen-ish canvas for a thumbnail or a portrait. Same scaling rules.
 *
 * **`size` is the drawing size, not a promise about the layout.** Everything drawn into one of
 * these is laid out against `size` — `ui/thumbs.js#PORTRAIT_SCALE` puts the creature's far corner
 * at 43% of it — so `size` has to be the CSS width too, or the drawing is the wrong scale for its
 * box. It is set inline for that reason, and inline beats a stylesheet.
 *
 * Which is exactly the trap: a stage whose CSS box is *smaller* than `size` cannot shrink the
 * canvas back, and every one of these sits in a round `.orb` with `overflow:hidden`. The Gallery's
 * card is `min(118px, 100%)` and falls to about 91px on a phone, against a 132px canvas — so the
 * creature was drawn a third too big for its frame and the rim cut the body off. The same went for
 * the opened card at ≤420px (184px box, 208px canvas) and the hatch (`max-width:86vw`).
 *
 * `max-width` plus `aspect-ratio` is the fix, and it belongs here rather than in each stylesheet:
 * it is inline, so it beats nothing and loses to nothing, and a canvas that is *not* squeezed keeps
 * exactly the size it had. **The height has to come from the ratio, not from `max-height`** — a
 * percentage height resolves against the parent's own height, and a stage sized by `aspect-ratio`
 * has none to give, so `max-height:100%` is simply dropped and the canvas comes out 91 × 132.
 */
export function createStageCanvas(size, dprCap = 2) {
  const canvas = document.createElement('canvas')
  const dp = Math.min(devicePixelRatio || 1, dprCap)
  canvas.width = size * dp
  canvas.height = size * dp
  canvas.style.width = `${size}px`
  canvas.style.maxWidth = '100%'
  canvas.style.height = 'auto'
  canvas.style.aspectRatio = '1'
  const ctx = canvas.getContext('2d')
  ctx.setTransform(dp, 0, 0, dp, 0, 0)
  return { canvas, ctx }
}
