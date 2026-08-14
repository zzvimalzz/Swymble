/* ============================================================
   main.js — orchestration
   ============================================================ */

// style.css is linked from index.html <head>, not imported here: see the
// comment on that <link> for why a JS-injected stylesheet flashed
import QRCode from "qrcode";
import { createMoon } from "./moon.js";
import { createViewer } from "./viewer.js";
import {
  zodiacAnimalObject, gemstoneObject, constellationObject, flowerObject,
  prefetchModelAssets
} from "./models.js";
import { buildTicket } from "./ticket.js";
import { createFete } from "./fete.js";
import { buildCertificate } from "./certificate.js";
import {
  geocode, historicalWeather, onThisDay, yearEvents, countryFacts, searchPlaces,
  countryIndicators, spaceWeather, albumArt, filmPoster
} from "./apis.js";
import {
  moonPhase, zodiac, chineseZodiac, birthstone, birthFlower,
  weekday, monthName, prettyDate, ageInfo, lunarMonthsLived,
  generation, lifePath, cosmicOdometer, sunTimes, planetAges,
  planetLongitudes, nextBirthday, milestones, skyReturn, ordinal,
  zonedToUTC, zoneIsUncertain
} from "./astro.js";
import {
  movieOfYear, songOfYear, leaderAt, COUNTRIES, worldPopulationAt,
  leadersOf, leadersThatYear
} from "./data.js";
import { GEM_COLORS, ZODIAC_READINGS } from "./cosmos.js";
import { buildProfile, dailySkyHTML, wireDailySky, wireClock, spaceModuleHTML } from "./today.js";
import { signIcon } from "./glyphs.js";
// aliased: renderResult already has a local `track` for the leader timeline
// element, and an import cannot be shadowed quietly without this kind of bug
import { initAnalytics, track as trackEvent, watchCompletion, EVENTS } from "./analytics.js";
import { valueOf, mark, scopeNote, wireProvenance } from "./provenance.js";

// inert unless a provider is configured; see the header of analytics.js
initAnalytics();
// one delegated listener for every provenance marker the page ever renders
wireProvenance();

/* ---------- starfield ---------- */
(function starfield() {
  const canvas = document.getElementById("starfield");
  const ctx = canvas.getContext("2d");
  let stars = [], shooting = null, w, h, dpr, t = 0, scrollY = 0;
  const FIELD = 2.4;            // screen-heights the star field spans
  const PARALLAX = 0.14;        // how far the field travels per pixel scrolled

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = canvas.width = innerWidth * dpr;
    h = canvas.height = innerHeight * dpr;
    canvas.style.width = innerWidth + "px";
    canvas.style.height = innerHeight + "px";
    /*
       Stars are laid out over 2.4 screen-heights and each carries a depth.
       On scroll they shift by an amount proportional to that depth and wrap,
       so the field separates into layers that slide past each other instead
       of sitting flat behind the page. Ported from ORBIT.
    */
    const count = Math.round((innerWidth * innerHeight) / 6500);
    stars = Array.from({ length: count }, () => {
      const depth = Math.random();
      return {
        x: Math.random() * w,
        y: Math.random() * h * FIELD,
        r: (0.25 + Math.random() * 1.25 * (0.4 + depth)) * dpr,
        tw: Math.random() * Math.PI * 2,
        sp: Math.random() * 0.9 + 0.2,
        depth,
        hue: Math.random() < 0.15 ? 250 : (Math.random() < 0.5 ? 45 : 220)
      };
    });
  }

  function maybeShoot() {
    if (shooting || Math.random() > 0.004) return;
    const fromTop = Math.random() < 0.5;
    shooting = {
      x: Math.random() * w,
      y: fromTop ? -20 : Math.random() * h * 0.5,
      vx: (Math.random() * 6 + 5) * dpr * (Math.random() < 0.5 ? -1 : 1),
      vy: (Math.random() * 5 + 4) * dpr,
      life: 1
    };
  }

  function frame() {
    t += 0.016;
    ctx.clearRect(0, 0, w, h);
    const span = h * FIELD;
    const off = scrollY * dpr * PARALLAX;
    for (const s of stars) {
      // deeper stars drift less, and the column wraps so it never runs out
      const y = (((s.y - off * (0.25 + s.depth * 0.9)) % span) + span) % span - h * 0.6;
      if (y < -8 || y > h + 8) continue;
      const a = 0.35 + Math.sin(t * s.sp + s.tw) * 0.35;
      ctx.beginPath();
      ctx.arc(s.x, y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${s.hue}, 70%, 88%, ${Math.max(0.05, a)})`;
      ctx.fill();
      // the brightest few get a soft bloom, which is what sells the depth
      if (s.r > 1.3 * dpr) {
        ctx.beginPath();
        ctx.arc(s.x, y, s.r * 3.2, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${s.hue}, 70%, 88%, ${Math.max(0.02, a * 0.07)})`;
        ctx.fill();
      }
    }
    maybeShoot();
    if (shooting) {
      const sX = shooting.x, sY = shooting.y;
      const g = ctx.createLinearGradient(sX, sY, sX - shooting.vx * 4, sY - shooting.vy * 4);
      g.addColorStop(0, "rgba(255,250,235,0.9)");
      g.addColorStop(1, "rgba(255,250,235,0)");
      ctx.strokeStyle = g;
      ctx.lineWidth = 1.6 * dpr;
      ctx.beginPath();
      ctx.moveTo(sX, sY);
      ctx.lineTo(sX - shooting.vx * 4, sY - shooting.vy * 4);
      ctx.stroke();
      shooting.x += shooting.vx;
      shooting.y += shooting.vy;
      shooting.life -= 0.012;
      if (shooting.life <= 0 || shooting.y > h || shooting.x < -50 || shooting.x > w + 50) shooting = null;
    }
    requestAnimationFrame(frame);
  }

  addEventListener("scroll", () => { scrollY = window.scrollY; }, { passive: true });
  addEventListener("resize", resize);
  resize();
  frame();
})();

/* ---------- parallax on aurora glows ---------- */
addEventListener("pointermove", (e) => {
  const cx = (e.clientX / innerWidth - 0.5);
  const cy = (e.clientY / innerHeight - 0.5);
  document.querySelectorAll(".glow").forEach((g, i) => {
    const d = (i + 1) * 14;
    g.style.translate = `${cx * d}px ${cy * d}px`;
  });
});

/* ---------- the month field ---------- */
/** Set by initMonthField so the deep-link path can fill the month control. */
let setMonthField = () => {};

/*
   A combobox rather than a native <select>, so it matches the birthplace
   field beside it: same typing, same list, same keys. A native select on a
   dark page also renders in the platform's own chrome, which was the one
   control on the form that didn't belong to the design.
*/
(function initMonthField() {
  const input = document.getElementById("f-month-text");
  const hidden = document.getElementById("f-month");
  const list = document.getElementById("month-results");
  const field = document.getElementById("month-field");
  if (!input || !list) return;

  const MONTHS = Array.from({ length: 12 }, (_, i) => ({ n: i + 1, name: monthName(i + 1) }));
  let items = MONTHS, active = -1;

  const close = () => {
    list.hidden = true;
    input.setAttribute("aria-expanded", "false");
    active = -1;
  };
  const paint = () => {
    list.innerHTML = items.map((m, i) => `
      <li role="option" aria-selected="${i === active}"
          class="placelist__item${i === active ? " is-active" : ""}" data-i="${i}">
        <span class="placelist__name">${m.name}</span>
      </li>`).join("");
    list.hidden = !items.length;
    input.setAttribute("aria-expanded", String(!!items.length));
  };
  const choose = (m) => {
    hidden.value = m.n;
    input.value = m.name;
    field.classList.add("is-resolved");
    close();
  };
  const filter = (q) => {
    const s = q.trim().toLowerCase();
    items = s ? MONTHS.filter((m) => m.name.toLowerCase().startsWith(s)) : MONTHS;
    active = -1;
    paint();
  };

  input.addEventListener("focus", () => filter(""));
  input.addEventListener("input", () => {
    hidden.value = "";
    field.classList.remove("is-resolved");
    filter(input.value);
  });
  input.addEventListener("keydown", (e) => {
    if (list.hidden || !items.length) return;
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      active = (active + (e.key === "ArrowDown" ? 1 : -1) + items.length) % items.length;
      paint();
    } else if (e.key === "Enter" && active >= 0) {
      e.preventDefault();
      choose(items[active]);
    } else if (e.key === "Escape") {
      close();
    }
  });
  list.addEventListener("mousedown", (e) => {
    const li = e.target.closest("[data-i]");
    if (li) { e.preventDefault(); choose(items[+li.dataset.i]); }
  });
  input.addEventListener("blur", () => setTimeout(() => {
    // a typed-but-unpicked month still resolves, rather than silently failing
    if (!hidden.value) {
      const m = MONTHS.find((x) => x.name.toLowerCase().startsWith(input.value.trim().toLowerCase()));
      if (m && input.value.trim()) choose(m);
    }
    close();
  }, 120));

  // deep links call this to fill both halves of the control at once
  setMonthField = (n) => {
    const m = MONTHS.find((x) => x.n === Number(n));
    if (m) choose(m);
  };
})();

