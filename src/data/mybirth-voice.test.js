/*
   Phase 1, C5 and C6: the copy rules, enforced rather than documented.

   VOICE.md is only worth writing if something runs it. These two suites are
   that something: the first holds the shipped content bank to the
   mechanical rules, the second holds the generation constraint that keeps a
   model from inventing a name or a number onto a keepsake.
*/

import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { checkVoice } from "./subdomains/mybirth/tools/check-voice.mjs";
import { validateCopy, copyIsSafe } from "./subdomains/mybirth/tools/validate-copy.mjs";

const CONTENTS = join(import.meta.dirname, "subdomains", "mybirth", "src", "contents");

describe("the content bank obeys VOICE.md", () => {
  it("has no violations", () => {
    const problems = checkVoice();
    // printed in full, because "1 problem" is useless when it fails in CI
    expect(problems.map((p) => `${p.path}: ${p.rule} (${p.sample}) ${p.text.slice(0, 70)}`)).toEqual([]);
  });

  it("names nothing in the world and quotes no numbers", () => {
    /*
       The property that lets the readings stay true. Every line is written
       to be true of the *measurement*, so it can carry no proper noun and
       no figure of its own: the specificity arrives from the arithmetic
       printed underneath it. Validating the whole bank against an empty
       fact object is exactly that assertion.
    */
    const hits = [];
    const walk = (v, path) => {
      if (typeof v === "string") {
        for (const p of validateCopy(v, {})) hits.push(`${path}: ${p.kind} "${p.value}"`);
      } else if (Array.isArray(v)) v.forEach((x, i) => walk(x, `${path}[${i}]`));
      else if (v && typeof v === "object") {
        for (const [k, x] of Object.entries(v)) if (k !== "_comment") walk(x, `${path}.${k}`);
      }
    };
    for (const file of readdirSync(CONTENTS).filter((f) => f.endsWith(".json"))) {
      walk(JSON.parse(readFileSync(join(CONTENTS, file), "utf8")), file);
    }
    expect(hits).toEqual([]);
  });
});

describe("generated copy is checked against its facts", () => {
  const facts = {
    moon: { name: "Waning Crescent", illumination: 0.091 },
    aspect: { body: "Mars", natal: "Venus", orb: 1.4, kind: "square" },
    place: "Klang, Selangor, Malaysia",
    date: { day: 3, month: 8, year: 1994 },
  };

  it("accepts copy that only rephrases what it was given", () => {
    const text = "Mars is squaring your Venus at 1.4 degrees, under a Waning Crescent.";
    expect(validateCopy(text, facts)).toEqual([]);
    expect(copyIsSafe(text, facts)).toBe(true);
  });

  it("catches a number nobody supplied", () => {
    const text = "Mars is squaring your Venus at 7.2 degrees.";
    const problems = validateCopy(text, facts);
    expect(problems).toContainEqual({ kind: "invented number", value: 7.2 });
  });

  it("catches a name nobody supplied", () => {
    // the classic failure: a plausible planet that is not in this chart
    const text = "Saturn is squaring your Venus at 1.4 degrees.";
    expect(validateCopy(text, facts)).toContainEqual({ kind: "invented name", value: "Saturn" });
  });

  it("catches an invented place", () => {
    const text = "The sky over Jakarta was clear at 1.4 degrees.";
    expect(validateCopy(text, facts).some((p) => p.value === "Jakarta")).toBe(true);
  });

  it("does not fire on ordinary capitalised English", () => {
    const text = "Today is the day. You will hear back by Friday, and not before.";
    expect(validateCopy(text, facts)).toEqual([]);
  });

  it("treats 6.30 and 6.3 as the same number", () => {
    expect(validateCopy("6.3 billion", { pop: "6.30" })).toEqual([]);
  });

  it("ignores thousands separators", () => {
    expect(validateCopy("11,238 days", { days: 11238 })).toEqual([]);
  });

  it("fails closed when it cannot tell", () => {
    const circular = {};
    circular.self = circular;
    expect(copyIsSafe("anything at all", circular)).toBe(false);
  });
});
