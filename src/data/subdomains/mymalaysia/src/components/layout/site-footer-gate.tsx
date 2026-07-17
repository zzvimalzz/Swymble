"use client";

import { usePathname } from "next/navigation";

import { routes } from "@/config/navigation";

import { SiteFooter } from "./site-footer";

/**
 * Full-bleed map workspaces own the whole viewport — a footer below them
 * is unreachable dead space. Everywhere else keeps the global footer.
 */
const FULL_BLEED_PATHS = new Set<string>([routes.map.path, routes.transit.path]);

export function SiteFooterGate() {
  const pathname = usePathname();
  // The static-export build serves trailing-slash routes (/map/) — normalise
  // so both serving modes gate identically.
  const normalized =
    pathname.length > 1 && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
  if (FULL_BLEED_PATHS.has(normalized)) return null;
  return <SiteFooter />;
}
