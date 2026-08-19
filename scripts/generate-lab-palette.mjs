// Generates src/data/labs/generated/labPalette.ts — one colour palette per lab, extracted from
// that lab's own logo.
//
// Why a build step rather than a canvas in the browser: /labs is prerendered, and sampling on load
// would ship the untinted markup to every crawler and flash the wrong colour at every reader while
// the image decodes. Doing it once here costs a couple of seconds and nothing at runtime.
//
// Why puppeteer rather than an image library: the logos are a mix of PNG and SVG, and there is no
// decoder in this repo that handles both. A browser handles both by definition, and one is already
// a devDependency for the OG cards.
//
// A new lab needs nothing: drop the logo in public/images/labs/ and this picks it up on the next
// build. To override a lab's palette by hand, give it `accentColor` in its data file.

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer';
import { loadLabs } from './lib/lab-data.mjs';
import { NEUTRAL_PALETTE, paletteFromPixels, paletteFromHue, rgbToHsl } from './lib/palette.mjs';

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUTPUT_PATH = path.join(ROOT_DIR, 'src', 'data', 'labs', 'generated', 'labPalette.ts');

/** Big enough to keep a small accent, small enough that the pixel loop is instant. */
const SAMPLE_SIZE = 72;

/** Mime types for the logo formats the site actually ships. */
const MIME = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
};

/**
 * The logo as a data: URI.
 *
 * Not a file:// URL — a page at about:blank cannot read one back out of a canvas, and
 * getImageData throws on the tainted context. Inlining the bytes sidesteps the origin question
 * entirely, and the images are a few KB each.
 */
const asDataUri = async (filePath) => {
  const type = MIME[path.extname(filePath).toLowerCase()];
  if (!type) return null;
  const bytes = await fs.readFile(filePath);
  return `data:${type};base64,${bytes.toString('base64')}`;
};

const readPixels = async (page, fileUrl) =>
  page.evaluate(
    async (url, size) =>
      new Promise((resolve) => {
        const image = new Image();
        image.crossOrigin = 'anonymous';
        image.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = size;
          canvas.height = size;
          const context = canvas.getContext('2d', { willReadFrequently: true });
          // Fit rather than fill: padding an image out with its own edge pixels would weight the
          // palette towards whatever happens to touch the border.
          const scale = Math.min(size / image.naturalWidth, size / image.naturalHeight);
          const width = image.naturalWidth * scale;
          const height = image.naturalHeight * scale;
          context.drawImage(image, (size - width) / 2, (size - height) / 2, width, height);
          resolve(Array.from(context.getImageData(0, 0, size, size).data));
        };
        image.onerror = () => resolve(null);
        image.src = url;
      }),
    fileUrl,
    size,
  );

const size = SAMPLE_SIZE;

const paletteFromAccent = (accent) => {
  const match = /^#?([0-9a-f]{6})$/i.exec(accent.trim());
  if (!match) return null;
  const value = match[1];
  const { h, s, l } = rgbToHsl(
    parseInt(value.slice(0, 2), 16),
    parseInt(value.slice(2, 4), 16),
    parseInt(value.slice(4, 6), 16),
  );
  return paletteFromHue({ h, s, l, confidence: 1 });
};

const run = async () => {
  const labs = await loadLabs();
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  const entries = [];

  for (const lab of labs) {
    // A hand-set accent always wins: extraction is a default, not a policy.
    if (lab.accentColor) {
      const fromAccent = paletteFromAccent(lab.accentColor);
      if (fromAccent) {
        entries.push([lab.id, fromAccent, 'accentColor']);
        continue;
      }
      console.warn(`[lab-palette] ${lab.id}: accentColor "${lab.accentColor}" is not a hex colour.`);
    }

    const relative = (lab.image ?? '').replace(/^\//, '');
    if (!relative) {
      entries.push([lab.id, { ...NEUTRAL_PALETTE }, 'no image']);
      continue;
    }

    const filePath = path.join(ROOT_DIR, 'public', relative);
    try {
      await fs.access(filePath);
    } catch {
      console.warn(`[lab-palette] ${lab.id}: no logo at ${lab.image} — using the neutral palette.`);
      entries.push([lab.id, { ...NEUTRAL_PALETTE }, 'missing']);
      continue;
    }

    const dataUri = await asDataUri(filePath);
    const pixels = dataUri ? await readPixels(page, dataUri) : null;
    if (!pixels) {
      console.warn(`[lab-palette] ${lab.id}: ${lab.image} would not decode — using the neutral palette.`);
      entries.push([lab.id, { ...NEUTRAL_PALETTE }, 'undecodable']);
      continue;
    }

    entries.push([lab.id, paletteFromPixels(pixels), 'logo']);
  }

  await browser.close();

  const body = entries
    .map(
      ([id, palette, source]) =>
        `  '${id}': { bg: '${palette.bg}', tint: '${palette.tint}', glow: '${palette.glow}' }, // ${source}`,
    )
    .join('\n');

  const file = `// GENERATED by scripts/generate-lab-palette.mjs — do not edit.
//
// One palette per lab, taken from the hue of its own logo. Only the hue survives the extraction:
// lightness and saturation are fixed by formula so every bubble stays dark enough to belong to the
// same field. See scripts/lib/palette.mjs.
//
// Regenerate with: npm run generate:lab-palette

export type LabPalette = {
  /** The bubble's base fill. */
  bg: string;
  /** The lit side, for the highlight. */
  tint: string;
  /** What spills onto the page beneath it. */
  glow: string;
};

export const LAB_PALETTE: Record<string, LabPalette> = {
${body}
};

/** What a lab with no palette gets — the ink the field used before any of this existed. */
export const NEUTRAL_LAB_PALETTE: LabPalette = {
  bg: '${NEUTRAL_PALETTE.bg}',
  tint: '${NEUTRAL_PALETTE.tint}',
  glow: '${NEUTRAL_PALETTE.glow}',
};

export const paletteOf = (labId: string): LabPalette => LAB_PALETTE[labId] ?? NEUTRAL_LAB_PALETTE;
`;

  await fs.mkdir(path.dirname(OUTPUT_PATH), { recursive: true });
  await fs.writeFile(OUTPUT_PATH, file, 'utf8');
  console.log(`[lab-palette] wrote ${entries.length} palettes to src/data/labs/generated/labPalette.ts`);
};

run().catch((error) => {
  console.error('[lab-palette] failed:', error);
  process.exitCode = 1;
});
