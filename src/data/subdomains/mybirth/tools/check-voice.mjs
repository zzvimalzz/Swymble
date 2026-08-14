/*
   The mechanical half of VOICE.md, enforced.

   A style guide nobody can run is a style guide nobody follows. Everything
   in here was measured against the content bank before it was written down,
   so these rules describe what the copy already is rather than an ideal it
   was never held to. Exactly one line failed at the time of writing: a
   reading that used the word "energy", which is the register the whole
   product exists to be the opposite of.

   Run: node tools/check-voice.mjs
   Also runs from the test suite, so a violation fails the build.
*/

import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CONTENTS = join(ROOT, "src", "sky", "contents");

/* ---------- the rules ---------- */

const BANNED = [
  {
    name: "em dash",
    re: /—/g,
    why: "the fingerprint of generated text; rewrite with a comma, a colon or a full stop",
  },
  {
    name: "en dash in prose",
    // ranges between digits are fine; between words it is an em dash in disguise
    re: /(?<=[A-Za-z]\s?)–(?=\s?[A-Za-z])/g,
    why: "use a comma or a full stop",
  },
  { name: "double hyphen", re: /--/g, why: "an em dash wearing a hat" },
  {
    name: "emoji",
    re: /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/gu,
    why: "they do not print, and they are not the register",
  },
  { name: "exclamation mark", re: /!/g, why: "nothing here is worth shouting about" },
  {
    name: "hedge",
    re: /\b(maybe|perhaps|possibly|arguably|somewhat|sort of|kind of|it seems that)\b/gi,
    why: "a sentence worth printing is worth asserting",
  },
  {
    name: "mystical vocabulary",
    re: /\b(the universe|energies|energy|fate|fated|destiny|destined|the cosmos|vibrations?|manifesting?)\b/gi,
    why: "these are claims that cannot be checked, and the product is the opposite bet",
  },
  {
    name: "americanism",
    re: /\b(color|colors|honor|honors|favorite|center|centered|traveling|gray|realize|realized|recognize|recognized|analyze|apologize|behavior|defense|fulfill)\b/gi,
    why: "British spelling throughout",
  },
  {
    name: "throat-clearing",
    re: /\b(it is worth noting|interestingly|of course,|needless to say)\b/gi,
    why: "start the sentence at the sentence",
  },
];

const LIMITS = {
  headline: { max: 72, why: "the headline is the screenshot" },
  body: { max: 130, sentences: 2, why: "two further clauses are appended to it" },
};

/* ---------- walking the bank ---------- */

/** Every string in the content bank, with a path saying where it lives. */
function collect() {
  const out = [];
  const walk = (v, path) => {
    if (typeof v === "string") out.push({ path, text: v });
    else if (Array.isArray(v)) v.forEach((x, i) => walk(x, `${path}[${i}]`));
    else if (v && typeof v === "object") {
      // _comment blocks are notes to whoever edits the file, not copy
      for (const [k, x] of Object.entries(v)) if (k !== "_comment") walk(x, `${path}.${k}`);
    }
  };
  for (const file of readdirSync(CONTENTS).filter((f) => f.endsWith(".json"))) {
    walk(JSON.parse(readFileSync(join(CONTENTS, file), "utf8")), file);
  }
  return out;
}

/** The visible copy in the shell, with markup, comments and scripts removed. */
function shellCopy() {
  const html = readFileSync(join(ROOT, "index.html"), "utf8");
  const body = html.slice(html.indexOf("<body"));
  const text = body
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<script[\s\S]*?<\/script>/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z]+;/gi, " ");
  return [{ path: "index.html", text }];
}

const countSentences = (s) => (s.match(/[.?!]["')\]]?(\s|$)/g) || []).length;

/* ---------- the check ---------- */

export function checkVoice() {
  const problems = [];
  const strings = [...collect(), ...shellCopy()];

  for (const { path, text } of strings) {
    for (const rule of BANNED) {
      rule.re.lastIndex = 0;
      const found = text.match(rule.re);
      if (found) {
        problems.push({ path, rule: rule.name, why: rule.why, sample: found.slice(0, 3).join(", "), text });
      }
    }
  }

  /*
     The line of the day is held to the headline rules and held harder,
     because it is the one string here that will one day arrive on a lock
     screen with no label above it and no measurement below it. A card
     headline that runs long wraps. This one gets cut off mid-sentence by
     an operating system, and nobody sees the rest of it ever.
  */
  const lines = JSON.parse(readFileSync(join(CONTENTS, "lines.json"), "utf8")).lines;
  for (const [area, tones] of Object.entries(lines)) {
    for (const [tone, text] of Object.entries(tones)) {
      const at = `lines.json ${area}.${tone}`;
      if (text.length > LIMITS.headline.max) {
        problems.push({ path: at, rule: "line too long", why: "a notification is truncated, not wrapped", sample: `${text.length} chars`, text });
      }
      if (/\?\s*$/.test(text)) {
        problems.push({ path: at, rule: "line is a question", why: "a short declarative or nothing", sample: "", text });
      }
      if (!/[.]\s*$/.test(text)) {
        problems.push({ path: at, rule: "line does not end in a full stop", why: "it is a sentence on its own, not a fragment under a label", sample: "", text });
      }
    }
  }

  // headline and body shape, which only readings.json has
  const readings = JSON.parse(readFileSync(join(CONTENTS, "readings.json"), "utf8")).readings;
  for (const [area, tones] of Object.entries(readings)) {
    for (const [tone, variants] of Object.entries(tones)) {
      variants.forEach(([headline, body], i) => {
        const at = `readings.json ${area}.${tone}[${i}]`;
        if (headline.length > LIMITS.headline.max) {
          problems.push({ path: at, rule: "headline too long", why: LIMITS.headline.why, sample: `${headline.length} chars`, text: headline });
        }
        if (/\?\s*$/.test(headline)) {
          problems.push({ path: at, rule: "headline is a question", why: "a short declarative or nothing", sample: "", text: headline });
        }
        if (body.length > LIMITS.body.max) {
          problems.push({ path: at, rule: "body too long", why: LIMITS.body.why, sample: `${body.length} chars`, text: body });
        }
        if (countSentences(body) > LIMITS.body.sentences) {
          problems.push({ path: at, rule: "body runs on", why: LIMITS.body.why, sample: `${countSentences(body)} sentences`, text: body });
        }
      });
    }
  }
  return problems;
}

/* ---------- run directly ---------- */

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const problems = checkVoice();
  if (!problems.length) {
    console.log("voice: clean");
    process.exit(0);
  }
  console.error(`voice: ${problems.length} problem(s)\n`);
  for (const p of problems) {
    console.error(`  ${p.path}`);
    console.error(`    ${p.rule}${p.sample ? ` (${p.sample})` : ""}: ${p.why}`);
    console.error(`    ${p.text.slice(0, 100)}\n`);
  }
  process.exit(1);
}
