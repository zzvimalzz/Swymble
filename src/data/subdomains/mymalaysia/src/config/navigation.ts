/**
 * The route registry — every internal path in the product. Components never
 * hardcode paths; they import from here.
 *
 * Since the Atlas refactor (ADR-0004) the product is one map workspace:
 * former modules (Explorer, Live, Economy, Population) are lenses inside
 * /map, not routes. /explorer and /live remain as redirect stubs.
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
    description: "Explore Malaysia through open public data.",
    status: "live",
    inNav: false,
    inFooter: false,
  },
  map: {
    id: "map",
    path: "/map",
    label: "Map",
    description:
      "The atlas — every dataset as a layer on one map: boundaries, people, economy, live feeds, time.",
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
  population: {
    id: "population",
    path: "/population",
    label: "Population",
    description: "Who lives where — district populations since the 2020 Census.",
    status: "live",
    inNav: true,
    inFooter: true,
  },
  economy: {
    id: "economy",
    path: "/economy",
    label: "Economy",
    description: "District GDP and household income — the national ledger by place.",
    status: "live",
    inNav: true,
    inFooter: true,
  },
} as const satisfies Record<string, SiteRoute>;

export type RouteId = keyof typeof routes;

export const allRoutes: SiteRoute[] = Object.values(routes);
export const navRoutes: SiteRoute[] = allRoutes.filter((r) => r.inNav);
export const footerRoutes: SiteRoute[] = allRoutes.filter((r) => r.inFooter);
export const liveRoutes: SiteRoute[] = allRoutes.filter((r) => r.status === "live");
