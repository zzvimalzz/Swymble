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

describe("slot 2 refers back, and never opens a subject", () => {
  /*
     The rule that fixes the first fault above. Slot 1 introduces the
     subject; every slot after it says something about that subject. A
     piece starting "The discipline..." or "Growth..." is starting a new
     topic, and it will do that under all 225 openings it can follow.
  */
  it("starts every touch with a back-reference", () => {
    const bad = [];
    for (const [body, tones] of Object.entries(TOUCHES)) {
      for (const [tone, text] of Object.entries(tones)) {
        if (!/^(It|What|You|Your|Something)\b/.test(text)) bad.push(`${body}.${tone}: ${text}`);
      }
    }
    expect(bad).toEqual([]);
  });

  it("starts every motion clause with a back-reference or a time word", () => {
    const bad = [];
    for (const [body, states] of Object.entries(MOTION)) {
      states.forEach((variants, i) => {
        variants.forEach((text, v) => {
          if (!/^(It|Past|Still|The exact|This)\b/.test(text)) bad.push(`${body}[${i}][${v}]: ${text}`);
        });
      });
    }
    expect(bad).toEqual([]);
  });

  it("gives each transiting body three timing clauses per direction", () => {
    /*
       One clause per direction meant four cards a morning ended on the
       identical sentence, because a day's cards are mostly driven by
       whichever body is moving fastest. Three is enough that the walk in
       reading.js can never hand out a repeat within one render.
    */
    for (const [body, states] of Object.entries(MOTION)) {
      expect(states, body).toHaveLength(2);
      for (const variants of states) expect(variants.length, body).toBeGreaterThanOrEqual(3);
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
  it("has a reading and a line and an area paragraph for all nine areas", () => {
    for (const area of Object.keys(AREAS)) {
      for (const tone of TONES) {
        expect(READINGS[area]?.[tone]?.length, `readings.${area}.${tone}`).toBeGreaterThan(0);
        expect(LINES[area]?.[tone], `lines.${area}.${tone}`).toBeTruthy();
        expect(DEPTH.area[area]?.[tone], `depth.area.${area}.${tone}`).toBeTruthy();
      }
    }
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
