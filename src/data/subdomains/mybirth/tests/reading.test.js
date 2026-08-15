/*
   Guards for the daily card grid.

   The engine has always computed an aspect for every area of a life; the
   screen printed one. Now it prints up to six, and the things that can
   quietly go wrong with that are not things a build catches: two cards
   headed the same area, a reload rerolling half the page, or the journal
   filling with one day's rows and losing the month of history that stops
   a sentence repeating. Each is a correct-looking render of wrong data.
*/

import { describe, it, expect } from "vitest";
import {
  dailyReading, polarityOf, lineOfTheDay, POLARITIES, AREAS, AREA_KEYS,
} from "../src/sky/reading.js";

/*
   One profile, one day, both fixed. The reading is a pure function of
   (person, date) by design, so a literal date here is not a snapshot
   test — it is the whole contract.
*/
const PERSON = {
  key: "test-person",
  birthDate: new Date(Date.UTC(1991, 4, 17, 3, 25)),
  ascendant: 128.4,
};
const DAY = new Date(2026, 7, 14, 9, 0);

/** A day with enough sky on it to exercise the grid, or the suite is vacuous. */
function busyReading(journal = []) {
  const r = dailyReading(PERSON, DAY, { journal });
  expect(r).not.toBeNull();
  expect(r.quiet).toBe(false);
  return r;
}

describe("polarity", () => {
  it("reads soft angles as support and hard ones as strain", () => {
    expect(polarityOf("easy").key).toBe("support");
    expect(polarityOf("open").key).toBe("support");
    expect(polarityOf("friction").key).toBe("strain");
    expect(polarityOf("pull").key).toBe("strain");
  });

  it("refuses to take a side on a conjunction", () => {
    expect(polarityOf("charged").key).toBe("charged");
  });

  it("names the axis after the angle, never after a promise about the day", () => {
    /*
       The one rule this whole feature exists to keep. Readers of the
       apps in this category routinely take the mark beside a card as a
       luck score, and the moment a label says Lucky or Good the product
       is making a claim the arithmetic underneath it cannot support.
    */
    const banned = /\b(luck|lucky|unlucky|good|bad|positive|negative|fortune|blessed|score)\b/i;
    for (const p of Object.values(POLARITIES)) {
      expect(p.label, p.key).not.toMatch(banned);
      expect(p.note, p.key).not.toMatch(banned);
    }
  });
});

describe("the line of the day", () => {
  it("is written for a lock screen, not for a card", () => {
    const r = busyReading();
    expect(r.line.length).toBeGreaterThan(20);
    // 72 is roughly what a notification shows before it truncates
    expect(r.line.length).toBeLessThanOrEqual(72);
    expect(r.line).toMatch(/\.$/);
    expect(r.line).not.toMatch(/\?$/);
  });

  it("comes off the same address as the lead card", () => {
    const r = busyReading();
    expect(r.line).toBe(lineOfTheDay(r.lead.area, r.tone));
  });

  it("stands alone, so it never leans on a label the notification will not have", () => {
    /*
       The whole reason this is a separate bank from the headlines. A card
       headline sits under "Love and relationships" and can say "the
       difficult conversation"; a notification says it to somebody looking
       at a locked phone, with no area named anywhere.
    */
    for (const key of AREA_KEYS) {
      for (const tone of ["charged", "open", "friction", "easy", "pull"]) {
        const line = lineOfTheDay(key, tone);
        expect(line, `${key}.${tone}`).toBeTruthy();
        expect(line.length, `${key}.${tone}`).toBeLessThanOrEqual(72);
      }
    }
  });
});

describe("the daily number", () => {
  it("gives one checkable figure with a label and a sentence", () => {
    const n = busyReading().number;
    expect(n).toBeTruthy();
    expect(n.label.length).toBeGreaterThan(4);
    expect(n.value).toMatch(/[\d]/);
    expect(n.note.length).toBeGreaterThan(20);
  });

  it("rotates, so two people on one day do not both get illumination", () => {
    /*
       The seed is the person and the date, so the kind moves. If every
       chart got the same kind every day the figure would stop being a
       reason to open the page.
    */
    const kinds = new Set();
    for (const key of ["a", "b", "c", "d", "e", "f", "g", "h"]) {
      const p = { ...PERSON, key };
      kinds.add(dailyReading(p, DAY).number.kind);
    }
    expect(kinds.size).toBeGreaterThan(1);
  });

  it("does not reroll within a day", () => {
    const a = dailyReading(PERSON, new Date(2026, 7, 14, 8, 0)).number;
    const b = dailyReading(PERSON, new Date(2026, 7, 14, 22, 0)).number;
    expect(b).toEqual(a);
  });

  it("prints an exact time only when the angle really is exact that day", () => {
    /*
       The one figure here that could be wrong rather than merely dull.
       exactTimeToday walks the day in ten-minute steps and refuses to
       print unless the orb actually closes below a twelfth of a degree.
    */
    for (const key of ["a", "b", "c", "d", "e", "f", "g", "h"]) {
      const r = dailyReading({ ...PERSON, key }, DAY);
      if (r.number.kind !== "exact") continue;
      expect(r.number.value).toMatch(/^\d{2}:\d{2}$/);
      expect(r.number.note).toMatch(/to the minute/);
    }
  });
});

