/* ═══════════════════════════════════════════════════════════
   THE GENE TABLES — the single source of truth for what an Oglet can be.

   Weights are the ONLY source of rarity: a trait is rare because its allele is rare, not
   because a table somewhere says so. That is also what lets breeding inherit alleles
   directly, later, without any of this being rewritten.

   In the interface these are called **mutations**. In here they keep their genetics name,
   `allele`, because that is what they are and because inheritance will need the word.

   Adding one: append it to the END of its list. Weights must sum to 1, and every entry needs a
   `name` and a `lore` line — the test suite enforces all three.

   **Changing a list changes what existing ids draw for that gene**, because a weighted draw
   walks the whole table. That is fine while this is new; once there is an audience, a table
   change needs a generation stamp beside the id and the old table kept. See `03-GENOME.md`.

   ── eye shape geometry ──
   A shape picks one of four path modes — see `render/eye.js`. The default is four beziers
   through the top, right, bottom and left anchors, where `kT/kO/kB/kI` are the handle strengths
   of the top-outer, bottom-outer, bottom-inner and top-inner quadrants:

     k ≈ 0.55  a circular arc          k → 1.0  a square corner
     k → 0     a straight edge         k < 0    an edge that bows inward, making a notch

   `side` slides the two side anchors down (+) or up (−). `poly` swaps in a rounded polygon with
   a radius per corner, `spark` a curved four-pointed star, `moon` a bitten ellipse.

   **One rule about silhouettes:** a shape that narrows toward the top reads as a lowered brow,
   and an Oglet wearing one looks permanently unhappy no matter what its lids are doing. Keep
   the weight at the top. That is why there is no triangle here.
   ═══════════════════════════════════════════════════════════ */

import { TIERS } from './tiers.js'

