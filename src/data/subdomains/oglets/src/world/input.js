/* Pointer handling for the world canvas.

   Two things are worth knowing here. First, `moved` is what separates a poke from a drag —
   a press that travels less than 12px in under a third of a second is a hello, anything else
   is you carrying it around. Second, every listener is passive: nothing here ever wants to
   cancel a scroll, and saying so keeps the canvas smooth on touch. */

import { population, ptr, view } from './stage.js'

/* Taps on the empty canvas, and how many of them count as a noise. One is you missing; two is
   you knocking on the glass, and it looks. */
const NOISE_TAPS = 2
const NOISE_WINDOW = 1.6

export function bindPointer(canvas, { onFirstTouch, onNotice } = {}) {
  let held = null
  let touched = false
  let empty = []

  const local = (e) => {
    const r = canvas.getBoundingClientRect()
    return { x: e.clientX - r.left, y: e.clientY - r.top }
  }
  const firstTouch = () => {
    if (touched) return
    touched = true
    onFirstTouch?.()
  }
  const notice = (now) => {
    ptr.seen = true
    onNotice?.(now)
  }

  canvas.addEventListener(
    'pointerdown',
    (e) => {
      const p = local(e)
      ptr.x = ptr.px = p.x
      ptr.y = ptr.py = p.y
      ptr.in = true
      ptr.down = true
      ptr.moved = 0
      ptr.t0 = performance.now() / 1000
      ptr.last = ptr.t0
      firstTouch()
      notice(ptr.t0)

      for (const c of population) if (c.phase !== 'awake') c.wake(ptr.t0, true)
      for (let i = population.length - 1; i >= 0; i--) {
        if (population[i].hit(p.x, p.y)) {
          held = population[i]
          held.dragging = true
          held.gdx = held.b.x - (p.x - view.w / 2)
          held.gdy = held.b.y - (p.y - view.h / 2)
          document.body.classList.add('grabbing')
          population.push(population.splice(i, 1)[0]) // the one you grabbed draws on top
          break
        }
      }

      /* Nothing under it: you tapped the room, not the creature. One of those is a miss and is
         ignored; two inside `NOISE_WINDOW` is a knock on the glass, and everybody looks. */
      if (held) {
        empty.length = 0
      } else {
        empty.push(ptr.t0)
        empty = empty.filter((t) => ptr.t0 - t < NOISE_WINDOW)
        if (empty.length >= NOISE_TAPS) {
          empty.length = 0
          for (const c of population) c.startleAt(p.x, p.y, ptr.t0)
        }
      }
    },
    { passive: true },
  )

  canvas.addEventListener(
    'pointermove',
    (e) => {
      const p = local(e)
      ptr.px = ptr.x
      ptr.py = ptr.y
      ptr.x = p.x
      ptr.y = p.y
      ptr.in = true
      ptr.last = performance.now() / 1000
      firstTouch()
      notice(ptr.last)
      if (ptr.down) ptr.moved += Math.hypot(ptr.x - ptr.px, ptr.y - ptr.py)
    },
    { passive: true },
  )

  const release = (e) => {
    const now = performance.now() / 1000
    if (held && ptr.moved < 12 && now - ptr.t0 < 0.35) held.poke(now)
    if (held) {
      held.dragging = false
      // putting it down is what starts a game of catch — see behaviour/play.js
      held.release(now)
    }
    held = null
    ptr.down = false
    /* **A finger coming off is not the same as a cursor leaving the page.** `pointerleave` fires
       the moment a touch ends and clears `ptr.in`, so without this the world decided you had gone
       between every single tap. `ptr.lift` is stamped only by a finger or a pen, and `attentive`
       in `world/stage.js` keeps you present for a few seconds afterwards. A mouse never gets here
       with a non-mouse `pointerType`, so nothing about the desktop changes. */
    if (e && e.pointerType !== 'mouse') ptr.lift = now
    document.body.classList.remove('grabbing')
  }

  addEventListener('pointerup', release, { passive: true })
  addEventListener('pointercancel', release, { passive: true })
  canvas.addEventListener('pointerleave', () => { ptr.in = false }, { passive: true })
}