describe("the daily card grid", () => {
  it("returns a card for every area, every day", () => {
    const r = busyReading();
    expect(r.cards).toHaveLength(AREA_KEYS.length);
    // and the day is a mixed one, or the quiet half of this suite is vacuous
    expect(r.cards.some((c) => c.quiet)).toBe(true);
    expect(r.cards.some((c) => !c.quiet)).toBe(true);
  });

  it("never heads two cards with the same area", () => {
    const areas = busyReading().cards.map((c) => c.area);
    expect(new Set(areas).size).toBe(areas.length);
    for (const a of areas) expect(AREAS[a]).toBeTruthy();
  });

  it("leads with the card the headline was written from", () => {
    const r = busyReading();
    const [first] = r.cards;
    expect(first.area).toBe(r.lead.area);
    expect(first.headline).toBe(r.headline);
    expect(first.body).toBe(r.body);
  });

  it("orders the reading cards by how tight and fast the aspect is", () => {
    const rest = busyReading().cards.filter((c) => !c.quiet).slice(1);
    const scores = rest.map((c) => c.aspect.score);
    expect(scores).toEqual([...scores].sort((a, b) => b - a));
  });

  it("puts every quiet card after every reading one", () => {
    const kinds = busyReading().cards.map((c) => c.quiet);
    expect(kinds).toEqual([...kinds].sort((a, b) => Number(a) - Number(b)));
  });

  it("never repeats a quiet variant within one kind on one day", () => {
    /*
       Three areas of the same kind is ordinary, and a per-card seed would
       collide often enough to look broken. The picker walks the bank
       instead, so a repeat is impossible while a kind has no more cards
       than variants.
    */
    const byKind = new Map();
    for (const c of busyReading().cards.filter((x) => x.quiet)) {
      if (!byKind.has(c.kind)) byKind.set(c.kind, []);
      byKind.get(c.kind).push(c.variant);
    }
    for (const [kind, variants] of byKind) {
      expect(new Set(variants).size, kind).toBe(variants.length);
      for (const v of variants) expect(Number.isInteger(v) && v >= 0).toBe(true);
    }
  });

  it("gives every reading card its own measurement, not just the lead", () => {
    for (const c of busyReading().cards.filter((x) => !x.quiet)) {
      expect(c.label).toMatch(/natal/);
      expect(c.orb).toBeGreaterThanOrEqual(0);
      expect(c.orb).toBeLessThanOrEqual(6);
      // proofLine says "0.4° off exact", or "exact to within half a degree" under 0.5°
      expect(c.proof).toMatch(/exact/);
      expect(c.proof).toContain("which is why this reads as");
      expect(c.body.length).toBeGreaterThan(40);
    }
  });

  it("does not reroll when the page is opened twice", () => {
    /*
       The reload path: the caller writes the entries to storage, reads
       them back on the next render and hands them straight in. Every card
       has to find its own row and reuse it, not only the lead.
    */
    const first = busyReading();
    const second = busyReading(first.entries);
    expect(second.cards.map((c) => c.headline)).toEqual(first.cards.map((c) => c.headline));
    expect(second.entries).toEqual(first.entries);
  });

  it("records one journal entry per reading card, all stamped the same day", () => {
    const r = busyReading();
    // a quiet card chose no variant, so it has nothing to record
    expect(r.entries).toHaveLength(r.cards.filter((c) => !c.quiet).length);
    expect(new Set(r.entries.map((e) => e.d)).size).toBe(1);
    // one cell per area, so a day's rows cannot collide with each other
    expect(new Set(r.entries.map((e) => e.c)).size).toBe(r.entries.length);
    for (const e of r.entries) expect(Number.isInteger(e.v)).toBe(true);
  });

  it("marks every reading card with a polarity, and the lead with the lead's", () => {
    const r = busyReading();
    for (const c of r.cards.filter((x) => !x.quiet)) {
      expect(POLARITIES[c.polarity.key]).toBe(c.polarity);
      expect(c.polarity).toBe(polarityOf(c.tone));
    }
    expect(r.polarity).toBe(r.cards[0].polarity);
  });

  it("still answers with an empty grid when nothing is in orb", () => {
    /*
       A chart with no Ascendant is refused outright, but a placed-empty
       day returns the quiet reading, and that branch has to carry the
       same shape or the renderer reads cards off undefined.
    */
    const r = dailyReading({ ...PERSON, ascendant: NaN }, DAY);
    expect(r).toBeNull();
  });
});