export const GENES = {
  shape: [
    { id: 'round', name: 'Round', tier: 'common',
      lore: 'The eye the species started with. Every other shape is a rumour about what happened next.',
      rx: 1.0, ry: 1.03, kT: 0.58, kO: 0.56, kB: 0.56, kI: 0.58 },
    { id: 'egg', name: 'Egg', tier: 'common',
      lore: 'Said to belong to Oglets that hatched early and never quite finished the job.',
      rx: 0.86, ry: 1.16, kT: 0.62, kO: 0.54, kB: 0.54, kI: 0.62 },
    { id: 'bean', name: 'Bean', tier: 'uncommon',
      lore: 'Low and wide, built for horizons. Bean-eyed Oglets always notice the weather first.',
      rx: 1.14, ry: 0.9, kT: 0.8, kO: 0.84, kB: 0.84, kI: 0.8 },
    { id: 'capsule', name: 'Capsule', tier: 'uncommon',
      lore: 'Two straight sides and two perfect ends. Capsule Oglets are unnervingly tidy about everything.',
      rx: 0.74, ry: 1.18, poly: [[-1, -1], [1, -1], [1, 1], [-1, 1]], round: 1,
      kT: 0.9, kO: 0.9, kB: 0.9, kI: 0.9 },
    { id: 'dome', name: 'Dome', tier: 'rare',
      lore: 'Wide at the top, settled at the bottom. It is not sleepy — it has simply seen this room before.',
      rx: 1.08, ry: 0.94, side: 0.44, kT: 0.5, kO: 0.97, kB: 0.97, kI: 0.5 },
    { id: 'arch', name: 'Arch', tier: 'rare',
      lore: 'A doorway with nothing behind it. Oglets built this way are said to remember older rooms.',
      rx: 0.84, ry: 1.14, poly: [[-1, -1], [1, -1], [1, 1], [-1, 1]], round: [1, 1, 0.1, 0.1],
      kT: 0.9, kO: 0.9, kB: 0.9, kI: 0.9 },
    { id: 'block', name: 'Block', tier: 'epic',
      lore: 'A rendering fault that bred true. Nothing alive has corners this clean, and yet here it is.',
      rx: 0.94, ry: 1.0, poly: [[-1, -1], [1, -1], [1, 1], [-1, 1]], round: 0.08,
      kT: 1, kO: 1, kB: 1, kI: 1 },
    { id: 'diamond', name: 'Diamond', tier: 'epic',
      lore: 'Grown, not cut. A Diamond-eyed Oglet sees the same room in four slightly different versions.',
      rx: 1.06, ry: 1.18, poly: [[0, -1], [1, 0], [0, 1], [-1, 0]], round: 0.26,
      kT: 0.3, kO: 0.3, kB: 0.3, kI: 0.3 },
    { id: 'slab', name: 'Slab', tier: 'legendary',
      lore: 'Cut from something larger and never polished. Heavy-looking, and much lighter than it looks.',
      rx: 1.24, ry: 0.76, poly: [[-1, -1], [1, -1], [1, 1], [-1, 1]], round: 0.34,
      kT: 0.9, kO: 0.9, kB: 0.9, kI: 0.9 },
    { id: 'bud', name: 'Bud', tier: 'legendary',
      lore: 'A soft three-cornered eye, rounded at every one of them. It has not opened all the way yet.',
      rx: 1.18, ry: 1.2, poly: [[0, -1], [1, 0.86], [-1, 0.86]], round: 0.3,
      kT: 0.5, kO: 0.5, kB: 0.5, kI: 0.5 },
    { id: 'wedge', name: 'Wedge', tier: 'void',
      lore: 'Broad above, narrow below, like something braced against a wind that stopped years ago.',
      rx: 1.08, ry: 1.02, poly: [[-1, -1], [1, -1], [0.6, 1], [-0.6, 1]], round: 0.34,
      kT: 0.8, kO: 0.4, kB: 0.4, kI: 0.8 },

    /* `shade` is not a silhouette at all — it is a lighting pass over the finished eye. Void
       rather than God: it is still an eye, it is just an eye with a third dimension. */
    { id: 'sphere', name: 'Sphere', tier: 'void', shade: 'sphere',
      lore: 'Not a disc pretending. There is a *behind* to this one, and the light knows about it.',
      rx: 1.04, ry: 1.06, kT: 0.56, kO: 0.56, kB: 0.56, kI: 0.56 },

    /* ── the first God-line mutation ──────────────────────
       `god` is not a shape at all: it is a rendering the whole creature goes through, pupil and
       colour included. Ordinary mutations change what an Oglet *is*; a God-line one changes how
       it is drawn. Weight sits under the Void cut, so the tier table calls it God on its own. */
    { id: 'pixel', name: 'Pixel', tier: 'god', god: 'pixel',
      lore: 'It is not shaped like this. It is *rendered* like this, badly, by something that ran out of memory.',
      rx: 1.0, ry: 1.05, kT: 0.58, kO: 0.56, kB: 0.56, kI: 0.58 },
    { id: 'glitch', name: 'Glitch', tier: 'god', god: 'glitch',
      lore: 'Whatever is carrying the picture of it is failing. Nobody has established what the picture is of.',
      rx: 1.02, ry: 1.04, kT: 0.58, kO: 0.56, kB: 0.56, kI: 0.58 },
  ],
  pupil: [
    { id: 'dot', name: 'Dot', tier: 'common',
      lore: 'The plain pupil, and the one that follows furthest. It never learned to look away politely.',
      travel: 0.46, lift: 1.0 },
    { id: 'oval', name: 'Oval', tier: 'common',
      lore: 'Slow and wide. Oval Oglets watch a thing patiently until it explains itself.',
      travel: 0.34, lift: 0.45 },
    { id: 'slit', name: 'Slit', tier: 'uncommon',
      lore: 'Narrows in daylight, opens in the dark, and is always first to catch a movement.',
      travel: 0.44, lift: 0.85 },
    { id: 'bar', name: 'Bar', tier: 'uncommon',
      lore: 'A pupil lying on its side. It sees the whole horizon and almost nothing above it.',
      travel: 0.4, lift: 0.6 },
    { id: 'ring', name: 'Ring', tier: 'rare',
      lore: 'A pupil with a hole through it. Look long enough and something on the far side looks back.',
      travel: 0.42, lift: 0.95 },
    { id: 'square', name: 'Square', tier: 'rare',
      lore: 'It does not dilate. It steps — four sizes, no in-between, and always exactly on time.',
      travel: 0.4, lift: 0.9 },
    { id: 'rhomb', name: 'Rhomb', tier: 'epic',
      lore: 'Cut like a gemstone and just as unhelpful about it. Catches light that is not there.',
      travel: 0.44, lift: 0.9 },
    { id: 'keyhole', name: 'Keyhole', tier: 'epic',
      lore: 'A round pupil with a notch dropped out of the bottom. Something is meant to fit in it.',
      travel: 0.42, lift: 0.88 },
    { id: 'cross', name: 'Cross', tier: 'legendary',
      lore: 'Two pupils that grew into each other. It aims rather than looks.',
      travel: 0.38, lift: 0.85 },
    { id: 'spark', name: 'Spark', tier: 'legendary',
      lore: 'A star where the pupil should be. It is not reflecting anything — that light is its own.',
      travel: 0.46, lift: 0.95 },
    { id: 'target', name: 'Target', tier: 'void',
      lore: 'Rings inside rings. Whatever it is focusing on, it is not in this room.',
      travel: 0.42, lift: 0.9 },
    { id: 'heart', name: 'Heart', tier: 'void',
      lore: 'Nobody is sure whether it means anything. The Oglets that have it are no fonder than the rest.',
      travel: 0.48, lift: 1.0 },
    { id: 'hypno', name: 'Hypnotic', tier: 'god', god: 'hypno',
      lore: 'A spiral that has been turning since before it had anything to look at. Do not hold its gaze.',
      travel: 0.3, lift: 0.9 },
    { id: 'eclipse', name: 'Eclipse', tier: 'god', god: 'eclipse',
      lore: 'A black centre with a corona around it, turning very slowly. Something is in the way.',
      travel: 0.36, lift: 0.92 },
  ],
  /* Colour is two genes, not one. An eye and its pupil are coloured independently, which turns
     twelve palettes into a hundred and forty-four pairings — and lets a rare pupil colour turn
     up on an ordinary eye, which a single palette gene could never do.

     `Body` runs the pair through a contrast guard, so no combination can produce a pupil that
     disappears into its own iris. */
  iris: [
    { id: 'moss', name: 'Moss', tier: 'common', c: '#86e6a8',
      lore: 'The commonest colouring and the oldest. Everything green here came out of one damp cave.' },
    { id: 'lagoon', name: 'Lagoon', tier: 'common', c: '#8ad8f0',
      lore: 'Shallow water. Lagoon Oglets drift to the edges of a room the way water finds a wall.' },
    { id: 'peony', name: 'Peony', tier: 'uncommon', c: '#ffb2c8',
      lore: 'A soft pink that only turns up in Oglets raised somewhere kind.' },
    { id: 'amber', name: 'Amber', tier: 'uncommon', c: '#ffcf6b',
      lore: 'Lamplight, trapped. Amber Oglets are the warmest to hold, which is physics or affection.' },
    { id: 'bone', name: 'Bone', tier: 'rare', c: '#f0e8d6',
      lore: 'Almost no colour at all. A Bone Oglet is not old; it simply never got round to it.' },
    { id: 'coral', name: 'Coral', tier: 'rare', c: '#ff8f70',
      lore: 'Sun-bleached orange. It fades a shade every year and nobody has caught it happening.' },
    { id: 'lilac', name: 'Lilac', tier: 'epic', c: '#c2acff',
      lore: 'The colour of the hour after sunset and before anybody thinks to light a lamp.' },
    { id: 'lime', name: 'Lime', tier: 'epic', c: '#d8f07a',
      lore: 'Loud, acidic and faintly unwell-looking. Lime Oglets are, without exception, delighted.' },
    { id: 'cobalt', name: 'Cobalt', tier: 'epic', c: '#1a55e8',
      lore: 'Somewhere there was a machine full of light and noise, and this is what it left behind.' },
    { id: 'siren', name: 'Siren', tier: 'legendary', c: '#d4807e',
      lore: 'A dusty warning red, worn by Oglets that have never once been dangerous.' },
    { id: 'ember', name: 'Ember', tier: 'legendary', c: '#2b0d0d',
      lore: 'Nearly black, and warm to look at anyway. Whatever burned here went out a long time ago.' },
    { id: 'lightning', name: 'Lightning', tier: 'void', c: '#3b4250', overlay: 'lightning',
      lore: 'A low grey sky behind the eye, and every so often the whole thing goes white.' },
    { id: 'void', name: 'Void', tier: 'void', c: '#2a2a34',
      lore: 'It gives back nothing at all, and it gives it back very clearly.' },

    /* ── God-line eye colours ──────────────────────────────
       `overlay` draws on top of the iris from inside the eye's own clip; `pair` hands the two
       eyes different colours; `prism` is a phase on the colour wheel rather than a colour. */
    { id: 'veins', name: 'Veins', tier: 'god', god: 'veins', c: '#f6e6e2', overlay: 'veins',
      lore: 'Strained through, and never rested. Whatever it has been watching, it has not stopped.' },
    { id: 'chimera', name: 'Chimera', tier: 'god', god: 'chimera', pair: ['#ffcf6b', '#8ad8f0'],
      lore: 'Two eyes that disagree about what colour they are. Neither of them will be talked round.' },
    { id: 'prism', name: 'Prism', tier: 'god', god: 'prism', prism: 0,
      lore: 'It will not settle on a colour. It has been through all of them and it is going again.' },
    { id: 'cosmos', name: 'Cosmos', tier: 'god', god: 'cosmos', c: '#0d0b1a', overlay: 'cosmos',
      lore: 'Not a surface — a window, with stars behind it, drifting the wrong way for this room.' },
  ],
  core: [
    { id: 'ash', name: 'Ash', tier: 'common', c: '#5a5045',
      lore: 'Neutral, patient, unremarkable — and it misses absolutely nothing.' },
    { id: 'pine', name: 'Pine', tier: 'common', c: '#2c8c5c',
      lore: 'A deep green centre. Half the Oglets ever counted have been looking out of one.' },
    { id: 'harbour', name: 'Harbour', tier: 'uncommon', c: '#26647f',
      lore: 'Deep-water blue, and about as easy to read as deep water.' },
    { id: 'wine', name: 'Wine', tier: 'uncommon', c: '#9e3a5e',
      lore: 'Dark red with the light still in it somewhere.' },
    { id: 'ochre', name: 'Ochre', tier: 'rare', c: '#a06418',
      lore: 'Earth pigment. The oldest colour anyone has ever painted anything with.' },
    { id: 'rust', name: 'Rust', tier: 'rare', c: '#9e3623',
      lore: 'Something left out in the weather for long enough to change its mind.' },
    { id: 'violet', name: 'Violet', tier: 'epic', c: '#553aa2',
      lore: 'A pupil the colour of a bruise on the sky, about an hour after the sun has gone.' },
    { id: 'olive', name: 'Olive', tier: 'epic', c: '#5b7418',
      lore: 'Green gone quiet. Olive-eyed Oglets are the ones that notice you were about to leave.' },
    { id: 'neon', name: 'Neon', tier: 'legendary', c: '#ff44b0',
      lore: 'It is not reflecting anything. That light is coming from the inside, and nobody knows why.' },
    { id: 'frost', name: 'Frost', tier: 'legendary', c: '#8adcea',
      lore: 'A pale cold centre. Whatever it is focused on is a long way behind you.' },
    { id: 'fire', name: 'Fire', tier: 'void', c: '#ff5c3a',
      lore: 'A burning pupil. Try not to still be looking when the lights go out.' },
    { id: 'pearl', name: 'Pearl', tier: 'void', c: '#e8e8f2',
      lore: 'A white pupil, which is the inversion of everything, and the rarest ordinary centre there is.' },

    /* ── God-line pupil colours ─────────────────────────────
       Named apart from the eye's God colours on purpose: an Oglet can carry one of each, and
       "Chimera eyes, Chimera pupils" tells you nothing about which is which. */
    { id: 'discord', name: 'Discord', tier: 'god', god: 'chimera', pair: ['#ff44b0', '#3ad6b0'],
      lore: 'One centre each, and they do not match. Whatever it is looking at, it is seeing twice.' },
    { id: 'spectrum', name: 'Spectrum', tier: 'god', god: 'prism', prism: 180,
      lore: 'The centre runs the whole wheel, half a turn behind whatever the eye around it is doing.' },
  ],
}

