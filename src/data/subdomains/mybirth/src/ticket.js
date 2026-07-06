/* ============================================================
   ticket.js — redesigned boarding pass (v2)
   Modern dark glassmorphism design with mouse-tilt effect.
   Fields: MyBirth Lines · Stardust Class · origin country code ·
           destination "The Horizon" · Take Off = birth date ·
           Landing = TBC · QR code stub.
   ============================================================ */

import { monthName } from "./astro.js";

function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

const CABINS   = ["Stardust Class", "Aurora Suite", "Cosmonaut First", "Nebula Lounge", "Orbital Premier"];
const GATE_LTR = "ABCDE";

export function buildTicket(p) {
  const seed = hash(`${p.name}|${p.day}|${p.month}|${p.year}|${p.origin}`);

  const flightNo  = "MB" + String(((seed % 9000) + 1000));
  const seat      = `${(seed % 42) + 1}${"ABCDEF"[seed % 6]}`;
  const gate      = `${GATE_LTR[(seed >> 3) % 5]}${((seed >> 5) % 30) + 1}`;
  const cabin     = CABINS[seed % CABINS.length];
  const zone      = (seed % 4) + 1;

  const countryCode = (p.countryCode || "").toUpperCase() || "??";
  const takeOff  = fmt(p.day, p.month, p.year);
  const boardDate = fmt(
    p.today.getUTCDate(),
    p.today.getUTCMonth() + 1,
    p.today.getUTCFullYear()
  );

  const el = document.createElement("div");
  el.className = "bp-wrap";
  el.innerHTML = `
    <div class="bp" id="boarding-pass">
      <div class="bp__glow bp__glow--a" aria-hidden="true"></div>
      <div class="bp__glow bp__glow--b" aria-hidden="true"></div>
      <div class="bp__body">

        <!-- ─── MAIN PANEL ─── -->
        <div class="bp__main">

          <div class="bp__header">
            <div class="bp__brand">
              <span class="bp__brand-orb" aria-hidden="true"></span>
              <span class="bp__brand-name">MyBirth Lines</span>
            </div>
            <div class="bp__header-right">
              <span class="bp__cabin">${esc(cabin)}</span>
              <span class="bp__one-way">One-Way · Open Horizon</span>
            </div>
          </div>

          <div class="bp__route">
            <div class="bp__port">
              <div class="bp__iata">${esc(countryCode)}</div>
              <div class="bp__city">${esc(truncate(p.origin || "Earth", 22))}</div>
              <div class="bp__port-lbl">Origin</div>
            </div>
            <div class="bp__runway">
              <span class="bp__runway-dot bp__runway-dot--l"></span>
              <span class="bp__runway-spark" aria-hidden="true">✦</span>
              <span class="bp__runway-dot bp__runway-dot--r"></span>
            </div>
            <div class="bp__port bp__port--r">
              <div class="bp__iata bp__iata--dest">∞</div>
              <div class="bp__city">The Horizon</div>
              <div class="bp__port-lbl">Destination</div>
            </div>
          </div>

          <div class="bp__pax-row">
            <span class="bp__field-lbl">Passenger</span>
            <span class="bp__pax-name">${esc(truncate(p.name, 26))}</span>
          </div>

          <div class="bp__cells">
            <div class="bp__cell">
              <span class="bp__field-lbl">Take Off</span>
              <span class="bp__field-val">${takeOff}</span>
            </div>
            <div class="bp__cell">
              <span class="bp__field-lbl">Landing</span>
              <span class="bp__field-val bp__field-val--tbc">TBC</span>
            </div>
            <div class="bp__cell">
              <span class="bp__field-lbl">Gate</span>
              <span class="bp__field-val">${gate}</span>
            </div>
            <div class="bp__cell">
              <span class="bp__field-lbl">Group</span>
              <span class="bp__field-val">Zone ${zone}</span>
            </div>
            <div class="bp__cell">
              <span class="bp__field-lbl">Flight</span>
              <span class="bp__field-val">${flightNo}</span>
            </div>
            <div class="bp__cell">
              <span class="bp__field-lbl">Moon at Launch</span>
              <span class="bp__field-val">${esc(p.moon.name)}</span>
            </div>
          </div>

          <div class="bp__footer-row">
            <span class="bp__footer-brand">mybirth.swymble.com</span>
            <span class="bp__footer-date">Boards ${boardDate}</span>
          </div>

        </div>

        <!-- ─── PERFORATION ─── -->
        <div class="bp__perf" aria-hidden="true">
          <span class="bp__perf-notch bp__perf-notch--t"></span>
          <span class="bp__perf-notch bp__perf-notch--b"></span>
        </div>

        <!-- ─── STUB ─── -->
        <div class="bp__stub">
          <div class="bp__stub-seat">
            <span class="bp__field-lbl">Seat</span>
            <span class="bp__stub-seat-no">${seat}</span>
          </div>

          <div class="bp__stub-moon-wrap">
            <div class="bp__stub-moon"></div>
            <span class="bp__stub-moon-lbl">${esc(p.moon.name)}</span>
          </div>

          <div class="bp__stub-qr-block">
            <img data-ticket-qr alt="Scan to revisit your day" class="bp__stub-qr" width="100" height="100" />
            <span class="bp__stub-scan">Scan to revisit</span>
          </div>

          <div class="bp__stub-fn">
            <span class="bp__field-lbl">Flight</span>
            <span class="bp__stub-fn-val">${flightNo}</span>
          </div>
        </div>

      </div>
    </div>`;

  paintMoon(el.querySelector(".bp__stub-moon"), p.moon.fraction);
  addTilt(el.querySelector(".bp"));
  return el;
}

