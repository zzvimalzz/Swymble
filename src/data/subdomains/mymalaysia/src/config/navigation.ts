/**
 * The route registry — every internal path in the product. Components never
 * hardcode paths; they import from here.
 *
 * MalaysiaHub is a daily-utility product: Finance, Government, Transport are
 * top-level pillars, and the map (the former Atlas) is demoted to one
 * "Explore" pillar. New pillar pages are added here as they ship — the nav
 * never lists a route without a working page.
 */

export type RouteStatus = "live" | "soon";

export interface SiteRoute {
  /** Stable identifier, also used as React key. */
  id: string;
  path: string;
  label: string;
  /** One-line description shown in command palette and previews. */
  description: string;
  status: RouteStatus;
  /** Show in the header navigation. */
  inNav: boolean;
  /** Show in the footer's list. */
  inFooter: boolean;
}

export const routes = {
  home: {
    id: "home",
    path: "/",
    label: "Home",
    description: "Everything Malaysia, in one place — your daily dashboard.",
    status: "live",
    inNav: false,
    inFooter: false,
  },
  finance: {
    id: "finance",
    path: "/finance",
    label: "Finance",
    description:
      "Malaysian money math — salary and EPF, income tax, loans, savings, and live ringgit rates.",
    status: "live",
    inNav: true,
    inFooter: true,
  },
  map: {
    id: "map",
    path: "/map",
    label: "Explore",
    description:
      "The living atlas — every dataset as a layer on one map: boundaries, people, economy, live feeds, time.",
    status: "live",
    inNav: true,
    inFooter: true,
  },
  live: {
    id: "live",
    path: "/live",
    label: "Live",
    description:
      "Malaysia right now — pump prices with BUDI95, ringgit rates, and today's forecasts.",
    status: "live",
    inNav: true,
    inFooter: true,
  },
  transit: {
    id: "transit",
    path: "/transit",
    label: "Transit",
    description:
      "The living transit map — every route, station, and stop, with KTM trains and Rapid buses moving live and ETA estimates.",
    status: "live",
    inNav: true,
    inFooter: true,
  },
  // Folded into Explore (ADR: the map is the workspace) — footer-only, not
  // top-level nav, to keep the daily-OS pillars front and centre.
  population: {
    id: "population",
    path: "/population",
    label: "Population",
    description: "Who lives where — district populations since the 2020 Census.",
    status: "live",
    inNav: false,
    inFooter: true,
  },
  economy: {
    id: "economy",
    path: "/economy",
    label: "Economy",
    description: "District GDP and household income — the national ledger by place.",
    status: "live",
    inNav: false,
    inFooter: true,
  },
} as const satisfies Record<string, SiteRoute>;

export type RouteId = keyof typeof routes;

export const allRoutes: SiteRoute[] = Object.values(routes);
export const navRoutes: SiteRoute[] = allRoutes.filter((r) => r.inNav);
export const footerRoutes: SiteRoute[] = allRoutes.filter((r) => r.inFooter);
export const liveRoutes: SiteRoute[] = allRoutes.filter((r) => r.status === "live");
