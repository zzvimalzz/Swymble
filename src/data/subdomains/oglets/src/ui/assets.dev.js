/* ═══════════════════════════════════════════════════════════
   ASSETS — everything the site can draw, on one page. **Temporary.**

   Not documentation and not a product page: a contact sheet. Every expression and every stage of
   every shell, live, at a size you can actually judge, so a change to one of them can be looked at
   rather than waited for. It replaced the Moods page, which had grown into an essay about the
   emotion system when what was actually wanted was the pictures.

   To remove it: this file, `styles/assets.css`, the `assets` entry in `ui/router.js`, and the
   lines it owns in `index.html` and `main.js`. Nothing else imports it.

   Everything below is read from the source — `EXPRESSIONS`, `EGG_STAGES`, `SHELLS` — so the sheet
   cannot fall out of step with what the site actually draws.
   ═══════════════════════════════════════════════════════════ */

import { useDevStyles } from '../core/dev.js'
import { BEATS } from '../behaviour/beats.js'
import { MONO_EYE } from '../core/theme.js'
import { DILATION, EXPRESSIONS } from '../emotions/expressions.js'
import { COMBO_COUNT, GENES, chanceText, comboIds, comboScore, geneOf, hash, tierOfAllele } from '../genome/index.js'
import { EGG_STAGES, SHELLS } from '../render/egg.js'
import { mine } from '../state/session.js'
import { EggThumb, HatchThumb, PORTRAIT_SCALE, Thumb } from './thumbs.js'

/** One line each, and only what a picture cannot say for itself. */
const FACES = {
  neutral: 'The floor. Everything returns here.',
  happy: 'Held, or mid-chase. The bell is what makes it a smile.',
  petted: 'Being stroked. The one mostly-shut face allowed.',
  crazy: 'Over-excited. The pupils swing out of phase.',
  angry: 'Shaken, or jabbed past annoy 0.5.',
  sad: 'It gave up on you, or you ignored it.',
  crying: 'Half the times it gives up. Tears carry it.',
  focus: 'Making something out. Never a mood.',
  thinking: 'Away with it, and the marks say so.',
  startled: 'Woken, or something moved. Brief on purpose.',
  sleepy: 'Left alone, or worn out from playing.',
  asleep: 'Eight seconds of sleepy.',
}

/** A Thumb pinned to one face, with its channel already up so the first paint is the real thing. */
class FaceThumb extends Thumb {
  constructor(genome, size, face) {
    super(genome, size, { scale: PORTRAIT_SCALE })
    this.mood = face
    this.body.asleep = face === 'asleep'
    this.body.drowsy = face === 'sleepy' || face === 'asleep'
    this.body.expr = face
    this.body.think = face === 'thinking' ? 1 : 0
    this.body.cry = face === 'crying' ? 1 : 0
    this.body.giddy = face === 'crazy' ? 1 : 0
    this.body.love = face === 'petted' ? 1 : 0
  }

  idle(t) {
    const B = this.body
    B.expr = this.mood
    B.exprUntil = 1e9
    if (t <= this.next) return
    this.next = t + (this.mood === 'asleep' ? 6 : 2.8)
    if (this.mood === 'asleep') return
    const r = this.mood === 'thinking' ? 0.55 : 0.72
    B.S.tx = (Math.random() * 2 - 1) * r
    B.S.ty = (this.mood === 'thinking' ? -0.5 : 0) + (Math.random() * 2 - 1) * r * 0.4
    B.glance(B.S.tx, B.S.ty)
  }
}

const el = (tag, cls, html) => {
  const node = document.createElement(tag)
  if (cls) node.className = cls
  if (html != null) node.innerHTML = html
  return node
}

function section(host, kicker, title, note) {
  const s = el('section', 'as-sec')
  s.append(el('p', 'kicker', kicker), el('h2', 'as-h', title))
  if (note) s.append(el('p', 'as-note', note))
  host.appendChild(s)
  return s
}

/* ── the faces ──────────────────────────────────────────── */

