/* Sleep: awake → sleepy → asleep, and back the moment you show up.

   Nothing here punishes you for leaving. An Oglet that has been alone a long time is asleep,
   not unhappy — the worst that happens is you have to wake it, which it enjoys. */

import { rand } from '../core/math.js'
import { minSide, population } from '../world/stage.js'

export function updateSleep(o, dt, now) {
  const d = o.drive
  const B = o.body

  if (o.phase === 'awake') {
    if (d.idle > o.sleepAfter && o.soc.state === 'none') {
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
    if (now - o.phaseAt > 8) {
      o.phase = 'asleep'
      o.phaseAt = now
      B.asleep = true
      o.wakeAt = now + o.napFor
      o.nextZ = now + 0.8
      o.b.ty = o.seat.y + minSide() * 0.04 // settles a little lower to sleep
    }
    if (d.idle < 1.5) o.wake(now, false)
  } else if (o.phase === 'asleep') {
    if (now > o.wakeAt || d.idle < 1.5) o.wake(now, d.idle < 1.5)
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
