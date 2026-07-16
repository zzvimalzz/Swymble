import { describe, expect, it } from "vitest";

import { allRoutes, liveRoutes, navRoutes } from "@/config/navigation";

describe("route registry", () => {
  it("has unique ids and paths", () => {
    const ids = allRoutes.map((r) => r.id);
    const paths = allRoutes.map((r) => r.path);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(paths).size).toBe(paths.length);
  });

  it("uses absolute internal paths", () => {
    for (const route of allRoutes) {
      expect(route.path).toMatch(/^\//);
      expect(route.path).not.toMatch(/^https?:/);
    }
  });

  it("always has a live home route", () => {
    expect(liveRoutes.some((r) => r.path === "/")).toBe(true);
  });

  it("gives every nav route a label and description", () => {
    for (const route of navRoutes) {
      expect(route.label.length).toBeGreaterThan(0);
      expect(route.description.length).toBeGreaterThan(10);
    }
  });
});
