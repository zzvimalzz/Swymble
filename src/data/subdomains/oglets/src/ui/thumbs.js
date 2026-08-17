/* Little live Oglets, for the Genome page and the landing portrait.

   They are the real renderer, not illustrations — the same Body class the world uses — which
   is why a thumbnail blinks, glances and idles. Two economies keep that affordable: they tick
   at 30fps rather than 60, and anything scrolled off-screen is skipped entirely. */

import { TAU, pick, rand } from '../core/math.js'
import { WELL } from '../core/theme.js'
import { BARE_FRAME, Body } from '../render/body.js'
import { drawEgg, drawShards, shellFor } from '../render/egg.js'
import { drawPupil } from '../render/eye.js'
import { createStageCanvas } from '../world/canvas.js'
import { flashAt, flashCovers } from './hatch-beats.js'

/**
 * The scale that fits an Oglet inside a **circular** frame with room to spare.
 *
 * `Body.radius` is about 2.2 eye-radii across and 1.8 tall at full gaze, so the far corner of
 * its box sits ~2.8 radii from centre. At 0.155 of the canvas that corner lands at 43% of the
 * width — comfortably inside a frame whose rim is at 50% — so no matter where it looks, leans
 * or squashes, nothing ever crosses the circle.
 */
export const PORTRAIT_SCALE = 0.155

/**
 * The same frame, whatever is standing in it.
 *
 * `PORTRAIT_SCALE` was derived against a creature 2.8 eye-radii to its far corner, which is every
 * Oglet that has no body — 98.5% of them. One with a body is over three, so it would cross the rim
 * of its circle. Dividing by the creature's own static `frame` fits the rare ones and leaves the
 * common ones **bit-identical**, which matters: nothing already on the site should move because a
 * gene was added that it does not carry.
 */
export const fitScale = (body, base = PORTRAIT_SCALE) => (base * BARE_FRAME) / body.frame

export class Thumb {
  /**
   * `expressive` lets it smile now and then. Catalogue cards leave it off on purpose: a raised
   * lower lid hides the bottom of the very silhouette the card exists to show.
   */
  constructor(genome, size, { scale = PORTRAIT_SCALE, dprCap = 2, expressive = false, palette, theme } = {}) {
    const { canvas, ctx } = createStageCanvas(size, dprCap)
    this.canvas = canvas
    this.ctx = ctx
    this.size = size
    this.base = scale
    this.expressive = expressive
    this.theme = theme ?? null
    this.body = new Body(genome, { palette, theme })
    this.scale = fitScale(this.body, scale)
    this.next = rand(0, 4)
    this.phase = rand(0, 10) // so a grid of them does not blink in unison
  }

