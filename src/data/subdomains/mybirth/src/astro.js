/* ============================================================
   astro.js — everything we can compute exactly from the date.
   No network, fully deterministic, genuinely accurate.
   ============================================================ */

const SYNODIC = 29.530588853;          // mean length of a lunar month (days)
const REF_NEW_MOON_JD = 2451550.1;     // known new moon: 2000-01-06 18:14 UTC

/** Julian Day from a JS Date (UTC). */
export function toJulian(date) {
  return date.getTime() / 86400000 + 2440587.5;
}

/**
 * Moon phase for a given Date.
 * Returns fraction (0=new, 0.5=full), age in days, illuminated fraction 0..1,
 * a human phase name and waxing/waning flag.
 */
export function moonPhase(date) {
  const jd = toJulian(date);
  let cycles = (jd - REF_NEW_MOON_JD) / SYNODIC;
  let frac = cycles - Math.floor(cycles);
  if (frac < 0) frac += 1;

  const age = frac * SYNODIC;
  const illum = (1 - Math.cos(2 * Math.PI * frac)) / 2;
  const waxing = frac <= 0.5;

  return { fraction: frac, age, illumination: illum, waxing, name: phaseName(frac), emoji: phaseEmoji(frac) };
}

function phaseName(f) {
  if (f < 0.0335 || f > 0.9665) return "New Moon";
  if (f < 0.2165) return "Waxing Crescent";
  if (f < 0.2835) return "First Quarter";
  if (f < 0.4665) return "Waxing Gibbous";
  if (f < 0.5335) return "Full Moon";
  if (f < 0.7165) return "Waning Gibbous";
  if (f < 0.7835) return "Last Quarter";
  return "Waning Crescent";
}

function phaseEmoji(f) {
  const phases = ["🌑", "🌒", "🌓", "🌔", "🌕", "🌖", "🌗", "🌘"];
  return phases[Math.round(f * 8) % 8];
}

/* ---------- Western zodiac ---------- */
const ZODIAC = [
  { sign: "Capricorn", from: [12, 22], symbol: "♑", element: "Earth" },
  { sign: "Aquarius", from: [1, 20], symbol: "♒", element: "Air" },
  { sign: "Pisces", from: [2, 19], symbol: "♓", element: "Water" },
  { sign: "Aries", from: [3, 21], symbol: "♈", element: "Fire" },
  { sign: "Taurus", from: [4, 20], symbol: "♉", element: "Earth" },
  { sign: "Gemini", from: [5, 21], symbol: "♊", element: "Air" },
  { sign: "Cancer", from: [6, 21], symbol: "♋", element: "Water" },
  { sign: "Leo", from: [7, 23], symbol: "♌", element: "Fire" },
  { sign: "Virgo", from: [8, 23], symbol: "♍", element: "Earth" },
  { sign: "Libra", from: [9, 23], symbol: "♎", element: "Air" },
  { sign: "Scorpio", from: [10, 23], symbol: "♏", element: "Water" },
  { sign: "Sagittarius", from: [11, 22], symbol: "♐", element: "Fire" },
  { sign: "Capricorn", from: [12, 22], symbol: "♑", element: "Earth" }
];

export function zodiac(month, day) {
  // month is 1-12
  for (let i = ZODIAC.length - 1; i >= 0; i--) {
    const [m, d] = ZODIAC[i].from;
    if (month > m || (month === m && day >= d)) return ZODIAC[i];
  }
  return ZODIAC[0];
}

/* ---------- Chinese zodiac ---------- */
const CHINESE = ["Rat", "Ox", "Tiger", "Rabbit", "Dragon", "Snake", "Horse", "Goat", "Monkey", "Rooster", "Dog", "Pig"];
const CHINESE_ELEMENTS = ["Metal", "Metal", "Water", "Water", "Wood", "Wood", "Fire", "Fire", "Earth", "Earth"];

export function chineseZodiac(year) {
  const animal = CHINESE[(year - 4) % 12];
  const element = CHINESE_ELEMENTS[(year - 4) % 10];
  return { animal, element, label: `${element} ${animal}` };
}

