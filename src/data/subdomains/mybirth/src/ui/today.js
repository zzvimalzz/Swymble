/* ============================================================
   today.js — the Daily Sky.

   The archive is opened once and then once a year. This screen is the
   reason to open the site on an ordinary Tuesday: it pairs *today's sky*
   with *your birth sky*, and that pairing is the thing a horoscope app
   structurally cannot do.

   ── Why this tab looks nothing like the rest of the site ──

   The archive is a deep-space object: dark, cinematic, scrolled once and
   remembered. A daily reading is a different kind of thing entirely —
   it is read standing up, in twenty seconds, probably in the morning,
   and it wants to feel like a printed page rather than a planetarium.
   So this tab, and only this tab, is off-white paper, near-black type
   and one gold accent. Switching to it should feel like putting down a
   telescope and picking up a card.

   ── What is on it ──

   Six things, and six is the cap.
     1. The reading   — headline, paragraph, More of / Less of (reading.js)
     2. The measurement — the arithmetic that produced the reading, shown
     3. The day by area — nine cards, one per area of a life, every day.
                          Each expands to three paragraphs and its arithmetic
     4. Moon return   — tonight's phase against your birth phase
     5. Sun position  — where Earth is on the lap, and the countdown
     6. The count     — days lived, and the next round numbers with dates

   Everything is computed on the device, with no network at all.
   ============================================================ */

import {
  moonPhase, skyReturn, nextBirthday, milestones, cosmicOdometer,
  ordinal, prettyDate, monthName, chartAngles, signAt, zonedToUTC,
  moonPhaseRarity, skyAgainstBirth
} from "../sky/astro.js";
import { dailyReading, aspectLabel, chartAt } from "../sky/reading.js";
import { signIcon, planetIcon } from "./glyphs.js";

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DAY = 86400000;

function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

const num = (n) => Math.round(n).toLocaleString("en-US");

/* ---------- profiles ---------- */

/**
 * A saved record becomes the subject of a Daily Sky.
 * Records written before this screen existed carry only name and date;
 * everything here degrades to that, so an old save still works.
 */
export function buildProfile(save) {
  if (!save) return null;
  const day = +save.day, month = +save.month, year = +save.year;
  if (!Number.isFinite(day) || !Number.isFinite(month) || !Number.isFinite(year)) return null;

  let hh = 12, mm = 0;               // noon centres the day when no time was given
  const hasTime = !!save.time && /^\d{1,2}:\d{2}/.test(save.time);
  if (hasTime) [hh, mm] = save.time.split(":").map(Number);

  /*
     Records written before this screen existed carry only the share URL,
     and the coordinates are in its query string. Reading them back beats
     asking a returning visitor to enter their birthplace a second time.
  */
  let lat = Number(save.lat), lon = Number(save.lon), tz = save.tz || "";
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    try {
      const q = new URL(save.shareURL, location.origin).searchParams;
      lat = parseFloat(q.get("la")); lon = parseFloat(q.get("lo"));
      tz = tz || (q.get("tz") || "");
    } catch { /* no usable URL, so no coordinates */ }
  }
  const hasPlace = Number.isFinite(lat) && Number.isFinite(lon);

  // the birth moment as a real instant; no zone means the clock reads as UTC
  const birthDate = zonedToUTC(year, month, day, hh, mm, tz);

  const angles = hasTime && hasPlace ? chartAngles(birthDate, lat, lon) : null;

  return {
    key: save.key || `${save.name}|${day}|${month}|${year}`,
    name: save.name,
    first: (save.name || "").split(/\s+/)[0] || save.name,
    day, month, year,
    time: hasTime ? save.time : "",
    hasTime, hasPlace,
    lat, lon, tz,
    birthDate,
    ascendant: angles?.ascendant ?? null,
    midheaven: angles?.midheaven ?? null,
    placeLabel: save.placeLabel || "",
    shareURL: save.shareURL || "",
  };
}

/* ---------- the moon, drawn flat ---------- */

/*
   The archive mounts a real three.js moon. This screen needs two of them
   side by side and rebuilds on every open, so the phase is drawn as one
   SVG path instead: the lit disc, with the dark limb laid over it as a
   semicircle joined to the terminator ellipse.
*/
export function moonDiscSVG(phase, { size = 108, label = "" } = {}) {
  const r = 50, cx = 60, cy = 60;
  const f = phase.fraction;
  const k = (1 - Math.cos(2 * Math.PI * f)) / 2;          // illuminated fraction
  const rx = Math.abs(r * Math.cos(2 * Math.PI * f));     // terminator semi-axis
  const waxing = f < 0.5;
  // outer limb runs down the dark side; the terminator bulges away from the
  // lit half for a crescent and towards it for a gibbous
  const outer = waxing ? 0 : 1;
  const inner = waxing === (k >= 0.5) ? 1 : 0;
  const dark =
    `M ${cx} ${cy - r} A ${r} ${r} 0 0 ${outer} ${cx} ${cy + r} ` +
    `A ${rx.toFixed(2)} ${r} 0 0 ${inner} ${cx} ${cy - r} Z`;
  const id = `md${Math.round(f * 1e4)}`;

  return `
    <svg class="mdisc" viewBox="0 0 120 120" width="${size}" height="${size}"
         role="img" aria-label="${esc(label || phase.name)}, ${Math.round(phase.illumination * 100)} per cent lit">
      <defs>
        <radialGradient id="${id}" cx="36%" cy="32%">
          <stop offset="0" stop-color="#fffdf6"/>
          <stop offset="0.62" stop-color="#f0e6cd"/>
          <stop offset="1" stop-color="#cdbe98"/>
        </radialGradient>
      </defs>
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#${id})"/>
      <circle cx="42" cy="47" r="9" class="mdisc__mare"/>
      <circle cx="70" cy="38" r="5.5" class="mdisc__mare"/>
      <circle cx="63" cy="72" r="11" class="mdisc__mare"/>
      <circle cx="45" cy="76" r="4.5" class="mdisc__mare"/>
      <path d="${dark}" class="mdisc__dark"/>
      <circle cx="${cx}" cy="${cy}" r="${r}" class="mdisc__rim"/>
    </svg>`;
}

/* ---------- the polarity mark ---------- */

