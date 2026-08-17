/* ═══════════════════════════════════════════════════════════
   THE LAB — a throwaway world you can put anything into. **Temporary.**

   `.docs/OGLETS.md` §2 records that a bench exactly like this was built, used to check every mutation
   against every other one, and then deleted — with the conclusion that *"the tool was right; the
   route was wrong."* This is the tool coming back, and the route is still wrong: it sits beside
   `#/assets` on the temporary shelf and both come out together.

   To remove it: this file, `styles/lab.css`, the `lab` entry in `ui/router.js`, and the lines it
   owns in `index.html` and `main.js`. Nothing else imports it.

   ── how it borrows the world ──
   `world/stage.js#population` is the one shared mutable everything reads: `separate()`, the social
   states and the yawn contagion all walk it. Two worlds cannot both be in it. So the lab **takes
   the stage over** while its route is on and hands it straight back on the way out — the real
   Oglet is stashed, the lab's is pushed, and leaving reverses it exactly. `view` and `ptr` are
   shared without ceremony, which is safe because only one route is ever visible.
   ═══════════════════════════════════════════════════════════ */

import { useDevStyles } from '../core/dev.js'
import { Oglet } from '../behaviour/oglet.js'
import { BEATS } from '../behaviour/beats.js'
import { separate } from '../behaviour/separate.js'
import { rand } from '../core/math.js'
import { WELL } from '../core/theme.js'
import { CATS, CAT_LABELS, GENES, genomeOf, nameOf, newId, rarityOf } from '../genome/index.js'
import { Body } from '../render/body.js'
import { SOULLESS, soulOf } from '../render/soulless.js'
import { mine } from '../state/session.js'
import { createWorldCanvas } from '../world/canvas.js'
import { bindPointer } from '../world/input.js'
import { addTicker } from '../world/loop.js'
import { population } from '../world/stage.js'

/** The continuous genes, pinned — same set the gallery and the contact sheet pin. */
const CANON = { gap: 1.05, pupilSize: 0.29, asymW: 1, asymH: 1, pace: 1, temper: 1.05, sociable: 1 }

const el = (tag, cls, html) => {
  const node = document.createElement(tag)
  if (cls) node.className = cls
  if (html != null) node.innerHTML = html
  return node
}

/* This page brings its own stylesheet: `index.html` must not link it, because the build strips
   every `*.dev.*` file and a static link to a stripped file is a 404 on every production load. */
useDevStyles('./src/styles/lab.dev.css')

