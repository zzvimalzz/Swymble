/*
   Correctness guards for the MyBirth astronomy layer.

   The root suite excludes src/data/subdomains/** so that each subdomain app
   can own its own tests, and MyBirth has no suite yet. These three areas are
   worth covering from here anyway, because each one shipped wrong and none
   of them is the kind of wrong a build catches: the page renders perfectly
   and prints the wrong number.
*/

import { describe, it, expect } from "vitest";
import {
  zonedToUTC, chineseZodiac, lunarNewYear, moonPhase, weekday, zoneIsUncertain,
} from "./subdomains/mybirth/src/astro.js";

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
