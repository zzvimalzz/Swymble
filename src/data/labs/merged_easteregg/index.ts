import type { SwymbleMergedLab } from '../../types';

// THE SPECIMENS — the easter egg on /labs.
// Press one bubble into another that has nowhere to go and the two merge. What comes out is one
// of these: a hand-written card for that exact pairing, with its own drawn mark in
// `public/images/labs/merged_easteregg/`. One file per pair, named `<a>-<b>.ts` after the two lab
// ids in the order /labs lists them — this file discovers and aggregates them automatically.
//
// Seven labs make 21 pairs and every one of them is written. See README.md for the field
// reference and what makes a good one.
//
// Nothing here is a product. It is never linked, never listed in the sitemap, never in llms.txt,
// and it does not appear in the prerendered HTML — a specimen only exists once someone has made
// one with their own hands.

type MergedModule = {
  default: SwymbleMergedLab;
};

// The exclusions are not tidiness. A bare './*.ts' also matches this file's own test, which imports
// `node:fs` — and an eager glob *bundles* what it matches, so the browser build would be asked to
// resolve a Node built-in. See the `no node:fs inside src/` rule in CLAUDE.md.
const mergedModules = import.meta.glob<MergedModule>(['./*.ts', '!./index.ts', '!./*.test.ts'], {
  eager: true,
});

/** The key a pair is looked up by: the two lab ids in page order, joined with a hyphen. */
export const mergedKey = (members: readonly string[]): string => members.join('-');

/**
 * Every authored specimen, by pair key.
 *
 * Keyed off the file's own `pair` rather than its filename, so a file that is renamed without its
 * contents being updated simply stops matching instead of quietly describing the wrong two labs.
 */
export const MERGED_LABS: ReadonlyMap<string, SwymbleMergedLab> = new Map(
  Object.entries(mergedModules)
    .filter(([path]) => !path.endsWith('/index.ts'))
    .map(([, module]) => module.default)
    .filter(Boolean)
    .map((merged) => [mergedKey(merged.pair), merged]),
);

/** The authored specimen for these two labs, or undefined if this pair has not been written yet. */
export const mergedFor = (members: readonly string[]): SwymbleMergedLab | undefined =>
  MERGED_LABS.get(mergedKey(members));
