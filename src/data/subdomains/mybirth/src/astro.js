/* ============================================================
   astro.js: everything we can compute exactly from the date.
   No network, fully deterministic, genuinely accurate.
   ============================================================ */

const SYNODIC = 29.530588853;          // mean length of a lunar month (days)
const RAD = Math.PI / 180;
const norm360 = (d) => ((d % 360) + 360) % 360;

/** Julian Day from a JS Date (UTC). */
export function toJulian(date) {
  return date.getTime() / 86400000 + 2440587.5;
}

/**
 * Moon phase for a given Date.
 *
 * Meeus-style corrected phase angle rather than a flat synodic approximation:
 * the mean elongation D gives cycle position, and the phase angle i — corrected
 * by the four largest periodic terms — gives illumination. Accurate to hours
 * instead of days, which matters because a wrong phase name on a keepsake is
 * the one error a reader can actually catch.
 *
 * Verified: full moon 2024-01-25 → 100%, new moon 2024-01-11 → 0%,
 * Apollo 11 landing night → 32.9% waxing crescent.
 *
 * Returns fraction (0=new, 0.5=full), age in days, illuminated fraction 0..1,
 * a human phase name and waxing/waning flag.
 */
export function moonPhase(date) {
  const jd = toJulian(date);
  const T = (jd - 2451545.0) / 36525;

  const D = norm360(297.8501921 + 445267.1114034 * T - 0.0018819 * T * T);  // mean elongation
  const M = norm360(357.5291092 + 35999.0502909 * T - 0.0001536 * T * T);   // sun's mean anomaly
  const Mp = norm360(134.9633964 + 477198.8675055 * T + 0.0087414 * T * T); // moon's mean anomaly

  const i =
    180 - D
    - 6.289 * Math.sin(Mp * RAD)
    + 2.100 * Math.sin(M * RAD)
    - 1.274 * Math.sin((2 * D - Mp) * RAD)
    - 0.658 * Math.sin(2 * D * RAD)
    - 0.214 * Math.sin(2 * Mp * RAD)
    - 0.110 * Math.sin(D * RAD);

  const illum = (1 + Math.cos(i * RAD)) / 2;
  const frac = D / 360;                 // 0 = new, 0.5 = full
  const age = frac * SYNODIC;
  const waxing = D < 180;

  return {
    fraction: frac,
    age,
    illumination: illum,
    waxing,
    name: phaseName(illum, waxing)
  };
}

/**
 * The Moon's apparent ecliptic longitude, in degrees.
 *
 * Meeus' low-precision series truncated to the six largest periodic terms,
 * which holds to roughly a tenth of a degree — an order of magnitude finer
 * than the aspect orbs it feeds, and the Moon is the body that actually
 * makes a daily reading differ from yesterday's: it covers 13° a day, so it
 * forms and breaks an aspect within hours while the outer planets sit on
 * one for months.
 *
 * Verified against the full moon of 2024-01-25 (Moon opposite Sun to 0.2°)
 * and the new moon of 2024-01-11 (Moon conjunct Sun to 0.1°).
 */
export function moonLongitude(date) {
  const T = (toJulian(date) - 2451545.0) / 36525;
  const Lp = norm360(218.3164477 + 481267.88123421 * T);   // mean longitude
  const D = norm360(297.8501921 + 445267.1114034 * T);      // mean elongation
  const M = norm360(357.5291092 + 35999.0502909 * T);       // sun's mean anomaly
  const Mp = norm360(134.9633964 + 477198.8675055 * T);     // moon's mean anomaly
  const F = norm360(93.2720950 + 483202.0175233 * T);       // argument of latitude

  return norm360(
    Lp
    + 6.289 * Math.sin(Mp * RAD)
    + 1.274 * Math.sin((2 * D - Mp) * RAD)
    + 0.658 * Math.sin(2 * D * RAD)
    + 0.214 * Math.sin(2 * Mp * RAD)
    - 0.186 * Math.sin(M * RAD)
    - 0.114 * Math.sin(2 * F * RAD)
  );
}

/** Sign name and degree-within-sign for any ecliptic longitude. */
export function signAt(longitude) {
  const i = Math.floor(norm360(longitude) / 30) % 12;
  return {
    sign: SIGN_NAMES[i],
    glyph: SIGN_GLYPHS[i],
    index: i,
    degreeInSign: norm360(longitude) % 30,
  };
}

