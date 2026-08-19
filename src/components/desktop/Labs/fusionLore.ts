/**
 * What two labs become when they are squeezed into one bubble.
 *
 * Every pairing that exists today is **written and drawn** — one file per pair in
 * `data/labs/merged_easteregg/`, with its own mark in `public/images/labs/merged_easteregg/`.
 * Look there first; this file only decides which one applies.
 *
 * The generator underneath it is the safety net, not the product. Seven labs make 21 pairs and an
 * eighth would make 28, so an unwritten pair still gets a card: the two labs' own opening clauses
 * in apposition, and a name made of slices of both titles. It is meant to read as almost coherent
 * until somebody writes the real one.
 *
 * Pure and deterministic, like the rest of this folder: the same two labs always make the same
 * specimen, so a test can pin the output and the reader can find the same creature twice.
 */

import type { SwymbleLab } from '../../../data/types';
import { LAB_FUSION } from '../../../data/labFusion';
import { membersOf } from './bubbleFusion';
import { mergedFor } from '../../../data/labs/merged_easteregg';

export type FusionSpecimen = {
  /** The fused bubble's id, so the card and the bubble cannot disagree about which one this is. */
  id: string;
  name: string;
  category: string;
  /** The chip in place of a lab status — the specimen’s own `tag`, or UNSTABLE. */
  status: string;
  tagline: string;
  highlights: string[];
  /** The labs inside, in page order. The card names them; the bubble falls back to their logos. */
  members: SwymbleLab[];
  /** The drawn mark for this pairing, when one has been made. Without it the bubble stitches the
   *  two real logos together instead — see BubbleField. */
  image?: string;
  /** False when this pairing has not been written yet and the copy above was generated from the
   *  two labs' own data. Every pair that exists today is authored. */
  authored: boolean;
};

/** Long enough to still read as a word, short enough to fit the bubble and the card's heading. */
const MAX_NAME = 16;

/**
 * The front of one name welded to the back of another. Halves rather than syllables: a syllable
 * splitter would be more correct and much less funny, and the ugly seams are the point.
 *
 * A repeated letter at the seam is collapsed, because OGLLETS reads as a typo where OGLETS reads
 * as a creature.
 */
export const chimeraName = (titles: readonly string[]): string => {
  // Titles are not all one word — WATCH PAINT DRY is three. Closing the gaps first keeps the
  // slices honest and stops the result coming out as a name with a space in the middle of it.
  const clean = titles.map((title) => title.replace(/\s+/g, '')).filter(Boolean);
  if (clean.length === 0) return '';
  if (clean.length === 1) return clean[0];

  // Each title gives up the slice of *itself* that sits where it sits in the queue: the first
  // lends its front, the last its back, and anything in between the middle it happens to hold.
  // Folding the names two at a time instead loses the middle ones entirely — a three-way came
  // out with the same word as one of its own pairs.
  const pieces = clean.map((title, index) => {
    // Rounded outwards at both ends. An exact split of an odd-length title loses the middle
    // letter and the name comes out clipped — WATCHPTEX rather than WATCHPATEX.
    const from = Math.floor((index * title.length) / clean.length);
    const to = Math.ceil(((index + 1) * title.length) / clean.length);
    // A short title in a long chain can be sliced down to nothing. One letter is still a
    // contribution; none at all would quietly drop a lab out of its own name.
    return title.slice(from, to) || title.slice(Math.min(index, title.length - 1), Math.min(index, title.length - 1) + 1);
  });

  const word = pieces.reduce((left, right) =>
    // A repeated letter at a seam is collapsed: OGLLETS reads as a typo where OGLETS reads as a
    // creature.
    left.slice(-1) === right.slice(0, 1) ? `${left}${right.slice(1)}` : `${left}${right}`,
  );

  return word.length > MAX_NAME ? word.slice(0, MAX_NAME) : word;
};

/** Two titles, which is the case the reader makes most of. */
export const portmanteau = (left: string, right: string): string => chimeraName([left, right]);

const words = (text: string): string[] => text.trim().split(/\s+/).filter(Boolean);

