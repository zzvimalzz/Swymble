/*
   Everybody's returns, as a calendar file.

   The one thing on this site that keeps working after the tab is closed. A saved person is a
   reminder the reader has already asked for and cannot currently get, because it lives in a
   browser they have to remember to open. Ten years of returns, imported once, moves it to the
   surface every phone already checks.

   Two decisions worth defending.

   The event is dated on the *birthday*, not on the solar return. They are not the same day: the
   year is not a whole number of days, so the Sun's actual return to its natal degree drifts by
   about six hours a year and can land either side of midnight. A calendar entry that appears the
   day before somebody's birthday is a broken calendar entry, whatever the astronomy says. So the
   date is the convention, and the astronomy goes in the description, where it can be qualified.

   And it is qualified. The return instant is computed from the low-precision solar series, which
   is good to about a quarter of an hour, so the description says a quarter of an hour rather
   than printing a minute the model cannot stand behind. This is the same rule the rest of the
   product follows: print the figure, and print what it is worth.

   Everything here is a pure function of its arguments. The file is built, escaped and folded
   without touching the DOM, which is what makes it testable.
*/

import {
  solarReturn, solarHalfReturn, seasonStart, signAt, sunLongitude, birthdayIn, halfBirthday,
} from "../sky/astro.js";
import { buildProfile } from "./today.js";

const HOST = "mybirth.swymble.com";
const PRODID = `-//Swymble//MyBirth//EN`;

/** How many returns ahead to write. Ten years is two kilobytes a person and outlasts the phone. */
export const YEARS_AHEAD = 10;

/*
   RFC 5545 is picky in three ways that all silently produce a file no calendar will open:
   the line ending is CRLF and nothing else, a line is at most 75 octets before it must be
   folded onto a continuation beginning with a space, and four characters have to be escaped
   inside a text value.
*/
const CRLF = "\r\n";

const escapeText = (value) => String(value)
  .replace(/\\/g, "\\\\")
  .replace(/;/g, "\\;")
  .replace(/,/g, "\\,")
  .replace(/\r?\n/g, "\\n");

/**
 * Fold to 75 octets, counting UTF-8 bytes rather than characters: a name is not always ASCII.
 * The break is taken between characters, never inside one, or a two-byte letter arrives at the
 * far end split down the middle.
 */
export function fold(line) {
  const enc = new TextEncoder();
  if (enc.encode(line).length <= 75) return line;

  const parts = [];
  let part = "";
  let width = 0;
  let limit = 75;

  for (const ch of line) {
    const size = enc.encode(ch).length;
    if (width + size > limit) {
      parts.push(part);
      part = "";
      width = 0;
      limit = 74;               // the continuation's leading space costs an octet
    }
    part += ch;
    width += size;
  }
  if (part) parts.push(part);
  return parts.map((p, i) => (i === 0 ? p : ` ${p}`)).join(CRLF);
}

const pad = (n) => String(n).padStart(2, "0");

/** A floating date, as a calendar reads an all-day event: no zone, no time. */
const dateValue = (d) => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;

/** An absolute instant, in UTC, which is the only form DTSTAMP may take. */
const stampValue = (d) =>
  `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T` +
  `${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;

/**
 * A saved person, as a short opaque token.
 *
 * The obvious address for a person is their storage key, and the key is `name|day|month|year`.
 * That is fine inside a browser and wrong inside this file: an imported calendar is copied to
 * Google's or Apple's servers, and every event would have carried a birth date in a URL. The
 * event already says the name and the day, so the leak is small, but there is no reason to
 * write it twice and the token is shorter to read.
 *
 * FNV-1a, because it is four lines and the only property needed is determinism. main.js resolves
 * a token by hashing each saved key, so nothing has to be stored to make this reversible.
 */
export function personToken(key) {
  let h = 0x811c9dc5;
  for (let i = 0; i < String(key).length; i++) {
    h ^= String(key).charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(36);
}

/**
 * A stable identifier for one person's return in one year.
 *
 * Stability is the whole job: a calendar treats a repeated UID as the same event and updates it,
 * and a fresh one as a new event. Re-importing next month's file must not leave every birthday
 * in the calendar twice, so this is derived from the saved key and never from the moment of
 * export.
 */
export function eventUID(key, year, kind = "return") {
  return `${personToken(key)}-${kind}-${year}@${HOST}`;
}

/** The day after, which is what an all-day event's exclusive end date has to be. */
const dayAfter = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);

const timeFormat = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false });
const dateFormat = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric" });

/** One all-day event, as VEVENT lines. */
function vevent({ uid, stamp, date, summary, description, link, alarm = null }) {
  return [
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${stampValue(stamp)}`,
    `DTSTART;VALUE=DATE:${dateValue(date)}`,
    `DTEND;VALUE=DATE:${dateValue(dayAfter(date))}`,
    `SUMMARY:${escapeText(summary)}`,
    `DESCRIPTION:${escapeText(description)}`,
    `URL:${link}`,
    "CATEGORIES:MyBirth",
    /* none of these make the reader busy */
    "TRANSP:TRANSPARENT",
    ...(alarm ? [
      "BEGIN:VALARM",
      "ACTION:DISPLAY",
      `DESCRIPTION:${escapeText(alarm)}`,
      /* midday the day before: an all-day event starts at midnight, and nobody reads a
         notification that arrives while they are asleep */
      "TRIGGER;RELATED=START:-PT12H",
      "END:VALARM",
    ] : []),
    "END:VEVENT",
  ];
}

