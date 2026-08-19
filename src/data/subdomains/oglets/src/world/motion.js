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

/**
 * How fast the running estimate of "which way is down" follows the phone, 0…1 per event.
 *
 * Only needed on hardware that reports `accelerationIncludingGravity` and nothing else — see
 * `linearFrom`. Slow on purpose: gravity turns over seconds and a shake happens in tenths, so a
 * lag this heavy passes the shake through untouched while still tracking the phone being set down.
 */
const GRAVITY_FOLLOW = 0.06

let onShake = null
/** True once the listeners are actually attached. **Not** set by an attempt — see `askMotion`. */
let listening = false
/** The in-flight grant, so two quick taps do not raise two permission dialogs. */
let asking = null
const flips = []
let dir = 0
let lastShake = 0
/** Where down is, as this device last reported it. Only used by the fallback path. */
const gravity = { x: 0, y: 0, z: 0, seen: false }

function handleOrientation(e) {
  if (e.gamma == null && e.beta == null) return
  tilt.on = true
  const dz = (v) => (Math.abs(v) < DEAD ? 0 : clamp((v - Math.sign(v) * DEAD) / FULL, -1, 1))
  // gamma is roll (left/right), beta is pitch (front/back) — both in degrees
  tilt.x = dz(e.gamma ?? 0)
  tilt.y = dz(e.beta ?? 0)
}

/** True when a reading carries an actual number rather than an object full of nulls. */
const usable = (a) => !!a && (a.x != null || a.y != null || a.z != null)

/**
 * The phone's acceleration **with gravity taken out**, whichever of the two readings it has.
 *
 * `acceleration` is the one this wants and plenty of hardware does not have it: a device with an
 * accelerometer but no gyroscope cannot separate the two, so it reports
 * `accelerationIncludingGravity` and leaves `acceleration` null — and the shake detector, which
 * bailed on null, was simply dead on every one of those phones.
 *
 * The fallback is the textbook high-pass: keep a slow running estimate of the constant 9.81 pulling
 * one way and subtract it, which leaves what the hand is doing. It cannot be done from a single
 * reading — at rest a phone reads 9.81 and a shake reads 9.81 ± the shake, and no threshold tells
 * those apart on magnitude alone. Returns null until the estimate has settled, so the first few
 * events after a page loads cannot fire a shake off a gravity vector that is still converging.
 */
function linearFrom(e) {
  if (usable(e.acceleration)) return e.acceleration
  const g = e.accelerationIncludingGravity
  if (!usable(g)) return null

  const x = g.x ?? 0
  const y = g.y ?? 0
  const z = g.z ?? 0
  if (!gravity.seen) {
    gravity.seen = true
    gravity.x = x
    gravity.y = y
    gravity.z = z
    return null
  }
  gravity.x += (x - gravity.x) * GRAVITY_FOLLOW
  gravity.y += (y - gravity.y) * GRAVITY_FOLLOW
  gravity.z += (z - gravity.z) * GRAVITY_FOLLOW
  return { x: x - gravity.x, y: y - gravity.y, z: z - gravity.z }
}

function handleMotion(e) {
  const a = linearFrom(e)
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
 * Must be reached from a user gesture on iOS — see the header. Returns whether the streams are
 * **attached**, and nothing more: a granted permission on a device with no gyroscope attaches
 * fine and then produces nothing, so ask `tilt.on` if what you want to know is whether a real
 * reading has ever arrived. It used to answer `true` on the call that attached them and `tilt.on`
 * on every call after, which are two different questions.
 *
 * **A refusal is not final.** The latch used to be set *before* the request, so one denial — or one
 * call that happened to land outside a gesture and threw — turned the sensors off for the rest of
 * the page load with no way to ask again. Only actually attaching the listeners latches now, so the
 * next tap on the canvas gets another go; `asking` is what stops two quick taps raising two dialogs.
 */
export async function askMotion(shakeHandler) {
  onShake = shakeHandler ?? onShake
  if (listening) return true
  if (asking) return asking

  asking = (async () => {
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

    listening = true
    addEventListener('deviceorientation', handleOrientation, { passive: true })
    addEventListener('devicemotion', handleMotion, { passive: true })
    return true
  })()

  try {
    return await asking
  } finally {
    asking = null
  }
}