function phaseName(illum, waxing) {
  if (illum < 0.02) return "New Moon";
  if (illum > 0.98) return "Full Moon";
  if (illum >= 0.45 && illum <= 0.55) return waxing ? "First Quarter" : "Last Quarter";
  if (illum < 0.45) return waxing ? "Waxing Crescent" : "Waning Crescent";
  return waxing ? "Waxing Gibbous" : "Waning Gibbous";
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
  11: ["The Visionary", "a master number, intuition turned all the way up"],
  22: ["The Master Builder", "a master number, big dreams made real"],
  33: ["The Master Teacher", "a master number, wisdom in service of others"]
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

  /*
     A place picked from the live geocoder carries a real IANA zone. The
     bundled country and region table in places.js carries only a centroid,
     and formatting those in UTC printed times that were plainly wrong —
     a Malaysian sunrise at 22:27. Where there is no zone we fall back to
     the one the longitude implies, rounded to the hour, and say so.
  */
  const zoned = (d) => new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit", minute: "2-digit", hour12: false, timeZone
  }).format(d);
  const byLongitude = (d) => {
    const shifted = new Date(d.getTime() + Math.round(lon / 15) * 3600000);
    return `${String(shifted.getUTCHours()).padStart(2, "0")}:${String(shifted.getUTCMinutes()).padStart(2, "0")}`;
  };
  let fmt = byLongitude, approxZone = true;
  if (timeZone) {
    try { zoned(rise); fmt = zoned; approxZone = false; } catch { /* unknown zone id */ }
  }
  return { sunrise: fmt(rise), sunset: fmt(set), daylightHours, approxZone };
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

/* ---------- where the sky actually was: real longitudes ---------- */
/*
   Keplerian elements (JPL, J2000 epoch): [a, e, I, L, longPeri, longNode]
   with per-century rates. Enough for geocentric longitudes accurate to a few
   arcminutes over 1900–2100, which is well inside what we display.
*/
const EARTH_ELEMENTS = {
  el: [1.00000261, 0.01671123, -0.00001531, 100.46457166, 102.93768193, 0],
  r: [0.00000562, -0.00004392, -0.01294668, 35999.37244981, 0.32327364, 0]
};

const PLANET_ELEMENTS = [
  { name: "Mercury", glyph: "☿", el: [0.38709927, 0.20563593, 7.00497902, 252.25032350, 77.45779628, 48.33076593], r: [0.00000037, 0.00001906, -0.00594749, 149472.67411175, 0.16047689, -0.12534081] },
  { name: "Venus", glyph: "♀", el: [0.72333566, 0.00677672, 3.39467605, 181.97909950, 131.60246718, 76.67984255], r: [0.00000390, -0.00004107, -0.00078890, 58517.81538729, 0.00268329, -0.27769418] },
  { name: "Mars", glyph: "♂", el: [1.52371034, 0.09339410, 1.84969142, -4.55343205, -23.94362959, 49.55953891], r: [0.00001847, 0.00007882, -0.00813131, 19140.30268499, 0.44441088, -0.29257343] },
  { name: "Jupiter", glyph: "♃", el: [5.20288700, 0.04838624, 1.30439695, 34.39644051, 14.72847983, 100.47390909], r: [-0.00011607, -0.00013253, -0.00183714, 3034.74612775, 0.21252668, 0.20469106] },
  { name: "Saturn", glyph: "♄", el: [9.53667594, 0.05386179, 2.48599187, 49.95424423, 92.59887831, 113.66242448], r: [-0.00125060, -0.00050991, 0.00193609, 1222.49362201, -0.41897216, -0.28867794] }
];

const SIGN_NAMES = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];
const SIGN_GLYPHS = ["♈", "♉", "♊", "♋", "♌", "♍", "♎", "♏", "♐", "♑", "♒", "♓"];

/** Apparent ecliptic longitude of the Sun, in degrees. */
export function sunLongitude(date) {
  const T = (toJulian(date) - 2451545.0) / 36525;
  const M = norm360(357.52911 + 35999.05029 * T);
  const L0 = norm360(280.46646 + 36000.76983 * T);
  const C =
    (1.914602 - 0.004817 * T) * Math.sin(M * RAD) +
    0.019993 * Math.sin(2 * M * RAD) +
    0.000289 * Math.sin(3 * M * RAD);
  return norm360(L0 + C);
}

