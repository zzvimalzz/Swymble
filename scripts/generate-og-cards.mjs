// Generates a 1200x630 social card per lab into dist/images/og/<id>.png.
//
// Lab pages previously used the lab's own logo as og:image. Logos are roughly square and social
// cards are 1.91:1, so every shared lab link letterboxed a small square on a grey field — the
// least informative version of a page that has a name, a one-line pitch and a status to show.
//
// Rendered with the Puppeteer instance the build already uses for prerendering, so no new
// dependency and no design tool in the loop. Cards are written into dist/ rather than committed,
// which means editing a lab's tagline regenerates its card on the next deploy instead of leaving
// a stale PNG behind forever.
import { promises as fs } from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer';
import { ROOT_DIR } from './lib/route-data.mjs';
import { loadLabs } from './lib/lab-data.mjs';

const DIST_DIR = path.join(ROOT_DIR, 'dist');
const OUTPUT_DIR = path.join(DIST_DIR, 'images', 'og');
const MANIFEST_PATH = path.join(OUTPUT_DIR, 'manifest.json');
const LOGO_PATH = path.join(ROOT_DIR, 'public', 'images', 'white-logo.png');

const CARD_WIDTH = 1200;
const CARD_HEIGHT = 630;

/** Matches the site's own palette (src/styles/tokens.css) so a card looks like where it leads. */
const INK = '#050505';
const VOLT = '#EFFF04';
const TEXT = '#f0f0f0';
const MUTED = '#a7a7a7';

const escapeHtml = (value) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const readAsDataUri = async (filePath, mimeType) => {
  const buffer = await fs.readFile(filePath);
  return `data:${mimeType};base64,${buffer.toString('base64')}`;
};

const IMAGE_MIME_TYPES = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
};

/**
 * The lab's own logo, embedded from public/.
 *
 * Returns null rather than throwing when the file is missing or an unknown type: a card without
 * the product mark is still a good card, and one lab with a broken image path should not cost
 * the other five their cards.
 */
