/* ═══════════════════════════════════════════════════════════
   THE GENOME PAGE.

   Your Oglet first, at size, with its id and its verdict — the page is about the creature you
   have, not about the catalogue. The catalogue is underneath it, and every card in it is a live
   render of the real genome with one mutation changed.

   Copy is kept to the bone here: a label that only restates what is already on screen is noise.
   The story lives in the card you open, not on the page you scroll past.
   ═══════════════════════════════════════════════════════════ */

import {
  CATS,
  CAT_LABELS,
  GENES,
  chanceText,
  SOULLESS_CHANCE,
  SOULLESS_TIER,
  TIERS,
  geneOf,
  groupId,
  hash,
  odds,
  rarityOf,
  tierOfAllele,
} from '../genome/index.js'
import { SHELLS } from '../render/egg.js'
import { SOULLESS, soulOf, soullessGenome } from '../render/soulless.js'
import { discover, isFound, progressOf, totalProgress } from '../state/dex.js'
import { mine, rename, shareCode } from '../state/session.js'
import { createSheet } from './sheet.js'
import { paletteFor, specimen } from './specimen.js'
import { EggThumb, PORTRAIT_SCALE, PupilThumb, Thumb } from './thumbs.js'

/** A pupil card shows the pupil alone; everything else shows the whole creature. */
const thumbFor = (cat, alleleId, size) => {
  const genome = specimen(cat, alleleId)
  const palette = paletteFor(cat, alleleId)
  return cat === 'pupil'
    ? new PupilThumb(genome, size, { palette })
    : new Thumb(genome, size, { scale: PORTRAIT_SCALE, palette })
}

const stars = (tier) => `<i class="stars ${tier.c}">${'★'.repeat(tier.stars)}</i>`
const dateOf = (ms) =>
  new Date(ms).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })

/* ── your Oglet ─────────────────────────────────────────── */

function hero(host, thumbs) {
  const mySoul = soulOf(mine.id)
  const thumb = new Thumb(mine.genome, 176, { scale: PORTRAIT_SCALE, expressive: true, theme: mySoul })
  thumbs.push(thumb)

  const chance = odds(mine.genome)
  /* A Soulless has no verdict of its own: rarity is scored from traits and it has replaced all of
     them with a rendering. So the verdict is simply what it is, and the trait tags below still
     list the genes underneath — they are still true, they are just not what you are looking at. */
  const { traits } = rarityOf(mine.genome)
  const tier = mySoul ? SOULLESS_TIER : rarityOf(mine.genome).tier

  const section = document.createElement('section')
  section.className = 'mine'

  const stage = document.createElement('div')
  stage.className = 'orb orb-lg mine-stage'
  stage.appendChild(thumb.canvas)

  const body = document.createElement('div')
  body.className = 'mine-body'
  /* **The name is the one thing here you can change**, so it is an input rather than a heading —
     it looks like the heading it replaced until you put a caret in it, which is what stops the
     page growing a button to say something the field can say by being editable. */
  body.innerHTML = `
    <label class="mine-rename">
      <span class="sr">Name</span>
      <input class="mine-name" value="${mine.name}" maxlength="18" spellcheck="false"
             autocomplete="off" aria-label="Your Oglet's name">
    </label>

    <p class="verdict-head"><span class="${tier.c}">${tier.name}</span> ${stars(tier)}</p>

    <ul class="tags">
      ${traits
        .map(
          (t) =>
            `<li class="tag ${t.tier.c}" title="${CAT_LABELS[t.cat].title}">${t.allele.name}<em>${chanceText(t.weight)}</em></li>`,
        )
        .join('')}
    </ul>

    <p class="verdict-line">1 in ${Math.round(1 / chance).toLocaleString()}</p>

    <div class="idblock">
      <p class="kicker">Oglet ID</p>
      <code class="idcode">${groupId(mine.id)}</code>
      <button class="btn btn-quiet idcopy" type="button">Copy</button>
    </div>

    <p class="since">Yours since ${dateOf(mine.born)}</p>`

  /* Committed on blur and on Enter rather than on every keystroke: a name is a decision, and
     writing storage once per character would also mean the world's Zzz changing mid-word. */
  const field = body.querySelector('.mine-name')
  const commit = () => {
    field.value = rename(field.value)
  }
  field.addEventListener('blur', commit)
  field.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') field.blur()
    if (e.key === 'Escape') {
      field.value = mine.name
      field.blur()
    }
  })

  /* **Copying gives you `shareCode()`, not the bare id.** The id alone redraws the creature
     perfectly — it always has — but it cannot carry a name you chose, because the name is derived
     from the id rather than stored in it. A renamed Oglet therefore copies as `id~Name`, and an
     unrenamed one copies as exactly the id it always did. See `state/session.js#shareCode`. */
  const copy = body.querySelector('.idcopy')
  copy.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(shareCode())
      copy.textContent = 'Copied'
      setTimeout(() => (copy.textContent = 'Copy'), 1800)
    } catch {
      copy.textContent = mine.id.slice(0, 8) + '…'
    }
  })

  section.append(stage, body)
  host.appendChild(section)
}

