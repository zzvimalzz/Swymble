import { describe, expect, it } from "vitest";

import { cn } from "@/lib/utils";

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("px-2", "text-sm")).toBe("px-2 text-sm");
  });

  it("resolves conflicting Tailwind classes in favour of the last one", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
  });

  it("ignores falsy values", () => {
    expect(cn("px-2", false, undefined, null, "")).toBe("px-2");
  });
});
