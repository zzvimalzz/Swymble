/* ═══════════════════════════════════════════════════════════
   THE EGG — what an Oglet is inside before it is outside.

   **The egg tells you what is in it.** Its shell comes from the tier of the creature already
   decided and waiting (`SHELLS`), so a God-line Oglet sits in a shell that has been glowing and
   splitting for five minutes before it opens. The wait is not a loading bar, it is a tell.

   **And it is still that Oglet's own egg.** Every band, bubble, drip and crack is drawn from the
   same seed the creature is, so two Legendary eggs are recognisably the same kind of thing and
   unmistakably not the same egg. Nothing here is random per frame.

   The look is glossy and saturated on purpose — three tones through the body, a broad sheen down
   the upper left with a hot spot inside it, an aura behind, and a pattern per tier. A flat fill
   with a speckle on it reads as a pebble; the gloss is what makes it read as a shell with
   something *in* it.

   Drawn in unit space around the origin: pass an `R` and the whole thing scales. No DOM and no
   state, so the hatching page, the Genome page's shell row and any preview sheet all draw the same
   egg the same way.
   ═══════════════════════════════════════════════════════════ */

import { TAU } from '../core/math.js'

/**
 * One shell per tier.
 *
 * `lite`/`mid`/`dark` are the body, top to bottom. `accent` is the pattern. `glow` is the aura
 * behind it and the light inside a split. `heat` is how much both of those pulse — the only thing
 * here that runs on the clock rather than on geometry, and the reason the top three tiers read as
 * *dangerous* rather than merely expensive.
 */
export const SHELLS = {
  common: {
    name: 'Common', lite: '#f3ece0', mid: '#dcd2bf', dark: '#9d9483', accent: '#c6b9a2',
    glow: '#e8dcc6', heat: 0, pattern: 'marble',
  },
  uncommon: {
    name: 'Uncommon', lite: '#d8f4e4', mid: '#8fd9b4', dark: '#3f8f6d', accent: '#5fc9a0',
    glow: '#7fe6b4', heat: 0.08, pattern: 'bubbles',
  },
  rare: {
    name: 'Rare', lite: '#dcf1ff', mid: '#7cc4f5', dark: '#2f6ba8', accent: '#b3e2ff',
    glow: '#7ec8ff', heat: 0.16, pattern: 'swirl',
  },
  epic: {
    name: 'Epic', lite: '#efdcff', mid: '#b184ea', dark: '#5c3696', accent: '#8e5ad4',
    glow: '#c08cff', heat: 0.3, pattern: 'wrap',
  },
  legendary: {
    name: 'Legendary', lite: '#fff2c8', mid: '#f0c85c', dark: '#a3741a', accent: '#ffe08a',
    glow: '#ffd464', heat: 0.5, pattern: 'lobes',
  },
  void: {
    name: 'Void', lite: '#d6f4ff', mid: '#c46ce0', dark: '#5f2a86', accent: '#63d9f5',
    glow: '#e07af0', heat: 0.72, pattern: 'swirl', relief: 'facets',
  },
  god: {
    name: 'God', lite: '#ffe2c0', mid: '#ff8a4c', dark: '#93240f', accent: '#ffc46a',
    glow: '#ff6a3c', heat: 1, pattern: 'drips', relief: 'scales',
  },
}

export const shellFor = (tierId) => SHELLS[tierId] ?? SHELLS.common

/** The stages an egg passes through, for anything that wants to lay the sequence out. */
export const EGG_STAGES = [
  { label: 'Intact', cracks: 0, open: 0 },
  { label: 'First split', cracks: 1, open: 0 },
  { label: 'Spreading', cracks: 2, open: 0 },
  { label: 'Working', cracks: 3, open: 0 },
  { label: 'Failing', cracks: 5, open: 0 },
  { label: 'About to go', cracks: 6, open: 0 },
  { label: 'Parting', cracks: 6, open: 0.3 },
  { label: 'Open', cracks: 6, open: 0.65 },
  { label: 'Shattered', cracks: 6, open: 1 },
]

