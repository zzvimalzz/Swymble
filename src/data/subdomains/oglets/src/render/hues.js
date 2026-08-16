/* ═══════════════════════════════════════════════════════════
   COLOUR, RESOLVED PER EYE AND PER FRAME.

   An ordinary colour mutation is one hex value and that is the end of it. A God-line one is a
   *function*: Prism walks the whole wheel, Chimera hands the two eyes different colours. So
   nothing downstream may cache a colour — `Body` asks for it again every frame, for each eye.

   `m` is the side (−1 or +1) and `t` is the clock in seconds.
   ═══════════════════════════════════════════════════════════ */

import { hsl } from '../core/color.js'

/** Degrees per second the Prism mutations travel around the wheel. */
const PRISM_SPEED = 34

export function resolveColour(allele, m, t) {
  if (!allele) return '#f6f3ec'
  // Prism: one colour, on both eyes, always moving. The eyes are never out of step with each
  // other — the phase separates the *iris* wheel from the *pupil* wheel, not left from right.
  if (allele.prism != null) return hsl(t * PRISM_SPEED + allele.prism, 0.78, 0.62)
  // Chimera: two fixed colours, one per eye, and it is always the same eye that gets which
  if (allele.pair) return m < 0 ? allele.pair[0] : allele.pair[1]
  return allele.c
}

/** True when a colour is a plain hex and can be reasoned about (the contrast guard needs this). */
export const isHex = (v) => typeof v === 'string' && v.startsWith('#')
