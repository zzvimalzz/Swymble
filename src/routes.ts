import type { ReactElement } from 'react';

export type SiteRoutePath = '/' | '/projects' | '/labs' | '/contact' | '/about' | '/resume' | '/blog';

export type SiteRoute = {
  path: SiteRoutePath;
  label: string;
  seoTitle: string;
  seoDescription: string;
  /** Hide from the nav without removing the route. */
  hideFromNav?: boolean;
  shouldIndex: boolean;
  /** Renders this route's nav link as an emphasized call-to-action pill instead of a regular link. */
  navEmphasis?: boolean;
};

/**
 * Every SITE_ROUTES entry must map to a page element. Building a registry typed as
 * `Record<SiteRoutePath, ReactElement>` means adding a new path to SITE_ROUTES without adding a
 * matching element is a TypeScript compile error, which is what keeps the view from silently
 * drifting out of sync with the route table.
 */
export type SiteRouteElements = Record<SiteRoutePath, ReactElement>;

export const SITE_NAME = 'SWYMBLE';
export const SITE_URL = 'https://swymble.com';
export const DEFAULT_SEO_IMAGE = `${SITE_URL}/images/og-card.png`;

export const SITE_ROUTES: SiteRoute[] = [
  {
    path: '/',
    label: 'Home',
    seoTitle: `${SITE_NAME} | Software Studio, Projects & Experiments`,
    seoDescription:
      'The software studio and personal lab of a fintech grade engineer: client products, shipped projects, experiments, and the stories behind them.',
    shouldIndex: true,
  },
  {
    path: '/projects',
    label: 'Projects',
    seoTitle: `Projects | ${SITE_NAME}`,
    seoDescription:
      'Websites, apps, and product builds shipped by SWYMBLE: client work and personal products, with the thinking behind each one.',
    shouldIndex: true,
  },
  {
    path: '/labs',
    label: 'Labs',
    seoTitle: `Labs | ${SITE_NAME}`,
    seoDescription: 'See SWYMBLE Labs experiments across AI, product R&D, prototypes, and in-progress ideas.',
    shouldIndex: true,
  },
  {
    path: '/about',
    label: 'About',
    seoTitle: `About | ${SITE_NAME}`,
    seoDescription:
      'The engineer behind SWYMBLE: enterprise fintech experience, a one-person studio for client work, and a lab of personal builds and experiments.',
    shouldIndex: true,
  },
  {
    path: '/resume',
    label: 'Resume',
    seoTitle: `Resume | ${SITE_NAME}`,
    seoDescription:
      'One-page resume: fintech platform engineering, a solo studio shipping client work, selected products, education and the full stack behind them.',
    shouldIndex: true,
  },
  {
    path: '/blog',
    label: 'Blog',
    seoTitle: `Blog | ${SITE_NAME}`,
    seoDescription:
      'Read SWYMBLE notes on software engineering, AI systems, builds, lessons learned, and ideas worth documenting.',
    shouldIndex: true,
  },
  {
    path: '/contact',
    label: "Let's Talk",
    seoTitle: `Let's Talk | ${SITE_NAME}`,
    seoDescription:
      'Start a project with SWYMBLE. Tell me what you want to build and I will get back to you within 24 hours.',
    shouldIndex: true,
    navEmphasis: true,
  },
];

export const NAV_ROUTES = SITE_ROUTES.filter((route) => !route.hideFromNav);

export function findSiteRoute(pathname: string) {
  return SITE_ROUTES.find((route) => route.path === pathname);
}
