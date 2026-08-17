/* One mutation, opened.

   Tapping a card is the only verb on the Genome page, so it has to be worth doing: the creature
   five times over, what it is, how often it turns up, and where it is supposed to have come
   from. It is also how an unmet mutation gets met — see state/dex.js. */

import { CAT_LABELS, chanceText, geneOf, tierOfAllele } from '../genome/index.js'
import { soullessGenome } from '../render/soulless.js'
import { paletteFor, specimen } from './specimen.js'
import { PORTRAIT_SCALE, PupilThumb, Thumb } from './thumbs.js'


export function createSheet(thumbs) {
  const root = document.createElement('div')
  root.className = 'sheet'
  root.hidden = true
  root.innerHTML = `
    <div class="sheet-scrim" data-close></div>
    <div class="sheet-card" role="dialog" aria-modal="true" aria-label="Mutation">
      <button class="sheet-close" data-close aria-label="Close">×</button>
      <div class="orb orb-lg sheet-stage"></div>
      <p class="sheet-gene"></p>
      <h3 class="sheet-name"></h3>
      <p class="sheet-rarity"></p>
      <p class="sheet-lore"></p>
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

  /** Everything the two openers share: put a creature on the stage and show the card. */
  const show = (thumb, gene, name, rarity, lore) => {
    live = thumb
    thumbs.push(live)
    stage.replaceChildren(live.canvas)
    root.querySelector('.sheet-gene').textContent = gene
    root.querySelector('.sheet-name').textContent = name
    const line = root.querySelector('.sheet-rarity')
    line.innerHTML = rarity ?? ''
    line.hidden = !rarity
    root.querySelector('.sheet-lore').textContent = lore ?? ''
    root.hidden = false
    document.body.classList.add('sheet-open')
    root.querySelector('.sheet-close').focus()
  }

  return {
    close,

    /**
     * A **Soulless**, opened. Same card as a mutation's, minus the one line a mutation has that a
     * theme cannot: there is no tier and no occurrence, because it is not something you can roll.
     */
    openSoul(theme) {
      show(
        new Thumb(soullessGenome(), 208, { scale: PORTRAIT_SCALE, theme, expressive: true }),
        'Soulless',
        theme.name,
        null,
        theme.lore,
      )
    },

    open(cat, alleleId) {
      const allele = geneOf(cat, alleleId)
      const tier = tierOfAllele(allele)

      const g = specimen(cat, alleleId)
      const palette = paletteFor(cat, alleleId)
      show(
        cat === 'pupil'
          ? new PupilThumb(g, 208, { palette })
          : new Thumb(g, 208, { scale: PORTRAIT_SCALE, palette }),
        CAT_LABELS[cat].title,
        allele.name,
        `<span class="${tier.c}">${tier.name} <i class="stars">${'★'.repeat(tier.stars)}</i></span>
         <span class="sheet-pct">${chanceText(allele.w)} of Oglets</span>`,
        allele.lore,
      )
    },
  }
}
