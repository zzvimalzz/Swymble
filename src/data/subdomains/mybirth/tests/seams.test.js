/*
   The seams: whether the pieces join.

   Every other suite checks a sentence. This one checks what happens when
   sentences from different files are printed next to each other, which is
   the only form a reader ever sees them in and the only failure the two
   linters cannot catch. Both faults below shipped and were caught by
   looking at the page rather than by anything automated:

     "Go somewhere you have not been. The discipline is available today
      without costing what it usually costs."

   Two good sentences and one bad card, because "the discipline" has no
   antecedent. And a card headed "Sex and pleasure" that opened "Money, a
   bed, a debt", because the area was renamed and its bank was not.

   Rules in src/sky/contents/CORPUS-RULES.md.
*/

import { describe, it, expect } from "vitest";
import readingsFile from "../src/sky/contents/readings.json";
import touchesFile from "../src/sky/contents/touches.json";
import motionFile from "../src/sky/contents/motion.json";
import areasFile from "../src/sky/contents/areas.json";
import depthFile from "../src/sky/contents/depth.json";
import linesFile from "../src/sky/contents/lines.json";
import { dailyReading } from "../src/sky/reading.js";
import { addressesTheReader } from "../tools/check-voice.mjs";

const BIRTH = new Date(Date.UTC(1991, 4, 17, 3, 25));

const READINGS = readingsFile.readings;
const TOUCHES = touchesFile.touches;
const MOTION = motionFile.motion;
const AREAS = areasFile.areas;
const DEPTH = depthFile.depth;
const LINES = linesFile.lines;

const TONES = ["charged", "open", "friction", "easy", "pull"];

/*
   Content words, for the overlap checks below. Two pieces of copy that
   share most of their content words are the same reading in different
   clothes, whether they sit in one cell or in two paragraphs of one card.
*/
const STOP = new Set(("the a an and or but of to in on it is are was were be been being that this these those "
  + "you your yours i we they them there here for with as at by from not no so than then today tomorrow what "
  + "which who whom whose how when where why do does did done has have had will would can could should its "
  + "on off up down out one two both").split(" "));
