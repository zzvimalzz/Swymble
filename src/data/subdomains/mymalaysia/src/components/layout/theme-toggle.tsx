"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";

const emptySubscribe = () => () => {};

/** True after hydration; false in the server snapshot. */
function useHydrated() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}

/**
 * Light/dark toggle. Renders a neutral placeholder until hydrated so the
 * server markup never disagrees with the resolved theme.
 */
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const hydrated = useHydrated();

  const isDark = resolvedTheme === "dark";

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={hydrated ? (isDark ? "Switch to light theme" : "Switch to dark theme") : "Theme"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      {hydrated ? (
        isDark ? (
          <Sun className="size-4" aria-hidden />
        ) : (
          <Moon className="size-4" aria-hidden />
        )
      ) : (
        <span className="size-4" aria-hidden />
      )}
    </Button>
  );
}