/* ---------- reveal observer + scroll meridian ---------- */
const revealObserver = new IntersectionObserver(
  (entries) => entries.forEach((en) => { if (en.isIntersecting) en.target.classList.add("in"); }),
  { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
);
function observeReveals(root = document) {
  root.querySelectorAll("[data-reveal]:not(.in)").forEach((el) => revealObserver.observe(el));
}
observeReveals();

const meridian = document.getElementById("meridian-fill");
addEventListener("scroll", () => {
  const max = document.body.scrollHeight - innerHeight;
  const pct = max > 0 ? (scrollY / max) * 100 : 0;
  meridian.style.height = pct + "%";
}, { passive: true });

/* ---------- the moon (shared instance, mounted into the result) ---------- */
const moon = createMoon();

/* ---------- optional fields toggle ---------- */
const toggle = document.getElementById("toggle-optional");
const optional = document.getElementById("optional-fields");
toggle.addEventListener("click", () => {
  const open = toggle.getAttribute("aria-expanded") === "true";
  toggle.setAttribute("aria-expanded", String(!open));
  optional.classList.toggle("is-open", !open);
  // keep the collapsed fields out of the tab order
  if (open) optional.setAttribute("inert", "");
  else optional.removeAttribute("inert");
});

/* ---------- form submit ---------- */
const form = document.getElementById("birth-form");
const errorEl = document.getElementById("form-error");
const veil = document.getElementById("veil");
const veilText = document.getElementById("veil-text");
const intro = document.getElementById("intro");
const result = document.getElementById("result");

const VEIL_LINES = [
  "Aligning the heavens…",
  "Winding the clock backwards…",
  "Reading the moon's diary…",
  "Recovering the weather…",
  "Pulling the day's headlines…",
  "Printing your boarding pass…"
];

form.addEventListener("submit", (e) => {
  e.preventDefault();
  errorEl.hidden = true;

  const data = new FormData(form);
  const inputs = {
    name: (data.get("name") || "").toString().trim(),
    day: parseInt(data.get("day"), 10),
    month: parseInt(data.get("month"), 10),
    year: parseInt(data.get("year"), 10),
    placeLabel: (data.get("place") || "").toString().trim(),
    // only set when the visitor actually picked from the list
    place: selectedPlace,
    time: (data.get("time") || "").toString()
  };

  const err = validate(inputs);
  if (err) {
    errorEl.textContent = err;
    errorEl.hidden = false;
    return;
  }
  trackEvent(EVENTS.ARCHIVE_START, { entry: "form" });
  runGeneration(inputs);
});

/** Encode a person's inputs into a revisitable URL (drives the QR code). */
function buildShareURL(i) {
  const p = new URLSearchParams();
  p.set("n", i.name); p.set("d", i.day); p.set("m", i.month); p.set("y", i.year);
  p.set("p", i.placeLabel || i.country || "");
  // carrying the resolved fix means a shared link never has to geocode again
  if (i.place) {
    p.set("la", i.place.lat.toFixed(4));
    p.set("lo", i.place.lon.toFixed(4));
    if (i.place.timezone) p.set("tz", i.place.timezone);
    if (i.place.countryCode) p.set("cc", i.place.countryCode);
  }
  if (i.time) p.set("t", i.time);
  return `${location.origin}${location.pathname}?${p.toString()}`;
}

/**
 * Recover a day.
 *
 * `reveal` is false when the archive is being rebuilt behind another tab —
 * a reload of a shared link by somebody who was last reading Today. The
 * result is still built, so the Archive tab has it ready the moment it is
 * asked for, but it does so without the veil, without stealing the scroll
 * and without yanking the visitor off the tab they were on.
 */
async function runGeneration(inputs, { reveal = true } = {}) {
  const startedAt = performance.now();
  const { name, day, month, year, time, placeLabel } = inputs;
  const shareURL = buildShareURL(inputs);
  lastShareURL = shareURL;
  // the address bar only carries the day while the archive is the thing on
  // screen; rememberTab parks and restores it as the visitor moves about
  if (reveal) { try { history.replaceState(null, "", shareURL + location.hash); } catch {} }

  // start pulling the 3D assets while the veil is up
  prefetchModelAssets();

  // show veil + rotate lines
  let lineTimer = 0;
  if (reveal) {
    await showVeil("archive");
    let li = 0;
    veilText.textContent = VEIL_LINES[0];
    lineTimer = setInterval(() => {
      li = (li + 1) % VEIL_LINES.length;
      veilText.textContent = VEIL_LINES[li];
    }, 900);
  }

  /*
     The birthplace has to be known before the sky can be, because a wall
     clock is not a moment until you know which clock it was. Picking from
     the suggestions carries the zone already. Free text typed straight past
     the list does not, so we spend the veil's own dwell time asking for it,
     capped: a slow geocoder delays the reveal by at most a fraction of a
     second, and a dead one falls through to reading the clock as UTC.
  */
  let place = inputs.place;
  if (!place && placeLabel) {
    place = await Promise.race([
      geocode(placeLabel).catch(() => null),
      new Promise((r) => setTimeout(() => r(null), MAX_ZONE_WAIT_MS)),
    ]);
  }
  const country = place?.country || inputs.country || "";
  const city = place?.name || "";
  const state = place?.admin1 || "";

  /*
     Two different things, and conflating them was a real bug.

     `birthDate` is an *instant*: the wall clock the visitor typed, resolved
     through the birthplace's zone. Everything astronomical wants this, and
     this file used to skip the resolution and read the clock as UTC, which
     put the moon out by up to seven degrees and made the archive disagree
     with the Today tab about the same person.

     `birthNoon` is a *calendar day*, parked at midday UTC. The weekday and
     the sunrise want this instead: a birth at 08:00 in Auckland is a real
     instant on the previous UTC date, and asking the instant what day of the
     week it was would answer Sunday for a Monday baby.

     No time given still means midday, which centres the error rather than
     leaning it against midnight.
  */
  let hh = 12, mm = 0;
  if (time && /^\d{1,2}:\d{2}/.test(time)) { [hh, mm] = time.split(":").map(Number); }
  const birthNoon = new Date(Date.UTC(year, month - 1, day, 12));
  const birthDate = zonedToUTC(year, month, day, hh, mm, place?.timezone || "");
  const today = new Date();

  // ---- compute deterministic ----
  const moonData = moonPhase(birthDate);
  const zod = zodiac(month, day);
  const cz = chineseZodiac(year, month, day);
  const stone = birthstone(month);
  const flower = birthFlower(month);
  const dow = weekday(birthNoon);
  const age = ageInfo(day, month, year, today);
  const fullMoons = lunarMonthsLived(birthDate, today);
  const gen = generation(year);
  const lp = lifePath(day, month, year);
  const odo = cosmicOdometer(birthDate, today);
  const planets = planetAges(odo.orbits);
  const population = worldPopulationAt(year);
  // the returnability set: where the sky was, what's next, and when you come back
  const skyThen = planetLongitudes(birthDate);
  const nextReturn = nextBirthday(month, day, today);
  const nextMilestones = milestones(birthDate, today, 6);
  const returning = skyReturn(birthDate, today);

  const movie = movieOfYear(year);
  const song = songOfYear(year);

  /*
     Everything above needs no network at all, so the page is painted from it
     immediately. The veil used to stay up until Open-Meteo and Wikipedia had
     both answered, which meant a slow archive — or no connection — held the
     whole reveal hostage. Now the computed day appears at once and the fetched
     material arrives into its own slots afterwards.
  */
  const payload = {
    name, day, month, year, country, city, state, time,
    birthDate, birthNoon, today, moon: moonData, zod, cz, stone, flower, dow, age, fullMoons,
    gen, lp, odo, planets, population, movie, song, shareURL,
    skyThen, nextReturn, nextMilestones, returning,
    placeLabel,
    // a picked suggestion already carries a fix, so the sun is exact from frame one
    geo: place || null,
    sun: place ? sunTimes(place.lat, place.lon, birthNoon, place.timezone) : null,
    weather: null, yearNews: null, otd: null,
    leader: place ? leaderAt(place.countryCode, year) : null,
    homeland: null, pending: true
  };

  clearInterval(lineTimer);
  // hold the veil only long enough to register as a curtain, never for the network
  if (reveal) {
    await new Promise((r) => setTimeout(r, Math.max(0, MIN_VEIL_MS - (performance.now() - startedAt))));
  }

  renderResult(payload);

  intro.style.display = "none";
  result.hidden = false;
  if (reveal) {
    hideVeil();
    scrollTo({ top: 0, behavior: "auto" });
  } else {
    // built off-stage: the address bar still describes the tab in front,
    // and only names the day again if the visitor asks for the archive
    rememberTab(currentTab());
  }

  enhance(payload);
}

/** How long the loading veil is held, at minimum, before the reveal. */
const MIN_VEIL_MS = 420;
/** How long we will wait on a geocoder for a birthplace's time zone. */
const MAX_ZONE_WAIT_MS = 1200;

/*
   The veil comes in two worlds, because the site does.

   The archive's is deep space: an orrery turning in the dark, which is the
   thing the visitor is about to be shown. The Daily Sky's is paper, because
   arriving there behind a black screen and then being handed a cream card
   is a jolt, and a loading screen exists precisely to avoid one. Same
   markup, same rhythm, different ground.
*/
const VEIL_COPY = {
  archive: ["Recovering your day", "Aligning the heavens…"],
  sky: ["Turning to today", "Reading the sky…"],
};

function dressVeil(world) {
  const sky = world === "sky";
  veil.classList.toggle("veil--sky", sky);
  veil.classList.toggle("is-dark", sky && skyTheme() === "dark");
  const [eyebrow, line] = VEIL_COPY[sky ? "sky" : "archive"];
  const eb = document.getElementById("veil-eyebrow");
  if (eb) eb.textContent = eyebrow;
  veilText.textContent = line;
  // the real element is on stage now, so the CSS-only boot curtain stands down
  document.documentElement.removeAttribute("data-boot");
  document.documentElement.removeAttribute("data-boot-dark");
}

function showVeil(world = "archive") {
  dressVeil(world);
  veil.classList.remove("is-leaving");
  veil.hidden = false;
  // let the browser paint the veil before whatever comes next blocks the
  // main thread, or the curtain goes up after the show has already started
  return new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
}

function hideVeil() {
  // fade out rather than cut, then stand down once the transition has run
  veil.classList.add("is-leaving");
  setTimeout(() => {
    veil.hidden = true;
    veil.classList.remove("is-leaving", "veil--sky", "is-dark");
  }, VEIL_FADE_MS);
}

/**
 * Hand the boot curtain over to the real veil and take it down.
 *
 * The curtain is pure CSS driven by an attribute the inline script writes,
 * so it cannot fade itself out. Showing the element underneath first means
 * the visitor sees one continuous screen dissolve rather than a cut.
 */
function dropBootVeil(world) {
  if (!document.documentElement.hasAttribute("data-boot")) return;
  dressVeil(world);
  veil.hidden = false;
  hideVeil();
}

const VEIL_FADE_MS = 420;

/**
 * The progressive half: fetch what needs the network, then fill the waiting
 * slots. Every step fails soft — a section that never resolves keeps its
 * "still listening" state instead of breaking the page.
 */
async function enhance(d) {
  const iso = `${d.year}-${String(d.month).padStart(2, "0")}-${String(d.day).padStart(2, "0")}`;
  const placeQuery = d.placeLabel || [d.city, d.state, d.country].filter(Boolean).join(", ");

  const otdP = onThisDay(d.month, d.day).catch(() => null);
  const yearP = yearEvents(d.year).catch(() => null);

  // if the visitor picked a suggestion we already have the fix; only free text
  // typed straight past the list still needs resolving
  const geoP = (d.geo
    ? Promise.resolve(d.geo)
    : placeQuery
      ? geocode(placeQuery)
          .then((g) => g || (d.city && d.country ? geocode(`${d.city}, ${d.country}`) : null))
          .then((g) => g || (d.country ? geocode(d.country) : null))
      : Promise.resolve(null)
  ).catch(() => null);

  // place-dependent material, hydrated as one group once we know where "there" is
  geoP.then(async (geo) => {
    d.geo = geo;
    if (geo) {
      d.sun = sunTimes(geo.lat, geo.lon, d.birthNoon, geo.timezone);
      d.leader = leaderAt(geo.countryCode, d.year);
    }
    hydrate(d, ["weather", "leader", "homeland"], { weatherPending: !!geo });

    const [weather, homeland, indicators] = await Promise.all([
      geo ? historicalWeather(geo.lat, geo.lon, iso).catch(() => null) : Promise.resolve(null),
      countryFacts(geo?.countryCode, geo?.country || d.country).catch(() => null),
      countryIndicators(geo?.countryCode, d.year).catch(() => null)
    ]);
    d.weather = weather;
    d.homeland = homeland;
    d.indicators = indicators;
    // a centroid from the bundled place table has no zone, so the sun was
    // read off the longitude; the archive just told us the real one
    if (geo && !geo.timezone && weather?.timezone) {
      geo.timezone = weather.timezone;
      d.sun = sunTimes(geo.lat, geo.lon, d.birthNoon, weather.timezone);
    }
    hydrate(d, ["weather", "homeland"]);
    refreshKeepsakes(d);
    /*
       The save was written when the page painted, which is before a
       free-typed birthplace has a fix. Without this the coordinates and the
       zone never reached it, and the Daily Sky — which recomputes from the
       save rather than from the page — had no Ascendant and so no reading.
    */
    if (geo) persistSave(d);
  });

  otdP.then((otd) => { d.otd = otd; hydrate(d, ["people"]); });
  yearP.then((yn) => { d.yearNews = yn; hydrate(d, ["news"]); });
}

/** The sections that arrive over the network, keyed by slot id. */
const ASYNC_SECTIONS = {
  weather: (d) => renderWeather(d, placeLabelFor(d)),
  news: (d) => renderYearNews(d),
  people: (d) => renderBirthdayPeople(d),
  leader: (d) => renderLeader(d),
  homeland: (d) => renderHomeland(d),
};

/** A quiet holding state — never a spinner, never a wall of skeletons. */
function slotHTML(key, d) {
  return `<div class="async-slot" data-slot="${key}">${
    d.pending ? "" : ASYNC_SECTIONS[key](d)
  }</div>`;
}

/** Swap freshly-arrived sections into their slots and wake their animations. */
function hydrate(d, keys, opts = {}) {
  for (const key of keys) {
    const slot = result.querySelector(`[data-slot="${key}"]`);
    if (!slot) continue;
    // while the place is known but its weather isn't, leave the slot alone
    if (key === "weather" && opts.weatherPending && !d.weather) continue;
    const html = ASYNC_SECTIONS[key]({ ...d, pending: false });
    if (slot.innerHTML.trim() === (html || "").trim()) continue;
    slot.innerHTML = html;
    observeReveals(slot);
    animateCounts(slot);
    wireTempDial(slot);
  }
  const track = document.getElementById("leader-track");
  const chip = track?.querySelector("[data-active]");
  if (track && chip) track.scrollLeft = chip.offsetLeft - track.clientWidth / 2 + chip.clientWidth / 2;

  // the rail is built from the chapters present at the time; sections that
  // arrive over the network need it rebuilt or they never get a mark
  buildChapterRail();
}

function placeLabelFor(d) {
  return [d.city, d.state, d.geo?.country || d.country].filter(Boolean).join(", ")
    || "an unrecorded corner of Earth";
}

/*
   Name, date and birthplace. Free text is accepted rather than rejected: if the
   visitor typed straight past the suggestion list we resolve it afterwards,
   instead of throwing them back to the field, which was the old failure mode.
*/
function validate({ name, day, month, year, placeLabel }) {
  if (!placeLabel || placeLabel.trim().length < 2) {
    if (name && day && month && year) return "Tell us where you were born. A town, a state or a country all work.";
  }
  if (!name) return "We need a name to address the ticket to.";
  if (!day || day < 1 || day > 31) return "That day doesn't look right (1 to 31).";
  if (!month || month < 1 || month > 12) return "Please choose a month.";
  if (!year || year < 1900 || year > 2026) return "Please enter a year between 1900 and 2026.";
  const test = new Date(Date.UTC(year, month - 1, day));
  if (test.getUTCMonth() !== month - 1) return "That date doesn't exist on the calendar.";
  if (!placeLabel || placeLabel.trim().length < 2) {
    return "Tell us where you were born. A town, a state or a country all work.";
  }
  return null;
}

/** Resolve free text to a known country: exact, then prefix, then contains. */
function resolveCountry(input) {
  const q = (input || "").trim().toLowerCase();
  if (!q) return "";
  return COUNTRIES.find((c) => c.toLowerCase() === q)
    || COUNTRIES.find((c) => c.toLowerCase().startsWith(q))
    || COUNTRIES.find((c) => c.toLowerCase().includes(q))
    || input.trim();
}

/* ---------- birthplace combobox ---------- */
/*
   Backed by Open-Meteo's geocoder rather than a bundled list, so every town,
   state and country on Earth is reachable and always current. Picking a
   suggestion carries exact coordinates and an IANA timezone straight into the
   engine, which removes the geocoding round trip and makes sunrise and the
   historical weather correct rather than approximate.
*/
function initPlaceField() {
  const input = document.getElementById("f-place");
  const list = document.getElementById("place-results");
  const spin = document.getElementById("place-spin");
  const field = document.getElementById("place-field");
  if (!input || !list) return;

  let items = [];
  let active = -1;
  let seq = 0;
  let timer = 0;

  const close = () => {
    list.hidden = true;
    list.innerHTML = "";
    input.setAttribute("aria-expanded", "false");
    active = -1;
  };

  const choose = (place) => {
    selectedPlace = place;
    input.value = place.label;
    field.classList.add("is-resolved");
    close();
  };

  const paint = () => {
    list.innerHTML = items.map((p, i) => `
      <li role="option" id="place-opt-${i}" aria-selected="${i === active}"
          class="placelist__item${i === active ? " is-active" : ""}" data-i="${i}">
        <span class="placelist__name">${esc(p.name)}</span>
        <span class="placelist__where">${esc(
          p.kind === "country" ? "Country"
            : p.kind === "region" ? `State or region, ${p.country}`
            : [p.admin1, p.country].filter(Boolean).join(", ")
        )}</span>
      </li>`).join("");
    list.hidden = !items.length;
    input.setAttribute("aria-expanded", String(!!items.length));
  };

  /*
     Two sources, deliberately. The live geocoder is a city database, so
     searching it alone for "Texas" or "Bavaria" returns villages of that name
     instead of the state. The bundled country/region table answers those, and
     is merged in front; towns still come from the network. The table is
     imported on demand so it costs nothing until someone starts typing.
  */
  let regionsModule = null;
  const localMatches = async (q) => {
    try {
      regionsModule ||= await import("./places.js");
      return regionsModule.searchRegions(q, 4);
    } catch {
      return [];
    }
  };

  const search = async (q) => {
    const mine = ++seq;
    spin.hidden = false;
    const [local, remote] = await Promise.all([localMatches(q), searchPlaces(q, 8)]);
    if (mine !== seq) return;                 // a later keystroke already won
    spin.hidden = true;

    const seen = new Set();
    items = [...local, ...remote].filter((p) => {
      const key = p.label.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).slice(0, 8);

    active = -1;
    paint();
  };

  input.addEventListener("input", () => {
    selectedPlace = null;
    field.classList.remove("is-resolved");
    clearTimeout(timer);
    const q = input.value.trim();
    if (q.length < 2) { close(); spin.hidden = true; return; }
    timer = setTimeout(() => search(q), 220);  // debounce, one request per pause
  });

  input.addEventListener("keydown", (e) => {
    if (list.hidden || !items.length) return;
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      active = (active + (e.key === "ArrowDown" ? 1 : -1) + items.length) % items.length;
      paint();
      input.setAttribute("aria-activedescendant", `place-opt-${active}`);
    } else if (e.key === "Enter" && active >= 0) {
      e.preventDefault();
      choose(items[active]);
    } else if (e.key === "Escape") {
      close();
    }
  });

  list.addEventListener("mousedown", (e) => {
    const li = e.target.closest("[data-i]");
    if (li) { e.preventDefault(); choose(items[+li.dataset.i]); }
  });

  input.addEventListener("blur", () => setTimeout(close, 120));
}

/** The birthplace the visitor picked from the suggestions, if they picked one. */
let selectedPlace = null;

/* ============================================================
   RENDER
   ============================================================ */
function renderResult(d) {
  const placeLabel = placeLabelFor(d);
  d._keepsakeLabel = placeLabel;
  const longDate = prettyDate(d.day, d.month, d.year);
  // curated tables arrive as facts; the value is unwrapped here and the
  // source is rendered from the fact itself, next to the figure it explains
  const song = valueOf(d.song);
  const movie = valueOf(d.movie);

  result.innerHTML = `
    <div class="wrap">

      <!-- HERO -->
      <header class="block r-hero r-hero--centred">
        <p class="r-hero__hello" data-reveal>Hello, <em>${esc(d.name)}</em></p>
        <h1 class="r-hero__date" data-reveal>${esc(ordinal(d.day))} ${esc(monthName(d.month))} <em>${d.year}</em></h1>
        <p class="r-hero__line" data-reveal>
          A <b>${esc(d.dow)}</b>, the ${esc(ordinal(dayOfYear(d.month, d.day)))} day of ${d.year},
          under a <b>${esc(d.moon.name.toLowerCase())}</b>${placeLabel ? `, over ${esc(placeLabel)}` : ""}.
        </p>
        ${Number.isFinite(d.age.age) ? `<p class="r-hero__orbit" data-reveal>currently riding orbit no. ${d.age.age + 1}</p>` : ""}
        <span class="scroll-cue" data-reveal>Scroll to begin<span></span></span>
      </header>

      <!-- MOON -->
      <section class="block moon-section">
        <p class="kicker" data-reveal>The sky overhead</p>
        <h2 class="h-section" data-reveal>The moon held a <em>${esc(d.moon.name.toLowerCase())}</em><br/>the night you began.</h2>
        <div class="moon-block mt-l">
          <div class="moon-stage" data-reveal>
            <div class="moon-stage__ring"></div>
            <div id="result-moon" style="position:absolute;inset:0;"></div>
          </div>
          <div class="moon-facts" data-reveal>
            <p class="moon-phase-name">
              ${esc(d.moon.name)} <em>&middot; ${(d.moon.illumination * 100).toFixed(1)}% lit</em>
            </p>
            <p class="moon-reading">
              ${d.moon.age.toFixed(1)} days into its cycle, and
              ${d.moon.waxing ? "gathering light" : "giving light back"}.
            </p>
            <dl class="facts">
              <div class="fact"><dt>Phase</dt><dd>${esc(d.moon.name)}</dd></div>
              <div class="fact"><dt>Direction</dt><dd>${d.moon.waxing ? "Waxing" : "Waning"}</dd></div>
              <div class="fact"><dt>Moons since</dt><dd data-count="${d.fullMoons}">0<small>full cycles lived</small></dd></div>
            </dl>
          </div>
        </div>
      </section>

      <!-- YOU / SIGNS: four objects from the almanac, in 3D -->
      <section class="block">
        <p class="kicker" data-reveal>Written in the calendar</p>
        <h2 class="h-section" data-reveal>What the date <em>says about you.</em></h2>
        <div class="plates mt-l">
          ${plateHTML("stage-sign", "Star sign", `${signIcon(d.zod.sign, { size: "1.05em", cls: "inline-glyph" })} ${esc(d.zod.sign)}`, `${esc(d.zod.element)} sign · its constellation, charted`)}
          ${plateHTML("stage-stone", "Birthstone", esc(d.stone), `${esc(monthName(d.month))}'s stone · cut &amp; lit in 3D`)}
          ${plateHTML("stage-animal", "Chinese zodiac", esc(d.cz.animal), `${esc(d.cz.label)} · the lunar year's animal`)}
          ${plateHTML("stage-flower", "Birth flower", esc(d.flower), `${esc(monthName(d.month))}'s bloom`)}
        </div>
      </section>

      ${renderNumberEra(d)}

      ${renderAstrology(d)}

      ${renderSkyThen(d)}

      ${renderOdometer(d)}

      ${renderMilestones(d)}

      ${renderReturn(d)}

      ${renderCosmosWide(d)}

      ${slotHTML("weather", d)}

      ${slotHTML("homeland", d)}

      <!-- SOUND & SCREEN -->
      <section class="block">
        <p class="kicker" data-reveal>In the air &amp; on the screen</p>
        <h2 class="h-section" data-reveal>The soundtrack &amp; spectacle<br/>of <em>${d.year}.</em></h2>
        <div class="media mt-l" data-reveal>
          <div class="media__item" style="--glow:rgba(154,127,240,0.18)">
            <div class="media__art" data-art="song" aria-hidden="true"></div>
            <!--
              The chart names itself, and it does so from the fact rather
              than from a hand-written line here: an unlabelled "defining
              song" shown to someone born in Manila or Lagos is a claim
              about their year we have not earned.
            -->
            <p class="media__type">The #1 that year ${scopeNote(d.song)} ${d.song ? mark(d.song) : ""}</p>
            ${song
              ? `<h3 class="media__title">${esc(song.split(" | ")[0])}</h3>
                 <p class="media__by">${esc(song.split(" | ")[1] || "")}</p>
                 ${musicLinks(song)}`
              : `<h3 class="media__title">Off the charts</h3><p class="media__by">Our archive doesn't reach ${d.year} yet.</p>`}
          </div>
          <div class="media__item" style="--glow:rgba(236,217,172,0.16)">
            <div class="media__art media__art--poster" data-art="film" aria-hidden="true"></div>
            <p class="media__type">The film of the year ${d.movie ? mark(d.movie) : ""}</p>
            <!--
              "Topped the box office" was a specific factual claim, and the
              table does not support it: it runs highest-grossing most years
              but picks the defining release in others, so 1968 reads 2001: A
              Space Odyssey where the receipts say Funny Girl.
            -->
            ${movie
              ? `<h3 class="media__title">${esc(movie)}</h3><p class="media__by">the year's defining release</p>`
              : `<h3 class="media__title">The reel's still rolling</h3><p class="media__by">No film logged for ${d.year} yet.</p>`}
          </div>
        </div>
      </section>

      ${slotHTML("news", d)}

      ${slotHTML("people", d)}

      ${slotHTML("leader", d)}

      <!-- TICKET -->
      <section class="block ticket-block">
        <p class="kicker center" data-reveal style="justify-content:center">One for the road ahead</p>
        <h2 class="h-section center" data-reveal style="text-align:center">Your boarding pass<br/>to <em>everything next.</em></h2>
        <p class="sub center" data-reveal style="margin:0 auto 50px;text-align:center">
          We've stamped a one-of-a-kind ticket, issued from the day you landed, bound for the future.
        </p>
        <div id="ticket-mount" data-reveal></div>
        <div class="ticket-actions" data-reveal>
          <button class="btn-ghost" id="save-ticket">Save ticket</button>
        </div>
      </section>

      <!-- CERTIFICATE -->
      <section class="block cert-block">
        <p class="kicker center" data-reveal style="justify-content:center">A keepsake to print</p>
        <h2 class="h-section center" data-reveal style="text-align:center">Your <em>Certificate of Birth.</em></h2>
        <p class="sub center" data-reveal style="margin:0 auto 40px;text-align:center">
          One card. Click it to turn it over. The back holds your day's details and a QR code
          that brings anyone straight back to this page.
        </p>
        <div class="cert-controls" data-reveal>
          <div class="cert-sizes" role="group" aria-label="Certificate size">
            <span class="cert-controls__label">Size</span>
            <button type="button" data-size="a4" class="is-active">A4</button>
            <button type="button" data-size="letter">Letter</button>
            <button type="button" data-size="card">Card</button>
          </div>
          <button type="button" class="cert-flip-btn" id="cert-flip-btn">Turn it over</button>
        </div>
        <div id="cert-view" data-reveal></div>
        <div class="ticket-actions" data-reveal>
          <button class="btn-ghost" id="save-cert-png">Save as image</button>
          <button class="btn-ghost" id="save-cert">Save as PDF</button>
          <button class="btn-ghost" id="copy-link">Copy my link</button>
          <button class="btn-ghost" id="restart">Recover another day</button>
        </div>
      </section>

      <footer class="r-foot">
        <p>mybirth · an astronomical postcard for ${esc(d.name)}</p>
        <p>Moon computed locally · weather via <a href="https://open-meteo.com" target="_blank" rel="noopener">Open-Meteo</a> · events via <a href="https://www.wikipedia.org" target="_blank" rel="noopener">Wikipedia</a></p>
      </footer>
    </div>
  `;

  // mount the moon into the result, set the true phase
  moon.mount(document.getElementById("result-moon"));
  moon.setPhase(d.moon.fraction);

  // mount the four almanac objects
  mountPlates(d);

  mountKeepsakes(d, placeLabel);

  // wire actions
  const saveTicketBtn = document.getElementById("save-ticket");
  saveTicketBtn.addEventListener("click", () =>
    runSaveAction(saveTicketBtn, () => { trackEvent(EVENTS.KEEPSAKE, { kind: "ticket" }); return saveTicketImage(document.getElementById("boarding-pass"), d.name); })
  );
  const saveCertBtn = document.getElementById("save-cert");
  saveCertBtn.addEventListener("click", () =>
    runSaveAction(saveCertBtn, () => { trackEvent(EVENTS.KEEPSAKE, { kind: "certificate_pdf" }); return saveCertificatePDF(document.getElementById("cert-flip"), d.name); })
  );
  const saveCertPngBtn = document.getElementById("save-cert-png");
  if (saveCertPngBtn) {
    saveCertPngBtn.addEventListener("click", () =>
      runSaveAction(saveCertPngBtn, () => { trackEvent(EVENTS.KEEPSAKE, { kind: "certificate_png" }); return saveCertificatePNG(document.getElementById("cert-flip"), d.name); })
    );
  }
  /*
     "Recover another day" asks for the form, so it has to say so. Dropping
     the query string alone reloaded onto whatever the root tab is, and once
     a day has been saved the root tab is Today: the button appeared to send
     people to the wrong screen. The hash survives the reload and pins it.
  */
  document.getElementById("restart").addEventListener("click", () => {
    location.href = `${location.pathname}#new`;
  });
  const copyBtn = document.getElementById("copy-link");
  if (copyBtn) copyBtn.addEventListener("click", () => { trackEvent(EVENTS.SHARE_COPY, { kind: "link" }); copyLink(copyBtn, d.shareURL); });

  // animations
  observeReveals(result);
  animateCounts(result);

  // centre the birth-year leader within the horizontal timeline
  const track = document.getElementById("leader-track");
  const activeChip = track?.querySelector("[data-active]");
  if (track && activeChip) {
    track.scrollLeft = activeChip.offsetLeft - track.clientWidth / 2 + activeChip.clientWidth / 2;
  }

  // the countdown to the next solar return — runs from the moment it exists,
  // not on scroll, because the numbers must agree with the clock on arrival
  const returnBlock = result.querySelector("[data-return]");
  if (returnBlock) startCountdown(returnBlock);

  wireOrrery(result);
  wireFete(d);
  buildChapterRail();

  // live, ever-climbing odometer (starts when it scrolls into view)
  const odo = result.querySelector("[data-odometer]");
  if (odo) {
    const oObs = new IntersectionObserver((ents) => {
      ents.forEach((en) => { if (en.isIntersecting) { startOdometer(odo); oObs.disconnect(); } });
    }, { threshold: 0.3 });
    oObs.observe(odo);
  }
  wireTempDial(result);

  /*
     The two halves of the completion rate the plan is gated on: this fires
     when the archive is ready, and watchCompletion fires again only if the
     reader actually reaches the last chapter. See analytics.js.
  */
  trackEvent(EVENTS.ARCHIVE_READY);
  watchCompletion(result);
  loadCoverArt(d);

  // persist this result to saves
  persistSave(d);
}

