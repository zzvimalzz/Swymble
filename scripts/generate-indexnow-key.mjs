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

  const keyFilePath = path.join(PUBLIC_DIR, `${key}.txt`);
  await fs.writeFile(keyFilePath, `${key}\n`, 'utf8');
  console.log('[indexnow] Wrote key file:', keyFilePath);
};

run().catch((error) => {
  console.error('[indexnow] Failed to write key file:', error);
  process.exitCode = 1;
});
