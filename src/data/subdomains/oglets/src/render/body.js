/* ═══════════════════════════════════════════════════════════
   BODY — genome + expression + gaze + blink, and nothing else.

   It knows how to be an Oglet; it knows nothing about the world it is in. That is why the
   world, the Genome page's thumbnails and the landing-page portrait all render through this
   one class instead of three near-copies.
   ═══════════════════════════════════════════════════════════ */

import { COMET } from '../behaviour/beats.js'
import { bodyTone, hsl, readablePupil } from '../core/color.js'
import { approach, clamp, lerp, rand, smootherstep } from '../core/math.js'
import { Spring } from '../core/spring.js'
import { DILATION, expressionOf } from '../emotions/expressions.js'
import { geneOf, hash } from '../genome/index.js'
import { drawDots, strokeArc } from './decor.js'
import { PHI, PITCH, YAW, capsulePath, drawClosedArc, drawPupil, drawSphereShading, eyePath, eyeXform, lidPath } from './eye.js'
import { drawHearts } from './hearts.js'
import { isHex, resolveColour } from './hues.js'
import { OVERLAYS } from './overlays.js'
import { drawGlitched } from './glitch.js'
import { drawPixelated } from './pixelate.js'
import { breatheProfile, PROFILE_SAMPLES, profileOf, tracePath } from './silhouette.js'
import { CHALK, SOOT, SOULLESS_EYE, SOUL_FACES, soulFace } from './soulless.js'
import { drawTears } from './tears.js'
import { drawThoughts } from './thoughts.js'

/** How far the pupil hangs back at full sway, in eye radii. Enough to see, small enough that it
    never leaves the socket — past about 0.2 it stops reading as depth and starts reading as a
    loose part. */
const SWAY = 0.19

/**
 * How big a body is, in eye radii — **the tuning knob for the whole `body` gene.**
 *
 * The eye pair reaches about 2.4 out at full gaze, and 2.6 on a Slab. At 3.1 a body clears that
 * at its widest points and deliberately falls short at its narrowest, so a wide gaze on a Cloud
 * runs an eye into the gap between two lobes and the clip takes the corner off it. That is not a
 * defect to tune out: an eye cut by the body it lives in is the cue that welds the two together,
 * and it is exactly what bloub's mask is for. Judge it on `#/assets`, which draws the worst case.
 */
const BODY_UNIT = 3.1

/**
 * What a bodiless Oglet's frame is worth, in the same units. `ui/thumbs.js#PORTRAIT_SCALE` was
 * derived against this number, so a bare Oglet's thumbnail is byte-identical to what it was —
 * which is 98.5% of them.
 */
export const BARE_FRAME = 2.8

