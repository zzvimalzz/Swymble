/* A neutral Oglet carrying exactly one mutation under discussion, so a card shows that mutation
   and nothing else. The continuous genes are pinned for the same reason — a card is a
   demonstration, not a draw.

   Colour is handled separately, by the palette override in `paletteFor` — a shape card is drawn
   in ink and pearl so it argues about shape only. */

import { INK, MONO_EYE, MONO_PUPIL, PEARL } from '../core/theme.js'
import { geneOf, randomGenome } from '../genome/index.js'

/* `body: 'bare'` is pinned like everything else here, and it has to be: `randomGenome()` rolls
   every gene, so without it about one card in seventy would arrive wearing a Legendary body and
   be a card about two things. */
const NEUTRAL = {
  shape: 'round', pupil: 'dot', iris: 'bone', core: 'ash', body: 'bare',
  gap: 1.05, pupilSize: 0.29, asymW: 1.0, asymH: 1.0,
}

export function specimen(cat, alleleId) {
  return Object.assign(randomGenome(), NEUTRAL, { [cat]: alleleId })
}

/**
 * Each gene's card isolates its own gene: only the colour genes get to show a colour, and a
 * colour card pairs its own allele with a plain one so the card is about that gene alone.
 * The allele itself is handed over rather than a hex, because a God-line colour is a function.
 */
export function paletteFor(cat, alleleId) {
  if (cat === 'shape') return MONO_EYE
  if (cat === 'pupil') return MONO_PUPIL
  /* A body card is the one silhouette card that keeps a hue, and it has to: **the body's colour is
     derived from the eye's** (`core/color.js#bodyTone`), so an ink-and-pearl body card would be
     showing a tone no Oglet in the world will ever wear. Moss is the commonest eye colour there
     is, which makes it the honest one to draw a body against. */
  if (cat === 'body') return { iris: geneOf('iris', 'moss'), core: { c: INK } }
  if (cat === 'iris') return { iris: geneOf('iris', alleleId), core: { c: INK } }
  if (cat === 'core') return { iris: { c: PEARL }, core: geneOf('core', alleleId) }
  // a Glow card is about the light, and light needs a colour to be — so this one gets an eye
  return { iris: geneOf('iris', 'lagoon'), core: { c: INK } }
}