/*
   The sleeve and the poster, fetched after the chapter has painted.

   Neither is needed for the page to make sense, so neither is waited on:
   the titles are already there and the art drops into its own square when
   it arrives. A miss leaves an empty frame rather than a broken image,
   which is why the <img> is only created once a URL is in hand.
*/
function loadCoverArt(d) {
  const put = (key, url, alt) => {
    const slot = result.querySelector(`[data-art="${key}"]`);
    if (!slot || !url) return;
    const img = new Image();
    img.alt = alt;
    img.decoding = "async";
    /*
       Deliberately NOT loading="lazy". A lazy image that is not in the
       document has no viewport to enter, so the browser never starts the
       fetch and onload never fires: the frame stayed empty forever while
       the URL sat right there. This one is being fetched on purpose.
    */
    img.onload = () => { slot.appendChild(img); slot.classList.add("is-loaded"); };
    img.src = url;
  };

  const song = valueOf(d.song), movie = valueOf(d.movie);
  if (song) {
    albumArt(song).then((a) => put("song", a?.image, `Cover of ${a?.title || song}`)).catch(() => {});
  }
  if (movie) {
    filmPoster(movie).then((f) => put("film", f?.image, `Poster for ${f?.title || movie}`)).catch(() => {});
  }
}

/*
   The temperature gauge sweeps from empty to its reading by swapping the
   dash array one frame after the arc is in the DOM. It used to be kicked
   once, from renderResult, but the weather chapter arrives over the network
   and is written into its slot later — so the arc it looked for did not
   exist yet and the gauge stayed at zero forever. Now every render of the
   slot re-arms it.
*/
function wireTempDial(root) {
  const dial = root.querySelector("#temp-arc");
  if (!dial || dial.dataset.swept) return;
  dial.dataset.swept = "1";
  requestAnimationFrame(() => requestAnimationFrame(() => {
    dial.style.strokeDasharray = dial.getAttribute("data-target");
  }));
}

