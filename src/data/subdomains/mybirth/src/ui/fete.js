/* ============================================================
   fete.js — what the page does on the day itself.

   Design brief: this is the one moment the whole site builds to, and
   it is also the easiest thing here to make tacky. So there is no
   paper confetti, no primary colours, no cartoon cake and no sound
   that starts without being asked for. It uses the same palette and
   the same serif as the rest of the archive.

   What happens instead: the age appears as numerals, a candle rises
   under each digit and lights. You put them out, one at a time, and
   each one leaves a thread of smoke. When the last goes out the dark
   fills with slow rising embers and a single line of type.

   Everything is drawn on one canvas except the type, which stays as
   DOM so it renders in the real typeface at full sharpness.
   ============================================================ */

const REDUCED = matchMedia("(prefers-reduced-motion: reduce)").matches;

const PALETTE = {
  flameCore: [255, 233, 196],
  flameMid: [244, 190, 110],
  flameOuter: [214, 122, 52],
  smoke: [183, 179, 204],
  ember: [236, 217, 172],
  emberAlt: [154, 127, 240],
  emberCool: [111, 227, 210],
};
const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;

/**
 * Build the celebration overlay.
 *
 * @param {object} opts
 * @param {string} opts.name    the person's first name
 * @param {number} opts.age     orbits completed, one candle per digit
 * @param {string} opts.dateLabel  e.g. "9 July"
 * @param {boolean} [opts.rehearsal]  true when opened outside the real day
 * @returns {{open:()=>void, close:()=>void, el:HTMLElement}}
 */
