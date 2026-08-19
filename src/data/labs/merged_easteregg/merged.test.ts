import { describe, expect, it } from 'vitest';
import { SWYMBLE_LABS } from '../index';
import { MERGED_LABS, mergedFor, mergedKey } from './index';

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
    // the generated fallback keeps the page working meanwhile, but it is not the finished thing.
    const missing = PAIRS.filter((pair) => !mergedFor(pair)).map((pair) => mergedKey(pair));

    expect(missing).toEqual([]);
    expect(MERGED_LABS.size).toBe(PAIRS.length);
  });

  it('names two real labs, in the order the page lists them', () => {
    for (const merged of MERGED_LABS.values()) {
      expect(merged.pair).toHaveLength(2);

      for (const id of merged.pair) expect(IDS).toContain(id);
      // Page order, not the order somebody happened to type. The fused id is built in page order,
      // so a pair written the other way round would simply never be found.
      expect(IDS.indexOf(merged.pair[0])).toBeLessThan(IDS.indexOf(merged.pair[1]));
    }
  });

  it('reads as a card, and never as a product', () => {
    for (const merged of MERGED_LABS.values()) {
      // Case is the author's business — 'WALLEYE' and 'OogleMap: Oglets Territory' are both
      // names. What is checked is that it is one line, and short enough to be a heading rather
      // than a sentence.
      expect(merged.name.trim()).toBe(merged.name);
      expect(merged.name).toMatch(/^[\p{L}\p{N}][\p{L}\p{N} :.,'&+-]{1,39}$/u);
      expect(merged.category).toMatch(/^[\p{L}\p{N}][\p{L}\p{N} &-]{1,31}$/u);
      expect(merged.tagline).toMatch(/\.$/);
      expect(merged.tagline.length).toBeLessThan(400);
      // As many claims as the card wants. It grows to fit — the count is the author's call, the
      // only rule is that a highlight is a claim and not a word.
      expect(merged.highlights.length).toBeGreaterThan(0);
      expect(merged.highlights.length).toBeLessThanOrEqual(6);
      for (const highlight of merged.highlights) expect(highlight.length).toBeGreaterThan(12);
    }
  });

  it('gives every specimen its own name', () => {
    const names = [...MERGED_LABS.values()].map((merged) => merged.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it('points at a mark that exists on disk, whatever it was drawn or rendered as', () => {
    for (const merged of MERGED_LABS.values()) {
      const key = mergedKey(merged.pair);
      const file = markFor(key);

      // The name is fixed by the pairing; the format is not. Swapping a drawn SVG for a rendered
      // PNG is a file swap and a one-word edit here, and nothing else has to know.
      expect(file, `no mark on disk for ${key}`).toBeDefined();
      expect(merged.image).toBe(`/images/labs/merged_easteregg/${file}`);
    }
  });

  it('has no mark left behind by a pairing that no longer exists', () => {
    const expected = new Set([...MERGED_LABS.values()].map((merged) => mergedKey(merged.pair)));
    const orphans = [...MARK_FILES].filter((file) => !expected.has(file.replace(/\.[a-z]+$/, '')));

    expect(orphans).toEqual([]);
  });

  it('gives every custom tag the shape of a stamp, not a sentence', () => {
    // Caps and up to 40 characters. Long ones wrap onto their own line in the card's label row.
    for (const merged of MERGED_LABS.values()) {
      if (merged.tag === undefined) continue;
      expect(merged.tag).toMatch(/^[A-Z0-9][A-Z0-9 ]{2,39}$/);
    }
  });
});
