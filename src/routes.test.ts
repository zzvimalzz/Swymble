import { describe, expect, it } from 'vitest';
import { NAV_ROUTES, SITE_ROUTES } from './routes';

// SITE_ROUTES drives navigation, SEO meta, the sitemap, and prerendering — malformed entries
// fan out into every one of those, so they're pinned down here.

describe('SITE_ROUTES', () => {
  it('has unique paths', () => {
    const paths = SITE_ROUTES.map((route) => route.path);
    expect(new Set(paths).size).toBe(paths.length);
  });

  it('has SEO titles and descriptions on every route', () => {
    for (const route of SITE_ROUTES) {
      expect(route.seoTitle.trim().length, `${route.path} seoTitle`).toBeGreaterThan(0);
      expect(route.seoDescription.trim().length, `${route.path} seoDescription`).toBeGreaterThan(0);
    }
  });

  it('keeps descriptions inside the ~160 char snippet budget', () => {
    for (const route of SITE_ROUTES) {
      expect(route.seoDescription.length, `${route.path} seoDescription length`).toBeLessThanOrEqual(160);
    }
  });

  it('exposes every route in the nav unless it opts out', () => {
    // One nav for every viewport since the mobile-only view was removed; a route that is not
    // hidden must be reachable from it.
    for (const route of SITE_ROUTES) {
      if (!route.hideFromNav) {
        expect(NAV_ROUTES, `${route.path} missing from NAV_ROUTES`).toContain(route);
      }
    }
  });

  it('has at most one call-to-action link', () => {
    expect(SITE_ROUTES.filter((route) => route.navEmphasis).length).toBeLessThanOrEqual(1);
  });
});
