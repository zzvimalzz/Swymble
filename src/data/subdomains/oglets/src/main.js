/* ═══════════════════════════════════════════════════════════
   OGLETS — the entry point. Wires the three pages to the one animation loop and gets out of
   the way. Everything with a rule in it lives in a module; this file only connects things.
   ═══════════════════════════════════════════════════════════ */

import { DEV, DEV_ROUTES } from './core/dev.js'
import { watchVersion } from './core/version.js'
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

/** Your own five traits are known from the moment it hatches. */
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

/* ── the benches ────────────────────────────────────────────
   `#/assets` and `#/lab` are tools rather than pages, and in production they do not exist at all:
   the build strips every `*.dev.*` file, so these imports are the only thing that would ever ask
   for them — and they are never reached. See `core/dev.js` for the three gates and why each is
   needed. Everything below therefore has to survive both of them being `null` forever. */
const assetThumbs = []
let buildAssetsPage = null
let builtAssets = false
let lab = null
addTicker(thumbTicker(assetThumbs, onRoute('assets')))

const hideRoute = (route) => document.querySelector(`nav [data-route="${route}"]`)?.remove()

if (DEV) {
  /* **Both are allowed to be missing, even here.** `npm run preview` serves the built output from
     localhost, which is a dev hostname holding a production bundle — the files have been stripped
     and these two imports 404. That is the correct outcome and not an error, so it is caught and
     the link comes out of the nav rather than pointing at nothing. */
  import('./ui/assets.dev.js')
    .then((m) => {
      buildAssetsPage = m.buildAssetsPage
      // it may have been asked for before it arrived — a direct load of #/assets does exactly that
      if (router?.is('assets')) router.go('assets')
    })
    .catch(() => hideRoute('assets'))
  import('./ui/lab.dev.js')
    .then((m) => {
      lab = m.mountLab($('lab'), { isActive: onRoute('lab') })
      if (router?.is('lab')) lab.onEnter()
    })
    .catch(() => hideRoute('lab'))
} else {
  // not a bench: the routes do not exist (`ui/router.js`), so neither should the way in
  for (const route of DEV_ROUTES) hideRoute(route)
}

/* ── the egg ────────────────────────────────────────────────
   Mounted eagerly rather than on first entry, because it has to be ticking before the route
   arrives: a returning visitor's egg has been growing on a stored timestamp the whole time. */
const hatchView = mine.hatched ? null : mountHatch($('hatch'), { onHatched: () => router.go('world') })

/* ── routing ────────────────────────────────────────────── */
let enteredWorld = false
router = createRouter({
  views: { home: $('viewHome'), world: $('viewWorld'), genome: $('viewGenome'),
    gallery: $('viewGallery'), hatch: $('viewHatch'), assets: $('viewAssets'), lab: $('viewLab') },
  links: [...document.querySelectorAll('nav [data-route]')],
  indicator: document.querySelector('.routes'),
  /* A BARE URL IS ALWAYS THE LANDING. It used to send a returning visitor straight to their
     Oglet, which sounds hospitable and meant that `oglets.swymble.com` — the link on the Labs
     shelf, the one anybody is given — opened onto a canvas with no name on it and no way back
     that looked like a way back. A door is not an inconvenience; it is where you find out what
     the place is called.

     Nothing is lost: `#/world`, `#/genome` and the rest still open directly, so a bookmark, a
     shared link and a refresh all land where they say they will. Only "no hash at all" changed,
     and only it could have. The head script in index.html decides this the same way. */
  initial: 'home',
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
    /* The Lab borrows the shared `population` while it is open and hands it straight back. Both
       calls every time, because leaving it by any route — nav, back button, hash — has to restore
       the real Oglet or the World opens onto the bench's creature. */
    if (route === 'lab') lab?.onEnter()
    else lab?.onLeave()
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
    if (route === 'assets' && !builtAssets && buildAssetsPage) {
      builtAssets = true
      buildAssetsPage($('assets'), assetThumbs)
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

/* Last, and on purpose: a tab left open for days is the normal way to use this page, and until
   now nothing in it would ever have noticed a deploy. See the header of `core/version.js`. */
watchVersion()
