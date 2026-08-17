/* The two or three colour values canvas code needs. Everything else is CSS.

   Keep WELL equal to `--well` in styles/base.css: canvases are painted, not transparent, so a
   drift between these two shows up as a visible rectangle. */

export const WELL = '#070708'
export const INK = '#0b0b0d'
export const PEARL = '#f6f3ec'

/* Tears. A pearl drop read as a bead of light rather than as water — on a field this dark the
   only thing that says "wet" is a colour, and blue is the one everybody already reads as it.
   The glint is a paler wash of the same hue, so the highlight belongs to the drop. */
export const TEAR = '#6fb6ff'
export const TEAR_GLINT = '#d8ecff'

/* The two colourless palettes the Genome page draws its examples in. A shape card is about the
   shape and a pupil card is about the pupil, so neither is allowed a hue — the colour genes are
   the only place a hue is on trial.

   These are allele-shaped, not hex pairs: `Body` resolves a colour gene per eye and per frame,
   because a God-line colour is a function rather than a value. */
export const MONO_EYE = { iris: { c: PEARL }, core: { c: INK } }
export const MONO_PUPIL = { iris: { c: INK }, core: { c: PEARL } }
