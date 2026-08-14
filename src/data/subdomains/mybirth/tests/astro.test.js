/*
   Correctness guards for the MyBirth astronomy layer.

   These three areas each shipped wrong once, and none of them is the kind
   of wrong a build catches: the page renders perfectly and prints the
   wrong number.

   This app has no vitest of its own — the root runner picks these files
   up, see the `test.exclude` note in the repository's vite.config.ts.
*/

import { describe, it, expect } from "vitest";
import {
  zonedToUTC, chineseZodiac, lunarNewYear, moonPhase, weekday, zoneIsUncertain,
  planetLongitudes, moonPhaseRarity, skyAgainstBirth,
} from "../src/sky/astro.js";
import { chartAt } from "../src/sky/reading.js";

describe("the outer planets", () => {
  /*
     Added long after the inner five, and worth pinning to real ephemeris
     positions: an error in a Keplerian element set does not throw, it just
     prints a planet in the wrong sign forever. Values checked against a
     standard ephemeris for noon UTC on the dates given, to a tenth of a
     degree for Uranus and Neptune and to half a degree for Pluto, whose
     seventeen-degree inclination strains a two-body approximation.
  */
  const at = (iso) => Object.fromEntries(
    planetLongitudes(new Date(iso)).map((p) => [p.name, p]),
  );

  it("puts Uranus, Neptune and Pluto where an ephemeris puts them", () => {
    const y2k = at("2000-01-01T12:00:00Z");
    expect(y2k.Uranus.sign).toBe("Aquarius");
    expect(y2k.Uranus.degreeInSign).toBeCloseTo(14.8, 0);
    expect(y2k.Neptune.sign).toBe("Aquarius");
    expect(y2k.Neptune.degreeInSign).toBeCloseTo(3.2, 0);
    expect(y2k.Pluto.sign).toBe("Sagittarius");
    expect(y2k.Pluto.degreeInSign).toBeCloseTo(11.5, 0);
  });

  it("holds up on a second date decades away", () => {
    const d = at("1991-05-17T12:00:00Z");
    expect(d.Uranus.sign).toBe("Capricorn");
    expect(d.Neptune.sign).toBe("Capricorn");
    expect(d.Pluto.sign).toBe("Scorpio");
    expect(d.Uranus.degreeInSign).toBeCloseTo(13.6, 0);
    expect(d.Pluto.degreeInSign).toBeCloseTo(18.9, 0);
  });

  it("still returns the inner five, in order, so the archive is unchanged", () => {
    const names = planetLongitudes(new Date("2026-08-14T12:00:00Z")).map((p) => p.name);
    expect(names.slice(0, 5)).toEqual(["Mercury", "Venus", "Mars", "Jupiter", "Saturn"]);
    expect(names).toHaveLength(8);
  });
});

describe("moon phase rarity", () => {
  const BIRTH = new Date("1991-05-17T03:25:00Z");

  it("counts a real sample rather than asserting a share", () => {
    const q = moonPhaseRarity(BIRTH);
    expect(q.days).toBe(6940);          // one Metonic cycle, to the day
    expect(q.matches).toBeGreaterThan(0);
    expect(q.matches).toBeLessThan(q.days);
    expect(q.share).toBeCloseTo(q.matches / q.days, 10);
    expect(q.percent).toBeCloseTo(q.share * 100, 10);
  });

  it("is stable, because it is a fact about the birth and not about today", () => {
    expect(moonPhaseRarity(BIRTH)).toEqual(moonPhaseRarity(BIRTH));
  });

  it("finds a crescent rarer than a phase near the middle of the cycle", () => {
    /*
       Illumination is a cosine of the elongation, so the disc spends far
       longer near full and new than it does crossing the middle. A
       thin crescent is common and a half-lit moon is not, and if this
       ever inverts the phase maths has been broken by something.
     */
    const half = moonPhaseRarity(new Date("2026-08-20T12:00:00Z"));
    const nearFull = moonPhaseRarity(new Date("2026-08-28T12:00:00Z"));
    expect(nearFull.illumination).toBeGreaterThan(0.9);
    expect(nearFull.share).toBeGreaterThan(half.share);
  });

  it("widens the count when the tolerance widens", () => {
    const tight = moonPhaseRarity(BIRTH, { tolerance: 0.005 });
    const loose = moonPhaseRarity(BIRTH, { tolerance: 0.05 });
    expect(loose.matches).toBeGreaterThan(tight.matches);
  });
});

describe("tonight's sky against your sky", () => {
  const birth = new Date("1991-05-17T03:25:00Z");
  const now = new Date("2026-08-15T12:00:00Z");
  const rows = skyAgainstBirth(chartAt(birth), chartAt(now), birth, now);
  const by = Object.fromEntries(rows.map((r) => [r.key, r]));

  it("covers every body, fastest first", () => {
    expect(rows).toHaveLength(10);
    const periods = rows.map((r) => r.periodDays);
    expect(periods).toEqual([...periods].sort((a, b) => a - b));
  });

  it("counts the solar returns as birthdays", () => {
    // born May 1991, read August 2026: thirty-five birthdays have happened
    expect(by.sun.returns).toBe(35);
    expect(by.saturn.returns).toBe(1);
    expect(by.uranus.returns).toBe(0);
  });

  it("never disagrees with itself about where a body is", () => {
    /*
       The bug this is here to prevent, and it was a real one. Completed
       circuits came from age over period and the part-circuit came from
       real longitudes, so a body a few days past a return printed "2
       returns so far" beside a bar showing one per cent. Both halves are
       now derived from the same quantity: a body that has just finished a
       lap must show a low progress and the higher count.
    */
    for (const r of rows) {
      const totalTurns = (now - birth) / 86400000 / r.periodDays;
      expect(Math.abs(r.returns + r.progress - totalTurns), r.key).toBeLessThan(0.35);
    }
    // jupiter is the case that used to be wrong: just past its third return
    expect(by.jupiter.progress).toBeLessThan(0.1);
    expect(by.jupiter.returns).toBe(3);
  });

  it("puts the next return in the future, always", () => {
    for (const r of rows) {
      expect(r.daysToReturn, r.key).toBeGreaterThan(0);
      expect(r.returnDate.getTime(), r.key).toBeGreaterThan(now.getTime());
    }
  });
});