/*
   One ring per card, drawn three ways: open for a soft angle, hatched
   for a hard one, and a filled centre for a conjunction, which is
   neither. The shapes are the ones an astrologer's chart has used for a
   century and the reason they work is that they are read at a glance and
   carry no colour — nothing here is green for good and red for bad,
   because the angle is not good or bad and saying otherwise in a colour
   is still saying it.

   Drawn as line geometry rather than an SVG <pattern>, because a pattern
   needs an id, and six ids minted into one page collide the moment two
   cards share a polarity. The hatch is three chords of the same circle.

   The label sits beside the mark. A mark alone would be decoration, and
   the whole point of the axis is that it can be named.
*/
function polarityMark(polarity, { cls = "" } = {}) {
  if (!polarity) return "";
  const ring = `<circle cx="6" cy="6" r="5" fill="none" stroke="currentColor" stroke-width="1.2" />`;
  const inner = {
    support: "",
    strain: `<g stroke="currentColor" stroke-width="1" stroke-linecap="round">
        <line x1="2.46" y1="2.46" x2="9.54" y2="9.54" />
        <line x1="4.71" y1="1.17" x2="10.83" y2="7.29" />
        <line x1="1.17" y1="4.71" x2="7.29" y2="10.83" />
      </g>`,
    charged: `<circle cx="6" cy="6" r="2.1" fill="currentColor" />`,
  }[polarity.key] || "";

  return `<svg class="sky-pol__mark ${esc(cls)}" viewBox="0 0 12 12" width="12" height="12"
               role="img" aria-hidden="true" focusable="false">${ring}${inner}</svg>`;
}

function polarityHTML(polarity, { cls = "" } = {}) {
  if (!polarity) return "";
  return `
    <span class="sky-pol ${esc(cls)}" data-polarity="${esc(polarity.key)}" title="${esc(polarity.note)}">
      ${polarityMark(polarity)}<span>${esc(polarity.label)}</span>
    </span>`;
}

/* ---------- the screen ---------- */

export function dailySkyHTML(p, { astro = false, profiles = [], theme = "light", journal = [], onReading = null, now = new Date() } = {}) {
  if (!p) {
    return `
      <div class="sky sky--empty">
        <p class="sky-kick">The daily sky</p>
        <h1 class="sky-head__title">Nobody to <em>read it for.</em></h1>
        <p class="sky-lede">
          Recover a birth day first. Once one is saved, this page recomputes every
          morning from that chart: which planet is sitting on which of yours, how far
          the moon has travelled back towards the one you were born under, and what
          the arithmetic says about today.
        </p>
        <button type="button" class="sky-btn" data-goto-archive>Recover a day</button>
      </div>`;
  }

  /*
     The Daily Sky needs a birth time and this tab alone insists on it.

     The archive is happy without one: a moon phase, a solar return and a
     day count are all fine cast for noon. The daily reading is not, because
     it is written against the *sectors*, and the Ascendant moves a degree
     every four minutes. Cast for noon, the sector layout is wrong for
     twenty-three hours out of twenty-four, and a reading about money when
     it should have been about home is worse than no reading at all.

     So the person is asked, here, once, and the answer is kept.
  */
  if (!p.ascendant) {
    return `
      <div class="sky">
        ${headHTML(p, profiles, now, theme)}
        ${needTimeHTML(p)}
      </div>`;
  }

  const reading = dailyReading(p, now, { journal });
  if (!reading) return `<div class="sky">${headHTML(p, profiles, now, theme)}${needTimeHTML(p)}</div>`;
  // the caller owns storage, so it is told what was shown rather than
  // this module reaching for localStorage itself
  if (onReading && reading.entries?.length) onReading(reading.entries);
  const s = skyReturn(p.birthDate, now);
  const todayMoon = moonPhase(now);
  const odo = cosmicOdometer(p.birthDate, now);
  const nb = nextBirthday(p.month, p.day, now);
  const ms = milestones(p.birthDate, now, 4);

  const moonDays = Math.round(s.daysToMoonMatch);
  const daysToReturn = nb ? Math.max(0, Math.floor((nb.date - now) / DAY)) : null;
  /* roadmap 1.8: the same question the moon module asks, asked of everything */
  const against = skyAgainstBirth(chartAt(p.birthDate), chartAt(now), p.birthDate, now);

  return `
    <div class="sky">
      ${headHTML(p, profiles, now, theme)}
      ${readingHTML(reading, p)}
      ${numberHTML(reading)}
      ${measurementHTML(reading, astro)}
      ${cardsHTML(reading)}
      ${againstHTML(against)}
      ${rarityHTML(reading)}

      <div class="sky-grid">
        ${moonModuleHTML(s, todayMoon, moonDays)}
        ${sunModuleHTML(p, s, nb, daysToReturn)}
        ${countModuleHTML(odo, ms, now)}
        <div class="async-slot" data-slot="space"></div>
      </div>

      ${footHTML(p, astro)}
    </div>`;
}

/* ---------- header ---------- */

function headHTML(p, profiles, now, theme) {
  const dateLine = `${WEEKDAYS[now.getDay()]}, ${ordinal(now.getDate())} ${monthName(now.getMonth() + 1)} ${now.getFullYear()}`;
  const switcher = profiles.length > 1
    ? `<div class="sky-who" role="group" aria-label="Whose sky to read">
         ${profiles.map((q) => `
           <button type="button" class="sky-who__btn${q.key === p.key ? " is-active" : ""}"
                   data-profile="${esc(q.key)}"${q.key === p.key ? ' aria-current="true"' : ""}>${esc(q.first)}</button>`).join("")}
       </div>`
    : `<p class="sky-kick">${esc(p.name)}</p>`;

  return `
    <header class="sky-head">
      <p class="sky-kick">${esc(dateLine)}</p>
      <div class="sky-head__right">
        ${switcher}
      </div>
    </header>`;
}

/* ---------- the birth-time gate ---------- */

