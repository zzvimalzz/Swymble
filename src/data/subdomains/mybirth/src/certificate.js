/* ============================================================
   certificate.js — a single, flippable "Certificate of Birth".
   One card: click (or the button) to turn it over.
   Front: a framed, official keepsake.
   Back:  the day's dossier + a QR code (filled in by main.js)
          that links back to this exact page.
   Sized A4 / Letter / Card via a class on the flip container;
   typography scales with the card via container query units.
   ============================================================ */

import { monthName, ordinal } from "./astro.js";

const SITE = "mybirth";

function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function serial(d) {
  const str = `${d.name}|${d.day}|${d.month}|${d.year}`;
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  const n = Math.abs(h) % 100000;
  return `MB-${d.year}-${String(n).padStart(5, "0")}`;
}

export function buildCertificate(d, placeLabel) {
  const id = serial(d);
  const firstName = (d.name.split(/\s+/)[0] || d.name);
  const timeBit = d.time ? `, at ${esc(d.time)}` : "";
  const dossier = backFacts(d);
  const twins = (d.otd?.births || []).slice(0, 3).map((p) => p.name);

  const front = `
    <article class="cert-face cert-front">
      <div class="cert-guilloche" aria-hidden="true"></div>
      <div class="cert-frame">
        <span class="cert-corner cert-corner--tl"></span>
        <span class="cert-corner cert-corner--tr"></span>
        <span class="cert-corner cert-corner--bl"></span>
        <span class="cert-corner cert-corner--br"></span>

        <header class="cert-head">
          <span class="cert-org">Office of Celestial Records</span>
          <span class="cert-mark">${SITE}</span>
        </header>

        <div class="cert-center">
          <div class="cert-seal" aria-hidden="true"><span class="cert-seal__moon"></span></div>
          <h3 class="cert-title">Certificate&nbsp;of&nbsp;Birth</h3>
          <div class="cert-rule"><span></span></div>
          <p class="cert-intro">This certifies that</p>
          <p class="cert-name">${esc(d.name)}</p>
          <p class="cert-body">
            arrived upon the Earth on <strong>${esc(d.dow)}, the ${esc(ordinal(d.day))} of
            ${esc(monthName(d.month))}, ${d.year}</strong>${timeBit},<br/>
            beneath a <strong>${esc(d.moon.name)}</strong> in <strong>${esc(placeLabel)}</strong>.
          </p>
          <dl class="cert-micro">
            <div><dt>Star sign</dt><dd>${esc(d.zod.symbol)} ${esc(d.zod.sign)}</dd></div>
            <div><dt>Lunar phase</dt><dd>${esc(d.moon.name)}</dd></div>
            <div><dt>Life path</dt><dd>${d.lp.number} · ${esc(d.lp.title)}</dd></div>
          </dl>
        </div>

        <footer class="cert-foot">
          <div class="cert-sign">
            <span class="cert-sign__name">${SITE}</span>
            <span class="cert-sign__role">Office of Celestial Records</span>
          </div>
          <div class="cert-no">
            <span>Certificate №</span>
            <b>${esc(id)}</b>
          </div>
        </footer>
      </div>
    </article>`;

  const back = `
    <article class="cert-face cert-back">
      <div class="cert-guilloche" aria-hidden="true"></div>
      <div class="cert-frame">
        <span class="cert-corner cert-corner--tl"></span>
        <span class="cert-corner cert-corner--tr"></span>
        <span class="cert-corner cert-corner--bl"></span>
        <span class="cert-corner cert-corner--br"></span>

        <header class="cert-head">
          <span class="cert-org">The record of the day</span>
          <span class="cert-mark">${SITE}</span>
        </header>

        <h3 class="cert-back-title">The world the day <em>${esc(firstName)}</em> arrived</h3>

        <div class="cert-back-grid">
          <dl class="cert-dossier">
            ${dossier.map((f) => `<div><dt>${esc(f[0])}</dt><dd>${esc(f[1])}</dd></div>`).join("")}
          </dl>
          <aside class="cert-qr">
            <img data-qr alt="QR code linking back to this page" width="150" height="150" />
            <p class="cert-qr__cap">Scan to revisit<br/>${esc(firstName)}'s universe</p>
            <p class="cert-qr__url">${esc(shortUrl(d.shareURL))}</p>
          </aside>
        </div>

        ${twins.length ? `<p class="cert-twins">Born the same day as ${esc(twins.join(", "))}.</p>` : ""}

        <footer class="cert-foot cert-foot--back">
          <span>Issued by ${SITE} · Office of Celestial Records</span>
          <span>№ ${esc(id)}</span>
        </footer>
      </div>
    </article>`;

  const wrap = document.createElement("div");
  wrap.className = "cert-stage";
  wrap.innerHTML = `
    <div class="cert-flip size-a4" id="cert-flip" title="Click to flip">
      <div class="cert-flip__inner">
        ${front}
        ${back}
      </div>
    </div>`;
  return wrap;
}

function backFacts(d) {
  const out = [];
  out.push(["Day of the week", d.dow]);
  out.push(["Moon", `${d.moon.name} · ${Math.round(d.moon.illumination * 100)}% lit`]);
  if (d.song) out.push(["№1 song", d.song]);
  if (d.movie) out.push(["Biggest film", d.movie]);
  if (d.weather && d.weather.mean != null) out.push(["Weather", `${Math.round(d.weather.mean)}°C, ${d.weather.summary.toLowerCase()}`]);
  if (d.sun && !d.sun.polar) out.push(["Sun", `rose ${d.sun.sunrise}, set ${d.sun.sunset}`]);
  if (d.population) out.push(["People on Earth", `~${(d.population / 1e9).toFixed(2)} billion`]);
  if (d.leader) out.push([d.leader.title, d.leader.name]);
  out.push(["Chinese zodiac", d.cz.label]);
  out.push(["Birthstone", d.stone]);
  out.push(["Birth flower", d.flower]);
  if (d.gen) out.push(["Generation", d.gen.label]);
  return out.slice(0, 12);
}

function shortUrl(url) {
  try {
    const u = new URL(url);
    return (u.host + u.pathname).replace(/\/$/, "") + "/…";
  } catch {
    return url;
  }
}
