/* ═══════════════════════════════════════════════════════════
   SOULLESS — a theme, and deliberately not a gene.

   **Nothing here is rolled, weighted, encoded or scored.** A Soulless is not a mutation an Oglet
   can carry; it is a way of drawing the whole creature, and it replaces every visible gene at once
   — the eye shape, both colours, the pupil and the body. That is why it lives in `render/` next to
   the thing that draws it rather than in `genome/`, why it never enters `odds()`, and why it has
   no tier: `.docs/OGLETS.md` §11 draws exactly this line for marks, and the reasoning carries. The
   moment a theme has a weight, "rarity comes only from allele weight" quietly stops being true.

   What it looks like is the x.ai avatar, which is what `bloub` reproduces: **one filled shape and
   two holes.** A white body on the dark well, eyes that are plain circles in ink, and no pupil at
   all. Everything an ordinary Oglet says with colour, this says with nothing.

   The eyes are smaller and sit closer together than a genome's, and both numbers are the reason it
   reads as that avatar rather than as an Oglet in a white coat: a pair of eyes taking up half the
   body is a creature, and a pair taking up a fifth of it is a face on an object.

   **Expressions are still the ordinary ones** — the lids, the bell, the blink and the gaze all
   work unchanged, because they are geometry rather than colour. A Soulless has no pupil, so
   dilation, vergence, sway and the pupil's lag say nothing here, and roughly half the vocabulary
   in `.docs/OGLETS.md` §6 is spent before the face opens its mouth. That is the piece still to design.
   ═══════════════════════════════════════════════════════════ */

import { soullessIndex } from '../genome/index.js'

/** The body. Not pure white: `--well` is `#070708`, and pure white on it rings. */
export const CHALK = '#f2efe6'
/** The eyes, and everything else the creature says. */
export const SOOT = '#0b0b0d'

/**
 * A placeholder `shape` allele, so nothing that reads `Body.shape` has to know a theme exists.
 * Its numbers are never drawn — `SOUL_FACES` supplies the geometry — but `Body.spread`,
 * `Body.radius` and `eyeCentres` all read `rx`/`ry`, and they should read something sane.
 */
export const SOULLESS_EYE = { id: 'soulless', name: 'Soulless', rx: 0.5, ry: 0.72,
  kT: 0.5523, kO: 0.5523, kB: 0.5523, kI: 0.5523 }

/* ═══════════════════════════════════════════════════════════
   THE FACE — shape instead of lids.

   **An ordinary Oglet expresses with lids over a fixed eye; a Soulless expresses by BEING a
   different shape.** It has no pupil, so dilation, vergence, sway and the pupil's lag all say
   nothing, and a lid clipped across a capsule takes a bite out of the one thing carrying the
   emotion. So the lid system is off here and each eye is a capsule whose width, height and tilt
   are the expression.

   Everything below is measured off bloub (`src/bot/expressions.ts`), in **its** units: `w` and `h`
   are the full width and height of the capsule in ball-radii, on a ball of radius 1. `Body`
   converts by halving and scaling to `BODY_UNIT`, so these numbers stay directly comparable to the
   source they came from and can be checked against it.

   Four levers, and the fourth is the one that matters most:

     w        the short axis. 0.8× to 2.7× neutral is the usable envelope.
     h        the long axis. 0.3× to 1.5×.
     tilt     degrees, positive = the top of the capsule goes right. **Mirrored between the eyes.**
     squash   a vertical screen-space squeeze, the same mechanism as a blink. Only `sleepy` uses it.
     bow      how far the middle of the eye arches UP. This is the smile, and it is the one lever
              bloub does not have — see below.

   **`tilt` is what makes anger and sadness possible at all.** They need the two eye-tops to
   converge and to diverge — a head roll leans both the same way and can only ever say "tilted".
   A mirrored pair says something.

   **And a closed eye is not an open eye squashed.** bloub measures its wink as a dash that is
   *wider* than the open eye (0.447 against 0.236). `asleep` follows that: it gets wider as it
   shuts, which is what stops a shut eye reading as a missing one.
   ═══════════════════════════════════════════════════════════ */

/** Both eyes the same, tilts mirrored — bloub's `pair()`. */
const pair = (w, h, tilt = 0, squash = 1, bow = 0) => [
  { w, h, tilt, squash, bow },
  { w, h, tilt: -tilt, squash, bow },
]

