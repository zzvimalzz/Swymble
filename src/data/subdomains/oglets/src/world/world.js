/* ═══════════════════════════════════════════════════════════
   THE WORLD — the live canvas, and the one Oglet standing in it.

   Population is an array on purpose even though it holds exactly one: the social state machine,
   the separation pass and the yawn contagion are all written for many, so growing the world
   later is a push() rather than a rewrite.
   ═══════════════════════════════════════════════════════════ */

import { Oglet } from '../behaviour/oglet.js'
import { separate } from '../behaviour/separate.js'
import { clamp, rand } from '../core/math.js'
import { WELL } from '../core/theme.js'
import { SLEPT_AWAY, awayFor, firstMeeting, mine, trackBond } from '../state/session.js'
import { createWorldCanvas } from './canvas.js'
import { bindPointer } from './input.js'
import { addTicker } from './loop.js'
import { askMotion, hasMotion } from './motion.js'
import { population } from './stage.js'

/** How long you can be away before coming back counts as an event worth reacting to. */
const GREETABLE_ABSENCE = 60e3

export function createWorld(canvas, { isActive, onFirstTouch } = {}) {
  const { ctx, resize } = createWorldCanvas(canvas)

  const me = new Oglet(mine.genome, 0.07, { x: 0, y: 0 })
  me.drive.bond = mine.bond
  population.push(me)

  if (awayFor > SLEPT_AWAY) {
    // it waited, then dozed off
    me.phase = 'asleep'
    me.body.asleep = true
    me.wakeAt = 1e9
    me.drive.idle = me.sleepAfter + 9
  }

  trackBond(() => population[0]?.drive.bond)

  let greetPending = firstMeeting ? false : awayFor > GREETABLE_ABSENCE

  /* A greeting is the one expression allowed to arrive unprompted — because the prompt is you
     coming back, which is the single best thing that happens to an Oglet all day. */
  function greet(now, warm) {
    for (const c of population) {
      if (c.phase !== 'awake') c.wake(now, false)
      c.setExpr('happy', warm ? 2.6 : 1.9, now)
      c.body.blinkNow(0.05)
      c.b.vz -= warm ? 3.4 : 2.2
      c.drive.ignored = 0
      c.drive.lonely = Math.max(0, c.drive.lonely - 0.6)
      c.drive.bond = clamp(c.drive.bond + 0.01, 0, 1)
      c.attn = 'user'
      c.attnUntil = now + rand(2.5, 4.2)
    }
  }

  bindPointer(canvas, {
    /* The phone's own sensors need a real gesture to be granted on iOS, and the first touch on
       the canvas is the only one we are guaranteed. Nothing waits on it: if it is refused, or
       there is no gyroscope, `tilt` stays at zero and the world never knows. */
    onFirstTouch: () => {
      onFirstTouch?.()
      if (hasMotion()) {
        askMotion(() => {
          const now = performance.now() / 1000
          for (const c of population) c.tossed(now)
        })
      }
    },
    // the first move or touch after you have been away is what triggers the welcome
    onNotice: (now) => {
      if (!greetPending) return
      greetPending = false
      greet(now, awayFor > SLEPT_AWAY)
    },
  })

  addTicker((dt, t) => {
    if (!isActive()) return
    ctx.fillStyle = WELL
    ctx.fillRect(0, 0, canvas.clientWidth, canvas.clientHeight)
    for (const c of population) c.update(dt, t)
    separate()
    for (const c of population) c.draw(ctx, t)
    for (const c of population) c.drawZzz(ctx, t)
  })

  return {
    resize,
    /** Called when the tab comes back after a while; the next pointer move does the greeting. */
    expectGreeting() {
      greetPending = true
    },
  }
}
