// Steering math shared by every droid in this scene (bb8State.ts, r2State.ts)
// — factored out so the dead-zone/decay/mapRange logic only lives in one
// place. It used to be duplicated inline in bb8State.ts, where rounding the
// decay to an integer caused speed to get permanently stuck a few px/frame
// short of zero; keeping the fix here means a second droid can't reintroduce
// that bug by copy-pasting it slightly wrong.

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const mapRange = (v: number, inMin: number, inMax: number, outMin: number, outMax: number) =>
  outMin + ((v - inMin) * (outMax - outMin)) / (inMax - inMin);

/** Pointer within this many px of the droid's own screen position counts as "not steering". */
const DEAD_ZONE_PX = 45;

/**
 * `pointerX`/`referenceX` are both in the same screen-pixel space — callers
 * pass the droid's *current* on-canvas position as referenceX, not a fixed
 * point, so "steer" means "relative to where it is now". `pointerX` is null
 * when the pointer isn't over the stage at all, which — like being within
 * the dead zone — decays speed back to an exact stop rather than holding
 * whatever speed was last computed.
 */
export function computeSteeringSpeed(
  currentSpeed: number,
  pointerX: number | null,
  referenceX: number,
  controlRange: number,
  maxSpeed = 15,
): number {
  const distance = pointerX === null ? null : pointerX - referenceX;
  if (distance === null || Math.abs(distance) < DEAD_ZONE_PX) {
    const decayed = lerp(currentSpeed, 0, 0.12);
    return Math.abs(decayed) < 0.4 ? 0 : decayed;
  }
  const clamped = Math.max(-controlRange, Math.min(controlRange, distance));
  return mapRange(clamped, -controlRange, controlRange, -maxSpeed, maxSpeed);
}