/* ---------- birthstone & birth flower ---------- */
const BIRTHSTONES = ["Garnet", "Amethyst", "Aquamarine", "Diamond", "Emerald", "Pearl", "Ruby", "Peridot", "Sapphire", "Opal", "Topaz", "Turquoise"];
const BIRTH_FLOWERS = ["Carnation", "Violet", "Daffodil", "Daisy", "Lily of the Valley", "Rose", "Larkspur", "Gladiolus", "Aster", "Marigold", "Chrysanthemum", "Narcissus"];

export function birthstone(month) { return BIRTHSTONES[month - 1]; }
export function birthFlower(month) { return BIRTH_FLOWERS[month - 1]; }

/* ---------- day of week, ordinals, helpers ---------- */
const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export function weekday(date) { return WEEKDAYS[date.getUTCDay()]; }
export function monthName(month) { return MONTHS[month - 1]; }

export function ordinal(n) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export function prettyDate(day, month, year) {
  return `${ordinal(day)} of ${monthName(month)}, ${year}`;
}

/** Age in years as of `today`, plus days until next birthday. */
export function ageInfo(day, month, year, today) {
  let age = today.getUTCFullYear() - year;
  const hadBirthday =
    today.getUTCMonth() + 1 > month ||
    (today.getUTCMonth() + 1 === month && today.getUTCDate() >= day);
  if (!hadBirthday) age -= 1;

  // next birthday
  let nextYear = today.getUTCFullYear();
  const thisYearBday = Date.UTC(nextYear, month - 1, day);
  if (thisYearBday < Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())) {
    nextYear += 1;
  }
  const next = Date.UTC(nextYear, month - 1, day);
  const todayUTC = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  const daysUntil = Math.round((next - todayUTC) / 86400000);
  const nextWeekday = WEEKDAYS[new Date(next).getUTCDay()];

  return { age, daysUntil, nextWeekday };
}

/** Approximate number of full moons a person has lived under. */
export function lunarMonthsLived(birthDate, today) {
  const days = (today.getTime() - birthDate.getTime()) / 86400000;
  return Math.max(0, Math.floor(days / SYNODIC));
}

/* ---------- generation ---------- */
const GENERATIONS = [
  [1928, 1945, "The Silent Generation", "Built the post-war world, quietly."],
  [1946, 1964, "Baby Boomer", "Born into a booming, rebuilding world."],
  [1965, 1980, "Generation X", "The latchkey kids between analog and digital."],
  [1981, 1996, "Millennial", "Came of age as the internet did."],
  [1997, 2012, "Generation Z", "First to never know a world offline."],
  [2013, 2025, "Generation Alpha", "Born into glass screens and AI."]
];
export function generation(year) {
  const g = GENERATIONS.find(([a, b]) => year >= a && year <= b);
  return g ? { label: g[2], blurb: g[3], from: g[0], to: g[1] } : null;
}

/* ---------- numerology life-path number ---------- */
function reduceToDigit(n) {
  while (n > 9 && n !== 11 && n !== 22 && n !== 33) {
    n = String(n).split("").reduce((s, d) => s + +d, 0);
  }
  return n;
}
const LIFE_PATH_MEANING = {
  1: ["The Pioneer", "independent, driven, a natural starter"],
  2: ["The Peacemaker", "intuitive, diplomatic, a steadying presence"],
  3: ["The Communicator", "expressive, creative, full of colour"],
  4: ["The Builder", "grounded, reliable, a maker of foundations"],
  5: ["The Adventurer", "restless, curious, hungry for the new"],
  6: ["The Nurturer", "warm, responsible, devoted to others"],
  7: ["The Seeker", "analytical, inward, drawn to the deep questions"],
  8: ["The Powerhouse", "ambitious, capable, built for the long game"],
  9: ["The Humanitarian", "compassionate, idealistic, here for everyone"],
  11: ["The Visionary", "a master number — intuition turned all the way up"],
  22: ["The Master Builder", "a master number — big dreams made real"],
  33: ["The Master Teacher", "a master number — wisdom in service of others"]
};
export function lifePath(day, month, year) {
  const sum = reduceToDigit(day) + reduceToDigit(month) + reduceToDigit(year);
  const num = reduceToDigit(sum);
  const [title, blurb] = LIFE_PATH_MEANING[num] || ["The Traveller", "one of a kind"];
  return { number: num, title, blurb };
}

