/* ============================================================
   glyphs.js: the zodiac and planet marks.

   The site used the Unicode astrological block (U+2648 onwards) for
   every sign and planet. That rendered as whatever font the visitor
   happened to have: on Windows the signs fall back to a bitmap-era
   Segoe cut, on Android several arrive as colour emoji, and none of
   them sit at the optical weight of the type around them. On a page
   whose whole claim is that it was made carefully, twelve borrowed
   glyphs of inconsistent weight were the loudest thing on it.

   The twelve signs are now the commissioned artwork in
   public/assets/images/zodiac. The seven planets are drawn here as
   paths, because no artwork was supplied for them and they appear
   small enough that a single stroke weight is all they need.
   ============================================================ */

const V = 'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"';

/*
   One 24x24 grid, one stroke weight, round caps, `currentColor`, so a
   planet at 12px in a table and the same planet at 40px stay optically
   identical and neither sits heavier than its neighbours in a row.
*/
export const PLANET_PATHS = {
  Sun: "M12 17.5a5.5 5.5 0 1 0 0-11 5.5 5.5 0 0 0 0 11ZM12 12h.01",
  Moon: "M16.5 3.4a9 9 0 1 0 0 17.2 10.4 10.4 0 0 1 0-17.2Z",
  Mercury: "M12 13.6a4.2 4.2 0 1 0 0-8.4 4.2 4.2 0 0 0 0 8.4ZM12 13.6v7M8.6 17.6h6.8M8.4 2.2a4.6 4.6 0 0 0 7.2 0",
  Venus: "M12 13.8a4.6 4.6 0 1 0 0-9.2 4.6 4.6 0 0 0 0 9.2ZM12 13.8v7.4M8.6 17.8h6.8",
  Mars: "M9.6 20.2a5.4 5.4 0 1 0 0-10.8 5.4 5.4 0 0 0 0 10.8ZM13.6 10.4 20.6 3.4M15.4 3.4h5.2v5.2",
  Jupiter: "M3.8 6.4c.4-2 2-3.2 3.8-3 2 .2 3.2 1.8 3.2 4 0 3.6-3.4 6-3.4 9.6v3.6M3.6 20.6h11.8M14 3.6v17",
  Saturn: "M4.4 6.6h6.4M8 3.4v11.8c0 1.6 1 2.6 2.4 2.6M11.2 12.2c1.4-2 3.6-2.2 5.2-.8 1.8 1.6 2 4.6.6 6.8-1 1.6-2.6 2.6-4.4 2.8",
};

/* ============================================================
   THE ZODIAC MARKS

   The twelve signs are drawn artwork, held in
   public/assets/images/zodiac and prepared by tools/trim-zodiac.mjs:
   cropped to the ink, squared into one shared frame, and given an alpha
   channel derived from luminance. See that file for why.

   They are painted as a CSS mask filled with `currentColor` rather than
   placed as an <img>. An <img> of black artwork would be a black mark on
   a black archive and a white box on the paper tab; as a mask the sign
   inherits whatever colour the type around it has, which is the same
   behaviour the drawn SVGs had and the reason every call site still
   works unchanged.
   ============================================================ */
const SIGN_FILE = {
  Aries: "aries", Taurus: "taurus", Gemini: "gemini", Cancer: "cancer",
  Leo: "leo", Virgo: "virgo", Libra: "libra", Scorpio: "scorpio",
  Sagittarius: "sagittarius", Capricorn: "capricorn", Aquarius: "aquarius",
  Pisces: "pisces",
};

export function signAsset(name) {
  const f = SIGN_FILE[name];
  return f ? `/assets/images/zodiac/trimmed/${f}.png` : "";
}

/** One sign, as a tintable mark. `size` is a CSS length. */
export function signIcon(name, { size = "1em", cls = "", title = "" } = {}) {
  const src = signAsset(name);
  if (!src) return "";
  return `<span class="glyph sign-mark ${cls}" role="img" aria-label="${title || name}"` +
    ` style="--sign:url('${src}');width:${size};height:${size}"></span>`;
}

/** The same artwork as a plain image, for surfaces that cannot mask (see style.css). */
export function signImage(name, { size = "1em", cls = "", title = "" } = {}) {
  const src = signAsset(name);
  if (!src) return "";
  return `<img class="sign-img ${cls}" src="${src}" alt="${title || name}"` +
    ` style="width:${size};height:${size}" />`;
}

/** One planet, as an inline SVG. */
export function planetIcon(name, { size = "1em", cls = "", title = "" } = {}) {
  const d = PLANET_PATHS[name];
  if (!d) return "";
  return `<svg class="glyph ${cls}" ${V} width="${size}" height="${size}" role="img" aria-label="${title || name}"><path d="${d}"/></svg>`;
}

export const SIGN_ORDER = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
];