/* ── helpers ── */

function fmt(day, month, year) {
  return `${String(day).padStart(2, "0")} ${monthName(month).slice(0, 3).toUpperCase()} ${year}`;
}

function paintMoon(node, fraction) {
  if (!node) return;
  node.style.cssText = [
    "width:58px;height:58px;border-radius:50%;",
    "background:radial-gradient(circle at 34% 32%,#fff,#ecd9ac 44%,#6c5d34 100%);",
    "box-shadow:0 0 22px rgba(236,217,172,0.55),inset -9px -6px 16px rgba(0,0,0,0.55);",
    "position:relative;overflow:hidden;"
  ].join("");

  const illum   = (1 - Math.cos(fraction * Math.PI * 2)) / 2;
  const fromLeft = fraction > 0.5;
  const pct      = Math.round(illum * 100);
  const mask     = document.createElement("span");
  mask.style.cssText =
    `position:absolute;inset:0;border-radius:50%;` +
    `background:linear-gradient(${fromLeft ? "to left" : "to right"},transparent ${pct}%,#070810 ${pct}%);` +
    `mix-blend-mode:multiply;`;
  node.appendChild(mask);
}

function addTilt(el) {
  if (!el || window.matchMedia("(hover:none)").matches) return;
  let raf;
  el.addEventListener("mousemove", (e) => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      const r  = el.getBoundingClientRect();
      const dx = (e.clientX - r.left - r.width  / 2) / (r.width  / 2);
      const dy = (e.clientY - r.top  - r.height / 2) / (r.height / 2);
      el.style.transition = "none";
      el.style.transform  =
        `perspective(1100px) rotateY(${dx * 9}deg) rotateX(${-dy * 5}deg) scale(1.018)`;
    });
  });
  el.addEventListener("mouseleave", () => {
    cancelAnimationFrame(raf);
    el.style.transition = "transform 0.9s cubic-bezier(0.22,1,0.36,1)";
    el.style.transform  = "perspective(1100px) rotateY(0deg) rotateX(0deg) scale(1)";
  });
}

function truncate(s, n) { return s.length > n ? s.slice(0, n - 1) + "…" : s; }
function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );
}
