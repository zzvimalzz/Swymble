/* ═══════════════════════════════════════════════════════════
   SOCIAL — approach → engage → play, and how it ends.

   Written for a world of many even though today it holds one, because the state machine is the
   part that would be expensive to retrofit. With a single Oglet every branch below simply never
   fires, and it costs one array filter a frame to keep it honest.
   ═══════════════════════════════════════════════════════════ */

import { pick, rand } from '../core/math.js'
import { population } from '../world/stage.js'

export function endSocial(o, now) {
  const p = o.soc.partner
  o.soc.state = 'none'
  o.soc.partner = null
  o.soc.role = null
  o.soc.bumped = false
  o.soc.nextTry = now + rand(6, 16) / o.g.sociable
  if (p && p.soc.partner === o) {
    p.soc.state = 'none'
    p.soc.partner = null
    p.soc.role = null
    p.soc.bumped = false
    p.soc.nextTry = now + rand(6, 16) / p.g.sociable
  }
}

/** A friendly collision: both recoil, both pop, both delighted. */
export function bump(a, b, now) {
  const dx = b.b.x - a.b.x
  const dy = b.b.y - a.b.y
  const n = Math.max(Math.hypot(dx, dy), 1)
  a.b.vx -= (dx / n) * 250
  a.b.vy -= (dy / n) * 250
  b.b.vx += (dx / n) * 250
  b.b.vy += (dy / n) * 250
  a.body.poke()
  b.body.poke()
  a.setExpr('happy', 1.6, now)
  b.setExpr('happy', 1.6, now)
}

export function updateSocial(o, dt, now) {
  const s = o.soc
  const B = o.body

  if (o.phase !== 'awake' || o.dragging) {
    if (s.state !== 'none') endSocial(o, now)
    return
  }

  if (s.state === 'none') {
    if (now > s.nextTry) {
      const candidates = population.filter(
        (x) => x !== o && x.phase === 'awake' && x.soc.state === 'none' && !x.dragging,
      )
      if (candidates.length) {
        const p = pick(candidates)
        s.state = 'approach'
        s.partner = p
        s.until = now + rand(7, 13)
        p.soc.state = 'approach'
        p.soc.partner = o
        p.soc.until = s.until
        o.attn = 'peer'
        o.peer = p
        p.attn = 'peer'
        p.peer = o
        o.attnUntil = p.attnUntil = now + 30
        const t = o.aimAt({ x: p.cx, y: p.cy })
        B.glance(t.x, t.y)
      } else {
        s.nextTry = now + rand(3, 7)
      }
    }
    return
  }

  const p = s.partner
  if (!p || p.soc.partner !== o) {
    endSocial(o, now)
    return
  }

  const dist = Math.hypot(p.b.x - o.b.x, p.b.y - o.b.y)
  const touch = o.rad + p.rad

  if (s.state === 'approach') {
    if (dist < touch * 1.3) {
      s.state = 'engage'
      s.until = now + rand(3, 6)
      s.nextEmote = now + rand(0.2, 0.7)
      p.soc.state = 'engage'
      p.soc.until = s.until
    } else if (now > s.until) {
      endSocial(o, now)
    }
  } else if (s.state === 'engage') {
    if (now > s.nextEmote) {
      s.nextEmote = now + rand(1.8, 3.2)
      const e = o.drive.annoy > 0.45 ? 'angry' : Math.random() < 0.68 ? 'happy' : 'sad'
      o.emote(e, now, rand(1.4, 2.2))
      if (e === 'happy' && Math.random() < 0.3) B.wink()
    }
    if (!s.bumped && dist < touch * 1.1 && Math.random() < dt * 1.2) {
      s.bumped = true
      bump(o, p, now)
    }
    if (now > s.until) {
      if (Math.random() < 0.45 && o.body.expr !== 'angry' && p.body.expr !== 'angry') {
        s.state = 'play'
        s.role = 'chase'
        s.until = now + rand(5, 9)
        p.soc.state = 'play'
        p.soc.role = 'run'
        p.soc.until = s.until
        o.setExpr('happy', 2, now)
        p.setExpr('happy', 2, now)
      } else {
        endSocial(o, now)
      }
    }
  } else if (s.state === 'play') {
    if (dist < touch * 1.12 && Math.random() < dt * 3) {
      bump(o, p, now)
      s.role = s.role === 'chase' ? 'run' : 'chase'
      p.soc.role = p.soc.role === 'chase' ? 'run' : 'chase'
    }
    if (Math.random() < dt * 0.5) o.setExpr('happy', 1.5, now)
    if (now > s.until) endSocial(o, now)
  }
}
