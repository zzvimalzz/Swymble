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
  moonLongitude, sunLongitude, planetLongitudes, signAt, sectorOf, moonPhase,
  moonPhaseRarity
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
import quietFile from "./contents/quiet.json";
import signsFile from "./contents/signs.json";
import depthFile from "./contents/depth.json";
import linesFile from "./contents/lines.json";

const AREAS = areasFile.areas;
const READINGS = readingsFile.readings;
const TOUCHES = touchesFile.touches;
const MOTION = motionFile.motion;
const COLUMNS = columnsFile.columns;
const QUIET = quietFile.quiet;
const QUIET_DEPTH = quietFile.depth;
const SIGNS = signsFile.signs;
const DEPTH = depthFile.depth;
const LINES = linesFile.lines;

/*
   The line of the day, and why it is not the headline.

   Roadmap 1.5. This is the push payload, built and shown on the page long
   before anything is ever pushed, because a notification is the one piece
   of copy nobody gets to proofread after the fact. Months of it sitting at
   the top of a screen somebody actually reads is the cheapest proofing
   there is.

   It is written to a lock screen's constraints rather than a card's: 72
   characters, no label above it saying which area it is about, and no
   measurement below it. A card headline can lean on both. This cannot, so
   it is a separate bank keyed off the same address.
*/
export function lineOfTheDay(area, tone) {
  return LINES[area]?.[tone] || "";
}

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
  /*
     The outer three score low on purpose. Pluto moves about two
     arcseconds a day, so a Pluto aspect sits inside orb for most of a
     season; letting it lead would give the same headline until October.
     They earn their place as *targets*, where they are as real as
     anything else, and as the reason most sectors of a chart are
     occupied at all.
  */
  { key: "uranus",  label: "Uranus",   speed: 0.10, domain: "what will not stay put",      short: "break" },
  { key: "neptune", label: "Neptune",  speed: 0.07, domain: "what blurs",                  short: "blur" },
  { key: "pluto",   label: "Pluto",    speed: 0.05, domain: "what will not be negotiated", short: "depth" },
];

/*
   The two angles, which are natal targets and never transit sources.

   The Ascendant and the Midheaven are not bodies. They are the two points
   the sky was crossing at your horizon and your meridian at the minute you
   were born, and in every tradition they carry as much weight as a planet.
   Adding them is also what guarantees Self and Work are rarely empty: the
   Ascendant defines the first sector by construction, and the Midheaven
   sits at the tenth.

   `speed: 0` marks them unusable as a source, and the transit loop below
   never reaches for them, so the zero is documentation rather than
   arithmetic.
*/
const ANGLES = [
  { key: "ascendant", label: "the Ascendant", speed: 0, domain: "how you meet the day", short: "front" },
  { key: "midheaven", label: "the Midheaven", speed: 0, domain: "what you are seen doing", short: "standing" },
];

/** Everything an aspect can land on. Transits come from BODIES alone. */
const TARGETS = [...BODIES, ...ANGLES];
const BODY = Object.fromEntries(TARGETS.map((b) => [b.key, b]));

