// The colour half of the lab palette generator, kept apart from the browser that rasterises the
// logos so it can be tested without launching one. Everything here is pure: pixels in, tokens out.

/** Pixels this transparent are the space around a mark, not the mark. */
const MIN_ALPHA = 200;

/** A logo's outline and its highlights are almost always near-black or near-white, and neither
 *  says anything about the product's colour. */
const MIN_LIGHTNESS = 0.14;
const MAX_LIGHTNESS = 0.93;

/** Below this a pixel is grey — grey has no hue worth extracting. */
const MIN_SATURATION = 0.16;

/** Hue buckets. 24 is fine enough to keep MyDompet's mint apart from Territory's green and coarse
 *  enough that a gradient still lands in one bucket. */
const BUCKETS = 24;

export const rgbToHsl = (r, g, b) => {
  const red = r / 255;
  const green = g / 255;
  const blue = b / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const lightness = (max + min) / 2;

  if (max === min) return { h: 0, s: 0, l: lightness };

  const delta = max - min;
  const saturation = lightness > 0.5 ? delta / (2 - max - min) : delta / (max + min);

  let hue;
  if (max === red) hue = ((green - blue) / delta + (green < blue ? 6 : 0)) / 6;
  else if (max === green) hue = ((blue - red) / delta + 2) / 6;
  else hue = ((red - green) / delta + 4) / 6;

  return { h: hue * 360, s: saturation, l: lightness };
};

export const hslToHex = (h, s, l) => {
  const hue = ((h % 360) + 360) % 360;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = l - c / 2;

  const [r, g, b] =
    hue < 60 ? [c, x, 0]
    : hue < 120 ? [x, c, 0]
    : hue < 180 ? [0, c, x]
    : hue < 240 ? [0, x, c]
    : hue < 300 ? [x, 0, c]
    : [c, 0, x];

  const channel = (value) =>
    Math.round((value + m) * 255)
      .toString(16)
      .padStart(2, '0');

  return `#${channel(r)}${channel(g)}${channel(b)}`;
};

/**
 * The logo's hue, as the most-covered bucket weighted by how saturated its pixels are.
 *
 * Weighting by saturation rather than by count alone is what stops a mark that is 80% dark grey
 * with one bright accent from reporting "grey": the accent is what a reader recognises.
 *
 * Returns null when there is no colour to find — a black-and-white mark like Cortex's — and the
 * caller falls back to the site's own ink rather than inventing a tint.
 */
export const dominantHue = (pixels) => {
  const buckets = new Array(BUCKETS).fill(0);
  const hueSum = new Array(BUCKETS).fill(0);
  const satSum = new Array(BUCKETS).fill(0);
  const litSum = new Array(BUCKETS).fill(0);
  let counted = 0;

  for (let i = 0; i + 3 < pixels.length; i += 4) {
    if (pixels[i + 3] < MIN_ALPHA) continue;

    const { h, s, l } = rgbToHsl(pixels[i], pixels[i + 1], pixels[i + 2]);
    if (l < MIN_LIGHTNESS || l > MAX_LIGHTNESS || s < MIN_SATURATION) continue;

    const bucket = Math.min(BUCKETS - 1, Math.floor((h / 360) * BUCKETS));
    const weight = s;
    buckets[bucket] += weight;
    hueSum[bucket] += h * weight;
    satSum[bucket] += s * weight;
    litSum[bucket] += l * weight;
    counted += 1;
  }

  if (counted === 0) return null;

  let best = 0;
  for (let bucket = 1; bucket < BUCKETS; bucket += 1) {
    if (buckets[bucket] > buckets[best]) best = bucket;
  }
  if (buckets[best] === 0) return null;

  return {
    h: hueSum[best] / buckets[best],
    s: satSum[best] / buckets[best],
    l: litSum[best] / buckets[best],
    /** Share of the counted colour that agreed on this hue. Low means a busy, multi-colour mark. */
    confidence: buckets[best] / buckets.reduce((total, value) => total + value, 0),
  };
};

/** What a bubble gets when its logo has no colour of its own. Matches the ink the field used
 *  before any of this existed, so a black-and-white mark is not a regression. */
export const NEUTRAL_PALETTE = {
  bg: '#0a0a0c',
  tint: '#12121a',
  glow: 'rgba(255, 255, 255, 0.06)',
};

/**
 * Three tokens from one hue.
 *
 * Lightness and saturation are fixed by formula rather than taken from the logo: a bright pink
 * mark and a deep navy one must both end up as a *dark* bubble that the site's type can sit on,
 * or the field stops looking like one thing. Only the hue survives from the image.
 */
export const paletteFromHue = (hue) => {
  if (!hue) return { ...NEUTRAL_PALETTE };

  const h = hue.h;
  // A touch more saturation for a confident, single-colour mark; less for a busy one, where the
  // extracted hue is more of a guess.
  const saturation = 0.3 + Math.min(0.22, hue.confidence * 0.22);

  return {
    /** The bubble's base: near black, but unmistakably tinted once it is next to a neutral one. */
    bg: hslToHex(h, saturation, 0.075),
    /** The lit side of the sphere, used for the top-left highlight. */
    tint: hslToHex(h, saturation * 0.9, 0.15),
    /** What spills onto the page underneath it. */
    glow: `rgba(${hexToRgbTriplet(hslToHex(h, 0.72, 0.55))}, 0.4)`,
  };
};

export const hexToRgbTriplet = (hex) => {
  const value = hex.replace('#', '');
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `${r}, ${g}, ${b}`;
};

/** The whole job for one logo, given its pixels. */
export const paletteFromPixels = (pixels) => paletteFromHue(dominantHue(pixels));