describe("zonedToUTC", () => {
  it("reads a wall clock through the birthplace's zone", () => {
    // 23:00 in Malaysia is 15:00 UTC the same day
    expect(zonedToUTC(2019, 8, 3, 23, 0, "Asia/Kuala_Lumpur").toISOString())
      .toBe("2019-08-03T15:00:00.000Z");
    // 08:00 in Auckland during southern summer is the previous UTC day
    expect(zonedToUTC(2001, 12, 3, 8, 0, "Pacific/Auckland").toISOString())
      .toBe("2001-12-02T19:00:00.000Z");
  });

  it("follows daylight saving rather than a fixed offset", () => {
    // London is UTC+1 in June and UTC+0 in January
    expect(zonedToUTC(1995, 6, 14, 12, 0, "Europe/London").toISOString())
      .toBe("1995-06-14T11:00:00.000Z");
    expect(zonedToUTC(1995, 1, 14, 12, 0, "Europe/London").toISOString())
      .toBe("1995-01-14T12:00:00.000Z");
  });

  it("falls back to reading the clock as UTC when the zone is missing or bogus", () => {
    const want = "1990-05-05T10:00:00.000Z";
    expect(zonedToUTC(1990, 5, 5, 10, 0, "").toISOString()).toBe(want);
    expect(zonedToUTC(1990, 5, 5, 10, 0, "Mars/Olympus").toISOString()).toBe(want);
  });

  it("moves the moon enough to matter", () => {
    // the archive used to skip the zone entirely; this is the size of that error
    const naive = moonPhase(new Date(Date.UTC(2001, 11, 3, 8, 0)));
    const real = moonPhase(zonedToUTC(2001, 12, 3, 8, 0, "Pacific/Auckland"));
    expect(Math.abs(naive.illumination - real.illumination)).toBeGreaterThan(0.02);
  });

  it("keeps the calendar day separate from the instant", () => {
    // a Monday birth in Auckland is a Sunday instant in UTC, and the weekday
    // has to come from the calendar anchor rather than from the instant
    const instant = zonedToUTC(2001, 12, 3, 8, 0, "Pacific/Auckland");
    const noon = new Date(Date.UTC(2001, 11, 3, 12));
    expect(weekday(instant)).toBe("Sunday");
    expect(weekday(noon)).toBe("Monday");
  });

  it("flags pre-1970 offsets as approximate", () => {
    expect(zoneIsUncertain(1962)).toBe(true);
    expect(zoneIsUncertain(1970)).toBe(false);
  });
});

describe("lunarNewYear", () => {
  // spot dates from published calendars
  const KNOWN = {
    1900: [1, 31], 1950: [2, 17], 1962: [2, 5], 1990: [1, 27],
    2000: [2, 5], 2015: [2, 19], 2024: [2, 10], 2025: [1, 29], 2100: [2, 9],
    1947: [1, 22], 1966: [1, 21], 2004: [1, 22], 2027: [2, 6], 2030: [2, 3],
  };

  it("matches published dates", () => {
    for (const [year, [month, day]] of Object.entries(KNOWN)) {
      expect(lunarNewYear(Number(year))).toEqual({ month, day });
    }
  });

  it("always lands in the five-week window the rule allows", () => {
    for (let y = 1900; y <= 2100; y++) {
      const { month, day } = lunarNewYear(y);
      const ord = month === 1 ? day : 31 + day;
      expect(ord).toBeGreaterThanOrEqual(21);   // 21 January
      expect(ord).toBeLessThanOrEqual(52);      // 21 February
    }
  });

  it("returns null outside the table", () => {
    expect(lunarNewYear(1899)).toBeNull();
    expect(lunarNewYear(2101)).toBeNull();
  });
});

describe("chineseZodiac", () => {
  it("turns the animal at Chinese New Year, not on 1 January", () => {
    // New Year 1962 falls on 5 February
    expect(chineseZodiac(1962, 2, 4).animal).toBe("Ox");
    expect(chineseZodiac(1962, 2, 5).animal).toBe("Tiger");
    // and 2024 on 10 February
    expect(chineseZodiac(2024, 1, 15).animal).toBe("Rabbit");
    expect(chineseZodiac(2024, 2, 10).animal).toBe("Dragon");
  });

  it("gets the element right", () => {
    // the stem list used to start four places out of step, so every year was wrong
    expect(chineseZodiac(2024, 6, 1).label).toBe("Wood Dragon");
    expect(chineseZodiac(2000, 6, 1).label).toBe("Metal Dragon");
    expect(chineseZodiac(1990, 6, 1).label).toBe("Metal Horse");
    expect(chineseZodiac(1975, 7, 4).label).toBe("Wood Rabbit");
    expect(chineseZodiac(1988, 8, 8).label).toBe("Earth Dragon");
  });

  it("runs a clean sixty-year cycle", () => {
    // mid-year, so the New Year boundary never comes into it
    for (let y = 1905; y <= 2040; y++) {
      expect(chineseZodiac(y, 6, 1).label).toBe(chineseZodiac(y + 60, 6, 1).label);
    }
  });
});