function faces(host, thumbs) {
  const names = Object.keys(EXPRESSIONS)
  const s = section(host, `${names.length} expressions`, 'Faces',
    'Your own Oglet, one card per face. The numbers under each are the whole expression — four lid heights, the bell, the scale, the tilt and the pupil — and every one of them is sprung, so a face is always arriving rather than being swapped in.')
  const grid = el('div', 'as-grid')

  for (const face of names) {
    const X = EXPRESSIONS[face]
    const thumb = new FaceThumb(mine.genome, 148, face)
    thumbs.push(thumb)

    const card = el('article', 'as-card')
    const stage = el('div', 'orb as-stage')
    stage.appendChild(thumb.canvas)
    card.append(stage, el('h3', 'as-name', face))
    card.append(el('p', 'as-why', FACES[face] ?? ''))
    card.append(el('dl', 'as-nums', `
      <div><dt>lid ↑</dt><dd>${X.li.toFixed(2)} / ${X.lo.toFixed(2)}</dd></div>
      <div><dt>lid ↓</dt><dd>${X.bi.toFixed(2)} / ${X.bo.toFixed(2)}</dd></div>
      <div><dt>bell</dt><dd>${(X.bell ?? 0).toFixed(2)}</dd></div>
      <div><dt>scale</dt><dd>${X.w.toFixed(2)} × ${X.h.toFixed(2)}</dd></div>
      <div><dt>tilt</dt><dd>${X.tilt.toFixed(2)}</dd></div>
      <div><dt>pupil</dt><dd>×${(DILATION[face] ?? 1).toFixed(2)}</dd></div>`))
    grid.appendChild(card)
  }
  s.appendChild(grid)
}

/* ── the shells ─────────────────────────────────────────── */

function shells(host, thumbs) {
  const tiers = Object.keys(SHELLS)
  const s = section(host, `${tiers.length} shells × ${EGG_STAGES.length} stages`, 'Eggs',
    'Every shell at every stage. A shell is drawn from the tier of the creature inside it and patterned from that creature\'s own seed, so the row across is one egg going and the column down is what the seven look like side by side. The last three glow.')

  for (const tier of tiers) {
    const shell = SHELLS[tier]
    const head = el('h3', 'as-sub', `${shell.name} <em>${shell.pattern}${shell.heat > 0 ? ` · heat ${shell.heat}` : ''}</em>`)
    const row = el('div', 'as-eggrow')

    for (const stage of EGG_STAGES) {
      const cell = el('div', 'as-eggcell')
      const thumb = new EggThumb(
        { tier, seed: hash(`egg-sheet:${tier}`), cracks: stage.cracks, open: stage.open },
        176,
      )
      thumbs.push(thumb)
      cell.append(thumb.canvas, el('span', 'as-cap', stage.label))
      row.appendChild(cell)
    }
    s.append(head, row)
  }
}

/* ── the whole hatch, seven times over ──────────────────── */

/**
 * A genome that actually scores as the given tier, so the creature that comes out matches the
 * shell it came out of. Found by walking the combination space rather than guessed: every tier is
 * reachable, and taking the *first* match makes the sheet identical on every device.
 */
function comboForTier(tierId) {
  for (let n = 0; n < COMBO_COUNT; n++) {
    if (comboScore(n).tier.id === tierId) return { ...CANON, ...comboIds(n) }
  }
  return { ...CANON, ...comboIds(0) }
}

/** The continuous genes, pinned — the same set the gallery pins, and for the same reason. */
const CANON = { gap: 1.05, pupilSize: 0.29, asymW: 1, asymH: 1, pace: 1, temper: 1.05, sociable: 1 }