/* ---------- sunrise / sunset (NOAA sunrise equation) ---------- */
// Returns local clock strings for the birthplace + daylight hours, or a flag
// for polar day/night. Accurate to a minute or so — good enough for a keepsake.
export function sunTimes(lat, lon, date, timeZone) {
  const rad = Math.PI / 180;
  const jdMidnight = Math.floor(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) / 86400000) + 2440587.5;

  const n = Math.round(jdMidnight - 2451545.0 + 0.0008);
  const Jstar = n - lon / 360;
  const M = (357.5291 + 0.98560028 * Jstar) % 360;
  const Mr = M * rad;
  const C = 1.9148 * Math.sin(Mr) + 0.02 * Math.sin(2 * Mr) + 0.0003 * Math.sin(3 * Mr);
  const lambda = ((M + C + 180 + 102.9372) % 360) * rad;
  const Jtransit = 2451545.0 + Jstar + 0.0053 * Math.sin(Mr) - 0.0069 * Math.sin(2 * lambda);
  const sinDec = Math.sin(lambda) * Math.sin(23.44 * rad);
  const cosDec = Math.cos(Math.asin(sinDec));
  const cosOmega = (Math.sin(-0.833 * rad) - Math.sin(lat * rad) * sinDec) / (Math.cos(lat * rad) * cosDec);

  if (cosOmega > 1) return { polar: "night" };   // sun never rises
  if (cosOmega < -1) return { polar: "day" };     // sun never sets

  const omega = Math.acos(cosOmega) / rad;
  const jRise = Jtransit - omega / 360;
  const jSet = Jtransit + omega / 360;
  const rise = new Date((jRise - 2440587.5) * 86400000);
  const set = new Date((jSet - 2440587.5) * 86400000);
  const daylightHours = (jSet - jRise) * 24;

  const fmt = (d) => {
    try {
      return new Intl.DateTimeFormat("en-GB", {
        hour: "2-digit", minute: "2-digit", hour12: false, timeZone: timeZone || "UTC"
      }).format(d);
    } catch {
      return new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false }).format(d);
    }
  };
  return { sunrise: fmt(rise), sunset: fmt(set), daylightHours };
}

/* ---------- your age across the solar system ---------- */
const PLANETS = [
  { name: "Mercury", glyph: "☿", period: 0.2408467 },
  { name: "Venus", glyph: "♀", period: 0.61519726 },
  { name: "Mars", glyph: "♂", period: 1.8808158 },
  { name: "Jupiter", glyph: "♃", period: 11.862615 },
  { name: "Saturn", glyph: "♄", period: 29.447498 }
];
export function planetAges(earthYears) {
  return PLANETS.map((p) => ({
    name: p.name,
    glyph: p.glyph,
    age: earthYears / p.period
  }));
}

/* ---------- cosmic odometer ---------- */
// Fun, order-of-magnitude tallies of a life so far.
export function cosmicOdometer(birthDate, today) {
  const seconds = Math.max(0, (today.getTime() - birthDate.getTime()) / 1000);
  const days = seconds / 86400;
  const years = days / 365.2422;
  return {
    days: Math.floor(days),
    orbits: years,                          // trips around the sun
    heartbeats: Math.floor(seconds * (72 / 60)),  // ~72 bpm
    breaths: Math.floor(seconds * (15 / 60)),      // ~15 breaths/min
    // Earth orbits the sun at ~29.78 km/s → distance carried through space
    kmThroughSpace: Math.floor(seconds * 29.78),
    sleepYears: years / 3                    // ~a third of life asleep
  };
}
