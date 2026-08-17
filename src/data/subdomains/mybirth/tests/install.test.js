/*
   The install offer.

   One pure rule and a service worker, so this suite covers the rule and reads the worker as text.
   The worker cannot be executed here — it wants caches, clients and a fetch event — but the two
   things that would actually hurt somebody are visible in the source: caching a cross-origin API
   response, and serving a stale page in front of a real 404.
*/

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { installDecision, DISMISS_DAYS } from "../src/ui/install.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const NOW = Date.UTC(2026, 7, 15);
const DAY = 86400000;

/** A visitor who would be offered the bar, so each case below changes exactly one thing. */
const offered = { promptable: true, savedPeople: 1, now: NOW };

describe("who is offered an install", () => {
  it("offers the prompt to somebody who has saved a person", () => {
    expect(installDecision(offered)).toBe("prompt");
  });

  it("says nothing to a first-time visitor", () => {
    expect(installDecision({ ...offered, savedPeople: 0 })).toBe("hidden");
  });

  it("says nothing inside an installed app", () => {
    expect(installDecision({ ...offered, standalone: true })).toBe("hidden");
  });

  it("respects a refusal for two months, then asks again", () => {
    expect(installDecision({ ...offered, dismissedAt: NOW - 3 * DAY })).toBe("hidden");
    expect(installDecision({ ...offered, dismissedAt: NOW - (DISMISS_DAYS + 1) * DAY })).toBe("prompt");
  });

  it("falls back to the share-sheet instructions on iOS, which fires no prompt", () => {
    expect(installDecision({ ...offered, promptable: false, ios: true })).toBe("ios");
    /* and a browser with neither a prompt nor a share sheet is told nothing at all */
    expect(installDecision({ ...offered, promptable: false, ios: false })).toBe("hidden");
  });

  it("defaults to hidden when it is asked nothing", () => {
    expect(installDecision()).toBe("hidden");
  });
});

describe("the service worker keeps its hands off other people's data", () => {
  const sw = readFileSync(join(ROOT, "public", "sw.js"), "utf8");

  it("never touches a cross-origin request", () => {
    expect(sw).toMatch(/url\.origin !== self\.location\.origin\) return/);
  });

  it("only stores a plain, whole, successful response", () => {
    expect(sw).toMatch(/response\.ok && response\.type === "basic"/);
  });

  it("falls back to the cached shell on a network failure, not on a bad status", () => {
    /* the fallback lives in the catch, so a 404 from the network is still a 404 to the reader */
    expect(sw).toMatch(/catch \{\s*const cached = await caches\.match\(SHELL_URL\)/);
  });

  it("leaves the megabyte-scale models out of the cache", () => {
    expect(sw).toMatch(/NEVER_CACHE = \[\/\^\\\/models\\\/\/\]/);
  });
});

describe("the manifest is installable", () => {
  const manifest = JSON.parse(readFileSync(join(ROOT, "public", "manifest.webmanifest"), "utf8"));

  it("declares the three fields a browser checks before it will offer an install", () => {
    expect(manifest.name).toBeTruthy();
    expect(manifest.start_url).toBeTruthy();
    expect(manifest.display).toBe("standalone");
  });

  it("ships a 192, a 512 and a maskable icon", () => {
    const sizes = manifest.icons.map((i) => i.sizes);
    expect(sizes).toContain("192x192");
    expect(sizes).toContain("512x512");
    expect(manifest.icons.some((i) => i.purpose === "maskable")).toBe(true);
  });

  it("opens on the same ground the site paints, so an install does not flash white", () => {
    expect(manifest.background_color).toBe("#05060c");
    expect(manifest.theme_color).toBe("#05060c");
  });
});
