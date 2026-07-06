/* ============================================================
   cosmos.js — visual reference data
     • stylised zodiac constellation patterns (normalised 0..1,
       y measured from the top) for the SVG star-map
     • gemstone colours for the 3D birthstone
   ============================================================ */

// Each: { stars: [[x,y], ...], lines: [[i,j], ...] }  — recognisable, stylised.
export const CONSTELLATIONS = {
  Aries: {
    stars: [[0.18, 0.58], [0.42, 0.5], [0.62, 0.42], [0.82, 0.32]],
    lines: [[0, 1], [1, 2], [2, 3]]
  },
  Taurus: {
    stars: [[0.46, 0.56], [0.3, 0.46], [0.6, 0.46], [0.18, 0.2], [0.86, 0.18]],
    lines: [[1, 0], [0, 2], [1, 3], [2, 4]]
  },
  Gemini: {
    stars: [[0.35, 0.2], [0.4, 0.46], [0.45, 0.74], [0.62, 0.2], [0.64, 0.46], [0.67, 0.74]],
    lines: [[0, 1], [1, 2], [3, 4], [4, 5], [0, 3]]
  },
  Cancer: {
    stars: [[0.5, 0.24], [0.5, 0.5], [0.28, 0.72], [0.72, 0.7]],
    lines: [[0, 1], [1, 2], [1, 3]]
  },
  Leo: {
    stars: [[0.26, 0.72], [0.3, 0.56], [0.37, 0.42], [0.49, 0.34], [0.57, 0.47], [0.86, 0.62], [0.7, 0.5]],
    lines: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 6], [6, 5], [5, 0]]
  },
  Virgo: {
    stars: [[0.2, 0.3], [0.35, 0.4], [0.5, 0.46], [0.62, 0.6], [0.78, 0.5], [0.55, 0.82]],
    lines: [[0, 1], [1, 2], [2, 3], [3, 4], [3, 5]]
  },
  Libra: {
    stars: [[0.3, 0.3], [0.66, 0.26], [0.5, 0.55], [0.24, 0.72], [0.76, 0.72]],
    lines: [[0, 1], [0, 2], [1, 2], [2, 3], [2, 4]]
  },
  Scorpio: {
    stars: [[0.2, 0.24], [0.32, 0.3], [0.15, 0.4], [0.4, 0.46], [0.5, 0.6], [0.6, 0.72], [0.72, 0.79], [0.84, 0.72], [0.82, 0.6]],
    lines: [[0, 1], [0, 2], [1, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8]]
  },
  Sagittarius: {
    stars: [[0.24, 0.55], [0.4, 0.45], [0.56, 0.45], [0.72, 0.55], [0.6, 0.72], [0.4, 0.72], [0.5, 0.3]],
    lines: [[1, 2], [2, 3], [3, 4], [4, 5], [5, 1], [1, 6], [2, 6], [0, 1]]
  },
  Capricorn: {
    stars: [[0.2, 0.3], [0.5, 0.72], [0.8, 0.32], [0.35, 0.5], [0.65, 0.5]],
    lines: [[0, 3], [3, 1], [1, 4], [4, 2], [0, 2]]
  },
  Aquarius: {
    stars: [[0.18, 0.35], [0.34, 0.52], [0.5, 0.4], [0.66, 0.56], [0.82, 0.44], [0.5, 0.74]],
    lines: [[0, 1], [1, 2], [2, 3], [3, 4], [2, 5]]
  },
  Pisces: {
    stars: [[0.18, 0.72], [0.4, 0.56], [0.55, 0.46], [0.7, 0.34], [0.86, 0.2], [0.48, 0.26]],
    lines: [[0, 1], [1, 2], [2, 3], [3, 4], [2, 5]]
  }
};