function hatching(host, thumbs) {
  const tiers = Object.keys(SHELLS)
  const s = section(host, `${tiers.length} × ${HatchThumb.CYCLE}s, looping`, 'Hatching',
    'The whole sequence, one per tier, on a loop: the shell rocking, the cracks stepping in on a beat, the break, and the creature that was in it looking around. A compressed rehearsal of what `ui/hatch.js` does over five minutes — the real one can only happen once per browser, which makes it impossible to look at while working on it. The creature in each is one that genuinely scores at that tier.')

  const row = el('div', 'as-hatchrow')
  for (const tier of tiers) {
    const cell = el('div', 'as-hatchcell')
    const thumb = new HatchThumb(
      { genome: comboForTier(tier), tier, seed: hash(`hatch-sheet:${tier}`) },
      216,
    )
    thumbs.push(thumb)
    const shell = SHELLS[tier]
    cell.append(thumb.canvas, el('span', 'as-cap', shell.name))
    row.appendChild(cell)
  }
  s.appendChild(row)
}

/* ── the bodies ─────────────────────────────────────────── */

/**
 * Every body, against the eye shapes most likely to break it.
 *
 * Five columns rather than fourteen, chosen to span the extremes rather than to be complete:
 * **Round** is the baseline, **Bean** is wide and low, **Arch** is tall and square-shouldered,
 * **Diamond** is the pointiest thing in the table, and **Slab** is the widest — at 1.24 half-widths
 * it is the shape that reaches furthest out at full gaze and therefore the one a body clips first.
 * If Slab survives every body, nothing else has anything to worry about.
 *
 * Drawn in ink and pearl, like every other silhouette card on the site: a body card is about the
 * outline, and the colour genes are the only place a hue is on trial. The strip underneath is the
 * exception, and it exists because a body's colour is *derived* from its eye — that is the one
 * thing this grid cannot show.
 */
const BODY_EYES = ['round', 'bean', 'arch', 'diamond', 'slab']
/** Eye colours for the tone strip. Deliberately spans pale to nearly-black — see `bodyTone`. */
const BODY_TONES = ['bone', 'moss', 'lagoon', 'cobalt', 'siren', 'ember']

const bodyGenome = (bodyId, shapeId, irisId = 'bone') => ({
  shape: shapeId, pupil: 'dot', iris: irisId, core: 'ash', body: bodyId,
  gap: 1.05, pupilSize: 0.29, asymW: 1, asymH: 1, pace: 1, temper: 1.05, sociable: 1,
})

function bodies(host, thumbs) {
  const all = GENES.body
  const wearing = all.filter((a) => a.form)
  const s = section(host, `${wearing.length} bodies · ${chanceText(1 - all[0].w)} of Oglets`, 'Bodies',
    'The rarest thing an Oglet can have, and the only sparse gene: Bare holds 98.5% of every roll and the ten below share the rest. Down the side is the body; across is the eye shape it has to hold — the last column, Slab, is the widest eye in the table and the one a narrow body clips first. An eye cut by its own silhouette is the point, not a fault: the eyes are the holes the body is made of, which is the only way a species with no body is allowed to have one.')

  const grid = el('div', 'as-bodygrid')
  const head = el('div', 'as-bodyrow as-bodyhead')
  head.appendChild(el('span', 'as-cap', ''))
  for (const eye of BODY_EYES) head.appendChild(el('span', 'as-cap', geneOf('shape', eye).name))
  grid.appendChild(head)

  for (const allele of wearing) {
    const tier = tierOfAllele(allele)
    const row = el('div', 'as-bodyrow')
    row.appendChild(el('span', 'as-bodyname',
      `${allele.name}<em>${tier.name} · ${chanceText(allele.w)}</em>`))
    for (const eye of BODY_EYES) {
      const thumb = new Thumb(bodyGenome(allele.id, eye), 140, { scale: PORTRAIT_SCALE, palette: MONO_EYE })
      thumbs.push(thumb)
      row.appendChild(thumb.canvas)
    }
    grid.appendChild(row)
  }
  s.appendChild(grid)

  /* The tone strip: one body, six eye colours. A body has no colour gene — it is derived from the
     eye's, thrown to the far side of it in lightness so a pale eye gets a deep body and a dark one
     gets a pale body. Ember is the case that made the guard necessary. */
  s.append(el('h3', 'as-sub', 'And the colour it takes <em>derived from the eye, never rolled</em>'))
  const strip = el('div', 'as-bodygrid')
  const row = el('div', 'as-bodyrow')
  row.appendChild(el('span', 'as-bodyname', 'Cloud<em>one body, six eyes</em>'))
  for (const iris of BODY_TONES) {
    const thumb = new Thumb(bodyGenome('cloud', 'round', iris), 140, { scale: PORTRAIT_SCALE })
    thumbs.push(thumb)
    row.appendChild(thumb.canvas)
  }
  strip.appendChild(row)
  s.appendChild(strip)
}

