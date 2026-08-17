// Draws MyBirth's install icons into src/data/subdomains/mybirth/public/icons/.
//
// Unlike the OG cards, these are committed rather than built. An OG card changes whenever a
// tagline changes; an app icon does not change at all, and regenerating it on every deploy would
// spend a Chromium launch to produce four byte-identical files. Run this by hand — `npm run
// generate:mybirth-icons` — when the mark itself changes, and commit what it writes.
//
// The mark is the moon disc the product already uses, drawn to the same recipe as moonDiscSVG in
// src/ui/today.js: a radial cream gradient, four mare, a thin rim. It is deliberately not the
// wordmark. At 192 pixels on a home screen "mybirth" is four grey smudges, and the disc is the
// one shape the whole product is about.
import { promises as fs } from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer';
import { ROOT_DIR } from './lib/route-data.mjs';

const OUTPUT_DIR = path.join(ROOT_DIR, 'src', 'data', 'subdomains', 'mybirth', 'public', 'icons');

/* src/style.css :root */
const INK = '#05060c';
const INK_2 = '#0a0c16';

/*
   Four icons, and the two numbers that differ.

   `disc` is the disc's diameter as a fraction of the canvas. A maskable icon may be cropped to a
   circle inscribed in the middle 80 per cent, so its disc has to sit well inside that or Android
   shaves the limb off. Every other surface shows the square as drawn, and there the disc can
   breathe closer to the edge.
*/
const ICONS = [
  { file: 'icon-192.png', size: 192, disc: 0.76, ground: 'square' },
  { file: 'icon-512.png', size: 512, disc: 0.76, ground: 'square' },
  { file: 'icon-maskable-512.png', size: 512, disc: 0.56, ground: 'square' },
  // iOS never applies a mask of its own beyond the corner radius, and it composites the icon
  // over white when the PNG has alpha, so this one is opaque like the rest
  { file: 'apple-touch-icon.png', size: 180, disc: 0.72, ground: 'square' },
];

/** The phase drawn on every icon: waxing gibbous, so the terminator is visible and the disc still reads as full. */
const PHASE = 0.36;

const iconHTML = ({ size, disc }) => {
  const r = 50, cx = 60, cy = 60;
  const rx = Math.abs(r * Math.cos(2 * Math.PI * PHASE));
  const waxing = PHASE < 0.5;
  const k = (1 - Math.cos(2 * Math.PI * PHASE)) / 2;
  const outer = waxing ? 0 : 1;
  const inner = waxing === (k >= 0.5) ? 1 : 0;
  const dark =
    `M ${cx} ${cy - r} A ${r} ${r} 0 0 ${outer} ${cx} ${cy + r} ` +
    `A ${rx.toFixed(2)} ${r} 0 0 ${inner} ${cx} ${cy - r} Z`;

  return `<!doctype html>
<html><head><meta charset="utf-8" /><style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: ${size}px; height: ${size}px; }
  body {
    background:
      radial-gradient(120% 110% at 30% 22%, ${INK_2} 0%, ${INK} 62%),
      ${INK};
    display: grid; place-items: center;
  }
  svg { width: ${Math.round(size * disc)}px; height: ${Math.round(size * disc)}px; display: block; }
  /* the mare and the unlit limb are the page's own values, from .mdisc__* in src/style.css */
  .mare { fill: rgba(120, 108, 78, 0.18); }
  .dark { fill: #14120d; }
  /*
     The rim is the one value that cannot be shared. On the page the disc sits on paper and is
     rimmed in ink; here it sits on ink, where an ink rim is the same defect as no rim at all —
     the disc would have no edge along its unlit side. So it is drawn in the moon's own cream.
  */
  .rim { fill: none; stroke: rgba(236, 217, 172, 0.5); stroke-width: 1.2; }
</style></head><body>
  <svg viewBox="0 0 120 120">
    <defs>
      <radialGradient id="m" cx="36%" cy="32%">
        <stop offset="0" stop-color="#fffdf6" />
        <stop offset="0.62" stop-color="#f0e6cd" />
        <stop offset="1" stop-color="#cdbe98" />
      </radialGradient>
    </defs>
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#m)" />
    <circle cx="42" cy="47" r="9" class="mare" />
    <circle cx="70" cy="38" r="5.5" class="mare" />
    <circle cx="63" cy="72" r="11" class="mare" />
    <circle cx="45" cy="76" r="4.5" class="mare" />
    <path d="${dark}" class="dark" />
    <circle cx="${cx}" cy="${cy}" r="${r}" class="rim" />
  </svg>
</body></html>`;
};

const run = async () => {
  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });

  try {
    for (const icon of ICONS) {
      const page = await browser.newPage();
      await page.setViewport({ width: icon.size, height: icon.size, deviceScaleFactor: 1 });
      await page.setContent(iconHTML(icon), { waitUntil: 'load' });
      await page.screenshot({
        path: path.join(OUTPUT_DIR, icon.file),
        type: 'png',
        omitBackground: false,
      });
      await page.close();
      console.log(`icon: ${icon.file} (${icon.size}px)`);
    }
  } finally {
    await browser.close();
  }
};

run().catch((error) => {
  console.error('mybirth icons failed:', error);
  process.exitCode = 1;
});
