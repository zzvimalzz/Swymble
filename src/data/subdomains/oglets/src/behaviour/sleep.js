/* Sleep: awake → sleepy → asleep, and back the moment you show up.

   Nothing here punishes you for leaving. An Oglet that has been alone a long time is asleep,
   not unhappy — the worst that happens is you have to wake it, which it enjoys.

   **Two ways in, and they behave differently.** Boredom is the usual one and it is undone by any
   sign of you: a bored Oglet is only dozing and the smallest movement brings it back. Being
   *worn out* (`o.tired`, set by `behaviour/play.js` after ten catches) is not — it played until
   it could not any more, and it is allowed to nod off while you sit there watching it. Nothing
   short of touching it wakes that one, and touching it earns a `startled`. */

import { rand } from '../core/math.js'
import { minSide, population } from '../world/stage.js'

export function updateSleep(o, dt, now) {
  const d = o.drive
  const B = o.body

  if (o.phase === 'awake') {
    /* A worn-out Oglet runs on its own clock, because `idle` is reset by every mouse move and
       you are almost certainly still moving it — you were just playing with the thing. */
    const worn = o.tired && now - o.tiredAt > o.sleepAfter
    if ((worn || d.idle > o.sleepAfter) && o.soc.state === 'none' && !o.game.on) {
      o.phase = 'sleepy'
      o.phaseAt = now
      o.yawned = false
      B.drowsy = true
    }
  } else if (o.phase === 'sleepy') {
    if (!o.yawned && now - o.phaseAt > 1.2) {
      o.yawned = true
      B.blinkNow(0)
      B.blk.dur = 0.9
      // yawns are catching, which is free characterisation once there is more than one of them
      for (const other of population) {
        if (other !== o && other.phase === 'awake' && Math.random() < 0.5) other.drive.idle += rand(4, 9)
      }
    }
    // worn out, it goes under quickly; merely bored, it dozes on the edge of it for a while
    if (now - o.phaseAt > (o.tired ? 3.5 : 8)) {
      o.phase = 'asleep'
      o.phaseAt = now
      B.asleep = true
      o.wakeAt = now + o.napFor
      o.nextZ = now + 0.8
      o.b.ty = o.seat.y + minSide() * 0.04 // settles a little lower to sleep
    }
    if (!o.tired && d.idle < 1.5) o.wake(now, false)
  } else if (o.phase === 'asleep') {
    if (now > o.wakeAt) o.wake(now, false)
    else if (!o.tired && d.idle < 1.5) o.wake(now, true)
  }

  if (o.phase === 'asleep' && now > o.nextZ) {
    o.nextZ = now + rand(1.4, 2.1)
    o.zzz.push({ t: 0, life: rand(2.8, 3.6), ph: rand(0, Math.PI * 2) })
  }
  for (let i = o.zzz.length - 1; i >= 0; i--) {
    o.zzz[i].t += dt
    if (o.zzz[i].t > o.zzz[i].life) o.zzz.splice(i, 1)
  }
}