/* ── the catalogue ──────────────────────────────────────── */

function mutationCard(cat, allele, ctx) {
  const el = document.createElement('button')
  el.type = 'button'
  el.className = 'card'
  el.dataset.cat = cat
  el.dataset.allele = allele.id

  const yours = mine.genome[cat] === allele.id
  if (yours) {
    el.classList.add('yours')
    el.title = 'Your Oglet carries this'
  }

  const stage = document.createElement('div')
  stage.className = 'orb card-stage'
  el.appendChild(stage)

  const meta = document.createElement('div')
  meta.className = 'card-meta'
  el.appendChild(meta)

  const tier = tierOfAllele(allele)

  const paintFound = () => {
    el.classList.remove('locked')
    const thumb = thumbFor(cat, allele.id, 104)
    ctx.thumbs.push(thumb)
    stage.replaceChildren(thumb.canvas)
    meta.innerHTML = `
      <span class="nm">${allele.name}</span>
      <span class="rr ${tier.c}">${tier.name}</span>
      ${stars(tier)}
      <span class="pc">${chanceText(allele.w)}</span>`
  }

  const paintLocked = () => {
    el.classList.add('locked')
    stage.innerHTML = '<span class="lock">?</span>'
    meta.innerHTML = `
      <span class="nm">Unmet</span>
      <span class="rr dim">Tap to meet</span>
      <i class="stars dim">${'☆'.repeat(tier.stars)}</i>
      <span class="pc">${chanceText(allele.w)}</span>`
  }

  if (isFound(cat, allele.id)) paintFound()
  else paintLocked()

  el.addEventListener('click', () => {
    if (!isFound(cat, allele.id)) {
      discover(cat, allele.id)
      paintFound()
      ctx.refreshProgress()
      el.animate([{ transform: 'scale(.94)' }, { transform: 'scale(1)' }], { duration: 260, easing: 'ease-out' })
      return
    }
    ctx.sheet.open(cat, allele.id)
  })

  return el
}

/* ── the eggs ───────────────────────────────────────────────
   Seven shells, one per tier, and the point of the row is that **the egg tells you what is in it**
   before it opens. Somebody who has already hatched theirs can come here and see what they were
   looking at for five minutes; somebody who has not yet can see what they are hoping for. */

/** What each shell is, in a line. The row shows the difference; this says what it means. */
const SHELL_LORE = {
  common: 'The shell most Oglets come in. Nothing on it is trying to tell you anything.',
  uncommon: 'It holds its bubbles for weeks without one of them breaking. Nobody has explained that.',
  rare: 'The bands move if you watch long enough, and stop the moment you look directly at them.',
  epic: 'Wrapped, rather than grown. Whatever did the wrapping did not leave an end to pull.',
  legendary: 'The veins run gold all the way through the shell, which should make it brittle. It is not.',
  void: 'Two colours that do not occur together anywhere else, and a shell that is cold to the touch.',
  god: 'It has been about to open since before you found it, and the cracks have never once cooled.',
  soulless: 'The Void shell with the colour taken out. Whatever is in it is not going to look back at you.',
}

