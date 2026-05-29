export type MobileHomeSectionId = 'top' | 'focus-section' | 'projects' | 'latest-updates' | 'contact-section';

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
};

export const SITE_NAME = 'SWYMBLE';
export const SITE_URL = 'https://swymble.com';
export const DEFAULT_SEO_IMAGE = `${SITE_URL}/images/ibsolutions_website.png`;

export const SITE_ROUTES: SiteRoute[] = [
  {
    path: '/',
    label: 'Home',
    seoTitle: `${SITE_NAME} | Projects, Builds, Writing, and Story`,
    seoDescription:
      'A personal site for software engineering work, shipped projects, experimental builds, blog posts, and the story behind what I am making.',
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
      'Explore websites, apps, and product builds from SWYMBLE, including shipped work and the thinking behind each project.',
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
    label: 'Contact',
    seoTitle: `Contact | ${SITE_NAME}`,
    seoDescription: 'Find SWYMBLE contact links for project inquiries, collaboration, and direct messages.',
    desktopNav: false,
    mobileNav: true,
    mobileMode: 'home-section',
    mobileSectionId: 'contact-section',
    shouldIndex: true,
  },
  {
    path: '/about',
    label: 'About',
    seoTitle: `About | ${SITE_NAME}`,
    seoDescription:
      'Learn about the engineer behind SWYMBLE, from enterprise software experience to personal builds, writing, and long-term experiments.',
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