/* ---- weather section ---- */
function renderWeather(d, placeLabel) {
  if (!d.weather || d.weather.mean == null) {
    return `
      <section class="block">
        <p class="kicker" data-reveal>The weather overhead</p>
        <h2 class="h-section" data-reveal>The skies kept <em>no record.</em></h2>
        <p class="sub" data-reveal>Reliable daily weather only reaches back to 1940, and not every coordinate is covered. For ${esc(placeLabel)} on your day, the archive came back empty, but the sky still ran on schedule.</p>
        ${d.sun ? `<dl class="facts mt-l" data-reveal>${sunFactsHTML(d.sun, d.year)}</dl>` : ""}
      </section>`;
  }
  const w = d.weather;
  const mean = Math.round(w.mean);
  // map -20..45°C onto a 270° gauge. The svg is rotated 135° in CSS so the
  // dash (which starts at 3 o'clock) begins at the lower-left, leaving the
  // 90° gap centred at the bottom.
  const r = 84, C = 2 * Math.PI * r;
  const tNorm = Math.min(1, Math.max(0, (w.mean + 20) / 65));
  const arc = 0.75; // fraction of circle used
  const arcLen = C * arc;

  return `
    <section class="block">
      <p class="kicker" data-reveal>The weather overhead</p>
      <h2 class="h-section" data-reveal>${esc(w.summary)} over <em>${esc(placeLabel)}.</em></h2>
      <div class="weather mt-l">
        <div class="temp-dial" data-reveal>
          <svg viewBox="0 0 200 200">
            <defs>
              <linearGradient id="tempgrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stop-color="#6fe3d2"/>
                <stop offset="1" stop-color="#f08a6f"/>
              </linearGradient>
            </defs>
            <circle class="temp-dial__track" cx="100" cy="100" r="${r}"
              stroke-dasharray="${arcLen.toFixed(1)} ${C.toFixed(1)}"/>
            <circle id="temp-arc" class="temp-dial__val" cx="100" cy="100" r="${r}"
              stroke-dasharray="0 ${C.toFixed(1)}"
              data-target="${(arcLen * tNorm).toFixed(1)} ${C.toFixed(1)}"/>
          </svg>
          <div class="temp-dial__center">
            <b>${mean}°<span style="font-size:0.4em;vertical-align:super">C</span></b>
            <span>mean temp</span>
          </div>
        </div>
        <dl class="facts" data-reveal>
          <div class="fact"><dt>High</dt><dd>${Math.round(w.max)}°C</dd></div>
          <div class="fact"><dt>Low</dt><dd>${Math.round(w.min)}°C</dd></div>
          <div class="fact"><dt>Rain</dt><dd>${w.precip != null ? w.precip.toFixed(1) : "0"}<small>mm of precipitation</small></dd></div>
          <div class="fact"><dt>Wind</dt><dd>${w.wind != null ? Math.round(w.wind) : "·"}<small>km/h peak gust</small></dd></div>
          ${sunFactsHTML(d.sun, d.year)}
          <div class="fact"><dt>Conditions</dt><dd>${esc(w.summary)}</dd></div>
          
        </dl>
      </div>
    </section>`;
}

function sunFactsHTML(sun, year) {
  if (!sun) return "";
  if (sun.polar) {
    return `<div class="fact"><dt>Daylight</dt><dd>${sun.polar === "day" ? "Midnight sun" : "Polar night"}<small>the sun ${sun.polar === "day" ? "never set" : "never rose"} that day</small></dd></div>`;
  }
  /*
     Two different reasons a clock here might not be exact, and the reader
     deserves to know which one applies.

     An exact place carries its IANA zone; a country or region centroid does
     not, so the time is read off the longitude instead.

     And even with a real zone, offsets before 1970 come from the part of the
     zone database its own maintainers describe as not authoritative and in
     places deliberately simplified. A good share of this product's visitors
     were born back there, and an hour is worth admitting to.
  */
  const zoneNote = sun.approxZone
    ? "solar time at that longitude"
    : zoneIsUncertain(year) ? "local time, approximate before 1970" : "local time";
  return `
    <div class="fact"><dt>Sunrise</dt><dd>${esc(sun.sunrise)}<small>${zoneNote}</small></dd></div>
    <div class="fact"><dt>Sunset</dt><dd>${esc(sun.sunset)}<small>${zoneNote}</small></dd></div>
    <div class="fact"><dt>Daylight</dt><dd>${sun.daylightHours.toFixed(1)}<small>hours of sun</small></dd></div>`;
}

/* ---- music links ---- */
function musicLinks(song) {
  const q = song.replace(/ \| /g, " ");
  const yt = `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;
  const sp = `https://open.spotify.com/search/${encodeURIComponent(q)}`;
  return `
    <div class="media__links">
      <a class="play-link play-link--yt" href="${yt}" target="_blank" rel="noopener">▶ YouTube</a>
      <a class="play-link play-link--sp" href="${sp}" target="_blank" rel="noopener">● Spotify</a>
    </div>`;
}

/* ---- the four almanac plates (interactive 3D viewers) ---- */
function plateHTML(id, type, title, sub) {
  return `
    <figure class="plate" data-reveal>
      <div class="plate__stage" id="${id}">
        <span class="plate__skeleton" aria-hidden="true"></span>
      </div>
      <figcaption class="plate__cap">
        <span class="plate__type">${type}</span>
        <strong>${title}</strong>
        <span class="plate__sub">${sub}</span>
      </figcaption>
    </figure>`;
}

function mountPlates(d) {
  const plates = [
    { id: "stage-sign", glyph: d.zod.symbol, build: () => constellationObject(d.zod.sign) },
    { id: "stage-stone", glyph: "Stone", build: () => gemstoneObject(d.stone, GEM_COLORS[d.stone] || { base: "#9a7ff0", glow: "#ecd9ac" }) },
    { id: "stage-animal", glyph: "Animal", build: () => zodiacAnimalObject(d.cz.animal, d.cz.element) },
    { id: "stage-flower", glyph: "Flower", build: () => flowerObject(d.flower) },
  ];
  for (const plate of plates) {
    const el = document.getElementById(plate.id);
    if (!el) continue;
    const viewer = createViewer();
    viewer.mount(el);
    Promise.resolve()
      .then(plate.build)
      .then((object) => viewer.setObject(object))
      .catch((err) => {
        // model failed to load — show the glyph rather than an empty stage
        console.warn(`mybirth: ${plate.id} fell back to glyph:`, err);
        el.classList.add("is-fallback");
        el.insertAdjacentHTML("beforeend", `<span class="plate__glyph">${plate.glyph}</span>`);
      });
  }
}

/* ---- number & era (numerology + generation) ---- */
function renderNumberEra(d) {
  const gen = d.gen;
  return `
    <section class="block">
      <p class="kicker" data-reveal>Your number &amp; your era</p>
      <h2 class="h-section" data-reveal>A <em>life-path number</em><br/>and the world you were handed.</h2>
      <div class="duo mt-l">
        <div class="duo__panel" data-reveal>
          <div class="lifepath__num">${d.lp.number}</div>
          <div>
            <p class="duo__type">Life-path number</p>
            <h3 class="duo__title">${esc(d.lp.title)}</h3>
            <p class="duo__blurb">You are ${esc(d.lp.blurb)}.</p>
            <p class="source">Reduced from ${ordinalShort(d.day)} · ${esc(monthName(d.month))} · ${d.year}</p>
          </div>
        </div>
        <div class="duo__panel" data-reveal>
          <div class="era__mark">${gen ? esc(gen.label.split(" ").map((w) => w[0]).join("").slice(0, 2)) : "·"}</div>
          <div>
            <p class="duo__type">Your generation</p>
            <h3 class="duo__title">${gen ? esc(gen.label) : "Beyond our chart"}</h3>
            <p class="duo__blurb">${gen ? esc(gen.blurb) : "Your year sits outside the usual generational bands."}</p>
            ${gen ? `<p class="source">The ${gen.from}–${gen.to} cohort</p>` : ""}
          </div>
        </div>
      </div>
    </section>`;
}

/* ---- astrology reading (for believers and amused sceptics alike) ---- */
function renderAstrology(d) {
  const r = ZODIAC_READINGS[d.zod.sign];
  if (!r) return "";
  const first = d.name.split(/\s+/)[0] || d.name;
  const facts = [
    ["Element", d.zod.element],
    ["Ruling planet", r.ruler],
    ["Strengths", r.strengths],
    ["Your growth edge", r.growth],
    ["Lucky day", r.day],
    ["Lucky colour", r.color],
    ["Lucky number", String(d.lp.number)]
  ];
  return `
    <section class="block">
      <p class="kicker" data-reveal>Written in the stars</p>
      <h2 class="h-section" data-reveal>${esc(first)}, the <em>${esc(d.zod.sign)}.</em></h2>
      <p class="astro-note" data-reveal>If you believe in astrology, this one's for you. If you don't, enjoy it purely as a fun read.</p>
      <div class="astro mt-l" data-reveal>
        <div class="astro__glyph" aria-hidden="true">${signIcon(d.zod.sign, { size: "1em" })}</div>
        <div class="astro__body">
          <p class="astro__reading">${esc(r.reading)}</p>
          <dl class="astro__facts">
            ${facts.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join("")}
          </dl>
        </div>
      </div>
    </section>`;
}

/* ---- cosmic odometer (one row each, ticking live) ---- */
const ODO_ROWS = [
  ["Days lived", 1 / 86400, "each one a small turn of the Earth"],
  ["Trips around the sun", 1 / (365.2422 * 86400), "one per birthday, give or take"],
  ["Heartbeats", 72 / 60, "at a resting pulse of about 72 a minute"],
  ["Breaths drawn", 15 / 60, "roughly fifteen every minute"],
  ["Kilometres through space", 29.78, "Earth has carried you this far around the sun"]
];
function renderOdometer(d) {
  const rows = ODO_ROWS.map(([label, factor, sub]) => `
    <div class="odo-row" data-reveal>
      <b class="odo-row__num" data-live-factor="${factor}">0</b>
      <span class="odo-row__meta">
        <span class="odo-row__label">${label}</span>
        <span class="odo-row__sub">${sub}</span>
      </span>
    </div>`).join("");
  return `
    <section class="block">
      <p class="kicker" data-reveal>Since you arrived</p>
      <h2 class="h-section" data-reveal>Your life, <em>by the numbers.</em></h2>
      <p class="sub" data-reveal>Counting in real time. Every figure is climbing as you read this.</p>
      <div class="odometer mt-l" data-odometer data-birth="${d.birthDate.getTime()}">${rows}</div>
    </section>`;
}

