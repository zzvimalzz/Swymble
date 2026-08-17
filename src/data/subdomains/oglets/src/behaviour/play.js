/* ═══════════════════════════════════════════════════════════
   PLAY — catch, with you.

   `behaviour/social.js` is play with another Oglet. This is play with the pointer, and it is the
   one thing on the site you *do* rather than watch: pick it up, carry it about, let go, and it
   comes after your cursor. Reach it and it pops, bounces off and comes again.

   It starts on release rather than on grab, because that is the moment that reads as throwing a
   ball — you had it, and now it wants it back. A tap is not a throw, so a drag has to have
   lasted `MIN_CARRY` for the game to begin.

   Two counters leave the game and matter elsewhere:

   `catches` is how many times it has caught you *this session*. At `TIRED_AT` it has had enough
   and winds down into a sleep, which is the only way sleep ever arrives from being played with
   rather than from being left alone.

   `giddy` is the over-excited beat — see `emotions/expressions.js#crazy`. A creature that only
   ever gets happier the more you play with it is a slot machine; one that occasionally loses the
   plot for two seconds is a pet.
   ═══════════════════════════════════════════════════════════ */

import { clamp, rand } from '../core/math.js'
import { attentive, ptr, view } from '../world/stage.js'

/** A carry shorter than this was a poke that wobbled, not a throw. */
const MIN_CARRY = 0.4
/** How long one round lasts before it loses interest, unless a catch renews it. */
const ROUND = [5.5, 9]
/** Catches before it is worn out and goes to sleep. */
export const TIRED_AT = 10
/** The catch on which it is guaranteed one giddy beat; after that it is a chance per catch. */
const GIDDY_AT = 5
const GIDDY_CHANCE = 0.14

export const createGame = () => ({ on: false, until: 0, catches: 0, lastCatch: 0, giddy: 0 })

/** Called when you let go of it. Returns true if that started a round. */
export function maybeStart(o, now) {
  const g = o.game
  if (o.phase !== 'awake' || o.drive.annoy > 0.45) return false // it is in no mood to play
  if (now - ptr.t0 < MIN_CARRY) return false
  g.on = true
  g.until = now + rand(...ROUND)
  o.attn = 'user'
  o.attnUntil = g.until
  o.setExpr('happy', 1.6, now)
  o.body.blinkNow(0.1)
  return true
}

export function endGame(o, now) {
  const g = o.game
  if (!g.on) return
  g.on = false
  g.until = 0
  /* Worn out. `sleepAfter` is normally 18–32s; this drops it to a few, so it does not stop dead
     — it slows, yawns and settles, which is what a tired thing does. */
  if (g.catches >= TIRED_AT) {
    o.tired = true
    o.tiredAt = now
    o.sleepAfter = rand(3, 5)
    o.drive.idle = 0
  }
}

/**
 * One frame of the game. Chasing itself is in `Oglet.steer` — this decides whether the game is
 * still on, and what happens when it reaches you.
 */
export function updatePlay(o, dt, now) {
  const g = o.game
  if (!g.on) return

  // it stops if you stop, if it is picked up again, or if it is upset
  if (o.phase !== 'awake' || o.dragging || !attentive(now) || o.drive.annoy > 0.6) {
    endGame(o, now)
    return
  }

  const reach = Math.hypot(ptr.x - o.cx, ptr.y - o.cy)
  if (reach < o.rad * 0.92 && now - g.lastCatch > 0.55) {
    g.lastCatch = now
    g.catches++

    // caught you: pop, bounce off the way it came, and take the win
    const dx = o.cx - ptr.x
    const dy = o.cy - ptr.y
    const n = Math.max(Math.hypot(dx, dy), 1)
    o.b.vx += (dx / n) * 300
    o.b.vy += (dy / n) * 300
    o.b.vz -= 3
    o.body.poke()
    o.drive.cheer = clamp(o.drive.cheer + 0.55, 0, 2)
    o.drive.bond = clamp(o.drive.bond + 0.02, 0, 1)
    o.drive.ignored = 0

    const giddy = g.catches === GIDDY_AT || Math.random() < GIDDY_CHANCE
    if (giddy) {
      g.giddy = now + rand(1.6, 2.4)
      o.setExpr('crazy', rand(1.6, 2.4), now)
    } else {
      o.setExpr('happy', rand(1.2, 1.8), now)
      if (Math.random() < 0.3) o.body.wink()
    }

    if (g.catches >= TIRED_AT) endGame(o, now)
    else g.until = Math.max(g.until, now + rand(...ROUND) * 0.7) // a catch buys more game
    return
  }

  if (now > g.until) endGame(o, now)
}

/** Where a chasing Oglet wants to be: on top of your cursor. */
export const chaseTarget = () => ({ x: ptr.x - view.w / 2, y: ptr.y - view.h / 2 })
