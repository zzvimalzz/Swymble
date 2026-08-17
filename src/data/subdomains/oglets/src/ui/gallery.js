/* ═══════════════════════════════════════════════════════════
   THE GALLERY — every combination there is.

   Not a sample and not a shuffle: all 186,592 arrangements of the five categorical genes, in
   order, commonest first, numbered by position. `genome/combos.js` addresses the space by number
   and sorts it; this page is the window onto it.

   **It is virtualised, because it has to be.** 186,592 live canvases is gigabytes and a locked
   tab. About fifty pooled cards are positioned absolutely inside a spacer the full height of the
   wall and re-pointed as you scroll (`Thumb.retarget`), so scrolling allocates nothing. The card
   you are looking at is the real renderer with a real Body, exactly as on every other page.

   A combination is the five categorical genes; the continuous ones are pinned (`CANON`) for the
   same reason `ui/specimen.js` pins them — they are real numbers, and a page of every value of a
   real number is not a page. Two Oglets can share all five genes and still be different animals
   in the world, which is what those five are for.
   ═══════════════════════════════════════════════════════════ */

import {
  CAT_LABELS,
  CATS,
  COMBO_COUNT,
  GENES,
  TIERS,
  chanceText,
  comboAt,
  comboIds,
  comboOrder,
  comboScore,
  geneOf,
  nameOf,
  SOULLESS_CHANCE,
  SOULLESS_TIER,
  oddsText,
} from '../genome/index.js'
import { SOULLESS, soullessGenome } from '../render/soulless.js'
import { PORTRAIT_SCALE, Thumb } from './thumbs.js'

/** The continuous genes, pinned. A combination is the categorical four and nothing else. */
const CANON = { gap: 1.05, pupilSize: 0.29, asymW: 1, asymH: 1, pace: 1, temper: 1.05, sociable: 1 }

const stars = (tier) => `<i class="stars ${tier.c}">${'★'.repeat(tier.stars)}</i>`
const oneIn = oddsText

/**
 * The whole wall: every arrangement of the five genes, and then the three Soulless.
 *
 * They are not combinations — no allele, no weight, nothing in `GENES` — so they cannot come out
 * of `comboOrder()`. They are appended instead, at the very end, which is exactly where the
 * ordering rule already puts them: the wall runs commonest first, and nothing on this site is
 * rarer than one in ten million.
 */
export const WALL_COUNT = COMBO_COUNT + SOULLESS.length

/** Everything a card or the popup needs about the entry at rank `i` (0-based). */
function itemAt(order, i) {
  if (i >= COMBO_COUNT) {
    const soul = SOULLESS[i - COMBO_COUNT]
    return {
      soul,
      no: i + 1,
      genome: soullessGenome(),
      tier: SOULLESS_TIER,
      // the chance of being Soulless at all, split between the three of them
      chance: SOULLESS_CHANCE / SOULLESS.length,
      name: `Soulless ${soul.name}`,
    }
  }
  const n = order[i]
  const ids = comboIds(n)
  const genome = { ...CANON, ...ids }
  const { tier, chance } = comboScore(n)
  return { n, no: i + 1, ids, genome, tier, chance, name: nameOf(genome) }
}

/* Tier id → rank and → colour class, as plain lookups. Both are read once per painted card and
   a painted card happens fifty at a time on every scroll frame, so neither goes through `TIERS`. */
const TIER_RANK = { common: 0, uncommon: 1, rare: 2, epic: 3, legendary: 4, void: 5, god: 6, soulless: 7 }
const TIER_CLASS = { common: 't0', uncommon: 't1', rare: 't2', epic: 't3', legendary: 't4', void: 't5', god: 't6', soulless: 't7' }

/**
 * The rarest of its five traits — what tints the card's edge. Not its overall verdict: scoring the
 * whole creature puts the great majority of a 186,592-card wall into two tiers, and the best single
 * thing it carries is what anybody would actually point at.
 */
