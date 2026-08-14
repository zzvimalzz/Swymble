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

/*
   The body used to be capped at 130 characters and two sentences, on the
   grounds that two further clauses were appended to it. That cap is the
   reason every reading was a flat assertion: there was no room for a
   consequence or an instruction after the statement, so the bank was two
   hundred and twenty-five statements and nothing else.

   The body is the whole reading now. The shape it has to have is state,
   then consequence, then what to do, which does not fit in one sentence
   and does not need five hundred characters either.
*/
const LIMITS = {
  headline: { max: 72, why: "the headline is the screenshot" },
  body: {
    min: 120,
    max: 300,
    minSentences: 2,
    maxSentences: 6,
    why: "the body is the whole reading: state it, then say what to do about it",
  },
  /* the timing tail, which is appended to every body */
  motion: { max: 90, why: "it is a tail on a finished paragraph, not a sentence of its own" },
};

/*
   Rules that only apply to the reader-facing tables.
   These are the ones that caught the assembled-page failures.
*/
const JARGON = /\b(orb|applying|separating|exact|ephemeris|ecliptic|longitude|conjunct|sextile|quincunx|trine|square|opposition)\b/i;

/*
   Whether a piece is addressed to the reader at all.

   The first version of this test looked for "you" and nothing else, and it
   failed on a third of the bank for the wrong reason: an imperative is
   second person without ever using the pronoun. "Skip the apology. Say one
   true sentence about why they came to mind." There is no "you" in that
   and there is no doubt who it is talking to.

   So an imperative counts, detected by the verb a sentence opens on. The
   list is the one the bank actually uses, extracted the same way the stop
   list in validate-copy.mjs was. A verb missing from it fails closed,
   which costs somebody one line of maintenance and catches the real
   failure: a paragraph written in the third person about a measurement.
*/
const IMPERATIVES = new Set([
  "accept", "add", "answer", "argue", "ask", "assume", "bank", "be", "book",
  "build", "buy", "call", "cancel", "change", "check", "choose", "clear", "close",
  "come", "compare", "cook", "correct", "cut", "deal", "decide", "defend",
  "delete", "do", "draw", "enjoy", "explain", "feed", "fill", "find",
  "finish", "fix", "follow", "get", "give", "go", "have", "hold",
  "introduce", "invite", "judge", "keep", "know", "lead", "learn", "leave",
  "let", "list", "listen", "look", "lower", "make", "move", "name",
  "notice", "occupy", "pace", "pay", "pick", "play", "point", "prepare",
  "protect", "push", "put", "reach", "read", "reply", "rest", "return",
  "ring", "run", "save", "say", "see", "sell", "send", "set", "settle",
  "share", "ship", "show", "sit", "skip", "solve", "sort", "spend",
  "start", "stay", "stop", "store", "switch", "take", "teach", "tell",
  "test", "throw", "tidy", "trust", "try", "turn", "update", "use",
  "visit", "wait", "watch", "work", "write", "zoom",
]);

/** Second person, either by pronoun or by mood. */
function addressesTheReader(text) {
  if (/\byou(r|rs|rself)?\b/i.test(text)) return true;
  return text
    .split(/(?<=[.])\s+/)
    .some((s) => IMPERATIVES.has((s.match(/^[A-Za-z]+/) || [""])[0].toLowerCase()));
}

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
        if (body.length < LIMITS.body.min) {
          problems.push({ path: at, rule: "body too short", why: LIMITS.body.why, sample: `${body.length} chars`, text: body });
        }
        const n = countSentences(body);
        if (n > LIMITS.body.maxSentences || n < LIMITS.body.minSentences) {
          problems.push({ path: at, rule: "body is the wrong shape", why: LIMITS.body.why, sample: `${n} sentences`, text: body });
        }
        /*
           The rule that fixes the complaint the rewrite came from. A
           reading that never says "you" is a reading about the aspect,
           and a reading about the aspect is one the reader has to
           translate before it means anything.
        */
        if (!addressesTheReader(body)) {
          problems.push({ path: at, rule: "body never addresses the reader", why: "second person, or it is a description of a measurement", sample: "", text: body });
        }
        if (JARGON.test(body)) {
          problems.push({ path: at, rule: "astrology in the body", why: "the measurement is printed underneath; the reading is in English", sample: body.match(JARGON)[0], text: body });
        }
      });
    }
  }

  /*
     The timing tail. It is the last thing on every card, which is the
     position a reader is most likely to actually finish, and it used to be
     where the register broke: "Past exact now, and thinning out through
     the afternoon." Plain English, short, and no back-reference opening,
     because it now follows an instruction rather than a description.
  */
  const motion = JSON.parse(readFileSync(join(CONTENTS, "motion.json"), "utf8")).motion;
  for (const [body, states] of Object.entries(motion)) {
    states.forEach((variants, i) => {
      variants.forEach((text, v) => {
        const at = `motion.json ${body}[${i}][${v}]`;
        if (text.length > LIMITS.motion.max) {
          problems.push({ path: at, rule: "timing tail too long", why: LIMITS.motion.why, sample: `${text.length} chars`, text });
        }
        if (JARGON.test(text)) {
          problems.push({ path: at, rule: "astrology in the timing", why: "a reader does not know what past exact means", sample: text.match(JARGON)[0], text });
        }
      });
    });
  }

  /*
     Paragraph two. It used to be a clause wedged into the body and it is
     a paragraph of its own now, so it has to stand up alone: address the
     reader, and never open on a pronoun with nothing to refer back to.
  */
  const touches = JSON.parse(readFileSync(join(CONTENTS, "touches.json"), "utf8")).touches;
  for (const [point, tones] of Object.entries(touches)) {
    for (const [tone, text] of Object.entries(tones)) {
      const at = `touches.json ${point}.${tone}`;
      if (!addressesTheReader(text)) {
        problems.push({ path: at, rule: "paragraph never addresses the reader", why: "second person, or it is a description of a measurement", sample: "", text });
      }
      if (/^(It|This one|They)\b/.test(text)) {
        problems.push({ path: at, rule: "opens on a loose pronoun", why: "it is a paragraph now, and there is nothing above it for the pronoun to reach", sample: text.slice(0, 12), text });
      }
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
