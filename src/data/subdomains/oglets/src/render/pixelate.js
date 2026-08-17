/* ═══════════════════════════════════════════════════════════
   THE GOD LINE — renderings, not shapes.

   An ordinary mutation changes what an Oglet *is*. A God-line one changes how it is drawn, so
   it cannot be mistaken for anything else in the catalogue however good the rest of your roll
   was. This is the first: **Pixel**.

   The creature is drawn once into a tiny offscreen canvas — twenty-two pixels across, the whole
   thing — and blown back up with smoothing off. That is all it is, and that is the point: the
   chunk is the mutation. It used to carry a red-and-blue channel fringe as well, which read as
   a broken screen rather than a creature made of pixels; the fringe now belongs to **Glitch**,
   where being broken is the idea (see `render/glitch.js`).

   Because it wraps the whole draw, the pupil and the colours go through it too.
   ═══════════════════════════════════════════════════════════ */

/**
 * How many fat pixels across the creature's whole box. Lower is chunkier.
 *
 * **36, not 22.** The grid is fixed while the creature is not: on a 104px catalogue card 22 cells
 * read as a deliberate low-resolution rendering, and in the world — where an Oglet is three times
 * that — the same 22 cells become fourteen-pixel blocks and the face stops resolving into a face
 * at all. A pupil two blocks wide cannot look anywhere. At 36 the chunk is still unmistakably the
 * mutation and the creature underneath it is legible at every size it is drawn.
 */
const GRID = 36
/** How far past the eye radius the box reaches; must clear the widest gaze. */
const SPAN = 6.4

/* One scratch canvas, shared by every Pixel Oglet on the page. */
const scratch = { size: 0, base: null }

function ensure(n) {
  if (scratch.size === n) return
  const canvas = scratch.base ?? document.createElement('canvas')
  canvas.width = canvas.height = n
  scratch.base = canvas
  scratch.size = n
}

/**
 * @param {CanvasRenderingContext2D} ctx already translated to the creature's centre
 * @param {number} R the eye radius, in the same units as ctx
 * @param {(c: CanvasRenderingContext2D) => void} paint draws the creature around the origin
 */
export function drawPixelated(ctx, R, paint) {
  const span = R * SPAN
  const n = GRID
  ensure(n)

  const base = scratch.base.getContext('2d')
  base.setTransform(1, 0, 0, 1, 0, 0)
  base.clearRect(0, 0, n, n)
  const scale = n / span
  base.setTransform(scale, 0, 0, scale, n / 2, n / 2)
  paint(base)

  ctx.save()
  ctx.imageSmoothingEnabled = false
  ctx.drawImage(scratch.base, -span / 2, -span / 2, span, span)
  ctx.restore()
}