/*
   Two number fields and a button.

   This screen used to explain, at length, why the Ascendant needs a time.
   All of that was true and none of it was wanted: someone who has just
   arrived wants to answer the question, not read the reasoning behind it.
   The only line kept is the one the reader cannot supply themselves, and
   the 24-hour format is taught by the live readout underneath rather than
   by an instruction above.
*/
function needTimeHTML(p) {
  if (!p.hasPlace) {
    return `
      <section class="sky-ask">
        <h1 class="sky-headline">Hey ${esc(p.first)}. This day needs a birthplace.</h1>
        <p class="sky-body">Recover it again from the archive and pick a place from the list.</p>
        <button type="button" class="sky-btn" data-goto-archive>Open the archive</button>
      </section>`;
  }

  return `
    <section class="sky-ask">
      <h1 class="sky-headline">Hey ${esc(p.first)}. Add your birth time.</h1>
      <form class="clock" data-time-form novalidate>
        <div class="clock__row">
          <input class="clock__unit" data-unit="h" inputmode="numeric" autocomplete="off"
                 maxlength="2" placeholder="00" aria-label="Hour, 0 to 23" />
          <span class="clock__colon" aria-hidden="true">:</span>
          <input class="clock__unit" data-unit="m" inputmode="numeric" autocomplete="off"
                 maxlength="2" placeholder="00" aria-label="Minute, 0 to 59" />
        </div>
        <p class="clock__read" data-clock-read role="status">&nbsp;</p>
        <button type="submit" class="sky-btn" data-clock-save disabled>Save it</button>
      </form>
    </section>`;
}

/* ---------- 1. the reading ---------- */

/*
   The line of the day sits above everything, at the size a lock screen
   would give it. It is the same sentence the notification will carry when
   there are notifications, which is the point of building it now: this is
   where the bad ones get found, on a page somebody reads by choice, rather
   than on a phone somebody cannot un-read.
*/
function lineHTML(r) {
  if (!r.line) return "";
  return `
    <p class="sky-line">${esc(r.line)}</p>`;
}

function readingHTML(r, p) {
  return `
    <section class="sky-read">
      ${lineHTML(r)}
      <p class="sky-label sky-label--pol">
        <span>Today&rsquo;s leading angle${r.areaLabel ? ` &middot; ${esc(r.areaLabel)}` : ""}</span>
        ${polarityHTML(r.polarity)}
      </p>
      <h1 class="sky-headline">${esc(r.headline)}</h1>
      <p class="sky-body">${esc(r.body)}</p>

      <!--
        "More of" and "Less of", not "Do" and "Don't".

        Partly because the entries are noun phrases and always were — the
        bank holds "Happy hour" and "Hedging", so "More of: Happy hour"
        parses and "Do: Happy hour" does not. And partly because Do/Don't
        is the name Co-Star's daily screen uses, and a product whose only
        real claim is that it shows its working cannot afford to arrive
        wearing a competitor's labels. Nothing here was ever copied from
        them; the headings just made it look as though it had been.
      -->
      <div class="sky-dd">
        <div class="sky-dd__col">
          <p class="sky-dd__head">More of</p>
          <ul>${r.dos.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>
        </div>
        <div class="sky-dd__col">
          <p class="sky-dd__head">Less of</p>
          <ul>${r.donts.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>
        </div>
      </div>
    </section>`;
}

/* ---------- 2. the daily number ---------- */

/*
   One figure, set large, with no interpretation attached to it at all.

   Every other block on this screen is a sentence standing on a number.
   This is the number standing on its own, and it is here because it is
   the only thing on the page nobody can argue with: the moon is 61.4 per
   cent lit tonight or it is not, and a reader who checks will find it is.
   It rotates by the day, so it is also the part of the page that is
   different tomorrow whatever the sky is doing.
*/
function numberHTML(r) {
  if (!r.number) return "";
  return `
    <section class="sky-num">
      <p class="sky-label">${esc(r.number.label)}</p>
      <p class="sky-num__value">${esc(r.number.value)}</p>
      <p class="sky-num__note">${esc(r.number.note)}</p>
    </section>`;
}

/* ---------- 3. the measurement ---------- */

/*
   The whole argument of this product in one block. A horoscope app tells
   you what the sky means and there is no way to check it, which is why
   trust in one decays over months. This shows the numbers that produced
   the sentence above: which two bodies, what angle between them, how far
   off exact. Read the reading or ignore it — the measurement is true
   either way, and it is the same measurement an ephemeris would give.
*/
function measurementHTML(r, astro) {
  if (r.quiet) {
    return `
      <section class="sky-proof">
        <p class="sky-label">The measurement</p>
        <p class="sky-proof__lead">Nothing in the sky is within orb of anything in your chart today.</p>
      </section>`;
  }

  const rows = r.evidence.map((a) => `
    <li class="sky-asp">
      <span class="sky-asp__bodies">
        ${planetIcon(cap(bare(a.transit.label)), { cls: "sky-asp__ico" })}
        <b>${cap(bare(a.transit.label))}</b>
        <span class="sky-asp__op" title="${esc(a.aspect.key)}">${a.aspect.symbol}</span>
        ${planetIcon(cap(bare(a.natal.label)), { cls: "sky-asp__ico" })}
        <b>natal ${cap(bare(a.natal.label))}</b>
      </span>
      <span class="sky-asp__sign">
        ${signIcon(a.transitSign.sign, { cls: "sky-asp__ico" })}${esc(a.transitSign.sign)} ${Math.floor(a.transitSign.degreeInSign)}&deg;
        ${a.areaLabel ? `<b class="sky-asp__area">${esc(a.areaLabel)}</b>` : ""}
      </span>
      <span class="sky-asp__orb">${a.orb.toFixed(1)}&deg;<small>off exact</small></span>
    </li>`).join("");

  return `
    <section class="sky-proof">
      <p class="sky-label">The measurement</p>
      <p class="sky-proof__lead">${esc(r.proof)}</p>
      <ul class="sky-asps">${rows}</ul>
      ${astro ? `<p class="sky-proof__note sky-proof__note--astro">
        Astrological reading on. The sentence above is one traditional meaning of that
        angle. The angle itself is not a tradition; it is where the two bodies are.
      </p>` : `<p class="sky-proof__note">
        Geocentric ecliptic longitudes, worked out here from Keplerian elements and a
        Meeus lunar series. Check any row against an ephemeris; it will agree to a
        tenth of a degree.
      </p>`}
    </section>`;
}

/* ---------- the rarity line ---------- */

