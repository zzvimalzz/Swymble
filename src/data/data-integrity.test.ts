import { describe, expect, it } from 'vitest';
import { SWYMBLE_DATA } from './config';
import { parseDateKey } from '../components/desktop/CareerRepository/layout';
import { buildResumeModel } from '../utils/resumeModel';

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

describe('resume', () => {
  const nodeIds = new Set(
    SWYMBLE_DATA.career.flatMap((branch) => branch.nodes.map((node) => node.id)),
  );
  const model = buildResumeModel(SWYMBLE_DATA.career, SWYMBLE_DATA.resume);

  // The resume is an overlay keyed by career node id. A typo in a key is invisible at runtime —
  // the bullet silently falls back to the site copy — so both id maps are checked against the
  // graph here rather than being discovered as wrong wording on a live page.
  it('excludes only node ids that exist', () => {
    for (const id of SWYMBLE_DATA.resume.excludeNodeIds) {
      expect(nodeIds.has(id), `excludeNodeIds entry "${id}"`).toBe(true);
    }
  });

  it('keys every bullet override to a real node id', () => {
    for (const id of Object.keys(SWYMBLE_DATA.resume.bullets)) {
      expect(nodeIds.has(id), `bullets key "${id}"`).toBe(true);
    }
  });

  it('has unique skill group ids', () => {
    const ids = SWYMBLE_DATA.resume.skillGroups.map((group) => group.id);
    expect(uniqueCount(ids)).toBe(ids.length);
  });

  it('derives a non-empty experience, education and project list', () => {
    expect(model.experience.length).toBeGreaterThan(0);
    expect(model.education.length).toBeGreaterThan(0);
    expect(model.projects.length).toBeGreaterThan(0);
  });

  it('leaves excluded nodes out of every derived list', () => {
    const shown = new Set(
      [...model.experience, ...model.education, ...model.projects].map((entry) => entry.node.id),
    );
    for (const id of SWYMBLE_DATA.resume.excludeNodeIds) {
      expect(shown.has(id), `excluded node "${id}" still rendered`).toBe(false);
    }
  });

  it('orders every derived list newest first', () => {
    for (const [label, entries] of [
      ['experience', model.experience],
      ['education', model.education],
      ['projects', model.projects],
    ] as const) {
      const keys = entries.map((entry) => parseDateKey(entry.node.date));
      expect(keys, `${label} order`).toEqual([...keys].sort((a, b) => b - a));
    }
  });

  it('gives every experience entry at least one bullet', () => {
    for (const entry of model.experience) {
      expect(entry.bullets.length, `experience ${entry.node.id} bullets`).toBeGreaterThan(0);
    }
  });
});
