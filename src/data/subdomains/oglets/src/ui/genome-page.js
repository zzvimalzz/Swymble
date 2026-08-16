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
  combinations,
  geneOf,
  groupId,
  odds,
  rarityOf,
  tierOfAllele,
} from '../genome/index.js'
import { discover, isFound, progressOf, totalProgress } from '../state/dex.js'
import { mine } from '../state/session.js'
import { createSheet } from './sheet.js'
import { paletteFor, specimen } from './specimen.js'
import { PORTRAIT_SCALE, PupilThumb, Thumb } from './thumbs.js'

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
  const thumb = new Thumb(mine.genome, 176, { scale: PORTRAIT_SCALE, expressive: true })
  thumbs.push(thumb)

  const chance = odds(mine.genome)
  const { traits, tier } = rarityOf(mine.genome)

  const section = document.createElement('section')
  section.className = 'mine'

  const stage = document.createElement('div')
  stage.className = 'orb orb-lg mine-stage'
  stage.appendChild(thumb.canvas)

  const body = document.createElement('div')
  body.className = 'mine-body'
  body.innerHTML = `
    <h2 class="mine-name">${mine.name}</h2>

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

  const copy = body.querySelector('.idcopy')
  copy.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(mine.id)
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

  host.insertAdjacentHTML(
    'beforeend',
    `<p class="note">${combinations().toLocaleString()} combinations. A trait is rare because
      it is rare, not because a table says so.</p>`,
  )

  ctx.refreshProgress()
}
