"use client";

import { ThemeProvider } from "next-themes";

import { TooltipProvider } from "@/components/ui/tooltip";
import { CommandPaletteProvider } from "@/components/layout/command-palette";

/** Client-side context stack for the whole app. Rendered once in the root layout. */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <TooltipProvider delayDuration={200}>
        <CommandPaletteProvider>{children}</CommandPaletteProvider>
      </TooltipProvider>
    </ThemeProvider>
  );
}