/*
   Seven angles: the five classical ones, plus two minor aspects with the
   tight orbs they are given in practice.

   The two minor ones borrow a tone rather than carrying their own. That
   is an interpretive choice and it is worth naming: a quincunx is a hard
   angle between two parts of a chart that share neither element nor mode,
   and it reads as adjustment under protest, which is close enough to
   friction to use the same bank. A semisextile is the mildest contact
   there is, and it reads as an opening nobody insisted on. Writing them
   ninety more readings each would be better; borrowing is honest as long
   as the borrowing is written down, which is what this paragraph is.
*/
const ASPECTS = [
  { key: "conjunction",  angle: 0,   orb: 6, tone: "charged",  verb: "sits on",           symbol: "☌" },
  { key: "semisextile",  angle: 30,  orb: 2, tone: "open",     verb: "brushes",           symbol: "⚺" },
  { key: "sextile",      angle: 60,  orb: 4, tone: "open",     verb: "opens onto",        symbol: "⚹" },
  { key: "square",       angle: 90,  orb: 5, tone: "friction", verb: "cuts across",       symbol: "□" },
  { key: "trine",        angle: 120, orb: 5, tone: "easy",     verb: "runs clean to",     symbol: "△" },
  { key: "quincunx",     angle: 150, orb: 3, tone: "friction", verb: "pulls awkwardly at", symbol: "⚻" },
  { key: "opposition",   angle: 180, orb: 6, tone: "pull",     verb: "pulls against",     symbol: "☍" },
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
    for (const n of TARGETS) {
      /* a chart cast without a birth time carries no angles */
      if (!Number.isFinite(natalChart[n.key])) continue;
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

/* ---------- the sectors, and the nine areas of a life ---------- */

/*
   The fourth dimension, and the one that makes depth possible.

   Aspect alone says how today feels. Aspect plus the natal body says
   which part of you it lands on. Neither says *where in a life* it
   lands, and that is the difference between "today is tense" and
   "today is tense about money". The sector supplies it.

   A sector is a 30-degree slice of the ecliptic counted from the
   Ascendant. Twelve of them map onto nine areas, because several of the
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
/** The one-word form, for anywhere a full area name will not fit. */
export function areaTab(key) { return AREAS[key]?.tab || AREAS[key]?.label || ""; }
export function areaDomain(key) { return AREAS[key]?.domain || ""; }
/** Every area, in the order they are written — which is the order they show. */
export const AREA_KEYS = Object.keys(AREAS);
export { AREAS };

/* ---------- the reading ---------- */

const ORDINAL_TONE = {
  charged: "exact", open: "supported", friction: "under strain", easy: "clear", pull: "stretched",
};

/*
   Polarity: whether the angle is helping or pushing.

   Co–Star prints an open circle or a hatched one beside each of its
   cards, and the axis it is really showing — an easy aspect against a
   hard one — is a thing astrologers have drawn for centuries. It is worth
   showing. What is not worth doing is what every app in the category does
   with it, which is to call it Luck, or a score, or a percentage, and
   turn a fact about an angle into a promise about a day.

   So the mark is here and the name is honest. Support and strain are
   descriptions of the geometry: a trine or a sextile is a soft angle, a
   square or an opposition is a hard one. Neither is good news or bad
   news, and the third value says so out loud — a conjunction is two
   bodies in the same degree, which amplifies whatever is already there
   and points in no direction at all.
*/
const TONE_POLARITY = {
  easy: "support", open: "support",
  friction: "strain", pull: "strain",
  charged: "charged",
};

export const POLARITIES = {
  support: {
    key: "support",
    label: "Support",
    /* said of the angle, never of the day: the geometry is the claim */
    note: "A soft angle. What it touches tends to move without being pushed.",
  },
  strain: {
    key: "strain",
    label: "Strain",
    note: "A hard angle. What it touches asks for effort, and gives way when it gets it.",
  },
  charged: {
    key: "charged",
    label: "Charged",
    note: "Neither. Two bodies in the same degree amplify what is already there.",
  },
};

/** The polarity of an aspect's tone. Charged is the honest middle, not a default. */
export function polarityOf(tone) {
  return POLARITIES[TONE_POLARITY[tone]] || POLARITIES.charged;
}

/*
   Every area of a life gets a card, every day. There is no cap.

   The cap used to be six, on the reasoning that a longer page stops being
   a reading and becomes a list. The reason it is gone is that a grid
   which shows only the areas with something in it cannot be read as a
   grid: four cards one morning and six the next looks like an app with a
   variable number of opinions, and there is no way to tell, from the
   page, whether Love is missing because the sky is quiet there or because
   the product forgot about it.

   Eight cards, always, and the quiet ones say what makes them quiet. That
   is the more honest page and it is also the harder one to fake, which is
   the whole reason to build it this way round.
*/

/** The journal key for an aspect: which area, and how it feels there. */
function cellOf(a) { return `${a.area}:${a.aspect.tone}`; }

/*
   Which of an area's three variants to show.

   If today already has an entry for this cell, reuse it exactly: opening
   the page twice must not reroll the reading. Otherwise prefer a variant
   this person has never been shown, and when all three have been used,
   the least recently used one, which puts at least three days between any
   repeat of the same sentence. Ties are broken by a seed that includes
   the transiting body, so two people whose journals happen to match still
   read differently.
*/
function chooseVariant(a, { journal, today, stamp }) {
  const cell = cellOf(a);
  const variants = READINGS[a.area][a.aspect.tone];

  const mine = journal.find((e) => e.d === today && e.c === cell);
  if (mine && Number.isInteger(mine.v)) return { cell, variant: mine.v };

  const history = journal.filter((e) => e.d !== today && e.c === cell);
  const start = seed(`${stamp}|${a.transit.key}|${a.natal.key}`) % variants.length;
  /** 0 is most recent; never used ranks highest and so wins */
  const rank = (v) => {
    const i = history.findIndex((e) => e.v === v);
    return i < 0 ? Number.MAX_SAFE_INTEGER : i;
  };
  const variant = variants
    .map((_, v) => v)
    .sort((x, y) => (rank(y) - rank(x)) || ((start + x) % variants.length) - ((start + y) % variants.length))[0];

  return { cell, variant };
}

/*
   The timing clause, walked rather than seeded.

   A day's nine cards are mostly driven by whichever body is moving
   fastest, so several of them share a transit body *and* a direction, and
   the naive lookup handed all of those the same sentence. Four cards a
   morning ending on the identical clause is the single most visible way
   an assembled page gives itself away, and no amount of variety further
   up the card hides it.

   So the position within the group picks the variant. `ctx.seen` counts
   how many cards this render has already given each (body, direction)
   pair; the day's seed offsets where the walk starts, so the same chart
   does not open on variant zero every morning. Two cards on one day
   cannot collide while a pair has no more cards than it has variants.
*/
function motionClause(a, ctx) {
  if (a.applying === null) return "";

  const bank = MOTION[a.transit.key]?.[a.applying ? 0 : 1];
  if (!bank?.length) return "";

  const slot = `${a.transit.key}|${a.applying ? "a" : "s"}`;
  const n = ctx.seen?.get(slot) || 0;
  ctx.seen?.set(slot, n + 1);

  return bank[(seed(`${ctx.stamp}|${slot}`) + n) % bank.length];
}

/*
   One aspect, written up.

   The paragraph is assembled from three tables, each keyed off a
   different part of the same measurement:

     readings.json  area x tone x variant   where in a life it lands
     touches.json   natal body x tone       which part of you took it
     motion.json    transit body x applying when it peaks

   120 x 35 x 14 addresses from 169 written fragments. That is the whole
   trick, and it is the same trick every horoscope engine uses; the only
   difference here is that the address is printed underneath.
*/
function buildCard(a, ctx) {
  const tone = a.aspect.tone;
  const { cell, variant } = chooseVariant(a, ctx);
  const [headline, opening] = READINGS[a.area][tone][variant];
  const touch = TOUCHES[a.natal.key]?.[tone] || "";
  const motion = motionClause(a, ctx);

  return {
    quiet: false,
    area: a.area,
    areaLabel: areaLabel(a.area),
    areaDomain: areaDomain(a.area),
    headline,
    body: [opening, touch, motion].filter(Boolean).join(" "),
    /*
       The expanded card, three paragraphs, in the order specific,
       specific, mechanical:

         1  the reading             what today is
         2  area x tone             what that means for this part of a life
         3  natal + tone + transit  which two points, what angle, how long

       The area dimension in the second is the whole point. Without it,
       paragraph two was natal plus tone alone, which meant the Love card
       and the Work card expanded to the *same* two paragraphs whenever
       their two aspects shared a body. Nine cards whose insides converged
       read as a template, because that is what it was.

       Paragraph three is allowed to sound like an explanation. It is one,
       and it is marked as one by sitting last, underneath two that are not.
    */
    paragraphs: [
      [opening, touch, motion].filter(Boolean).join(" "),
      DEPTH.area[a.area]?.[tone],
      [DEPTH.natal[a.natal.key], DEPTH.tone[tone], DEPTH.transit[a.transit.key]]
        .filter(Boolean).join(" "),
    ].filter(Boolean),
    tone,
    toneWord: ORDINAL_TONE[tone],
    polarity: polarityOf(tone),
    /** the signs both ends of the aspect stand in, for the expanded row */
    transitSign: signAt(ctx.sky[a.transit.key]),
    natalSign: signAt(ctx.natal[a.natal.key]),
    /** the measurement this card was written from, kept whole */
    aspect: a,
    label: aspectLabel(a),
    orb: a.orb,
    proof: proofLine(a),
    /** what the caller should record: see the journal note in dailyReading */
    entry: { d: ctx.today, c: cell, v: variant },
  };
}

/* ---------- the daily number ---------- */

/*
   Roadmap 1.6. One verifiable figure nobody knew yesterday.

   Everything else on this screen is an interpretation standing on a
   measurement. This is the measurement with no interpretation attached at
   all, and it exists because it is the only part of the page that cannot
   be argued with. It rotates, so the same person does not get the same
   kind of fact two days running, and every one of them is checkable
   against an ephemeris inside a minute.

   No copy bank. These are sentences about numbers, assembled from the
   numbers, which is why there is nothing here for a linter to police and
   nothing here that can go out of date.
*/
function clockTime(date) {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

/**
 * When an aspect is exact, found by walking the day in ten-minute steps.
 *
 * Deliberately a search rather than an interpolation: the orb is not a
 * linear function of time for the Moon and a straight line through two
 * endpoints puts the exact time out by up to an hour. 144 chart casts is
 * a few milliseconds, and the figure it prints is one somebody can hold a
 * planetarium up against.
 */
function exactTimeToday(a, dayStart) {
  const step = 10 * 60000;
  let best = null;
  for (let i = 0; i <= 144; i++) {
    const t = new Date(dayStart.getTime() + i * step);
    const chart = chartAt(t);
    const off = Math.abs(separation(chart[a.transit.key], a.natalLongitude) - a.aspect.angle);
    if (!best || off < best.off) best = { off, at: t };
  }
  /* only worth printing if it actually comes to exact inside the day */
  return best && best.off < 0.08 ? best.at : null;
}

function dailyNumber({ lead, natal, sky, now, moon, s }) {
  const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const options = [];

  /* 1. tonight's illumination, to a tenth of a per cent */
  options.push({
    kind: "illumination",
    label: "Tonight's moon",
    value: `${(moon.illumination * 100).toFixed(1)}%`,
    note: `lit, and ${moon.waxing ? "still filling" : "emptying"}. It was ${(moon.age).toFixed(1)} days old at midnight.`,
  });

  /* 2. the leading aspect going exact, with the clock time */
  if (lead) {
    const at = exactTimeToday(
      { ...lead, natalLongitude: natal[lead.natal.key] },
      midnight,
    );
    if (at) {
      options.push({
        kind: "exact",
        label: "Exact today at",
        value: clockTime(at),
        note: `${cap(bare(lead.transit.label))} reaches ${lead.aspect.key} with your ${bare(lead.natal.label)}, to the minute.`,
      });
    }
  }

  /* 3. how far the Moon has moved since midnight */
  const moved = separation(sky.moon, chartAt(midnight).moon);
  options.push({
    kind: "moved",
    label: "The moon has moved",
    value: `${moved.toFixed(2)}°`,
    note: "since midnight. It covers about thirteen degrees a day, which is why this page is worth opening again tomorrow.",
  });

  /* 4. how many of your points the sky is inside orb of right now */
  const touched = new Set();
  for (const t of BODIES) {
    for (const n of TARGETS) {
      if (!Number.isFinite(natal[n.key])) continue;
      const sep = separation(sky[t.key], natal[n.key]);
      if (ASPECTS.some((x) => Math.abs(sep - x.angle) <= x.orb)) touched.add(n.key);
    }
  }
  const total = TARGETS.filter((n) => Number.isFinite(natal[n.key])).length;
  options.push({
    kind: "touched",
    label: "In orb right now",
    value: `${touched.size} of ${total}`,
    note: "of the points in your chart have something in the sky at an angle to them today.",
  });

  /* rotates by the day and the person, so two mornings running differ */
  return options[s % options.length];
}

/* ---------- the quiet areas ---------- */

/*
   A card for an area the sky is not touching.

   This is the half of the day nothing else in the category will show you.
   Co-Star prints a confident card for every area every morning; a real chart has
   three or four things in orb on a typical day, and the other four or
   five areas are quiet. An app can handle that by widening its orbs until
   everything counts, by writing to fill the grid, or by saying so.

   Saying so is only worth anything if it comes with the arithmetic, so a
   quiet card is not an apology. It carries four real measurements: the
   sign each of its sectors runs in, which of your planets live there,
   which are passing through today, and how far outside orb the nearest
   angle is. Every one of those is checkable against an ephemeris, and
   together they are the reason the area is quiet.
*/

/*
   Sectors here are whole-sign: `sectorOf` counts 30-degree blocks from the
   Ascendant's own sign, so a sector is exactly one sign and the sign it
   runs in is fixed for life. That is why this needs no date.
*/
function areaSigns(key, asc) {
  const first = Math.floor((((asc % 360) + 360) % 360) / 30);
  return (AREAS[key]?.sectors || []).map((n) => {
    const s = signAt((first + n - 1) * 30);
    return { sector: n, sign: s.sign, glyph: s.glyph, index: s.index };
  });
}

/** Which points of a chart fall in one area, with where they stand. */
function bodiesIn(chart, key, asc, list = TARGETS) {
  return list
    .filter((b) => Number.isFinite(chart[b.key]) && areaOf(chart[b.key], asc) === key)
    .map((b) => ({ key: b.key, label: b.label, ...signAt(chart[b.key]) }));
}

/*
   The nearest angle to an area, orb ignored.

   Deliberately not a reading: nothing is written from this, because an
   aspect outside its orb is not an aspect and prose generated from one
   would be the exact overclaim this product exists to avoid. It is
   printed as a figure, so the reader can see how close the day came.
*/
function nearestTo(key, asc, sky, natal) {
  let best = null;
  for (const t of BODIES) {
    for (const n of TARGETS) {
      if (!Number.isFinite(natal[n.key]) || areaOf(natal[n.key], asc) !== key) continue;
      const sep = separation(sky[t.key], natal[n.key]);
      for (const a of ASPECTS) {
        const off = Math.abs(sep - a.angle);
        /* how far past the orb it sits; the smallest wins */
        const outside = off - a.orb;
        if (!best || outside < best.outside) {
          best = { transit: t, natal: n, aspect: a, orb: off, outside };
        }
      }
    }
  }
  return best;
}

function quietCard(key, { asc, sky, natal }) {
  const natalHere = bodiesIn(natal, key, asc);
  /* the sky has no angles of its own; only your chart does */
  const transitsHere = bodiesIn(sky, key, asc, BODIES);
  const nearest = natalHere.length ? nearestTo(key, asc, sky, natal) : null;
  const signs = areaSigns(key, asc);
  /*
     Three areas own two sectors each, so they run in two signs. The
     written material follows the first, which is the lower-numbered
     sector and the one the tradition treats as primary; the card prints
     both signs in its measurement either way, so nothing is hidden.
  */
  const sign = SIGNS[String(signs[0]?.index ?? 0)];

  /*
     Which of the four.

     The split exists because four areas without a reading is the normal
     shape of a morning, and one line for all of them meant four identical
     cards. These four are distinguishable from the chart alone: whether
     anything of yours is here, whether anything is crossing it today, and
     how close the nearest angle came. Within three degrees of counting is
     close enough to be worth naming.
  */
  const kind = natalHere.length
    ? (nearest && nearest.outside <= 3 ? "near" : "still")
    : (transitsHere.length ? "visiting" : "empty");

  return {
    quiet: true,
    kind,
    area: key,
    areaLabel: areaLabel(key),
    areaDomain: areaDomain(key),
    /* headline, body and paragraphs are filled by quietSet, which needs to
       see the whole group to keep two cards of one kind off one variant */
    headline: "", body: "", paragraphs: [], variant: -1,
    /* no aspect, so no tone and no polarity: the axis would be a fiction */
    tone: null,
    polarity: null,
    signs,
    sign,
    natalHere,
    transitsHere,
    nearest,
  };
}

/*
   Every quiet area, written up.

   The variant is walked rather than drawn. Three empty areas on one
   morning is ordinary, and a per-card seed would let two of them land on
   the same sentence often enough to look broken. Offsetting by the day
   and stepping by position makes a repeat impossible while a kind has no
   more cards than it has variants, and keeps the whole thing determined
   by the person and the date, so a reload cannot change it.
*/
function quietSet(keys, chart, stamp) {
  const cards = keys.map((k) => quietCard(k, chart));
  const seen = new Map();
  for (const c of cards) {
    const bank = QUIET[c.kind];
    const n = seen.get(c.kind) || 0;
    seen.set(c.kind, n + 1);
    c.variant = (seed(`${stamp}|${c.kind}`) + n) % bank.length;
    const [headline, opening] = bank[c.variant];
    c.headline = headline;
    /*
       The sign clause is what stops nine quiet cards reading alike, and
       where it goes in the sentence is the difference between a card that
       reads as content and one that reads as an apology.

       An area with a planet of yours in it has news, so the news leads and
       the sign follows as context. An area with nothing of yours in it has
       no news and never will: the sign *is* the reading there, so it leads,
       and the absence is the qualifier rather than the headline. Same two
       clauses, opposite order, and only one of the two orders is worth
       printing nine times a day.
    */
    const signFirst = c.kind === "empty" || c.kind === "visiting";
    c.body = (signFirst ? [c.sign?.clause, opening] : [opening, c.sign?.clause])
      .filter(Boolean).join(" ");
    c.paragraphs = [c.body, c.sign?.depth, QUIET_DEPTH[c.kind]].filter(Boolean);
  }
  return cards;
}

/**
 * One day's reading for one person.
 *
 * Requires a birth chart *with angles*: pass `ascendant`, or get null
 * back. See the note on sectors above for why guessing is not an option.
 *
 * Returns the leading headline and paragraph, the two columns, the
 * evidence, and `cards`: one for every one of the nine areas of a life,
 * every day. Areas the sky is touching carry a reading; the rest carry
 * the measurement that says why they are quiet.
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
  const sky = chartAt(noon);

  const today = dayStamp(now);
  const stamp = `${profile.key}|${today}`;
  const s = seed(stamp);

  /*
     No Ascendant means no sectors, which means no area, which means the
     reading cannot be written. The caller asks for a birth time instead.
  */
  const asc = profile.ascendant;
  if (!Number.isFinite(asc)) return null;

  /*
     The angles join the natal chart as targets. They are not bodies and
     the sky never carries them, so they are added here rather than in
     chartAt: a transit chart with an Ascendant in it would be a chart of
     nobody, cast for a place nobody was standing.
  */
  const natal = chartAt(profile.birthDate);
  natal.ascendant = asc;
  if (Number.isFinite(profile.midheaven)) natal.midheaven = profile.midheaven;

  const all = aspectsBetween(sky, natal, chartAt(tomorrow));

  // every aspect now carries where in the life it lands
  const placed = all.map((a) => ({ ...a, area: areaOf(natal[a.natal.key], asc) })).filter((a) => a.area);

  /*
     With no aspect inside orb, rare but a real day for some charts, there
     is nothing to interpret and we say so rather than inventing something.
     Silence is allowed to be the reading.
  */
  const chart = { asc, sky, natal };
  /** Every area with no reading of its own, in the order areas.json lists them. */
  const quietFor = (touched) =>
    quietSet(AREA_KEYS.filter((k) => !touched.has(k)), chart, stamp);

  if (!placed.length) {
    return {
      quiet: true,
      headline: "The sky is not saying anything today.",
      body: "No planet is within orb of anything in your chart. That happens, and it is worth more than a manufactured sentence. The measurements are below either way.",
      dos: pick(COLUMNS.easy.do, 3, s),
      donts: pick(COLUMNS.easy.dont, 3, s + 1),
      /* still nine cards: a quiet day is the one a reader most wants the
         arithmetic for, and every one of them can still say why it is quiet */
      cards: quietFor(new Set()),
      lead: null, entries: [], evidence: [], polarity: null,
      natal, sky, ascendant: asc,
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
  let lead = placed[0];
  if (placed[1] && placed[1].score > placed[0].score * 0.9 && past[0]?.c === cellOf(placed[0])) {
    lead = placed[1];
  }

  /*
     One card per area of a life, not one card for the day.

     `placed` already holds every in-orb aspect tagged with where in the
     life it lands, sorted tightest-and-fastest first. Reading only the
     first of them threw away eight ninths of a computation that had
     already been done: a day where Mars cuts across your work and the
     Moon runs clean to your home is two facts, and printing one of them
     is not a summary, it is a loss.

     One aspect per area, because two cards headed Love that disagree
     read as a machine talking. The first one seen wins, and since
     `placed` is sorted, that is the tightest and fastest in that area.

     Then every remaining area gets a quiet card, so the grid is always
     nine and a reader can tell an area the sky is not touching from an
     area the product forgot.
  */
  /* `seen` is the walk counter for the timing clause: see motionClause */
  const ctx = { journal, today, stamp, sky, natal, seen: new Map() };
  const byArea = new Map();
  for (const a of placed) if (!byArea.has(a.area)) byArea.set(a.area, a);
  /* the lead is the hero card and keeps its place at the front however it
     scored; the rest follow in the order they were found, which is score
     order */
  byArea.delete(lead.area);
  const read = [lead, ...byArea.values()].map((a) => buildCard(a, ctx));
  const cards = [...read, ...quietFor(new Set(read.map((c) => c.area)))];
  const leadCard = cards[0];
  const tone = lead.aspect.tone;

  return {
    quiet: false,
    /** the push payload, shown on the page first: see lineOfTheDay above */
    line: lineOfTheDay(lead.area, tone),
    /** one checkable figure, rotating: see dailyNumber above */
    number: dailyNumber({ lead, natal, sky, now, moon: moonPhase(noon), s }),
    /*
       Roadmap 1.7. Counted rather than asserted, and it costs a Metonic
       cycle of cheap trigonometry, which is a few milliseconds once per
       render. It does not change from day to day, because it is a fact
       about the birth rather than about today.
    */
    rarity: moonPhaseRarity(profile.birthDate),
    headline: leadCard.headline,
    body: leadCard.body,
    area: lead.area,
    areaLabel: leadCard.areaLabel,
    /** one per *reading* card; a quiet card chose nothing, so it records nothing */
    entries: read.map((c) => c.entry),
    cards,
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
    polarity: leadCard.polarity,
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
