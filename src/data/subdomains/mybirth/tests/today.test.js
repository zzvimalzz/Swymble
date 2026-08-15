/*
   The Daily Sky, rendered.

   dailySkyHTML returns a string and touches no DOM, which makes the whole
   screen cheap to assert on. Worth doing, because the failures this
   catches are the ones a passing engine hides: reading.js can compute
   eight perfect cards and today.js can still drop half of them, print a
   polarity mark with no name beside it, or lose the measurement line that
   is the entire argument for the product.
*/

import { describe, it, expect } from "vitest";
import { buildProfile, dailySkyHTML, clickIsOnBackdrop, shareCardHTML } from "../src/ui/today.js";
import { dailyReading, AREA_KEYS, areaLabel } from "../src/sky/reading.js";
import depthFile from "../src/sky/contents/depth.json";
import touchesFile from "../src/sky/contents/touches.json";

const DEPTH = depthFile.depth;
const TOUCHES = touchesFile.touches;

const SAVE = {
  key: "test-person",
  name: "Test Person",
  day: 17, month: 5, year: 1991,
  time: "11:25",
  lat: 3.139, lon: 101.6869, tz: "Asia/Kuala_Lumpur",
};
const DAY = new Date(2026, 7, 14, 9, 0);

const profile = buildProfile(SAVE);
const html = dailySkyHTML(profile, { now: DAY });
const reading = dailyReading(profile, DAY);

/** Every card article in the rendered page, lead first. The class list is
    open-ended because the lead and the quiet cards carry modifiers. */
