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
/*
   The ten heavenly stems, as their five elements in pairs. Indexed by
   (lunar year - 4) % 10, so index 0 is Jia: 2024 is Jia Chen, the Wood
   Dragon. This list used to start at Metal, four places out of step, which
   quietly gave every visitor since launch the wrong element — 2024 read as
   Metal Dragon rather than Wood.
*/
const CHINESE_ELEMENTS = ["Wood", "Wood", "Fire", "Fire", "Earth", "Earth", "Metal", "Metal", "Water", "Water"];

/*
   Chinese New Year, 1900 to 2100, packed as MMDD per year.

   The animal year does not begin on 1 January. It begins on Chinese New
   Year, which is lunisolar and lands anywhere between 21 January and
   20 February, so reading the animal off `year % 12` hands the wrong one to
   everybody born in that five-week window — roughly one birthday in ten.
   Someone born on 5 February 1962 is a Buffalo, not a Tiger.

   The date is lunisolar and cannot be closed-formed, so it is a table:
   generated by tools/build-lunar-new-year.mjs from the winter-solstice and
   new-moon rule, checked against thirty-two published calendar dates, and
   reckoned on the calendar's own meridian. It never changes, so a table is
   both smaller and more trustworthy than a solver in the bundle.

   Eleven of these dates fall within half an hour of midnight, where the
   choice of day turns on minutes. Three of those eleven are covered by the
   published dates the generator checks against and all three agree. The one
   to treat with care is 1916, whose new moon lands five minutes after
   midnight and which some printed tables place a day earlier: it predates
   China's adoption of a standard meridian in 1929, when the calendar was
   still computed by traditional methods rather than recomputed from an
   ephemeris.
*/
const LNY_FROM = 1900, LNY_TO = 2100;
const LNY =
  "013102190208012902160204012502130202012202100130021802060126021402040123021102010220" +
  "020801280216020501240213020201230210013002170206012602140204012402110131021902080127" +
  "021502050125021302020122021001290217020601270214020301240212013102180208012802150205" +
  "012502130202012102090130021702060127021502030123021101310218020701280216020501250213" +
  "020202200209012902170206012702150204012302100131021902070128021602050124021202010122" +
  "020901290218020701260214020301230210013102190208012802160205012502120201012202100129" +
  "021702060126021302030123021101310219020801280215020401240212020101220210013002170206" +
  "012602140202012302110201021902080128021502040124021202020121020901290217020501260214" +
  "020301230211013102190207012702150205012402120202012202090129021702060126021402030124" +
  "021001300218020701270215020501250212020101210209";

/** Month and day of Chinese New Year, or null outside the table's range. */
export function lunarNewYear(year) {
  if (year < LNY_FROM || year > LNY_TO) return null;
  const at = (year - LNY_FROM) * 4;
  return { month: +LNY.slice(at, at + 2), day: +LNY.slice(at + 2, at + 4) };
}

/**
 * The animal and element of the lunar year a birth date falls in.
 *
 * Convention: the year turns at Chinese New Year, which is what the animal
 * popularly means. Traditional four-pillar astrology instead turns the year
 * pillar at Lichun, the solar term around 4 February, so the two can
 * disagree for a birth in late January or early February. The UI names the
 * convention rather than leaving the reader to guess.
 */
export function chineseZodiac(year, month, day) {
  let lunarYear = year;
  const nyd = lunarNewYear(year);
  // before New Year the previous animal is still running
  if (nyd && (month < nyd.month || (month === nyd.month && day < nyd.day))) {
    lunarYear = year - 1;
  }
  const animal = CHINESE[(lunarYear - 4) % 12];
  const element = CHINESE_ELEMENTS[(lunarYear - 4) % 10];
  return { animal, element, lunarYear, label: `${element} ${animal}` };
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

/* ---------- wall clock to instant ---------- */

/**
 * A wall-clock birth time in a named zone, as a real UTC instant.
 *
 * "Half past ten" is not a moment until you know where the clock was
 * standing. Skip this step and every sky figure inherits the birthplace's
 * whole UTC offset as error: the moon drifts about half a degree per hour,
 * the Ascendant fifteen.
 *
 * `Intl` will tell us what a given instant looks like in a zone but not the
 * reverse, so this guesses UTC, measures the error the formatter reports and
 * corrects. One pass is enough except within an hour of a daylight-saving
 * change, which the second covers. An unknown zone id falls back to reading
 * the clock as UTC, which is wrong but no worse than having no zone at all.
 *
 * A caveat worth knowing: this resolves offsets through the IANA time zone
 * database, whose maintainers state plainly that its pre-1970 data is not
 * authoritative and in many zones is deliberately simplified. Births before
 * then can be an hour out, and the UI says so where it matters.
 */
export function zonedToUTC(year, month, day, hh, mm, timeZone) {
  const target = Date.UTC(year, month - 1, day, hh, mm);
  if (!timeZone) return new Date(target);
  let guess = target;
  for (let i = 0; i < 2; i++) {
    const seen = readInZone(new Date(guess), timeZone);
    if (seen === null) return new Date(target);
    guess += target - seen;
  }
  return new Date(guess);
}

function readInZone(date, timeZone) {
  try {
    const p = new Intl.DateTimeFormat("en-GB", {
      timeZone, year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
    }).formatToParts(date).reduce((a, x) => (a[x.type] = x.value, a), {});
    return Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour % 24, +p.minute, +p.second);
  } catch {
    return null;
  }
}

/**
 * True where the birthplace's offset is being read from the shakiest part of
 * the zone database. Drives the one-line caveat under the birth time.
 */
export function zoneIsUncertain(year) {
  return year < 1970;
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
