import { describe, expect, it } from 'vitest';
import { SWYMBLE_DATA } from './config';
import { SWYMBLE_SHIPPED } from './shipped';

// Content lives in plain TS files edited by hand — these tests catch the mistakes a
// typechecker can't: duplicate ids/anchors, malformed dates, dangling category references,
// and links/images that don't point where the UI expects.

const uniqueCount = (values: string[]) => new Set(values).size;

describe('labs', () => {
  it('has unique ids', () => {
    const ids = SWYMBLE_DATA.labs.map((lab) => lab.id);
    expect(uniqueCount(ids)).toBe(ids.length);
  });

  it('uses public-root image paths', () => {
    for (const lab of SWYMBLE_DATA.labs) {
      expect(lab.image, `lab ${lab.id} image`).toMatch(/^\//);
    }
  });

  it('has resolvable action hrefs', () => {
    for (const lab of SWYMBLE_DATA.labs) {
      for (const action of lab.actions ?? []) {
        expect(action.href, `lab ${lab.id} action "${action.label}"`).toMatch(
          /^(\/|https?:\/\/|mailto:)/,
        );
      }
    }
  });
});

describe('projects', () => {
  it('has unique titles (titles double as /projects anchors)', () => {
    const titles = SWYMBLE_DATA.projects.map((project) => project.title);
    expect(uniqueCount(titles)).toBe(titles.length);
  });

  it('uses public-root image paths', () => {
    for (const project of SWYMBLE_DATA.projects) {
      expect(project.image, `project ${project.title} image`).toMatch(/^\//);
    }
  });
});

describe('blog', () => {
  it('has unique post ids (ids double as /blog/<id> routes)', () => {
    const ids = SWYMBLE_DATA.blog.posts.map((post) => post.id);
    expect(uniqueCount(ids)).toBe(ids.length);
  });

  it('has ISO dates (used as datePublished / sitemap lastmod)', () => {
    for (const post of SWYMBLE_DATA.blog.posts) {
      expect(post.date, `post ${post.id} date`).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it('has non-empty summaries (used as meta descriptions)', () => {
    for (const post of SWYMBLE_DATA.blog.posts) {
      expect(post.summary.trim().length, `post ${post.id} summary`).toBeGreaterThan(0);
    }
  });

  it('only references categories that exist in blog meta', () => {
    const known = new Set(SWYMBLE_DATA.blog.categories.map((category) => category.id));
    for (const post of SWYMBLE_DATA.blog.posts) {
      for (const category of post.categories) {
        expect(known.has(category), `post ${post.id} category "${category}"`).toBe(true);
      }
    }
  });
});

describe('shipped (unified projects + labs model)', () => {
  it('has unique ids', () => {
    const ids = SWYMBLE_SHIPPED.map((item) => item.id);
    expect(uniqueCount(ids)).toBe(ids.length);
  });

  it('has resolvable hrefs (internal route or full URL)', () => {
    for (const item of SWYMBLE_SHIPPED) {
      expect(item.href.url, `shipped ${item.id} href`).toMatch(/^(\/|https?:\/\/)/);
      if (item.href.external) {
        expect(item.href.url, `shipped ${item.id} external href`).toMatch(/^https?:\/\//);
      }
    }
  });

  it('uses public-root image paths', () => {
    for (const item of SWYMBLE_SHIPPED) {
      expect(item.image, `shipped ${item.id} image`).toMatch(/^\//);
      if (item.poster) {
        expect(item.poster, `shipped ${item.id} poster`).toMatch(/^\//);
      }
    }
  });

  it('never marks restricted work as featured-with-external-launch', () => {
    for (const item of SWYMBLE_SHIPPED.filter((entry) => entry.restricted)) {
      expect(item.href.external, `shipped ${item.id} restricted launch`).toBe(false);
    }
  });
});

describe('skills and universe', () => {
  it('every category has at least one item', () => {
    for (const group of [...SWYMBLE_DATA.skills, ...SWYMBLE_DATA.universe]) {
      expect(group.items.length, `category ${group.category}`).toBeGreaterThan(0);
    }
  });

  it('proof links are internal routes or full URLs', () => {
    for (const group of [...SWYMBLE_DATA.skills, ...SWYMBLE_DATA.universe]) {
      const proofs = [...(group.proof ?? []), ...group.items.flatMap((item) => item.proof ?? [])];
      for (const proof of proofs) {
        expect(proof.href, `${group.category} proof "${proof.label}"`).toMatch(/^(\/|https?:\/\/)/);
      }
    }
  });
});
