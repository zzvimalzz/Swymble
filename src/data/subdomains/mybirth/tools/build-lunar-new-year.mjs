/*
   Generates the Chinese New Year table that astro.js ships.

   The zodiac animal does not turn on 1 January. It turns on Chinese New
   Year, which is lunisolar and wanders across five weeks of the Gregorian
   calendar, so anyone born in January or the first half of February was
   being handed the wrong animal by a `year % 12`.

   The rule, in full:

     · The lunar month containing the winter solstice is month 11.
     · Count the new moons from one month 11 to the next. Twelve means an
       ordinary year and New Year is the second new moon after month 11.
     · Thirteen means a leap month falls somewhere in between. The leap is
       the first month carrying no principal solar term (a zhongqi, where
       the sun's longitude passes a multiple of 30 degrees). If that leap
       lands before month 1, New Year slips to the third new moon instead.

   Dates are reckoned in China standard time, UTC+8, which is the convention
   every published table uses from 1929 onward.

   ── Why this file carries its own astronomy ──

   It first borrowed moonLongitude and sunLongitude from ../src/sky/astro.js.
   Those are deliberately truncated series — the app needs a phase name and
   an illuminated percentage, and six periodic terms give it those. They are
   not good enough to decide which *day* a new moon falls on: for January
   1966 they put it twelve hours late, which pushed it over China's midnight
   and moved New Year from the 21st to the 22nd.

   So the phase times here come from Meeus chapter 49, which is accurate to
   the minute, and the solar longitude from chapter 25, accurate to about a
   hundredth of a degree. None of it runs in the browser, so the precision
   is free. Keeping the generator independent of the app is also the point:
   a vendored table should not inherit the approximations of the code it is
   meant to be more trustworthy than.

   Run: node tools/build-lunar-new-year.mjs
*/

import { writeFileSync } from "node:fs";

const RAD = Math.PI / 180;
const DAY = 86400000;
const CST = 8 * 3600000;
const FROM = 1900, TO = 2100;

const sin = (deg) => Math.sin(deg * RAD);
const norm360 = (d) => ((d % 360) + 360) % 360;
const norm180 = (d) => norm360(d + 180) - 180;

/** Julian Ephemeris Day to a JS millisecond value. */
const fromJDE = (jde) => (jde - 2440587.5) * DAY;

/**
 * Difference between terrestrial and universal time, in seconds.
 * Espenak & Meeus polynomials. Never more than about a minute across the
 * table's range, but a new moon can fall within a minute of midnight.
 */
function deltaT(year) {
  let t;
  if (year < 1920) { t = year - 1900; return -2.79 + 1.494119 * t - 0.0598939 * t ** 2 + 0.0061966 * t ** 3 - 0.000197 * t ** 4; }
  if (year < 1941) { t = year - 1920; return 21.20 + 0.84493 * t - 0.076100 * t ** 2 + 0.0020936 * t ** 3; }
  if (year < 1961) { t = year - 1950; return 29.07 + 0.407 * t - t ** 2 / 233 + t ** 3 / 2547; }
  if (year < 1986) { t = year - 1975; return 45.45 + 1.067 * t - t ** 2 / 260 - t ** 3 / 718; }
  if (year < 2005) { t = year - 2000; return 63.86 + 0.3345 * t - 0.060374 * t ** 2 + 0.0017275 * t ** 3 + 0.000651814 * t ** 4 + 0.00002373599 * t ** 5; }
  if (year < 2050) { t = year - 2000; return 62.92 + 0.32217 * t + 0.005589 * t ** 2; }
  return -20 + 32 * ((year - 1820) / 100) ** 2 - 0.5628 * (2150 - year);
}

/**
 * The k-th new moon since 2000, as a UTC millisecond value.
 * Meeus, Astronomical Algorithms, chapter 49.
 */
