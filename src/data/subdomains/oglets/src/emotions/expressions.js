/* ═══════════════════════════════════════════════════════════
   EXPRESSIONS — the upper lid's inner and outer heights move independently. The gap between
   those two numbers *is* the emotion. Nothing here is a sprite swap, which is why an Oglet can
   be a little sad or very sad, and can be interrupted halfway into either.

   li / lo — upper lid, inner and outer edge (0 = open, 1 = shut)
   bi / bo — lower lid, same
   w  / h  — eye scale
   tilt    — head roll, radians
   ═══════════════════════════════════════════════════════════ */

export const EXPRESSIONS = {
  neutral: { li: 0.0, lo: 0.0, bi: 0.0, bo: 0.0, w: 1.0, h: 1.0, tilt: 0 },
  happy: { li: 0.06, lo: 0.06, bi: 0.4, bo: 0.4, w: 1.05, h: 1.05, tilt: 0 },
  angry: { li: 0.64, lo: 0.04, bi: 0.12, bo: 0.0, w: 1.02, h: 1.06, tilt: 0 },
  sad: { li: 0.0, lo: 0.54, bi: 0.0, bo: 0.06, w: 0.97, h: 1.0, tilt: 0.05 },
  sleepy: { li: 0.58, lo: 0.64, bi: 0.1, bo: 0.1, w: 0.98, h: 0.94, tilt: 0.03 },
  asleep: { li: 0.14, lo: 0.16, bi: 0.08, bo: 0.08, w: 0.96, h: 0.92, tilt: 0.06 },
  /**
   * The only squint in the set, and it is never a mood: it is what an eye does when it is trying
   * to make something out. A settled, fond Oglet just looks at you — a face held half shut
   * because it likes you reads as "unwell", and it fights every other expression for the lids.
   */
  focus: { li: 0.17, lo: 0.14, bi: 0.21, bo: 0.18, w: 0.97, h: 0.94, tilt: 0 },
  /** Away with it. Lids loose, a slight roll, and the eyes drifting somewhere off to the side. */
  thinking: { li: 0.2, lo: 0.12, bi: 0.14, bo: 0.08, w: 0.99, h: 0.99, tilt: 0.07 },
  /** Everything open at once. Only ever brief: held, it stops being surprise and becomes fear. */
  startled: { li: 0.0, lo: 0.0, bi: 0.0, bo: 0.0, w: 1.14, h: 1.16, tilt: 0 },
}

export const expressionOf = (name) => EXPRESSIONS[name] ?? EXPRESSIONS.neutral

/**
 * How wide the pupil goes for each face, as a multiple of the pupilSize gene. Delight opens it,
 * temper shuts it down, sleep lets it go slack. It is sprung in `Body.update`, so the change is
 * something you can watch happen rather than a swap between two drawings.
 */
export const DILATION = {
  neutral: 1,
  happy: 1.2,
  focus: 0.72, // narrowed to sharpen up, the way a real pupil does
  thinking: 1.06,
  startled: 1.34,
  angry: 0.76,
  sad: 0.92,
  sleepy: 0.82,
  asleep: 0.72,
}