/* ticks the live counters: a short count-up, then keeps climbing forever */
function startOdometer(container) {
  const birthMs = parseFloat(container.dataset.birth);
  const cells = [...container.querySelectorAll("[data-live-factor]")].map((el) => ({
    el, factor: parseFloat(el.dataset.liveFactor)
  }));
  const introStart = performance.now();
  const INTRO = 1700;
  function frame(now) {
    const introP = Math.min(1, (now - introStart) / INTRO);
    const eased = 1 - Math.pow(1 - introP, 3);
    const elapsed = (Date.now() - birthMs) / 1000;
    for (const c of cells) {
      c.el.textContent = Math.floor(elapsed * c.factor * eased).toLocaleString();
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

/* ---- the year in the world & in Malaysia ---- */
function renderYearNews(d) {
  const yn = d.yearNews;
  const hasAny = yn && ((yn.world && yn.world.length) || (yn.malaysia && yn.malaysia.length));
  if (!hasAny) {
    return `
      <section class="block">
        <p class="kicker" data-reveal>The year the world turned</p>
        <h2 class="h-section" data-reveal>The archive went <em>quiet.</em></h2>
        <p class="sub" data-reveal>We couldn't pull ${d.year}'s chronicle from Wikipedia just now. Refresh and the year should speak up.</p>
      </section>`;
  }
  return `
    <section class="block">
      <p class="kicker" data-reveal>The year the world turned</p>
      <h2 class="h-section" data-reveal>What <em>${d.year}</em> was made of.</h2>
      <p class="sub" data-reveal>Each headline links to its article.</p>

      ${yn.world && yn.world.length ? `
        <div class="news-scope" data-reveal>
          <h3 class="news-scope__h">Across the world</h3>
          ${newsList(yn.world)}
        </div>` : ""}

      ${yn.malaysia && yn.malaysia.length ? `
        <div class="news-scope" data-reveal>
          <h3 class="news-scope__h">In Malaysia</h3>
          ${newsList(yn.malaysia)}
        </div>` : `
        <p class="source" data-reveal style="margin-top:30px">No dedicated “${d.year} in Malaysia” chronicle was found on Wikipedia.</p>`}

    </section>`;
}

function newsList(events) {
  return `<ul class="news-list">${events
    .map((e) => `<li>${e.url
      ? `<a href="${esc(e.url)}" target="_blank" rel="noopener">${esc(e.text)}</a>`
      : esc(e.text)}</li>`)
    .join("")}</ul>`;
}

/* ---- people who share the date ---- */
function renderBirthdayPeople(d) {
  const births = d.otd?.births || [];
  const deaths = d.otd?.deaths || [];
  if (!births.length && !deaths.length) return "";

  /* the full birth date, since the day and month are the reader's own */
  const born = `${String(d.day).padStart(2, "0")}/${String(d.month).padStart(2, "0")}/`;
  const card = (p) => `
    <a class="person" ${p.url ? `href="${p.url}" target="_blank" rel="noopener"` : ""}>
      <span class="person__face">${p.thumb
        ? `<img src="${esc(p.thumb)}" alt="" loading="lazy"/>`
        : `<span class="person__initial">${esc((p.name[0] || "·"))}</span>`}</span>
      <span class="person__info">
        <b>${esc(p.name)}</b>
        <span class="person__desc">${esc(p.desc || "")}</span>
        <em>${born}${p.year}${p.died ? ` &ndash; ${p.died}` : ""}</em>
      </span>
    </a>`;

  return `
    <section class="block">
      <p class="kicker" data-reveal>Born on your day</p>
      <h2 class="h-section" data-reveal>You arrived in <em>good company.</em></h2>
      <div class="people-grid mt-l" data-reveal>${births.map(card).join("")}</div>
      ${deaths.length ? `
        <h3 class="source" style="margin-top:46px;font-size:0.7rem;letter-spacing:0.24em">THE WORLD ALSO REMEMBERS, ON THIS DATE</h3>
        <div class="shares" data-reveal>${deaths.map((p) => `<span class="share-chip"><b>${esc(p.name)}</b> · d. ${p.year}</span>`).join("")}</div>` : ""}
    </section>`;
}

/* ---- leaders: who-that-year + full timeline + world powers ---- */
function renderLeader(d) {
  const l = valueOf(d.leader);
  const timeline = leadersOf(d.geo?.countryCode);
  const world = leadersThatYear(d.year, d.geo?.countryCode);
  if (!l && !timeline && !world.length) return "";

  const initial = l ? (l.name.replace(/[^A-Za-z]/g, "")[0] || "·") : "·";

  const hero = l ? `
    <div class="leader mt-l" data-reveal>
      <div class="leader__seal">${esc(initial)}</div>
      <div>
        <p class="leader__title">${esc(l.title)} of ${esc(l.country)} · ${d.year} ${mark(d.leader)}</p>
        <p class="leader__name">${esc(l.name)}</p>
        <p class="leader__years">In office ${l.from}–${l.to ?? "present"}</p>
      </div>
    </div>` : `<p class="sub" data-reveal>Our archive doesn't reach ${esc(d.geo?.country || d.country)}'s leaders yet, but here's how the rest of the world looked.</p>`;

  const track = timeline ? `
    <h3 class="lead-sub" data-reveal>Every ${esc(timeline.list[0].title.toLowerCase())} of ${esc(timeline.country)}, in sequence</h3>
    <div class="leader-track" id="leader-track" tabindex="0" data-reveal>
      ${timeline.list.map((m) => {
        const active = l && m.name === l.name && m.from === l.from;
        return `<div class="lead-chip${active ? " is-active" : ""}"${active ? ' data-active="1"' : ""}>
          <span class="lead-chip__years">${m.from}–${m.to ?? "now"}</span>
          <span class="lead-chip__name">${esc(m.name)}</span>
        </div>`;
      }).join("")}
    </div>
    <p class="source" data-reveal>Scroll sideways · your year is highlighted.</p>` : "";

  const worldGrid = world.length ? `
    <h3 class="lead-sub" data-reveal>Meanwhile, around the world in ${d.year}</h3>
    <div class="world-leaders" data-reveal>
      ${world.map((w) => `
        <div class="wleader">
          <img class="wleader__flag-img"
               src="https://flagcdn.com/w80/${w.code.toLowerCase()}.png"
               alt="${esc(w.country)} flag"
               loading="lazy"
               width="80" height="54"/>
          <span class="wleader__country">${esc(w.country)}</span>
          <span class="wleader__name">${w.name ? esc(w.name) : "·"}</span>
          <span class="wleader__title">${w.title ? esc(w.title) : "not in archive"}</span>
        </div>`).join("")}
    </div>` : "";

  return `
    <section class="block">
      <p class="kicker" data-reveal>Who held the reins</p>
      <h2 class="h-section" data-reveal>The people <em>in charge</em> when you arrived.</h2>
      ${hero}
      ${track}
      ${worldGrid}
    </section>`;
}

/* ---------- small helpers ---------- */
function ordinalShort(n) {
  const s = ["th", "st", "nd", "rd"], v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function animateCounts(root) {
  root.querySelectorAll("[data-count]").forEach((el) => {
    const target = parseInt(el.getAttribute("data-count"), 10) || 0;
    const small = el.querySelector("small");
    const obs = new IntersectionObserver((ents) => {
      ents.forEach((en) => {
        if (en.isIntersecting) {
          animateNumber(el, target, 1400, small);
          obs.disconnect();
        }
      });
    }, { threshold: 0.5 });
    obs.observe(el);
  });
}

function animateNumber(el, target, dur, smallNode) {
  const start = performance.now();
  const smallHTML = smallNode ? smallNode.outerHTML : "";
  function step(now) {
    const p = Math.min(1, (now - start) / dur);
    const eased = 1 - Math.pow(1 - p, 3);
    const val = Math.round(target * eased).toLocaleString();
    el.firstChild ? (el.childNodes[0].nodeValue = val) : (el.textContent = val);
    if (smallNode && !el.querySelector("small")) el.insertAdjacentHTML("beforeend", smallHTML);
    if (p < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

/* ---- the wider universe: world population + age across planets ---- */
/* An orrery you can poke: real orbital periods, real ages, schematic distances. */
const ORRERY = [
  { name: "Mercury", glyph: "☿", period: 0.2408467, r: 52, size: 3.4, color: "#b9b2a6",
    note: "A year here lasts 88 days. You would have had a birthday every three months." },
  { name: "Venus", glyph: "♀", period: 0.6151972, r: 76, size: 5.0, color: "#e5c07a",
    note: "Venus turns so slowly that its day is longer than its year." },
  { name: "Earth", glyph: "⊕", period: 1, r: 102, size: 5.2, color: "#6fe3d2",
    note: "The only lap anyone counts, and the one this whole page is built on." },
  { name: "Mars", glyph: "♂", period: 1.8808158, r: 130, size: 4.0, color: "#f08a6f",
    note: "A Martian year runs 687 days, so you age there at roughly half speed." },
  { name: "Jupiter", glyph: "♃", period: 11.862615, r: 164, size: 9.0, color: "#d9a86a",
    note: "One Jovian lap takes almost twelve of ours." },
  { name: "Saturn", glyph: "♄", period: 29.447498, r: 196, size: 7.6, color: "#e0cf9a",
    note: "A Saturn return takes about 29 and a half years, the one orbit even astrologers agree matters." },
];

function renderCosmosWide(d) {
  // one decimal, not two: this is a straight-line read between UN estimates
  // five years apart, and the second decimal is invented precision
  const pop = valueOf(d.population);
  const popBillions = pop ? (pop / 1e9).toFixed(1) : null;
  const orbits = d.odo.orbits;
  const C = 220;

  const rings = ORRERY.map((b) =>
    `<circle class="orr-ring" cx="${C}" cy="${C}" r="${b.r}"/>`).join("");

  const planets = ORRERY.map((b, i) => {
    const age = orbits / b.period;
    const ageStr = age >= 100 ? Math.round(age).toLocaleString() : age.toFixed(1);
    // Earth's lap is 12s on screen; everything else keeps its true relative pace
    const dur = (b.period * 12).toFixed(2);
    const start = (i * 47) % 360;
    return `
      <g class="orr-body" style="--dur:${dur}s;--start:${start}deg"
         data-planet="${esc(b.name)}" data-age="${ageStr}" data-note="${esc(b.note)}"
         data-period="${b.period < 1 ? (b.period * 365.2422).toFixed(0) + " Earth days" : b.period.toFixed(2) + " Earth years"}"
         tabindex="0" role="button"
         aria-label="${esc(b.name)}: you are ${ageStr} ${esc(b.name)}-years old">
        <circle class="orr-hit" cx="${C + b.r}" cy="${C}" r="16"/>
        <circle class="orr-dot" cx="${C + b.r}" cy="${C}" r="${b.size}" style="fill:${b.color}"/>
      </g>`;
  }).join("");

  const first = ORRERY[2]; // open on Earth
  const earthAge = (orbits / first.period).toFixed(1);

  return `
    <section class="block">
      <p class="kicker" data-reveal>Out past the atmosphere</p>
      <h2 class="h-section" data-reveal>You against <em>the solar system.</em></h2>
      ${popBillions ? `
        <p class="sub" data-reveal>When you arrived, Earth was already home to about
          <strong style="color:var(--lunar)">${popBillions} billion</strong> people ${mark(d.population)}, and it has been
          carrying you around the sun ever since.</p>` : ""}

      <div class="orrery mt-l" data-orrery data-reveal>
        <svg class="orr-svg" viewBox="0 0 440 440" role="group" aria-label="Interactive orrery, choose a planet">
          ${rings}
          <circle class="orr-sun-glow" cx="${C}" cy="${C}" r="26"/>
          <circle class="orr-sun" cx="${C}" cy="${C}" r="12"/>
          ${planets}
        </svg>
        <div class="orr-read" aria-live="polite">
          <p class="orr-read__k">Your age on</p>
          <p class="orr-read__name" data-orr-name>${first.name}</p>
          <p class="orr-read__age"><b data-orr-age>${earthAge}</b> <span>${first.name}-years</span></p>
          <p class="orr-read__period" data-orr-period>one lap · 1.00 Earth years</p>
          <p class="orr-read__note" data-orr-note>${esc(first.note)}</p>
          <p class="orr-read__hint">Tap a planet to switch</p>
        </div>
      </div>
      <p class="source mt-l">Ages from real orbital periods · orbit sizes are schematic, not to scale · population from UN estimates.</p>
    </section>`;
}

/** Wire the orrery's planets to its readout panel. */
function wireOrrery(root) {
  const orr = root.querySelector("[data-orrery]");
  if (!orr) return;
  const out = {
    name: orr.querySelector("[data-orr-name]"),
    age: orr.querySelector("[data-orr-age]"),
    unit: orr.querySelector(".orr-read__age span"),
    period: orr.querySelector("[data-orr-period]"),
    note: orr.querySelector("[data-orr-note]"),
  };
  const bodies = [...orr.querySelectorAll(".orr-body")];

  const select = (g) => {
    bodies.forEach((b) => b.classList.toggle("is-active", b === g));
    out.name.textContent = g.dataset.planet;
    out.age.textContent = g.dataset.age;
    out.unit.textContent = `${g.dataset.planet}-years`;
    out.period.textContent = `one lap · ${g.dataset.period}`;
    out.note.textContent = g.dataset.note;
  };

  bodies.forEach((g) => {
    g.addEventListener("click", () => select(g));
    g.addEventListener("mouseenter", () => select(g));
    g.addEventListener("focus", () => select(g));
    g.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); select(g); }
    });
  });
  const earth = bodies.find((b) => b.dataset.planet === "Earth");
  if (earth) earth.classList.add("is-active");
}

/* ---- the two keepsakes: boarding pass and certificate ---- */
function mountKeepsakes(d, placeLabel) {
  const ticketMount = document.getElementById("ticket-mount");
  const certView = document.getElementById("cert-view");
  if (ticketMount) ticketMount.innerHTML = "";
  if (certView) certView.innerHTML = "";

  // ticket — build, mount, then inject QR code into the stub
  const ticketEl = buildTicket({
    name: d.name, day: d.day, month: d.month, year: d.year,
    origin: placeLabel, moon: d.moon, today: d.today, age: d.age.age,
    countryCode: d.geo?.countryCode || "",
    shareURL: d.shareURL
  });
  if (ticketMount) {
    ticketMount.appendChild(ticketEl);
    fitToContainer(ticketMount, ticketEl);
    QRCode.toDataURL(d.shareURL, {
      margin: 1, width: 200, errorCorrectionLevel: "M",
      color: { dark: "#e8e4f4", light: "#0d0f20" }
    })
      .then((url) => {
        ticketEl.querySelectorAll("[data-ticket-qr]").forEach((img) => (img.src = url));
      })
      .catch(() => {});
  }

  // certificate (front + back) — QR is filled in asynchronously
  let fitCert = () => {};
  if (certView) {
    const cert = buildCertificate(d, placeLabel);
    certView.appendChild(cert);
    fitCert = fitToContainer(cert, document.getElementById("cert-flip"));
    QRCode.toDataURL(d.shareURL, {
      margin: 1, width: 320, errorCorrectionLevel: "M",
      color: { dark: "#ddd8f0", light: "#060918" }
    })
      .then((url) => {
        cert.querySelectorAll("[data-qr]").forEach((img) => (img.src = url));
      })
      .catch(() => {});
  }

  // certificate flip + size controls
  const flip = document.getElementById("cert-flip");
  const flipBtn = document.getElementById("cert-flip-btn");
  if (flip && flipBtn) {
    const toggle = () => {
      flip.classList.toggle("flipped");
      flipBtn.textContent = flip.classList.contains("flipped") ? "Back to the front" : "Turn it over";
    };
    flipBtn.addEventListener("click", toggle);
    flip.addEventListener("click", toggle);
    document.querySelectorAll("[data-size]").forEach((b) =>
      b.addEventListener("click", (e) => {
        e.stopPropagation();
        flip.classList.remove("size-a4", "size-letter", "size-card");
        flip.classList.add("size-" + b.dataset.size);
        document.querySelectorAll("[data-size]").forEach((x) => x.classList.toggle("is-active", x === b));
        fitCert();
      })
    );
  }
}

/** Geocoding can sharpen the place name and add a flag — redraw if it did. */
function refreshKeepsakes(d) {
  const label = placeLabelFor(d);
  if (label === d._keepsakeLabel && !d.geo?.countryCode) return;
  d._keepsakeLabel = label;
  mountKeepsakes(d, label);
}

/* ---- the sky itself: where the planets actually stood that day ---- */
function renderSkyThen(d) {
  const sky = d.skyThen;
  if (!sky || !sky.length) return "";
  /*
     One 360-degree axis of the ecliptic with every wanderer pinned at its true
     longitude. Cards would have listed the same numbers; the track shows the
     thing the numbers describe, which is where they stood in relation to each
     other. Stacking rows keeps close conjunctions from overlapping.
  */
  const SIGNS = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
    "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];
  const ticks = SIGNS.map((s, i) => `
    <div class="ps-tick" style="left:${((i * 30) / 360 * 100).toFixed(3)}%">
      <span class="ps-tick__glyph">${signIcon(s, { size: "1em" })}</span>
      <span class="ps-tick__name">${esc(s.slice(0, 3))}</span>
    </div>`).join("");

  // sort by longitude, then bump anything within 7 degrees onto the next row
  const ordered = [...sky].sort((a, b) => a.longitude - b.longitude);
  const rowEnds = [];
  const pins = ordered.map((p) => {
    // a label is ~120px wide on a ~1100px track, so it needs roughly 34
    // degrees of clear sky before a neighbour can share its row
    let row = rowEnds.findIndex((end) => p.longitude - end > 34);
    if (row === -1) { row = rowEnds.length; rowEnds.push(0); }
    rowEnds[row] = p.longitude;
    return `
      <div class="ps-pin" style="left:${(p.longitude / 360 * 100).toFixed(3)}%;--row:${row}">
        <span class="ps-pin__stem"></span>
        <span class="ps-pin__dot"></span>
        <span class="ps-pin__label">
          <b>${p.glyph}&#xFE0E; ${esc(p.name)}</b>
          <i>${esc(p.sign)} ${p.degreeInSign.toFixed(1)}°</i>
        </span>
      </div>`;
  }).join("");
  const rows = rowEnds.length;

  return `
    <section class="block">
      <div class="chapter-plate">
        <p class="kicker" data-reveal>The sky, exactly as it stood</p>
        <h2 class="h-section" data-reveal>Where the wanderers <em>stood.</em></h2>
        <p class="ch-sub" data-reveal>
          The ecliptic on your date, with each naked-eye planet at the
          longitude it actually held.
        </p>
      </div>
      <div class="ps-strip mt-l" data-reveal style="--rows:${rows}">
        <div class="ps-track">
          <div class="ps-axis"></div>
          ${ticks}
          ${pins}
        </div>
      </div>
    </section>`;
}

/* ---- milestones: the next times this life crosses a round number ---- */
function renderMilestones(d) {
  const ms = d.nextMilestones;
  if (!ms || !ms.length) return "";
  const fmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });
  const rows = ms.map((m) => {
    const away = Math.round((m.date - d.today) / 86400000);
    return `
      <div class="mile" data-reveal>
        <b class="mile__label">${esc(m.label)}</b>
        <span class="mile__date">${fmt.format(m.date)}</span>
        <span class="mile__away">${away.toLocaleString()} days away</span>
      </div>`;
  }).join("");
  return `
    <section class="block">
      <p class="kicker" data-reveal>Still ahead of you</p>
      <h2 class="h-section" data-reveal>The next times you cross<br/><em>a round number.</em></h2>
      <p class="sub" data-reveal>Every one of these has a date. Come back on any of them and this page will say so.</p>
      <div class="miles mt-l">${rows}</div>
    </section>`;
}

/* ---- the return: Earth coming back to where it was when you arrived ---- */
/* days elapsed at the start of each month, for placing the wheel's labels */
const MONTH_STARTS = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
const MONTH_ABBR = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
const doyAngle = (m, day) => ((MONTH_STARTS[m - 1] + day - 1) / 365.2422) * 360;
const dayOfYear = (m, day) => MONTH_STARTS[m - 1] + day;

/**
 * The year as a wheel: the sun at the centre, your day marked on the rim, and
 * Earth somewhere along it. The drawn arc is what's *left* of the lap — the
 * distance the planet still has to cover before it's back where you started.
 */
function yearWheelSVG(d) {
  const W = 420, C = 210, R = 168, RAD = Math.PI / 180;
  const pt = (a, rad) => [C + rad * Math.cos((a - 90) * RAD), C + rad * Math.sin((a - 90) * RAD)];

  const birthA = doyAngle(d.month, d.day);
  const now = d.today;
  const nowA = doyAngle(now.getMonth() + 1, now.getDate());
  // floor, so this agrees with the "days" cell of the live countdown beside it
  const daysLeft = Math.max(0, Math.floor((d.nextReturn.date - now) / 86400000));

  const ticks = MONTH_ABBR.map((mn, i) => {
    const a = (MONTH_STARTS[i] / 365.2422) * 360;
    const [x1, y1] = pt(a, R), [x2, y2] = pt(a, R - 8);
    const [tx, ty] = pt(a + 15, R - 26);
    return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" class="yw-tick"/>
      <text x="${tx.toFixed(1)}" y="${ty.toFixed(1)}" text-anchor="middle" dominant-baseline="middle" class="yw-month">${mn}</text>`;
  }).join("");

  const sweep = ((birthA - nowA) % 360 + 360) % 360;
  const large = sweep > 180 ? 1 : 0;
  const [sx, sy] = pt(nowA, R), [ex, ey] = pt(birthA, R);
  const [bx, by] = [ex, ey], [nx, ny] = [sx, sy];

  return `
    <svg class="yearwheel" viewBox="0 0 ${W} ${W}" role="img"
         aria-label="Year wheel: Earth is ${daysLeft} days from returning to where it was when you were born">
      <circle cx="${C}" cy="${C}" r="${R}" class="yw-ring"/>
      <circle cx="${C}" cy="${C}" r="${R - 42}" class="yw-ring-inner"/>
      ${ticks}
      <path d="M ${sx.toFixed(1)} ${sy.toFixed(1)} A ${R} ${R} 0 ${large} 1 ${ex.toFixed(1)} ${ey.toFixed(1)}" class="yw-arc"/>
      <circle cx="${C}" cy="${C - 58}" r="7" class="yw-sun"/>
      <text x="${C}" y="${C - 36}" text-anchor="middle" class="yw-sunlab">SUN</text>
      <circle cx="${nx.toFixed(1)}" cy="${ny.toFixed(1)}" r="5" class="yw-earth"/>
      <text x="${(nx + (nx > C ? 14 : -14)).toFixed(1)}" y="${ny.toFixed(1)}" text-anchor="${nx > C ? "start" : "end"}"
            dominant-baseline="middle" class="yw-lab">EARTH · NOW</text>
      <circle cx="${bx.toFixed(1)}" cy="${by.toFixed(1)}" r="8" class="yw-mark"/>
      <circle cx="${bx.toFixed(1)}" cy="${by.toFixed(1)}" r="3" class="yw-mark-dot"/>
      <text x="${(bx + (bx > C ? 16 : -16)).toFixed(1)}" y="${(by - 4).toFixed(1)}" text-anchor="${bx > C ? "start" : "end"}"
            class="yw-lab yw-lab--gold">YOUR DAY</text>
      <text x="${C}" y="${C + 16}" text-anchor="middle" class="yw-days">${daysLeft}</text>
      <text x="${C}" y="${C + 38}" text-anchor="middle" class="yw-dayslab">DAYS TO GO</text>
    </svg>`;
}

function renderReturn(d) {
  const nb = d.nextReturn;
  if (!nb) return "";
  const wd = nb.weekday;
  const orbitNo = Number.isFinite(d.age.age) ? d.age.age + 1 : null;
  const first = esc(d.name.split(/\s+/)[0] || d.name);

  if (nb.isToday) {
    return `
      <section class="block return-block is-today" data-return data-target="${nb.date.getTime()}">
        <div class="chapter-plate">
          <p class="kicker" data-reveal>The return</p>
          <h2 class="h-section" data-reveal>The <em>return</em></h2>
          <p class="return-today" data-reveal>It&rsquo;s <em>today.</em></p>
          <p class="return-line" data-reveal>
            Orbit № ${orbitNo ?? ""} complete. The sun is exactly where it was the moment you began.
            Happy birthday, <b>${first}</b>.
          </p>
          <div class="return-cta" data-reveal>
            <button type="button" class="btn-ghost" data-fete>Light the candles</button>
          </div>
          <div data-reveal>${yearWheelSVG(d)}</div>
        </div>
      </section>`;
  }

  return `
    <section class="block return-block" data-return data-target="${nb.date.getTime()}">
      <div class="chapter-plate">
        <p class="kicker" data-reveal>The return</p>
        <h2 class="h-section" data-reveal>The <em>return</em></h2>
        <p class="ch-sub" data-reveal>
          Earth is swinging back to the exact stretch of its orbit where you began.
        </p>
        <div class="countdown" data-reveal>
          <div class="cd-cell"><p class="cd-n" data-cd="d">00</p><p class="cd-k">days</p></div>
          <p class="cd-sep">:</p>
          <div class="cd-cell"><p class="cd-n" data-cd="h">00</p><p class="cd-k">hours</p></div>
          <p class="cd-sep">:</p>
          <div class="cd-cell"><p class="cd-n" data-cd="m">00</p><p class="cd-k">min</p></div>
          <p class="cd-sep">:</p>
          <div class="cd-cell"><p class="cd-n" data-cd="s">00</p><p class="cd-k">sec</p></div>
        </div>
        <p class="return-line" data-reveal>
          ${orbitNo !== null ? `Your <b>${ordinal(orbitNo)}</b> solar return lands on a` : "Your next solar return lands on a"}
          <b>${esc(wd)}</b>${nb.note ? ` <em>(${esc(nb.note)})</em>` : ""},
          under a <b>${esc(nb.moon.name.toLowerCase())}</b> at
          <b>${Math.round(nb.moon.illumination * 100)}%</b> lit.
          Open this page that day and it will know.
        </p>
        <p class="return-sub" data-reveal>
          The moon returns to your birth phase in
          <b data-count="${Math.round(d.returning.daysToMoonMatch)}">0</b> days.
        </p>
        <div class="return-cta" data-reveal>
          <button type="button" class="btn-ghost" data-fete>Rehearse the day</button>
        </div>
        <div data-reveal>${yearWheelSVG(d)}</div>
      </div>
    </section>`;
}

/**
 * A rail of chapter marks down the right edge.
 *
 * The archive is a dozen full-height chapters and the only orientation was a
 * one-pixel progress meridian, which tells you how far through you are but not
 * what you are in or what is left. Each mark names its chapter on hover and
 * jumps to it on click.
 */
function buildChapterRail() {
  document.getElementById("chapter-rail")?.remove();

  // the kicker is the chapter's own name, so the rail never invents labels
  const chapters = [...result.querySelectorAll(".block")]
    .map((el) => {
      const label = el.querySelector(".kicker")?.textContent?.trim();
      return label ? { el, label } : null;
    })
    .filter(Boolean);
  if (chapters.length < 3) return;

  const rail = document.createElement("nav");
  rail.id = "chapter-rail";
  rail.className = "rail";
  rail.setAttribute("aria-label", "Chapters");
  // hydration rebuilds this while the visitor may be reading another tab
  rail.hidden = currentTab() !== "archive";
  rail.innerHTML = chapters.map((c, i) => `
    <button type="button" class="rail__mark" data-i="${i}">
      <span class="rail__label">${esc(c.label)}</span>
    </button>`).join("");
  document.body.appendChild(rail);

  const marks = [...rail.querySelectorAll(".rail__mark")];
  marks.forEach((m, i) => {
    m.addEventListener("click", () => {
      chapters[i].el.scrollIntoView({ behavior: REDUCED_MOTION ? "auto" : "smooth", block: "start" });
    });
  });

  // highlight whichever chapter owns the middle of the viewport
  const spy = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      const i = chapters.findIndex((c) => c.el === e.target);
      marks.forEach((m, j) => m.classList.toggle("is-here", j === i));
    }
  }, { rootMargin: "-45% 0px -45% 0px", threshold: 0 });
  chapters.forEach((c) => spy.observe(c.el));
}

const REDUCED_MOTION = matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Wire the celebration to its button, and open it unprompted on the day.
 *
 * The auto-open is locked to once per person per day in sessionStorage: it
 * should feel like the page greeting you, not like a modal that reappears
 * every time you scroll back up.
 */
function wireFete(d) {
  const first = d.name.split(/\s+/)[0] || d.name;
  const isToday = !!d.nextReturn?.isToday;
  const age = Number.isFinite(d.age.age) ? (isToday ? d.age.age : d.age.age + 1) : 0;

  const open = (rehearsal) => {
    const fete = createFete({
      name: first,
      age,
      dateLabel: `${ordinal(d.day)} ${monthName(d.month)}`,
      rehearsal,
    });
    fete.open();
  };

  result.querySelectorAll("[data-fete]").forEach((btn) => {
    btn.addEventListener("click", () => open(!isToday));
  });

  if (!isToday) return;
  const stamp = `mybirth.fete.${d.name}|${d.day}|${d.month}.${d.today.toDateString()}`;
  try {
    if (sessionStorage.getItem(stamp)) return;
    sessionStorage.setItem(stamp, "1");
  } catch {}
  setTimeout(() => open(false), 900);
}

/** Ticks the countdown to the next solar return, once a second. */
function startCountdown(section) {
  const target = parseFloat(section.dataset.target);
  const cells = {};
  for (const k of ["d", "h", "m", "s"]) cells[k] = section.querySelector(`[data-cd="${k}"]`);
  if (!cells.d) return;

  const tick = () => {
    let left = Math.max(0, target - Date.now());
    const dd = Math.floor(left / 86400000); left -= dd * 86400000;
    const hh = Math.floor(left / 3600000); left -= hh * 3600000;
    const mm = Math.floor(left / 60000); left -= mm * 60000;
    const ss = Math.floor(left / 1000);
    cells.d.textContent = dd.toLocaleString();
    cells.h.textContent = String(hh).padStart(2, "0");
    cells.m.textContent = String(mm).padStart(2, "0");
    cells.s.textContent = String(ss).padStart(2, "0");
  };
  tick();
  // returned so callers that rebuild their section can stop the old tick
  return setInterval(tick, 1000);
}

/* ---- homeland (Wikipedia summary + geocoding) ---- */
function renderHomeland(d) {
  const h = d.homeland;
  if (!h || (!h.extract && !h.flag)) return "";
  const ind = d.indicators;
  const num = (n) => Math.round(n).toLocaleString("en-US");

  /*
     The old version was a Wikipedia paragraph plus a timezone, which said the
     same dull thing about every country. These lines are specific to *this*
     country in *this* birth year, and come from World Bank open data, so they
     work as well for Peru or Nigeria as for Malaysia.
  */
  const story = [];
  if (ind?.populationThen) {
    story.push(`When you arrived, ${esc(h.name)} held <b>${num(ind.populationThen)}</b> people.`);
  }
  if (ind?.populationThen && ind?.populationNow) {
    const mult = ind.populationNow / ind.populationThen;
    const grown = ind.populationNow - ind.populationThen;
    story.push(grown > 0
      ? `Today it holds <b>${num(ind.populationNow)}</b>, which is <b>${num(grown)}</b> more, ${mult.toFixed(2)} times the country you were born into.`
      : `Today it holds <b>${num(ind.populationNow)}</b>, fewer than the country you were born into.`);
  }
  if (ind?.lifeExpectancyThen) {
    story.push(`A child born there that year could expect <b>${ind.lifeExpectancyThen.toFixed(1)}</b> years of life.`);
  }

  // where on Earth that puts you, computed rather than looked up
  const geoFacts = [];
  if (d.geo) {
    const { lat, lon } = d.geo;
    const hemi = `${lat >= 0 ? "Northern" : "Southern"} and ${lon >= 0 ? "Eastern" : "Western"}`;
    const fromEquator = Math.abs(lat) * 111.32;
    const antiLat = -lat;
    const antiLon = lon > 0 ? lon - 180 : lon + 180;
    geoFacts.push(["Hemispheres", hemi]);
    geoFacts.push(["From the equator", `${num(fromEquator)} km`]);
    geoFacts.push(["Directly opposite", `${Math.abs(antiLat).toFixed(1)}° ${antiLat >= 0 ? "N" : "S"}, ${Math.abs(antiLon).toFixed(1)}° ${antiLon >= 0 ? "E" : "W"}`]);
    if (d.geo.timezone) geoFacts.push(["Time zone", d.geo.timezone.replace(/_/g, " ")]);
  }

  // trim Wikipedia's opening to its first two sentences; the full extract was
  // a wall of border geography nobody reads
  const brief = h.extract
    ? (h.extract.match(/[^.!?]+[.!?]+/g) || [h.extract]).slice(0, 2).join("").trim()
    : "";

  return `
    <section class="block">
      <p class="kicker" data-reveal>Your homeland</p>
      <h2 class="h-section" data-reveal>The country that <em>claimed you first.</em></h2>
      <div class="homeland mt-l" data-reveal>
        <div class="homeland__flag">
          ${h.flag ? `<img class="homeland__flag-img" src="${esc(h.flag)}" alt="Flag of ${esc(h.name)}" loading="lazy"/>` : ""}
          <span class="homeland__name">${esc(h.name)}</span>
          ${h.description ? `<span class="homeland__desc">${esc(h.description)}</span>` : ""}
        </div>
        <div class="homeland__body">
          ${story.length ? `<p class="homeland__story">${story.join(" ")}</p>` : ""}
          ${brief ? `<p class="homeland__extract">${esc(brief)}</p>` : ""}
          ${geoFacts.length ? `<dl class="facts homeland__facts">${geoFacts.map(([k, v]) => `<div class="fact"><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join("")}</dl>` : ""}
        </div>
      </div>
    </section>`;
}

/* ---------- save-as-file helpers (ticket → PNG, certificate → PDF) ---------- */

/** Run a save action with button feedback; never throws past this boundary. */
async function runSaveAction(btn, action) {
  const original = btn.textContent;
  btn.disabled = true;
  btn.textContent = "Saving…";
  try {
    await action();
    btn.textContent = "Saved";
  } catch (err) {
    console.warn("mybirth: save failed:", err);
    btn.textContent = "Save failed";
  }
  setTimeout(() => { btn.textContent = original; btn.disabled = false; }, 2200);
}

function slugify(s) {
  return String(s || "day").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "day";
}

/** Visually scales a fixed-design-width node (the ticket or certificate)
 *  down to fit a narrower container, instead of letting it reflow at
 *  different breakpoints — this is what keeps the ticket/certificate
 *  looking identical on mobile and desktop. The node keeps its native
 *  layout size (offsetWidth/offsetHeight), so downloads capture the same
 *  canonical size regardless of the current on-screen scale. */
function fitToContainer(container, target) {
  if (!container || !target) return () => {};
  const apply = () => {
    const cw = container.clientWidth;
    const naturalWidth = target.offsetWidth;
    const naturalHeight = target.offsetHeight;
    if (!cw || !naturalWidth) return;
    const scale = Math.min(1, cw / naturalWidth);
    target.style.transform = scale < 1 ? `scale(${scale})` : "";
    container.style.height = `${Math.ceil(naturalHeight * scale)}px`;
  };
  // a plain window "resize" listener isn't enough: at the moment a ticket/
  // certificate is first mounted, its section can still be mid page-
  // transition (zero-size), so the initial synchronous apply() measures 0
  // and a later viewport resize may never come — ResizeObserver re-fires
  // as soon as the container actually gets its real size, too.
  const ro = new ResizeObserver(apply);
  ro.observe(container);
  ro.observe(target);
  apply();
  return apply;
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

/** Renders a node into a detached clone so html2canvas captures it flat —
 *  the real nodes can carry a live hover-tilt transform (ticket) or a
 *  rotateY(180deg) meant only for the 3D flip context (certificate back),
 *  both of which would otherwise skew or mirror a standalone capture.
 *  Only `transform` is reset; `position` is left alone since children
 *  (glows, the certificate frame) are positioned absolutely against it. */
async function renderNodeToCanvas(node, width, height, scale) {
  // loaded on demand — html2canvas is a heavy dependency only ever needed
  // when the user actually saves a ticket or certificate
  const { default: html2canvas } = await import("html2canvas");
  const clone = node.cloneNode(true);
  clone.style.transform = "none";
  const holder = document.createElement("div");
  holder.style.cssText = `position:fixed;left:-99999px;top:0;width:${width}px;height:${height}px;pointer-events:none;`;
  holder.appendChild(clone);
  document.body.appendChild(holder);
  try {
    return await html2canvas(clone, {
      backgroundColor: null,
      scale,
      useCORS: true,
      width,
      height,
    });
  } finally {
    holder.remove();
  }
}

async function saveTicketImage(ticketEl, name) {
  // offsetWidth/offsetHeight are the node's native (unscaled) layout box —
  // getBoundingClientRect() would return the shrunk size that
  // fitToContainer's transform renders on narrow screens, so downloads
  // would end up smaller/differently-shaped than the desktop ticket.
  const width = ticketEl.offsetWidth;
  const height = ticketEl.offsetHeight;
  const canvas = await renderNodeToCanvas(ticketEl, width, height, Math.max(2, window.devicePixelRatio || 1));
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
  if (!blob) throw new Error("canvas produced no image data");
  downloadBlob(blob, `mybirth-ticket-${slugify(name)}.png`);
}

async function saveCertificatePDF(flipEl, name) {
  // native (unscaled) layout size — see comment in saveTicketImage above
  const w = flipEl.offsetWidth;
  const h = flipEl.offsetHeight;
  const front = flipEl.querySelector(".cert-front");
  const back = flipEl.querySelector(".cert-back");

  const [{ jsPDF }, frontCanvas, backCanvas] = await Promise.all([
    import("jspdf"),
    renderNodeToCanvas(front, w, h, 2),
    renderNodeToCanvas(back, w, h, 2),
  ]);

  const orientation = w >= h ? "landscape" : "portrait";
  // JPEG rather than PNG here — the face backgrounds are fully opaque so
  // there's no transparency to lose, and it keeps a 2-page A4 keepsake in
  // the low single-digit MB instead of a lossless PNG's dozens of MB
  const pdf = new jsPDF({ orientation, unit: "px", format: [w, h] });
  pdf.addImage(frontCanvas.toDataURL("image/jpeg", 0.92), "JPEG", 0, 0, w, h);
  pdf.addPage([w, h], orientation);
  pdf.addImage(backCanvas.toDataURL("image/jpeg", 0.92), "JPEG", 0, 0, w, h);
  pdf.save(`mybirth-certificate-${slugify(name)}.pdf`);
}

/**
 * The certificate front as a single high-resolution PNG.
 *
 * The PDF is the thing you print; this is the thing you send. It renders at
 * whatever scale gets the long edge to 1754px (A4 at 150dpi), which is large
 * enough to print at postcard size and still sharp on a phone screen.
 */
async function saveCertificatePNG(flipEl, name) {
  const w = flipEl.offsetWidth;
  const h = flipEl.offsetHeight;
  const front = flipEl.querySelector(".cert-front");
  if (!front) throw new Error("certificate front not found");

  const TARGET_LONG_EDGE = 1754;
  const scale = Math.min(4, Math.max(2, TARGET_LONG_EDGE / Math.max(w, h)));
  const canvas = await renderNodeToCanvas(front, w, h, scale);

  const blob = await new Promise((res) => canvas.toBlob(res, "image/png"));
  if (!blob) throw new Error("could not encode the certificate");
  downloadBlob(blob, `mybirth-certificate-${slugify(name)}.png`);
}

async function copyLink(btn, url) {
  const original = btn.textContent;
  try {
    await navigator.clipboard.writeText(url);
    btn.textContent = "Link copied";
  } catch {
    btn.textContent = "Copy failed, long-press the URL";
  }
  setTimeout(() => (btn.textContent = original), 2200);
}

/* ---------- tab navigation ---------- */
/*
   The shell used to be Home / Saves, built for a visit that happens once.
   With the Daily Sky it becomes Today / Archive / People: a returning
   visitor lands on the sky, and the form — which they have already filled
   in — is one tab away rather than in the way.
*/
const PANELS = { today: "panel-today", archive: "panel-home", people: "panel-saves" };
// an array, not a NodeList: the arrow-key handler needs find/findIndex
const tabs = [...document.querySelectorAll(".brand__tab")];
const tabPill = document.getElementById("brand-pill");

/* the pill glides to sit under the active tab */
function movePill() {
  const active = document.querySelector(".brand__tab.is-active");
  if (!active || !tabPill) return;
  tabPill.style.width = `${active.offsetWidth}px`;
  tabPill.style.transform = `translateX(${active.offsetLeft}px)`;
}

/*
   A radial wipe between worlds.

   Moving from the archive to the Daily Sky changes the ground the whole
   site stands on, and cross-fading the colours left the two palettes
   briefly muddled together in the middle. This instead takes a snapshot
   of the old page, paints the new one over it, and reveals it through a
   circle growing out of whatever was pressed, so the change reads as one
   deliberate movement with a source rather than as a repaint.

   `startViewTransition` is Chromium-only today. Everywhere else, and for
   anyone who has asked for less motion, `swap()` simply runs and the
   colours travel on their own CSS transitions as before. Nothing depends
   on the animation having happened.
*/
function radialSwap(origin, swap) {
  if (!document.startViewTransition || REDUCED_MOTION) { swap(); return; }

  const root = document.documentElement;
  const x = origin?.x ?? innerWidth / 2;
  const y = origin?.y ?? 0;
  // the circle has to reach the furthest corner, or a wedge of the old
  // page is still showing when the animation ends
  const r = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));

  /*
     Set before the transition starts, not after. The animation itself is
     declared in CSS (see ::view-transition-new(root) there) so it is live
     from the pseudo-element's first frame; these only tell it where the
     circle grows from. `is-wiping` silences every other colour transition
     for the duration, because two animations over one repaint is what
     produced the torn frames.
  */
  root.style.setProperty("--wipe-x", `${x}px`);
  root.style.setProperty("--wipe-y", `${y}px`);
  root.style.setProperty("--wipe-r", `${Math.ceil(r)}px`);
  root.classList.add("is-wiping");

  const done = () => root.classList.remove("is-wiping");
  let t;
  try { t = document.startViewTransition(swap); } catch { swap(); done(); return; }
  t.finished.then(done, done);
}

/** Where a pointer event happened, for the wipe to grow from. */
function originOf(el) {
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

function activateTab(name, { focus = false, origin = null } = {}) {
  const from = currentTab();
  // only the paper/ink boundary is worth a wipe; archive to people is two
  // pages of the same world and a wipe there would be decoration
  const crossesWorlds = (from === "today") !== (name === "today");
  if (crossesWorlds) {
    radialSwap(origin || originOf(tabs.find((t) => t.dataset.tab === name)), () => applyTab(name, focus));
    return;
  }
  applyTab(name, focus);
}

function applyTab(name, focus) {
  tabs.forEach((t) => {
    const active = t.dataset.tab === name;
    t.classList.toggle("is-active", active);
    t.setAttribute("aria-selected", String(active));
    // roving tabindex: only the selected tab is in the tab order, so Tab moves
    // out of the tablist rather than through every tab in it
    t.tabIndex = active ? 0 : -1;
    if (active && focus) t.focus();
  });
  movePill();
  Object.entries(PANELS).forEach(([key, id]) => {
    const panel = document.getElementById(id);
    if (panel) panel.hidden = key !== name;
  });
  if (name === "people") { renderSaves(); trackEvent(EVENTS.PEOPLE_OPEN); }
  if (name === "today") { renderToday(); trackEvent(EVENTS.TODAY_OPEN); }
  /*
     The Daily Sky runs on its own palette, a deliberate break from the rest
     of the site (see today.js). The starfield, aurora and grain are fixed to
     <body> behind every panel, so the switch has to happen at that level
     rather than inside the panel. Every colour involved carries a CSS
     transition, so the two worlds cross-fade instead of cutting.
  */
  document.body.classList.toggle("on-paper", name === "today");
  // unconditionally: leaving Today has to take the sun/moon control out of
  // the tab order again, not only entering it has to put it in
  applySkyTheme(skyTheme());

  /*
     Within one world the arriving panel still lifts into place. Across the
     paper/ink boundary it must not: the wipe is already carrying the whole
     page, and a second animation underneath it reads as a stutter.
  */
  const panel = document.getElementById(PANELS[name]);
  if (panel && !document.startViewTransition) {
    panel.classList.remove("is-entering");
    // reading offsetWidth forces the class removal to land before it is
    // re-added, or the animation never restarts on a repeat switch
    void panel.offsetWidth;
    panel.classList.add("is-entering");
  }

  // the rail belongs to the archive's long scroll; it is appended to <body>
  // rather than to the panel, so it has to be told when it is off-stage
  const rail = document.getElementById("chapter-rail");
  if (rail) rail.hidden = name !== "archive";
  scrollTo({ top: 0, behavior: "auto" });
  rememberTab(name);
}

/*
   Which tab you are on belongs in the URL, and the birth details do not
   belong there while you are somewhere else.

   The query string describes a day in the archive. Carrying it around
   while the visitor reads Today or People meant a reload had two answers
   to the same question: the query said "recover this day", the tab said
   "I was on Today". Naming the tab in the hash settled the argument, but
   only after the archive had already started rendering underneath, which
   is the flicker of the wrong tab appearing first.

   So the query travels with the tab it belongs to. Leaving the archive
   parks it, and coming back restores it, which keeps the address bar
   honest about what is on screen and makes a reload from Today a plain
   visit with nothing to undo.
*/
let lastShareURL = "";

function rememberTab(name) {
  try {
    const search = name === "archive" && !result.hidden && lastShareURL
      ? new URL(lastShareURL, location.origin).search
      : "";
    const want = `${location.pathname}${search}#${name}`;
    if (location.pathname + location.search + location.hash === want) return;
    history.replaceState(null, "", want);
  } catch { /* a hostile history stack is not worth failing over */ }
}

/** Paper or ink, set on <body> so the fixed backdrop and the nav follow it. */
function applySkyTheme(theme) {
  const dark = theme === "dark";
  document.body.classList.toggle("sky-dark", dark);
  const sw = document.getElementById("daynight");
  if (sw) {
    sw.setAttribute("aria-pressed", String(dark));
    // the label names the destination, not the state: a control announced as
    // "ink" while already ink tells a screen-reader user nothing useful
    sw.setAttribute("aria-label", dark ? "Switch the daily sky to paper" : "Switch the daily sky to ink");
    sw.title = dark ? "Paper" : "Ink";
    // out of the tab order entirely while it is off-stage
    sw.tabIndex = document.body.classList.contains("on-paper") ? 0 : -1;
  }
}

/* the sun becomes a moon, and the page turns over from where it was pressed */
document.getElementById("daynight")?.addEventListener("click", (e) => {
  const next = skyTheme() === "dark" ? "light" : "dark";
  radialSwap(
    e.clientX || e.clientY ? { x: e.clientX, y: e.clientY } : originOf(e.currentTarget),
    () => {
      try { localStorage.setItem(SKY_THEME_KEY, next); } catch {}
      applySkyTheme(next);
      renderToday();
    },
  );
});

tabs.forEach((t) => {
  // the wipe grows from the pointer itself when there is one, and from the
  // middle of the tab when the press came from the keyboard
  t.addEventListener("click", (e) => activateTab(t.dataset.tab, {
    origin: e.clientX || e.clientY ? { x: e.clientX, y: e.clientY } : originOf(t),
  }));
});

/* Arrow keys move between tabs, Home and End jump to the ends: the rest of the
   WAI-ARIA tabs pattern that the markup was already claiming to implement. */
document.getElementById("brand-nav")?.addEventListener("keydown", (e) => {
  const keys = ["ArrowRight", "ArrowLeft", "Home", "End"];
  if (!keys.includes(e.key)) return;
  e.preventDefault();
  const i = tabs.findIndex((t) => t.dataset.tab === currentTab());
  const next =
    e.key === "Home" ? 0
    : e.key === "End" ? tabs.length - 1
    : (i + (e.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
  activateTab(tabs[next].dataset.tab, { focus: true });
});

function currentTab() {
  return (tabs.find((t) => t.getAttribute("aria-selected") === "true") || tabs[0]).dataset.tab;
}

/* first position without a transition, then let it glide */
movePill();
requestAnimationFrame(() => tabPill?.classList.add("is-settled"));
addEventListener("resize", movePill);
if (document.fonts?.ready) document.fonts.ready.then(movePill);

/* ---------- brand wordmark: back to start ---------- */
document.getElementById("brand-home").addEventListener("click", () => {
  const home = rootTab();
  if (currentTab() !== home) {
    activateTab(home);
    return;
  }
  if (home === "archive" && !result.hidden) location.href = location.pathname;
  else scrollTo({ top: 0, behavior: "smooth" });
});

/** Where the wordmark goes, and where a plain visit lands. */
function rootTab({ fromLink = false } = {}) {
  // "#new" means the visitor asked for the form, so it beats the saved-day rule
  if (location.hash === "#new") return "archive";
  // a tab written into the hash by rememberTab: honour it across a reload
  const named = location.hash.replace("#", "");
  if (Object.prototype.hasOwnProperty.call(PANELS, named)) return named;
  /*
     Arriving on somebody's shared link with no tab named: show them the
     archive, which is the thing the link is *of*. Only a plain visit falls
     through to whichever tab a returning visitor would want.
  */
  if (fromLink) return "archive";
  return loadSaves().length ? "today" : "archive";
}

/* ---------- saves: persist to localStorage ---------- */
const SAVES_KEY = "mybirth:saves";

function loadSaves() {
  try { return JSON.parse(localStorage.getItem(SAVES_KEY) || "[]"); } catch { return []; }
}

/** A name as a reader would compare it: trimmed, single-spaced, caseless. */
const normalName = (s) => String(s || "").trim().replace(/\s+/g, " ").toLowerCase();

/**
 * Fold a fresh record over a stored one without ever taking anything away.
 *
 * The comment above the old merge claimed a returning visitor gains the
 * birth time and place; the code did the opposite. A birth time is optional
 * in the archive form and coordinates can still be unresolved when the
 * result paints, so a re-run legitimately produces a record with an empty
 * time and a null fix. Spreading that straight over the stored one deleted
 * the time somebody had typed into the Daily Sky and nulled the coordinates
 * its reading depends on. Only real values overwrite now.
 */
function upgrade(stored, fresh) {
  const out = { ...stored };
  for (const [k, v] of Object.entries(fresh)) {
    if (v !== "" && v !== null && v !== undefined) out[k] = v;
  }
  return out;
}

function persistSave(d) {
  const saves = loadSaves();
  const key = `${d.name}|${d.day}|${d.month}|${d.year}`;
  const record = {
    key,
    name: d.name,
    day: d.day,
    month: d.month,
    year: d.year,
    moon: d.moon?.name || "",
    shareURL: d.shareURL || "",
    // the Daily Sky recomputes from these rather than from the rendered page.
    // The coordinates and the zone are what the Ascendant needs, and without
    // an Ascendant there are no sectors and so no reading.
    time: d.time || "",
    placeLabel: d.placeLabel || "",
    lat: d.geo?.lat ?? null,
    lon: d.geo?.lon ?? null,
    tz: d.geo?.timezone || "",
  };
  /*
     Match on the name as a person would read it, not as they typed it.
     The key is built from the raw name, so "Aisha", "aisha" and "Aisha "
     were three different people in the list. The stored key format is left
     alone so that saves written before this still match themselves.
  */
  const same = (s) =>
    s.key === key ||
    (normalName(s.name) === normalName(d.name) &&
      s.day === d.day && s.month === d.month && s.year === d.year);
  const at = saves.findIndex(same);

  // an older record is upgraded in place, so a returning visitor gains the
  // birth time and place the Daily Sky wants without re-entering anything
  if (at >= 0) saves[at] = upgrade(saves[at], record);
  else saves.unshift(record);
  try { localStorage.setItem(SAVES_KEY, JSON.stringify(saves.slice(0, 50))); } catch {}
  // the day you just recovered is the one the Daily Sky should open on
  activeProfileKey = key;
  try { localStorage.setItem(TODAY_KEY, key); } catch {}
  if (at < 0) trackEvent(EVENTS.PERSON_SAVED);
}

/* ---------- the Daily Sky ---------- */
/*
   The habit half of the product. It owns no data of its own: it reads the
   saved people, picks one, and recomputes the whole screen from the engine
   on every open. Which person, and whether the astrology reading shows,
   are the only two things it remembers.
*/
const TODAY_KEY = "mybirth:today";
const ASTRO_KEY = "mybirth:astro";
const SKY_THEME_KEY = "mybirth:sky-theme";

let activeProfileKey = (() => {
  try { return localStorage.getItem(TODAY_KEY) || ""; } catch { return ""; }
})();

/** Paper by default; the choice, once made, is remembered. */
function skyTheme() {
  try { return localStorage.getItem(SKY_THEME_KEY) === "dark" ? "dark" : "light"; } catch { return "light"; }
}

/*
   A short journal of which reading each person has already been shown.

   It does two jobs. Reading it back means today's reading is stable: a
   reload finds its own entry and reuses it rather than rerolling. And it
   lets dailyReading refuse a variant it has used recently, which is what
   turns "probably different" into "cannot be the same". Thirty entries is
   about a month, which is roughly how long a sentence stays memorable.
*/
const JOURNAL_KEY = "mybirth:read";
const JOURNAL_LEN = 30;

function readJournal(key) {
  try { return JSON.parse(localStorage.getItem(`${JOURNAL_KEY}:${key}`) || "[]"); } catch { return []; }
}

function recordReading(key, entry) {
  const journal = readJournal(key).filter((e) => e.d !== entry.d);
  journal.unshift(entry);
  try {
    localStorage.setItem(`${JOURNAL_KEY}:${key}`, JSON.stringify(journal.slice(0, JOURNAL_LEN)));
  } catch {}
}

function renderToday() {
  const mount = document.getElementById("today-mount");
  if (!mount) return;

  const profiles = loadSaves().map(buildProfile).filter(Boolean);
  const active = profiles.find((p) => p.key === activeProfileKey) || profiles[0] || null;
  if (active) activeProfileKey = active.key;

  let astro = false;
  try { astro = localStorage.getItem(ASTRO_KEY) === "1"; } catch {}
  const theme = skyTheme();
  applySkyTheme(theme);

  mount.innerHTML = dailySkyHTML(active, {
    astro, profiles, theme,
    journal: active ? readJournal(active.key) : [],
    onReading: (entry) => active && recordReading(active.key, entry),
  });

  /*
     Whether a visit to Today produced a reading or the birth-time ask.
     The ratio between these two is the only way to know whether requiring
     a time is costing more than it buys.
  */
  /*
     The theme is stored as light/dark and named paper/ink everywhere a
     person can see it, including on a dashboard. The two vocabularies had
     drifted apart here and the property was being dropped by the allow-list
     without a word, so the dimension was never recorded at all.
  */
  trackEvent(EVENTS.TODAY_READ, {
    had_time: active?.ascendant ? "yes" : "no",
    theme: theme === "dark" ? "ink" : "paper",
  });


  // whose sky
  mount.querySelectorAll("[data-profile]").forEach((btn) => {
    btn.addEventListener("click", () => {
      activeProfileKey = btn.dataset.profile;
      try { localStorage.setItem(TODAY_KEY, activeProfileKey); } catch {}
      renderToday();
    });
  });
  // the archive is always one press away, from the empty state too
  mount.querySelectorAll("[data-goto-archive]").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (active?.shareURL) location.href = active.shareURL;
      else activateTab("archive");
    });
  });
  /* the birth time this tab asks for when a save has none */
  wireClock(mount, {
    onValid: (time) => {
      if (!active) return;
      const saves = loadSaves();
      const at = saves.findIndex((x) => x.key === active.key);
      if (at < 0) return;
      saves[at] = { ...saves[at], time };
      try { localStorage.setItem(SAVES_KEY, JSON.stringify(saves)); } catch {}
      // did the birth-time ask convert? that is the whole question about it
      trackEvent(EVENTS.TIME_ADDED);
      renderToday();
    },
  });

  /* astrology is off by default: the astronomy has to stand on its own first */
  mount.querySelector("[data-astro]")?.addEventListener("click", () => {
    try { localStorage.setItem(ASTRO_KEY, astro ? "0" : "1"); } catch {}
    renderToday();
  });

  // the screen is rebuilt on every open and on every profile switch, so the
  // previous tick has to be dropped or they stack up writing to dead nodes
  clearInterval(skyCountdown);
  wireDailySky(mount, { onCountdown: (block) => { skyCountdown = startCountdown(block); } });

  mount.querySelector("[data-fete]")?.addEventListener("click", () => {
    createFete({
      name: active.first,
      age: ageInfo(active.day, active.month, active.year, new Date()).age || 0,
      dateLabel: `${ordinal(active.day)} ${monthName(active.month)}`,
      rehearsal: false,
    }).open();
  });

  /*
     The one thing here that has to be fetched. It arrives into its own
     slot after the rest has painted, exactly as the archive's chapters
     do, and if it never arrives the slot stays empty rather than the
     page waiting on it.
  */
  if (active) {
    spaceWeather().then((w) => {
      const slot = mount.querySelector('[data-slot="space"]');
      if (slot && w) slot.innerHTML = spaceModuleHTML(w);
    });
  }
}
let skyCountdown = null;

/** Astrology is off by default: the astronomy has to stand on its own first. */
function renderSaves() {
  const list = document.getElementById("saves-list");
  const empty = document.getElementById("saves-empty");
  if (!list) return;
  /*
     Records written by earlier versions of the site are still in people's
     browsers, so anything without a usable date is dropped rather than allowed
     to throw on the way into nextBirthday(). The storage key has never changed,
     so there is nothing to migrate, only to tolerate.
  */
  const saves = loadSaves().filter((s) => (
    s && s.name
    && Number.isFinite(+s.day) && +s.day >= 1 && +s.day <= 31
    && Number.isFinite(+s.month) && +s.month >= 1 && +s.month <= 12
    && Number.isFinite(+s.year)
  ));
  if (!saves.length) {
    list.innerHTML = "";
    if (empty) empty.hidden = false;
    return;
  }
  if (empty) empty.hidden = true;

  /*
     Sorted by whose return comes next, not by when they were saved. That one
     change turns a list of past lookups into a calendar of upcoming days,
     which is the thing worth opening the page for.
  */
  const now = new Date();
  const enriched = saves.map((s) => {
    const nb = nextBirthday(s.month, s.day, now);
    const age = ageInfo(s.day, s.month, s.year, now);
    return { ...s, nb, age, days: nb ? Math.floor(nb.msUntil / 86400000) : 9999 };
  }).sort((a, b) => a.days - b.days);

  const fmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long" });

  list.innerHTML = enriched.map((s) => {
    const today = s.nb?.isToday;
    const soon = !today && s.days <= 30;
    const when = today ? "Today"
      : s.days === 1 ? "Tomorrow"
      : `${s.days} days`;
    return `
    <div class="save-card${today ? " is-today" : ""}${soon ? " is-soon" : ""}"
         data-url="${esc(s.shareURL)}" tabindex="0" role="button"
         aria-label="${esc(s.name)}, born ${ordinalShort(s.day)} ${monthName(s.month)} ${s.year}">
      <div class="save-card__top">
        <p class="save-card__name">${esc(s.name)}</p>
        <span class="save-card__countdown">${esc(when)}</span>
      </div>
      <p class="save-card__date">${ordinalShort(s.day)} ${monthName(s.month)} ${s.year}</p>
      <div class="save-card__meta">
        ${Number.isFinite(s.age.age) ? `<span>Turning ${s.age.age + 1}</span>` : ""}
        ${s.nb ? `<span>${esc(fmt.format(s.nb.date))}, a ${esc(s.nb.weekday)}</span>` : ""}
      </div>
      ${s.moon ? `<p class="save-card__moon">Born under a ${esc(s.moon.toLowerCase())}</p>` : ""}
      <button class="save-card__remove" data-remove="${esc(s.key)}"
              aria-label="Remove ${esc(s.name)}" title="Remove">Remove</button>
    </div>`;
  }).join("");

  list.querySelectorAll("[data-remove]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const key = btn.dataset.remove;
      try {
        localStorage.setItem(SAVES_KEY, JSON.stringify(loadSaves().filter((x) => x.key !== key)));
      } catch {}
      renderSaves();
    });
  });
  list.querySelectorAll(".save-card").forEach((card) => {
    const url = card.dataset.url;
    if (!url) return;
    const go = () => { location.href = url; };
    card.addEventListener("click", go);
    card.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") go(); });
  });
}