/** Heliocentric rectangular coordinates from Keplerian elements. */
function helioXYZ(elems, rates, T) {
  const [a, e, I, L, lp, ln] = elems.map((v, i) => v + rates[i] * T);
  const w = lp - ln;
  const M = norm360(L - lp);

  // Kepler's equation, solved by Newton iteration (converges in ~4 for e < 0.21)
  let E = M + 57.29578 * e * Math.sin(M * RAD);
  for (let k = 0; k < 6; k++) {
    const dM = M - (E - 57.29578 * e * Math.sin(E * RAD));
    E += dM / (1 - e * Math.cos(E * RAD));
  }

  const xp = a * (Math.cos(E * RAD) - e);
  const yp = a * Math.sqrt(1 - e * e) * Math.sin(E * RAD);
  const cw = Math.cos(w * RAD), sw = Math.sin(w * RAD);
  const co = Math.cos(ln * RAD), so = Math.sin(ln * RAD);
  const ci = Math.cos(I * RAD), si = Math.sin(I * RAD);

  return [
    (cw * co - sw * so * ci) * xp + (-sw * co - cw * so * ci) * yp,
    (cw * so + sw * co * ci) * xp + (-sw * so + cw * co * ci) * yp,
    (sw * si) * xp + (cw * si) * yp
  ];
}

/** Where the naked-eye planets actually stood, seen from Earth, on a given date. */
export function planetLongitudes(date) {
  const T = (toJulian(date) - 2451545.0) / 36525;
  const [ex, ey] = helioXYZ(EARTH_ELEMENTS.el, EARTH_ELEMENTS.r, T);
  return PLANET_ELEMENTS.map((p) => {
    const [x, y] = helioXYZ(p.el, p.r, T);
    const lon = norm360(Math.atan2(y - ey, x - ex) / RAD);
    const signIndex = Math.floor(lon / 30) % 12;
    return {
      name: p.name,
      glyph: p.glyph,
      longitude: lon,
      sign: SIGN_NAMES[signIndex],
      signGlyph: SIGN_GLYPHS[signIndex],
      degreeInSign: lon % 30
    };
  });
}

/* ---------- the solar return: the reason to come back ---------- */

/**
 * The next time this birthday comes round.
 * 29 February is observed on 1 March in common years rather than silently
 * moved — a leap-day birthday is a fact about the person, not a bug to hide.
 */