/*
   Roadmap 1.7. One sentence, and the most shareable thing on the page.

   "About three per cent of birthdays have a moon like yours" is the sort
   of claim the category makes constantly and never supports. This one is
   supported: the share is counted over a full Metonic cycle, the count is
   printed beside the percentage, and the window is named. A reader with an
   ephemeris and a spreadsheet gets the same number.

   The tolerance is stated too, because "a moon like yours" is a choice and
   a different tolerance gives a different figure. Hiding that would make
   the sentence a claim rather than a measurement.
*/
function rarityHTML(r) {
  const q = r.rarity;
  if (!q) return "";

  const pct = q.percent < 0.1 ? "under 0.1" : q.percent.toFixed(1);
  const lit = (q.illumination * 100).toFixed(1);

  return `
    <section class="sky-rare">
      <p class="sky-label">How unusual that moon was</p>
      <p class="sky-rare__lead">
        You were born under a moon <b>${lit}%</b> lit. About
        <b>${pct}%</b> of days carry a moon within a percentage point of that one.
      </p>
      <p class="sky-proof__note">
        ${q.matches} days out of ${q.days}, counted over one Metonic cycle: 235 lunar
        months come to within two hours of 19 solar years, so it is the shortest
        window over which every phase falls on every part of the calendar about
        equally often.
      </p>
    </section>`;
}

/* ---------- tonight's sky against your sky ---------- */

/*
   Roadmap 1.8. The moon-return module, extended to the other nine bodies.

   Everything here is one question asked ten times: how far round has this
   body travelled since the minute you were born, and when does it come
   back? The moon has done it a thousand times and does it again next
   month. Saturn has done it once if you are past thirty and not at all if
   you are not. Pluto will not do it.

   The dates are computed from mean motion, so they drift; the row says so
   for anything slow enough for the drift to matter rather than printing a
   day nobody should trust.
*/
function againstHTML(rows) {
  if (!rows?.length) return "";

  const line = (b) => {
    const pct = Math.round(b.progress * 100);
    const laps = b.returns;
    const soon = b.daysToReturn < 400;
    const when = soon
      ? `${Math.round(b.daysToReturn)} days`
      : `${(b.daysToReturn / 365.25).toFixed(1)} years`;

    return `
      <li class="sky-back">
        <span class="sky-back__body">
          ${planetIcon(cap(bare(BODY_LABEL[b.key] || b.key)), { cls: "sky-asp__ico" })}
          <b>${esc(cap(bare(BODY_LABEL[b.key] || b.key)))}</b>
        </span>
        <span class="sky-back__bar" role="img"
              aria-label="${pct} per cent of the way back to where it was when you were born">
          <span class="sky-back__fill" style="width:${pct}%"></span>
        </span>
        <span class="sky-back__pct">${pct}%</span>
        <span class="sky-back__when">
          ${laps > 0 ? `${laps} return${laps === 1 ? "" : "s"} so far, ` : "never yet, "}
          next in ${when}
        </span>
      </li>`;
  };

  return `
    <section class="sky-against">
      <p class="sky-label">Tonight&rsquo;s sky against your sky</p>
      <ul class="sky-backs">${rows.map(line).join("")}</ul>
      <p class="sky-proof__note">
        How far round each body has travelled since the minute you were born, and
        when it next stands where it stood then. Worked out from mean motion, so a
        date for the slow bodies is good to a few weeks rather than to a day.
      </p>
    </section>`;
}

/** Labels the astronomy layer does not carry, because it works in keys. */
const BODY_LABEL = {
  moon: "the Moon", sun: "the Sun", mercury: "Mercury", venus: "Venus",
  mars: "Mars", jupiter: "Jupiter", saturn: "Saturn", uranus: "Uranus",
  neptune: "Neptune", pluto: "Pluto",
};

/* ---------- 3. the day, by area ---------- */

/*
   The engine has always computed an aspect for every area of a life the
   sky happens to be touching, and this screen used to print one of them.
   That was one sentence standing in for up to nine measurements, and a
   reader with nothing to compare it against has no way to tell a reading
   that fits from one that merely sounds like it does.

   Each card carries its own measurement for the same reason the lead
   does: an interpretation nobody can check is one a reader stops
   trusting. Seven cards of unattributed prose under one attributed
   headline would be eight-ninths of a horoscope.

   ── Eight cards, always ──

   There is no filter and there are no missing cards. A grid that shrank
   to whatever the sky happened to be touching could not be read as a
   grid: four cards one morning and six the next looks like an app with a
   variable number of opinions, and nothing on the page tells you whether
   Love is absent because it is quiet or because the product forgot.

   So every area is here every day, and the quiet ones say what makes them
   quiet: which sign the sector runs in, which of your planets live there,
   which are passing through today, and how far outside orb the nearest
   angle sits. Those are four real measurements, and printing them is the
   opposite of filling a grid.

   ── Expanding ──

   The card is a peek and the popup is the whole thing: the full
   paragraph and the measurement row that produced it, laid out exactly as
   the lead's proof block is. Every card ships with its dialog already in
   the document, so opening one fetches nothing, renders nothing and
   cannot reroll the day.

   The card's headline and paragraph are cut off in CSS rather than in
   JavaScript, so the full text is always in the document. A truncated
   string would have been shorter to write and would have taken the
   sentence away from find-in-page, from a screen reader reading the card
   in place, and from anything reading the markup.
*/
function cardsHTML(r) {
  const cards = r.cards || [];
  if (!cards.length) return "";

  return `
    <section class="sky-cards">
      <p class="sky-label">The day, by area</p>
      <div class="sky-cards__grid">
        ${cards.map(cardHTML).join("")}
      </div>
      ${cards.map(cardModalHTML).join("")}
    </section>`;
}

/* ---------- the compact card ---------- */

