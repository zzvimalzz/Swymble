/* ============================================================
   tools/trim-zodiac.mjs

   The zodiac artwork in public/assets/images/zodiac is 1500x1500 RGB
   with no alpha channel: a black glyph sitting on a solid white square,
   with a lot of air around it. Dropped into the page as <img> that gives
   a white box on the paper and a white box on the ink, and no way to
   recolour the mark.

   This turns each one into something the page can actually use:

     1. find the bounding box of everything that is not paper-white
     2. crop to it, then re-pad to a square so all twelve share one
        optical frame, the way a font's glyphs share an em box
     3. derive alpha from luminance, so black ink becomes opaque and the
        white ground becomes fully transparent
     4. downsample to 256px, which is twice the largest size the page
        ever draws one at

   The result is used as a CSS mask painted with currentColor, so a sign
   inherits its colour from the type around it exactly as the drawn SVGs
   did: ink on paper, cream on ink, gold on the certificate.

   Run: node tools/trim-zodiac.mjs
   ============================================================ */

import { readdirSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const require = createRequire("c:/Users/zzvim/Desktop/Projects/swymble/package.json");
const puppeteer = require("puppeteer");

const HERE = dirname(fileURLToPath(import.meta.url));
const SRC = join(HERE, "..", "public", "assets", "images", "zodiac");
const OUT = join(SRC, "trimmed");

/** anything lighter than this counts as ground, not ink */
const WHITE = 246;
/** padding around the glyph, as a fraction of its longest side */
const MARGIN = 0.06;
const SIZE = 256;

mkdirSync(OUT, { recursive: true });

const files = readdirSync(SRC).filter((f) => f.endsWith(".png"));
const browser = await puppeteer.launch({ headless: "new", args: ["--no-sandbox"] });
const page = await browser.newPage();
await page.goto("about:blank");

for (const file of files) {
  const b64 = readFileSync(join(SRC, file)).toString("base64");
  const out = await page.evaluate(async ({ b64, WHITE, MARGIN, SIZE }) => {
    const img = new Image();
    img.src = "data:image/png;base64," + b64;
    await img.decode();

    const w = img.naturalWidth, h = img.naturalHeight;
    const a = document.createElement("canvas");
    a.width = w; a.height = h;
    const ax = a.getContext("2d", { willReadFrequently: true });
    ax.drawImage(img, 0, 0);
    const px = ax.getImageData(0, 0, w, h).data;

    // 1. bounding box of the ink
    let x0 = w, y0 = h, x1 = -1, y1 = -1;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        // Rec. 709 luminance, which tracks how dark the stroke reads
        const lum = 0.2126 * px[i] + 0.7152 * px[i + 1] + 0.0722 * px[i + 2];
        if (lum < WHITE) {
          if (x < x0) x0 = x;
          if (x > x1) x1 = x;
          if (y < y0) y0 = y;
          if (y > y1) y1 = y;
        }
      }
    }
    if (x1 < 0) return null;

    const cw = x1 - x0 + 1, ch = y1 - y0 + 1;
    const side = Math.max(cw, ch);
    const pad = Math.round(side * MARGIN);
    const box = side + pad * 2;

    // 2. square frame, glyph centred in it.
    //    The frame is filled with white FIRST. A fresh canvas is transparent
    //    black, and step 3 reads luminance 0 there, which would turn the
    //    whole margin fully opaque: the sign then renders as a filled square
    //    with the mark knocked out of it, which is exactly what happened.
    const b = document.createElement("canvas");
    b.width = box; b.height = box;
    const bx = b.getContext("2d", { willReadFrequently: true });
    bx.fillStyle = "#ffffff";
    bx.fillRect(0, 0, box, box);
    bx.drawImage(img, x0, y0, cw, ch,
      Math.round((box - cw) / 2), Math.round((box - ch) / 2), cw, ch);

    // 3. luminance becomes alpha: dark ink opaque, white ground clear
    const d = bx.getImageData(0, 0, box, box);
    const q = d.data;
    for (let i = 0; i < q.length; i += 4) {
      const lum = 0.2126 * q[i] + 0.7152 * q[i + 1] + 0.0722 * q[i + 2];
      q[i] = q[i + 1] = q[i + 2] = 0;
      q[i + 3] = Math.max(0, Math.min(255, Math.round(255 - lum)));
    }
    bx.putImageData(d, 0, 0);

    // 4. down to a sane size, with the browser's own smooth resampler
    const c = document.createElement("canvas");
    c.width = SIZE; c.height = SIZE;
    const cx = c.getContext("2d");
    cx.imageSmoothingEnabled = true;
    cx.imageSmoothingQuality = "high";
    cx.drawImage(b, 0, 0, SIZE, SIZE);

    return { data: c.toDataURL("image/png").split(",")[1], cw, ch, box };
  }, { b64, WHITE, MARGIN, SIZE });

  if (!out) { console.log(file.padEnd(24), "no ink found, skipped"); continue; }

  // capricorn-alt is the only file not named <sign>-sign.png
  const name = file.replace(/-(sign|alt)\.png$/, "") + ".png";
  writeFileSync(join(OUT, name), Buffer.from(out.data, "base64"));
  const kb = Math.round(Buffer.from(out.data, "base64").length / 1024);
  console.log(
    file.padEnd(24), "->", name.padEnd(16),
    `ink ${out.cw}x${out.ch}`.padEnd(16), `frame ${out.box}`.padEnd(12), `${kb}kB`
  );
}

await browser.close();