/* ---------- arrive via a shared link → prefill + auto-generate ---------- */
(function fromURL() {
  initPlaceField();

  const p = new URLSearchParams(location.search);
  if (!p.get("n") || !p.get("d") || !p.get("m") || !p.get("y")) {
    /*
       A plain visit with nothing in the URL. A first-time visitor gets the
       form, which is the whole product to them. Anyone who has saved a day
       has already filled that form in and should never be shown it again as
       a front door: they get the Daily Sky, which is different every morning.
    */
    const landing = rootTab();
    activateTab(landing);
    dropBootVeil(landing === "today" ? "sky" : "space");
    return;
  }

  // links written before the birthplace field carried a country in "c"
  const placeLabel = (p.get("p") || p.get("c") || "").trim();
  const lat = parseFloat(p.get("la")), lon = parseFloat(p.get("lo"));
  // "Town, State, Country" or "Town, Country" or just "Country": the middle
  // slot only exists when there are three parts, or the label reads back
  // duplicated as "Town, Country, Country"
  const parts = placeLabel.split(",").map((s) => s.trim()).filter(Boolean);
  const place = Number.isFinite(lat) && Number.isFinite(lon)
    ? {
        lat, lon, label: placeLabel,
        name: parts[0] || "",
        admin1: parts.length >= 3 ? parts[1] : "",
        country: parts.length >= 2 ? parts[parts.length - 1] : "",
        countryCode: (p.get("cc") || "").trim(),
        timezone: (p.get("tz") || "").trim(),
      }
    : null;

  const inputs = {
    name: p.get("n").trim(),
    day: parseInt(p.get("d"), 10),
    month: parseInt(p.get("m"), 10),
    year: parseInt(p.get("y"), 10),
    placeLabel, place,
    time: (p.get("t") || "").trim()
  };
  if (validate(inputs)) return; // malformed link, just show the landing
  trackEvent(EVENTS.ARCHIVE_START, { entry: "link" });
  /*
     The link is recovered either way, but the tab the visitor was last on
     wins, and it has to win *before* anything renders. Deciding first and
     recovering second is what stops the archive appearing for a beat in
     front of somebody who was reading Today.
  */
  const landing = rootTab({ fromLink: true });
  activateTab(landing);

  // reflect into the form so "recover another" and re-edits stay consistent
  const set = (id, v) => { const el = document.getElementById(id); if (el != null && v) el.value = v; };
  set("f-name", inputs.name); set("f-day", inputs.day);
  set("f-year", inputs.year); set("f-place", placeLabel); set("f-time", inputs.time);
  setMonthField(inputs.month);
  if (place) {
    selectedPlace = place;
    document.getElementById("place-field")?.classList.add("is-resolved");
  }

  /*
     Landing on the archive, runGeneration raises its own veil and takes the
     boot curtain over with it. Landing anywhere else, the tab in front is
     already painted, so the curtain comes down now and the archive is built
     quietly behind it.
  */
  if (landing !== "archive") dropBootVeil(landing === "today" ? "sky" : "space");
  runGeneration(inputs, { reveal: landing === "archive" });
})();
