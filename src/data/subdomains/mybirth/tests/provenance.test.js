/*
   The guarantee C4 exists to provide: a displayed figure carries the
   account of where it came from, and it cannot be built without one.

   This is the regression test for the failure that started the audit. A
   copy-trimming pass removed the sentences that said which chart the song
   came from, nothing broke, nothing failed to build, and the page went on
   showing a US number one to the whole world as their defining song. These
   assertions fail loudly where prose failed silently.
*/

import { describe, it, expect } from "vitest";
import { fact, isFact, valueOf, mark, scopeNote, KIND } from "../src/facts/provenance.js";
import { movieOfYear, songOfYear, leaderAt, worldPopulationAt } from "../src/facts/data.js";

describe("fact()", () => {
  it("refuses to exist without a source", () => {
    expect(() => fact("Jaws", undefined)).toThrow(/kind/);
    expect(() => fact("Jaws", {})).toThrow(/kind/);
    expect(() => fact("Jaws", { kind: "vibes" })).toThrow(/kind/);
  });

  it("refuses a kind with no method behind it", () => {
    expect(() => fact("Jaws", { kind: KIND.CURATED })).toThrow(/method/);
  });

  it("passes a missing value straight through", () => {
    // no film for that year is an absence, not a fact needing provenance
    expect(fact(null, { kind: KIND.CURATED, method: "x" })).toBeNull();
  });

  it("is frozen, so a source cannot be edited after the fact", () => {
    const f = fact(7, { kind: KIND.COMPUTED, method: "counted" });
    expect(() => { f.value = 9; }).toThrow();
    expect(() => { f.source.method = "guessed"; }).toThrow();
  });
});

describe("mark()", () => {
  it("will not render a marker for something with no source", () => {
    expect(() => mark("just a string")).toThrow(/no source/);
    expect(() => mark(null)).toThrow(/no source/);
  });

  it("puts the scope and the method where a reader can reach them", () => {
    const html = mark(songOfYear(1994));
    expect(html).toContain("United States");
    expect(html).toContain("year-end");
    expect(html).toContain("aria-label");
  });

  it("escapes what it writes into attributes", () => {
    const f = fact(1, { kind: KIND.CURATED, method: 'a "quoted" <tag>' });
    expect(mark(f)).not.toContain('<tag>');
    expect(mark(f)).toContain("&quot;");
  });
});

describe("the curated tables", () => {
  const cases = [
    ["song", songOfYear(1994)],
    ["film", movieOfYear(1994)],
    ["leader", leaderAt("US", 1994)],
    ["population", worldPopulationAt(1994)],
  ];

  it.each(cases)("%s is a fact, not a bare value", (_name, f) => {
    expect(isFact(f)).toBe(true);
  });

  it.each(cases)("%s names its method", (_name, f) => {
    expect(f.source.method.length).toBeGreaterThan(10);
  });

  it.each(cases)("%s declares how far its claim reaches", (_name, f) => {
    // scope is what stops a US chart being shown as a worldwide one
    expect(f.source.scope).toBeTruthy();
  });

  it("still carries the underlying values", () => {
    expect(valueOf(songOfYear(1994))).toContain("|");
    expect(valueOf(movieOfYear(1994))).toBe("The Lion King");
    expect(valueOf(leaderAt("US", 1994)).name).toMatch(/Clinton/);
    expect(valueOf(worldPopulationAt(1994))).toBeGreaterThan(5e9);
  });

  it("says out loud that the song table is American", () => {
    // the specific claim the product was making by omission
    expect(scopeNote(songOfYear(1980))).toContain("United States");
  });

  it("returns nothing, rather than a sourceless value, outside its range", () => {
    expect(songOfYear(1830)).toBeNull();
    expect(movieOfYear(1830)).toBeNull();
    expect(leaderAt("ZZ", 1994)).toBeNull();
  });
});
