/* ═══════════════════════════════════════════════════════════
   BODY — genome + expression + gaze + blink, and nothing else.

   It knows how to be an Oglet; it knows nothing about the world it is in. That is why the
   world, the Genome page's thumbnails and the landing-page portrait all render through this
   one class instead of three near-copies.
   ═══════════════════════════════════════════════════════════ */

import { readablePupil } from '../core/color.js'
import { clamp, lerp, rand, smootherstep } from '../core/math.js'
import { Spring } from '../core/spring.js'
import { DILATION, expressionOf } from '../emotions/expressions.js'
import { geneOf, hash } from '../genome/index.js'
import { PHI, PITCH, YAW, drawClosedArc, drawPupil, drawSphereShading, eyePath, eyeXform, lidPath } from './eye.js'
import { drawHearts } from './hearts.js'
import { isHex, resolveColour } from './hues.js'
import { OVERLAYS } from './overlays.js'
import { drawGlitched } from './glitch.js'
import { drawPixelated } from './pixelate.js'
import { drawTears } from './tears.js'
import { drawThoughts } from './thoughts.js'

/** How far the pupil hangs back at full sway, in eye radii. Enough to see, small enough that it
    never leaves the socket — past about 0.2 it stops reading as depth and starts reading as a
    loose part. */
const SWAY = 0.19

export class Body {
  /**
   * `palette` overrides the genome's two colour genes with a pair of allele-shaped objects —
   * the Genome page's examples draw in ink and pearl, so a shape card is about the shape and
   * not about what it happens to be wearing. It is *alleles*, not hex values, because a
   * God-line colour is a function of the eye and the clock rather than a fixed thing.
   */
  constructor(g, { palette } = {}) {
    this.g = g
    this.shape = geneOf('shape', g.shape)
    this.pup = geneOf('pupil', g.pupil)
    this.iris = palette?.iris ?? geneOf('iris', g.iris)
    this.core = palette?.core ?? geneOf('core', g.core)
    /* This Oglet's own number, from the parts of its genome that always vary. Any pattern that
       should be personal — veins, a star field — is drawn from it, so it is the same on every
       device forever and different for everybody. */
    this.seed = hash(`${g.gap}|${g.pupilSize}|${g.asymW}|${g.asymH}|${g.pace}|${g.temper}|${g.sociable}`)
    /** God-line mutations are renderings rather than shapes — see render/pixelate.js. */
    this.god = this.shape.god ?? null

    /* `px`/`py` are the gaze **as the pupil has got round to it**, which is not the same number
       as `gx`/`gy` — see `sp.pupX` below. */
    this.S = { gx: 0, gy: 0, px: 0, py: 0, tx: 0, ty: 0, li: 0, lo: 0, bi: 0, bo: 0, bell: 0,
      w: 1, h: 1, tilt: 0, blinkL: 0, blinkR: 0, pop: 0, sleep: 0, dil: 1 }
    this.sp = { x: new Spring(0, 66), y: new Spring(0, 66),
      /* THE PUPIL IS A SEPARATE OBJECT, SUSPENDED. The eye sockets swing with the gaze the
         instant it changes — `drawPeeper` feeds `gx/gy` straight into the yaw and pitch. These
         two springs are much softer, so the pupil arrives *after* the shape it sits in has
         already turned, and for a fifth of a second the two are visibly out of register.
         That lag is the entire depth cue: a decal cannot lag its own surface. */
      pupX: new Spring(0, 44), pupY: new Spring(0, 44),
      li: new Spring(0, 54), lo: new Spring(0, 54),
      bi: new Spring(0, 54), bo: new Spring(0, 54), bell: new Spring(0, 46),
      w: new Spring(1, 54), h: new Spring(1, 54), tilt: new Spring(0, 42),
      sleep: new Spring(0, 20), dil: new Spring(1, 34) }
    this.blk = { t: 1e9, dur: 0.3, next: rand(1, 5), q: 0, eye: 0 }
    this.sac = { on: false, t: 0, dur: 0, fx: 0, fy: 0, tx: 0, ty: 0 }
    this.expr = 'neutral'
    this.exprUntil = 0
    this.asleep = false
    this.drowsy = false
    /** 0…1, how close the thing it is watching is. Converges the pupils — the difference
        between looking *at* you and looking past you. The world sets it; a thumbnail leaves it. */
    this.verge = 0
    /**
     * How hard the creature is being moved, −1…1 per axis. The world sets it from velocity; a
     * thumbnail leaves it at zero.
     *
     * The pupil hangs **back** against it. A thing suspended in a socket does not accelerate
     * with its housing — shove the eye left and the pupil is briefly still where it was, which
     * is the same reason a spirit level works and the reason this reads as two layers rather
     * than one drawing. It is the strongest of the two cues here, because it fires on every
     * drag, throw and chase rather than only on a change of gaze.
     */
    this.sway = { x: 0, y: 0 }
    /* How far apart the two eyes sit, over and above the gap gene. The gap alone assumes a
       roughly circular eye; a wide one (Slab is 1.24 half-widths) then overlaps its partner and
       the pair reads as a single green bar with two dots pasted on it. Narrow shapes are left
       exactly where they were, so nothing that already looked right moves. */
    this.spread = 1 + Math.max(0, this.shape.rx - 1) * 1.3
    /** 0…1 ramp behind the thinking face, so the question marks fade rather than pop. */
    this.think = 0
    /** The same, for crying. Rises fast and falls slow: the tears outlast the face by a beat,
        because a creature that stops crying the instant it cheers up was never crying. */
    this.cry = 0
    /** And for `crazy`: 0…1 behind the out-of-phase pupil swell. Ramped rather than switched,
        so the two eyes come apart and settle back rather than snapping into it. */
    this.giddy = 0
    /** And for `petted`, behind the hearts. */
    this.love = 0
  }

