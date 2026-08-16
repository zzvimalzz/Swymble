/* ═══════════════════════════════════════════════════════════
   OGLET — one inhabitant of the world.

   It owns a Body (which draws), a set of drives (which feel), and the physics that puts it
   somewhere. Everything it *decides* lives in the sibling modules — sleep, social, attention —
   so this file stays the thing you read to learn how an Oglet is put together, not a wall of
   behaviour.
   ═══════════════════════════════════════════════════════════ */

import { TAU, clamp, rand } from '../core/math.js'
import { createDrives, pokeDrives, updateDrives } from '../emotions/drives.js'
import { settleFace } from '../emotions/face.js'
import { Body } from '../render/body.js'
import { attentive, minSide, population, ptr, view } from '../world/stage.js'
import { aimGaze, chooseAttention } from './attention.js'
import { updateSleep } from './sleep.js'
import { updateSocial } from './social.js'

/** Below this speed an Oglet keeps its shape. Idle drift never comes close; a poke starts at 430. */
const DASH = 250

export class Oglet {
  constructor(g, scale, seat) {
    this.body = new Body(g)
    this.g = g
    this.scale = scale
    this.seat = seat
    this.b = { x: seat.x, y: seat.y, vx: 0, vy: 0, tx: seat.x, ty: seat.y, nextDrift: 0, z: 1, vz: 0, shake: 0 }
    this.drive = createDrives()

    this.phase = 'awake'
    this.phaseAt = 0
    this.wakeAt = 0
    this.yawned = false
    this.sleepAfter = rand(18, 32)
    this.napFor = rand(16, 34)

    this.solo = { speck: null }
    this.nextWander = 0
    this.attn = 'wander'
    this.attnUntil = 0
    this.attnAt = 0
    this.peer = null

    this.dragging = false
    this.gdx = 0
    this.gdy = 0
    this.taps = []

    this.soc = { state: 'none', partner: null, until: 0, role: null, nextTry: rand(3, 9), bumped: false, nextEmote: 0 }
    this.pending = null
    this.zzz = []
    this.nextZ = 0
    this._rad = minSide() * scale * 2.1
  }

  get R() {
    return minSide() * this.scale
  }
  get rad() {
    return this._rad
  }
  get cx() {
    return view.w / 2 + this.b.x
  }
  get cy() {
    return view.h / 2 + this.b.y
  }
  hit(x, y) {
    return Math.hypot(x - this.cx, y - this.cy) < this._rad
  }
  setExpr(n, s, now) {
    this.body.setExpr(n, s, now)
  }
  /** Screen point → gaze target in the −1…1 space the Body works in. */
  aimAt(p) {
    return {
      x: clamp((p.x - this.cx) / (minSide() * 0.34), -1, 1),
      y: clamp((p.y - this.cy) / (minSide() * 0.34), -1, 1),
    }
  }

  wake(now, startled) {
    if (this.phase === 'awake') return
    this.phase = 'awake'
    this.phaseAt = now
    this.drive.idle = 0
    this.yawned = false
    this.body.asleep = false
    this.body.drowsy = false
    this.body.S.pop = startled ? 1 : 0.55
    this.body.blinkNow(startled ? 0.32 : 0.2)
    if (!startled) this.setExpr('happy', 1.4, now)
  }

  /** Shows a feeling, and lets whoever it is with catch it. */
  emote(e, now, d = 1.6) {
    this.setExpr(e, d, now)
    const p = this.soc.partner
    if (p && p.phase === 'awake') p.receive(e, this, now)
  }

  /** Catching one. Temper decides whether a scowl is met with a scowl or with a flinch. */
  receive(e, from, now) {
    let r = e
    if (e === 'sad') r = this.g.temper > 1.15 ? 'happy' : 'sad'
    if (e === 'angry') r = this.g.temper > 1.05 ? 'angry' : 'sad'
    this.pending = { expr: r, at: now + rand(0.35, 0.8), dur: rand(1.2, 2.0) }
    this.attn = 'peer'
    this.peer = from
    this.attnUntil = now + rand(1.5, 3)
  }

