/* ═══════════════════════════════════════════════════════════
   THE HATCHING — five minutes, and the only five minutes on this site that ask for patience.

   A first-time visitor presses Enter and gets an egg rather than a creature. The Oglet inside was
   decided before the page finished loading (`state/session.js#hatch`) and is written to storage at
   once; the shell is a curtain over a decision already made, never a decision being taken.

   **The shell tells you what is in it.** `render/egg.js` picks its surface from the creature's
   tier, so the wait is not a loading bar — it is a five-minute tell, and a red shell glowing
   through its cracks means something before it opens.

   Three ways out, and all three matter (see `05-HATCHING.md` §5): tapping brings it forward and
   the credit is banked so a reload keeps it, leaving and coming back finds it further along
   because progress is derived from a timestamp, and `Skip` still *breaks* the shell rather than
   dissolving to the world.
   ═══════════════════════════════════════════════════════════ */

import { clamp, rand } from '../core/math.js'
import { WELL } from '../core/theme.js'
import { rarityOf } from '../genome/index.js'
import { hash } from '../genome/index.js'
import { drawEgg, drawShards, shellFor } from '../render/egg.js'
import { Body } from '../render/body.js'
import { mine, persist } from '../state/session.js'
import { createStageCanvas } from '../world/canvas.js'
import { addTicker } from '../world/loop.js'
import {
  FLASH,
  FULL,
  MAX_HELP,
  beatAt,
  creditTap,
  flashAt,
  flashCovers,
  flashLength,
  progressOf,
  remainingOf,
} from './hatch-beats.js'
import { PORTRAIT_SCALE } from './thumbs.js'

const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches

/** Seconds of shell-breaking. Short: the break is the payoff, not the performance. */
const BREAK = 1.3
/** How long the creature gets to be looked at once the light is off it, before the world takes over. */
const AFTER = 1.9

const minutes = (s) => {
  const m = Math.floor(s / 60)
  const r = s % 60
  return m > 0 ? `${m}m ${String(r).padStart(2, '0')}s` : `${r}s`
}

/**
 * Mounts the egg. Returns `{ onEnter }` — the router calls it every time the route arrives, which
 * is what restarts the clock display for somebody coming back to a half-grown egg.
 */