export function mountLab(host, { isActive }) {
  host.innerHTML = `
    <canvas class="lab-canvas"></canvas>
    <div class="lab-panel">
      <div class="lab-rows"></div>
      <div class="lab-acts">
        <button class="btn btn-quiet" data-act="random" type="button">Random</button>
        <button class="btn btn-quiet" data-act="mine" type="button">Mine</button>
      </div>
      <div class="lab-acts lab-beats"></div>
      <p class="lab-read"></p>
    </div>
    <button class="lab-toggle" type="button" aria-label="Hide the panel">×</button>`

  const canvas = host.querySelector('.lab-canvas')
  const panel = host.querySelector('.lab-panel')
  const rows = host.querySelector('.lab-rows')
  const read = host.querySelector('.lab-read')
  const { ctx, resize } = createWorldCanvas(canvas)

  /* ── the pickers ──────────────────────────────────────────
     One per categorical gene, plus Soulless — which is deliberately in the same row of selects even
     though it is not a gene, because the question this page answers is "what does that look like in
     a world" and the answer does not care about the distinction. */
  const picked = { theme: soulOf(mine.id)?.id ?? '' }
  const selects = {}

  const row = (key, label, options, value) => {
    const wrap = el('label', 'lab-row', `<span>${label}</span>`)
    const sel = el('select')
    sel.innerHTML = options.map((o) => `<option value="${o.id}">${o.name}</option>`).join('')
    sel.value = value
    sel.addEventListener('change', () => {
      picked[key] = sel.value
      build()
    })
    wrap.appendChild(sel)
    rows.appendChild(wrap)
    selects[key] = sel
    return sel
  }

  for (const cat of CATS) {
    picked[cat] = mine.genome[cat]
    row(cat, CAT_LABELS[cat].title, GENES[cat], picked[cat])
  }
  row('theme', 'Soulless', [{ id: '', name: '— none —' }, ...SOULLESS], picked.theme)

  /* ── the inhabitant ───────────────────────────────────────
     Rebuilt from scratch on every change rather than mutated. An Oglet caches its genome, its
     shape, its profile and its own measured radius at construction; poking new genes into it after
     the fact would leave half of those stale, and this page exists precisely to show what a genome
     really draws. */
  let live = null

  function build() {
    const theme = SOULLESS.find((s) => s.id === picked.theme) ?? null
    const genome = { ...CANON }
    for (const cat of CATS) genome[cat] = picked[cat]

    const seat = live ? { x: live.b.x, y: live.b.y } : { x: 0, y: 0 }
    const next = new Oglet(genome, 0.07, seat)
    // a theme is a render-time decision, so it is handed to the Body rather than to the genome
    if (theme) next.body = new Body(genome, { theme })
    // keep it where it was and keep it awake, so changing a gene reads as the same creature
    // changing rather than as a new one arriving
    next.b.x = seat.x
    next.b.y = seat.y
    replace(next)

    const { tier } = rarityOf(genome)
    read.innerHTML = theme
      ? `<strong>Soulless ${theme.name}</strong> · a theme, so it has no odds`
      : `<strong>${nameOf(genome)}</strong> · <span class="${tier.c}">${tier.name}</span>
         · ${CATS.map((c) => GENES[c].find((a) => a.id === genome[c]).name).join(' · ')}`
  }

  /** Swaps who is standing in the lab, in place — `population` is shared and must never be reassigned. */
  function replace(next) {
    if (live) {
      const at = population.indexOf(live)
      if (at >= 0) population.splice(at, 1)
    }
    live = next
    if (mounted) population.push(live)
  }

  host.querySelector('[data-act="random"]').addEventListener('click', () => {
    const g = genomeOf(newId())
    for (const cat of CATS) {
      picked[cat] = g[cat]
      selects[cat].value = g[cat]
    }
    build()
  })
  host.querySelector('[data-act="mine"]').addEventListener('click', () => {
    for (const cat of CATS) {
      picked[cat] = mine.genome[cat]
      selects[cat].value = mine.genome[cat]
    }
    picked.theme = ''
    selects.theme.value = ''
    build()
  })

  /* The beats, by hand. **This is the only place any of them can be seen in a world**, because
     nothing in an Oglet's own logic plays one — see `render/body.js#update`. */
  const beatBar = host.querySelector('.lab-beats')
  beatBar.appendChild(el('span', 'lab-tag', 'beats'))
  for (const def of Object.values(BEATS)) {
    const b = el('button', 'btn btn-quiet', def.id)
    b.type = 'button'
    b.addEventListener('click', () => {
      const now = performance.now() / 1000
      if (def.dur === Infinity) live.body.comet = live.body.comet > 0.5 ? 0 : 1
      else live.body.play(def, now)
    })
    beatBar.appendChild(b)
  }

  const toggle = host.querySelector('.lab-toggle')
  toggle.addEventListener('click', () => {
    const open = panel.hasAttribute('hidden')
    panel.toggleAttribute('hidden', !open)
    toggle.textContent = open ? '×' : '≡'
  })

  bindPointer(canvas, {})

  /* ── taking the stage, and giving it back ─────────────── */
  let mounted = false
  let stashed = []

  addTicker((dt, t) => {
    if (!isActive()) return
    ctx.fillStyle = WELL
    ctx.fillRect(0, 0, canvas.clientWidth, canvas.clientHeight)
    for (const c of population) c.update(dt, t)
    separate()
    for (const c of population) c.draw(ctx, t)
    for (const c of population) c.drawZzz(ctx, t)
  })

  build()

  return {
    onEnter() {
      if (mounted) return
      mounted = true
      stashed = population.splice(0, population.length)
      population.push(live)
      live.b.nextDrift = 0
      live.b.tx = rand(-40, 40)
      live.b.ty = rand(-30, 30)
      resize()
    },
    onLeave() {
      if (!mounted) return
      mounted = false
      population.length = 0
      population.push(...stashed)
      stashed = []
    },
    resize,
  }
}