function newMoonK(k) {
  const T = k / 1236.85;
  let jde = 2451550.09766 + 29.530588861 * k
    + 0.00015437 * T ** 2 - 0.000000150 * T ** 3 + 0.00000000073 * T ** 4;

  const E = 1 - 0.002516 * T - 0.0000074 * T ** 2;
  const M = 2.5534 + 29.10535670 * k - 0.0000014 * T ** 2 - 0.00000011 * T ** 3;
  const Mp = 201.5643 + 385.81693528 * k + 0.0107582 * T ** 2 + 0.00001238 * T ** 3 - 0.000000058 * T ** 4;
  const F = 160.7108 + 390.67050284 * k - 0.0016118 * T ** 2 - 0.00000227 * T ** 3 + 0.000000011 * T ** 4;
  const O = 124.7746 - 1.56375588 * k + 0.0020672 * T ** 2 + 0.00000215 * T ** 3;

  jde += -0.40720 * sin(Mp)
    + 0.17241 * E * sin(M)
    + 0.01608 * sin(2 * Mp)
    + 0.01039 * sin(2 * F)
    + 0.00739 * E * sin(Mp - M)
    - 0.00514 * E * sin(Mp + M)
    + 0.00208 * E * E * sin(2 * M)
    - 0.00111 * sin(Mp - 2 * F)
    - 0.00057 * sin(Mp + 2 * F)
    + 0.00056 * E * sin(2 * Mp + M)
    - 0.00042 * sin(3 * Mp)
    + 0.00042 * E * sin(M + 2 * F)
    + 0.00038 * E * sin(M - 2 * F)
    - 0.00024 * E * sin(2 * Mp - M)
    - 0.00017 * sin(O)
    - 0.00007 * sin(Mp + 2 * M)
    + 0.00004 * sin(2 * Mp - 2 * F)
    + 0.00004 * sin(3 * M)
    + 0.00003 * sin(Mp + M - 2 * F)
    + 0.00003 * sin(2 * Mp + 2 * F)
    - 0.00003 * sin(Mp + M + 2 * F)
    + 0.00003 * sin(Mp - M + 2 * F)
    - 0.00002 * sin(Mp - M - 2 * F)
    - 0.00002 * sin(3 * Mp + M)
    + 0.00002 * sin(4 * Mp);

  // planetary arguments
  const A = [
    [299.77 + 0.107408 * k - 0.009173 * T ** 2, 0.000325],
    [251.88 + 0.016321 * k, 0.000165],
    [251.83 + 26.651886 * k, 0.000164],
    [349.42 + 36.412478 * k, 0.000126],
    [84.66 + 18.206239 * k, 0.000110],
    [141.74 + 53.303771 * k, 0.000062],
    [207.14 + 2.453732 * k, 0.000060],
    [154.84 + 7.306860 * k, 0.000056],
    [34.52 + 27.261239 * k, 0.000047],
    [207.19 + 0.121824 * k, 0.000042],
    [291.34 + 1.844379 * k, 0.000040],
    [161.72 + 24.198154 * k, 0.000037],
    [239.56 + 25.513099 * k, 0.000035],
    [331.55 + 3.592518 * k, 0.000023],
  ];
  for (const [angle, coeff] of A) jde += coeff * sin(angle);

  // Meeus returns dynamical time; civil dates need universal time
  const year = 2000 + k / 12.3685;
  return fromJDE(jde) - deltaT(year) * 1000;
}

/** Apparent longitude of the sun at an instant. Meeus chapter 25. */
function sunLongitude(ms) {
  const T = (ms / DAY + 2440587.5 - 2451545) / 36525;
  const L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T ** 2;
  const M = 357.52911 + 35999.05029 * T - 0.0001537 * T ** 2;
  const C = (1.914602 - 0.004817 * T - 0.000014 * T ** 2) * sin(M)
    + (0.019993 - 0.000101 * T) * sin(2 * M)
    + 0.000289 * sin(3 * M);
  const O = 125.04 - 1934.136 * T;
  return norm360(L0 + C - 0.00569 - 0.00478 * sin(O));
}

/** How far past a target longitude the sun is, signed and wrapped. */
const solar = (ms, target) => norm180(sunLongitude(ms) - target);

/** Winter solstice of a year: the sun reaching 270 degrees. */
function winterSolstice(year) {
  let lo = Date.UTC(year, 11, 18), hi = Date.UTC(year, 11, 25);
  for (let i = 0; i < 60 && hi - lo > 1000; i++) {
    const mid = (lo + hi) / 2;
    if (solar(lo, 270) * solar(mid, 270) <= 0) hi = mid; else lo = mid;
  }
  return (lo + hi) / 2;
}

/*
   The meridian the calendar is reckoned on.

   China adopted UTC+8 in 1929. Before that the calendar was computed on
   Beijing local mean time, UTC+8:05:43, and the five-minute difference is
   only ever visible when a new moon falls in the last few minutes of a day.
   It changes no date in this table's range as generated, but it is the
   documented convention and costs nothing to honour, so a future change of
   ephemeris cannot quietly introduce an error here.
*/
const BEIJING_LMT = (8 * 3600 + 343) * 1000;
const offsetFor = (ms) => (ms < Date.UTC(1929, 0, 1) ? BEIJING_LMT : CST);

/** The civil date, on the calendar's own meridian, that an instant falls on. */
function cstDate(ms) {
  const d = new Date(ms + offsetFor(ms));
  return [d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate()];
}

/** Midnight on the calendar's meridian, as a UTC millisecond value. */
function cstMidnight(ms) {
  const [y, m, d] = cstDate(ms);
  return Date.UTC(y, m - 1, d) - offsetFor(ms);
}

/** The lunation number of the last new moon at or before an instant. */
function lunationBefore(ms) {
  const approx = Math.floor(((ms / DAY + 2440587.5) - 2451550.09766) / 29.530588861);
  let k = approx + 2;
  while (newMoonK(k) > ms) k--;
  return k;
}