/** The Sun's own account of a moment, qualified by what the model is worth. */
const exactly = (verb, at) =>
  `The Sun ${verb} at ${timeFormat.format(at)} on ${dateFormat.format(at)}, by your clock, ` +
  `give or take a quarter of an hour.`;

/**
 * One person's next `years` years, as three moments each.
 *
 * The return is the day itself and is the only one that raises an alarm. The other two are meant
 * to be light: they appear in the month view, they say something checkable, and they do not
 * interrupt anybody. That is the whole design of a visit moment that nobody asked for.
 */
function eventsFor(save, { now, years, origin, stamp }) {
  const profile = buildProfile(save);
  if (!profile) return [];

  const first = profile.first || profile.name;
  const link = `${origin}/?person=${personToken(profile.key)}#today`;
  const natalSign = signAt(sunLongitude(profile.birthDate)).sign;
  const out = [];
  let birthdays = 0;

  const add = (date, lines) => { if (dayAfter(date) > now) out.push({ date, lines }); };

  for (let y = now.getFullYear(); birthdays < years && y <= now.getFullYear() + years + 2; y++) {
    const birthday = birthdayIn(y, profile.month, profile.day);
    /*
       A birthday already gone does not end the year. Its half-year is six months *later* and is
       very often the nearest moment of the lot: skipping the whole year here left the file
       starting months further out than it needed to. Only future birthdays count against the
       ten-year budget; add() drops whatever has already happened.
    */
    if (dayAfter(birthday) > now) birthdays++;

    const age = y - profile.year;

    add(birthday, vevent({
      uid: eventUID(profile.key, y, "return"),
      stamp, date: birthday, link,
      summary: `${first} turns ${age}`,
      description: `${first} turns ${age}.\n`
        + `${exactly("comes back to the degree it held at their birth", solarReturn(profile.birthDate, y))}\n`
        + `The sky that morning: ${link}`,
      alarm: `${first} turns ${age} tomorrow`,
    }));

    /*
       The season the Sun was in when they were born, starting again. It opens two to four weeks
       before the birthday and is the one moment here that is not about a date at all.
    */
    const season = seasonStart(profile.birthDate, y);
    add(season, vevent({
      uid: eventUID(profile.key, y, "season"),
      stamp, date: season, link,
      summary: `${natalSign} season begins`,
      description: `The month ${first} was born into, coming round again.\n`
        + `${exactly(`enters ${natalSign}`, season)}\n`
        + `Where it stands against their chart: ${link}`,
    }));

    const half = halfBirthday(y, profile.month, profile.day);
    add(half, vevent({
      uid: eventUID(profile.key, y, "half"),
      stamp, date: half, link,
      summary: `${first} is ${age} and a half`,
      description: `Half a year since ${first} turned ${age}, and half a year to the next one.\n`
        + `${exactly("stands opposite the degree it held at their birth", solarHalfReturn(profile.birthDate, y))}\n`
        + `The sky that day: ${link}`,
    }));
  }
  return out;
}

/**
 * The whole calendar, as one .ics file.
 *
 * @param {object[]} people saved records, exactly as they sit in localStorage
 * @param {object}   [options]
 * @param {Date}     [options.now]    the moment past returns are counted from
 * @param {string}   [options.origin] where the deep links point
 * @param {number}   [options.years]  how many returns per person
 * @returns {string} an RFC 5545 document, CRLF-terminated, or "" when there is nobody to write
 */
export function buildICS(people, { now = new Date(), origin = `https://${HOST}`, years = YEARS_AHEAD } = {}) {
  /*
     Sorted by date across everybody rather than grouped by person. Calendars sort for themselves,
     but a file read by a human, or diffed against last month's, is far easier to follow in the
     order the days actually arrive.
  */
  const bodies = (people || [])
    .flatMap((save) => eventsFor(save, { now, years, origin, stamp: now }))
    .sort((a, b) => a.date - b.date)
    .map((e) => e.lines);
  if (!bodies.length) return "";

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:${PRODID}`,
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:MyBirth returns",
    "X-WR-CALDESC:The days coming back, from mybirth.swymble.com",
    ...bodies.flat(),
    "END:VCALENDAR",
  ];
  return lines.map(fold).join(CRLF) + CRLF;
}

/** What the file is called once it reaches somebody's downloads folder. */
export const ICS_FILENAME = "mybirth-returns.ics";