/* No mechanics table any more. A card used to print `width ×1.08 · height ×0.94` under the
   lore; it was true, and nobody wants the specification of a creature. */

/* The categorical genes, in the order they are encoded. Continuous genes are excluded from
   the odds because they always vary — nobody is lucky for having a slightly wider eye gap. */
/* Append new genes to the END: a first-release nine-character code has no character for one,
   and `decode()` reads the characters it has and defaults the rest. */
export const CATS = ['shape', 'pupil', 'iris', 'core']

/* Human labels for the Genome page, so the copy is not derived from the key name. */
export const CAT_LABELS = {
  shape: { title: 'Eye shape', note: 'silhouette' },
  pupil: { title: 'Pupil', note: 'the look' },
  iris: { title: 'Eye colour', note: 'the body of the eye' },
  core: { title: 'Pupil colour', note: 'the centre' },
}

/* Continuous genes and their ranges. One table, used by the roller, the encoder and the
   decoder, so the three can never drift apart. */
export const RANGES = {
  gap: [0.98, 1.12],
  pupilSize: [0.25, 0.33],
  pace: [0.8, 1.3],
  temper: [0.7, 1.4],
  sociable: [0.6, 1.4],
}

/** The continuous genes that get a character in the code, in order. */
export const CODED = ['gap', 'pupilSize', 'pace', 'temper', 'sociable']

/**
 * Weights are **derived**, never written. A tier is a share of every roll (see tiers.js), and a
 * band's share is split evenly between the mutations in it: two Commons at 60% is 30% each.
 * Add a mutation to a band and every weight in that band moves — which is the point. Nobody
 * hand-tunes a percentage, and the odds printed on a card are always the real ones.
 */
function assignWeights() {
  for (const alleles of Object.values(GENES)) {
    for (const tier of TIERS) {
      const inBand = alleles.filter((a) => a.tier === tier.id)
      for (const allele of inBand) allele.w = tier.spawn / inBand.length
    }
  }
}
assignWeights()

/** Never throws and never returns undefined: an unknown id degrades to the common allele. */
export const geneOf = (cat, id) => GENES[cat].find((x) => x.id === id) || GENES[cat][0]
