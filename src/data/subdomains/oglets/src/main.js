/* ═══════════════════════════════════════════════════════════
   OGLETS — the entry point. Wires the three pages to the one animation loop and gets out of
   the way. Everything with a rule in it lives in a module; this file only connects things.
   ═══════════════════════════════════════════════════════════ */

import { seedFromMine } from './state/dex.js'
import { firstMeeting, mine, persist, startPersisting } from './state/session.js'
import { buildGalleryPage } from './ui/gallery.js'
import { buildGenomePage } from './ui/genome-page.js'
import { mountHatch } from './ui/hatch.js'
import { mountHome } from './ui/home.js'
import { createRouter } from './ui/router.js'
import { thumbTicker } from './ui/thumbs.js'
import { radialEnter } from './ui/transition.js'
import { addTicker, startLoop } from './world/loop.js'
import { createWorld } from './world/world.js'

const $ = (id) => document.getElementById(id)

let router = null
const onRoute = (name) => () => router?.current === name

/** Your own four traits are known from the moment it hatches. */
seedFromMine()

/* ── the world ──────────────────────────────────────────── */
const hint = $('hint')
let hinted = false
const hideHint = () => {
  hinted = true
  hint.style.opacity = 0
}

const world = createWorld($('world'), { isActive: onRoute('world'), onFirstTouch: hideHint })

/* ── the landing ────────────────────────────────────────── */
mountHome({ wordmark: document.querySelector('.wordmark') })

/* ── the genome catalogue, built the first time it is opened ── */
const thumbs = []
let builtGenome = false
addTicker(thumbTicker(thumbs, onRoute('genome')))

/* ── the gallery, same deal ─────────────────────────────── */
const galleryThumbs = []
let builtGallery = false
addTicker(thumbTicker(galleryThumbs, onRoute('gallery')))

/* ── the egg ────────────────────────────────────────────────
   Mounted eagerly rather than on first entry, because it has to be ticking before the route
   arrives: a returning visitor's egg has been growing on a stored timestamp the whole time. */
const hatchView = mine.hatched ? null : mountHatch($('hatch'), { onHatched: () => router.go('world') })

/* ── routing ────────────────────────────────────────────── */
let enteredWorld = false
router = createRouter({
  views: { home: $('viewHome'), world: $('viewWorld'), genome: $('viewGenome'),
    gallery: $('viewGallery'), hatch: $('viewHatch') },
  links: [...document.querySelectorAll('nav [data-route]')],
  indicator: document.querySelector('.routes'),
  /* Your own Oglet is the reason you came back; the landing is for the first time only. Somebody
     who left half-way through a hatch comes back to the egg, not to an empty world. */
  initial: firstMeeting ? 'home' : mine.hatched ? 'world' : 'hatch',
  onEnter(route) {
    document.body.dataset.route = route
    /* An egg is not somewhere you can arrive at will. Anyone who has hatched — including anyone
       who reloads during the reveal — is sent straight to the world, which covers the bookmark,
       the shared link and the back button in one line. */
    if (route === 'hatch' && !hatchView) {
      router.go('world')
      return
    }
    if (route === 'hatch') hatchView.onEnter()
    else hatchView?.onLeave()
    if (route === 'world') {
      world.resize() // the canvas had no size while it was hidden
      if (!enteredWorld) {
        enteredWorld = true
        hint.textContent = `${firstMeeting ? 'meet' : 'drag'} ${mine.name}`
        setTimeout(() => { if (!hinted) hint.style.opacity = 0.9 }, 2000)
        setTimeout(() => { hint.style.opacity = 0 }, 12000)
      }
    }
    if (route === 'genome' && !builtGenome) {
      builtGenome = true
      buildGenomePage($('genome'), thumbs)
    }
    if (route === 'gallery' && !builtGallery) {
      builtGallery = true
      buildGalleryPage($('gallery'), galleryThumbs)
    }
  },
})

/* Enter is the one navigation that gets a performance: the world opens out of the button. On a
   first visit it opens onto an egg instead — the Oglet was already decided at module load, so the
   shell is a curtain over it rather than a dice roll. */
const enter = $('enterWorld')
enter.addEventListener('click', (e) => {
  e.preventDefault()
  radialEnter(enter, () => router.go(hatchView ? 'hatch' : 'world'))
})

/* ── coming and going ───────────────────────────────────── */
let hiddenAt = Date.now()
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    hiddenAt = Date.now()
    persist()
    return
  }
  if (Date.now() - hiddenAt > 45e3) world.expectGreeting()
})

startPersisting()
startLoop()