/* A seeded stream, so a shell is its own and identical every frame. */
const streamOf = (seed) => {
  let a = (seed ^ 0x9e3779b9) >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** The silhouette: an ovoid, narrower at the top, standing 1.3 R tall. */
function eggPath(ctx, rx, ry) {
  ctx.beginPath()
  ctx.moveTo(0, -ry)
  ctx.bezierCurveTo(rx * 0.6, -ry * 0.95, rx, -ry * 0.16, rx, ry * 0.22)
  ctx.bezierCurveTo(rx, ry * 0.78, rx * 0.56, ry, 0, ry)
  ctx.bezierCurveTo(-rx * 0.56, ry, -rx, ry * 0.78, -rx, ry * 0.22)
  ctx.bezierCurveTo(-rx, -ry * 0.16, -rx * 0.6, -ry * 0.95, 0, -ry)
  ctx.closePath()
}

/* ── the patterns ───────────────────────────────────────────
   Each one assumes the shell's clip is already set and paints across the whole box. They are
   deliberately bold: a pattern that has to be looked for is a texture, and a texture at 76px on
   the Genome page is a smudge. */

function swirl(ctx, rx, ry, s, rnd) {
  ctx.globalAlpha = 0.55
  ctx.strokeStyle = s.accent
  ctx.lineCap = 'round'
  for (let i = 0; i < 7; i++) {
    const y = -ry + (i / 6) * ry * 2 + (rnd() - 0.5) * ry * 0.12
    ctx.lineWidth = ry * (0.07 + rnd() * 0.09)
    ctx.beginPath()
    ctx.moveTo(-rx * 1.1, y)
    ctx.bezierCurveTo(-rx * 0.3, y - ry * 0.22, rx * 0.3, y + ry * 0.22, rx * 1.1, y - ry * 0.04)
    ctx.stroke()
  }
  // a second, lighter set half a step off, which is what makes it read as flowing rather than striped
  ctx.globalAlpha = 0.4
  ctx.strokeStyle = s.lite
  for (let i = 0; i < 5; i++) {
    const y = -ry * 0.8 + (i / 4) * ry * 1.6
    ctx.lineWidth = ry * 0.035
    ctx.beginPath()
    ctx.moveTo(-rx * 1.1, y + ry * 0.09)
    ctx.bezierCurveTo(-rx * 0.2, y - ry * 0.1, rx * 0.4, y + ry * 0.3, rx * 1.1, y + ry * 0.06)
    ctx.stroke()
  }
}

function wrap(ctx, rx, ry, s, rnd) {
  ctx.globalAlpha = 0.62
  ctx.strokeStyle = s.accent
  ctx.lineCap = 'round'
  for (let i = 0; i < 5; i++) {
    const y = -ry * 0.72 + i * ry * 0.4 + (rnd() - 0.5) * ry * 0.08
    ctx.lineWidth = ry * (0.09 + rnd() * 0.06)
    ctx.beginPath()
    ctx.moveTo(-rx * 1.1, y)
    ctx.quadraticCurveTo(0, y + ry * 0.17, rx * 1.1, y)
    ctx.stroke()
    // the ribbon's own highlight, riding just above it
    ctx.save()
    ctx.globalAlpha = 0.4
    ctx.strokeStyle = s.lite
    ctx.lineWidth = ry * 0.025
    ctx.beginPath()
    ctx.moveTo(-rx, y - ry * 0.05)
    ctx.quadraticCurveTo(0, y + ry * 0.11, rx, y - ry * 0.05)
    ctx.stroke()
    ctx.restore()
  }
}

function lobes(ctx, rx, ry, s, rnd) {
  ctx.globalAlpha = 0.55
  for (let i = 0; i < 4; i++) {
    const cx = -rx * 0.72 + i * rx * 0.48 + (rnd() - 0.5) * rx * 0.08
    ctx.fillStyle = i % 2 ? s.accent : s.lite
    ctx.beginPath()
    ctx.moveTo(cx, -ry * 1.05)
    ctx.bezierCurveTo(cx + rx * 0.3, -ry * 0.2, cx + rx * 0.22, ry * 0.7, cx, ry * 1.05)
    ctx.bezierCurveTo(cx - rx * 0.22, ry * 0.7, cx - rx * 0.3, -ry * 0.2, cx, -ry * 1.05)
    ctx.closePath()
    ctx.fill()
  }
}

function bubbles(ctx, rx, ry, s, rnd) {
  for (let i = 0; i < 22; i++) {
    const a = rnd() * TAU
    const r = Math.sqrt(rnd()) * 0.95
    const bx = Math.cos(a) * rx * r
    const by = Math.sin(a) * ry * r
    const br = rx * (0.06 + rnd() * 0.17)
    ctx.globalAlpha = 0.5
    ctx.fillStyle = s.accent
    ctx.beginPath()
    ctx.arc(bx, by, br, 0, TAU)
    ctx.fill()
    // each one gets its own tiny highlight — a bubble without one is a dot
    ctx.globalAlpha = 0.55
    ctx.fillStyle = s.lite
    ctx.beginPath()
    ctx.arc(bx - br * 0.3, by - br * 0.34, br * 0.3, 0, TAU)
    ctx.fill()
  }
}

function marble(ctx, rx, ry, s, rnd) {
  ctx.globalAlpha = 0.5
  ctx.fillStyle = s.accent
  for (let i = 0; i < 6; i++) {
    ctx.beginPath()
    const cx = (rnd() - 0.5) * rx * 1.5
    const cy = (rnd() - 0.5) * ry * 1.7
    const rr = rx * (0.2 + rnd() * 0.3)
    ctx.moveTo(cx + rr, cy)
    for (let k = 1; k <= 6; k++) {
      const a = (k / 6) * TAU
      const w = rr * (0.6 + rnd() * 0.7)
      ctx.quadraticCurveTo(
        cx + Math.cos(a - 0.3) * w * 1.3, cy + Math.sin(a - 0.3) * w * 1.3,
        cx + Math.cos(a) * w, cy + Math.sin(a) * w,
      )
    }
    ctx.closePath()
    ctx.fill()
  }
}

function drips(ctx, rx, ry, s, rnd) {
  ctx.globalAlpha = 0.6
  ctx.fillStyle = s.accent
  for (let i = 0; i < 7; i++) {
    const x = -rx * 0.85 + (i / 6) * rx * 1.7 + (rnd() - 0.5) * rx * 0.1
    const w = rx * (0.08 + rnd() * 0.09)
    const drop = -ry * 0.9 + rnd() * ry * 1.5
    ctx.beginPath()
    ctx.moveTo(x - w, -ry * 1.1)
    ctx.lineTo(x + w, -ry * 1.1)
    ctx.lineTo(x + w, drop)
    ctx.quadraticCurveTo(x + w, drop + w * 1.6, x, drop + w * 1.9)
    ctx.quadraticCurveTo(x - w, drop + w * 1.6, x - w, drop)
    ctx.closePath()
    ctx.fill()
  }
}

const PATTERNS = { swirl, wrap, lobes, bubbles, marble, drips }

/* ── relief ─────────────────────────────────────────────────
   The top two shells are not painted, they are **built** — and the difference between a pattern
   and a relief is only ever the pair of edges. A lit rim on the side facing the light and a dark
   one on the side away from it is what makes a shape sit *above* the surface instead of on it;
   everything else here is bookkeeping about where to put them.

   The light is upper-left throughout, matching the sheen, so the two agree about where the sun is.
   They ran flat next to the other five once the gloss went on, which is what earned them this. */

/** VOID — cut crystal. Irregular plates with a bright ridge and a hard shadow on the far side. */
function facets(ctx, rx, ry, s, rnd) {
  for (let i = 0; i < 13; i++) {
    const a = rnd() * TAU
    const r = Math.sqrt(rnd()) * 0.86
    const cx = Math.cos(a) * rx * r
    const cy = Math.sin(a) * ry * r
    const size = rx * (0.17 + rnd() * 0.26)
    const spin = rnd() * TAU
    const sides = 3 + Math.floor(rnd() * 3)

    const pts = []
    for (let k = 0; k < sides; k++) {
      const ang = spin + (k / sides) * TAU
      const rr = size * (0.62 + rnd() * 0.5)
      pts.push([cx + Math.cos(ang) * rr, cy + Math.sin(ang) * rr * 1.15])
    }

    // the plate's own face, a shade off the shell so the break between plates is readable
    ctx.globalAlpha = 0.3
    ctx.fillStyle = rnd() < 0.5 ? s.accent : s.lite
    ctx.beginPath()
    ctx.moveTo(pts[0][0], pts[0][1])
    for (const p of pts.slice(1)) ctx.lineTo(p[0], p[1])
    ctx.closePath()
    ctx.fill()

    /* Its two edges. Only the segments facing up-left get the highlight and only those facing
       down-right get the shadow — drawing the whole outline in both would be an outline, and an
       outline is flat. */
    ctx.lineCap = 'round'
    for (let k = 0; k < pts.length; k++) {
      const p = pts[k]
      const q = pts[(k + 1) % pts.length]
      // the segment's outward normal, in the light's terms
      const nx = q[1] - p[1]
      const ny = -(q[0] - p[0])
      const lit = (nx * -0.7 + ny * -0.7) / (Math.hypot(nx, ny) || 1)
      ctx.globalAlpha = 0.6 * Math.abs(lit)
      ctx.strokeStyle = lit > 0 ? '#ffffff' : 'rgb(0 0 0 / .9)'
      ctx.lineWidth = rx * 0.022
      ctx.beginPath()
      ctx.moveTo(p[0], p[1])
      ctx.lineTo(q[0], q[1])
      ctx.stroke()
    }
  }
  ctx.globalAlpha = 1
}

/** GOD — molten plating. Overlapping scales, each lit along its upper arc and shadowed under it. */
function scales(ctx, rx, ry, s, rnd) {
  const rows = 7
  for (let row = 0; row < rows; row++) {
    const y = -ry * 0.95 + (row / (rows - 1)) * ry * 1.9
    const cols = 4
    const stagger = row % 2 ? rx * 0.24 : 0
    for (let c = 0; c <= cols; c++) {
      const x = -rx * 1.05 + (c / cols) * rx * 2.1 + stagger
      const w = rx * (0.24 + rnd() * 0.08)
      const h = ry * (0.19 + rnd() * 0.06)

      ctx.globalAlpha = 0.26
      ctx.fillStyle = rnd() < 0.5 ? s.accent : s.mid
      ctx.beginPath()
      ctx.ellipse(x, y, w, h, 0, Math.PI, TAU)
      ctx.lineTo(x - w, y)
      ctx.closePath()
      ctx.fill()

      // the lit crest
      ctx.globalAlpha = 0.5
      ctx.strokeStyle = s.lite
      ctx.lineWidth = rx * 0.02
      ctx.beginPath()
      ctx.ellipse(x, y - rx * 0.008, w * 0.96, h * 0.96, 0, Math.PI * 1.05, TAU * 0.98)
      ctx.stroke()

      // and the shadow it throws on the scale below it
      ctx.globalAlpha = 0.42
      ctx.strokeStyle = 'rgb(0 0 0 / .9)'
      ctx.lineWidth = rx * 0.026
      ctx.beginPath()
      ctx.ellipse(x, y + rx * 0.016, w, h, 0, Math.PI * 1.12, TAU * 0.9)
      ctx.stroke()
    }
  }
  ctx.globalAlpha = 1
}

const RELIEFS = { facets, scales }

/**
 * The shell's whole surface, assuming a clip is already in place: body, pattern, occlusion, sheen.
 * Called twice while it is breaking — once per piece — with the same seed, so the two halves are
 * two halves of one egg rather than two eggs.
 */
function paintShell(ctx, rx, ry, s, seed) {
  const rnd = streamOf(seed)

  const body = ctx.createLinearGradient(-rx * 0.4, -ry, rx * 0.35, ry)
  body.addColorStop(0, s.lite)
  body.addColorStop(0.42, s.mid)
  body.addColorStop(1, s.dark)
  ctx.fillStyle = body
  ctx.fillRect(-rx * 1.4, -ry * 1.4, rx * 2.8, ry * 2.8)

  ctx.save()
  PATTERNS[s.pattern]?.(ctx, rx, ry, s, rnd)
  ctx.restore()
  ctx.globalAlpha = 1

  // and, on the top two, the relief that sits on top of the pattern
  if (s.relief) {
    ctx.save()
    RELIEFS[s.relief]?.(ctx, rx, ry, s, rnd)
    ctx.restore()
    ctx.globalAlpha = 1
  }

  // occlusion into the bottom-right, so the pattern sits on a form rather than on a card
  const shade = ctx.createRadialGradient(-rx * 0.35, -ry * 0.4, rx * 0.1, rx * 0.1, ry * 0.2, rx * 2)
  shade.addColorStop(0, 'rgb(0 0 0 / 0)')
  shade.addColorStop(0.62, 'rgb(0 0 0 / .12)')
  shade.addColorStop(1, 'rgb(0 0 0 / .52)')
  ctx.fillStyle = shade
  ctx.fillRect(-rx * 1.4, -ry * 1.4, rx * 2.8, ry * 2.8)

  /* The gloss, and it is the whole difference between this and a fill. A broad sheen down the
     upper left, then one small hot spot inside it — two highlights, because one is a smudge and
     two is a wet surface. */
  ctx.save()
  ctx.globalAlpha = 0.5
  ctx.fillStyle = s.lite
  ctx.beginPath()
  ctx.ellipse(-rx * 0.36, -ry * 0.44, rx * 0.3, ry * 0.34, -0.42, 0, TAU)
  ctx.fill()
  ctx.globalAlpha = 0.92
  ctx.fillStyle = '#ffffff'
  ctx.beginPath()
  ctx.ellipse(-rx * 0.34, -ry * 0.55, rx * 0.13, ry * 0.15, -0.42, 0, TAU)
  ctx.fill()
  ctx.restore()
}

/** Where the shell comes apart: a jagged line across it, the same one every time. */
function splitPoints(rx, ry, seed) {
  const rnd = streamOf(seed + 5501)
  const pts = []
  const n = 9
  for (let i = 0; i <= n; i++) {
    const x = -rx * 1.2 + (i / n) * rx * 2.4
    pts.push([x, ry * (0.02 + (rnd() - 0.5) * 0.36)])
  }
  return pts
}

const tracePoints = (ctx, pts) => {
  ctx.moveTo(pts[0][0], pts[0][1])
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1])
}

