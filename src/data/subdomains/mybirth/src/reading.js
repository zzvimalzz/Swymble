/* ============================================================
   reading.js: the daily reading.

   The pipeline is: ephemeris, then the angles between today's planets
   and the ones in your birth chart, then prose. The prose is assembled
   rather than written fresh each morning. A written bank is selected
   from by a real measurement, which is the only honest way to do this
   without a language model and a bill attached to every page view.

   The design rule that follows from that: every reading is printed
   above its own arithmetic. Which two bodies, what angle between them,
   how many degrees off exact. An interpretation nobody can check is
   one a reader stops trusting after a month, so the measurement stays
   visible underneath and the reader is invited to verify it.

   Nothing here is random. The same person on the same day gets the same
   reading, because the seed is the person and the date, and because the
   chart is cast for local midday rather than for the moment the page was
   opened. Refreshing does not reroll it. Tomorrow the Moon has moved 13
   degrees and it changes on its own.
   ============================================================ */

import {
  moonLongitude, sunLongitude, planetLongitudes, signAt, sectorOf
} from "./astro.js";

/*
   All the writing lives in src/contents as plain JSON: it is content, it
   changes far more often than the engine does, and a copy edit should not
   mean opening a file full of orbital mechanics.
*/
import areasFile from "./contents/areas.json";
import readingsFile from "./contents/readings.json";
import touchesFile from "./contents/touches.json";
import motionFile from "./contents/motion.json";
import columnsFile from "./contents/columns.json";

const AREAS = areasFile.areas;
const READINGS = readingsFile.readings;
const TOUCHES = touchesFile.touches;
const MOTION = motionFile.motion;
const COLUMNS = columnsFile.columns;

/* ---------- the bodies, and what each one is about ---------- */

/*
   `speed` is what makes a reading daily rather than monthly. The Moon
   covers 13° a day, so it forms and breaks an aspect within hours. Saturn
   covers 0.03°, so a Saturn aspect sits there for months and would give
   the same headline all summer. Fast bodies are therefore scored up as
   the *source* of a reading, and every body is a fair *target*.
*/
const BODIES = [
  { key: "moon",    label: "the Moon", speed: 1.00, domain: "how you settle",              short: "mood" },
  { key: "sun",     label: "the Sun",  speed: 0.80, domain: "what you want to be known for", short: "self" },
  { key: "mercury", label: "Mercury",  speed: 0.75, domain: "how the talking goes",        short: "talk" },
  { key: "venus",   label: "Venus",    speed: 0.70, domain: "what you are drawn to",       short: "wanting" },
  { key: "mars",    label: "Mars",     speed: 0.55, domain: "where the push comes from",   short: "drive" },
  { key: "jupiter", label: "Jupiter",  speed: 0.30, domain: "what widens",                 short: "room" },
  { key: "saturn",  label: "Saturn",   speed: 0.20, domain: "what asks for patience",      short: "weight" },
];
const BODY = Object.fromEntries(BODIES.map((b) => [b.key, b]));

/*
   Five angles, the classical ones, with the orbs an astrologer would
   actually use. The orb is the slack: an aspect counts as "on" while the
   two bodies are within this many degrees of the exact angle.
*/
const ASPECTS = [
  { key: "conjunction", angle: 0,   orb: 6, tone: "charged",  verb: "sits on",        symbol: "☌" },
  { key: "sextile",     angle: 60,  orb: 4, tone: "open",     verb: "opens onto",     symbol: "⚹" },
  { key: "square",      angle: 90,  orb: 5, tone: "friction", verb: "cuts across",    symbol: "□" },
  { key: "trine",       angle: 120, orb: 5, tone: "easy",     verb: "runs clean to",  symbol: "△" },
  { key: "opposition",  angle: 180, orb: 6, tone: "pull",     verb: "pulls against",  symbol: "☍" },
];

/* ---------- the chart ---------- */

/** Every body's ecliptic longitude at one instant. */
export function chartAt(date) {
  const planets = planetLongitudes(date);
  const out = { moon: moonLongitude(date), sun: sunLongitude(date) };
  for (const p of planets) out[p.name.toLowerCase()] = p.longitude;
  return out;
}

function separation(a, b) {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}

/**
 * Every aspect between today's sky and the sky of a birth date.
 *
 * Scored, so the reading can lead on the one that is both tightest and
 * fastest-moving rather than on whichever happened to be listed first.
 */
