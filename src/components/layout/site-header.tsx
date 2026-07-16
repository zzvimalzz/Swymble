"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { useCommandPalette } from "@/components/layout/command-palette";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Wordmark } from "@/components/layout/wordmark";
import { navRoutes } from "@/config/navigation";
import { cn } from "@/lib/utils";

function NavItems({ orientation }: { orientation: "horizontal" | "vertical" }) {
  const pathname = usePathname();

  const items = navRoutes.map((route) => ({
    key: route.id,
    label: route.label,
    href: route.path,
  }));

  return (
    <>
      {items.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

        const link = (
          <Link
            key={item.key}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "rounded-sm text-sm transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
              orientation === "vertical" && "py-2 text-base",
              isActive
                ? "font-medium text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {item.label}
          </Link>
        );

        return orientation === "vertical" ? (
          <SheetClose asChild key={item.key}>
            {link}
          </SheetClose>
        ) : (
          link
        );
      })}
    </>
  );
}

/** Sticky global header: wordmark, module navigation, search, theme. */
export function SiteHeader() {
  const { open } = useCommandPalette();

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="h-0.75 tricolor-bar" aria-hidden />
      <div className="mx-auto flex h-14 max-w-[96rem] items-center gap-6 px-4 sm:px-6 lg:px-8">
        <Wordmark />

        <nav aria-label="Modules" className="hidden items-center gap-6 md:flex">
          <NavItems orientation="horizontal" />
        </nav>

        <div className="ml-auto flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={open}
            className="gap-2 text-muted-foreground"
            aria-label="Open command palette"
          >
            <Search className="size-4" aria-hidden />
            <span className="hidden lg:inline">Search</span>
          </Button>

          <ThemeToggle />

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu">
                <Menu className="size-5" aria-hidden />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetHeader>
                <SheetTitle>
                  <Wordmark />
                </SheetTitle>
              </SheetHeader>
              <nav aria-label="Modules" className="flex flex-col gap-1 px-4">
                <NavItems orientation="vertical" />
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