const firstWord = (text: string): string => words(text)[0] ?? text;
const lastWord = (text: string): string => words(text).at(-1) ?? text;

/** Where a lab's summary stops describing what the thing *is* and starts on the detail. */
const BOUNDARY = /[,.;:]/;

/** Longest an opening clause may run before it is cut at a word. Every lab summary reaches a
 *  boundary well before this; the cap is for one that does not. */
const CLAUSE_WORDS = 18;

/**
 * The part of a summary that names the product: everything up to the first comma, full stop,
 * colon or semicolon.
 *
 * Every lab on the page opens the same way — 'A small creature made mostly of eyes',
 * 'An offline-first money tracker for Android and iOS' — which is what makes two of them
 * joinable at all.
 */
const openingClause = (text: string): string => {
  const boundary = text.search(BOUNDARY);
  const clause = boundary > 0 ? text.slice(0, boundary) : text;
  const trimmed = words(clause).slice(0, CLAUSE_WORDS).join(' ');
  return trimmed.replace(/[.,;:\s]+$/, '');
};

/**
 * Two products described as though they were one, by apposition — the shape a real product line
 * uses for a subtitle, holding two things that have no business being the same thing.
 *
 * An earlier version welded the front of one summary to the *back* of the other. It produced
 * fragments with no subject ('A small creature made mostly of eyes, let surprise you') because a
 * clause lifted off the end of a sentence does not stand on its own. Two openings always do.
 */
export const spliceSummaries = (left: string, right: string): string => {
  const tail = openingClause(right);
  return `${openingClause(left)}, ${tail.charAt(0).toLowerCase()}${tail.slice(1)}.`;
};

/**
 * A category that sounds like a real one and is not. The second lab's first word in front of the
 * first lab's last word — 'BROWSER CREATURE' and 'MEDIA DISCOVERY' give 'MEDIA CREATURE', which
 * is both wrong and completely plausible.
 */
export const spliceCategories = (left: string, right: string): string =>
  `${firstWord(right)} ${lastWord(left)}`;

/**
 * The specimen a fused bubble is. `members` must be in the page's own order — the fused id
 * already guarantees that, so callers should resolve it with `membersFor` rather than assembling
 * the list themselves.
 */
export function describeFusion(id: string, members: SwymbleLab[]): FusionSpecimen | null {
  if (members.length < 2) return null;

  const first = members[0];
  const last = members.at(-1)!;

  // Written and drawn beats derived, every time. All 21 of today's pairs are in
  // `data/labs/merged_easteregg/`; the generator below is what stops a newly added lab from
  // producing a blank card before anyone has had time to write its seven.
  const authored = mergedFor(members.map((lab) => lab.id));
  if (authored) {
    return {
      id,
      name: authored.name,
      category: authored.category,
      status: authored.tag ?? LAB_FUSION.status,
      tagline: authored.tagline,
      highlights: [...authored.highlights],
      members,
      image: authored.image,
      authored: true,
    };
  }

  const name = chimeraName(members.map((lab) => lab.title));

  return {
    id,
    name,
    authored: false,
    category: spliceCategories(first.category, last.category),
    status: LAB_FUSION.status,
    tagline: spliceSummaries(first.publicSummary, last.publicSummary),
    // One claim from the front of the first and one from the back of the last: two promises that
    // were never meant to be made by the same thing.
    highlights: [first.safeHighlights[0], last.safeHighlights.at(-1)].filter(
      (highlight): highlight is string => Boolean(highlight),
    ),
    members,
  };
}

/** The labs inside a fused id, in the order the page lists them. Unknown ids are dropped rather
 *  than throwing: a stale bubble must not be able to take the page down. */
export const membersFor = (id: string, labs: readonly SwymbleLab[]): SwymbleLab[] =>
  membersOf(id)
    .map((member) => labs.find((lab) => lab.id === member))
    .filter((lab): lab is SwymbleLab => Boolean(lab));

/** The specimen for a fused bubble id, or null if it is not a fusion or its labs are gone. */
export const specimenFor = (id: string, labs: readonly SwymbleLab[]): FusionSpecimen | null =>
  describeFusion(id, membersFor(id, labs));