  setExpr(n, s, now) {
    this.expr = n
    this.exprUntil = now + s
  }
  blinkNow(d = 0) {
    this.blk.next = Math.min(this.blk.next, d)
  }
  wink() {
    this.blk.eye = Math.random() < 0.5 ? -1 : 1
    this.blk.t = 1e9
    this.blinkNow(0)
  }
  /** A saccade: eyes jump to a target on an ease, they do not lerp there. */
  glance(tx, ty) {
    const s = this.sac
    const amp = Math.hypot(tx - this.S.gx, ty - this.S.gy)
    s.on = true
    s.t = 0
    s.dur = clamp(0.15 + amp * 0.22, 0.16, 0.44)
    // a big enough jump gets a blink with it, the way a real saccade often does
    if (amp > 0.75 && Math.random() < 0.5) this.blinkNow(0.04)
    s.fx = this.S.gx
    s.fy = this.S.gy
    s.tx = tx
    s.ty = ty
  }
  poke() {
    this.S.pop = 1
    this.blinkNow(0.05)
  }

  updateBlink(dt) {
    const b = this.blk
    const S = this.S
    if (this.asleep) {
      S.blinkL = S.blinkR = 0
      b.t = 1e9
      b.next = rand(2, 5)
      return
    }
    b.next -= dt
    if (b.next <= 0 && b.t > b.dur) {
      b.t = 0
      b.dur = this.drowsy ? rand(0.5, 0.8) : rand(0.26, 0.34)
      if (b.q > 0) {
        b.q--
        b.next = b.dur + 0.1
      } else {
        b.q = Math.random() < 0.09 ? 1 : 0 // the occasional double blink
        b.next = b.q ? b.dur + 0.1 : (this.drowsy ? rand(3, 6) : rand(4.5, 10)) / this.g.pace
      }
    }
    b.t += dt
    const q = b.t / b.dur
    const v = q >= 1 ? 0 : q < 0.36 ? smootherstep(q / 0.36) : 1 - smootherstep(clamp((q - 0.4) / 0.6, 0, 1))
    S.blinkL = b.eye === 1 ? 0 : v
    S.blinkR = b.eye === -1 ? 0 : v
    if (q >= 1) b.eye = 0
  }

  update(dt, now) {
    const S = this.S
    this.updateBlink(dt)

    const s = this.sac
    if (s.on) {
      s.t += dt
      const q = clamp(s.t / s.dur, 0, 1)
      const e = smootherstep(q)
      S.gx = lerp(s.fx, s.tx, e)
      S.gy = lerp(s.fy, s.ty, e)
      this.sp.x.v = S.gx
      this.sp.y.v = S.gy
      this.sp.x.vel = this.sp.y.vel = 0
      if (q >= 1) s.on = false
    } else {
      S.gx = this.sp.x.to(S.tx, dt)
      S.gy = this.sp.y.to(S.ty, dt)
    }

    /* The pupil catching up with where the eye is already looking. Outside the saccade branch
       on purpose: a saccade force-syncs the gaze springs so the eye can snap, and the whole
       point is that the pupil is not allowed to. */
    S.px = this.sp.pupX.to(S.gx, dt)
    S.py = this.sp.pupY.to(S.gy, dt)

    const X = expressionOf(this.expr)
    const pop = S.pop
    S.li = this.sp.li.to(X.li * (1 - pop * 0.9), dt)
    S.lo = this.sp.lo.to(X.lo * (1 - pop * 0.9), dt)
    S.bi = this.sp.bi.to(X.bi * (1 - pop * 0.9), dt)
    S.bo = this.sp.bo.to(X.bo * (1 - pop * 0.9), dt)
    // sprung like the lids themselves, so a smile arrives with them instead of snapping on
    S.bell = this.sp.bell.to(X.bell ?? 0, dt)
    S.w = this.sp.w.to(X.w + pop * 0.14, dt)
    S.h = this.sp.h.to(X.h + pop * 0.22, dt)
    S.tilt = this.sp.tilt.to(X.tilt, dt)
    S.sleep = this.sp.sleep.to(this.asleep ? 1 : 0, dt)
    this.think += ((this.expr === 'thinking' ? 1 : 0) - this.think) * Math.min(1, dt * 2.4)
    const crying = this.expr === 'crying' ? 1 : 0
    this.cry += (crying - this.cry) * Math.min(1, dt * (crying ? 3.2 : 0.9))
    this.giddy += ((this.expr === 'crazy' ? 1 : 0) - this.giddy) * Math.min(1, dt * 3.4)
    this.love += ((this.expr === 'petted' ? 1 : 0) - this.love) * Math.min(1, dt * 2.2)

    /* Pupils dilate on delight and constrict on temper — the fastest way to read a mood, and
       the reason a happy Oglet looks *soft*. Springs, so it is a change you can watch happen. */
    S.dil = this.sp.dil.to(DILATION[this.expr] ?? 1, dt)


    S.pop = Math.max(0, S.pop - dt * 2.2)
  }