  startle(who, now) {
    if (this.phase !== 'awake') this.wake(now, true)
    this.attn = 'peer'
    this.peer = who
    this.attnUntil = now + rand(1.2, 2.6)
    this.setExpr('startled', rand(0.5, 0.9), now) // brief on purpose: held, surprise becomes fear
    if (Math.random() < 0.35) this.body.blinkNow(0.1)
  }

  poke(now) {
    const dx = this.cx - ptr.x
    const dy = this.cy - ptr.y
    const n = Math.max(Math.hypot(dx, dy), 1)
    this.b.vx += (dx / n) * 430
    this.b.vy += (dy / n) * 430
    this.b.vz -= 5
    this.body.poke()

    const reaction = pokeDrives(this, now)
    if (reaction === 'angry') {
      this.setExpr('angry', 2.2, now)
      this.b.shake = 1
      const p = this.soc.partner
      if (p) p.receive('angry', this, now)
    } else if (reaction === 'sad') {
      this.setExpr('sad', 1.2, now)
    }

    for (const o of population) if (o !== this && Math.random() < 0.7) o.startle(this, now)
  }

  update(dt, now) {
    if (this.pending && now >= this.pending.at) {
      this.setExpr(this.pending.expr, this.pending.dur, now)
      this.pending = null
    }

    const reach = Math.hypot(ptr.x - this.cx, ptr.y - this.cy)
    const near = reach < this._rad * 1.25
    const att = attentive(now)
    // the pupils converge on whatever is close: looking *at* you, not past you
    this.body.verge = att && this.attn === 'user' ? clamp(1 - reach / (this._rad * 3.4), 0, 1) : 0
    updateDrives(this, dt, {
      attentive: att,
      close: reach < this._rad * 2.8,
      pressing: ptr.down && near && ptr.moved < this.R * 0.5,
      alone: population.length < 2,
    })

    updateSleep(this, dt, now)
    updateSocial(this, dt, now)
    settleFace(this, now)
    chooseAttention(this, now, att)
    aimGaze(this, dt, now, att)
    this.steer(dt, now, att)

    this.body.update(dt, now)
    this._rad = Math.max(this.body.radius * this.R * Math.abs(this.b.z), this._rad * 0.985)
  }