export function createFete({ name, age, dateLabel, rehearsal = false }) {
  const digits = String(Math.max(0, age || 0)).split("");

  const root = document.createElement("div");
  root.className = "fete";
  root.setAttribute("role", "dialog");
  root.setAttribute("aria-modal", "true");
  root.setAttribute("aria-label", `${name}'s return`);
  root.innerHTML = `
    <canvas class="fete__cv" aria-hidden="true"></canvas>
    <div class="fete__stage">
      <p class="fete__kicker">${rehearsal ? "A rehearsal" : "Today"}</p>
      <div class="fete__digits" aria-label="${age} orbits completed">
        ${digits.map((d) => `<span class="fete__digit">${d}</span>`).join("")}
      </div>
      <p class="fete__caption">orbits complete</p>
      <p class="fete__prompt">Put them out</p>
      <p class="fete__line">
        <span>Happy birthday, ${escapeHTML(name)}.</span>
        <em>The sun is exactly where it was the moment you began.</em>
      </p>
      <div class="fete__actions">
        <button type="button" class="fete__btn" data-blow>Blow them all out</button>
        <button type="button" class="fete__btn fete__btn--quiet" data-close>Close</button>
      </div>
    </div>`;

  const cv = root.querySelector(".fete__cv");
  const ctx = cv.getContext("2d");
  const digitEls = [...root.querySelectorAll(".fete__digit")];
  const blowBtn = root.querySelector("[data-blow]");
  const closeBtn = root.querySelector("[data-close]");

  let W = 0, H = 0, dpr = 1;
  let candles = [];
  let smoke = [];
  let embers = [];
  let raf = null;
  let t = 0;
  let finished = false;

  /*
     One clock for the whole overlay, read from performance.now() rather than
     accumulated inside the render loop. Timestamps recorded outside a frame
     (when a candle is lit, when one is blown out) then share the same time
     base as the frame that draws them, so a dropped or throttled frame can
     never leave a flame stuck part-way lit.
  */
  let t0 = 0;
  const clock = () => (performance.now() - t0) / 1000;

  /* ---- layout: candles are placed under the real glyph boxes ---- */
  function measure() {
    dpr = Math.min(devicePixelRatio || 1, 2);
    W = root.clientWidth; H = root.clientHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    /*
       Update the candles in place rather than rebuilding the array. The
       lighting sequence schedules a timeout per candle holding a direct
       reference; replacing the objects here (this runs on every resize) would
       leave those timeouts writing to orphans, and the candles would simply
       never light. An orientation change or a mobile URL bar collapsing during
       the opening second was enough to trigger it.
    */
    const rootBox = root.getBoundingClientRect();
    digitEls.forEach((el, i) => {
      const b = el.getBoundingClientRect();
      const c = candles[i] || (candles[i] = {
        lit: false, light: 0, litAt: 0, outAt: null, seed: i * 37.7, wobble: 0,
      });
      c.x = b.left - rootBox.left + b.width / 2;
      // the taper stands ON the numeral: its foot is the top edge of the glyph
      // box, nudged down so it reads as planted, and it is drawn upward
      c.base = b.top - rootBox.top + 8;
      c.h = Math.max(38, Math.min(70, b.height * 0.4));
    });
    candles.length = digitEls.length;
  }

  /* ---- the flame ---- */
  function drawFlame(c) {
    const k = c.light;
    if (k <= 0.001) return;

    // flicker: two slow sines beating against each other, never a hard random
    const f = Math.sin(t * 5.1 + c.seed) * 0.5 + Math.sin(t * 8.7 + c.seed * 1.7) * 0.5;
    const lean = f * 1.6 + c.wobble;
    const hgt = (16 + f * 2.4) * k;
    const wid = (5.4 + f * 0.5) * k;
    const tipX = c.x + lean;
    const midY = c.base - c.h - hgt * 0.42;

    ctx.save();
    ctx.globalCompositeOperation = "lighter";

    // the glow it throws onto the dark
    const glow = ctx.createRadialGradient(c.x, c.base - c.h - 6, 0, c.x, c.base - c.h - 6, 62 * k);
    glow.addColorStop(0, rgba(PALETTE.flameMid, 0.24 * k));
    glow.addColorStop(1, rgba(PALETTE.flameMid, 0));
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(c.x, c.base - c.h - 6, 62 * k, 0, 7);
    ctx.fill();

    // outer body, then a brighter core inside it
    const body = (w, h, col, alpha) => {
      ctx.beginPath();
      ctx.moveTo(c.x - w, c.base - c.h);
      ctx.quadraticCurveTo(c.x - w * 0.9, midY, tipX, c.base - c.h - h);
      ctx.quadraticCurveTo(c.x + w * 0.9, midY, c.x + w, c.base - c.h);
      ctx.closePath();
      ctx.fillStyle = rgba(col, alpha);
      ctx.fill();
    };
    body(wid, hgt, PALETTE.flameOuter, 0.5 * k);
    body(wid * 0.62, hgt * 0.78, PALETTE.flameMid, 0.62 * k);
    body(wid * 0.3, hgt * 0.46, PALETTE.flameCore, 0.92 * k);
    ctx.restore();
  }

  /* ---- the taper ---- */
  function drawCandle(c) {
    const w = 5;
    const g = ctx.createLinearGradient(c.x - w, 0, c.x + w, 0);
    g.addColorStop(0, "rgba(236,226,200,0.28)");
    g.addColorStop(0.45, "rgba(240,232,210,0.68)");
    g.addColorStop(1, "rgba(180,172,150,0.3)");
    ctx.fillStyle = g;
    ctx.fillRect(c.x - w, c.base - c.h, w * 2, c.h);

    // wick
    ctx.strokeStyle = c.light > 0.02 ? "rgba(60,48,40,0.9)" : "rgba(120,112,132,0.75)";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(c.x, c.base - c.h);
    ctx.lineTo(c.x, c.base - c.h - 5);
    ctx.stroke();
  }

  function puff(c) {
    for (let i = 0; i < 16; i++) {
      smoke.push({
        x: c.x + (Math.random() - 0.5) * 5,
        y: c.base - c.h - 6,
        vx: (Math.random() - 0.5) * 0.32,
        vy: -(0.5 + Math.random() * 0.7),
        r: 2 + Math.random() * 3.5,
        life: 1,
        decay: 0.006 + Math.random() * 0.006,
      });
    }
  }

  function celebrate() {
    if (finished) return;
    finished = true;
    root.classList.add("is-finished");
    if (REDUCED) return;
    for (let i = 0; i < 90; i++) spawnEmber(true);
  }

  function spawnEmber(initial = false) {
    const tone = Math.random();
    const col = tone < 0.62 ? PALETTE.ember : tone < 0.85 ? PALETTE.emberAlt : PALETTE.emberCool;
    embers.push({
      x: Math.random() * W,
      y: initial ? H + Math.random() * H * 0.7 : H + 12,
      vy: -(0.22 + Math.random() * 0.55),
      drift: (Math.random() - 0.5) * 0.24,
      r: 0.7 + Math.random() * 2.1,
      col,
      life: 1,
      decay: 0.0016 + Math.random() * 0.0024,
      tw: Math.random() * Math.PI * 2,
    });
  }

  /* ---- extinguishing ---- */
  function blowOut(c) {
    if (!c.lit) return;
    c.lit = false;
    c.outAt = clock();
    puff(c);
    if (candles.every((x) => !x.lit)) setTimeout(celebrate, 420);
  }

  /** Light a candle, stamping when so the flame can grow on a clock. */
  function light(c) {
    if (c.lit) return;
    c.lit = true;
    c.litAt = clock();
    c.outAt = null;
  }

  function blowAll() {
    candles.forEach((c, i) => setTimeout(() => blowOut(c), i * 180));
  }

  /* ---- the loop ---- */
  /*
     Everything here is driven by elapsed time rather than by frame count, so
     the animation looks the same on a 60Hz screen, a 120Hz screen, and a
     throttled background tab. A per-frame lerp would run at whatever rate the
     device happened to offer.
  */
  const LIGHT_UP = 0.34;    // seconds for a flame to take
  const SNUFF = 0.14;       // seconds for one to die

  function frame() {
    t = clock();
    ctx.clearRect(0, 0, W, H);

    for (const c of candles) {
      if (c.lit) {
        c.light = Math.min(1, (t - c.litAt) / LIGHT_UP);
      } else if (c.outAt != null) {
        c.light = Math.max(0, 1 - (t - c.outAt) / SNUFF);
      }
      c.wobble *= 0.92;
      drawCandle(c);
      drawFlame(c);
    }

    for (let i = smoke.length - 1; i >= 0; i--) {
      const s = smoke[i];
      s.x += s.vx; s.y += s.vy; s.vy *= 0.995; s.r += 0.22; s.life -= s.decay;
      if (s.life <= 0) { smoke.splice(i, 1); continue; }
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, 7);
      ctx.fillStyle = rgba(PALETTE.smoke, s.life * 0.1);
      ctx.fill();
    }

    if (finished && !REDUCED) {
      if (embers.length < 150 && Math.random() < 0.5) spawnEmber();
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      for (let i = embers.length - 1; i >= 0; i--) {
        const e = embers[i];
        e.y += e.vy; e.x += e.drift; e.life -= e.decay;
        if (e.life <= 0 || e.y < -20) { embers.splice(i, 1); continue; }
        const a = e.life * (0.45 + 0.4 * Math.abs(Math.sin(e.tw + t * 1.6)));
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.r, 0, 7);
        ctx.fillStyle = rgba(e.col, a * 0.85);
        ctx.fill();
      }
      ctx.restore();
    }

    raf = requestAnimationFrame(frame);
  }

  /* ---- interaction ---- */
  root.addEventListener("pointerdown", (e) => {
    if (e.target.closest(".fete__btn")) return;
    const b = root.getBoundingClientRect();
    const px = e.clientX - b.left, py = e.clientY - b.top;
    let nearest = null, best = Infinity;
    for (const c of candles) {
      if (!c.lit) continue;
      const d = Math.hypot(px - c.x, py - (c.base - c.h - 10));
      if (d < best) { best = d; nearest = c; }
    }
    // a generous target: the flame itself is only a few pixels wide
    if (nearest && best < 90) blowOut(nearest);
    else candles.forEach((c) => { if (c.lit) c.wobble = (Math.random() - 0.5) * 5; });
  });

  blowBtn.addEventListener("click", blowAll);
  closeBtn.addEventListener("click", () => api.close());
  const onKey = (e) => {
    if (e.key === "Escape") api.close();
    if (e.key === "Enter" || e.key === " ") {
      if (document.activeElement === root) { e.preventDefault(); blowAll(); }
    }
  };

  const api = {
    el: root,
    open() {
      t0 = performance.now();
      document.body.appendChild(root);
      document.body.style.overflow = "hidden";
      addEventListener("resize", measure);
      addEventListener("keydown", onKey);
      requestAnimationFrame(() => {
        measure();
        root.classList.add("is-open");
        // light them in sequence, left to right, once the type has settled
        if (REDUCED) {
          // Backdate the light so the frame loop computes a full flame at once.
          // Setting c.light directly would be overwritten on the next frame,
          // which recomputes it from litAt.
          candles.forEach((c) => { light(c); c.litAt = clock() - LIGHT_UP; });
        } else {
          candles.forEach((c, i) => setTimeout(() => light(c), 620 + i * 190));
        }
        raf = requestAnimationFrame(frame);
        closeBtn.focus();
      });
    },
    close() {
      root.classList.remove("is-open");
      cancelAnimationFrame(raf);
      removeEventListener("resize", measure);
      removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      setTimeout(() => root.remove(), 600);
    },
  };
  return api;
}

function escapeHTML(s) {
  return String(s).replace(/[&<>"']/g, (c) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
  ));
}