function rarestOf(item) {
  if (item.soul) return { tier: 'soulless' }
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
      live = new Thumb(item.genome, 208, { scale: PORTRAIT_SCALE, expressive: true, theme: item.soul ?? null })
      thumbs.push(live)
      stage.replaceChildren(live.canvas)

      root.querySelector('.gal-no').textContent =
        `#${item.no.toLocaleString()} of ${WALL_COUNT.toLocaleString()}`
      root.querySelector('.gal-name').textContent = item.name
      root.querySelector('.gal-verdict').innerHTML =
        `<span class="${item.tier.c}">${item.tier.name}</span> ${stars(item.tier)}`
      /* A Soulless has no traits to list — it replaces every one of them at once — so the row of
         tags becomes the one thing there is to say about it. */
      root.querySelector('.gal-tags').innerHTML = item.soul
        ? '<li class="tag t7">Theme<em>not a mutation</em></li>'
        : CATS.map((cat) => {
            const allele = geneOf(cat, item.ids[cat])
            return `<li class="tag ${TIER_CLASS[allele.tier]}" title="${CAT_LABELS[cat].title}">${allele.name}<em>${chanceText(allele.w)}</em></li>`
          }).join('')
      root.querySelector('.gal-odds').textContent = item.soul
        ? `${oneIn(item.chance)}, and not a combination at all`
        : `${oneIn(item.chance)} of Oglets carry this combination`

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
      thumb.retarget(next.genome, undefined, next.soul ?? null)
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
    <p class="gal-lede">Every creature there is — ${WALL_COUNT.toLocaleString()}, commonest first.</p>`

  const wall = document.createElement('div')
  wall.className = 'gwall'

  /* ── search and filter ──────────────────────────────────
     The wall is 186,595 entries, so a filter cannot be a DOM query — it is a **second list of
     ranks** that the same virtualised painter walks instead of the full order. `view` is null when
     nothing is filtered, which keeps the common case free of both the array and the pass that
     builds it.

     Matching is on integers wherever it can be: the selects compare the combination's own digits
     (`comboAt`) against an allele index, which is five compares and no allocation. The text box is
     the expensive one, so it matches **mutation names and the rank number** and deliberately not
     creature names — those are derived nonsense words, they are not unique, and hashing 186,595 of
     them per keystroke is the difference between a filter and a freeze. */
  const tools = document.createElement('div')
  tools.className = 'gal-tools'
  tools.innerHTML = `
    <input class="gal-search" type="search" placeholder="Search mutations, tiers, or #4201" aria-label="Search the gallery">
    ${CATS.map((cat) => `<select data-filter="${cat}" aria-label="${CAT_LABELS[cat].title}">
        <option value="">${CAT_LABELS[cat].title}</option>
        ${GENES[cat].map((a, i) => `<option value="${i}">${a.name}</option>`).join('')}
      </select>`).join('')}
    <select data-filter="tier" aria-label="Rarity">
      <option value="">Rarity</option>
      ${[...TIERS, SOULLESS_TIER].map((t) => `<option value="${t.id}">${t.name}</option>`).join('')}
    </select>
    <button class="btn btn-quiet gal-flip" type="button" aria-pressed="false">Rarest first</button>
    <button class="btn btn-quiet gal-clear" type="button" hidden>Clear</button>
    <span class="gal-hits"></span>`

  const empty = document.createElement('p')
  empty.className = 'gal-empty'
  empty.textContent = 'Nothing matches that.'
  empty.hidden = true

  host.append(head, tools, empty, wall)

  const search = tools.querySelector('.gal-search')
  const hits = tools.querySelector('.gal-hits')
  const clear = tools.querySelector('.gal-clear')
  const flip = tools.querySelector('.gal-flip')
  const picks = CATS.map((cat) => tools.querySelector(`[data-filter="${cat}"]`))
  const tierPick = tools.querySelector('[data-filter="tier"]')

  /** Global ranks that survive the filter, or null for "everything". */
  let view = null
  /**
   * Rarest first. The run is **already** sorted commonest-first, so this is a read backwards
   * and not a sort — no second array, no second pass, and it costs the same at 186,595 entries
   * as it does at six.
   */
  let desc = false
  const total = () => (view ? view.length : WALL_COUNT)
  /** The wall position `i` maps to which entry in the whole run. */
  const rankAt = (i) => {
    const j = desc ? total() - 1 - i : i
    return view ? view[j] : j
  }

  /* Allele names, lowercased once, so the text pass is a substring test rather than a walk of the
     tables per candidate. */
  const NAMES = CATS.map((cat) => GENES[cat].map((a) => a.name.toLowerCase()))
  const TIER_OF = CATS.map((cat) => GENES[cat].map((a) => a.tier))
  const TIER_NAME = Object.fromEntries([...TIERS, SOULLESS_TIER].map((t) => [t.id, t.name.toLowerCase()]))

  function rebuild() {
    const q = search.value.trim().toLowerCase()
    const wanted = picks.map((sel) => (sel.value === '' ? -1 : Number(sel.value)))
    const tier = tierPick.value
    // `#4201` or `4201` looks up a position in the run; anything else is matched against names
    const asNumber = /^#?\d[\d,]*$/.test(q) ? Number(q.replace(/[#,]/g, '')) : null

    const filtered = q !== '' || tier !== '' || wanted.some((w) => w >= 0)
    clear.hidden = !filtered

    if (!filtered) {
      view = null
    } else {
      view = []
      const at = new Array(CATS.length)
      for (let rank = 0; rank < COMBO_COUNT; rank++) {
        comboAt(order[rank], at)
        let ok = true
        for (let c = 0; c < at.length && ok; c++) if (wanted[c] >= 0 && at[c] !== wanted[c]) ok = false
        // the rarity filter reads the creature's own verdict, which is what its card prints
        if (ok && tier) ok = comboScore(order[rank]).tier.id === tier
        if (ok && q) {
          ok = asNumber !== null
            ? rank + 1 === asNumber
            // a mutation it carries, or the name of a tier one of those mutations sits in
            : at.some((idx, c) => NAMES[c][idx].includes(q) || TIER_NAME[TIER_OF[c][idx]].includes(q))
        }
        if (ok) view.push(rank)
      }
      /* And the ones that are not combinations at all. They carry no alleles, so any gene
         filter excludes them — but the rarity filter does not, because Soulless is a tier. */
      for (let i = 0; i < SOULLESS.length; i++) {
        const rank = COMBO_COUNT + i
        if (wanted.some((w) => w >= 0)) continue
        if (tier && tier !== SOULLESS_TIER.id) continue
        if (!q || (asNumber !== null ? rank + 1 === asNumber : `soulless ${SOULLESS[i].name}`.toLowerCase().includes(q))) {
          view.push(rank)
        }
      }
    }

    hits.textContent = view ? `${view.length.toLocaleString()} of ${WALL_COUNT.toLocaleString()}` : ''
    empty.hidden = !view || view.length > 0
    repaint()
  }

  /** Everything that has to happen when what is on the wall changes — filter or order. */
  function repaint() {
    for (const slot of slots) slot.blank()
    scroller = layout()
    if (scroller) scroller.scrollTop = 0
    paint(scroller)
  }

  let typing = 0
  search.addEventListener('input', () => {
    clearTimeout(typing)
    typing = setTimeout(rebuild, 180)
  })
  for (const sel of [...picks, tierPick]) sel.addEventListener('change', rebuild)

  clear.addEventListener('click', () => {
    search.value = ''
    for (const sel of [...picks, tierPick]) sel.value = ''
    rebuild()
    search.focus()
  })

  flip.addEventListener('click', () => {
    desc = !desc
    flip.setAttribute('aria-pressed', String(desc))
    flip.textContent = desc ? 'Commonest first' : 'Rarest first'
    repaint()
  })

  /* `/` focuses the search from anywhere on the page, the way it does in every list worth
     searching. Ignored while something else already has a caret in it, and while the gallery
     is not the page you are looking at — the router only hides views, it does not unbuild them. */
  document.addEventListener('keydown', (e) => {
    if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey) return
    if (/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return
    if (host.closest('.view')?.hidden !== false) return
    e.preventDefault()
    /* Focused on the next task, not in this handler. Moving focus *during* keydown makes the
       browser deliver the following keypress to whatever is focused by then — so focusing here
       types the slash into the box it just opened, `preventDefault` notwithstanding. */
    setTimeout(() => {
      search.focus()
      search.select()
    }, 0)
  })

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
    const rows = Math.max(1, Math.ceil(total() / nextCols))
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
        if (i >= total()) {
          slot.blank()
          continue
        }
        slot.el.style.top = `${row * rowH}px`
        slot.el.style.left = `${(c * 100) / cols}%`
        slot.el.style.width = `${100 / cols}%`
        const rank = rankAt(i)
        if (slot.at !== rank + 1) slot.paint(itemAt(order, rank))
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
