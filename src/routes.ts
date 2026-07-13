import type { ReactElement } from 'react';

export type MobileHomeSectionId =
  | 'top'
  | 'projects'
  | 'studio-section'
  | 'latest-updates'
  | 'contact-section';

export type SiteRoutePath = '/' | '/projects' | '/labs' | '/contact' | '/about' | '/blog';

export type SiteRoute = {
  path: SiteRoutePath;
  label: string;
  seoTitle: string;
  seoDescription: string;
  desktopNav: boolean;
  mobileNav: boolean;
  mobileMode: 'page' | 'home-section' | 'hidden';
  mobileSectionId?: MobileHomeSectionId;
  shouldIndex: boolean;
  /** Renders this route's desktop nav link as an emphasized call-to-action pill instead of a regular link. */
  navEmphasis?: boolean;
};

/**
 * Every SITE_ROUTES entry must map to a desktop page element. Building a registry typed as
 * `Record<SiteRoutePath, ReactElement>` means adding a new path to SITE_ROUTES without adding a
 * matching desktop element is a TypeScript compile error — this is what keeps DesktopView from
 * silently drifting out of sync with the route table again.
 */
export type DesktopRouteElements = Record<SiteRoutePath, ReactElement>;

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
    desktopNav: true,
    mobileNav: true,
    mobileMode: 'home-section',
    mobileSectionId: 'top',
    shouldIndex: true,
  },
  {
    path: '/projects',
    label: 'Projects',
    seoTitle: `Projects | ${SITE_NAME}`,
    seoDescription:
      'Websites, apps, and product builds shipped by SWYMBLE: client work and personal products, with the thinking behind each one.',
    desktopNav: true,
    mobileNav: true,
    mobileMode: 'home-section',
    mobileSectionId: 'projects',
    shouldIndex: true,
  },
  {
    path: '/labs',
    label: 'Labs',
    seoTitle: `Labs | ${SITE_NAME}`,
    seoDescription: 'See SWYMBLE Labs experiments across AI, product R&D, prototypes, and in-progress ideas.',
    desktopNav: true,
    mobileNav: true,
    mobileMode: 'page',
    shouldIndex: true,
  },
  {
    path: '/contact',
    label: "Let's Talk",
    seoTitle: `Let's Talk | ${SITE_NAME}`,
    seoDescription:
      'Start a project with SWYMBLE. Tell me what you want to build and I will get back to you within 24 hours.',
    desktopNav: true,
    mobileNav: true,
    mobileMode: 'home-section',
    mobileSectionId: 'contact-section',
    shouldIndex: true,
    navEmphasis: true,
  },
  {
    path: '/about',
    label: 'About',
    seoTitle: `About | ${SITE_NAME}`,
    seoDescription:
      'The engineer behind SWYMBLE: enterprise fintech experience, a one-person studio for client work, and a lab of personal builds and experiments.',
    desktopNav: true,
    mobileNav: false,
    mobileMode: 'hidden',
    shouldIndex: true,
  },
  {
    path: '/blog',
    label: 'Blog',
    seoTitle: `Blog | ${SITE_NAME}`,
    seoDescription:
      'Read SWYMBLE notes on software engineering, AI systems, builds, lessons learned, and ideas worth documenting.',
    desktopNav: true,
    mobileNav: true,
    mobileMode: 'page',
    shouldIndex: true,
  },
];

export const DESKTOP_NAV_ROUTES = SITE_ROUTES.filter((route) => route.desktopNav);
export const MOBILE_NAV_ROUTES = SITE_ROUTES.filter((route) => route.mobileNav);
export const MOBILE_HOME_SECTION_ROUTES = SITE_ROUTES.filter(
  (route) => route.mobileMode === 'home-section' && route.mobileSectionId,
);

export function findSiteRoute(pathname: string) {
  return SITE_ROUTES.find((route) => route.path === pathname);
}

export function getMobileHomeSectionFromPath(pathname: string): MobileHomeSectionId {
  const route = findSiteRoute(pathname);

  if (route?.mobileMode === 'home-section' && route.mobileSectionId) {
    return route.mobileSectionId;
  }

  return 'top';
}
