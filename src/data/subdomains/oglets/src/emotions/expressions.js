/* ═══════════════════════════════════════════════════════════
   EXPRESSIONS — the upper lid's inner and outer heights move independently. The gap between
   those two numbers *is* the emotion. Nothing here is a sprite swap, which is why an Oglet can
   be a little sad or very sad, and can be interrupted halfway into either.

   li / lo — upper lid, inner and outer edge (0 = open, 1 = shut)
   bi / bo — lower lid, same
   bell    — how much the LOWER lid arcs up in the middle, 0…1. This is the smile: the corners
             stay where bi/bo put them and the centre lifts into the eye. Optional, 0 by default.
   w  / h  — eye scale
   tilt    — head roll, radians
   ═══════════════════════════════════════════════════════════ */

export const EXPRESSIONS = {
  neutral: { li: 0.0, lo: 0.0, bi: 0.0, bo: 0.0, w: 1.0, h: 1.0, tilt: 0 },
  /** The one face that gets a full bell. A flat raised lower lid is a creature looking over a
      wall; the same lid arced up in the middle is a creature pleased to see you. */
  happy: { li: 0.06, lo: 0.06, bi: 0.28, bo: 0.28, bell: 0.9, w: 1.05, h: 1.05, tilt: 0 },
  angry: { li: 0.64, lo: 0.04, bi: 0.12, bo: 0.0, w: 1.02, h: 1.06, tilt: 0 },
  sad: { li: 0.0, lo: 0.54, bi: 0.0, bo: 0.06, w: 0.97, h: 1.0, tilt: 0.05 },
  /**
   * Crying **opens**. The first version of this was sad with the lids pushed further, and on a
   * round eye the two lids met in a hard diagonal slot that read as a scowl — closing an eye is
   * what anger and effort look like, not what grief looks like. So the brow droops *less* than
   * sad's, the lower lid comes up (the push of a sob, and the wobble that goes with it), the eye
   * is fractionally bigger, and the pupil is the widest in the set after startled.
   *
   * It can afford to be gentle because it is not carrying the emotion on its own:
   * `render/tears.js` is. Never worn for long — crying that does not stop is a bug in a
   * creature, not a mood.
   */
  crying: { li: 0.0, lo: 0.5, bi: 0.16, bo: 0.2, bell: 0.45, w: 1.0, h: 1.03, tilt: 0.06 },
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
  /**
   * PETTED — being stroked, and undone by it. The lids come down from *both* sides onto a fully
   * belled lower lid, so what is left is a soft crescent with a tilt on it, and the pupils go
   * wide underneath.
   *
   * This is the one place a mostly-shut eye is allowed, and it is allowed for exactly the reason
   * `content` was not: it is worn **only while your hand is actually moving on it**. Stop
   * stroking and it is gone within the second. A face is a mood when it outlasts its cause;
   * until then it is a reaction, and this one is a reaction.
   */
  petted: { li: 0.16, lo: 0.16, bi: 0.3, bo: 0.3, bell: 0.75, w: 1.02, h: 1.0, tilt: 0.1 },
  /** Everything open at once. Only ever brief: held, it stops being surprise and becomes fear. */
  startled: { li: 0.0, lo: 0.0, bi: 0.0, bo: 0.0, w: 1.14, h: 1.16, tilt: 0 },
  /**
   * CRAZY — over-excited past the point of sense. Earned by playing catch, not by anything bad:
   * a creature that only ever gets happier the more you play with it is a slot machine, and one
   * that occasionally loses the plot for two seconds is a pet.
   *
   * The lids are wide open and do nothing, because the whole reading is in the pupils: they
   * swell and shrink **in opposite phase**, one blowing up while the other pinches down. That is
   * the only place on the site where the two eyes disagree about something other than colour,
   * and it is why it reads as unhinged rather than as merely surprised. See `Body.giddy`.
   */
  crazy: { li: 0.0, lo: 0.0, bi: 0.0, bo: 0.0, w: 1.16, h: 1.18, tilt: 0.02 },
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
  petted: 1.28, // wide and soft under nearly shut lids — the whole point of it
  focus: 0.72, // narrowed to sharpen up, the way a real pupil does
  thinking: 1.06,
  startled: 1.34,
  crazy: 1.3, // the mean the two eyes swing either side of — see `Body.giddy`
  angry: 0.76,
  sad: 0.92,
  crying: 1.14, // wide and glassy — a crying eye opens, it does not narrow
  sleepy: 0.82,
  asleep: 0.72,
}
