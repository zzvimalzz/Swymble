/* ═══════════════════════════════════════════════════════════
   MOTION — the phone itself as an input.

   On a desktop the pointer is the whole interface. On a phone there is a second one sitting
   unused: the device knows which way it is being held and how hard it is being moved, and an
   Oglet in a box is exactly the thing that should notice.

   Two signals, and they are deliberately the same two the pointer already provides, so nothing
   downstream has to learn a new vocabulary:

     `tilt`  — where "down" is, as −1…1 on each axis. Steering reads it as gravity.
     shake   — the phone being thrashed, which is `emotions/drives.js#upsetFace` all over again.

   **Permission.** iOS 13+ will not hand over either stream without an explicit grant, and will
   only *ask* from inside a user gesture — so `askMotion()` has to be called from a real tap, not
   at boot. Everywhere else the events simply arrive. Nothing here throws if the APIs are absent:
   a desktop keeps `tilt` at zero forever and every consumer sees a device that is lying flat.
   ═══════════════════════════════════════════════════════════ */

import { clamp } from '../core/math.js'

/** Where down is. Mutated in place, like `view` and `ptr` — never reassign it. */
export const tilt = { x: 0, y: 0, on: false }

/** Degrees of tilt that count as fully over. A phone is rarely past this in normal use. */
const FULL = 32
/** Below this the phone is being held, not aimed. Without it the world drifts constantly. */
const DEAD = 3

/* Shaking the phone. `devicemotion` gives acceleration without gravity, in m/s²; a brisk shake
   peaks well past 18 and a walk barely reaches 4. As with the drag shake, what is counted is
   *reversals* — a phone being carried accelerates once, a phone being shaken changes its mind
   several times a second. */
const JOLT = 14
const WINDOW = 1.4
const FLIPS = 4

let onShake = null
let started = false
const flips = []
let dir = 0
let lastShake = 0

function handleOrientation(e) {
  if (e.gamma == null && e.beta == null) return
  tilt.on = true
  const dz = (v) => (Math.abs(v) < DEAD ? 0 : clamp((v - Math.sign(v) * DEAD) / FULL, -1, 1))
  // gamma is roll (left/right), beta is pitch (front/back) — both in degrees
  tilt.x = dz(e.gamma ?? 0)
  tilt.y = dz(e.beta ?? 0)
}

function handleMotion(e) {
  const a = e.acceleration
  if (!a) return
  const now = e.timeStamp / 1000
  const mag = Math.hypot(a.x ?? 0, a.y ?? 0, a.z ?? 0)
  if (mag < JOLT) return

  const d = Math.sign(a.x ?? 0) || dir
  if (dir !== 0 && d !== dir) flips.push(now)
  dir = d
  while (flips.length && now - flips[0] > WINDOW) flips.shift()

  if (flips.length >= FLIPS && now - lastShake > 1.2) {
    lastShake = now
    flips.length = 0
    onShake?.(mag)
  }
}

/** True on a device that has either stream at all — used to decide whether to offer the prompt. */
export const hasMotion = () =>
  typeof DeviceOrientationEvent !== 'undefined' || typeof DeviceMotionEvent !== 'undefined'

const needsGrant = (E) => typeof E !== 'undefined' && typeof E?.requestPermission === 'function'

/**
 * Start listening. Safe to call more than once, and safe to call on a desktop.
 *
 * Must be reached from a user gesture on iOS — see the header. Returns whether anything is
 * actually listening, which is the only honest answer: a granted permission on a device with no
 * gyroscope still produces nothing.
 */
export async function askMotion(shakeHandler) {
  onShake = shakeHandler ?? onShake
  if (started) return tilt.on
  started = true

  try {
    if (needsGrant(globalThis.DeviceOrientationEvent)) {
      if ((await DeviceOrientationEvent.requestPermission()) !== 'granted') return false
    }
    if (needsGrant(globalThis.DeviceMotionEvent)) {
      await DeviceMotionEvent.requestPermission().catch(() => {})
    }
  } catch {
    /* Denied, or called outside a gesture. Either way the pointer still works and the world is
       none the wiser — this is an enhancement, never a requirement. */
    return false
  }

  addEventListener('deviceorientation', handleOrientation, { passive: true })
  addEventListener('devicemotion', handleMotion, { passive: true })
  return true
}
