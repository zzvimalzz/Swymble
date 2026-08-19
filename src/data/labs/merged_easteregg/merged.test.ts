import { describe, expect, it } from 'vitest';
import { SWYMBLE_LABS } from '../index';
import { MERGED_LABS, mergedFor, mergedKey } from './index';

/**
 * Three checks, and deliberately only three.
 *
 * The cards are hand-written, and the style guide for them is in README.md where it belongs. An
 * earlier version of this file asserted upper-case names, exactly two highlights and a tag of at
 * most twenty-four characters — every one of which went red on copy that was perfectly good, and
 * none of which anything downstream cares about.
 *
 * What is left is the set of mistakes that fail *silently*: a pairing nobody has written, a pair
 * listed in the wrong order, and a mark that is not there.
 */

// The marks on disk, found through Vite rather than `node:fs` — `tsc -b` compiles this file with
// the browser's tsconfig, which has no Node types, and the rule in CLAUDE.md is that nothing in
// `src/` reaches for a Node built-in. Lazy, so nothing is inlined.
const MARK_FILES = new Set(
  Object.keys(
    import.meta.glob('../../../../public/images/labs/merged_easteregg/*.{svg,png,webp,avif}'),
  ).map((path) => path.split('/').at(-1)!),
);

/** A mark may be drawn or rendered — the format is the author's business, the name is not. */
const markFor = (key: string): string | undefined =>
  [...MARK_FILES].find((file) => file.replace(/\.[a-z]+$/, '') === key);

const LABS = SWYMBLE_LABS.filter((lab) => lab.visibility !== 'private');
const IDS = LABS.map((lab) => lab.id);

/** Every pair a reader can actually make, in the order /labs lists them. */
const PAIRS = IDS.flatMap((left, index) => IDS.slice(index + 1).map((right) => [left, right]));

describe('the specimens', () => {
  it('has one written for every pair of labs on the page', () => {
    // Seven labs make 21 pairs. Add a lab and this fails with the seven that still need writing —
    // without it they would quietly fall back to the generator and nobody would notice.
    const missing = PAIRS.filter((pair) => !mergedFor(pair)).map((pair) => mergedKey(pair));

    expect(missing).toEqual([]);
    expect(MERGED_LABS.size).toBe(PAIRS.length);
  });

  it('names two real labs, in the order the page lists them', () => {
    for (const merged of MERGED_LABS.values()) {
      expect(merged.pair).toHaveLength(2);
      for (const id of merged.pair) expect(IDS).toContain(id);

      // The one mistake in this folder that is completely invisible. The fused id is assembled in
      // page order, so a pair written the other way round is never found: the card simply does not
      // appear, the reader gets generated copy instead, and nothing is logged anywhere.
      expect(IDS.indexOf(merged.pair[0])).toBeLessThan(IDS.indexOf(merged.pair[1]));
    }
  });

  it('points at a mark that exists, whatever it was drawn or rendered as', () => {
    for (const merged of MERGED_LABS.values()) {
      const key = mergedKey(merged.pair);
      const file = markFor(key);

      // The name is fixed by the pairing; the format is not. Swapping a drawn SVG for a rendered
      // PNG is a file swap and a one-word edit here, and nothing else has to know.
      expect(file, `no mark on disk for ${key}`).toBeDefined();
      expect(merged.image).toBe(`/images/labs/merged_easteregg/${file}`);
    }
  });
});
