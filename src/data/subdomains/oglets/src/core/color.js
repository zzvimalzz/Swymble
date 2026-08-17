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
/**
 * HSL from either form `render/hues.js` can hand back: a plain hex, or the `hsl()` string a Prism
 * mutation produces. Anything else falls back to a mid grey rather than throwing — a colour is
 * resolved every frame for every eye, and this is not a place to be brittle.
 */
export function toHsl(colour) {
  if (typeof colour === 'string' && colour.startsWith('#')) return hex2hsl(colour)
  const m = typeof colour === 'string' && colour.match(/hsl\(\s*([\d.-]+)\s+([\d.]+)%\s+([\d.]+)%/)
  return m ? [parseFloat(m[1]), parseFloat(m[2]) / 100, parseFloat(m[3]) / 100] : [0, 0, 0.5]
}

/**
 * THE COLOUR OF A BODY, from the colour of the eye in it.
 *
 * Deriving it rather than giving the body a colour gene of its own is what keeps a bodied Oglet
 * reading as **one animal** instead of an animal wearing a coat — and it saves a sixth categorical
 * gene, which would be another fourteen alleles and another re-cut of the rarity ladder.
 *
 * The hue is kept and the lightness is thrown to the far side of the eye's, which is the same
 * trick `readablePupil` plays and it is here for the same reason: nothing else stops an Ember eye
 * (nearly black) sitting on a body derived from an Ember eye and simply not being there. So a pale
 * eye gets a deep body and a dark eye gets a pale one — the second case is the more striking of
 * the two, and it is the one that would otherwise have been a bug.
 *
 * The floor is 0.10 and not 0: `--well` is `#070708`, and a body any darker than this is a hole.
 */
export function bodyTone(eyeColour) {
  const [h, s, l] = toHsl(eyeColour)
  const lb = l > 0.42 ? Math.max(0.1, Math.min(l - 0.34, 0.28)) : Math.min(0.62, Math.max(l + 0.3, 0.32))
  return hsl(h, s * 0.55, lb)
}

export function readablePupil(irisHex, pupilHex, gap = 0.26) {
  const [, , li] = hex2hsl(irisHex)
  const [h, s, lp] = hex2hsl(pupilHex)
  if (Math.abs(li - lp) >= gap) return pupilHex
  const pushed = li > 0.5 ? li - gap - 0.06 : li + gap + 0.06
  return hsl(h, s, Math.min(0.96, Math.max(0.06, pushed)))
}