/** A shell, opened. Its own viewer rather than `ui/sheet.js`, which is about mutations. */
function eggSheet(thumbs) {
  const root = document.createElement('div')
  root.className = 'sheet'
  root.hidden = true
  root.innerHTML = `
    <div class="sheet-scrim" data-close></div>
    <div class="sheet-card egg-card" role="dialog" aria-modal="true" aria-label="Egg">
      <button class="sheet-close" data-close aria-label="Close">×</button>
      <div class="egg-stage-lg"></div>
      <h3 class="egg-name"></h3>
      <p class="egg-kind"></p>
      <p class="egg-lore"></p>
    </div>`
  document.body.appendChild(root)

  const stage = root.querySelector('.egg-stage-lg')
  let live = null

  const close = () => {
    root.hidden = true
    document.body.classList.remove('sheet-open')
    if (live) {
      const at = thumbs.indexOf(live)
      if (at >= 0) thumbs.splice(at, 1)
      live = null
    }
    stage.replaceChildren()
  }

  root.addEventListener('click', (e) => {
    if (e.target.closest('[data-close]')) close()
  })
  addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !root.hidden) close()
  })

  return {
    open(tier, seed, isYours) {
      const shell = SHELLS[tier.id]
      live = new EggThumb({ tier: tier.id, seed, loop: true }, 200)
      thumbs.push(live)
      stage.replaceChildren(live.canvas)

      root.querySelector('.egg-name').textContent = `${tier.name} egg`
      root.querySelector('.egg-kind').innerHTML =
        `<span class="${tier.c}">${'★'.repeat(tier.stars)}</span> ${shell.pattern}${shell.heat > 0 ? ' · glowing' : ''}${isYours ? ' · yours' : ''}`
      root.querySelector('.egg-lore').textContent = SHELL_LORE[tier.id] ?? ''

      root.hidden = false
      document.body.classList.add('sheet-open')
      root.querySelector('.sheet-close').focus()
    },
  }
}

function eggs(host, thumbs) {
  /* Your shell is your verdict — except that a Soulless has no verdict, because it is not scored
     from traits. It gets its own tier and its own egg, and that egg only ever holds one thing. */
  const yours = soulOf(mine.id) ? SOULLESS_TIER : rarityOf(mine.genome).tier
  const shelves = [...TIERS, SOULLESS_TIER]
  const sheet = eggSheet(thumbs)

  const head = document.createElement('h2')
  head.className = 'gene-head'
  head.innerHTML = `
    <span class="gene-title">Eggs</span>
    <span class="gene-note">what it was in</span>
    <span class="gene-count">${shelves.length} shells</span>`

  const rule = document.createElement('div')
  rule.className = 'gene-bar'

  const row = document.createElement('div')
  row.className = 'eggrow'

  for (const tier of shelves) {
    const card = document.createElement('button')
    card.type = 'button'
    card.className = 'eggcard'
    card.dataset.tier = tier.c

    /* Each shell is drawn from a fixed seed per tier so the row is stable between visits — except
       yours, which uses your own Oglet's seed, so the one you actually had is the one you see. */
    const isYours = tier.id === yours.id
    const seed = isYours ? hash(`egg:${mine.id}`) : hash(`egg-sample:${tier.id}`)
    /* Looping, so the row is seven shells *failing* rather than seven swatches. Each one is
       phased off its own random offset, so they never split in unison. */
    const thumb = new EggThumb({ tier: tier.id, seed, loop: true }, 108)
    thumbs.push(thumb)
    card.addEventListener('click', () => sheet.open(tier, seed, isYours))

    const label = document.createElement('span')
    label.className = `nm ${tier.c}`
    label.textContent = tier.name

    card.append(thumb.canvas, label)
    if (isYours) {
      const note = document.createElement('span')
      note.className = 'yours'
      note.textContent = 'yours was this one'
      card.appendChild(note)
    }
    row.appendChild(card)
  }

  host.append(head, rule, row)
}

