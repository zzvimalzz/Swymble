/* Keeping Oglets out of each other, and inside the room.

   O(n²) × 6 iterations a frame, which is fine to about a dozen of them and is the reason the
   roadmap caps the world there. Beyond that, bucket spatially first. */

import { clamp, rand } from '../core/math.js'
import { population, view } from '../world/stage.js'

export function separate() {
  for (let it = 0; it < 6; it++) {
    for (let i = 0; i < population.length; i++) {
      for (let j = i + 1; j < population.length; j++) {
        const A = population[i]
        const B = population[j]
        let dx = B.b.x - A.b.x
        let dy = B.b.y - A.b.y
        let dist = Math.hypot(dx, dy)
        if (dist < 0.0001) {
          dx = rand(-1, 1)
          dy = rand(-1, 1)
          dist = Math.hypot(dx, dy)
        }
        const need = A.rad + B.rad
        if (dist >= need) continue
        const nx = dx / dist
        const ny = dy / dist
        const push = need - dist
        // inverse-area mass, so a big one shoves a small one rather than the other way round
        const imA = A.dragging ? 0 : 1 / (A.rad * A.rad)
        const imB = B.dragging ? 0 : 1 / (B.rad * B.rad)
        const tot = imA + imB || 1
        A.b.x -= nx * push * (imA / tot)
        A.b.y -= ny * push * (imA / tot)
        B.b.x += nx * push * (imB / tot)
        B.b.y += ny * push * (imB / tot)
        const rel = (B.b.vx - A.b.vx) * nx + (B.b.vy - A.b.vy) * ny
        if (rel < 0) {
          const jj = -rel * 0.6
          A.b.vx -= nx * jj * (imA / tot)
          A.b.vy -= ny * jj * (imA / tot)
          B.b.vx += nx * jj * (imB / tot)
          B.b.vy += ny * jj * (imB / tot)
        }
      }
    }
  }

  for (const c of population) {
    const lx = view.w / 2 - c.rad
    const ly = view.h / 2 - c.rad
    if (Math.abs(c.b.x) > lx) {
      c.b.x = clamp(c.b.x, -lx, lx)
      c.b.vx *= -0.36
    }
    if (Math.abs(c.b.y) > ly) {
      c.b.y = clamp(c.b.y, -ly, ly)
      c.b.vy *= -0.36
    }
  }
}