function cardHTML(c, i) {
  /* the lead is marked in the markup but not labelled in the copy: the
     card is the same size as the other eight and saying so in the copy only
     it only repeated what the headline at the top of the page already is */
  const lead = i === 0 && !c.quiet;
  return `
    <article class="sky-card${lead ? " sky-card--lead" : ""}${c.quiet ? " sky-card--quiet" : ""}"
             data-area="${esc(c.area)}" data-kind="${c.quiet ? "quiet" : "reading"}"
             ${c.polarity ? `data-polarity="${esc(c.polarity.key)}"` : ""}>
      <p class="sky-card__area">
        <span>${esc(c.areaLabel)}</span>
        ${c.polarity
          ? polarityHTML(c.polarity, { cls: "sky-card__pol" })
          : `<span class="sky-pol sky-card__pol" data-polarity="quiet"
                   title="Nothing in the sky is at an angle to this part of your chart today.">
               <span class="sky-tab__dot" aria-hidden="true"></span><span>Quiet</span>
             </span>`}
      </p>
      <h2 class="sky-card__head">${esc(c.headline)}</h2>
      <p class="sky-card__body">${esc(c.body)}</p>
      <div class="sky-card__foot">
        ${cardFootHTML(c)}
        <button type="button" class="sky-card__more" data-expand="${esc(c.area)}"
                aria-haspopup="dialog"
                aria-label="Expand ${esc(c.areaLabel.toLowerCase())}">
          <span aria-hidden="true">&rarr;</span>
        </button>
      </div>
    </article>`;
}

/*
   The one line of arithmetic that survives into the compact card. A
   reading card shows the aspect it was written from; a quiet card shows
   the nearest angle and how far outside orb it is, or, where the chart
   holds nothing in that area at all, says exactly that.
*/
function cardFootHTML(c) {
  if (!c.quiet) {
    return `
      <p class="sky-card__proof">
        ${planetIcon(cap(bare(c.aspect.transit.label)), { cls: "sky-card__ico" })}
        <span class="sky-card__asp">${esc(c.label)}</span>
        <b class="sky-card__orb">${c.orb.toFixed(1)}&deg;</b>
      </p>`;
  }

  if (c.nearest) {
    return `
      <p class="sky-card__proof">
        ${planetIcon(cap(bare(c.nearest.transit.label)), { cls: "sky-card__ico" })}
        <span class="sky-card__asp">${esc(nearestLabel(c.nearest))}</span>
        <b class="sky-card__orb">+${c.nearest.outside.toFixed(1)}&deg;</b>
      </p>`;
  }

  /*
     No angle to print, so the line carries the facts that still separate
     this area from the next one: which sign it runs in, and what is
     crossing it today. The sign leads when there is nothing else, because
     a footer reading "nothing of yours here" was the last thing on the
     card still saying the area was empty, and it was the only line on it
     that was not a measurement.
  */
  const crossing = c.transitsHere[0];
  const sign = c.signs[0];
  return `
    <p class="sky-card__proof">
      ${crossing
        ? `${planetIcon(cap(bare(crossing.label)), { cls: "sky-card__ico" })}
           <span class="sky-card__asp">${esc(bodyList(c.transitsHere))} crossing</span>
           <b class="sky-card__orb">${esc(signList(c.signs))}</b>`
        : `${sign ? signIcon(sign.sign, { cls: "sky-card__ico" }) : ""}
           <span class="sky-card__asp">Runs in ${esc(signList(c.signs))}</span>
           <b class="sky-card__orb">${c.natalHere.length ? `${c.natalHere.length} yours` : "sector empty"}</b>`}
    </p>`;
}

