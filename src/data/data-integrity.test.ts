import { describe, expect, it } from 'vitest';
import { SWYMBLE_DATA } from './config';

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

describe('universe', () => {
  it('every category has at least one item', () => {
    for (const group of SWYMBLE_DATA.universe) {
      expect(group.items.length, `category ${group.category}`).toBeGreaterThan(0);
    }
  });

  it('proof links are internal routes or full URLs', () => {
    for (const group of SWYMBLE_DATA.universe) {
      const proofs = [...(group.proof ?? []), ...group.items.flatMap((item) => item.proof ?? [])];
      for (const proof of proofs) {
        expect(proof.href, `${group.category} proof "${proof.label}"`).toMatch(/^(\/|https?:\/\/)/);
      }
    }
  });
});

describe('career', () => {
  const branchIds = new Set(SWYMBLE_DATA.career.map((branch) => branch.id));
  const allNodes = SWYMBLE_DATA.career.flatMap((branch) =>
    branch.nodes.map((node) => ({ branch, node })),
  );

  it('has unique branch ids', () => {
    const ids = SWYMBLE_DATA.career.map((branch) => branch.id);
    expect(uniqueCount(ids)).toBe(ids.length);
  });

  it('has unique node ids across the whole graph', () => {
    const ids = allNodes.map(({ node }) => node.id);
    expect(uniqueCount(ids)).toBe(ids.length);
  });

  it('resolves every parentBranchId to a real branch', () => {
    for (const branch of SWYMBLE_DATA.career) {
      if (branch.parentBranchId) {
        expect(branchIds.has(branch.parentBranchId), `branch ${branch.id} parentBranchId`).toBe(true);
      }
    }
  });

  it('has exactly one trunk branch (no parentBranchId)', () => {
    const trunks = SWYMBLE_DATA.career.filter((branch) => !branch.parentBranchId);
    expect(trunks.map((branch) => branch.id)).toEqual(['main']);
  });

  it('uses YYYY or MM-YYYY dates', () => {
    const dateShape = /^(\d{4}|\d{2}-\d{4})$/;
    for (const { node } of allNodes) {
      expect(node.date, `node ${node.id} date`).toMatch(dateShape);
      if (node.endDate) {
        expect(node.endDate === 'Present' || dateShape.test(node.endDate), `node ${node.id} endDate`).toBe(true);
      }
    }
  });

  it('has resolvable node link hrefs', () => {
    for (const { node } of allNodes) {
      for (const link of node.links ?? []) {
        expect(link.href, `node ${node.id} link "${link.label}"`).toMatch(/^(\/|https?:\/\/)/);
      }
    }
  });

  it('uses public-root image paths where set', () => {
    for (const { node } of allNodes) {
      if (node.image) {
        expect(node.image, `node ${node.id} image`).toMatch(/^\//);
      }
    }
  });
});