const readLabMark = async (lab) => {
  const relativePath = lab.image?.replace(/^\//, '');

  if (!relativePath) return null;

  const filePath = path.join(ROOT_DIR, 'public', relativePath);
  const mimeType = IMAGE_MIME_TYPES[path.extname(filePath).toLowerCase()];

  if (!mimeType) {
    console.warn(`[og-cards] ${lab.id}: unsupported logo type "${lab.image}" — card will render without it.`);
    return null;
  }

  try {
    return await readAsDataUri(filePath, mimeType);
  } catch {
    console.warn(`[og-cards] ${lab.id}: logo not found at ${lab.image} — card will render without it.`);
    return null;
  }
};

/** Starting size for the title; shrinkTitleToFit() takes it down from here if it overflows. */
const titleFontSize = (name) => (name.length >= 14 ? 72 : 92);

/**
 * Shrinks the title until it fits its column, measured in the page rather than estimated.
 *
 * Syne ExtraBold is far wider than a rule of thumb suggests — "MyDompet" is eight characters and
 * still overruns a 724px column at 92px — and lab names are not fixed, so any character-count
 * heuristic is one new lab away from a title sitting on top of the product logo. Measuring is
 * the only version of this that stays correct.
 */
const shrinkTitleToFit = (page) =>
  page.evaluate(() => {
    const title = document.querySelector('h1');
    const column = document.querySelector('.body');

    if (!title || !column) return;

    let size = Number.parseFloat(getComputedStyle(title).fontSize);

    // scrollWidth is the content's own width, so it reports the overflow a shrunk flex item hides.
    while (size > 44 && title.scrollWidth > column.clientWidth) {
      size -= 2;
      title.style.fontSize = `${size}px`;
    }
  });

/**
 * Fonts are the site's, loaded from the built CSS's copies in dist/assets. Embedded as data URIs
 * because the page is rendered from a `data:` URL with no origin to resolve relative paths
 * against — and because a card that silently falls back to a system font stops looking like the
 * site the moment it matters most.
 */
const findFontFile = async (pattern) => {
  const assetsDir = path.join(DIST_DIR, 'assets');

  try {
    const entries = await fs.readdir(assetsDir);
    const match = entries.find((entry) => pattern.test(entry));
    return match ? path.join(assetsDir, match) : null;
  } catch {
    return null;
  }
};

const buildCardHtml = async ({ lab, logoDataUri, markDataUri, fonts }) => {
  const name = lab.seoName;
  const tagline = lab.detail?.tagline ?? lab.category;
  const summary = lab.detail?.oneLiner ?? lab.publicSummary;

  const fontFaces = fonts
    .map(
      ({ family, weight, dataUri }) => `
        @font-face {
          font-family: '${family}';
          font-weight: ${weight};
          font-display: block;
          src: url('${dataUri}') format('woff2');
        }`,
    )
    .join('\n');

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>
      ${fontFaces}
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body {
        width: ${CARD_WIDTH}px;
        height: ${CARD_HEIGHT}px;
        background: ${INK};
        color: ${TEXT};
        font-family: 'Syne', sans-serif;
        overflow: hidden;
        position: relative;
      }
      /* Same faint grid as the site's background, and a volt wash in the corner so the card
         reads as Swymble at thumbnail size before any text is legible. */
      .grid {
        position: absolute; inset: 0;
        background-image:
          linear-gradient(rgba(255,255,255,0.045) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.045) 1px, transparent 1px);
        background-size: 48px 48px;
      }
      .wash {
        position: absolute; top: -220px; right: -180px;
        width: 640px; height: 640px; border-radius: 50%;
        background: radial-gradient(circle, rgba(239,255,4,0.16) 0%, rgba(239,255,4,0) 70%);
      }
      .frame {
        position: absolute; inset: 0;
        padding: 64px 76px;
        display: flex; flex-direction: column; justify-content: space-between;
      }
      .top { display: flex; align-items: center; justify-content: space-between; }
      .logo { height: 44px; width: auto; opacity: 0.95; }
      /* Text and product mark share a row. The mark is the fastest way to recognise which lab a
         shared link belongs to — faster than reading the name — so it gets real estate, but the
         text column keeps priority when a name runs long. */
      .main { display: flex; align-items: center; gap: 56px; }
      .mark {
        flex: 0 0 268px; width: 268px; height: 268px;
        display: grid; place-items: center;
      }
      .mark img {
        max-width: 100%; max-height: 100%;
        width: auto; height: auto;
        object-fit: contain;
        /* Rounds the handful of logos that ship with an opaque square background (Cortex), so
           they read as a deliberate tile rather than a hard-edged cut-out on the near-black
           card. Invisible on logos that are already transparent or already rounded. */
        border-radius: 28px;
        /* Lifts a logo off the background without adding a visible container that would fight
           logos which already carry their own shape. */
        filter: drop-shadow(0 10px 26px rgba(0, 0, 0, 0.55));
      }
      .status {
        font-family: 'JetBrains Mono', monospace;
        font-size: 18px; letter-spacing: 0.14em; text-transform: uppercase;
        color: ${INK}; background: ${VOLT};
        padding: 8px 18px; border-radius: 999px; font-weight: 700;
      }
      .body { flex: 1 1 auto; min-width: 0; display: flex; flex-direction: column; gap: 18px; }
      .kicker {
        font-family: 'JetBrains Mono', monospace;
        font-size: 21px; letter-spacing: 0.18em; text-transform: uppercase; color: ${VOLT};
      }
      h1 {
        font-size: ${titleFontSize(name)}px; font-weight: 800; line-height: 0.98; letter-spacing: -0.02em;
      }
      p {
        font-size: 24px; font-weight: 400; line-height: 1.5; color: ${MUTED};
        /* Four lines in the narrower column holds the full ~160-character one-liner, which is
           what the data-integrity test caps them at. The clamp is a guard, not the normal path. */
        display: -webkit-box; -webkit-line-clamp: 4; -webkit-box-orient: vertical; overflow: hidden;
      }
      .foot {
        display: flex; align-items: center; justify-content: space-between;
        font-family: 'JetBrains Mono', monospace; font-size: 20px; letter-spacing: 0.08em;
        color: ${MUTED};
        border-top: 1px solid rgba(255,255,255,0.14); padding-top: 26px;
      }
      .foot strong { color: ${TEXT}; font-weight: 500; }
    </style>
  </head>
  <body>
    <div class="grid"></div>
    <div class="wash"></div>
    <div class="frame">
      <div class="top">
        <img class="logo" src="${logoDataUri}" alt="" />
        <span class="status">${escapeHtml(lab.status)}</span>
      </div>

      <div class="main">
        <div class="body">
          <span class="kicker">${escapeHtml(tagline)}</span>
          <h1>${escapeHtml(name)}</h1>
          <p>${escapeHtml(summary)}</p>
        </div>

        ${markDataUri ? `<div class="mark"><img src="${markDataUri}" alt="" /></div>` : ''}
      </div>

      <div class="foot">
        <span><strong>swymble.com</strong>/labs/${escapeHtml(lab.id)}</span>
        <span>SWYMBLE LABS</span>
      </div>
    </div>
  </body>
</html>`;
};

const run = async () => {
  const labs = await loadLabs();

  if (labs.length === 0) {
    console.log('[og-cards] No labs found — nothing to render.');
    return;
  }

  // Both Syne weights matter: without the 400 face the browser synthesises every weight from the
  // 800 one, which renders the body copy heavy and wide enough to overflow the card.
  const FONT_FACES = [
    { family: 'Syne', weight: 400, pattern: /^syne-latin-400-normal-.*\.woff2$/ },
    { family: 'Syne', weight: 800, pattern: /^syne-latin-800-normal-.*\.woff2$/ },
    { family: 'JetBrains Mono', weight: 700, pattern: /^jetbrains-mono-latin-700-normal-.*\.woff2$/ },
  ];

  const [logoDataUri, ...fontFiles] = await Promise.all([
    readAsDataUri(LOGO_PATH, 'image/png'),
    ...FONT_FACES.map((face) => findFontFile(face.pattern)),
  ]);

  const fonts = [];

  for (const [index, face] of FONT_FACES.entries()) {
    const file = fontFiles[index];
    if (file) {
      fonts.push({ family: face.family, weight: face.weight, dataUri: await readAsDataUri(file, 'font/woff2') });
    }
  }

  if (fonts.length < FONT_FACES.length) {
    console.warn('[og-cards] Some site fonts were not found in dist/assets — cards may use fallback fonts.');
  }

  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  });

  const renderedIds = [];

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: CARD_WIDTH, height: CARD_HEIGHT, deviceScaleFactor: 1 });

    for (const lab of labs) {
      try {
        const markDataUri = await readLabMark(lab);
        const html = await buildCardHtml({ lab, logoDataUri, markDataUri, fonts });
        await page.setContent(html, { waitUntil: 'load' });
        // Wait for fonts *and* the embedded logo: a screenshot taken before the data-URI image
        // has decoded captures an empty box where the product mark should be.
        await page.evaluate(async () => {
          await document.fonts.ready;
          await Promise.all(
            [...document.images].filter((image) => !image.complete).map(
              (image) =>
                new Promise((resolve) => {
                  image.addEventListener('load', resolve, { once: true });
                  image.addEventListener('error', resolve, { once: true });
                }),
            ),
          );
        });
        await shrinkTitleToFit(page);

        await page.screenshot({ path: path.join(OUTPUT_DIR, `${lab.id}.png`), type: 'png' });
        renderedIds.push(lab.id);
      } catch (error) {
        console.warn(`[og-cards] Skipped ${lab.id} (${error.message}) — it will use the default card.`);
      }
    }
  } finally {
    await browser.close();
  }

  // The manifest is how prerender-meta.mjs knows which labs actually have a card. Without it a
  // failed render would leave that lab's page advertising an og:image that 404s, which unfurls
  // worse than the generic card it was replacing.
  await fs.writeFile(MANIFEST_PATH, `${JSON.stringify({ cards: renderedIds }, null, 2)}\n`, 'utf8');

  console.log(`[og-cards] Rendered ${renderedIds.length}/${labs.length} card(s) into ${path.relative(ROOT_DIR, OUTPUT_DIR)}.`);
};

run().catch((error) => {
  // A missing social card is a cosmetic problem; failing the deploy over one is not proportionate.
  // The lab pages fall back to the site's default og-card.png, which is valid, just generic.
  console.warn('[og-cards] Failed to render social cards (non-fatal):', error.message);
});