export function aspectsBetween(transitChart, natalChart, tomorrowChart = null) {
  const out = [];
  for (const t of BODIES) {
    for (const n of BODIES) {
      const sep = separation(transitChart[t.key], natalChart[n.key]);
      for (const a of ASPECTS) {
        const off = Math.abs(sep - a.angle);
        if (off > a.orb) continue;
        /*
           Applying or separating: is the angle still tightening towards
           exact, or has it already passed and started to widen? Any
           astrologer would draw the distinction and it costs one extra
           chart to compute, but the real reason it is here is that it
           doubles the interpretive space for free and it is *true*. A
           thing building and the same thing passing are not the same day.
        */
        let applying = null;
        if (tomorrowChart) {
          const next = Math.abs(separation(tomorrowChart[t.key], natalChart[n.key]) - a.angle);
          applying = next < off;
        }
        out.push({
          transit: t, natal: n, aspect: a,
          separation: sep,
          /** degrees from exact, where 0 is a perfect hit */
          orb: off,
          applying,
          /** tight and fast beats wide and slow */
          score: t.speed * (1 - off / a.orb),
        });
      }
    }
  }
  return out.sort((x, y) => y.score - x.score);
}

/* ---------- deterministic choice ---------- */

function seed(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return Math.abs(h);
}
/** Pick n distinct items, chosen by the seed rather than by chance. */
function pick(list, n, s) {
  const copy = [...list];
  const out = [];
  let k = s;
  while (out.length < n && copy.length) {
    k = Math.imul(k ^ (k >>> 13), 16777619) >>> 0;
    out.push(copy.splice(k % copy.length, 1)[0]);
  }
  return out;
}

/* ---------- the sectors, and the eight areas of a life ---------- */

/*
   The fourth dimension, and the one that makes depth possible.

   Aspect alone says how today feels. Aspect plus the natal body says
   which part of you it lands on. Neither says *where in a life* it
   lands, and that is the difference between "today is tense" and
   "today is tense about money". The sector supplies it.

   A sector is a 30-degree slice of the ecliptic counted from the
   Ascendant. Twelve of them map onto eight areas, because several of the
   twelve are close enough in meaning that separate copy for each would
   be writing the same reading twice.

   All of this needs a birth time. Without one there is no Ascendant, so
   `areaOf` returns null and the caller is expected to ask for the time
   rather than guess.
*/
const SECTOR_AREA = (() => {
  const map = {};
  for (const [key, a] of Object.entries(AREAS)) for (const s of a.sectors) map[s] = key;
  return map;
})();

/** Which area of a life a longitude falls in, or null with no Ascendant. */
export function areaOf(longitude, ascendant) {
  const sector = sectorOf(longitude, ascendant);
  return sector ? SECTOR_AREA[sector] : null;
}

export function areaLabel(key) { return AREAS[key]?.label || ""; }
export function areaDomain(key) { return AREAS[key]?.domain || ""; }
export { AREAS };

/* ---------- the reading ---------- */

const ORDINAL_TONE = {
  charged: "exact", open: "supported", friction: "under strain", easy: "clear", pull: "stretched",
};

/**
 * One day's reading for one person.
 *
 * Requires a birth chart *with angles*: pass `ascendant`, or get null
 * back. See the note on sectors above for why guessing is not an option.
 *
 * Returns the headline, the assembled paragraph, the Do/Don't columns and
 * the evidence: the three tightest aspects with the arithmetic left in.
 */
