/* Colour maths, needed only by the Prism finish — which cycles hue while keeping the
   saturation and lightness the palette author chose. Working in HSL rather than in RGB is
   what stops a cycling Void turning into mud halfway round the wheel. */

export function hex2hsl(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  const mx = Math.max(r, g, b)
  const mn = Math.min(r, g, b)
  const l = (mx + mn) / 2
  let s = 0
  let h = 0
  if (mx !== mn) {
    const d = mx - mn
    s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn)
    h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4
    h *= 60
  }
  return [h, s, l]
}

export const hsl = (h, s, l) =>
  `hsl(${((h % 360) + 360) % 360} ${(s * 100).toFixed(1)}% ${(l * 100).toFixed(1)}%)`

/**
 * Eye colour and pupil colour are two independent genes, so nothing stops a pale pupil landing
 * on a pale iris and vanishing. When the two are within `gap` of each other in lightness, the
 * pupil is pushed away from the iris rather than replaced — it keeps its hue, which is the part
 * the gene is actually about.
 */
export function readablePupil(irisHex, pupilHex, gap = 0.26) {
  const [, , li] = hex2hsl(irisHex)
  const [h, s, lp] = hex2hsl(pupilHex)
  if (Math.abs(li - lp) >= gap) return pupilHex
  const pushed = li > 0.5 ? li - gap - 0.06 : li + gap + 0.06
  return hsl(h, s, Math.min(0.96, Math.max(0.06, pushed)))
}