  /**
   * The colours for one eye, this frame. Resolved every time rather than cached, because a
   * God-line colour is a function of the side and the clock. The pair is then checked for
   * contrast — eye colour and pupil colour are independent genes, so nothing else stops a pale
   * pupil landing on a pale iris and simply not being there.
   */
  cols(t = 0, m = 1) {
    const e = resolveColour(this.iris, m, t)
    const p = resolveColour(this.core, m, t)
    return { e, p: isHex(e) && isHex(p) ? readablePupil(e, p) : p }
  }

  drawEye(ctx, x, y, rx, ry, m, px, py, top, cl, c, t) {
    const S = this.S
    ctx.save()
    ctx.translate(x, y)
    const li = clamp(S.li + cl * (1 - S.li), 0, 1)
    const lo = clamp(S.lo + cl * (1 - S.lo), 0, 1)
    const shut = clamp((cl - 0.78) / 0.22, 0, 1)
    if (shut < 0.999) {
      ctx.save()
      ctx.globalAlpha = 1 - shut
      eyePath(ctx, this.shape, rx, ry, m, top, t)
      ctx.clip()
      if (li > 0.002 || lo > 0.002) {
        lidPath(ctx, rx, ry, m, li, lo, true)
        ctx.clip()
      }
      if (S.bi > 0.002 || S.bo > 0.002) {
        lidPath(ctx, rx, ry, m, S.bi, S.bo, false, S.bell)
        ctx.clip()
      }
      ctx.fillStyle = c.e
      ctx.fillRect(-rx * 3, -ry * 3, rx * 6, ry * 6)
      // a God-line eye colour draws on its own iris, inside the same clip, with this Oglet's
      // own seed — so two Oglets carrying Veins do not carry the same veins
      OVERLAYS[this.iris.overlay]?.(ctx, rx, ry, t, m, this.seed)
      /* CRAZY: the two pupils swing in **opposite phase** — `m` shifts the sine by half a turn,
         so the left one blows up at exactly the moment the right one pinches down. Everything
         else on this creature is symmetrical or genetic; this is the only thing the two eyes
         ever disagree about in the moment, and it is the whole reason the face reads as unhinged
         rather than as merely surprised. */
      const swing = 1 + this.giddy * 0.46 * Math.sin(t * 6.2 + (m > 0 ? Math.PI : 0))
      drawPupil(ctx, this.pup, this.g.pupilSize * this.S.dil * swing, rx, ry, px * rx, py * ry, c, t)
      // a shaded shape lights the finished eye, pupil included — it is the last thing drawn
      if (this.shape.shade === 'sphere') drawSphereShading(ctx, rx, ry)
      ctx.restore()
    }
    if (shut > 0.004) {
      ctx.globalAlpha = shut
      drawClosedArc(ctx, rx, ry, c.e)
      ctx.globalAlpha = 1
    }
    ctx.restore()
  }