/** The region above or below the split, as a closed path for clipping. */
function halfPath(ctx, rx, ry, pts, top) {
  ctx.beginPath()
  tracePoints(ctx, pts)
  const edge = top ? -ry * 1.6 : ry * 1.6
  ctx.lineTo(rx * 1.2, edge)
  ctx.lineTo(-rx * 1.2, edge)
  ctx.closePath()
}

/** A crack: a jagged walk out from the shell, forking once. */
function crackPath(ctx, rx, ry, rnd, len) {
  const a = rnd() * TAU
  let x = Math.cos(a) * rx * 0.44
  let y = Math.sin(a) * ry * 0.34
  let dir = rnd() * TAU
  ctx.moveTo(x, y)
  const steps = 4 + Math.floor(rnd() * 3)
  for (let i = 0; i < steps; i++) {
    dir += (rnd() - 0.5) * 1.6
    const step = (len / steps) * (0.7 + rnd() * 0.6)
    x += Math.cos(dir) * step * rx
    y += Math.sin(dir) * step * ry
    ctx.lineTo(x, y)
  }
  if (rnd() < 0.75) {
    const bx = x
    const by = y
    let bd = dir + (rnd() < 0.5 ? -1 : 1) * (0.6 + rnd() * 0.7)
    for (let i = 0; i < 2; i++) {
      bd += (rnd() - 0.5) * 0.9
      ctx.moveTo(bx, by)
      ctx.lineTo(bx + Math.cos(bd) * len * 0.2 * rx, by + Math.sin(bd) * len * 0.2 * ry)
    }
  }
}

