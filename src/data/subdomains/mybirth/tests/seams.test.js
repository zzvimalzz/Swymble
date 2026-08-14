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

   Rules in .docs/MyBirth-Plan/10-CORPUS.md section 3a.
*/

import { describe, it, expect } from "vitest";
import readingsFile from "../src/sky/contents/readings.json";
import touchesFile from "../src/sky/contents/touches.json";
import motionFile from "../src/sky/contents/motion.json";
import areasFile from "../src/sky/contents/areas.json";
import depthFile from "../src/sky/contents/depth.json";
import linesFile from "../src/sky/contents/lines.json";
import { dailyReading } from "../src/sky/reading.js";

const BIRTH = new Date(Date.UTC(1991, 4, 17, 3, 25));

const READINGS = readingsFile.readings;
const TOUCHES = touchesFile.touches;
const MOTION = motionFile.motion;
const AREAS = areasFile.areas;
const DEPTH = depthFile.depth;
const LINES = linesFile.lines;

const TONES = ["charged", "open", "friction", "easy", "pull"];

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
    const bad = [];
    for (const [area, tones] of Object.entries(READINGS)) {
      for (const [tone, variants] of Object.entries(tones)) {
        variants.forEach(([, body], i) => {
          /* second person, by pronoun or by imperative mood */
          const second = /\byou(r|rs|rself)?\b/i.test(body)
            || /(^|\. )(Say|Do|Ask|Give|Take|Make|Go|Let|Send|Start|Stop|Pick|Pay|Put|Set|Skip|Sit|Read|Name|Cut|Close|Finish|Write|Work|Point|Settle|Reply|Clear|Change|Build|Spend|Argue|Move|Call|Check|Choose|Find|Keep|Learn|Leave|Listen|Notice|Show|Teach|Tell|Trust|Turn|Use|Wait|Watch)\b/.test(body);
          if (!second) bad.push(`${area}.${tone}[${i}]: ${body.slice(0, 60)}`);
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
  const STOP = new Set(("the a an and or but of to in on it is are was were be been being that this these those "
    + "you your yours i we they them there here for with as at by from not no so than then today tomorrow what "
    + "which who whom whose how when where why do does did done has have had will would can could should its "
    + "on off up down out one two both").split(" "));
  const words = (s) => new Set(
    (s.toLowerCase().match(/[a-z']+/g) || []).filter((w) => w.length > 2 && !STOP.has(w)),
  );
  /** How much of the shorter piece is already in the longer one. */
  const overlap = (a, b) => {
    const [x, y] = [words(a), words(b)];
    if (!x.size) return 0;
    return [...x].filter((w) => y.has(w)).length / x.size;
  };

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

  it("keeps money copy on the money card", () => {
    /*
       Deliberately narrow. "Work out the price first" is a Love reading
       using a money metaphor and it belongs there; the test is not for
       vocabulary borrowed as an image, it is for copy that was literally
       written about earning and left behind when the area was renamed.
       So: only terms that cannot be a metaphor for anything else.
    */
    const money = /\b(budget|invoice|the rate|what you charge|the account|round it up)\b/;
    for (const area of Object.keys(AREAS)) {
      if (area === "money") continue;
      expect(textOf(area).match(money) || [], `${area} carries money copy`).toEqual([]);
    }
    expect(textOf("money")).toMatch(money);
  });

  it("gives the closeness card copy about closeness", () => {
    const near = /\b(want|closeness|close|intimacy|jealousy|honest|shared|pleasure|merging)\b/;
    expect(textOf("sex")).toMatch(near);
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
