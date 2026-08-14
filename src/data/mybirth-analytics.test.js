/*
   The analytics contract.

   Two things are being protected here. The first is privacy: a name, a
   birth date or a place must not be able to reach a vendor even by
   accident, so the allow-lists are asserted rather than trusted.

   The second is the upgrade path. Cloudflare goes on now because it is
   free and answers "is anyone coming". Plausible goes on later, when there
   is enough traffic for custom events to mean something rather than to be
   twenty people and noise. That second step has to be a token, not a
   rewrite, and these tests are what keeps it that way.
*/

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const SRC = join(import.meta.dirname, "subdomains", "mybirth", "src");
const analyticsSource = readFileSync(join(SRC, "analytics.js"), "utf8");
const mainSource = readFileSync(join(SRC, "main.js"), "utf8");

describe("the provider registry", () => {
  it("keeps every provider's capabilities declared", () => {
    for (const name of ["cloudflare", "plausible", "umami"]) {
      expect(analyticsSource).toContain(`${name}: {`);
    }
    // the field the whole design turns on: Cloudflare cannot do events, and
    // saying so is what stops the module pretending it recorded one
    expect(analyticsSource).toMatch(/label: "Cloudflare Web Analytics",\s*\n\s*events: false/);
    expect(analyticsSource).toMatch(/label: "Plausible",\s*\n\s*events: true/);
  });

  it("has no single-provider assumption left in it", () => {
    // the shape that made adding a second vendor a rewrite
    expect(analyticsSource).not.toMatch(/CONFIG\.provider/);
  });

  it("sends events to every capable provider, not just the first", () => {
    expect(analyticsSource).toMatch(/for \(const \{ provider \} of active\(\)\)/);
  });

  it("turns a provider on from its own config alone", () => {
    // adding Plausible later must be a token, never a code change
    expect(analyticsSource).toMatch(/on: \(c\) => !!c\.token/);       // cloudflare
    expect(analyticsSource).toMatch(/on: \(c\) => !!c\.src/);         // plausible
  });
});

describe("what can reach a vendor", () => {
  it("enumerates every event name", () => {
    const events = [...analyticsSource.matchAll(/^\s+[A-Z_]+: "([a-z_]+)",/gm)].map((m) => m[1]);
    expect(events.length).toBeGreaterThanOrEqual(10);
    // no event name may carry anything person-shaped
    for (const e of events) expect(e).toMatch(/^[a-z_]+$/);
  });

  it("enumerates property values, not just property keys", () => {
    /*
       The important half. Allowing a key called "theme" but any value would
       let free text through; the values are a fixed set, so a name or a
       place cannot be passed by accident from a call site.
    */
    expect(analyticsSource).toMatch(/ALLOWED_PROPS = \{/);
    expect(analyticsSource).toMatch(/if \(ALLOWED_PROPS\[k\]\?\.has\(v\)\)/);
  });

  it("honours Do Not Track and Global Privacy Control", () => {
    expect(analyticsSource).toContain("globalPrivacyControl");
    expect(analyticsSource).toContain("doNotTrack");
  });

  it("ships with no vendor switched on until somebody fills one in", () => {
    // a token committed by accident would start collection silently
    expect(analyticsSource).toMatch(/token: ""/);
  });
});

describe("the call sites", () => {
  it("only ever sends values the allow-list accepts", () => {
    /*
       The regression test for a real bug. The theme is stored as light and
       dark, the allow-list enumerates paper and ink, and the two
       vocabularies drifted apart: the property was silently discarded on
       every reading and that dimension was never recorded at all. It was
       found by running the dry run, not by reading the code.
    */
    const themeValues = analyticsSource.match(/theme: new Set\(\[([^\]]+)\]\)/)?.[1] || "";
    expect(themeValues).toContain("paper");
    expect(themeValues).toContain("ink");
    // and the call site must speak the same vocabulary
    expect(mainSource).toMatch(/theme: theme === "dark" \? "ink" : "paper"/);
    expect(mainSource).not.toMatch(/trackEvent\(EVENTS\.TODAY_READ, \{[^}]*\btheme\s*\}/);
  });

  it("fires every enumerated event from somewhere", () => {
    const names = [...analyticsSource.matchAll(/^\s+([A-Z_]+): "[a-z_]+",/gm)].map((m) => m[1]);
    const everywhere = analyticsSource + mainSource;
    for (const n of names) {
      expect(everywhere.includes(`EVENTS.${n}`), `${n} is enumerated but never fired`).toBe(true);
    }
  });
});