function paintCracks(ctx, rx, ry, s, seed, cracks, t) {
  if (cracks <= 0) return
  const rnd = streamOf(seed)
  const heat = s.heat * (0.55 + 0.45 * Math.sin(t * 2.2))
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  for (let i = 0; i < cracks; i++) {
    const len = 0.26 + rnd() * 0.22
    const path = () => crackPath(ctx, rx, ry, streamOf(seed + i * 7919), len)

    if (heat > 0.02) {
      ctx.save()
      ctx.globalAlpha = heat * 0.7
      ctx.strokeStyle = s.glow
      ctx.lineWidth = rx * 0.16
      ctx.beginPath()
      path()
      ctx.stroke()
      ctx.restore()
    }

    /* A **lit lip** offset down and right, then the split on top of it. One dark line alone is a
       pen mark on an egg; the same line with the shell's own light along one side of it is a piece
       of shell standing slightly proud of the piece beside it. */
    ctx.save()
    ctx.translate(rx * 0.02, rx * 0.024)
    ctx.globalAlpha = 0.85
    ctx.strokeStyle = s.lite
    ctx.lineWidth = Math.max(1, rx * 0.024)
    ctx.beginPath()
    path()
    ctx.stroke()
    ctx.restore()

    ctx.strokeStyle = 'rgb(0 0 0 / .62)'
    ctx.lineWidth = Math.max(1, rx * 0.026)
    ctx.beginPath()
    path()
    ctx.stroke()
  }
}

