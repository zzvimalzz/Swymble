import { describe, expect, it } from 'vitest';
import { SITE_ROUTES } from './routes';

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

  it('gives every home-section mobile route a section id', () => {
    for (const route of SITE_ROUTES) {
      if (route.mobileMode === 'home-section') {
        expect(route.mobileSectionId, `${route.path} mobileSectionId`).toBeTruthy();
      }
    }
  });
});
