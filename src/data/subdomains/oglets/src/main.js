/* ═══════════════════════════════════════════════════════════
   OGLETS — the entry point. Wires the three pages to the one animation loop and gets out of
   the way. Everything with a rule in it lives in a module; this file only connects things.
   ═══════════════════════════════════════════════════════════ */

import { seedFromMine } from './state/dex.js'
import { firstMeeting, mine, persist, startPersisting } from './state/session.js'
import { buildGenomePage } from './ui/genome-page.js'
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

/* ── routing ────────────────────────────────────────────── */
let enteredWorld = false
router = createRouter({
  views: { home: $('viewHome'), world: $('viewWorld'), genome: $('viewGenome') },
  links: [...document.querySelectorAll('nav [data-route]')],
  indicator: document.querySelector('.routes'),
  // your own Oglet is the reason you came back; the landing is for the first time only
  initial: firstMeeting ? 'home' : 'world',
  onEnter(route) {
    document.body.dataset.route = route
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
  },
})

/* Enter is the one navigation that gets a performance: the world opens out of the button. */
const enter = $('enterWorld')
enter.addEventListener('click', (e) => {
  e.preventDefault()
  radialEnter(enter, () => router.go('world'))
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