/**
 * @param {CanvasRenderingContext2D} ctx origin at the egg's centre
 * @param {number} R the egg's half-width in pixels; it stands 1.3 R tall
 * @param {number} t seconds — the glow and the aura only
 * @param {object} o
 * @param {string} o.tier tier id, which picks the shell
 * @param {number} o.seed the Oglet's own number
 * @param {number} [o.cracks] 0…6
 * @param {number} [o.open] 0…1 — the shell coming apart
 */
export function drawEgg(ctx, R, t, { tier, seed, cracks = 0, open = 0 }) {
  const s = shellFor(tier)
  const rx = R
  const ry = R * 1.3
  const key = seed >>> 0

  ctx.save()

  /* The aura. Every reference egg sits in its own light, and on a field this dark it is what keeps
     the silhouette off the background — plus it is the cheapest place to put the tier's heat. */
  const auraR = rx * (2.1 + s.heat * 0.5)
  const pulse = 0.45 + s.heat * (0.3 + 0.25 * Math.sin(t * 1.9))
  const aura = ctx.createRadialGradient(0, 0, rx * 0.6, 0, 0, auraR)
  aura.addColorStop(0, s.glow)
  aura.addColorStop(1, 'rgb(0 0 0 / 0)')
  ctx.globalAlpha = 0.16 + pulse * 0.2
  ctx.fillStyle = aura
  ctx.beginPath()
  ctx.arc(0, 0, auraR, 0, TAU)
  ctx.fill()
  ctx.globalAlpha = 1

  if (open <= 0.001) {
    ctx.save()
    eggPath(ctx, rx, ry)
    ctx.clip()
    paintShell(ctx, rx, ry, s, key)
    paintCracks(ctx, rx, ry, s, key, cracks, t)
    ctx.restore()

    // a hairline of the shell's own light along the rim, so the edge is not a hard cut
    ctx.globalAlpha = 0.55
    ctx.strokeStyle = s.lite
    ctx.lineWidth = Math.max(1, rx * 0.016)
    eggPath(ctx, rx, ry)
    ctx.stroke()
    ctx.globalAlpha = 1
    ctx.restore()
    return
  }

  /* Coming apart. Two pieces of one egg: the cup stays put and the lid lifts, tips and slides —
     both painted from the same seed, so the pattern runs continuously across the break. */
  const pts = splitPoints(rx, ry, key)
  const ease = open * open

  /* THE HOLLOW — the space the lid was in, and nothing more.
     It used to be a plain rectangle across the middle of the egg, which left a hard horizontal edge
     wherever the rectangle stopped and the shell had not covered it: a black wedge sitting in the
     egg that read as a rendering fault rather than as an inside. It is now clipped to the shell's
     own outline **above the split**, so its shape is exactly the piece that lifted off, and shaded
     from nearly-open at the split to solid at the top so it reads as depth instead of a hole. */
  ctx.save()
  eggPath(ctx, rx, ry)
  ctx.clip()
  halfPath(ctx, rx, ry, pts, true)
  ctx.clip()
  ctx.globalAlpha = Math.min(1, open * 2.4)
  const hollow = ctx.createLinearGradient(0, ry * 0.12, 0, -ry)
  hollow.addColorStop(0, 'rgb(4 3 6 / .35)')
  hollow.addColorStop(0.45, 'rgb(4 3 6 / .88)')
  hollow.addColorStop(1, 'rgb(2 2 4 / .96)')
  ctx.fillStyle = hollow
  ctx.fillRect(-rx * 1.3, -ry * 1.3, rx * 2.6, ry * 2.6)
  if (s.heat > 0.05) {
    // something in there is still lit, on the hot shells
    const inner = ctx.createRadialGradient(0, -ry * 0.1, 0, 0, -ry * 0.1, rx * 0.9)
    inner.addColorStop(0, s.glow)
    inner.addColorStop(1, 'rgb(0 0 0 / 0)')
    ctx.globalAlpha = Math.min(1, open * 2.4) * s.heat * 0.55
    ctx.fillStyle = inner
    ctx.fillRect(-rx * 1.3, -ry * 1.3, rx * 2.6, ry * 2.6)
  }
  ctx.globalAlpha = 1
  ctx.restore()

  // the cup
  ctx.save()
  eggPath(ctx, rx, ry)
  ctx.clip()
  halfPath(ctx, rx, ry, pts, false)
  ctx.clip()
  paintShell(ctx, rx, ry, s, key)
  paintCracks(ctx, rx, ry, s, key, cracks, t)
  ctx.restore()

  // the lid
  ctx.save()
  ctx.translate(-rx * 0.5 * ease, -ry * 0.85 * ease)
  ctx.rotate(-0.55 * ease)
  eggPath(ctx, rx, ry)
  ctx.clip()
  halfPath(ctx, rx, ry, pts, true)
  ctx.clip()
  paintShell(ctx, rx, ry, s, key)
  paintCracks(ctx, rx, ry, s, key, cracks, t)
  ctx.restore()

  ctx.restore()
}