  /** Where its body wants to be, and the spring that takes it there. */
  steer(dt, now, att) {
    const b = this.b
    const d = this.drive
    const limX = view.w / 2 - this._rad
    const limY = view.h / 2 - this._rad

    if (this.dragging) {
      const tx = clamp(ptr.x - view.w / 2 + this.gdx, -limX, limX)
      const ty = clamp(ptr.y - view.h / 2 + this.gdy, -limY, limY)
      b.vx += (150 * (tx - b.x) - 19 * b.vx) * dt
      b.vy += (150 * (ty - b.y) - 19 * b.vy) * dt
      if (Math.hypot(b.vx, b.vy) > 1500) d.annoy = Math.min(1.2, d.annoy + dt * 0.3 * this.g.temper)
    } else {
      const s = this.soc
      const p = s.partner
      let tx
      let ty
      if (p && (s.state === 'approach' || s.state === 'engage')) {
        const dx = b.x - p.b.x
        const dy = b.y - p.b.y
        const n = Math.max(Math.hypot(dx, dy), 1)
        const want = (this._rad + p._rad) * 1.06
        tx = p.b.x + (dx / n) * want
        ty = p.b.y + (dy / n) * want * 0.6
      } else if (p && s.state === 'play') {
        const dx = b.x - p.b.x
        const dy = b.y - p.b.y
        const n = Math.max(Math.hypot(dx, dy), 1)
        const touch = (this._rad + p._rad) * 1.04
        const far = s.role === 'chase' ? 1 : 2.6
        tx = p.b.x + (dx / n) * touch * far
        ty = p.b.y + (dy / n) * touch * far
      } else {
        if (now > b.nextDrift) {
          b.nextDrift = now + (this.phase === 'asleep' ? rand(6, 11) : rand(3, 7.5) / this.g.pace)
          const radius = minSide() * (this.phase === 'asleep' ? 0.03 : 0.14)
          const a = rand(0, TAU)
          const r = Math.sqrt(Math.random()) * radius
          b.tx = this.seat.x + Math.cos(a) * r
          b.ty = this.seat.y + Math.sin(a) * r * 0.8
        }
        tx = b.tx
        ty = b.ty
        if (att && this.phase === 'awake' && this.attn === 'user') {
          // leans in when it likes you, backs off when it has had enough of you
          const pull = d.annoy > 0.5 ? -0.1 : 0.09 + d.bond * 0.07
          tx += (ptr.x - view.w / 2 - b.x) * pull
          ty += (ptr.y - view.h / 2 - b.y) * pull
        } else if (this.phase === 'awake' && this.attn === 'seek' && ptr.seen) {
          tx += (ptr.x - view.w / 2 - b.x) * 0.05 // wanders over to where you were
          ty += (ptr.y - view.h / 2 - b.y) * 0.05
        }
      }

      const chase = this.soc.state === 'play' && this.soc.role === 'chase'
      const k = this.phase === 'asleep' ? 2.4 : (chase ? 9 : 5.5) * this.g.pace
      const c = this.phase === 'asleep' ? 3.2 : 3.7
      b.vx += (k * (clamp(tx, -limX, limX) - b.x) - c * b.vx) * dt
      b.vy += (k * (clamp(ty, -limY, limY) - b.y) - c * b.vy) * dt
    }

    b.x += b.vx * dt
    b.y += b.vy * dt
    b.vz += (34 * (1 - b.z) - 8.2 * b.vz) * dt
    b.z += b.vz * dt
    b.shake = Math.max(0, b.shake - dt * 0.8)
  }

  draw(ctx, t) {
    const b = this.b
    const B = this.body
    const sleeping = this.phase === 'asleep'
    const breathe = 1 + Math.sin(t * (sleeping ? 0.5 : 1) * this.g.pace) * (sleeping ? 0.034 : 0.011)
    const shake = b.shake > 0 ? Math.sin(t * 26) * b.shake * this.R * 0.05 : 0
    const lean = clamp(b.vx * 0.00018, -0.1, 0.1)

    /* Squash and stretch: it lengthens along the way it is going and thins across it, which is
       the oldest trick in animation and the reason fast movement reads as *weight* rather than
       as a sprite being moved.

       It only happens above DASH, which is well clear of the idle drift. Squash that is on all
       the time is not squash, it is a wobble — the effect has to be an *event*: a poke, a
       release from a drag, a chase. */
    const speed = Math.hypot(b.vx, b.vy)
    const stretch = clamp((speed - DASH) * 0.0004, 0, 0.15)
    const heading = speed > DASH ? Math.atan2(b.vy, b.vx) : 0

    ctx.save()
    ctx.translate(this.cx + shake, this.cy)
    ctx.rotate(B.S.tilt + lean)
    if (stretch > 0.002) {
      ctx.rotate(heading)
      ctx.scale(1 + stretch, 1 - stretch * 0.8)
      ctx.rotate(-heading)
    }
    ctx.scale(b.z * breathe, b.z * breathe)
    B.draw(ctx, this.R, t)
    ctx.restore()
  }

  drawZzz(ctx, t) {
    if (!this.zzz.length) return
    const hr = this._rad
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    for (const z of this.zzz) {
      const p = z.t / z.life
      const size = hr * (0.24 + p * 0.3)
      const x = this.cx + hr * 0.62 + Math.sin(p * 3.4 + z.ph) * hr * 0.2
      const y = this.cy - hr * 0.72 - p * hr * 1.45
      ctx.globalAlpha = Math.sin(p * Math.PI) * 0.7
      ctx.fillStyle = this.body.cols(t, 1).e
      ctx.font = `600 ${size.toFixed(1)}px ui-monospace,Menlo,monospace`
      ctx.fillText('z', x, y)
    }
    ctx.globalAlpha = 1
  }
}