const words = (s) => new Set(
  (s.toLowerCase().match(/[a-z']+/g) || []).filter((w) => w.length > 2 && !STOP.has(w)),
);
/** How much of the first piece is already in the second. */
const overlap = (a, b) => {
  const [x, y] = [words(a), words(b)];
  if (!x.size) return 0;
  return [...x].filter((w) => y.has(w)).length / x.size;
};

describe("the body is one paragraph, not three tables in a trench coat", () => {
  /*
     The rewrite this suite was rewritten for.

     The body used to be an opening, plus a clause keyed by the natal body,
     plus a clause keyed by the transit. Every piece after the first had to
     open on a back-reference so it would parse under any of the 225
     openings it could follow, and that constraint is what produced the
     card the complaint came in about:

       "One of them pays and one of them matters; today they want opposite
        hours. What you are doing and what you are known for are pulling in
        different directions. Past exact now, and thinning out through the
        afternoon."

     Three sentences, three subjects, two registers, and a timing clause in
     a vocabulary no reader has. The body is one written paragraph now plus
     a timing tail in English, and these are the rules that keep it one.
  */
  it("writes every body to the reader rather than about the measurement", () => {
    /*
       Same predicate the linter uses, imported rather than restated: an
       imperative is second person without the pronoun, the list of verbs
       that count is maintenance, and maintaining it twice means one of the
       two copies is always wrong.
    */
    const bad = [];
    for (const [area, tones] of Object.entries(READINGS)) {
      for (const [tone, variants] of Object.entries(tones)) {
        variants.forEach(([, body], i) => {
          if (!addressesTheReader(body)) bad.push(`${area}.${tone}[${i}]: ${body.slice(0, 60)}`);
        });
      }
    }
    expect(bad).toEqual([]);
  });

  it("keeps astrology out of the copy a reader is meant to read at a glance", () => {
    /*
       "Past exact now" is accurate and it is not English. The measurement
       is printed underneath every card, in full, with the aspect named and
       the orb in degrees, which is where the vocabulary belongs.
    */
    const jargon = /\b(orb|applying|separating|exact|conjunct|sextile|quincunx|trine)\b/i;
    const bad = [];
    for (const [area, tones] of Object.entries(READINGS)) {
      for (const [tone, variants] of Object.entries(tones)) {
        variants.forEach(([, body], i) => {
          if (jargon.test(body)) bad.push(`readings ${area}.${tone}[${i}]`);
        });
      }
    }
    for (const [body, states] of Object.entries(MOTION)) {
      states.forEach((variants, i) => variants.forEach((text, v) => {
        if (jargon.test(text)) bad.push(`motion ${body}[${i}][${v}]: ${text}`);
      }));
    }
    expect(bad).toEqual([]);
  });

  it("gives each transiting body five timing tails per direction", () => {
    /*
       One clause per direction meant four cards a morning ended on the
       identical sentence, because a day's cards are mostly driven by
       whichever body is moving fastest. reading.js walks the list rather
       than seeding it, so a repeat inside one render is impossible while a
       direction has more variants than the day has cards using it.
    */
    for (const [body, states] of Object.entries(MOTION)) {
      expect(states, body).toHaveLength(2);
      for (const variants of states) expect(variants.length, body).toBeGreaterThanOrEqual(5);
    }
  });

  it("ends every assembled piece in a full stop, since the joiner adds nothing", () => {
    const all = [
      ...Object.values(READINGS).flatMap((t) => Object.values(t).flat().map((p) => p[1])),
      ...Object.values(TOUCHES).flatMap((t) => Object.values(t)),
      ...Object.values(MOTION).flat(2),
    ];
    for (const text of all) expect(text.trim(), text.slice(0, 40)).toMatch(/[.]$/);
  });
});

describe("no paragraph of a card restates the one above it", () => {
  /*
     The fault that produced the complaint, and the reason it was not a
     one-off. An aspect's *area* is derived from where the natal point
     sits, so keying two tables by area and by natal point does not give
     two independent dimensions; it gives two correlated ones. For the two
     angles the correlation is total, because the Ascendant defines the
     first sector and the Midheaven the tenth. Every Midheaven card was a
     Work card, so every Midheaven card paired the midheaven clause with a
     work opening and a work paragraph: one address, three paraphrases.

     Worst case shared every content word it had:

       body      "One of them pays and one of them matters; today they want
                  opposite hours."
       expanded  "One of them pays and one of them matters, and today they
                  want opposite hours."

     The area paragraph is gone and paragraph two is keyed by the natal
     point alone. This checks that the two never converge again, at every
     address the renderer can actually produce.
  */
  it("keys paragraph two off the natal point, not off the area again", () => {
    const bad = [];
    for (const [area, tones] of Object.entries(READINGS)) {
      for (const [tone, variants] of Object.entries(tones)) {
        for (const [point, byTone] of Object.entries(TOUCHES)) {
          variants.forEach(([, body], i) => {
            const r = overlap(byTone[tone], body);
            if (r >= 0.5) {
              bad.push(`${area}.${tone}[${i}] vs touches.${point}.${tone}: ${(r * 100) | 0}%`);
            }
          });
        }
      }
    }
    expect(bad).toEqual([]);
  });

  it("holds for the two angles, where the area is locked by construction", () => {
    /*
       Narrower and stricter, because these are the addresses that cannot
       vary: an Ascendant aspect is always a Self card and a Midheaven
       aspect is always a Work card, so these pairings render every time
       they come up rather than occasionally.
    */
    for (const [point, area] of [["ascendant", "self"], ["midheaven", "work"]]) {
      for (const tone of TONES) {
        for (const [i, [, body]] of READINGS[area][tone].entries()) {
          const r = overlap(TOUCHES[point][tone], body);
          expect(r, `${point}.${tone} vs ${area}.${tone}[${i}]`).toBeLessThan(0.4);
        }
      }
    }
  });
});

describe("an area's copy matches the area's name", () => {
  /*
     The second fault. Renaming an area is a one-line change and moving its
     bank is not, so the two drift silently: the label promises Sex and
     pleasure and the sentence delivers a debt. This checks the handful of
     vocabularies that are specific enough to belong to exactly one area.
  */
  const textOf = (area) =>
    Object.values(READINGS[area]).flat().map((p) => p.join(" ")).join(" ").toLowerCase();

  /*
     One vocabulary per area, and only terms that cannot be a metaphor for
     anything else.

     Deliberately narrow. "Work out the price first" is a Love reading using
     a money image and it belongs there; the test is not for vocabulary
     borrowed as an image, it is for copy literally written about one area
     sitting on another's card. Every term below was checked against the
     shipped bank and appears in exactly one area today, so the list
     describes what the corpus is rather than an ideal it was never held to.

     Love has no entry, and that is not an oversight. Its subject is the
     other person, and every word for that is shared with the rest of the
     bank. It is covered by the money rule from the other direction and by
     the reader's judgement, which is where CORPUS-RULES section 4 leaves it.
  */
  const EXCLUSIVE = {
    money: /\b(budget|invoice|the rate|what you charge|the account|round it up|the till|subscription|wage)\b/,
    work: /\b(rota|headcount|handover)\b/,
    home: /\b(hallway|cupboard|washing up|kitchen|the house|relatives?|renovate|reorganise)\b/,
    talk: /\b(group chat|forwarded)\b/,
    making: /\b(the draft|blank page|portfolio|commission|the tangent)\b/,
    sex: /\b(jealousy|joint money|shared money|withholding|intimacy)\b/,
    belief: /\b(the long view|conviction)\b/,
    self: /\b(auditioning|legible|underestimated)\b/,
  };

  it("keeps each area's own vocabulary on its own card", () => {
    const bad = [];
    for (const [owner, re] of Object.entries(EXCLUSIVE)) {
      for (const area of Object.keys(AREAS)) {
        if (area === owner) continue;
        const hit = textOf(area).match(re);
        if (hit) bad.push(`${area} carries ${owner} copy: ${hit[0]}`);
      }
    }
    expect(bad).toEqual([]);
  });

  it("gives every area copy that could only be about that area", () => {
    /*
       The other direction, and the one the corpus fails first. A bank that
       drifts into abstraction reads as filler on every card, because a
       sentence written to be true of nine parts of a life cannot say much
       about any of them. If an area stops using its own furniture entirely,
       it has stopped being a reading about that area.
    */
    for (const [owner, re] of Object.entries(EXCLUSIVE)) {
      expect(textOf(owner), `${owner} has stopped sounding like itself`).toMatch(re);
    }
  });

  it("names every area in something a reader can read", () => {
    for (const [key, a] of Object.entries(AREAS)) {
      expect(a.label.length, key).toBeGreaterThan(3);
      expect(a.tab.split(/\s+/), key).toHaveLength(1);
      // the domain completes "your Mars sits in ...", so it must not be a sentence
      expect(a.domain, key).not.toMatch(/^[A-Z]/);
      expect(a.domain, key).not.toMatch(/\.$/);
    }
  });
});

describe("every table is complete for every key it is addressed by", () => {
  /*
     A missing cell does not throw. It renders as a shorter card, or a
     paragraph that quietly disappears, and nothing on the page says so.
  */
  it("has a reading and a line for all nine areas", () => {
    for (const area of Object.keys(AREAS)) {
      for (const tone of TONES) {
        expect(READINGS[area]?.[tone]?.length, `readings.${area}.${tone}`).toBeGreaterThan(0);
        expect(LINES[area]?.[tone], `lines.${area}.${tone}`).toBeTruthy();
      }
    }
  });

  it("fills every cell to the same depth, since the rotation is per cell", () => {
    /*
       chooseVariant prefers a variant the reader has never seen and falls
       back to the least recently used, so the number of variants in a cell
       is exactly the number of visits before a sentence repeats. An uneven
       bank means some areas start repeating sooner than others with
       nothing on the page to explain why, which reads as the product
       having less to say about that part of a life.

       So: fill a cell or leave it. Ten everywhere.
    */
    const depths = new Set();
    for (const area of Object.keys(AREAS)) {
      for (const tone of TONES) depths.add(READINGS[area][tone].length);
    }
    expect([...depths], "every area and tone needs the same number of variants").toEqual([10]);
  });

  it("writes no two variants of one cell as the same reading", () => {
    /*
       Ten variants are only ten if a reader can tell them apart. Two
       sentences saying the same thing in different words is a repeat that
       the rotation cannot protect anybody from, because it looks like
       variety to the picker and like a loop to the person reading.
    */
    const bad = [];
    for (const area of Object.keys(AREAS)) {
      for (const tone of TONES) {
        const bodies = READINGS[area][tone].map(([, b]) => b);
        bodies.forEach((a, i) => bodies.slice(i + 1).forEach((b, j) => {
          const [x, y] = [words(a), words(b)];
          const shared = [...x].filter((w) => y.has(w)).length / Math.min(x.size, y.size);
          if (shared >= 0.5) bad.push(`${area}.${tone}[${i}] and [${i + j + 1}]: ${(shared * 100) | 0}%`);
        }));
      }
    }
    expect(bad).toEqual([]);
  });

  it("has no area table left in depth.json, which is what made it a restatement", () => {
    /*
       Guarding a deletion. depth.area was keyed by area and tone, the same
       address the body's opening came from, so paragraph two paraphrased
       paragraph one by construction. If it comes back, so does the bug.
    */
    expect(DEPTH.area).toBeUndefined();
  });

  it("has a touch and a depth paragraph for every point an aspect can land on", () => {
    const points = Object.keys(DEPTH.natal);
    expect(points.length).toBe(12);
    for (const p of points) {
      for (const tone of TONES) expect(TOUCHES[p]?.[tone], `touches.${p}.${tone}`).toBeTruthy();
    }
  });

  it("has a motion clause and a depth paragraph for every transiting body", () => {
    for (const body of Object.keys(MOTION)) {
      expect(DEPTH.transit[body], `depth.transit.${body}`).toBeTruthy();
    }
    expect(Object.keys(MOTION)).toHaveLength(10);
  });

  it("never prints one timing clause twice in a day", () => {
    /*
       The end of the visible repetition. Four cards ending on the same
       sentence was the loudest tell on the page, and it survived every
       other kind of variety further up the card.
    */
    for (const asc of [12.5, 60, 128.4, 200, 244.9, 300, 340]) {
      for (const d of [14, 15, 16, 17, 18]) {
        const r = dailyReading(
          { key: `a${asc}`, birthDate: BIRTH, ascendant: asc, midheaven: (asc + 270) % 360 },
          new Date(2026, 7, d, 9, 0),
        );
        const tails = r.cards
          .filter((c) => !c.quiet)
          .map((c) => c.body.split(". ").pop());
        expect(new Set(tails).size, `asc ${asc} day ${d}`).toBe(tails.length);
      }
    }
  });
});
