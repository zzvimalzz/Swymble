/* Little live Oglets, for the Genome page and the landing portrait.

   They are the real renderer, not illustrations — the same Body class the world uses — which
   is why a thumbnail blinks, glances and idles. Two economies keep that affordable: they tick
   at 30fps rather than 60, and anything scrolled off-screen is skipped entirely. */

import { TAU, pick, rand } from '../core/math.js'
import { WELL } from '../core/theme.js'
import { Body } from '../render/body.js'
import { drawPupil } from '../render/eye.js'
import { createStageCanvas } from '../world/canvas.js'

/**
 * The scale that fits an Oglet inside a **circular** frame with room to spare.
 *
 * `Body.radius` is about 2.2 eye-radii across and 1.8 tall at full gaze, so the far corner of
 * its box sits ~2.8 radii from centre. At 0.155 of the canvas that corner lands at 43% of the
 * width — comfortably inside a frame whose rim is at 50% — so no matter where it looks, leans
 * or squashes, nothing ever crosses the circle.
 */
export const PORTRAIT_SCALE = 0.155

export class Thumb {
  /**
   * `expressive` lets it smile now and then. Catalogue cards leave it off on purpose: a raised
   * lower lid hides the bottom of the very silhouette the card exists to show.
   */
  constructor(genome, size, { scale = PORTRAIT_SCALE, dprCap = 2, expressive = false, palette } = {}) {
    const { canvas, ctx } = createStageCanvas(size, dprCap)
    this.canvas = canvas
    this.ctx = ctx
    this.size = size
    this.scale = scale
    this.expressive = expressive
    this.body = new Body(genome, { palette })
    this.next = rand(0, 4)
    this.phase = rand(0, 10) // so a grid of them does not blink in unison
  }

  /** True when it is worth spending a frame on. */
  get onScreen() {
    if (!this.canvas.isConnected) return false
    const r = this.canvas.getBoundingClientRect()
    return r.bottom > -40 && r.top < innerHeight + 40
  }

  /** Ambient idling. A catalogue Oglet has nothing to be sad about, so it never is. */
  idle(t) {
    const B = this.body
    if (t <= this.next) return
    this.next = t + rand(1.6, 4.2)
    const a = rand(0, TAU)
    const r = Math.pow(Math.random(), 0.5)
    B.S.tx = Math.cos(a) * r * 0.8
    B.S.ty = Math.sin(a) * r * 0.5
    B.glance(B.S.tx, B.S.ty)
    if (this.expressive && Math.random() < 0.3) {
      B.setExpr(pick(['happy', 'neutral', 'neutral']), rand(1.2, 2.4), t)
    }
    if (t > B.exprUntil) B.expr = 'neutral'
  }

  render(t) {
    const x = this.ctx
    const s = this.size
    x.clearRect(0, 0, s, s)
    x.fillStyle = WELL
    x.fillRect(0, 0, s, s)
    x.save()
    x.translate(s / 2, s / 2)
    this.body.draw(x, s * this.scale, t)
    x.restore()
  }

  tick(dt, t) {
    if (!this.onScreen) return
    const tt = t + this.phase
    this.idle(tt)
    this.body.update(dt, tt)
    this.render(tt)
  }
}

/**
 * A pupil on its own, with no eye around it.
 *
 * A pupil card is about the pupil, and wrapping it in an eye shape makes the reader compare the
 * wrong thing. So this draws the pupil alone, at the size it would be inside a big eye, still
 * drifting on the same gaze the rest of the site uses.
 */
export class PupilThumb extends Thumb {
  render(t) {
    const x = this.ctx
    const s = this.size
    const B = this.body
    const R = s * 0.42 // the imaginary eye this pupil belongs to
    x.clearRect(0, 0, s, s)
    x.fillStyle = WELL
    x.fillRect(0, 0, s, s)
    x.save()
    x.translate(s / 2, s / 2)
    const c = B.cols(t)
    const px = B.S.gx * B.pup.travel * R * 0.42
    const py = B.S.gy * B.pup.travel * R * 0.32
    drawPupil(x, B.pup, B.g.pupilSize * 1.9, R, R, px, py, c, t)
    x.restore()
  }
}

/** Drives a set of thumbs at 30fps. Returns a ticker for `addTicker`. */
export function thumbTicker(list, isActive) {
  let acc = 0
  return (dt, t) => {
    if (!isActive()) return
    acc += dt
    if (acc < 1 / 30) return
    const step = acc
    acc = 0
    for (const thumb of list) thumb.tick(step, t)
  }
}
