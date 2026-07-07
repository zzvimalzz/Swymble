/* ============================================================
   main.js — orchestration
   ============================================================ */

import "./style.css";
import QRCode from "qrcode";
import { createMoon } from "./moon.js";
import { createViewer } from "./viewer.js";
import {
  zodiacAnimalObject, gemstoneObject, constellationObject, flowerObject,
  prefetchModelAssets
} from "./models.js";
import { buildTicket } from "./ticket.js";
import { buildCertificate } from "./certificate.js";
import {
  geocode, historicalWeather, onThisDay, yearEvents, countryFacts
} from "./apis.js";
import {
  moonPhase, zodiac, chineseZodiac, birthstone, birthFlower,
  weekday, monthName, prettyDate, ageInfo, lunarMonthsLived,
  generation, lifePath, cosmicOdometer, sunTimes, planetAges
} from "./astro.js";
import {
  movieOfYear, songOfYear, leaderAt, COUNTRIES, worldPopulationAt,
  leadersOf, leadersThatYear
} from "./data.js";
import { GEM_COLORS, ZODIAC_READINGS } from "./cosmos.js";

/* ---------- starfield ---------- */
(function starfield() {
  const canvas = document.getElementById("starfield");
  const ctx = canvas.getContext("2d");
  let stars = [], shooting = null, w, h, dpr, t = 0;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = canvas.width = innerWidth * dpr;
    h = canvas.height = innerHeight * dpr;
    canvas.style.width = innerWidth + "px";
    canvas.style.height = innerHeight + "px";
    const count = Math.round((innerWidth * innerHeight) / 6500);
    stars = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: (Math.random() * 1.3 + 0.2) * dpr,
      tw: Math.random() * Math.PI * 2,
      sp: Math.random() * 0.9 + 0.2,
      hue: Math.random() < 0.15 ? 250 : (Math.random() < 0.5 ? 45 : 220)
    }));
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
    for (const s of stars) {
      const a = 0.35 + Math.sin(t * s.sp + s.tw) * 0.35;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${s.hue}, 70%, 88%, ${Math.max(0.05, a)})`;
      ctx.fill();
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

/* ---------- populate form selects ---------- */
const monthSel = document.getElementById("f-month");
for (let m = 1; m <= 12; m++) {
  const o = document.createElement("option");
  o.value = m;
  o.textContent = monthName(m);
  monthSel.appendChild(o);
}
const dl = document.getElementById("country-list");
COUNTRIES.forEach((c) => {
  const o = document.createElement("option");
  o.value = c;
  dl.appendChild(o);
});

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
    country: (data.get("country") || "").toString().trim(),
    time: (data.get("time") || "").toString(),
    city: (data.get("city") || "").toString().trim(),
    state: (data.get("state") || "").toString().trim()
  };

  const err = validate(inputs);
  if (err) {
    errorEl.textContent = err;
    errorEl.hidden = false;
    return;
  }
  runGeneration(inputs);
});

/** Encode a person's inputs into a revisitable URL (drives the QR code). */
function buildShareURL(i) {
  const p = new URLSearchParams();
  p.set("n", i.name); p.set("d", i.day); p.set("m", i.month);
  p.set("y", i.year); p.set("c", i.country);
  if (i.city) p.set("city", i.city);
  if (i.state) p.set("s", i.state);
  if (i.time) p.set("t", i.time);
  return `${location.origin}${location.pathname}?${p.toString()}`;
}

async function runGeneration(inputs) {
  const { name, day, month, year, country, time, city, state } = inputs;
  const shareURL = buildShareURL(inputs);
  try { history.replaceState(null, "", shareURL); } catch {}

  // start pulling the 3D assets while the veil is up
  prefetchModelAssets();

  // build birth Date in UTC (use given time, else noon to centre the day)
  let hh = 12, mm = 0;
  if (time && /^\d{1,2}:\d{2}/.test(time)) { [hh, mm] = time.split(":").map(Number); }
  const birthDate = new Date(Date.UTC(year, month - 1, day, hh, mm));
  const today = new Date();

  // show veil + rotate lines
  veil.hidden = false;
  let li = 0;
  veilText.textContent = VEIL_LINES[0];
  const lineTimer = setInterval(() => {
    li = (li + 1) % VEIL_LINES.length;
    veilText.textContent = VEIL_LINES[li];
  }, 900);

  // ---- compute deterministic ----
  const moonData = moonPhase(birthDate);
  const zod = zodiac(month, day);
  const cz = chineseZodiac(year);
  const stone = birthstone(month);
  const flower = birthFlower(month);
  const dow = weekday(birthDate);
  const age = ageInfo(day, month, year, today);
  const fullMoons = lunarMonthsLived(birthDate, today);
  const gen = generation(year);
  const lp = lifePath(day, month, year);
  const odo = cosmicOdometer(birthDate, today);
  const planets = planetAges(odo.orbits);
  const population = worldPopulationAt(year);

  // ---- live fetches (fail soft, in parallel) ----
  const iso = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  const placeQuery = [city, state, country].filter(Boolean).join(", ");

  const geoP = geocode(placeQuery)
    .then((g) => g || (city ? geocode(`${city}, ${country}`) : null))
    .then((g) => g || geocode(country));
  const otdP = onThisDay(month, day).catch(() => null);
  const geo = await geoP;
  const [weather, yearNews, otd, homeland] = await Promise.all([
    geo ? historicalWeather(geo.lat, geo.lon, iso).catch(() => null) : Promise.resolve(null),
    yearEvents(year).catch(() => null),
    otdP,
    countryFacts(geo?.countryCode, geo?.country || country).catch(() => null)
  ]);

  const sun = geo ? sunTimes(geo.lat, geo.lon, birthDate, geo.timezone) : null;
  const leader = leaderAt(geo?.countryCode, year);
  const movie = movieOfYear(year);
  const song = songOfYear(year);

  const payload = {
    name, day, month, year, country, city, state, time,
    birthDate, today, moon: moonData, zod, cz, stone, flower, dow, age, fullMoons,
    gen, lp, odo, planets, population, geo, weather, sun, yearNews, otd,
    leader, movie, song, homeland, shareURL
  };

  clearInterval(lineTimer);
  await new Promise((r) => setTimeout(r, 350)); // let the last veil line register

  renderResult(payload);

  veil.hidden = true;
  intro.style.display = "none";
  result.hidden = false;
  scrollTo({ top: 0, behavior: "auto" });
}

function validate({ name, day, month, year, country }) {
  if (!name) return "We need a name to address the ticket to.";
  if (!day || day < 1 || day > 31) return "That day doesn't look right (1–31).";
  if (!month || month < 1 || month > 12) return "Please choose a month.";
  if (!year || year < 1900 || year > 2026) return "Please enter a year between 1900 and 2026.";
  // basic real-date check
  const test = new Date(Date.UTC(year, month - 1, day));
  if (test.getUTCMonth() !== month - 1) return "That date doesn't exist on the calendar.";
  if (!country) return "Tell us the country you were born in.";
  if (!COUNTRIES.some((c) => c.toLowerCase() === country.toLowerCase())) {
    return "Please choose a country from the suggested list.";
  }
  return null;
}

/* ============================================================
   RENDER
   ============================================================ */
function renderResult(d) {
  const placeLabel = [d.city, d.state, d.geo?.country || d.country].filter(Boolean).join(", ");
  const longDate = prettyDate(d.day, d.month, d.year);

  result.innerHTML = `
    <div class="wrap">

      <!-- HERO -->
      <header class="block r-hero">
        <p class="kicker" data-reveal>Transmission recovered</p>
        <h1 class="r-hero__name" data-reveal>Hello,<br/><em>${esc(d.name)}.</em></h1>
        <dl class="r-hero__meta" data-reveal>
          <div><dt>You arrived</dt><dd>${esc(longDate)}</dd></div>
          <div><dt>It was a</dt><dd>${esc(d.dow)}</dd></div>
          <div><dt>On Earth, at</dt><dd>${esc(placeLabel)}</dd></div>
          ${Number.isFinite(d.age.age) ? `<div><dt>That makes you</dt><dd>${d.age.age} years old</dd></div>` : ""}
        </dl>
        <span class="scroll-cue" data-reveal>Scroll to begin<span></span></span>
      </header>

      <!-- MOON -->
      <section class="block">
        <p class="kicker" data-reveal>The sky overhead</p>
        <h2 class="h-section" data-reveal>The moon held a <em>${esc(d.moon.name.toLowerCase())}</em><br/>the night you began.</h2>
        <div class="moon-block mt-l">
          <div class="moon-stage" data-reveal>
            <div class="moon-stage__ring"></div>
            <div id="result-moon" style="position:absolute;inset:0;"></div>
          </div>
          <div class="moon-facts" data-reveal>
            <p class="moon-phase-name">${esc(d.moon.name)} ${d.moon.emoji}</p>
            <div>
              <div class="illum-bar"><span id="illum-fill"></span></div>
              <p class="source"><span id="illum-num">0</span>% illuminated · ${d.moon.age.toFixed(1)} days into the lunar cycle</p>
            </div>
            <dl class="facts">
              <div class="fact"><dt>Phase</dt><dd>${esc(d.moon.name)}</dd></div>
              <div class="fact"><dt>Direction</dt><dd>${d.moon.waxing ? "Waxing" : "Waning"}</dd></div>
              <div class="fact"><dt>Moons since</dt><dd data-count="${d.fullMoons}">0<small>full cycles lived</small></dd></div>
            </dl>
            <p class="source source--live">Computed from orbital mechanics · drag to turn the moon — the phase holds true.</p>
          </div>
        </div>
      </section>

      <!-- YOU / SIGNS — four objects from the almanac, in 3D -->
      <section class="block">
        <p class="kicker" data-reveal>Written in the calendar</p>
        <h2 class="h-section" data-reveal>What the date <em>says about you.</em></h2>
        <div class="plates mt-l">
          ${plateHTML("stage-sign", "Star sign", `${d.zod.symbol}&nbsp; ${esc(d.zod.sign)}`, `${esc(d.zod.element)} sign · its constellation, charted`)}
          ${plateHTML("stage-stone", "Birthstone", esc(d.stone), `${esc(monthName(d.month))}'s stone · cut &amp; lit in 3D`)}
          ${plateHTML("stage-animal", "Chinese zodiac", esc(d.cz.animal), `${esc(d.cz.label)} · the lunar year's animal`)}
          ${plateHTML("stage-flower", "Birth flower", esc(d.flower), `${esc(monthName(d.month))}'s bloom`)}
        </div>
        <p class="source" data-reveal>Drag any object to turn it — it settles back on its own.</p>
        <dl class="facts mt-l" data-reveal>
          <div class="fact"><dt>Day you landed</dt><dd>${esc(d.dow)}</dd></div>
          <div class="fact"><dt>Next birthday</dt><dd data-count="${d.age.daysUntil}">0<small>days away — a ${esc(d.age.nextWeekday)}</small></dd></div>
        </dl>
      </section>

      ${renderNumberEra(d)}

      ${renderAstrology(d)}

      ${renderOdometer(d)}

      ${renderCosmosWide(d)}

      ${renderWeather(d, placeLabel)}

      ${renderHomeland(d)}

      <!-- SOUND & SCREEN -->
      <section class="block">
        <p class="kicker" data-reveal>In the air &amp; on the screen</p>
        <h2 class="h-section" data-reveal>The soundtrack &amp; spectacle<br/>of <em>${d.year}.</em></h2>
        <div class="media mt-l" data-reveal>
          <div class="media__item" style="--glow:rgba(154,127,240,0.18)">
            <div class="media__icon">♫</div>
            <p class="media__type">Defining song</p>
            ${d.song
              ? `<h3 class="media__title">${esc(d.song.split(" — ")[0])}</h3>
                 <p class="media__by">${esc(d.song.split(" — ")[1] || "")}</p>
                 ${musicLinks(d.song)}`
              : `<h3 class="media__title">Off the charts</h3><p class="media__by">Our archive doesn't reach ${d.year} yet.</p>`}
            <p class="media__note source--curated">From our archive of the year</p>
          </div>
          <div class="media__item" style="--glow:rgba(236,217,172,0.16)">
            <div class="media__icon">🎬</div>
            <p class="media__type">Biggest film</p>
            ${d.movie
              ? `<h3 class="media__title">${esc(d.movie)}</h3><p class="media__by">topped the box office</p>`
              : `<h3 class="media__title">The reel's still rolling</h3><p class="media__by">No film logged for ${d.year} yet.</p>`}
            <p class="media__note source--curated">From our archive of the year</p>
          </div>
        </div>
      </section>

      ${renderYearNews(d)}

      ${renderBirthdayPeople(d)}

      ${renderLeader(d)}

      <!-- TICKET -->
      <section class="block ticket-block">
        <p class="kicker center" data-reveal style="justify-content:center">One for the road ahead</p>
        <h2 class="h-section center" data-reveal style="text-align:center">Your boarding pass<br/>to <em>everything next.</em></h2>
        <p class="sub center" data-reveal style="margin:0 auto 50px;text-align:center">
          We've stamped a one-of-a-kind ticket — issued from the day you landed, bound for the future.
        </p>
        <div id="ticket-mount" data-reveal></div>
        <div class="ticket-actions" data-reveal>
          <button class="btn-ghost" id="save-ticket">⤓ Save ticket</button>
        </div>
      </section>

      <!-- CERTIFICATE -->
      <section class="block cert-block">
        <p class="kicker center" data-reveal style="justify-content:center">A keepsake to print</p>
        <h2 class="h-section center" data-reveal style="text-align:center">Your <em>Certificate of Birth.</em></h2>
        <p class="sub center" data-reveal style="margin:0 auto 40px;text-align:center">
          One card — click it to turn it over. The back holds your day's details and a QR code
          that brings anyone straight back to this page.
        </p>
        <div class="cert-controls" data-reveal>
          <div class="cert-sizes" role="group" aria-label="Certificate size">
            <span class="cert-controls__label">Size</span>
            <button type="button" data-size="a4" class="is-active">A4</button>
            <button type="button" data-size="letter">Letter</button>
            <button type="button" data-size="card">Card</button>
          </div>
          <button type="button" class="cert-flip-btn" id="cert-flip-btn">⤺ Turn it over</button>
        </div>
        <div id="cert-view" data-reveal></div>
        <div class="ticket-actions" data-reveal>
          <button class="btn-ghost" id="save-cert">⤓ Save as PDF</button>
          <button class="btn-ghost" id="copy-link">⧉ Copy my link</button>
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

  // ticket — build, mount, then inject QR code into the stub
  const ticketEl = buildTicket({
    name: d.name, day: d.day, month: d.month, year: d.year,
    origin: placeLabel, moon: d.moon, today: d.today, age: d.age.age,
    countryCode: d.geo?.countryCode || "",
    shareURL: d.shareURL
  });
  document.getElementById("ticket-mount").appendChild(ticketEl);
  QRCode.toDataURL(d.shareURL, {
    margin: 1, width: 200, errorCorrectionLevel: "M",
    color: { dark: "#e8e4f4", light: "#0d0f20" }
  })
    .then((url) => {
      ticketEl.querySelectorAll("[data-ticket-qr]").forEach((img) => (img.src = url));
    })
    .catch(() => {});

  // certificate (front + back) — QR is filled in asynchronously
  const certView = document.getElementById("cert-view");
  if (certView) {
    const cert = buildCertificate(d, placeLabel);
    certView.appendChild(cert);
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
      flipBtn.textContent = flip.classList.contains("flipped") ? "⤻ Back to the front" : "⤺ Turn it over";
    };
    flipBtn.addEventListener("click", toggle);
    flip.addEventListener("click", toggle);
    document.querySelectorAll("[data-size]").forEach((b) =>
      b.addEventListener("click", (e) => {
        e.stopPropagation();
        flip.classList.remove("size-a4", "size-letter", "size-card");
        flip.classList.add("size-" + b.dataset.size);
        document.querySelectorAll("[data-size]").forEach((x) => x.classList.toggle("is-active", x === b));
      })
    );
  }

  // wire actions
  const saveTicketBtn = document.getElementById("save-ticket");
  saveTicketBtn.addEventListener("click", () =>
    runSaveAction(saveTicketBtn, () => saveTicketImage(document.getElementById("boarding-pass"), d.name))
  );
  const saveCertBtn = document.getElementById("save-cert");
  saveCertBtn.addEventListener("click", () =>
    runSaveAction(saveCertBtn, () => saveCertificatePDF(document.getElementById("cert-flip"), d.name))
  );
  document.getElementById("restart").addEventListener("click", () => { location.href = location.pathname; });
  const copyBtn = document.getElementById("copy-link");
  if (copyBtn) copyBtn.addEventListener("click", () => copyLink(copyBtn, d.shareURL));

  // animations
  observeReveals(result);
  animateCounts(result);

  // centre the birth-year leader within the horizontal timeline
  const track = document.getElementById("leader-track");
  const activeChip = track?.querySelector("[data-active]");
  if (track && activeChip) {
    track.scrollLeft = activeChip.offsetLeft - track.clientWidth / 2 + activeChip.clientWidth / 2;
  }

  // live, ever-climbing odometer (starts when it scrolls into view)
  const odo = result.querySelector("[data-odometer]");
  if (odo) {
    const oObs = new IntersectionObserver((ents) => {
      ents.forEach((en) => { if (en.isIntersecting) { startOdometer(odo); oObs.disconnect(); } });
    }, { threshold: 0.3 });
    oObs.observe(odo);
  }
  requestAnimationFrame(() => {
    const fill = document.getElementById("illum-fill");
    if (fill) fill.style.width = Math.round(d.moon.illumination * 100) + "%";
    const num = document.getElementById("illum-num");
    if (num) animateNumber(num, Math.round(d.moon.illumination * 100), 1500);
    const dial = document.getElementById("temp-arc");
    if (dial) requestAnimationFrame(() => { dial.style.strokeDasharray = dial.getAttribute("data-target"); });
  });

  // persist this result to saves
  persistSave(d);
}