/* ── the beats ──────────────────────────────────────────── */

/**
 * A Thumb that replays one beat forever, with a pause between passes.
 *
 * The real triggers are rare on purpose — a sneeze is one per ninety seconds and Orbit needs an
 * Oglet to lose the plot at catch — which makes all three effectively impossible to *look at*
 * while working on them. Same reason `HatchThumb` exists.
 */
class BeatThumb extends Thumb {
  constructor(genome, size, def, opts) {
    super(genome, size, opts)
    this.def = def
    this.gap = Number.isFinite(def.dur) ? def.dur + 1.1 : 0
    this.at = -1
  }

  tick(dt, t) {
    if (!this.onScreen) return
    const tt = t + this.phase
    if (this.gap) {
      // one-shot: restart it on a loop, through the same `play()` the world uses
      if (tt - this.at > this.gap) {
        this.at = tt
        this.body.play(this.def, tt)
      }
    } else {
      this.body.comet = 1 // sustained: it lasts as long as its cause, and here its cause is us
    }
    this.idle(tt)
    this.body.update(dt, tt)
    this.render(tt)
  }
}

const BEAT_WHY = {
  orbit: 'Six rings, entering one at a time. Worn on <em>crazy</em> — over-excited past the point of sense, which is earned by playing catch and never by anything unpleasant.',
  burst: 'It comes apart and puts itself back together, and nothing caused it. A sneeze: the rare one-off, about one every ninety seconds. Deliberately not the shake — mistreatment already has an outcome, and it should not be the best-looking thing on the site.',
  comet: 'Four ribbons orbiting it while it moves fast. The only one of the three that is a state rather than a script, so it ramps and lasts exactly as long as the speed does. <strong>The dot does not move</strong> — the trail orbits it.',
}

function beats(host, thumbs) {
  const list = Object.values(BEATS)
  const s = section(host, `${list.length} beats`, 'Beats',
    'Short scripted events, each a pure function of its own local time. Looping here because the real triggers are rare by design and otherwise impossible to look at. Every one is drawn in <em>two</em> passes — half of each ring before the creature and half after, so the creature occludes the middle of it. That depth sort is the whole difference between an orbit and a drawing of one, and it is why these are not the glow gene again.')

  const row = el('div', 'as-beatrow')
  for (const def of list) {
    const cell = el('div', 'as-beatcell')
    const thumb = new BeatThumb({ ...CANON, ...comboIds(0) }, 216, def, { scale: PORTRAIT_SCALE * 0.78 })
    thumbs.push(thumb)
    cell.append(thumb.canvas, el('h3', 'as-name', def.id), el('p', 'as-why', BEAT_WHY[def.id] ?? ''))
    row.appendChild(cell)
  }
  s.appendChild(row)
}

/** Builds the page once. Push its thumbs into `thumbs` and tick them while the route is on. */
/* This page brings its own stylesheet: `index.html` must not link it, because the build strips
   every `*.dev.*` file and a static link to a stripped file is a 404 on every production load. */
useDevStyles('./src/styles/assets.dev.css')

export function buildAssetsPage(host, thumbs) {
  host.innerHTML = ''
  const head = el('header', 'as-top')
  head.append(
    el('p', 'kicker', 'contact sheet · temporary'),
    el('h1', 'as-title', 'Assets'),
    el('p', 'as-lede', 'Everything the site draws, live, at a size worth judging. Built to look at rather than to read — not a product page, and meant to be deleted.'),
  )
  host.appendChild(head)
  beats(host, thumbs)
  bodies(host, thumbs)
  faces(host, thumbs)
  hatching(host, thumbs)
  shells(host, thumbs)
}
