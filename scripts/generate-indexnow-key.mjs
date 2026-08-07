// Writes public/<INDEXNOW_KEY>.txt so IndexNow can verify domain ownership.
//
// The protocol checks that https://swymble.com/<key>.txt exists and contains the key. Generating
// it at build time from the env var keeps the key in one place — nothing to remember to commit,
// and rotating it is a matter of changing the variable.
//
// Does nothing when INDEXNOW_KEY is unset. See scripts/submit-indexnow.mjs for the setup steps.
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { ROOT_DIR } from './lib/route-data.mjs';

const PUBLIC_DIR = path.join(ROOT_DIR, 'public');

/** Checked-in .txt files in public/ — mirrors the negations in .gitignore. Never removed. */
const KEEP = new Set(['robots.txt', 'llms.txt', 'llms-full.txt']);

const KEY_SHAPE = /^[A-Za-z0-9-]{8,128}$/;

/**
 * Removes previously-written key files.
 *
 * Rotating the key writes a new file but left the old one in public/, so it kept shipping and
 * kept verifying — the retired key stayed usable for submitting URLs on this domain forever,
 * which defeats the point of rotating it. Only files whose name is itself key-shaped are touched,
 * so nothing a human put in public/ can be caught by this.
 */
const removeStaleKeyFiles = async (currentFileName) => {
  const entries = await fs.readdir(PUBLIC_DIR, { withFileTypes: true });

  for (const entry of entries) {
    const { name } = entry;

    if (!entry.isFile() || !name.endsWith('.txt')) continue;
    if (KEEP.has(name) || name === currentFileName) continue;
    if (!KEY_SHAPE.test(name.slice(0, -'.txt'.length))) continue;

    await fs.rm(path.join(PUBLIC_DIR, name));
    console.log('[indexnow] Removed stale key file:', name);
  }
};

const run = async () => {
  const key = process.env.INDEXNOW_KEY?.trim();

  if (!key) {
    console.log('[indexnow] INDEXNOW_KEY not set — no key file written.');
    return;
  }

  if (!/^[A-Za-z0-9-]{8,128}$/.test(key)) {
    console.warn('[indexnow] INDEXNOW_KEY must be 8-128 characters, letters/digits/dashes only — skipping.');
    return;
  }

  const keyFileName = `${key}.txt`;

  await removeStaleKeyFiles(keyFileName);

  const keyFilePath = path.join(PUBLIC_DIR, keyFileName);
  await fs.writeFile(keyFilePath, `${key}\n`, 'utf8');
  console.log('[indexnow] Wrote key file:', keyFilePath);
};

run().catch((error) => {
  console.error('[indexnow] Failed to write key file:', error);
  process.exitCode = 1;
});
