/* ═══════════════════════════════════════════════════════════
   THE GALLERY — every combination there is.

   Not a sample and not a shuffle: all 46,648 arrangements of the four categorical genes, in
   order, commonest first, numbered by position. `genome/combos.js` addresses the space by number
   and sorts it; this page is the window onto it.

   **It is virtualised, because it has to be.** 46,648 live canvases is gigabytes and a locked
   tab. About fifty pooled cards are positioned absolutely inside a spacer the full height of the
   wall and re-pointed as you scroll (`Thumb.retarget`), so scrolling allocates nothing. The card
   you are looking at is the real renderer with a real Body, exactly as on every other page.

   A combination is the four categorical genes; the continuous ones are pinned (`CANON`) for the
   same reason `ui/specimen.js` pins them — they are real numbers, and a page of every value of a
   real number is not a page. Two Oglets can share all four genes and still be different animals
   in the world, which is what those five are for.
   ═══════════════════════════════════════════════════════════ */

import {
  CAT_LABELS,
  CATS,
  COMBO_COUNT,
  chanceText,
  comboIds,
  comboOrder,
  comboScore,
  geneOf,
  nameOf,
  oddsText,
} from '../genome/index.js'
import { PORTRAIT_SCALE, Thumb } from './thumbs.js'

/** The continuous genes, pinned. A combination is the categorical four and nothing else. */
const CANON = { gap: 1.05, pupilSize: 0.29, asymW: 1, asymH: 1, pace: 1, temper: 1.05, sociable: 1 }

const stars = (tier) => `<i class="stars ${tier.c}">${'★'.repeat(tier.stars)}</i>`
const oneIn = oddsText

/** Everything a card or the popup needs about the combination at rank `i` (0-based). */
function itemAt(order, i) {
  const n = order[i]
  const ids = comboIds(n)
  const genome = { ...CANON, ...ids }
  const { tier, chance } = comboScore(n)
  return { n, no: i + 1, ids, genome, tier, chance, name: nameOf(genome) }
}

/* Tier id → rank and → colour class, as plain lookups. Both are read once per painted card and
   a painted card happens fifty at a time on every scroll frame, so neither goes through `TIERS`. */
const TIER_RANK = { common: 0, uncommon: 1, rare: 2, epic: 3, legendary: 4, void: 5, god: 6 }
const TIER_CLASS = { common: 't0', uncommon: 't1', rare: 't2', epic: 't3', legendary: 't4', void: 't5', god: 't6' }

/**
 * The rarest of its four traits — what tints the card's edge. Not its overall verdict: scoring the
 * whole creature puts the great majority of a 46,648-card wall into two tiers, and the best single
 * thing it carries is what anybody would actually point at.
 */
function rarestOf(item) {
  let best = geneOf(CATS[0], item.ids[CATS[0]])
  for (let i = 1; i < CATS.length; i++) {
    const allele = geneOf(CATS[i], item.ids[CATS[i]])
    if (TIER_RANK[allele.tier] > TIER_RANK[best.tier]) best = allele
  }
  return best
}

/* ── one of them, opened ────────────────────────────────── */

function createViewer(thumbs) {
  const root = document.createElement('div')
  root.className = 'sheet'
  root.hidden = true
  root.innerHTML = `
    <div class="sheet-scrim" data-close></div>
    <div class="sheet-card gal-card" role="dialog" aria-modal="true" aria-label="Oglet">
      <button class="sheet-close" data-close aria-label="Close">×</button>
      <div class="orb orb-lg sheet-stage"></div>
      <p class="gal-no"></p>
      <h3 class="sheet-name gal-name"></h3>
      <p class="sheet-rarity gal-verdict"></p>
      <ul class="tags gal-tags"></ul>
      <p class="gal-odds"></p>
    </div>`
  document.body.appendChild(root)

  const stage = root.querySelector('.sheet-stage')
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
    open(item) {
      live = new Thumb(item.genome, 208, { scale: PORTRAIT_SCALE, expressive: true })
      thumbs.push(live)
      stage.replaceChildren(live.canvas)

      root.querySelector('.gal-no').textContent =
        `#${item.no.toLocaleString()} of ${COMBO_COUNT.toLocaleString()}`
      root.querySelector('.gal-name').textContent = item.name
      root.querySelector('.gal-verdict').innerHTML =
        `<span class="${item.tier.c}">${item.tier.name}</span> ${stars(item.tier)}`
      root.querySelector('.gal-tags').innerHTML = CATS.map((cat) => {
        const allele = geneOf(cat, item.ids[cat])
        return `<li class="tag ${TIER_CLASS[allele.tier]}" title="${CAT_LABELS[cat].title}">${allele.name}<em>${chanceText(allele.w)}</em></li>`
      }).join('')
      root.querySelector('.gal-odds').textContent = `${oneIn(item.chance)} of Oglets carry this combination`

      root.hidden = false
      document.body.classList.add('sheet-open')
      root.querySelector('.sheet-close').focus()
    },
  }
}

/* ── the wall ───────────────────────────────────────────── */

