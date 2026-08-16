/* Canvas plumbing: device-pixel scaling, and keeping `view` honest about the CSS size.

   The device-pixel ratio is capped at 2.5 — past that you are paying for pixels nobody can
   see, on exactly the phones least able to afford them. */

import { view } from './stage.js'

export function createWorldCanvas(canvas) {
  const ctx = canvas.getContext('2d')

  function resize() {
    const dp = Math.min(devicePixelRatio || 1, 2.5)
    const rect = canvas.getBoundingClientRect()
    view.w = rect.width || innerWidth
    view.h = rect.height || innerHeight
    canvas.width = view.w * dp
    canvas.height = view.h * dp
    ctx.setTransform(dp, 0, 0, dp, 0, 0)
  }

  addEventListener('resize', resize)
  resize()
  return { ctx, resize }
}

/** A small offscreen-ish canvas for a thumbnail or a portrait. Same scaling rules. */
export function createStageCanvas(size, dprCap = 2) {
  const canvas = document.createElement('canvas')
  const dp = Math.min(devicePixelRatio || 1, dprCap)
  canvas.width = size * dp
  canvas.height = size * dp
  canvas.style.width = `${size}px`
  canvas.style.height = `${size}px`
  const ctx = canvas.getContext('2d')
  ctx.setTransform(dp, 0, 0, dp, 0, 0)
  return { canvas, ctx }
}