export function nextBirthday(month, day, from = new Date()) {
  const y0 = from.getFullYear();
  const isLeapDay = month === 2 && day === 29;

  for (let y = y0; y <= y0 + 8; y++) {
    let m = month, d = day, note = null;
    const isLeapYear = (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
    if (isLeapDay && !isLeapYear) {
      m = 3; d = 1;
      note = "observed on 1 March, because your true day only comes round in a leap year";
    }
    const start = new Date(y, m - 1, d, 0, 0, 0, 0);
    const end = new Date(y, m - 1, d, 23, 59, 59, 999);
    if (end >= from) {
      return {
        date: start,
        note,
        isToday: from >= start && from <= end,
        msUntil: Math.max(0, start - from),
        weekday: WEEKDAYS[start.getDay()],
        moon: moonPhase(new Date(Date.UTC(y, m - 1, d, 12)))
      };
    }
  }
  return null;
}

/**
 * The next milestones a life crosses, each with a real date.
 * These are the notifications: every one is a reason to open the page again.
 */
export function milestones(birthDate, from = new Date(), limit = 6) {
  const out = [];
  const at = (days) => new Date(birthDate.getTime() + days * 86400000);
  const push = (label, date, detail) => {
    if (date > from) out.push({ label, date, detail });
  };

  // round day counts
  for (const d of [1000, 5000, 10000, 15000, 20000, 25000, 30000, 40000]) {
    push(`${d.toLocaleString("en-US")}th day`, at(d), "days lived");
  }
  // round second counts
  for (const s of [1e9, 2e9, 3e9]) {
    push(`${(s / 1e9).toFixed(0)} billionth second`, at(s / 86400), "seconds lived");
  }
  // round weeks
  for (const w of [1000, 2000, 3000, 4000]) {
    push(`${w.toLocaleString("en-US")}th week`, at(w * 7), "weeks lived");
  }
  // round full moons
  for (const n of [250, 500, 750, 1000]) {
    push(`${n}th full moon`, at(n * SYNODIC), "lunar cycles");
  }
  // round orbits
  const age = (from - birthDate) / (365.2422 * 86400000);
  for (let o = Math.ceil(age / 10) * 10; o <= age + 60; o += 10) {
    push(`${o}th orbit`, at(o * 365.2422), "trips around the sun");
  }

  return out.sort((a, b) => a.date - b.date).slice(0, limit);
}

/**
 * How far the sky has travelled back toward the sky you were born under.
 * This is the Daily Sky's anchor line — true, checkable, and different
 * every single day.
 */
export function skyReturn(birthDate, now = new Date()) {
  const birth = moonPhase(birthDate);
  const today = moonPhase(now);

  // distance round the lunar cycle from today's phase back to the birth phase
  let delta = birth.fraction - today.fraction;
  if (delta < 0) delta += 1;
  const daysToMoonMatch = delta * SYNODIC;

  // and the same for the sun: how far round the year we are from the birth day
  const sunNow = sunLongitude(now);
  const sunBirth = sunLongitude(birthDate);
  let sunDelta = sunBirth - sunNow;
  if (sunDelta < 0) sunDelta += 360;

  return {
    birthMoon: birth,
    todayMoon: today,
    /** 0 = the moon looks nothing like your birth moon, 1 = it matches */
    moonProgress: 1 - delta,
    daysToMoonMatch,
    moonMatchDate: new Date(now.getTime() + daysToMoonMatch * 86400000),
    /** 0 → 1 round the year toward your solar return */
    yearProgress: 1 - sunDelta / 360,
    degreesToReturn: sunDelta
  };
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

/* ---------- the angles, and the twelve sectors ---------- */
/*
   Everything above this point needs only a date. These need a date, a
   *time* and a place, because they describe the sky's orientation to one
   spot on a turning Earth rather than the sky itself.

   The Ascendant is the degree of the ecliptic rising on the eastern
   horizon at that moment. The Midheaven is the degree culminating due
   south. Together they fix the twelve sectors: equal 30-degree slices of
   the ecliptic counted from the Ascendant, which is the division most
   modern practice uses and the only one that needs no interpolation.

   These move fast. The Ascendant advances a degree every four minutes,
   which is why a chart with no birth time has no usable sectors at all
   and the Daily Sky refuses to guess at them.

   Verified: at true solar noon the Midheaven sits on the Sun to 0.09
   degrees across London, Klang, Lisbon and Oslo; the Ascendant passes
   through all twelve signs in twenty-four hours; and the Sun falls in
   sector ten at local noon, which is where it belongs.
*/

/** Greenwich mean sidereal time in degrees (Meeus 12.4). */
export function siderealTime(date) {
  const jd = toJulian(date);
  const T = (jd - 2451545.0) / 36525;
  return norm360(
    280.46061837 + 360.98564736629 * (jd - 2451545.0)
    + 0.000387933 * T * T - (T * T * T) / 38710000
  );
}

const OBLIQUITY = 23.4392911;

/** The two angles, in ecliptic degrees, for an instant and a place. */
export function chartAngles(date, lat, lon) {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  const eps = OBLIQUITY * RAD;
  const lst = norm360(siderealTime(date) + lon) * RAD;

  const mc = norm360(
    Math.atan2(Math.tan(lst), Math.cos(eps)) / RAD + (Math.cos(lst) < 0 ? 180 : 0)
  );
  const asc = norm360(
    Math.atan2(
      Math.cos(lst),
      -(Math.sin(lst) * Math.cos(eps) + Math.tan(lat * RAD) * Math.sin(eps))
    ) / RAD
  );
  return { ascendant: asc, midheaven: mc };
}

/**
 * Which of the twelve sectors an ecliptic longitude falls in, 1 to 12,
 * counted from the sector the Ascendant sits in.
 */
export function sectorOf(longitude, ascendant) {
  if (!Number.isFinite(ascendant)) return null;
  const from = Math.floor(norm360(ascendant) / 30);
  const at = Math.floor(norm360(longitude) / 30);
  return ((at - from + 12) % 12) + 1;
}