/** One pooled card. Created once, re-pointed for the life of the page. */
function makeSlot(thumbs, viewer) {
  const el = document.createElement('button')
  el.type = 'button'
  el.className = 'gcard'
  el.hidden = true

  const thumb = new Thumb({ ...CANON, ...comboIds(0) }, 132, { scale: PORTRAIT_SCALE })
  thumbs.push(thumb)

  const stage = document.createElement('div')
  stage.className = 'orb gcard-stage'
  stage.appendChild(thumb.canvas)

  const meta = document.createElement('div')
  meta.className = 'gcard-meta'
  meta.innerHTML = `
    <span class="gcard-no"></span>
    <span class="gcard-name"></span>
    <span class="gcard-tier"></span>
    <span class="gcard-odds"></span>`

  el.append(stage, meta)

  const no = meta.querySelector('.gcard-no')
  const name = meta.querySelector('.gcard-name')
  const tier = meta.querySelector('.gcard-tier')
  const odds = meta.querySelector('.gcard-odds')
  let item = null

  el.addEventListener('click', () => item && viewer.open(item))

  return {
    el,
    /** @returns {number} the rank currently painted here, or -1 */
    get at() {
      return item ? item.no : -1
    },
    paint(next) {
      /* **Nothing is repainted unless it actually changed.** A scroll fires far more often than a
         row goes past, and repainting a card that is already showing #4,201 threw away its
         creature and built a new one — which is why every Oglet on the wall used to stutter the
         moment you touched the scrollbar. */
      if (item && item.no === next.no) return
      item = next
      el.hidden = false
      el.dataset.tier = TIER_CLASS[rarestOf(next).tier]
      no.textContent = `#${next.no.toLocaleString()}`
      name.textContent = next.name
      tier.className = `gcard-tier ${next.tier.c}`
      tier.innerHTML = `${next.tier.name} ${stars(next.tier)}`
      odds.textContent = oneIn(next.chance)
      thumb.retarget(next.genome)
    },
    blank() {
      item = null
      el.hidden = true
    },
  }
}

/** Builds the page once. Push its thumbs into `thumbs` and tick them while the route is on. */
export function buildGalleryPage(host, thumbs) {
  host.innerHTML = ''
  const viewer = createViewer(thumbs)
  const order = comboOrder()

  const head = document.createElement('header')
  head.className = 'gal-top'
  head.innerHTML = `
    <p class="kicker">the gallery</p>
    <h1 class="gal-title">Oglets</h1>
    <p class="gal-lede">Every combination of the four categorical genes —
      ${COMBO_COUNT.toLocaleString()} of them, in order, commonest first. Not a sample: the whole
      space, numbered.</p>
    <p class="gal-count">The five continuous genes are pinned here, because they are real numbers
      and a page of every value of one is not a page. They are why two Oglets with the same four
      genes are still different animals in the world.</p>`

  const wall = document.createElement('div')
  wall.className = 'gwall'

  host.append(head, wall)

  /* Both numbers live in the stylesheet so the media queries stay the single source of the
     layout — JS reads them rather than keeping a second copy that can drift. */
  const readVar = (name, fallback) => {
    const v = parseFloat(getComputedStyle(wall).getPropertyValue(name))
    return Number.isFinite(v) && v > 0 ? v : fallback
  }

  const slots = []
  let cols = 0
  let rowH = 0
  let mounted = 0

  const layout = () => {
    const scroller = host.closest('.scroller') ?? host.parentElement
    const nextCols = Math.max(1, Math.round(readVar('--gc-cols', 6)))
    const nextRowH = readVar('--gc-row', 232)
    const rows = Math.ceil(COMBO_COUNT / nextCols)
    const need = (Math.ceil((scroller?.clientHeight ?? 800) / nextRowH) + 2) * nextCols

    if (nextCols !== cols || nextRowH !== rowH) {
      cols = nextCols
      rowH = nextRowH
      wall.style.height = `${rows * rowH}px`
    }
    while (slots.length < need) {
      const slot = makeSlot(thumbs, viewer)
      slots.push(slot)
      wall.appendChild(slot.el)
    }
    mounted = need
    for (let i = need; i < slots.length; i++) slots[i].blank()
    return scroller
  }

  /**
   * Position and fill the window.
   *
   * **The slots are a ring, not a list.** The obvious version gives slot `s` the row
   * `firstRow + s/cols`, which means every slot maps to a new row the instant `firstRow` moves —
   * one row of scrolling re-pointed all thirty-six cards, and thirty-six creatures being replaced
   * at once is exactly the twitch this page had. Keyed by `row % ringRows` instead, a row leaving
   * the top hands its slot to the row arriving at the bottom and **only those `cols` cards
   * change**; every other card is left completely alone, still mid-blink, still mid-glance.
   */
  const paint = (scroller) => {
    const top = scroller?.scrollTop ?? 0
    const firstRow = Math.max(0, Math.floor(top / rowH) - 1)
    const ringRows = Math.max(1, Math.floor(mounted / cols))

    for (let r = 0; r < ringRows; r++) {
      const row = firstRow + r
      const base = (row % ringRows) * cols
      for (let c = 0; c < cols; c++) {
        const slot = slots[base + c]
        if (!slot) continue
        const i = row * cols + c
        if (i >= COMBO_COUNT) {
          slot.blank()
          continue
        }
        slot.el.style.top = `${row * rowH}px`
        slot.el.style.left = `${(c * 100) / cols}%`
        slot.el.style.width = `${100 / cols}%`
        if (slot.at !== i + 1) slot.paint(itemAt(order, i))
      }
    }
  }

  let scroller = layout()
  paint(scroller)

  /* One rAF-throttled handler for both, because a scroll can fire far more often than a frame
     and repainting fifty cards per event is the one way to make a virtual list slower than the
     thing it replaced. */
  let queued = false
  const schedule = (relayout) => {
    if (relayout) scroller = layout()
    if (queued) return
    queued = true
    requestAnimationFrame(() => {
      queued = false
      paint(scroller)
    })
  }

  scroller?.addEventListener('scroll', () => schedule(false), { passive: true })
  addEventListener('resize', () => schedule(true))
}
