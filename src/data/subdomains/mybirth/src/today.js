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

   Five things, and five is the cap.
     1. The reading   — headline, paragraph, Do and Don't (see reading.js)
     2. The measurement — the arithmetic that produced the reading, shown
     3. Moon return   — tonight's phase against your birth phase
     4. Sun position  — where Earth is on the lap, and the countdown
     5. The count     — days lived, and the next round numbers with dates

   Everything is computed on the device, with no network at all.
   ============================================================ */

import {
  moonPhase, skyReturn, nextBirthday, milestones, cosmicOdometer,
  ordinal, prettyDate, monthName, chartAngles, signAt
} from "./astro.js";
import { dailyReading, aspectLabel } from "./reading.js";
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

  /*
     The birth moment in UTC. A local wall-clock time only becomes an
     instant once the birthplace's zone is known, and the Ascendant is
     wrong by fifteen degrees per hour if that step is skipped.
  */
  let birthDate;
  if (hasTime && tz) {
    birthDate = zonedToUTC(year, month, day, hh, mm, tz);
  } else {
    birthDate = new Date(Date.UTC(year, month - 1, day, hh, mm));
  }

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

/**
 * A wall-clock birth time in a named zone, as a real UTC instant.
 *
 * `Intl` will tell us what a given UTC instant looks like in a zone, but
 * not the reverse, so this guesses UTC, measures the error the formatter
 * reports, and corrects. One pass is enough except within an hour of a
 * daylight-saving change, which the second pass covers.
 */
function zonedToUTC(year, month, day, hh, mm, timeZone) {
  const target = Date.UTC(year, month - 1, day, hh, mm);
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
  if (onReading && reading.entry) onReading(reading.entry);
  const s = skyReturn(p.birthDate, now);
  const todayMoon = moonPhase(now);
  const odo = cosmicOdometer(p.birthDate, now);
  const nb = nextBirthday(p.month, p.day, now);
  const ms = milestones(p.birthDate, now, 4);

  const moonDays = Math.round(s.daysToMoonMatch);
  const daysToReturn = nb ? Math.max(0, Math.floor((nb.date - now) / DAY)) : null;

  return `
    <div class="sky">
      ${headHTML(p, profiles, now, theme)}
      ${readingHTML(reading, p)}
      ${measurementHTML(reading, astro)}

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

function readingHTML(r, p) {
  return `
    <section class="sky-read">
      <p class="sky-label">Your day at a glance${r.areaLabel ? ` &middot; ${esc(r.areaLabel)}` : ""}</p>
      <h1 class="sky-headline">${esc(r.headline)}</h1>
      <p class="sky-body">${esc(r.body)}</p>

      <div class="sky-dd">
        <div class="sky-dd__col">
          <p class="sky-dd__head">Do</p>
          <ul>${r.dos.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>
        </div>
        <div class="sky-dd__col">
          <p class="sky-dd__head">Don&rsquo;t</p>
          <ul>${r.donts.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>
        </div>
      </div>
    </section>`;
}

/* ---------- 2. the measurement ---------- */

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

/* ---------- 3. moon return ---------- */

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

/* ---------- 4. sun position ---------- */

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

/* ---------- 5. the count ---------- */

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

/* ---------- 6. the sun today ----------
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
export function wireDailySky(root, { onCountdown } = {}) {
  const block = root.querySelector("[data-return][data-target]");
  if (block && onCountdown) onCountdown(block);
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
