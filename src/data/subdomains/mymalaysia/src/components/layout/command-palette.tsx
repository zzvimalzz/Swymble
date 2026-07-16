"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Laptop, Moon, Search, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { allRoutes } from "@/config/navigation";

interface CommandPaletteContextValue {
  open: () => void;
}

const CommandPaletteContext = createContext<CommandPaletteContextValue | null>(null);

/** Access the global command palette (e.g. to open it from a header button). */
export function useCommandPalette(): CommandPaletteContextValue {
  const ctx = useContext(CommandPaletteContext);
  if (!ctx) throw new Error("useCommandPalette must be used within CommandPaletteProvider");
  return ctx;
}

/**
 * Global ⌘K / Ctrl+K command palette: navigation and theme actions today;
 * dataset search joins when the data layer lands (Milestone 7).
 */
export function CommandPaletteProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const { setTheme } = useTheme();

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setIsOpen((open) => !open);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const open = useCallback(() => setIsOpen(true), []);
  const contextValue = useMemo(() => ({ open }), [open]);

  const runAction = useCallback((action: () => void) => {
    setIsOpen(false);
    action();
  }, []);

  const liveDestinations = allRoutes.filter((r) => r.status === "live");
  const upcomingDestinations = allRoutes.filter((r) => r.status === "soon");

  return (
    <CommandPaletteContext.Provider value={contextValue}>
      {children}
      <CommandDialog
        open={isOpen}
        onOpenChange={setIsOpen}
        title="Command palette"
        description="Navigate MyMalaysia or change the theme"
      >
        {/* CommandDialog renders only the Dialog shell; the cmdk root must be
            explicit or Input/List have no store and crash. */}
        <Command>
          <CommandInput placeholder="Where to?" />
          <CommandList>
            <CommandEmpty>Nothing found.</CommandEmpty>
            <CommandGroup heading="Go to">
              {liveDestinations.map((route) => (
                <CommandItem
                  key={route.id}
                  value={`${route.label} ${route.description}`}
                  onSelect={() => runAction(() => router.push(route.path))}
                >
                  <ArrowRight aria-hidden />
                  <span>{route.label}</span>
                  <span className="ml-2 truncate text-xs text-muted-foreground">
                    {route.description}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
            {upcomingDestinations.length > 0 && (
              <CommandGroup heading="Coming soon">
                {upcomingDestinations.map((route) => (
                  <CommandItem
                    key={route.id}
                    value={`${route.label} ${route.description}`}
                    disabled
                  >
                    <span>{route.label}</span>
                    <span className="ml-2 truncate text-xs text-muted-foreground">
                      {route.description}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            <CommandSeparator />
            <CommandGroup heading="Search">
              <CommandItem disabled value="search datasets">
                <Search aria-hidden />
                <span>Search datasets</span>
                <span className="ml-2 text-xs text-muted-foreground">
                  arrives with the data layer
                </span>
              </CommandItem>
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Theme">
              <CommandItem onSelect={() => runAction(() => setTheme("light"))}>
                <Sun aria-hidden />
                <span>Light</span>
              </CommandItem>
              <CommandItem onSelect={() => runAction(() => setTheme("dark"))}>
                <Moon aria-hidden />
                <span>Dark</span>
              </CommandItem>
              <CommandItem onSelect={() => runAction(() => setTheme("system"))}>
                <Laptop aria-hidden />
                <span>System</span>
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </CommandDialog>
    </CommandPaletteContext.Provider>
  );
}
