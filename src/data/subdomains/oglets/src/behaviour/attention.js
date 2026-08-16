/* ═══════════════════════════════════════════════════════════
   ATTENTION — what it is looking at, and where that puts its gaze.

   With company: the old peer / user / wander mix. On its own it does not just stare into
   space — it tracks a speck only it can see, daydreams, or goes looking for you.

   (`speck` is the behaviour. The bestiary reserves `mote` for the one-eyed form, so the two
   never share a name — see `.docs/Oglets-Plan/02-BESTIARY.md`.)
   ═══════════════════════════════════════════════════════════ */

import { TAU, clamp, pick, rand } from '../core/math.js'
import { population, ptr } from '../world/stage.js'

export function chooseAttention(o, now, attentive) {
  const social = o.soc.state !== 'none'

  if (!social && now > o.attnUntil && o.phase === 'awake') {
    o.attnAt = now // when this attention started — `focus` waits a beat before it squints
    const peers = population.filter((x) => x !== o)
    const r = Math.random()
    const d = o.drive

    if (attentive) {
      const watch = clamp(0.55 + d.bond * 0.3, 0, 0.92) // the fonder it is, the more it watches
      o.attn = r < watch ? 'user' : peers.length && r < watch + 0.22 ? 'peer' : 'wander'
      o.attnUntil = now + rand(2.2, 5.5)
    } else if (peers.length) {
      o.attn = r < 0.5 ? 'peer' : 'wander'
      o.attnUntil = now + rand(2, 5.5)
    } else if (ptr.seen && (d.lonely > 0.35 || d.ignored > 6)) {
      o.attn = 'seek' // checks the last place you were
      o.attnUntil = now + rand(3, 6)
      const t = o.aimAt({ x: ptr.x, y: ptr.y })
      o.body.glance(t.x, t.y)
    } else if (r < 0.42) {
      o.attn = 'speck' // follows something only it can see
      o.attnUntil = now + rand(4.5, 9)
      o.solo.speck = { a: rand(0, TAU), r: rand(0.35, 0.85), ph: rand(0, TAU),
        sp: rand(0.3, 0.62) * (Math.random() < 0.5 ? -1 : 1) }
    } else if (r < 0.72) {
      o.attn = 'muse' // looks up, thinking about nothing
      o.attnUntil = now + rand(3.5, 7)
      o.body.glance(rand(-0.3, 0.3), rand(-0.78, -0.42))
    } else {
      o.attn = 'wander'
      o.attnUntil = now + rand(2, 5)
    }

    if (o.attn === 'peer') {
      o.peer = peers.length ? pick(peers) : null
      if (!o.peer) o.attn = 'wander'
    }
  }

  if (social) {
    o.attn = 'peer'
    o.peer = o.soc.partner
  }
}

export function aimGaze(o, dt, now, attentive) {
  const S = o.body.S
  const b = o.b

  if (o.phase === 'asleep') {
    S.tx = 0
    S.ty = 0.2
  } else if (o.dragging) {
    S.tx = clamp(b.vx * 0.0016, -0.9, 0.9)
    S.ty = clamp(b.vy * 0.0014, -0.7, 0.7)
  } else if (o.attn === 'user' && attentive) {
    const t = o.aimAt({ x: ptr.x, y: ptr.y })
    S.tx = t.x
    S.ty = t.y
  } else if (o.attn === 'peer' && o.peer) {
    const t = o.aimAt({ x: o.peer.cx, y: o.peer.cy })
    S.tx = t.x
    S.ty = t.y
  } else if (o.attn === 'speck' && o.solo.speck) {
    const sp = o.solo.speck
    sp.a += dt * sp.sp // a slow, smooth arc — a fly, basically
    S.tx = Math.cos(sp.a) * sp.r
    S.ty = Math.sin(sp.a * 0.7 + sp.ph) * sp.r * 0.55
  } else if (o.attn === 'seek' && ptr.seen) {
    const t = o.aimAt({ x: ptr.x, y: ptr.y })
    S.tx = t.x
    S.ty = t.y
  } else if (o.attn === 'muse') {
    /* holds the glance set when it started daydreaming */
  } else if (now > o.nextWander) {
    o.nextWander = now + (Math.random() < 0.34 ? rand(3, 6.5) : rand(1.3, 2.8)) / o.g.pace
    if (Math.random() < 0.24) {
      S.tx = 0
      S.ty = 0
    } else {
      const a = rand(0, TAU)
      const r = Math.pow(Math.random(), 0.45)
      S.tx = Math.cos(a) * r
      S.ty = Math.sin(a) * r * 0.6
    }
    o.body.glance(S.tx, S.ty)
  }
}
