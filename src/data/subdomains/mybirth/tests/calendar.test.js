/*
   The calendar file.

   Worth testing hard for a reason the rest of the site is not: this is the only thing here that
   leaves the browser and is read by somebody else's software. A reading that renders badly is
   visible; an .ics with a lone LF, an unescaped comma or a UID that changes between exports is
   invisible until a stranger's calendar either refuses the file or fills up with duplicates.
*/

import { describe, it, expect } from "vitest";
import { buildICS, fold, eventUID, personToken, YEARS_AHEAD } from "../src/ui/calendar.js";
import { solarReturn, sunLongitude } from "../src/sky/astro.js";

/** Folded lines back into whole values, which is what a calendar reads and what a test should. */
const unfold = (s) => s.replace(/\r\n /g, "");

const NADIA = {
  key: "Nadia Ismail|17|5|1991",
  name: "Nadia Ismail",
  day: 17, month: 5, year: 1991,
  time: "11:25",
  lat: 3.139, lon: 101.6869, tz: "Asia/Kuala_Lumpur",
};
/*
   A comma and a semicolon in one name, which is the case that breaks a naive writer. Both are
   in the first word on purpose: the summary is built from the first name, exactly as every other
   screen addresses somebody, so punctuation after a space would never reach the file.
*/
const AWKWARD = { ...NADIA, key: "x|1|1|1980", name: "Ali,;Jr the second", day: 1, month: 1, year: 1980 };
const LEAPLING = { ...NADIA, key: "leap|29|2|2000", name: "Feb Person", day: 29, month: 2, year: 2000 };

const NOW = new Date(2026, 7, 15, 9, 0);
const ics = buildICS([NADIA], { now: NOW, origin: "https://mybirth.swymble.com" });
const all = ics.split("BEGIN:VEVENT").slice(1).map(unfold);

/** The events of one kind, in the order they arrive. */
const kind = (name) => all.filter((e) => e.includes(`-${name}-`));
const events = kind("return");

describe("the file is one a calendar will actually open", () => {
  it("wraps the events in a well-formed calendar", () => {
    expect(ics.startsWith("BEGIN:VCALENDAR\r\n")).toBe(true);
    expect(ics.endsWith("END:VCALENDAR\r\n")).toBe(true);
    expect(ics).toContain("VERSION:2.0");
    expect(ics).toContain("PRODID:-//Swymble//MyBirth//EN");
  });

  it("ends every line with CRLF and never with a lone newline", () => {
    expect(ics.replace(/\r\n/g, "")).not.toMatch(/\n/);
  });

  it("keeps every line inside 75 octets", () => {
    const enc = new TextEncoder();
    for (const line of ics.split("\r\n")) {
      expect(enc.encode(line).length, `too long: ${line}`).toBeLessThanOrEqual(75);
    }
  });

  it("folds onto continuation lines that begin with a space", () => {
    const long = fold(`DESCRIPTION:${"a".repeat(200)}`);
    const parts = long.split("\r\n");
    expect(parts.length).toBeGreaterThan(1);
    expect(parts.slice(1).every((p) => p.startsWith(" "))).toBe(true);
    /* and folding is reversible, which is the only property that matters */
    expect(parts.map((p, i) => (i ? p.slice(1) : p)).join("")).toBe(`DESCRIPTION:${"a".repeat(200)}`);
  });

  it("never breaks a multi-byte character in half", () => {
    const folded = fold(`SUMMARY:${"é".repeat(80)}`);
    expect(folded).not.toContain("�");
    expect(folded.replace(/\r\n /g, "")).toBe(`SUMMARY:${"é".repeat(80)}`);
  });

  it("escapes the four characters RFC 5545 reserves", () => {
    const awkward = unfold(buildICS([AWKWARD], { now: NOW }));
    expect(awkward).toContain("SUMMARY:Ali\\,\\;Jr turns");
    /* the description is multi-line, and a real newline inside a value ends the property */
    expect(awkward).toMatch(/DESCRIPTION:[^\r]*\\n/);
  });
});