/** "Mars", or "Mars and Venus", or "Mars, Venus and the Moon". */
function bodyList(list) {
  const names = list.map((b) => cap(bare(b.label)));
  if (names.length < 2) return names[0] || "";
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

/** "Mars □ natal Venus", for an angle that is near but not counted. */
function nearestLabel(n) {
  return `${cap(bare(n.transit.label))} ${n.aspect.symbol} natal ${cap(bare(n.natal.label))}`;
}

function signList(signs) {
  const names = signs.map((s) => s.sign);
  if (names.length < 2) return names[0] || "this sector";
  return `${names.slice(0, -1).join(", ")} or ${names[names.length - 1]}`;
}

/* ---------- the shareable card ---------- */

/*
   Roadmap 1.9. A card, rendered to a square, for sharing.

   The argument for building this is not that sharing is nice. It is that
   every card on this page carries its own arithmetic, so a shared card
   carries the arithmetic with it: the aspect, the two bodies, the orb in
   degrees and the date it was true. Somebody who has never heard of the
   product receives a claim and the evidence for it in the same image,
   which is a thing no other app in the category can post.

   Built as its own node rather than by photographing the card on screen.
   The card is a 280px grid cell with clamped text; the share image is a
   1080 square with the whole paragraph, the moon disc for the day and the
   measurement set at a size that survives being looked at on a phone. It
   is laid out here and rasterised by the caller, which owns html2canvas.
*/
export function shareCardHTML(c, { profile, moon, date } = {}) {
  const stamp = date
    ? `${ordinal(date.getDate())} ${monthName(date.getMonth() + 1)} ${date.getFullYear()}`
    : "";

  return `
    <div class="sharecard" data-share-card>
      <div class="sharecard__top">
        <p class="sharecard__area">${esc(c.areaLabel)}</p>
        ${c.polarity ? polarityHTML(c.polarity) : ""}
      </div>

      <h2 class="sharecard__head">${esc(c.headline)}</h2>
      <p class="sharecard__body">${esc(c.body)}</p>

      <div class="sharecard__foot">
        ${moon ? moonDiscSVG(moon, { size: 92, label: moon.name }) : ""}
        <div class="sharecard__proof">
          ${c.quiet ? `
            <p class="sharecard__asp">${esc(signList(c.signs))}</p>
            <p class="sharecard__orb">nothing within orb</p>
          ` : `
            <p class="sharecard__asp">${esc(c.label)}</p>
            <p class="sharecard__orb">${c.orb.toFixed(1)}&deg; off exact</p>
          `}
          <p class="sharecard__when">${esc(stamp)}${profile?.first ? ` &middot; ${esc(profile.first)}` : ""}</p>
        </div>
      </div>

      <!--
        The mark is the point of the exercise, so it is the one thing on
        the card that is not allowed to be subtle. A card that travels
        without saying where it came from is an advertisement for nobody.
      -->
      <p class="sharecard__mark">mybirth.swymble.com</p>
    </div>`;
}

/* ---------- the expanded card ---------- */

/*
   A native <dialog>, not a div with a z-index.

   showModal() brings the focus trap, the Escape key, inert background
   content and the ::backdrop pseudo-element with it, all of which would
   otherwise be a hundred lines of listener that a keyboard user finds the
   bugs in. The close button is a <form method="dialog">, so it works with
   no script at all.
*/
function cardModalHTML(c) {
  return `
    <dialog class="sky-modal" data-modal-for="${esc(c.area)}"
            aria-labelledby="sky-modal-head-${esc(c.area)}">
      <div class="sky-modal__inner">
        <header class="sky-modal__head">
          <p class="sky-label sky-label--pol">
            <span>${esc(c.areaLabel)}</span>
            ${c.polarity ? polarityHTML(c.polarity) : ""}
          </p>
          <div class="sky-modal__acts">
            <button type="button" class="sky-modal__share" data-share="${esc(c.area)}"
                    aria-label="Save this card as an image">
              <span aria-hidden="true">&darr;</span> Save
            </button>
            <form method="dialog">
              <button type="submit" class="sky-modal__x" aria-label="Close">&times;</button>
            </form>
          </div>
        </header>

        <h2 class="sky-modal__title" id="sky-modal-head-${esc(c.area)}">${esc(c.headline)}</h2>
        ${(c.paragraphs || [c.body]).map((p) => `<p class="sky-modal__body">${esc(p)}</p>`).join("")}
        <p class="sky-modal__domain">This area is the part of your chart that governs
          ${esc(c.areaDomain)}.</p>

        ${c.quiet ? quietDetailHTML(c) : readingDetailHTML(c)}
      </div>
    </dialog>`;
}

/* The measurement row, in the same shape the lead's proof block uses. */
function readingDetailHTML(c) {
  return `
    <div class="sky-modal__proof">
      <p class="sky-label">The measurement</p>
      <p class="sky-proof__lead">${esc(c.proof)}</p>
      <ul class="sky-asps">
        <li class="sky-asp">
          <span class="sky-asp__bodies">
            ${planetIcon(cap(bare(c.aspect.transit.label)), { cls: "sky-asp__ico" })}
            <b>${cap(bare(c.aspect.transit.label))}</b>
            <span class="sky-asp__op" title="${esc(c.aspect.aspect.key)}">${c.aspect.aspect.symbol}</span>
            ${planetIcon(cap(bare(c.aspect.natal.label)), { cls: "sky-asp__ico" })}
            <b>natal ${cap(bare(c.aspect.natal.label))}</b>
          </span>
          <span class="sky-asp__sign">
            ${signIcon(c.transitSign.sign, { cls: "sky-asp__ico" })}${esc(c.transitSign.sign)}
            ${Math.floor(c.transitSign.degreeInSign)}&deg;
          </span>
          <span class="sky-asp__orb">${c.orb.toFixed(1)}&deg;<small>off exact</small></span>
        </li>
        <li class="sky-asp">
          <span class="sky-asp__bodies">
            ${signIcon(c.natalSign.sign, { cls: "sky-asp__ico" })}
            <b>Your ${cap(bare(c.aspect.natal.label))}</b>
          </span>
          <span class="sky-asp__sign">${esc(c.natalSign.sign)}
            ${Math.floor(c.natalSign.degreeInSign)}&deg;</span>
          <span class="sky-asp__orb">${c.aspect.aspect.orb}&deg;<small>orb allowed</small></span>
        </li>
      </ul>
      <p class="sky-proof__note">
        ${c.aspect.applying === null ? "" : c.aspect.applying
          ? "Still tightening towards exact."
          : "Past exact and widening."}
        Geocentric ecliptic longitudes. Check the row against an ephemeris; it will
        agree to a tenth of a degree.
      </p>
    </div>`;
}

/*
   Why an area is quiet, in four measurements. This is the block that makes
   an empty card worth printing: it is checkable, it changes daily, and no
   other product in the category will tell you any of it.
*/
function quietDetailHTML(c) {
  const row = (label, value) => `
    <li class="sky-asp sky-asp--plain">
      <span class="sky-asp__bodies"><b>${label}</b></span>
      <span class="sky-asp__sign">${value}</span>
    </li>`;

  const bodies = (list) => list.length
    ? list.map((b) => `${cap(bare(b.label))} ${Math.floor(b.degreeInSign)}&deg; ${esc(b.sign)}`).join(", ")
    : "none";

  return `
    <div class="sky-modal__proof">
      <p class="sky-label">Why it is quiet</p>
      <ul class="sky-asps">
        ${row("The sector runs in", esc(signList(c.signs)))}
        ${row("Your planets here", bodies(c.natalHere))}
        ${row("Passing through today", bodies(c.transitsHere))}
        ${c.nearest ? row(
          "Nearest angle",
          `${esc(nearestLabel(c.nearest))}, ${c.nearest.orb.toFixed(1)}&deg; off exact`,
        ) : ""}
        ${c.nearest ? row(
          "Outside its orb by",
          `${c.nearest.outside.toFixed(1)}&deg; (${c.nearest.aspect.key} allows ${c.nearest.aspect.orb}&deg;)`,
        ) : ""}
      </ul>
      <p class="sky-proof__note">
        An angle outside its orb is not an aspect, so nothing here was written from
        one. The figures are the reading. They are the same figures an ephemeris
        would give, and tomorrow they will have moved.
      </p>
    </div>`;
}

/* ---------- 4. moon return ---------- */

function moonModuleHTML(s, todayMoon, moonDays) {
  const pct = Math.round(s.moonProgress * 100);
  const matchDate = s.moonMatchDate;
  const when = moonDays <= 0
    ? "Tonight the moon wears the face it wore the night you began."
    : moonDays === 1
      ? "Tomorrow night the moon is back to your phase."
      : `Your moon returns in <b>${moonDays}</b> days, on <b>${prettyDate(matchDate.getDate(), matchDate.getMonth() + 1, matchDate.getFullYear())}</b>.`;

  return `
    <section class="sky-mod">
      <p class="sky-label">Moon return</p>
      <div class="sky-moons">
        <figure>
          ${moonDiscSVG(s.birthMoon, { label: "Your birth moon" })}
          <figcaption><b>Yours</b><span>${esc(s.birthMoon.name)}<br/>${Math.round(s.birthMoon.illumination * 100)}% lit</span></figcaption>
        </figure>
        <figure>
          ${moonDiscSVG(todayMoon, { label: "Tonight's moon" })}
          <figcaption><b>Tonight</b><span>${esc(todayMoon.name)}<br/>${Math.round(todayMoon.illumination * 100)}% lit</span></figcaption>
        </figure>
      </div>
      <p class="sky-mod__line">${when}</p>
      <div class="sky-meter"><span style="width:${pct}%"></span></div>
      <p class="sky-meter__cap">${pct}% of the way back</p>
    </section>`;
}

/* ---------- 5. sun position ---------- */

function sunModuleHTML(p, s, nb, daysToReturn) {
  if (!nb) return "";
  const pct = Math.round(s.yearProgress * 100);
  const turning = nb.date.getFullYear() - p.year;

  return `
    <section class="sky-mod${nb.isToday ? " is-today" : ""}" data-return data-target="${nb.date.getTime()}">
      <p class="sky-label">Sun position</p>
      ${nb.isToday
        ? `<p class="sky-figure">Today<span>your solar return</span></p>
           <p class="sky-mod__line">
             Earth is back on the exact stretch of orbit where you began.
             Orbit <b>№ ${turning}</b> complete.
           </p>
           <button type="button" class="sky-btn" data-fete>Light the candles</button>`
        : `<p class="sky-figure">${num(daysToReturn)}<span>days to your return</span></p>
           <div class="sky-cd">
             <span><b data-cd="d">00</b>d</span>
             <span><b data-cd="h">00</b>h</span>
             <span><b data-cd="m">00</b>m</span>
             <span><b data-cd="s">00</b>s</span>
           </div>
           <p class="sky-mod__line">
             You turn <b>${turning}</b> on a <b>${esc(nb.weekday)}</b>, under a
             ${esc(nb.moon.name.toLowerCase())} at ${Math.round(nb.moon.illumination * 100)}% lit.
           </p>`}
      <div class="sky-meter"><span style="width:${pct}%"></span></div>
      <p class="sky-meter__cap">${pct}% round this lap &middot; ${s.degreesToReturn.toFixed(1)}&deg; to cover</p>
    </section>`;
}

/* ---------- 6. the count ---------- */

function countModuleHTML(odo, ms, now) {
  const rows = ms.map((m) => {
    const days = Math.ceil((m.date - now) / DAY);
    return `
      <li>
        <span class="sky-ms__label">${esc(m.label)}</span>
        <span class="sky-ms__when">${WEEKDAYS[m.date.getDay()].slice(0, 3)} ${m.date.getDate()} ${monthName(m.date.getMonth() + 1).slice(0, 3)} ${m.date.getFullYear()}</span>
        <span class="sky-ms__days">${days <= 0 ? "today" : `${num(days)}d`}</span>
      </li>`;
  }).join("");

  return `
    <section class="sky-mod">
      <p class="sky-label">The count</p>
      <p class="sky-figure">${num(odo.days)}<span>days lived, as of this morning</span></p>
      <ul class="sky-ms">${rows}</ul>
    </section>`;
}

/* ---------- 7. the sun today ----------
   The only module on this screen that is not computed here. Everything
   else follows from orbital mechanics and is therefore knowable years
   ahead: true, but not news. Solar activity is the opposite, and NOAA
   publishes it free, keyless and open to any origin. It is the one line
   on the page that nobody could have known yesterday, which is exactly
   what a page you are asked to open daily needs. */
export function spaceModuleHTML(w) {
  if (!w) return "";
  return `
    <section class="sky-mod">
      <p class="sky-label">The sun today</p>
      <p class="sky-figure">Kp ${w.kp.toFixed(1)}<span>geomagnetic activity, ${esc(w.state)}</span></p>
      <p class="sky-mod__line">${esc(w.line)}</p>
      <div class="sky-meter"><span style="width:${Math.min(100, (w.kp / 9) * 100).toFixed(0)}%"></span></div>
      <p class="sky-meter__cap">measured by NOAA, on a scale of 0 to 9</p>
    </section>`;
}

/* ---------- footer ---------- */

/*
   This used to restate that everything is computed locally and nothing
   leaves the browser. The measurement block two sections up already says
   where the numbers come from, and the landing page already makes the
   privacy promise once. Saying it a third time here read as a site trying
   to convince you of something, so the footer keeps only what the reader
   cannot work out for themselves: whether a birth time was given.
*/
function footHTML(p, astro) {
  return `
    <footer class="sky-foot">
      ${p.hasTime ? "" : `<p>No birth time was given for ${esc(p.first)}, so the chart is cast for noon. The moon and the fast aspects move a little either side of that.</p>`}
      <div class="sky-foot__row">
        <button type="button" class="sky-link" data-goto-archive>Open ${esc(p.first)}&rsquo;s archive</button>
        <button type="button" class="sky-link" data-astro>${astro ? "Hide the astrological reading" : "Add an astrological reading"}</button>
      </div>
    </footer>`;
}

/* ---------- helpers ---------- */

function cap(s) { return String(s).charAt(0).toUpperCase() + String(s).slice(1); }
function bare(s) { return String(s).replace(/^the /, ""); }

/** The one thing on this screen that has to tick. */
export function wireDailySky(root, { onCountdown, onShareCard } = {}) {
  const block = root.querySelector("[data-return][data-target]");
  if (block && onCountdown) onCountdown(block);
  wireCardExpanding(root, { onShareCard });
}

/**
 * Whether a click on a dialog landed on the backdrop rather than the card.
 *
 * Exported and pure because it is the only real decision here, and this
 * project has no DOM test environment: a rule left inside a listener is a
 * rule nothing checks. A native <dialog> reports backdrop clicks as
 * clicks on the dialog element itself, so the test is whether the point
 * falls outside the element's own box.
 */
export function clickIsOnBackdrop({ clientX, clientY }, rect) {
  /* a keyboard-driven click reports 0,0 and is never a backdrop click */
  if (!clientX && !clientY) return false;
  return clientX < rect.left || clientX > rect.right
      || clientY < rect.top || clientY > rect.bottom;
}

/*
   Expanding a card.

   Every dialog is already in the document, so this fetches nothing and
   renders nothing. That matters beyond speed: a popup that rebuilt its
   contents on open could hand back a different sentence for the same day,
   and a stable reading is the one promise this screen makes.

   One delegated listener on the section, so all nine cards cost a single
   handler and a re-render under it cannot leave a dead button behind.
*/
function wireCardExpanding(root, { onShareCard } = {}) {
  const section = root.querySelector(".sky-cards");
  if (!section || typeof HTMLDialogElement === "undefined") return;

  section.addEventListener("click", (e) => {
    /*
       Saving is handled before expanding, because the save button lives
       inside an already-open dialog and both listeners sit on the same
       section. Checking it first is what stops a save re-opening the
       dialog it was pressed in.
    */
    const share = e.target.closest("[data-share]");
    if (share) {
      onShareCard?.(share.dataset.share, share);
      return;
    }
    const open = e.target.closest("[data-expand]");
    if (!open) return;
    const dialog = section.querySelector(`[data-modal-for="${CSS.escape(open.dataset.expand)}"]`);
    dialog?.showModal();
  });

  /* click outside the card to close, which is what a popup is expected to do */
  for (const dialog of section.querySelectorAll(".sky-modal")) {
    dialog.addEventListener("click", (e) => {
      if (e.target === dialog && clickIsOnBackdrop(e, dialog.getBoundingClientRect())) {
        dialog.close();
      }
    });
  }
}

/*
   The clock field.

   Two numeric inputs behaving like one control: typing two digits into the
   hour jumps to the minute, backspace at the start of the minute jumps
   back, and the readout underneath says the time in words. That readout is
   doing real work — it is how the reader learns the field wants a 24-hour
   clock, without being told so in a line of instructions they would skip.
   Returns the value as "HH:MM", or null while it is incomplete.
*/
/**
 * The two-box clock, wired to whatever contains it.
 *
 * Split out of `wireClock` so the archive's optional birth-time field and
 * the Daily Sky's birth-time gate are the same control rather than two
 * implementations that drift. The scope needs `[data-unit="h"]`,
 * `[data-unit="m"]` and `[data-clock-read]`; everything else is optional.
 *
 * Returns nothing. `onChange` is called with "HH:MM" or null on every
 * keystroke, which is what lets a caller keep a hidden input in step
 * without this function knowing what a form is.
 */
export function wireClockFields(scope, { onChange, autofocus = false } = {}) {
  if (!scope) return;
  const hour = scope.querySelector('[data-unit="h"]');
  const min = scope.querySelector('[data-unit="m"]');
  const read = scope.querySelector("[data-clock-read]");
  if (!hour || !min || !read) return;

  const digits = (el) => el.value.replace(/\D/g, "").slice(0, 2);
  const valueOf = () => {
    const h = parseInt(digits(hour), 10);
    const m = parseInt(digits(min), 10);
    if (!Number.isInteger(h) || !Number.isInteger(m) || h > 23 || m > 59) return null;
    if (!digits(hour).length || !digits(min).length) return null;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  };

  const inWords = (h, m) => {
    const mm = String(m).padStart(2, "0");
    if (h === 0) return `12:${mm} at night`;
    if (h === 12) return `12:${mm} midday`;
    const half = h < 12 ? "in the morning" : h < 18 ? "in the afternoon" : "in the evening";
    return `${h % 12 || 12}:${mm} ${half}`;
  };

  const sync = () => {
    for (const el of [hour, min]) el.value = digits(el);
    const v = valueOf();
    if (v) {
      const [h, m] = v.split(":").map(Number);
      read.textContent = inWords(h, m);
      read.classList.add("is-set");
    } else {
      read.innerHTML = "&nbsp;";
      read.classList.remove("is-set");
    }
    onChange?.(v);
    return v;
  };

  hour.addEventListener("input", () => {
    if (digits(hour).length === 2) min.focus();
    sync();
  });
  min.addEventListener("input", sync);
  // backspace out of an empty minute field returns to the hour
  min.addEventListener("keydown", (e) => {
    if (e.key === "Backspace" && !min.value) { hour.focus(); hour.select(); }
  });
  // pad a lone digit on the way out, so "9" becomes "09"
  for (const el of [hour, min]) {
    el.addEventListener("blur", () => {
      if (el.value.length === 1) el.value = el.value.padStart(2, "0");
      sync();
    });
    el.addEventListener("focus", () => el.select());
  }

  sync();
  if (autofocus) hour.focus();
  return { sync, valueOf };
}

export function wireClock(root, { onValid } = {}) {
  const form = root.querySelector("[data-time-form]");
  if (!form) return;
  const hour = form.querySelector('[data-unit="h"]');
  const min = form.querySelector('[data-unit="m"]');
  const read = form.querySelector("[data-clock-read]");
  const save = form.querySelector("[data-clock-save]");

  const digits = (el) => el.value.replace(/\D/g, "").slice(0, 2);
  const valueOf = () => {
    const h = parseInt(digits(hour), 10);
    const m = parseInt(digits(min), 10);
    if (!Number.isInteger(h) || !Number.isInteger(m) || h > 23 || m > 59) return null;
    if (!digits(hour).length || !digits(min).length) return null;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  };

  const inWords = (h, m) => {
    const mm = String(m).padStart(2, "0");
    if (h === 0) return `12:${mm} at night`;
    if (h === 12) return `12:${mm} midday`;
    const half = h < 12 ? "in the morning" : h < 18 ? "in the afternoon" : "in the evening";
    return `${h % 12 || 12}:${mm} ${half}`;
  };

  const sync = () => {
    for (const el of [hour, min]) el.value = digits(el);
    const v = valueOf();
    if (v) {
      const [h, m] = v.split(":").map(Number);
      read.textContent = inWords(h, m);
      read.classList.add("is-set");
    } else {
      read.innerHTML = "&nbsp;";
      read.classList.remove("is-set");
    }
    save.disabled = !v;
    return v;
  };

  hour.addEventListener("input", () => {
    if (digits(hour).length === 2) min.focus();
    sync();
  });
  min.addEventListener("input", sync);
  // backspace out of an empty minute field returns to the hour
  min.addEventListener("keydown", (e) => {
    if (e.key === "Backspace" && !min.value) { hour.focus(); hour.select(); }
  });
  // pad a lone digit on the way out, so "9" becomes "09"
  for (const el of [hour, min]) {
    el.addEventListener("blur", () => {
      if (el.value.length === 1) el.value = el.value.padStart(2, "0");
      sync();
    });
    el.addEventListener("focus", () => el.select());
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const v = sync();
    if (v && onValid) onValid(v);
  });

  hour.focus();
}