/**
 * Month 11 of a given year: the lunar month containing the winter solstice.
 *
 * The comparison is between civil *dates* in China standard time, not raw
 * instants, and the difference is not academic. In 2014 the solstice fell at
 * 07:03 on 22 December and that month's new moon at 09:36 the same day.
 * Comparing instants put the new moon after the solstice and reached back a
 * whole lunation, moving Chinese New Year 2015 from 19 February to
 * 20 January. Reckoned by date, as the rule intends, the solstice falls on
 * the first day of the month the new moon opens.
 *
 * Returns the lunation number, so callers can step by whole months.
 */
function monthEleven(year) {
  const solsticeDay = cstMidnight(winterSolstice(year));
  let k = lunationBefore(winterSolstice(year)) + 1;
  while (cstMidnight(newMoonK(k)) > solsticeDay) k--;
  return k;
}

/**
 * Does the lunar month opening at lunation k contain a principal solar term?
 * The twelve zhongqi sit at 270, 300, 330 ... degrees.
 *
 * Tested at the month's endpoints rather than by sampling. The sun covers
 * about twenty-nine degrees in a lunar month, so it can cross at most one of
 * these thirty-degree marks and a sign change across the interval settles
 * it. Sampling did not: a six-hourly scan starting an interval in missed a
 * term sitting in the first hours of a month, which is exactly where the
 * winter solstice lands when a new moon falls beside it. That made month 11
 * look like it had no principal term, marked it the leap, and pushed Chinese
 * New Year 1947 from 22 January to 21 February.
 */
function hasZhongqi(k) {
  const start = cstMidnight(newMoonK(k));
  const end = cstMidnight(newMoonK(k + 1));
  for (let i = 0; i < 12; i++) {
    const target = (270 + i * 30) % 360;
    if (solar(start, target) <= 0 && solar(end, target) > 0) return true;
  }
  return false;
}

function lunarNewYear(year) {
  const m11 = monthEleven(year - 1);
  const months = monthEleven(year) - m11;

  let offset = 2;                          // ordinary year: the second new moon
  if (months === 13) {
    /*
       Find the first month with no principal solar term. The search starts
       one month after month 11, never at it: month 11 contains the winter
       solstice by construction, so it can never be the leap, and letting it
       be picked was the other half of the 1947 error.
    */
    for (let i = 1; i < months; i++) {
      if (!hasZhongqi(m11 + i)) {
        // a leap at or before month 12 pushes New Year on by one moon
        if (i <= 2) offset = 3;
        break;
      }
    }
  }
  return cstDate(newMoonK(m11 + offset));
}

/* ---------- build and check ---------- */

// spot dates from published calendars, used as a correctness gate.
// the extremes are deliberate: 1909, 1947, 1966, 2004 and 2023 sit at the
// early edge of the window and 1920, 1985 at the late edge, which is where
// a day-boundary or leap-month error shows up first.
const KNOWN = {
  1900: [1, 31], 1909: [1, 22], 1910: [2, 10], 1920: [2, 20], 1930: [1, 30],
  1940: [2, 8], 1947: [1, 22], 1950: [2, 17], 1960: [1, 28], 1966: [1, 21],
  1970: [2, 6], 1975: [2, 11], 1980: [2, 16], 1985: [2, 20], 1990: [1, 27],
  1995: [1, 31], 2000: [2, 5], 2004: [1, 22], 2005: [2, 9], 2010: [2, 14],
  2015: [2, 19], 2020: [1, 25], 2021: [2, 12], 2022: [2, 1], 2023: [1, 22],
  2024: [2, 10], 2025: [1, 29], 2026: [2, 17], 2027: [2, 6], 2030: [2, 3],
  2033: [1, 31], 2035: [2, 8],
};

const table = {};
let bad = 0;
for (let y = FROM; y <= TO; y++) {
  const [, m, d] = lunarNewYear(y);
  table[y] = [m, d];
  const want = KNOWN[y];
  if (want && (want[0] !== m || want[1] !== d)) {
    console.error(`  ${y}: got ${m}/${d}, published ${want[0]}/${want[1]}`);
    bad++;
  }
}
console.log(`${Object.keys(KNOWN).length} published dates checked, ${bad} mismatched`);

// every New Year must land between 21 January and 21 February
for (let y = FROM; y <= TO; y++) {
  const [m, d] = table[y];
  const ord = m === 1 ? d : 31 + d;
  if (m > 2 || ord < 21 || ord > 52) {
    console.error(`  ${y}: ${d}/${m} is outside the window the rule allows`);
    bad++;
  }
}
if (bad) process.exit(1);

// pack as "MMDD" digits, four characters per year, indexed off FROM
const packed = Array.from({ length: TO - FROM + 1 }, (_, i) => {
  const [m, d] = table[FROM + i];
  return String(m).padStart(2, "0") + String(d).padStart(2, "0");
}).join("");

writeFileSync(new URL("./lunar-new-year.txt", import.meta.url), packed);
console.log(`wrote ${packed.length} chars covering ${FROM}-${TO}`);