export class Body {
  /**
   * `palette` overrides the genome's two colour genes with a pair of allele-shaped objects —
   * the Genome page's examples draw in ink and pearl, so a shape card is about the shape and
   * not about what it happens to be wearing. It is *alleles*, not hex values, because a
   * God-line colour is a function of the eye and the clock rather than a fixed thing.
   */
  constructor(g, { palette, theme } = {}) {
    this.g = g
    /**
     * A **Soulless** theme, or null — see `render/soulless.js`. Not a gene and never rolled: it
     * replaces every visible gene at once, so it is read here at the top and then consulted by the
     * four places that would otherwise ask the genome (the eye shape, `cols`, the pupil pass and
     * `shellTone`). Everything else on this class — lids, blink, gaze, saccades, springs — runs
     * unchanged, because it is geometry rather than colour.
     */
    this.theme = theme ?? null
    this.shape = theme ? SOULLESS_EYE : geneOf('shape', g.shape)
    this.pup = geneOf('pupil', g.pupil)
    this.iris = palette?.iris ?? geneOf('iris', g.iris)
    this.core = palette?.core ?? geneOf('core', g.core)
    /* This Oglet's own number, from the parts of its genome that always vary. Any pattern that
       should be personal — veins, a star field — is drawn from it, so it is the same on every
       device forever and different for everybody. */
    this.seed = hash(`${g.gap}|${g.pupilSize}|${g.asymW}|${g.asymH}|${g.pace}|${g.temper}|${g.sociable}`)
    /* God-line mutations are renderings rather than shapes — see render/pixelate.js. A theme is a
       rendering too, and two of them at once is neither: the theme wins and the God pass is off. */
    this.god = theme ? null : (this.shape.god ?? null)

    /* ── the body, which almost no Oglet has ──────────────
       `bare` is 98.5% of every roll and returns a null profile, so the whole pass below costs one
       property read on nearly every creature on the site. See the `body` gene in `genome/genes.js`
       for why it is sparse, and `render/silhouette.js` for how a profile is built. */
    // a theme is shaped like a body allele as far as this is concerned: it names a form and that
    // is all `profileOf` ever wanted. A Soulless therefore always has a body, by construction.
    this.shell = theme ?? geneOf('body', g.body)
    this.profile = profileOf(this.shell.form)
    /** Scratch for a Wisp, whose outline is rebuilt every frame. Never allocated inside `draw`. */
    this.wisp = this.shell.live === 'wisp' ? new Array(PROFILE_SAMPLES) : null
    /**
     * A conservative, **gaze-independent** extent in eye radii: what a frame has to hold. Static on
     * purpose — `radius` moves with the gaze every frame, and a thumbnail scaled by that would
     * breathe in and out of its circle. `ui/thumbs.js` divides by it.
     */
    this.frame = this.profile
      ? BODY_UNIT * Math.max(...this.profile) * (this.wisp ? 1.12 : 1)
      : BARE_FRAME

    /**
     * How far out anything drawn **outside** the creature has to start — the question marks, the
     * hearts. Not `frame`, which is a conservative box a card has to hold: this is where the ink
     * actually stops, and for a bodiless Oglet that is the top of an eye at about one eye radius,
     * not the corner of its bounding box at 2.8. Using `frame` for both would float a bare
     * Oglet's thoughts a body's height above its head.
     */
    this.halo = this.profile ? this.frame : 1

    /* `px`/`py` are the gaze **as the pupil has got round to it**, which is not the same number
       as `gx`/`gy` — see `sp.pupX` below. */
    this.S = { gx: 0, gy: 0, px: 0, py: 0, tx: 0, ty: 0, li: 0, lo: 0, bi: 0, bo: 0, bell: 0,
      w: 1, h: 1, tilt: 0, blinkL: 0, blinkR: 0, pop: 0, sleep: 0, dil: 1 }
    this.sp = { x: new Spring(0, 66), y: new Spring(0, 66),
      /* THE PUPIL IS A SEPARATE OBJECT, SUSPENDED. The eye sockets swing with the gaze the
         instant it changes — `drawPeeper` feeds `gx/gy` straight into the yaw and pitch. These
         two springs are softer, so the pupil arrives *after* the shape it sits in has already
         turned and the two are briefly out of register. That lag is the depth cue: a decal cannot
         lag its own surface.
         **118 and not 44.** At 44 the pupil took the better part of a second to catch a saccade —
         which does not read as a suspended object, it reads as a slow one, and it made the
         creature look like it was struggling to focus. A spring settles about as √k faster, so
         this arrives roughly 1.6× sooner while still landing behind the socket: the cue survives
         and the sluggishness does not. It is still a spring, so nothing about it snaps. */
      pupX: new Spring(0, 118), pupY: new Spring(0, 118),
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
    // `theme.gap` folds in here rather than at the three call sites that read `spread`: a Soulless
    // sits its eyes closer together, which is most of what makes it read as a face on an object.
    this.spread = (1 + Math.max(0, this.shape.rx - 1) * 1.3) * (theme?.gap ?? 1)
    /** How far a gaze of ±1 turns the head, over and above `YAW`/`PITCH`. A theme raises it — see
        `render/soulless.js`, where the reason is that the eyes are a fifth of the creature rather
        than the whole of it and have room to actually cross it. */
    this.gazeK = theme?.travel ?? 1
    /** Half the angle between the eyes on the head sphere. Lower is a BIGGER head under the same
        resting gap, so the eyes travel further — see `render/eye.js#PHI`. */
    this.phi = theme?.phi ?? PHI
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

    /* ── beats ────────────────────────────────────────────
       Two channels, and they are deliberately not one. `beat` is the scripted slot — Orbit and
       Burst, one at a time, replaced rather than queued. `comet` is a sustained LEVEL, because a
       comet lasts exactly as long as the speed that causes it and a timeline cannot say that.
       See `behaviour/beats.js`. */
    this.beat = null
    this.comet = 0

    /* ── a Soulless face ──────────────────────────────────
       Shape instead of lids. An ordinary Oglet keeps one eye and moves lids over it; a Soulless
       has no pupil, so a lid clipped across it would eat the one thing carrying the emotion — the
       outline. Each eye therefore gets its own width, height, tilt and squash, sprung like
       everything else here so a face is always *arriving*. See `render/soulless.js#SOUL_FACES`.

       Two per eye and not one shared pair, because the interesting faces are asymmetric:
       `thinking` is a tall drooping eye beside a narrowed lifted one, and it says "working
       something out" better than any symmetric arrangement can. */
    this.soul = theme ? [0, 1].map(() => ({
      w: new Spring(SOUL_FACES.neutral[0].w, 46),
      h: new Spring(SOUL_FACES.neutral[0].h, 46),
      tilt: new Spring(0, 40),
      squash: new Spring(1, 46),
      bow: new Spring(0, 44),
    })) : null
    /** Where those springs have got to, read by `drawPeeper`. Mutated in place, never rebuilt. */
    this.face = theme ? [0, 1].map(() => ({ w: 0.186, h: 0.412, tilt: 0, squash: 1, bow: 0 })) : null
  }

  /**
   * Start a beat. Replaces whatever was running — a queued beat plays after the thing that caused
   * it is over, which reads as a delayed reaction rather than a reaction.
   */
  play(def, now) {
    this.beat = { def, at: now }
    // a blink is what hides the discontinuity when the silhouette jumps; bloub blinks on every
    // state change for exactly this reason
    if (def.blinkIn) this.blinkNow(0.04)
  }

  /** The running beat's frame at `t`, or the sustained comet's, or null. Never mutates. */
  beatFrame(t) {
    const b = this.beat
    if (!b) return null
    const u = t - b.at
    if (u < 0 || u > b.def.dur) return null
    const frame = b.def.sample(u)
    // a scripted beat and a comet can be on at once: the comet is a state, not an interruption
    if (this.comet > 0.012) frame.arcs = [...(frame.arcs ?? []), ...this.cometArcs(t)]
    return frame
  }

  /** The comet's ribbons at `t`, ramped by its level. Empty when it is off, which is nearly always. */
  cometArcs(t) {
    return this.comet > 0.012 ? COMET.sample(t, this.comet).arcs : []
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
    /* The four channel ramps. `approach` and not `x += (t − x) * dt * k` — see `core/math.js`:
       the shorthand is frame-rate dependent, so these used to fade faster in a 30fps thumbnail
       than in the 60fps world, and to jump on any frame that hit the loop's 1/24s clamp. */
    this.think = approach(this.think, this.expr === 'thinking' ? 1 : 0, 2.4, dt)
    const crying = this.expr === 'crying' ? 1 : 0
    // rises fast and falls slow: the tears outlast the face by a beat
    this.cry = approach(this.cry, crying, crying ? 3.2 : 0.9, dt)
    this.giddy = approach(this.giddy, this.expr === 'crazy' ? 1 : 0, 3.4, dt)
    this.love = approach(this.love, this.expr === 'petted' ? 1 : 0, 2.2, dt)

    /* Pupils dilate on delight and constrict on temper — the fastest way to read a mood, and
       the reason a happy Oglet looks *soft*. Springs, so it is a change you can watch happen. */
    S.dil = this.sp.dil.to(DILATION[this.expr] ?? 1, dt)


    S.pop = Math.max(0, S.pop - dt * 2.2)

    /* A Soulless face, arriving. The lid springs above still run — they cost nothing and nothing
       reads them here — but the shape is what is actually drawn. */
    if (this.soul) {
      const want = soulFace(this.expr)
      for (let i = 0; i < 2; i++) {
        const to = want[i]
        const sp = this.soul[i]
        const at = this.face[i]
        /* CRAZY, again: the two eyes swell in **opposite phase**, half a turn apart. On a lidded
           Oglet that is the pupils; there is no pupil here, so it is the eye itself. It stays the
           only thing the two eyes ever disagree about in the moment, and it is still the whole
           reason the face reads as unhinged rather than as merely surprised. */
        const swing = 1 + this.giddy * 0.24 * Math.sin(now * 6.2 + (i ? Math.PI : 0))
        at.w = sp.w.to(to.w * swing, dt)
        at.h = sp.h.to(to.h * swing, dt)
        at.tilt = sp.tilt.to(to.tilt, dt)
        at.squash = sp.squash.to(to.squash ?? 1, dt)
        // sprung like the rest, so a smile arches into place rather than appearing bent
        at.bow = sp.bow.to(to.bow ?? 0, dt)
      }
    }

    /* The beat slot empties itself once its script has run out.
       **Nothing in the creature's own logic starts a beat.** Orbit, Burst and Comet are built and
       tested (`behaviour/beats.js`) and deliberately not wired to anything an Oglet does: the only
       thing that plays one today is the contact sheet at `#/assets`, which drives `play()`
       directly. Wiring them to `crazy`, to a sneeze and to speed is written down in
       `.docs/OGLETS.md` §8 and is a decision still to be taken. */
    if (this.beat && now - this.beat.at > this.beat.def.dur) this.beat = null
  }

  /**
   * The colours for one eye, this frame. Resolved every time rather than cached, because a
   * God-line colour is a function of the side and the clock. The pair is then checked for
   * contrast — eye colour and pupil colour are independent genes, so nothing else stops a pale
   * pupil landing on a pale iris and simply not being there.
   */
  cols(t = 0, m = 1) {
    // A Soulless says everything with shape and nothing with colour: one ink for both eyes, both
    // sides, forever. No contrast guard is needed because there is no pupil to lose.
    if (this.theme) return { e: SOOT, p: SOOT }
    const e = resolveColour(this.iris, m, t)
    const p = resolveColour(this.core, m, t)
    return { e, p: isHex(e) && isHex(p) ? readablePupil(e, p) : p }
  }

  /**
   * A SOULLESS EYE — one filled capsule, and nothing inside it.
   *
   * No lid, no pupil, no overlay, no shading. The shape *is* the expression, so the whole of
   * `drawEye` below would be working against it: a lid clipped across a capsule takes a bite out
   * of the only thing carrying the emotion.
   *
   * A blink is still the ordinary vertical squeeze, composed with the face's own `squash`, and
   * both are applied outside the tilt — so a tilted eye closes into a horizontal dash rather than
   * a diagonal one, which is bloub's ordering and the reason its wink reads.
   */
  drawSoulEye(ctx, x, y, rx, ry, face, cl, colour) {
    ctx.save()
    ctx.translate(x, y)
    ctx.fillStyle = colour
    const lid = 0.06 + 0.94 * (1 - clamp(cl, 0, 1))
    // the arch flattens as it shuts, or a blink would close a smile into a bent dash
    capsulePath(ctx, rx, ry, (face.tilt * Math.PI) / 180, face.squash * lid, face.bow * lid)
    ctx.fill()
    ctx.restore()
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
      /* **A Soulless stops here.** The eye is the filled shape and there is nothing inside it —
         no overlay, no pupil, no shading. Everything below this line is a way of saying what a
         creature is looking at, and that is precisely what it does not do. */
      if (!this.theme) {
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
      }
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
    const Rh = half / Math.sin(this.phi)
    const yaw = S.gx * YAW * this.gazeK
    const pitch = S.gy * PITCH * this.gazeK
    const lift = -Math.min(S.bi, S.bo) * 1.05 * this.pup.lift + Math.min(S.li, S.lo) * 0.85 * this.pup.lift
    for (const m of [-1, 1]) {
      const q = eyeXform(m, yaw, pitch, this.phi)
      const persp = 3.2 / (3.2 + (1 - q.nz))
      const turn = clamp(1 - q.fx / Math.cos(this.phi), 0, 0.42)
      const sx = clamp(q.fx / Math.cos(this.phi), 0.45, 1.06) * persp
      const sy = q.fy * (1 + turn * 0.28) * persp
      const aw = m < 0 ? g.asymW : 2 - g.asymW
      const ah = m < 0 ? g.asymH : 2 - g.asymH
      const cl = Math.max(m < 0 ? S.blinkL : S.blinkR, S.sleep)

      /* A Soulless takes its dimensions from the FACE rather than from the shape gene: the
         expression is the outline. Everything above still applies — it is placed on the same
         sphere, foreshortens with the same perspective and carries the same asymmetry — because
         that rig is what makes an Oglet turn rather than slide, and none of it is about pupils.
         `× 0.5 × BODY_UNIT` converts bloub's units (full size, ball radius 1) into ours. */
      if (this.soul) {
        const f = this.face[m < 0 ? 0 : 1]
        this.drawSoulEye(
          ctx,
          q.nx * Rh * persp,
          q.ny * Rh * persp,
          R * f.w * 0.5 * BODY_UNIT * sx * aw,
          R * f.h * 0.5 * BODY_UNIT * sy * ah,
          f,
          cl,
          SOOT,
        )
        continue
      }

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
    const Rh = (R * g.gap * this.spread) / Math.sin(this.phi)
    return [-1, 1].map((m) => {
      const q = eyeXform(m, S.gx * YAW * this.gazeK, S.gy * PITCH * this.gazeK, this.phi)
      const persp = 3.2 / (3.2 + (1 - q.nz))
      const turn = clamp(1 - q.fx / Math.cos(this.phi), 0, 0.42)
      const sx = clamp(q.fx / Math.cos(this.phi), 0.45, 1.06) * persp
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

  /**
   * The body's outline, left as the current path so the caller can fill it, clip to it, or both.
   * Nothing here allocates: `tracePath` writes into a module scratch and a Wisp into its own.
   */
  bodyPath(ctx, R, t) {
    tracePath(ctx, this.wisp ? breatheProfile(this.profile, t, this.seed, this.wisp) : this.profile,
      R * BODY_UNIT)
  }

  /**
   * One colour for the whole body, resolved every frame like every other colour here.
   *
   * Derived from the *eye* rather than rolled separately — see `core/color.js#bodyTone` for why
   * that is a design decision and not a saving.
   */
  shellTone(t) {
    if (this.theme) return CHALK
    if (this.shell.fill === 'aurora') return hsl(t * 34 + (this.seed % 360), 0.5, 0.26)
    return bodyTone(resolveColour(this.iris, 1, t))
  }

  /**
   * The colour of anything drawn OUTSIDE the creature — the question marks, the hearts, the Zzz.
   *
   * Ordinarily that is the eye's colour, so an Oglet's thoughts are visibly its own. A Soulless
   * eye is ink, and ink on the well is a thing you cannot see, so it borrows its body instead.
   */
  accent(t) {
    return this.theme ? CHALK : this.cols(t, 1).e
  }

  drawShell(ctx, R, t) {
    this.bodyPath(ctx, R, t)
    ctx.fillStyle = this.shellTone(t)
    ctx.fill()
    // Orb: the same lighting pass the Sphere eye wears, inside the body's own clip
    if (this.shell.shade) {
      ctx.save()
      ctx.clip()
      const r = R * BODY_UNIT
      drawSphereShading(ctx, r, r)
      ctx.restore()
    }
  }

  draw(ctx, R, t) {
    /* Tears go *inside* the God-line pass, and thoughts stay outside it. The difference is
       whose they are: a tear comes out of the eye and is part of the creature, so a Pixel Oglet
       cries in fat pixels and a Glitch one's tears tear with it — that is the rule in
       .docs/OGLETS.md §6, that an expression survives the rendering rather than the rendering being
       excused. A question mark is not part of the creature; it is the drawing telling you what
       is going on, and it stays crisp.

       The body is inside it too, and for the same rule: a Pixel Oglet with a crisp Cloud around it
       would be two drawings of two creatures. */
    const beat = this.beatFrame(t)
    const arcs = beat?.arcs ?? this.cometArcs(t)
    /* **Decor is scaled by the creature's own extent, not by the eye radius.** `frame` is what a
       frame has to hold — 2.8 for a bare Oglet, 3.4 for a Cloud — so a ring declared at 1.3 is
       1.3× the whole creature and a Cloud's rings are bigger than a bare one's without any of the
       numbers in `decor.js` knowing a body exists. Getting this wrong is what made the first pass
       draw rings *inside* the face. */
    const D = R * this.frame

    /* **The depth sort**, and it is the reason these effects are allowed to exist at all: half of
       every ring is stroked here, before the creature, so the creature occludes it — and the other
       half after. A ring that passes *through* is welded to the thing it is orbiting. The `glow`
       gene was built and deleted for being drawn only behind (see `.docs/OGLETS.md` §2), and this is
       what makes rings a different case rather than the same mistake in better colours. */
    for (const a of arcs) strokeArc(ctx, a.seed, a.t, D, a.opacity, -1, a.grow)
    if (beat?.dotsBehind) drawDots(ctx, beat.dots, D, this.accent(t))

    const creature = (into) => {
      if (!this.profile) {
        this.drawPeeper(into, R, t)
        if (this.cry > 0.01) drawTears(into, R, t, this.seed, this.cry, this.eyeCentres(R))
        return
      }
      this.drawShell(into, R, t)
      /* **The eyes are clipped to the body**, which is the whole reason the species survives
         gaining one: they are not features laid on a face, they are the holes it is made of. An
         eye that swings wide is cut by its own silhouette, with no cropping code — the same thing
         bloub gets from drawing its eyes as holes in a mask. Tears are inside the clip as well;
         they run down the body rather than through it. */
      into.save()
      this.bodyPath(into, R, t)
      into.clip()
      this.drawPeeper(into, R, t)
      if (this.cry > 0.01) drawTears(into, R, t, this.seed, this.cry, this.eyeCentres(R))
      into.restore()
    }
    /* A beat may scale and fade the whole creature — that is what a Burst is. It goes around the
       God-line pass rather than inside it, so a Pixel Oglet's collapse is pixelated at the size it
       is drawn rather than at the size it started. */
    ctx.save()
    if (beat?.scale != null) ctx.scale(beat.scale, beat.scale)
    if (beat?.eyeAlpha != null) ctx.globalAlpha *= clamp(beat.eyeAlpha, 0, 1)
    if (this.god === 'pixel') drawPixelated(ctx, R, creature)
    else if (this.god === 'glitch') drawGlitched(ctx, R, t, this.seed, creature)
    else creature(ctx)
    ctx.restore()

    const ink = this.accent(t)
    if (beat && !beat.dotsBehind) drawDots(ctx, beat.dots, D, ink)
    for (const a of arcs) strokeArc(ctx, a.seed, a.t, D, a.opacity, 1, a.grow)

    /* Thoughts and hearts are drawn against `halo` and sized against `R`. They are the drawing
       telling you what is going on rather than part of the creature, so they have to be *outside*
       it — and on a bodied Oglet "outside" is three times what it is on a bare one. Placed in eye
       radii, as they were, a Cloud's question marks come out inside the cloud. */
    drawThoughts(ctx, R, t, this.seed, this.think, ink, this.halo * R)
    drawHearts(ctx, R, t, this.seed, this.love, ink, this.halo * R)
  }

  /** Conservative personal space, measured from the drawn geometry rather than declared. */
  get radius() {
    const S = this.S
    const g = this.g
    const Rh = (g.gap * this.spread) / Math.sin(this.phi)
    let ex = 0
    let ey = 0
    for (const m of [-1, 1]) {
      const q = eyeXform(m, S.gx * YAW * this.gazeK, S.gy * PITCH * this.gazeK, this.phi)
      const persp = 3.2 / (3.2 + (1 - q.nz))
      const turn = clamp(1 - q.fx / Math.cos(this.phi), 0, 0.42)
      const sx = clamp(q.fx / Math.cos(this.phi), 0.45, 1.06) * persp
      const sy = q.fy * (1 + turn * 0.28) * persp
      ex = Math.max(ex, Math.abs(q.nx * Rh * persp) + this.shape.rx * S.w * sx * g.asymW)
      ey = Math.max(ey, Math.abs(q.ny * Rh * persp) + this.shape.ry * S.h * sy * g.asymH * (1 + turn * 0.3))
    }
    // a bodied Oglet is as big as its body: collision, hit-testing and separation all follow this
    return Math.max(Math.max(ex, ey) * 1.06, this.profile ? this.frame : 0)
  }
}