export function mountHatch(host, { onHatched } = {}) {
  const tier = rarityOf(mine.genome).tier
  const seed = hash(`egg:${mine.id}`)
  const shell = shellFor(tier.id)

  host.innerHTML = `
    <div class="hatch-flash" aria-hidden="true"></div>
    <div class="hatch-stage"></div>
    <p class="hatch-kicker">Something has been left for you</p>
    <p class="hatch-beat"></p>
    <p class="hatch-clock"></p>
    <button class="btn btn-quiet hatch-skip" type="button" hidden>Open it now</button>
    <p class="hatch-hint">Tap the egg — it helps.</p>`

  const stageEl = host.querySelector('.hatch-stage')
  const flashEl = host.querySelector('.hatch-flash')
  flashEl.style.setProperty('--flash', shell.glow)
  const beatEl = host.querySelector('.hatch-beat')
  const clockEl = host.querySelector('.hatch-clock')
  const skipEl = host.querySelector('.hatch-skip')
  const hintEl = host.querySelector('.hatch-hint')

  const SIZE = 320
  const { canvas, ctx } = createStageCanvas(SIZE, 2)
  canvas.className = 'hatch-canvas'
  stageEl.appendChild(canvas)

  /* The creature, built once and kept: at the reveal it is drawn by the same `Body` the world
     uses, so the thing that comes out of the shell is the thing you are about to be given. */
  const body = new Body(mine.genome)
  body.expr = 'startled'
  body.exprUntil = 1e9

  const state = {
    live: false,
    broke: 0, // performance-clock seconds when the shell went, or 0
    lastTap: -9,
    thumpAt: 0,
    lurch: 0,
    kick: 0,
    handedOver: false,
  }

  /** A thump: the shell jerks, and anything that was about to appear appears now. */
  const thump = (hard = 1) => {
    state.kick = Math.min(1.4, state.kick + 0.75 * hard)
    state.lurch = (Math.random() < 0.5 ? -1 : 1) * (0.5 + Math.random() * 0.5) * hard
  }

  const breakNow = (now) => {
    if (state.broke) return
    state.broke = now
    /* Written at the break, not at the end of the reveal: the shell coming apart is the point of
       no return, and a reload during the reveal should land in the world with it already out. */
    mine.hatched = true
    mine.eggHelp = Math.min(MAX_HELP, mine.eggHelp ?? 0)
    persist()
    skipEl.hidden = true
    hintEl.hidden = true
    if (!reducedMotion()) thump(1.4)
  }

  canvas.addEventListener('pointerdown', (e) => {
    e.preventDefault()
    if (state.broke) return
    const now = performance.now() / 1000
    const credited = creditTap(mine.eggHelp ?? 0, state.lastTap, now)
    if (credited !== null) {
      mine.eggHelp = credited
      state.lastTap = now
      persist()
    }
    // it answers every tap even when the tap earned nothing — mashing is not work, but it is felt
    thump(credited === null ? 0.5 : 1)
  })

  skipEl.addEventListener('click', () => breakNow(performance.now() / 1000))

  addTicker((dt, t) => {
    if (!state.live) return

    const progress = progressOf(mine.eggAt, mine.eggHelp, Date.now())
    const beat = beatAt(progress)

    if (!state.broke && (beat.done || beat.id === 'break')) breakNow(t)

    // the shell's own clock stops the moment it goes
    const since = state.broke ? t - state.broke : 0
    const opening = state.broke ? clamp(since / BREAK, 0, 1) : 0

    /* The flash fires when the shell is fully apart, not when it starts parting, and it goes all
       the way to opaque. `covered` is the window in which nothing at all can be seen — which is
       where the egg is taken away and the creature put in its place. */
    const calm = reducedMotion()
    const lit = state.broke ? since - BREAK : -1
    const covered = lit >= 0 && flashCovers(lit, calm)
    if (lit >= 0) flashEl.style.opacity = flashAt(lit, calm).toFixed(3)

    /* Copy. Deliberately honest about the wait — a five-minute silence with no number on it is
       indistinguishable from a page that has stopped working. */
    if (!state.broke) {
      beatEl.textContent = beat.name
      const left = remainingOf(progress)
      clockEl.textContent = left > 0 ? `about ${minutes(left)} to go` : 'any moment'
      skipEl.hidden = beat.index < 2
      hintEl.hidden = beat.index < 1
    } else if (!state.handedOver && lit > flashLength(calm) + AFTER) {
      state.handedOver = true
      beatEl.textContent = ''
      clockEl.textContent = ''
      onHatched?.()
      return
    } else {
      // the name arrives out of the fading light rather than over the top of it
      const named = lit > flashLength(calm) * 0.6
      beatEl.textContent = named ? mine.name : ''
      clockEl.textContent = named ? 'yours, from now on' : ''
    }

    // thumps drive everything visible; nothing here eases on its own
    if (!state.broke && !reducedMotion() && beat.index >= 1 && t > state.thumpAt) {
      state.thumpAt = t + rand(0.7, 1.5) / beat.thumpRate
      thump(0.5 + beat.rock * 0.7)
    }
    state.kick = Math.max(0, state.kick - dt * 2.6)
    state.lurch *= 1 - Math.min(1, dt * 4)

    /* ── paint ─────────────────────────────────────────── */
    ctx.clearRect(0, 0, SIZE, SIZE)
    ctx.fillStyle = WELL
    ctx.fillRect(0, 0, SIZE, SIZE)
    ctx.save()
    ctx.translate(SIZE / 2, SIZE / 2 + SIZE * 0.02)

    /* **The swap.** Under full light there is the creature and nothing else — no shell, no
       fragments, not even the pieces still in flight. Before it, the egg and its fragments and no
       creature. There is no frame on which both exist, which is the whole trick: what comes back
       out of the light is not the egg with something added, it is a different thing in its place. */
    if (covered) {
      body.update(dt, t)
      // the pop is timed off the swap, so it is nearly over by the time you can see again
      const pop = 1 + Math.max(0, 1 - (lit - FLASH.up) * 1.5) * 0.14
      ctx.scale(pop, pop)
      body.draw(ctx, SIZE * PORTRAIT_SCALE, t)
    } else {
      const rock = calm ? 0 : beat.rock
      const tilt = Math.sin(t * (1.1 + rock * 1.6)) * 0.05 * rock + state.lurch * 0.09
      const squash = 1 + state.kick * 0.05
      ctx.rotate(tilt)
      ctx.scale(1 / squash, squash)
      drawEgg(ctx, SIZE * 0.235, t, { tier: tier.id, seed, cracks: beat.cracks, open: opening })
      if (opening > 0) drawShards(ctx, SIZE * 0.3, seed, opening, tier.id)
    }

    ctx.restore()

    /* The one thing on the page that is not the egg: as the shell heats up, the ground behind it
       picks up its colour. Nothing says which tier — it just stops feeling like a black box. */
    if (shell.heat > 0.02 && !state.broke) {
      host.style.setProperty('--hatch-heat', `${(shell.heat * beat.rock * 0.5).toFixed(3)}`)
      host.style.setProperty('--hatch-glow', shell.shell)
    }
  })

  return {
    onEnter() {
      state.live = true
      if (!mine.eggAt) {
        mine.eggAt = Date.now()
        persist()
      }
      // already grown past it while the tab was closed — no performance, straight through
      if (progressOf(mine.eggAt, mine.eggHelp, Date.now()) >= FULL && !state.broke) {
        breakNow(performance.now() / 1000)
      }
    },
    onLeave() {
      state.live = false
    },
  }
}