describe("what the events say", () => {
  it("writes ten returns for one person, and the two lighter moments beside each", () => {
    expect(events).toHaveLength(YEARS_AHEAD);
    /*
       One more half-year than there are birthdays here, and that extra one is the point: born in
       May and exported in August, the nearest moment of the whole file is November's half-year,
       which an earlier version dropped along with the birthday that had already gone.
     */
    expect(kind("season")).toHaveLength(YEARS_AHEAD);
    expect(kind("half")).toHaveLength(YEARS_AHEAD + 1);
  });

  it("puts the days in the order they arrive, across every kind", () => {
    const dates = all.map((e) => e.match(/DTSTART;VALUE=DATE:(\d+)/)[1]);
    expect([...dates].sort()).toEqual(dates);
  });

  it("counts the ages up from the birth year", () => {
    /* born May 1991, generated in August 2026: the next return is the 36th, not the 35th */
    expect(events[0]).toContain("SUMMARY:Nadia turns 36");
    expect(events[1]).toContain("SUMMARY:Nadia turns 37");
  });

  it("starts with the next birthday, not one already past", () => {
    /* born 17 May, generated 15 August 2026: the 2026 birthday has gone */
    expect(events[0]).toContain("DTSTART;VALUE=DATE:20270517");
    expect(events[0]).toContain("DTEND;VALUE=DATE:20270518");
  });

  it("observes a leap-day birthday on 1 March in a common year", () => {
    const leap = buildICS([LEAPLING], { now: new Date(2026, 5, 1) })
      .split("BEGIN:VEVENT").slice(1).map(unfold)
      .filter((e) => e.includes("-return-"));
    expect(leap[0]).toContain("DTSTART;VALUE=DATE:20270301");
    expect(leap[1]).toContain("DTSTART;VALUE=DATE:20280229");
  });

  it("marks the half-year six calendar months on, and the season before the birthday", () => {
    /* born 17 May: the half-birthday is 17 November */
    expect(kind("half")[0]).toContain("DTSTART;VALUE=DATE:20261117");
    expect(kind("half")[0]).toContain("SUMMARY:Nadia is 35 and a half");
    /* born in Taurus, so the season opens on the equinox side of the birthday, weeks earlier */
    expect(kind("season")[0]).toContain("SUMMARY:Taurus season begins");
    expect(kind("season")[0]).toMatch(/DTSTART;VALUE=DATE:20270(4|5)/);
  });

  it("keeps six months from the end of a long month inside February", () => {
    const august31 = { ...NADIA, name: "Sam", key: "aug|31|8|1990", day: 31, month: 8, year: 1990 };
    const halves = (from) => buildICS([august31], { now: from })
      .split("BEGIN:VEVENT").slice(1).map(unfold)
      .filter((e) => e.includes("-half-"));
    /* the 31st of February is the last day of February, in a leap year and in a common one */
    expect(halves(new Date(2026, 8, 5))[0]).toContain("DTSTART;VALUE=DATE:20270228");
    expect(halves(new Date(2027, 8, 5))[0]).toContain("DTSTART;VALUE=DATE:20280229");
  });

  it("interrupts nobody for the two lighter moments", () => {
    expect(events[0]).toContain("BEGIN:VALARM");
    expect(kind("season")[0]).not.toContain("VALARM");
    expect(kind("half")[0]).not.toContain("VALARM");
  });

  it("carries a deep link that names the person to this browser and to nobody else", () => {
    const link = unfold(events[0]).match(/URL:(\S+)/)[1];
    expect(link).toBe(`https://mybirth.swymble.com/?person=${personToken(NADIA.key)}#today`);
    /*
       The file is imported into somebody's calendar, which copies it to a server that is not
       ours. The name is in the summary and cannot be helped; the birth date and the coordinates
       have no business being in a URL as well.
    */
    expect(link).not.toContain("1991");
    expect(link).not.toContain("Nadia");
    expect(link).not.toContain("la=");
  });

  it("says what the exact time is worth rather than quoting a minute it cannot stand behind", () => {
    expect(unfold(events[0])).toMatch(/give or take a quarter of an hour/);
  });

  it("reminds the reader at midday the day before, not at midnight", () => {
    expect(events[0]).toContain("TRIGGER;RELATED=START:-PT12H");
    expect(events[0]).toContain("ACTION:DISPLAY");
  });

  it("leaves the day free rather than booking it", () => {
    expect(events[0]).toContain("TRANSP:TRANSPARENT");
  });

  it("writes nothing at all when nobody is saved", () => {
    expect(buildICS([], { now: NOW })).toBe("");
    expect(buildICS(null, { now: NOW })).toBe("");
  });
});

describe("re-importing does not duplicate anybody", () => {
  it("keeps a UID stable across exports taken at different moments", () => {
    const later = buildICS([NADIA], { now: new Date(2026, 7, 16, 3, 0) })
      .split("BEGIN:VEVENT").slice(1).map(unfold)
      .filter((e) => e.includes("-return-"));
    const uid = (s) => s.match(/UID:(\S+)/)[1];
    expect(uid(later[0])).toBe(uid(events[0]));
  });

  it("gives two different people two different identifiers on the same day", () => {
    expect(eventUID(NADIA.key, 2027)).not.toBe(eventUID(AWKWARD.key, 2027));
  });

  it("keeps one person's three moments in a year apart from each other", () => {
    const uids = new Set(["return", "season", "half"].map((k) => eventUID(NADIA.key, 2027, k)));
    expect(uids.size).toBe(3);
  });
});

describe("the solar return is the astronomy, not the calendar", () => {
  const birth = new Date(Date.UTC(1991, 4, 17, 3, 25));

  it("lands where the sun is back at its natal degree", () => {
    const at = solarReturn(birth, 2027);
    const drift = ((sunLongitude(at) - sunLongitude(birth) + 540) % 360) - 180;
    expect(Math.abs(drift)).toBeLessThan(1e-5);
  });

  it("falls within a day and a half of the birthday, which is the drift the year carries", () => {
    for (const year of [2027, 2030, 2035]) {
      const at = solarReturn(birth, year);
      const anniversary = Date.UTC(year, 4, 17, 3, 25);
      expect(Math.abs(at.getTime() - anniversary) / 3600000).toBeLessThan(36);
    }
  });
});