  /**
   * Point an existing Thumb at a different creature, keeping its canvas.
   *
   * `#/gallery` walks 186,592 combinations through a pool of about fifty of these, so a scroll
   * must not allocate a canvas per card — that is megabytes a second and a garbage collector
   * pause you can feel. Rebuilding the `Body` is only field setup and one hash.
   */
  retarget(genome, palette, theme = null) {
    const old = this.body
    // the theme is re-set rather than kept: `#/gallery` walks past the Soulless at the very end of
    // the wall, so one pooled card has to be able to become one and stop being one again
    this.theme = theme
    this.body = new Body(genome, { palette, theme })
    // the new creature may be a bodied one, and a card that swaps to one has to re-fit its frame
    this.scale = fitScale(this.body, this.base)
    /* **Carry the motion across.** A fresh Body starts with its gaze centred, its springs at rest
       and its blink timer reset, so a card that swapped creature mid-scroll visibly *snapped* —
       fifty of them doing it at once made the whole wall twitch every time it moved. The state
       that belongs to the animation rather than to the genome is handed over, so the new creature
       picks up looking wherever the old one was looking and keeps going. */
    this.body.S = old.S
    this.body.sp = old.sp
    this.body.blk = old.blk
    this.body.sac = old.sac
    this.body.think = old.think
    this.body.cry = old.cry
    this.body.giddy = old.giddy
    this.body.love = old.love
    return this
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

/**
 * An egg instead of a creature — one per tier, for the row on the Genome page.
 *
 * It rocks very slightly and its cracks glow on the clock, because a still egg beside six other
 * still eggs is a swatch. It is not a `Thumb` subclass: there is no Body, no gaze and no
 * expression here, and inheriting all three to ignore them would be worse than the small amount
 * of duplication below.
 */
export class EggThumb {
  /**
   * `loop` runs the cracks 0…6 over `LOOP` seconds and starts again, which is what the Genome
   * page's row wants: seven shells all failing, forever, so the row reads as *what an egg does*
   * rather than as seven swatches. A fixed `cracks` is for a contact sheet, where the whole point
   * is that each cell is one nameable frame.
   */
  constructor({ tier, seed, cracks = 2, open = 0, loop = false }, size, dprCap = 2) {
    const { canvas, ctx } = createStageCanvas(size, dprCap)
    this.canvas = canvas
    this.ctx = ctx
    this.size = size
    this.tier = tier
    this.seed = seed
    this.cracks = cracks
    this.open = open
    this.loop = loop
    // staggered, so a row of them is not seven eggs splitting in unison
    this.phase = rand(0, 10)
  }

  /** Seconds for one pass of the looping crack. */
  static LOOP = 8.5

  get onScreen() {
    if (!this.canvas.isConnected) return false
    const r = this.canvas.getBoundingClientRect()
    return r.bottom > -40 && r.top < innerHeight + 40
  }

  tick(dt, t) {
    if (!this.onScreen) return
    const tt = t + this.phase
    const x = this.ctx
    const s = this.size
    x.clearRect(0, 0, s, s)
    x.fillStyle = WELL
    x.fillRect(0, 0, s, s)
    x.save()
    x.translate(s / 2, s / 2)

    let cracks = this.cracks
    let rock = 1
    if (this.loop) {
      /* Cracks step on a beat rather than easing in — a crack that grows smoothly is a progress
         bar, one that appears the frame after the shell jerks is something hitting it from
         inside. The last fifth of the pass holds at six, then it starts over. */
      const p = (tt % EggThumb.LOOP) / EggThumb.LOOP
      cracks = Math.min(6, Math.floor(p / 0.8 * 7))
      rock = 0.35 + (cracks / 6) * 0.9
    }

    // a broken egg has stopped rocking; only an intact one is still being worked at from inside
    if (this.open < 0.5) x.rotate(Math.sin(tt * (1 + rock)) * 0.03 * rock * (1 - this.open * 2))
    drawEgg(x, s * 0.29, tt, { tier: this.tier, seed: this.seed, cracks, open: this.open })
    if (this.open >= 1) drawShards(x, s * 0.29, this.seed, 0.55, this.tier)
    x.restore()
  }
}

/**
 * The whole hatch, on a loop: an egg rocking, splitting, breaking, and the creature that was in it
 * looking around — then it starts again.
 *
 * A compressed rehearsal of `ui/hatch.js`, not a second implementation of it. The real thing runs
 * on a stored timestamp over five minutes and can only ever happen once per browser, which makes
 * it impossible to *look* at while working on it. This is the same beats in fifteen seconds, seven
 * of them side by side, which is the only way to tell whether a God shell actually reads as more
 * dangerous than a Rare one.
 */
export class HatchThumb {
  /** The beats, as seconds into the cycle. */
  static CYCLE = 15
  static SPLIT = 2.2 // when the first crack lands
  static BREAK = 9.4 // when the shell starts coming apart
  static OUT = 10.5 // when it is fully apart — and when the flash goes off
  static REST = 14 // when it fades to start again

  constructor({ genome, tier, seed }, size, dprCap = 2) {
    const { canvas, ctx } = createStageCanvas(size, dprCap)
    this.canvas = canvas
    this.ctx = ctx
    this.size = size
    this.tier = tier
    this.seed = seed
    this.body = new Body(genome)
    this.body.expr = 'startled'
    this.body.exprUntil = 1e9
    this.phase = rand(0, HatchThumb.CYCLE)
    this.wasOut = false
    this.next = 0
  }

  get onScreen() {
    if (!this.canvas.isConnected) return false
    const r = this.canvas.getBoundingClientRect()
    return r.bottom > -40 && r.top < innerHeight + 40
  }

  tick(dt, t) {
    if (!this.onScreen) return
    const C = HatchThumb
    const p = (t + this.phase) % C.CYCLE
    const x = this.ctx
    const s = this.size
    const R = s * 0.27

    x.clearRect(0, 0, s, s)
    x.fillStyle = WELL
    x.fillRect(0, 0, s, s)
    x.save()
    x.translate(s / 2, s / 2)

    if (p < C.BREAK) {
      // ── still in there. Cracks step on a beat; the rocking grows with them.
      const q = Math.max(0, (p - C.SPLIT) / (C.BREAK - C.SPLIT))
      const cracks = Math.min(6, Math.floor(q * 6.6))
      const rock = 0.25 + q * 1.1
      // a thump just before each new crack, so the crack looks caused rather than scheduled
      const beat = Math.abs(Math.sin(p * (1.4 + rock * 2)))
      x.rotate(Math.sin(p * (1.2 + rock * 1.8)) * 0.045 * rock)
      const squash = 1 + beat * 0.03 * rock
      x.scale(1 / squash, squash)
      drawEgg(x, R, t, { tier: this.tier, seed: this.seed, cracks, open: 0 })
      this.wasOut = false
    } else {
      // ── out. The shell parts, the light takes the cell, and what comes back is the creature.
      const since = p - C.BREAK
      const open = Math.min(1, since / (C.OUT - C.BREAK))
      const fade = p > C.REST ? 1 - (p - C.REST) / (C.CYCLE - C.REST) : 1
      const lit = since - (C.OUT - C.BREAK)
      const covered = lit >= 0 && flashCovers(lit)

      x.globalAlpha = fade

      /* **The swap, exactly as the real page does it** (`ui/hatch.js`) — under full light there is
         the creature and nothing else, before it the egg and its fragments and no creature. No
         frame has both on it. */
      if (covered) {
        if (!this.wasOut) {
          this.wasOut = true
          this.body.S.pop = 1
          this.body.blinkNow(0.2)
        }
        this.body.expr = lit > 1.9 ? 'happy' : 'startled'
        this.body.exprUntil = 1e9
        if (lit > 2.6 && t > this.next) {
          this.next = t + rand(1.4, 2.6)
          const a = rand(0, TAU)
          this.body.S.tx = Math.cos(a) * 0.6
          this.body.S.ty = Math.sin(a) * 0.4
          this.body.glance(this.body.S.tx, this.body.S.ty)
        }
        this.body.update(dt, t)
        // fitted like every other thumbnail, so a bodied creature comes out of the shell in frame
        this.body.draw(x, s * fitScale(this.body), t)
      } else {
        drawEgg(x, R, t, { tier: this.tier, seed: this.seed, cracks: 6, open })
        if (open > 0) drawShards(x, R, this.seed, open, this.tier)
      }

      /* The light, over everything and filling the cell — the same reason the real page's is
         `position: fixed`. Every stop opaque, so at 1 the cell shows nothing at all. */
      const a = flashAt(lit) * fade
      if (a > 0.004) {
        const glow = shellFor(this.tier).glow
        const g = x.createRadialGradient(0, 0, 0, 0, 0, s * 0.8)
        g.addColorStop(0, '#ffffff')
        g.addColorStop(0.3, glow)
        g.addColorStop(1, glow)
        x.globalAlpha = a
        x.fillStyle = g
        x.fillRect(-s, -s, s * 2, s * 2)
      }
      x.globalAlpha = 1
    }

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
