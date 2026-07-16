/**
 * The route registry — every internal path in the product. Components never
 * hardcode paths; they import from here. Modules ship with status "soon"
 * until their milestone lands, so navigation renders them as previews
 * without dead links.
 */

export type RouteStatus = "live" | "soon";

export interface SiteRoute {
  /** Stable identifier, also used as React key. */
  id: string;
  path: string;
  label: string;
  /** One-line description shown in command palette and module previews. */
  description: string;
  status: RouteStatus;
  /** Show in the header navigation. */
  inNav: boolean;
  /** Show in the footer's module list. */
  inFooter: boolean;
}

export const routes = {
  home: {
    id: "home",
    path: "/",
    label: "Home",
    description: "Explore Malaysia through open public data.",
    status: "live",
    inNav: false,
    inFooter: false,
  },
  explorer: {
    id: "explorer",
    path: "/explorer",
    label: "Explorer",
    description: "Interactive map of every state and district — population, economy, income.",
    status: "live",
    inNav: true,
    inFooter: true,
  },
  live: {
    id: "live",
    path: "/live",
    label: "Live",
    description: "Malaysia right now — weather, fuel prices, exchange rates, transit.",
    status: "soon",
    inNav: true,
    inFooter: true,
  },
  economy: {
    id: "economy",
    path: "/economy",
    label: "Economy",
    description: "GDP, inflation, trade, employment — the national ledger, visualised.",
    status: "soon",
    inNav: true,
    inFooter: true,
  },
  population: {
    id: "population",
    path: "/population",
    label: "Population",
    description: "Who lives in Malaysia — age, income, households, urbanisation.",
    status: "soon",
    inNav: true,
    inFooter: true,
  },
} as const satisfies Record<string, SiteRoute>;

export type RouteId = keyof typeof routes;

export const allRoutes: SiteRoute[] = Object.values(routes);
export const navRoutes: SiteRoute[] = allRoutes.filter((r) => r.inNav);
export const footerRoutes: SiteRoute[] = allRoutes.filter((r) => r.inFooter);
export const liveRoutes: SiteRoute[] = allRoutes.filter((r) => r.status === "live");