const cardBlocks = html.match(/<article class="sky-card[\s\S]*?<\/article>/g) || [];
const modalBlocks = html.match(/<dialog class="sky-modal[\s\S]*?<\/dialog>/g) || [];

describe("the Daily Sky renders what the engine computed", () => {
  it("builds a profile with an Ascendant, or the rest of this suite is vacuous", () => {
    expect(profile).not.toBeNull();
    expect(Number.isFinite(profile.ascendant)).toBe(true);
    expect(reading.quiet).toBe(false);
    expect(reading.cards.filter((c) => !c.quiet).length).toBeGreaterThan(1);
    expect(reading.cards.filter((c) => c.quiet).length).toBeGreaterThan(0);
  });

  it("prints a card for every one of the eight areas, every day", () => {
    expect(cardBlocks).toHaveLength(AREA_KEYS.length);
    expect(reading.cards).toHaveLength(AREA_KEYS.length);
    for (const key of AREA_KEYS) expect(html).toContain(`data-area="${key}"`);
  });

  it("names every area, so no card is a blank frame", () => {
    for (const key of AREA_KEYS) expect(html).toContain(areaLabel(key));
    for (const block of cardBlocks) {
      expect(block).toMatch(/<h2 class="sky-card__head">.{6,}<\/h2>/);
      expect(block).toMatch(/<p class="sky-card__body">.{40,}<\/p>/);
    }
  });

  it("gives the lead its headline and each card its own", () => {
    expect(html).toContain(reading.headline);
    for (const c of reading.cards) expect(html).toContain(c.headline);
  });

  it("labels no card as the lead and counts nothing in the heading", () => {
    /*
       Both were saying what the page already showed. The lead's headline
       is at the top in five-rem type, and a count of how many areas are
       touched implies the rest are empty, which is the reading this grid
       was rebuilt to stop giving.
    */
    // the section label "Today's leading angle" stays; the per-card one goes
    for (const block of cardBlocks) expect(block).not.toMatch(/lead<\/span>|s lead/i);
    expect(html).not.toMatch(/\d+ of \d+ touched/);
  });

  it("wears none of Co-Star's section names", () => {
    /*
       Not a legal guard: short labels are not copyrightable. It is a
       positioning one. The product's only claim is that it shows its
       working, and arriving in a competitor's headings makes that claim
       for a reader before they have read a word of it.
    */
    expect(html).not.toMatch(/day at a glance/i);
    expect(html).not.toMatch(/<p class="sky-dd__head">Don/);
    expect(html).toContain("Today&rsquo;s leading angle");
    expect(html).toContain(">More of<");
    expect(html).toContain(">Less of<");
  });
});

describe("every card carries arithmetic, quiet ones included", () => {
  it("prints the aspect and orb on a card that has a reading", () => {
    expect(html).toContain(reading.proof);
    for (const c of reading.cards.filter((x) => !x.quiet)) {
      const block = cardBlocks.find((b) => b.includes(`data-area="${c.area}"`));
      expect(block).toContain(c.label);
      expect(block).toContain(`${c.orb.toFixed(1)}&deg;`);
    }
  });

  it("prints how far outside orb the nearest angle sits on a quiet card", () => {
    /*
       The point of the quiet card. "Nothing today" is a shrug; "the
       nearest angle is 2.3 degrees outside the orb it would need" is a
       measurement, and it is the one a reader can check.
    */
    for (const c of reading.cards.filter((x) => x.quiet && x.nearest)) {
      const block = cardBlocks.find((b) => b.includes(`data-area="${c.area}"`));
      expect(block).toContain(`+${c.nearest.outside.toFixed(1)}&deg;`);
    }
  });

  it("writes no interpretation from an angle that is outside its orb", () => {
    /*
       The line this feature must not cross. Filling eight cards is easy if
       out-of-orb angles are allowed to generate prose; it is also the
       exact overclaim the product exists to refuse. A quiet card's words
       come from quiet.json and say nothing about the aspect.
    */
    for (const c of reading.cards.filter((x) => x.quiet)) {
      expect(c.tone).toBeNull();
      expect(c.polarity).toBeNull();
      if (c.nearest) {
        expect(c.body).not.toContain(c.nearest.transit.label);
        expect(c.body).not.toContain(c.nearest.aspect.key);
      }
    }
  });

  it("reads an unoccupied area off its sign rather than off the absence", () => {
    /*
       This assertion used to loop over `kind === "empty"` cards and pass
       vacuously on any chart that happened to have none. It now finds a
       chart that does, because the branch it covers is exactly the one the
       product gets wrong most easily: a card with no aspect, no transit
       and no planet of its own still has to say something true, and the
       sign on the sector is that something.
    */
    const found = [];
    for (const asc of [12.5, 60, 128.4, 200, 244.9, 300, 340]) {
      const r = dailyReading({ ...profile, key: `asc${asc}`, ascendant: asc }, DAY);
      found.push(...r.cards.filter((c) => c.kind === "empty"));
    }
    expect(found.length, "no empty area on any test chart").toBeGreaterThan(0);

    for (const c of found) {
      expect(c.natalHere).toHaveLength(0);
      expect(c.transitsHere).toHaveLength(0);
      expect(c.nearest).toBeNull();
      // the sign leads the sentence; the absence is only ever the qualifier
      expect(c.body.startsWith(c.sign.clause)).toBe(true);
      expect(c.headline).not.toMatch(/^(Nothing|No |None)/);
    }
  });

  it("opens no card, of any kind, on an absence", () => {
    /*
       The complaint this is here to catch. Four cards a morning headed
       "Nothing is reaching here today" is accurate and reads as four
       broken cards, which is the one way an honest grid can still lie
       about itself.
    */
    for (const c of reading.cards) {
      expect(c.headline, c.area).not.toMatch(/^(Nothing|No |None)\b/);
    }
    for (const block of cardBlocks) {
      expect(block).not.toContain("Nothing of yours here");
    }
  });

  it("gives no two quiet cards the same headline or the same footer", () => {
    /*
       The failure this whole split exists to prevent. Four areas without a
       reading is the normal shape of a morning, and an earlier version gave
       all four the same headline and the same footer, which reads as four
       broken cards rather than four measurements.
    */
    const quiet = reading.cards.filter((c) => c.quiet);
    expect(quiet.length).toBeGreaterThan(1);

    const feet = quiet.map((c) => {
      const block = cardBlocks.find((b) => b.includes(`data-area="${c.area}"`));
      return block.match(/<p class="sky-card__proof">[\s\S]*?<\/p>/)[0];
    });
    expect(new Set(feet).size).toBe(feet.length);
    expect(new Set(quiet.map((c) => c.headline)).size).toBe(quiet.length);
  });
});

describe("the polarity mark", () => {
  it("marks every reading card, and marks no quiet one", () => {
    for (const c of reading.cards) {
      const block = cardBlocks.find((b) => b.includes(`data-area="${c.area}"`));
      if (c.quiet) {
        expect(block).toContain('data-polarity="quiet"');
      } else {
        expect(block).toContain(`data-polarity="${c.polarity.key}"`);
      }
    }
  });

  it("never draws the mark without naming it", () => {
    const marks = html.match(/<span class="sky-pol[\s\S]*?<\/span>\s*<\/span>/g) || [];
    expect(marks.length).toBeGreaterThan(0);
    for (const m of marks) {
      expect(m).toMatch(/>(Support|Strain|Charged|Quiet)<\/span>/);
    }
  });

  it("mints no SVG ids, so two cards of the same polarity cannot collide", () => {
    expect(html).not.toMatch(/<(pattern|clipPath|mask|linearGradient)\b/);
    const svgs = html.match(/<svg class="sky-pol__mark[\s\S]*?<\/svg>/g) || [];
    expect(svgs.length).toBeGreaterThan(0);
    for (const s of svgs) expect(s).not.toMatch(/\sid="/);
  });
});

describe("expanding a card", () => {
  it("ships one dialog per card, already in the document", () => {
    /*
       Already rendered, so opening one fetches nothing and rebuilds
       nothing. A popup that recomputed its contents could hand back a
       different sentence for the same day.
    */
    expect(modalBlocks).toHaveLength(reading.cards.length);
    for (const c of reading.cards) {
      expect(html).toContain(`data-modal-for="${c.area}"`);
      expect(html).toContain(`data-expand="${c.area}"`);
    }
  });

  it("labels the dialog and gives it a close button that needs no script", () => {
    for (const m of modalBlocks) {
      expect(m).toMatch(/aria-labelledby="sky-modal-head-[a-z]+"/);
      expect(m).toContain('<form method="dialog">');
      expect(m).toMatch(/aria-label="Close"/);
    }
  });

  it("puts the full measurement row in a reading card's dialog", () => {
    for (const c of reading.cards.filter((x) => !x.quiet)) {
      const m = modalBlocks.find((b) => b.includes(`data-modal-for="${c.area}"`));
      expect(m).toContain(c.proof);
      expect(m).toContain(c.transitSign.sign);
      expect(m).toContain(c.natalSign.sign);
      expect(m).toContain("orb allowed");
    }
  });

  it("expands every card to between one and three paragraphs", () => {
    for (const c of reading.cards) {
      expect(c.paragraphs.length).toBeGreaterThanOrEqual(1);
      expect(c.paragraphs.length).toBeLessThanOrEqual(3);
      // the compact card showed the first one; the expansion adds, never replaces
      expect(c.paragraphs[0]).toBe(c.body);

      const m = modalBlocks.find((b) => b.includes(`data-modal-for="${c.area}"`));
      const rendered = m.match(/<p class="sky-modal__body">/g) || [];
      expect(rendered).toHaveLength(c.paragraphs.length);
      for (const p of c.paragraphs) expect(p.length).toBeGreaterThan(80);
    }
  });

  it("makes the second paragraph about the point that took the aspect", () => {
    /*
       Paragraph two used to be keyed by area and tone, which is the same
       address the body came from, so expanding a card printed the card
       again in longer words. It is keyed by the natal point now, which is
       a genuinely different dimension.

       They still all differ, and for a stronger reason than before: one
       card per area, and an area is derived from where its natal point
       sits, so no two cards in a render can share a natal point.
    */
    const reads = reading.cards.filter((c) => !c.quiet);
    expect(reads.length).toBeGreaterThan(2);

    const second = reads.map((c) => c.paragraphs[1]);
    expect(new Set(second).size, "second paragraphs must all differ").toBe(second.length);

    for (const c of reads) {
      expect(c.paragraphs[1]).toBe(TOUCHES[c.aspect.natal.key][c.tone]);
    }
  });

  it("keeps the mechanical explanation last, where it is marked as one", () => {
    for (const c of reading.cards.filter((x) => !x.quiet)) {
      const last = c.paragraphs[c.paragraphs.length - 1];
      expect(last).toContain(DEPTH.natal[c.aspect.natal.key]);
      expect(last).toContain(DEPTH.transit[c.aspect.transit.key]);
    }
  });

  it("gives a quiet card its sign material, which is where its depth comes from", () => {
    for (const c of reading.cards.filter((x) => x.quiet)) {
      expect(c.paragraphs).toHaveLength(3);
      expect(c.body).toContain(c.sign.clause);
      expect(c.paragraphs[1]).toBe(c.sign.depth);
      // the sign is named by the chart, never by the copy, so the bank
      // cannot be wrong about which sign a sector runs in
      for (const s of c.signs) {
        expect(c.sign.clause).not.toContain(s.sign);
        expect(c.sign.depth).not.toContain(s.sign);
      }
    }
  });

  it("puts the four reasons in a quiet card's dialog", () => {
    for (const c of reading.cards.filter((x) => x.quiet)) {
      const m = modalBlocks.find((b) => b.includes(`data-modal-for="${c.area}"`));
      expect(m).toContain("Why it is quiet");
      expect(m).toContain("The sector runs in");
      expect(m).toContain("Your planets here");
      expect(m).toContain("Passing through today");
      if (c.nearest) expect(m).toContain("Outside its orb by");
    }
  });

  it("closes on a click outside the card and not on one inside it", () => {
    /*
       A native <dialog> reports a backdrop click as a click on itself, so
       the only way to tell them apart is the point against the box. No DOM
       environment in this project, so the rule is tested apart from it.
    */
    const rect = { left: 100, right: 500, top: 100, bottom: 400 };
    expect(clickIsOnBackdrop({ clientX: 20, clientY: 200 }, rect)).toBe(true);
    expect(clickIsOnBackdrop({ clientX: 300, clientY: 50 }, rect)).toBe(true);
    expect(clickIsOnBackdrop({ clientX: 300, clientY: 250 }, rect)).toBe(false);
    // a keyboard-triggered click reports 0,0 and must not close the dialog
    expect(clickIsOnBackdrop({ clientX: 0, clientY: 0 }, rect)).toBe(false);
  });
});

describe("the shareable card", () => {
  const moon = { fraction: 0.31, illumination: 0.62, name: "Waxing Gibbous" };

  it("carries the measurement, so the claim travels with its evidence", () => {
    /*
       The entire argument for building this. A shared horoscope is a
       claim nobody can check; a shared card with the two bodies, the
       angle, the orb and the date on it is a claim and its evidence in
       one image, which is what the category cannot copy without becoming
       checkable itself.
    */
    const card = reading.cards.find((c) => !c.quiet);
    const svg = shareCardHTML(card, { profile, moon, date: DAY });

    expect(svg).toContain(card.areaLabel);
    expect(svg).toContain(card.headline);
    expect(svg).toContain(card.label);
    expect(svg).toContain(`${card.orb.toFixed(1)}&deg; off exact`);
    expect(svg).toContain("2026");
    expect(svg).toContain("mybirth.swymble.com");
  });

  it("prints the whole paragraph, not the three lines the grid shows", () => {
    /*
       The card on screen clamps its body to three lines in CSS. Capturing
       that node would have shared an ellipsis, which is why the share
       image is laid out fresh rather than photographed off the grid.
    */
    const card = reading.cards.find((c) => !c.quiet);
    const svg = shareCardHTML(card, { profile, moon, date: DAY });
    expect(svg).toContain(card.body);
    expect(svg).not.toContain("line-clamp");
  });

  it("says of a quiet card that nothing was in orb, rather than inventing an angle", () => {
    const quiet = reading.cards.find((c) => c.quiet);
    const svg = shareCardHTML(quiet, { profile, moon, date: DAY });
    expect(svg).toContain("nothing within orb");
    expect(svg).not.toMatch(/off exact/);
  });

  it("offers a save button on every expanded card", () => {
    for (const c of reading.cards) {
      const m = modalBlocks.find((b) => b.includes(`data-modal-for="${c.area}"`));
      expect(m).toContain(`data-share="${c.area}"`);
      expect(m).toMatch(/aria-label="Save this card as an image"/);
    }
  });
});

describe("the birth-time gate", () => {
  it("asks for a time instead of guessing an Ascendant", () => {
    const noTime = buildProfile({ ...SAVE, time: "" });
    const asked = dailySkyHTML(noTime, { now: DAY });
    expect(asked).toContain("Add your birth time");
    expect(asked).not.toContain("sky-card");
  });
});