// a characterful, deterministic "reading" per sign — for the astrology section
export const ZODIAC_READINGS = {
  Aries: { ruler: "Mars", reading: "You meet life the way a match meets air — fast, bright, unafraid. The stars cast you as the one who moves first, while everyone else is still deciding.", strengths: "Courage, drive, honesty", growth: "Learning that patience can be its own kind of power.", day: "Tuesday", color: "Scarlet" },
  Taurus: { ruler: "Venus", reading: "You were built for the long, good things — comfort, loyalty, beauty that lasts. Where others chase, you cultivate, and what you grow tends to stay.", strengths: "Steadiness, devotion, taste", growth: "Letting change in before it forces the door.", day: "Friday", color: "Emerald" },
  Gemini: { ruler: "Mercury", reading: "Two minds and one restless heart — curious, quick, impossible to bore. The cosmos handed you language, wit, and a hunger to know a little of everything.", strengths: "Wit, adaptability, charm", growth: "Finishing the one thing among the many.", day: "Wednesday", color: "Citrine yellow" },
  Cancer: { ruler: "the Moon", reading: "Ruled by the very moon you were born under, you feel in tides. Home, memory and the people you love are your truest north.", strengths: "Empathy, loyalty, intuition", growth: "Protecting your softness without building walls.", day: "Monday", color: "Silver" },
  Leo: { ruler: "the Sun", reading: "You were born to be seen — warm, generous, a little theatrical. The stars gave you the sun itself, and a heart that shines for the people around you.", strengths: "Confidence, warmth, generosity", growth: "Remembering the spotlight is kinder when it's shared.", day: "Sunday", color: "Gold" },
  Virgo: { ruler: "Mercury", reading: "You see what others miss — the detail, the fix, the better way. Precise and quietly kind, you improve every room you walk into.", strengths: "Precision, devotion, cleverness", growth: "Letting 'good enough' be enough, sometimes.", day: "Wednesday", color: "Sage green" },
  Libra: { ruler: "Venus", reading: "You came in search of balance and beauty. Fair-minded and disarmingly charming, you weigh the world with care and tilt it toward harmony.", strengths: "Diplomacy, grace, fairness", growth: "Choosing decisively — for yourself first.", day: "Friday", color: "Blush rose" },
  Scorpio: { ruler: "Pluto", reading: "Intense, magnetic, all depth — you simply don't do shallow. The stars gave you the power to transform: to feel everything, and survive it.", strengths: "Passion, loyalty, resilience", growth: "Trusting a little before you're certain.", day: "Tuesday", color: "Crimson" },
  Sagittarius: { ruler: "Jupiter", reading: "Born restless and wide-eyed, you chase horizons. The cosmos packed your bags with optimism and a need to see what's over the next hill.", strengths: "Optimism, honesty, adventure", growth: "Staying long enough to put down roots.", day: "Thursday", color: "Indigo" },
  Capricorn: { ruler: "Saturn", reading: "You play the long game better than anyone. Disciplined and quietly ambitious, you climb steadily toward summits others only talk about.", strengths: "Discipline, patience, integrity", growth: "Letting joy in before the work is finished.", day: "Saturday", color: "Slate grey" },
  Aquarius: { ruler: "Uranus", reading: "You think in tomorrows. Original and deeply humane, you were born a little ahead of your time — here to imagine what the rest of us haven't yet.", strengths: "Originality, vision, fairness", growth: "Letting people close, not just causes.", day: "Saturday", color: "Electric blue" },
  Pisces: { ruler: "Neptune", reading: "Dreamer, feeler, gentle soul — you live half in this world and half in a richer one. Compassion is both your superpower and your tide.", strengths: "Imagination, empathy, artistry", growth: "Keeping one foot on solid ground.", day: "Thursday", color: "Seafoam" }
};

// base = body colour, glow = highlight/rim colour
export const GEM_COLORS = {
  Garnet: { base: "#7b1f2b", glow: "#d23b53" },
  Amethyst: { base: "#6f3fb0", glow: "#b98bef" },
  Aquamarine: { base: "#3fb6c4", glow: "#a8eef0" },
  Diamond: { base: "#9fc4e8", glow: "#ffffff" },
  Emerald: { base: "#118a4c", glow: "#4fe08a" },
  Pearl: { base: "#e6dcca", glow: "#fff8ec" },
  Ruby: { base: "#b3142e", glow: "#ff5070" },
  Peridot: { base: "#8db82a", glow: "#cdee5a" },
  Sapphire: { base: "#1f49b0", glow: "#6a93f0" },
  Opal: { base: "#bfe0dd", glow: "#ffd1e8" },
  Topaz: { base: "#cf922b", glow: "#f7c861" },
  Turquoise: { base: "#1fafa9", glow: "#6fe3d2" }
};