export const SOUL_FACES = {
  /** bloub's `neutre`, relieved image by image off the reference. A tall pill, not a circle. */
  neutral: pair(0.186, 0.412),
  /** HAPPY — an arch, not a tilt.

      bloub says this with `heureux` (0.27 × 0.17 at 14°) and says *anger* with `colere` (0.34 × 0.15
      at 30°), and on a face with no pupils those are the same shape at two angles: a narrowed
      capsule leaning. It read as a second scowl. A lidded Oglet does not have this problem because
      its smile is the lower lid arching into a dome (`lidPath`'s bell) — so the fix is to give the
      eye itself the arch. Tilt goes to zero and `bow` does all of it. */
  happy: pair(0.4, 0.145, 0, 1, 0.5),
  /** `colere` — the same arcs pushed to 30°, and wider. Converging tops read as a scowl. */
  angry: pair(0.34, 0.15, 30),
  /** `triste` — the mirror of anger: tops diverge, and the eye stays tall rather than narrowing. */
  sad: pair(0.22, 0.4, -28),
  /** Crying **opens**, exactly as the lidded version does: a shallower droop and a taller eye than
      sad, because `render/tears.js` is carrying the rest of it. */
  crying: pair(0.26, 0.46, -20),
  /** `somnolent` — half-shut through the squash channel, so it reads as weight rather than as a
      different eye. The only face that uses it. */
  sleepy: pair(0.2, 0.42, 0, 0.42),
  /** Shut. Wider than open, per bloub's wink measurement — a shut eye is a dash, not a gap. */
  asleep: pair(0.44, 0.085),
  /** `blase`'s slits, straightened: narrowed to sharpen up rather than to look away. */
  focus: pair(0.28, 0.15),
  /** `confus` — the one deliberately **asymmetric** face, on both axes at once. One eye tall and
      drooping, one narrowed and lifted. It says "working something out" better than any symmetric
      arrangement can, and `render/thoughts.js` carries the rest. */
  thinking: [{ w: 0.2, h: 0.44, tilt: -18, squash: 1 }, { w: 0.28, h: 0.17, tilt: 14, squash: 1 }],
  /** `hilare`, undone by it: flatter and arched harder than happy, with a little lean left in. */
  petted: pair(0.34, 0.095, 0, 1, 0.92),
  /** `surpris` — everything open at once, and nearly round. */
  startled: pair(0.45, 0.47),
  /** `excite`. The two eyes then swell **out of phase** in `Body`, which is the same trick the
      pupils play on a lidded Oglet and the only thing here the two eyes ever disagree about. */
  crazy: pair(0.4, 0.56, -10),
}

export const soulFace = (name) => SOUL_FACES[name] ?? SOUL_FACES.neutral

/**
 * The themes. `form` names a silhouette in `render/silhouette.js#FORMS`, the same catalogue the
 * `body` gene draws from — Pebble is here and *not* in that gene, which is the point of the two
 * being separate lists.
 *
 * `gap` multiplies the gap gene. Below 1 because the eyes have to sit well inside a body this
 * large; at 1 they read as an Oglet standing in front of a white shape rather than as one drawn
 * out of it.
 *
 * `travel` multiplies how far a gaze of ±1 turns the head, and `phi` is half the angle between
 * the eyes on the sphere they are painted on — **the second of those is the one that matters.**
 *
 * Resting separation is `sin(φ)·Rh` and `Rh` is `half/sin(φ)`, so it cancels: where the eyes sit
 * at rest depends only on `gap`. What φ decides is the size of the head under them, and a smaller
 * φ is a bigger head — so the same turn carries the eyes further across the creature and
 * foreshortens the far one harder. Raising `travel` alone barely moved them, because `nx` was
 * already close to its ceiling of 1; dropping φ from 0.42 to 0.28 is what actually opened it up.
 *
 * An ordinary Oglet does not want this: it *is* its eyes, so a small turn is already the whole
 * creature moving. A Soulless is a face on a body with a great deal of room around it.
 */
export const SOULLESS = [
  {
    id: 'circle',
    name: 'Circle',
    form: 'circle',
    gap: 0.86,
    travel: 1.35,
    phi: 0.28,
    lore: 'The shape everything else here is a departure from. Nothing about it is trying to be anything.',
  },
  {
    id: 'cloud',
    name: 'Cloud',
    form: 'cloud',
    gap: 0.84,
    travel: 1.4,
    phi: 0.27,
    lore: 'The same weather, drained of it. Whatever a Cloud Oglet is warm about, this one is not.',
  },
  {
    id: 'pebble',
    name: 'Pebble',
    form: 'pebble',
    gap: 0.86,
    travel: 1.35,
    phi: 0.28,
    lore: 'Worn round by the same river, and it has stopped mattering which. It does not look back at you.',
  },
  {
    /* The one Soulless that shares its shape with a God-line body, and the only one of the four
       that is never twice the same: `live` sends its outline through `breatheProfile` every frame,
       exactly as the Wisp body does. A thing with no soul that will not hold still is a better
       joke than either half on its own. */
    id: 'wisp',
    name: 'Wisp',
    form: 'wisp',
    live: 'wisp',
    gap: 0.86,
    travel: 1.35,
    phi: 0.28,
    lore: 'It has no shape and nothing behind the eyes either. Whatever is left is still moving.',
  },
]

export const soullessById = (id) => SOULLESS.find((t) => t.id === id) ?? null

/**
 * The theme an Oglet id draws, or `null` — which it is for all but one in ten million.
 *
 * The draw itself is in `genome/derive.js`, on its own stream, so this file stays about *drawing*
 * and the genome layer keeps the one thing it is for: everything about a creature is a pure
 * function of its id, and adding this disturbed nobody.
 */
export const soulOf = (id) => SOULLESS[soullessIndex(id, SOULLESS.length)] ?? null

/**
 * A genome for a Soulless. Every categorical gene here is overridden by the theme, so the values
 * are placeholders — but the *continuous* ones are not: `gap` sets the eye spacing, `pace` the
 * blink rate, and `asymW`/`asymH` the tiny left-right difference that keeps it from looking
 * printed. Pinned, so every card is the same creature wearing a different shape.
 */
export const soullessGenome = () => ({
  shape: 'round', pupil: 'dot', iris: 'bone', core: 'ash', body: 'bare',
  gap: 1.05, pupilSize: 0.29, asymW: 1, asymH: 1, pace: 1, temper: 1.05, sociable: 1,
})