/**
 * Shell fragments, for the moment it goes. Seeded like everything else, so the same egg always
 * breaks the same way.
 *
 * @param {number} amount 0…1 — 0 is intact, 1 is gone
 */
export function drawShards(ctx, R, seed, amount, tier) {
  if (amount <= 0.001) return
  const s = shellFor(tier)
  const rnd = streamOf((seed >>> 0) + 1013)
  /* They start at the shell's **rim**, not at its centre, and fade in over the first moment of the
     break. Flying out from the middle piled chips on top of an egg that had barely opened, which
     read as debris stuck to it rather than as pieces of it leaving. */
  const grow = Math.min(1, amount / 0.12)
  const fade = grow * (1 - amount * amount)

  ctx.save()
  for (let i = 0; i < 11; i++) {
    const a = rnd() * TAU
    const fly = R * (0.72 + amount * (1.2 + rnd() * 2.2))
    const x = Math.cos(a) * fly
    // gravity: they arc rather than fanning out flat, which is the only cue that they have weight
    const y = Math.sin(a) * fly * 0.9 - R * 0.4 * amount + R * 2.2 * amount * amount
    const size = R * (0.1 + rnd() * 0.18)

    ctx.globalAlpha = fade * (0.55 + rnd() * 0.45)
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(a + amount * 6 * (rnd() < 0.5 ? -1 : 1))
    // a chip is lit on one face and dark on the other, like any other piece of curved shell
    ctx.fillStyle = rnd() < 0.5 ? s.mid : s.lite
    ctx.beginPath()
    ctx.moveTo(-size, size * 0.55)
    ctx.lineTo(-size * 0.2, -size)
    ctx.lineTo(size, size * 0.2)
    ctx.lineTo(size * 0.3, size)
    ctx.closePath()
    ctx.fill()
    ctx.strokeStyle = 'rgb(0 0 0 / .3)'
    ctx.lineWidth = Math.max(1, size * 0.1)
    ctx.stroke()
    ctx.restore()
  }
  ctx.restore()
}