export function dailyReading(profile, now = new Date(), { journal = [] } = {}) {
  /*
     Cast for local midday, not for the instant the page was opened.

     The Moon covers 13 degrees a day, so a chart cast at 09:00 and the
     same chart cast at 23:30 can have a different tightest aspect and
     therefore a different reading. Opening the page twice in one day and
     getting two different answers would undo the whole claim: a daily
     reading has to be a fact about the day. Midday centres it.
  */
  const noon = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0, 0);
  const tomorrow = new Date(noon.getTime() + 86400000);
  const natal = chartAt(profile.birthDate);
  const sky = chartAt(noon);
  const all = aspectsBetween(sky, natal, chartAt(tomorrow));

  const today = dayStamp(now);
  const stamp = `${profile.key}|${today}`;
  const s = seed(stamp);

  /*
     No Ascendant means no sectors, which means no area, which means the
     reading cannot be written. The caller asks for a birth time instead.
  */
  const asc = profile.ascendant;
  if (!Number.isFinite(asc)) return null;

  // every aspect now carries where in the life it lands
  const placed = all.map((a) => ({ ...a, area: areaOf(natal[a.natal.key], asc) })).filter((a) => a.area);

  /*
     With no aspect inside orb, rare but a real day for some charts, there
     is nothing to interpret and we say so rather than inventing something.
     Silence is allowed to be the reading.
  */
  if (!placed.length) {
    return {
      quiet: true,
      headline: "The sky is not saying anything today.",
      body: "No planet is within orb of anything in your chart. That happens, and it is worth more than a manufactured sentence. The measurements are below either way.",
      dos: pick(COLUMNS.easy.do, 3, s),
      donts: pick(COLUMNS.easy.dont, 3, s + 1),
      lead: null, evidence: [], natal, sky, ascendant: asc,
    };
  }

  /*
     Which aspect leads.

     Normally the highest-scoring one. But where the top two are within a
     tenth of each other the choice between them is arbitrary, and if the
     leader's cell was used yesterday we take the runner-up instead. Both
     aspects are real, both are printed in the evidence below, and the
     only thing being decided is which one gets the sentence. This is what
     stops a slow-moving Saturn aspect from narrating a whole week.
  */
  const past = journal.filter((e) => e.d !== today);
  const cellOf = (a) => `${a.area}:${a.aspect.tone}`;
  let lead = placed[0];
  if (placed[1] && placed[1].score > placed[0].score * 0.9 && past[0]?.c === cellOf(placed[0])) {
    lead = placed[1];
  }

  const tone = lead.aspect.tone;
  const variants = READINGS[lead.area][tone];
  const cell = cellOf(lead);

  /*
     Which of the three variants.

     If today already has an entry, reuse it exactly: opening the page
     twice must not reroll the reading. Otherwise prefer a variant this
     person has never been shown, and when all three have been used, the
     least recently used one, which puts at least three days between any
     repeat of the same sentence. Ties are broken by a seed that includes
     the transiting body, so two people whose journals happen to match
     still read differently.
  */
  const mine = journal.find((e) => e.d === today);
  let variant;
  if (mine && mine.c === cell && Number.isInteger(mine.v)) {
    variant = mine.v;
  } else {
    const history = past.filter((e) => e.c === cell);
    const start = seed(`${stamp}|${lead.transit.key}|${lead.natal.key}`) % variants.length;
    /** 0 is most recent; never used ranks highest and so wins */
    const rank = (v) => {
      const i = history.findIndex((e) => e.v === v);
      return i < 0 ? Number.MAX_SAFE_INTEGER : i;
    };
    variant = variants
      .map((_, v) => v)
      .sort((a, b) => (rank(b) - rank(a)) || ((start + a) % variants.length) - ((start + b) % variants.length))[0];
  }

  /*
     The paragraph is assembled from three tables, each keyed off a
     different part of the same measurement:

       readings.json  area x tone x variant   where in a life it lands
       touches.json   natal body x tone       which part of you took it
       motion.json    transit body x applying when it peaks

     120 x 35 x 14 addresses from 169 written fragments. That is the whole
     trick, and it is the same trick every horoscope engine uses; the only
     difference here is that the address is printed underneath.
  */
  const [headline, opening] = variants[variant];
  const touch = TOUCHES[lead.natal.key]?.[tone] || "";
  const motion = lead.applying === null ? "" : MOTION[lead.transit.key][lead.applying ? 0 : 1];
  const body = [opening, touch, motion].filter(Boolean).join(" ");

  return {
    quiet: false,
    headline,
    body,
    area: lead.area,
    areaLabel: areaLabel(lead.area),
    /** what the caller should record: see journal above */
    entry: { d: today, c: cell, v: variant },
    dos: pick(COLUMNS[tone].do, 3, s),
    donts: pick(COLUMNS[tone].dont, 3, s + 1),
    lead,
    /** the arithmetic, shown rather than hidden */
    proof: proofLine(lead),
    evidence: placed.slice(0, 3).map((a) => ({
      ...a,
      areaLabel: areaLabel(a.area),
      transitSign: signAt(sky[a.transit.key]),
      natalSign: signAt(natal[a.natal.key]),
    })),
    tone,
    toneWord: ORDINAL_TONE[tone],
    natal, sky, ascendant: asc,
  };
}

function proofLine(a) {
  const exact = a.orb < 0.5
    ? "exact to within half a degree"
    : `${a.orb.toFixed(1)}° off exact`;
  return `${cap(a.transit.label)} ${a.aspect.verb} your natal ${bare(a.natal.label)}: ` +
    `${article(a.aspect.key)} ${a.aspect.key}, ${exact}. Your ${bare(a.natal.label)} sits in ` +
    `${areaDomain(a.area)}, which is why this reads as ${areaLabel(a.area).toLowerCase()}.`;
}

/** Local calendar day, which is the unit a reading is "for". */
function dayStamp(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
/* "a opposition" was the one seam showing that this sentence is assembled */
function article(word) { return /^[aeiou]/i.test(word) ? "an" : "a"; }
/** "the Moon" reads wrong after "your natal"; every other label is bare already. */
function bare(s) { return s.replace(/^the /, ""); }

/** Human label for an aspect row, e.g. "Moon □ natal Mars". */
export function aspectLabel(a) {
  return `${cap(a.transit.label)} ${a.aspect.symbol} natal ${bare(a.natal.label)}`;
}

export { BODIES, ASPECTS };