  drawPeeper(ctx, R, t) {
    const S = this.S
    const g = this.g
    const half = R * g.gap * this.spread
    const Rh = half / Math.sin(PHI)
    const yaw = S.gx * YAW
    const pitch = S.gy * PITCH
    const lift = -Math.min(S.bi, S.bo) * 1.05 * this.pup.lift + Math.min(S.li, S.lo) * 0.85 * this.pup.lift
    for (const m of [-1, 1]) {
      const q = eyeXform(m, yaw, pitch)
      const persp = 3.2 / (3.2 + (1 - q.nz))
      const turn = clamp(1 - q.fx / Math.cos(PHI), 0, 0.42)
      const sx = clamp(q.fx / Math.cos(PHI), 0.45, 1.06) * persp
      const sy = q.fy * (1 + turn * 0.28) * persp
      const aw = m < 0 ? g.asymW : 2 - g.asymW
      const ah = m < 0 ? g.asymH : 2 - g.asymH
      const cl = Math.max(m < 0 ? S.blinkL : S.blinkR, S.sleep)
      // a dented shape has its body off to the outer side, so the pupil goes with it — a pupil
      // centred on a kidney is a pupil sitting in the missing half
      const bite = (this.shape.pupilBias ?? (this.shape.notch ?? 0) * 0.42) * m
      this.drawEye(
        ctx,
        q.nx * Rh * persp,
        q.ny * Rh * persp,
        R * this.shape.rx * S.w * sx * aw,
        R * this.shape.ry * S.h * sy * ah,
        m,
        /* `S.px`, not `S.gx` — the lagged gaze — plus the sway. Both are the same idea from two
           directions: the eye is the housing and the pupil is the thing hanging inside it, so it
           is always a beat behind wherever the housing has got to. */
        clamp(S.px * this.pup.travel - 0.06 * m, -0.62, 0.62) + bite
          - this.verge * 0.13 * m - this.sway.x * SWAY,
        clamp(S.py * this.pup.travel * 0.74 + lift, -0.85, 0.85) - this.sway.y * SWAY * 0.8,
        turn * 0.3,
        cl,
        this.cols(t, m), // resolved per eye: Chimera gives the two of them different colours
        t,
      )
    }
  }

  /**
   * Where each eye lands this frame — its centre and its drawn half-height. Anything that hangs
   * off an eye rather than being drawn inside it (tears, so far) needs both, and needs them from
   * the same perspective maths `drawPeeper` uses or it will sit slightly off on a turned head.
   */
  eyeCentres(R) {
    const S = this.S
    const g = this.g
    const Rh = (R * g.gap * this.spread) / Math.sin(PHI)
    return [-1, 1].map((m) => {
      const q = eyeXform(m, S.gx * YAW, S.gy * PITCH)
      const persp = 3.2 / (3.2 + (1 - q.nz))
      const turn = clamp(1 - q.fx / Math.cos(PHI), 0, 0.42)
      const sx = clamp(q.fx / Math.cos(PHI), 0.45, 1.06) * persp
      const sy = q.fy * (1 + turn * 0.28) * persp
      const aw = m < 0 ? g.asymW : 2 - g.asymW
      const ah = m < 0 ? g.asymH : 2 - g.asymH
      return {
        m,
        x: q.nx * Rh * persp,
        y: q.ny * Rh * persp,
        rx: R * this.shape.rx * S.w * sx * aw,
        ry: R * this.shape.ry * S.h * sy * ah,
      }
    })
  }

  draw(ctx, R, t) {
    /* Tears go *inside* the God-line pass, and thoughts stay outside it. The difference is
       whose they are: a tear comes out of the eye and is part of the creature, so a Pixel Oglet
       cries in fat pixels and a Glitch one's tears tear with it — that is the rule in
       03-GENOME.md §7, that an expression survives the rendering rather than the rendering being
       excused. A question mark is not part of the creature; it is the drawing telling you what
       is going on, and it stays crisp. */
    const creature = (into) => {
      this.drawPeeper(into, R, t)
      if (this.cry > 0.01) drawTears(into, R, t, this.seed, this.cry, this.eyeCentres(R))
    }
    if (this.god === 'pixel') drawPixelated(ctx, R, creature)
    else if (this.god === 'glitch') drawGlitched(ctx, R, t, this.seed, creature)
    else creature(ctx)
    drawThoughts(ctx, R, t, this.seed, this.think, this.cols(t, 1).e)
    drawHearts(ctx, R, t, this.seed, this.love, this.cols(t, 1).e)
  }

  /** Conservative personal space, measured from the drawn geometry rather than declared. */
  get radius() {
    const S = this.S
    const g = this.g
    const Rh = (g.gap * this.spread) / Math.sin(PHI)
    let ex = 0
    let ey = 0
    for (const m of [-1, 1]) {
      const q = eyeXform(m, S.gx * YAW, S.gy * PITCH)
      const persp = 3.2 / (3.2 + (1 - q.nz))
      const turn = clamp(1 - q.fx / Math.cos(PHI), 0, 0.42)
      const sx = clamp(q.fx / Math.cos(PHI), 0.45, 1.06) * persp
      const sy = q.fy * (1 + turn * 0.28) * persp
      ex = Math.max(ex, Math.abs(q.nx * Rh * persp) + this.shape.rx * S.w * sx * g.asymW)
      ey = Math.max(ey, Math.abs(q.ny * Rh * persp) + this.shape.ry * S.h * sy * g.asymH * (1 + turn * 0.3))
    }
    return Math.max(ex, ey) * 1.06
  }
}