/* ── the Soulless ───────────────────────────────────────────
   A category on this page that is **not a gene**. Nothing here is rolled, weighted or scored, and
   none of it enters the dex — a Soulless is a way of drawing the whole creature, not a mutation it
   can carry, and `render/soulless.js` explains why that distinction is load-bearing rather than
   pedantic. It is placed after the genes and before the eggs, because it is the one section on
   this page that is about how an Oglet is *drawn* rather than what it is. */

function soulless(host, thumbs, ctx) {
  const mySoul = soulOf(mine.id)
  const head = document.createElement('h2')
  head.className = 'gene-head'
  head.innerHTML = `
    <span class="gene-title">Soulless</span>
    <span class="gene-note">not a mutation</span>
    <span class="gene-count">${chanceText(SOULLESS_CHANCE)}</span>`

  const rule = document.createElement('div')
  rule.className = 'gene-bar'

  const grid = document.createElement('div')
  grid.className = 'grid'

  for (const theme of SOULLESS) {
    const card = document.createElement('button')
    card.type = 'button'
    card.className = 'card'
    // the same light in the corner a mutation you carry gets — and nobody will ever see it
    if (mySoul?.id === theme.id) {
      card.classList.add('yours')
      card.title = 'You are this'
    }

    const stage = document.createElement('div')
    stage.className = 'orb card-stage'
    const thumb = new Thumb(soullessGenome(), 104, { scale: PORTRAIT_SCALE, theme })
    thumbs.push(thumb)
    stage.appendChild(thumb.canvas)

    /* The same three lines a mutation card carries, because a reader comparing them should not
       have to work out that this one is measured differently. The occurrence shown is the chance
       of being Soulless **at all** rather than of being this particular one: which of the three
       you get is a coin toss after a one-in-ten-million, and the ten million is the number. */
    const meta = document.createElement('div')
    meta.className = 'card-meta'
    meta.innerHTML = `
      <span class="nm">${theme.name}</span>
      <span class="rr ${SOULLESS_TIER.c}">${SOULLESS_TIER.name}</span>
      ${stars(SOULLESS_TIER)}
      <span class="pc">${chanceText(SOULLESS_CHANCE)}</span>`

    card.append(stage, meta)
    card.addEventListener('click', () => ctx.sheet.openSoul(theme))
    grid.appendChild(card)
  }

  host.append(head, rule, grid)
}

function section(host, cat, ctx) {
  const label = CAT_LABELS[cat]

  const head = document.createElement('h2')
  head.className = 'gene-head'
  head.innerHTML = `
    <span class="gene-title">${label.title}</span>
    <span class="gene-note">${label.note}</span>
    <span class="gene-count" data-progress="${cat}"></span>`
  host.appendChild(head)

  const bar = document.createElement('div')
  bar.className = 'gene-bar'
  bar.innerHTML = `<span data-bar="${cat}"></span>`
  host.appendChild(bar)

  const grid = document.createElement('div')
  grid.className = 'grid'
  for (const allele of GENES[cat]) grid.appendChild(mutationCard(cat, allele, ctx))
  host.appendChild(grid)
}

export function buildGenomePage(host, thumbs) {
  host.innerHTML = ''

  const ctx = {
    thumbs,
    sheet: createSheet(thumbs),
    refreshProgress() {
      for (const cat of CATS) {
        const { found, total } = progressOf(cat)
        const count = host.querySelector(`[data-progress="${cat}"]`)
        const bar = host.querySelector(`[data-bar="${cat}"]`)
        if (count) count.textContent = `${found} / ${total}`
        if (bar) bar.style.width = `${(found / total) * 100}%`
      }
      const all = host.querySelector('[data-progress="all"]')
      if (all) {
        const { found, total } = totalProgress()
        all.textContent = `${found} of ${total} mutations met`
      }
    },
  }

  hero(host, thumbs)

  const dexHead = document.createElement('p')
  dexHead.className = 'dexline'
  dexHead.innerHTML = '<span data-progress="all"></span>'
  host.appendChild(dexHead)

  for (const cat of CATS) section(host, cat, ctx)
  soulless(host, thumbs, ctx)
  eggs(host, thumbs)


  ctx.refreshProgress()
}