/* ---- weather section ---- */
function renderWeather(d, placeLabel) {
  if (!d.weather || d.weather.mean == null) {
    return `
      <section class="block">
        <p class="kicker" data-reveal>The weather overhead</p>
        <h2 class="h-section" data-reveal>The skies kept <em>no record.</em></h2>
        <p class="sub" data-reveal>Reliable daily weather only reaches back to 1940, and not every coordinate is covered. For ${esc(placeLabel)} on your day, the archive came back empty — but the sky still ran on schedule.</p>
        ${d.sun ? `<dl class="facts mt-l" data-reveal>${sunFactsHTML(d.sun)}</dl>` : ""}
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
            <span>${w.glyph} mean temp</span>
          </div>
        </div>
        <dl class="facts" data-reveal>
          <div class="fact"><dt>High</dt><dd>${Math.round(w.max)}°C</dd></div>
          <div class="fact"><dt>Low</dt><dd>${Math.round(w.min)}°C</dd></div>
          <div class="fact"><dt>Rain</dt><dd>${w.precip != null ? w.precip.toFixed(1) : "0"}<small>mm of precipitation</small></dd></div>
          <div class="fact"><dt>Wind</dt><dd>${w.wind != null ? Math.round(w.wind) : "—"}<small>km/h peak gust</small></dd></div>
          ${sunFactsHTML(d.sun)}
          <div class="fact"><dt>Conditions</dt><dd>${w.glyph} ${esc(w.summary)}</dd></div>
          <div class="fact"><dt>Source</dt><dd style="font-size:1rem" class="source--live">ERA5 reanalysis<small>via Open-Meteo · measured, not guessed</small></dd></div>
        </dl>
      </div>
    </section>`;
}

function sunFactsHTML(sun) {
  if (!sun) return "";
  if (sun.polar) {
    return `<div class="fact"><dt>Daylight</dt><dd>${sun.polar === "day" ? "Midnight sun" : "Polar night"}<small>the sun ${sun.polar === "day" ? "never set" : "never rose"} that day</small></dd></div>`;
  }
  return `
    <div class="fact"><dt>Sunrise</dt><dd>${esc(sun.sunrise)}<small>local time</small></dd></div>
    <div class="fact"><dt>Sunset</dt><dd>${esc(sun.sunset)}<small>local time</small></dd></div>
    <div class="fact"><dt>Daylight</dt><dd>${sun.daylightHours.toFixed(1)}<small>hours of sun</small></dd></div>`;
}

/* ---- music links ---- */
function musicLinks(song) {
  const q = song.replace(/ — /g, " ");
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
    { id: "stage-stone", glyph: "◆", build: () => gemstoneObject(d.stone, GEM_COLORS[d.stone] || { base: "#9a7ff0", glow: "#ecd9ac" }) },
    { id: "stage-animal", glyph: "福", build: () => zodiacAnimalObject(d.cz.animal, d.cz.element) },
    { id: "stage-flower", glyph: "✿", build: () => flowerObject(d.flower) },
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
        console.warn(`mybirth: ${plate.id} fell back to glyph —`, err);
        el.classList.add("is-fallback");
        el.insertAdjacentHTML("beforeend", `<span class="plate__glyph" aria-hidden="true">${plate.glyph}</span>`);
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
          <div class="era__mark">${gen ? esc(gen.label.split(" ").map((w) => w[0]).join("").slice(0, 2)) : "—"}</div>
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
      <p class="astro-note" data-reveal>★ If you believe in astrology, this one's for you. If you don't — enjoy it purely as a fun read.</p>
      <div class="astro mt-l" data-reveal>
        <div class="astro__glyph" aria-hidden="true">${d.zod.symbol}</div>
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
      <p class="sub" data-reveal>Counting in real time — every figure is climbing as you read this.</p>
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
        <p class="sub" data-reveal>We couldn't pull ${d.year}'s chronicle from Wikipedia just now — refresh and the year should speak up.</p>
      </section>`;
  }
  return `
    <section class="block">
      <p class="kicker" data-reveal>The year the world turned</p>
      <h2 class="h-section" data-reveal>What <em>${d.year}</em> was made of.</h2>
      <p class="sub" data-reveal>Pulled live from Wikipedia's chronicle of the year — each headline links to its source article.</p>

      ${yn.world && yn.world.length ? `
        <div class="news-scope" data-reveal>
          <h3 class="news-scope__h">🌍 Across the world</h3>
          ${newsList(yn.world)}
        </div>` : ""}

      ${yn.malaysia && yn.malaysia.length ? `
        <div class="news-scope" data-reveal>
          <h3 class="news-scope__h">📍 In Malaysia</h3>
          ${newsList(yn.malaysia)}
        </div>` : `
        <p class="source" data-reveal style="margin-top:30px">No dedicated “${d.year} in Malaysia” chronicle was found on Wikipedia.</p>`}

      <p class="source source--live mt-l">Compiled live from Wikipedia.</p>
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

  const card = (p) => `
    <a class="person" ${p.url ? `href="${p.url}" target="_blank" rel="noopener"` : ""}>
      <span class="person__face">${p.thumb
        ? `<img src="${esc(p.thumb)}" alt="" loading="lazy"/>`
        : `<span class="person__initial">${esc((p.name[0] || "·"))}</span>`}</span>
      <span class="person__info">
        <b>${esc(p.name)}</b>
        <span class="person__desc">${esc(p.desc || "")}</span>
        <em>b. ${p.year}</em>
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
      <p class="source source--live mt-l">Pulled live from Wikipedia's “on this day”.</p>
    </section>`;
}

/* ---- leaders: who-that-year + full timeline + world powers ---- */
function renderLeader(d) {
  const l = d.leader;
  const timeline = leadersOf(d.geo?.countryCode);
  const world = leadersThatYear(d.year, d.geo?.countryCode);
  if (!l && !timeline && !world.length) return "";

  const initial = l ? (l.name.replace(/[^A-Za-z]/g, "")[0] || "·") : "·";

  const hero = l ? `
    <div class="leader mt-l" data-reveal>
      <div class="leader__seal">${esc(initial)}</div>
      <div>
        <p class="leader__title">${esc(l.title)} of ${esc(l.country)} · ${d.year}</p>
        <p class="leader__name">${esc(l.name)}</p>
        <p class="leader__years">In office ${l.from}–${l.to ?? "present"}</p>
      </div>
    </div>` : `<p class="sub" data-reveal>Our archive doesn't reach ${esc(d.geo?.country || d.country)}'s leaders yet — but here's how the rest of the world looked.</p>`;

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
          <span class="wleader__name">${w.name ? esc(w.name) : "—"}</span>
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
      <p class="source source--curated mt-l">From our archive of heads of government &amp; state.</p>
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
function renderCosmosWide(d) {
  const popBillions = d.population ? (d.population / 1e9).toFixed(2) : null;
  const planets = (d.planets || [])
    .map((p) => `
      <div class="planet" data-reveal>
        <span class="planet__glyph">${p.glyph}</span>
        <b>${p.age >= 100 ? Math.round(p.age).toLocaleString() : p.age.toFixed(1)}</b>
        <span class="planet__name">${esc(p.name)}-years old</span>
      </div>`)
    .join("");
  return `
    <section class="block">
      <p class="kicker" data-reveal>Out past the atmosphere</p>
      <h2 class="h-section" data-reveal>You against <em>the solar system.</em></h2>
      ${popBillions ? `
        <p class="sub" data-reveal>When you arrived, Earth was already home to about
          <strong style="color:var(--lunar)">${popBillions} billion</strong> people — and it has been
          carrying you around the sun ever since.</p>` : ""}
      <div class="planets mt-l">${planets}</div>
      <p class="source mt-l">Ages scaled by each planet's orbital period · population from UN estimates.</p>
    </section>`;
}

/* ---- homeland (Wikipedia summary + geocoding) ---- */
function renderHomeland(d) {
  const h = d.homeland;
  if (!h || (!h.extract && !h.flag)) return "";
  const coords = d.geo ? `${d.geo.lat.toFixed(2)}°, ${d.geo.lon.toFixed(2)}°` : null;
  const facts = [
    d.geo?.timezone && ["Time zone", d.geo.timezone.replace(/_/g, " ")],
    coords && ["Coordinates", coords],
    h.description && ["In short", h.description]
  ].filter(Boolean);

  return `
    <section class="block">
      <p class="kicker" data-reveal>Your homeland</p>
      <h2 class="h-section" data-reveal>The country that <em>claimed you first.</em></h2>
      <div class="homeland mt-l" data-reveal>
        <div class="homeland__flag">
          <span class="homeland__emoji">${esc(h.flag || "🏳️")}</span>
          ${h.thumb ? `<img src="${esc(h.thumb)}" alt="${esc(h.name)}" loading="lazy"/>` : ""}
          <span class="homeland__name">${esc(h.name)}</span>
        </div>
        <div class="homeland__body">
          ${h.extract ? `<p class="homeland__extract">${esc(h.extract)}</p>` : ""}
          ${facts.length ? `<dl class="facts homeland__facts">${facts.map(([k, v]) => `<div class="fact"><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join("")}</dl>` : ""}
        </div>
      </div>
      <p class="source source--live mt-l">Summary live from Wikipedia · location from Open-Meteo.</p>
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
    btn.textContent = "✓ Saved";
  } catch (err) {
    console.warn("mybirth: save failed —", err);
    btn.textContent = "Save failed";
  }
  setTimeout(() => { btn.textContent = original; btn.disabled = false; }, 2200);
}

function slugify(s) {
  return String(s || "day").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "day";
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
  const rect = ticketEl.getBoundingClientRect();
  const canvas = await renderNodeToCanvas(ticketEl, rect.width, rect.height, Math.max(2, window.devicePixelRatio || 1));
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
  if (!blob) throw new Error("canvas produced no image data");
  downloadBlob(blob, `mybirth-ticket-${slugify(name)}.png`);
}

async function saveCertificatePDF(flipEl, name) {
  const rect = flipEl.getBoundingClientRect();
  const w = Math.round(rect.width);
  const h = Math.round(rect.height);
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

async function copyLink(btn, url) {
  const original = btn.textContent;
  try {
    await navigator.clipboard.writeText(url);
    btn.textContent = "✓ Link copied";
  } catch {
    btn.textContent = "Copy failed — long-press the URL";
  }
  setTimeout(() => (btn.textContent = original), 2200);
}

/* ---------- tab navigation ---------- */
const PANELS = { home: "panel-home", compare: "panel-compare", saves: "panel-saves" };
const tabs = document.querySelectorAll(".brand__tab");
const tabPill = document.getElementById("brand-pill");

/* the pill glides to sit under the active tab */
function movePill() {
  const active = document.querySelector(".brand__tab.is-active");
  if (!active || !tabPill) return;
  tabPill.style.width = `${active.offsetWidth}px`;
  tabPill.style.transform = `translateX(${active.offsetLeft}px)`;
}

function activateTab(name) {
  tabs.forEach((t) => {
    const active = t.dataset.tab === name;
    t.classList.toggle("is-active", active);
    t.setAttribute("aria-selected", String(active));
  });
  movePill();
  Object.entries(PANELS).forEach(([key, id]) => {
    const panel = document.getElementById(id);
    if (panel) panel.hidden = key !== name;
  });
  if (name === "saves") renderSaves();
  scrollTo({ top: 0, behavior: "auto" });
}

tabs.forEach((t) => {
  t.addEventListener("click", () => activateTab(t.dataset.tab));
});

/* first position without a transition, then let it glide */
movePill();
requestAnimationFrame(() => tabPill?.classList.add("is-settled"));
addEventListener("resize", movePill);
if (document.fonts?.ready) document.fonts.ready.then(movePill);

/* ---------- brand wordmark: back to start ---------- */
document.getElementById("brand-home").addEventListener("click", () => {
  const homeActive = document.querySelector("[data-tab='home']")?.classList.contains("is-active");
  if (!homeActive) {
    activateTab("home");
    return;
  }
  if (!result.hidden) location.href = location.pathname;
  else scrollTo({ top: 0, behavior: "smooth" });
});

/* ---------- saves: persist to localStorage ---------- */
const SAVES_KEY = "mybirth:saves";

function loadSaves() {
  try { return JSON.parse(localStorage.getItem(SAVES_KEY) || "[]"); } catch { return []; }
}

function persistSave(d) {
  const saves = loadSaves();
  const key = `${d.name}|${d.day}|${d.month}|${d.year}`;
  if (saves.some((s) => s.key === key)) return;
  saves.unshift({
    key,
    name: d.name,
    day: d.day,
    month: d.month,
    year: d.year,
    moon: d.moon?.name || "",
    shareURL: d.shareURL || "",
  });
  try { localStorage.setItem(SAVES_KEY, JSON.stringify(saves.slice(0, 50))); } catch {}
}

function renderSaves() {
  const list = document.getElementById("saves-list");
  const empty = document.getElementById("saves-empty");
  if (!list) return;
  const saves = loadSaves();
  if (!saves.length) {
    list.innerHTML = "";
    if (empty) empty.hidden = false;
    return;
  }
  if (empty) empty.hidden = true;
  list.innerHTML = saves.map((s) => `
    <div class="save-card" data-url="${esc(s.shareURL)}" tabindex="0" role="button">
      <p class="save-card__name">${esc(s.name)}</p>
      <p class="save-card__date">${ordinalShort(s.day)} · ${monthName(s.month)} · ${s.year}</p>
      ${s.moon ? `<p class="save-card__moon">${esc(s.moon)}</p>` : ""}
    </div>`).join("");
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
  const p = new URLSearchParams(location.search);
  if (!p.get("n") || !p.get("d") || !p.get("m") || !p.get("y") || !p.get("c")) return;
  const inputs = {
    name: p.get("n").trim(),
    day: parseInt(p.get("d"), 10),
    month: parseInt(p.get("m"), 10),
    year: parseInt(p.get("y"), 10),
    country: p.get("c").trim(),
    city: (p.get("city") || "").trim(),
    state: (p.get("s") || "").trim(),
    time: (p.get("t") || "").trim()
  };
  if (validate(inputs)) return; // malformed link → just show the landing

  // reflect into the form so "recover another" and re-edits stay consistent
  const set = (id, v) => { const el = document.getElementById(id); if (el != null && v) el.value = v; };
  set("f-name", inputs.name); set("f-day", inputs.day); set("f-month", inputs.month);
  set("f-year", inputs.year); set("f-country", inputs.country);
  set("f-city", inputs.city); set("f-state", inputs.state); set("f-time", inputs.time);

  runGeneration(inputs);
})();
