import { describe, expect, it } from 'vitest';
import { SWYMBLE_CAREER } from '../../../data/about/career';
import { computeCareerLayout, dateKeyToYearMonth, parseDateKey } from './layout';
import {
  LABEL_CHAR_WIDTH,
  LABEL_MIN_GAP_Y,
  LABEL_PADDING_X,
  LANE_WIDTH,
  OPEN_END_Y,
  RULER_WIDTH,
  SAME_DATE_STACK_Y,
} from './constants';

// The swimlane layout is pure geometry over the real career data, so it can be asserted directly.
// These cover the invariants the rendering relies on — a break here shows up on the About page as
// overlapping nodes, a branch drawn on top of an unrelated one, or a time axis that runs backwards.

const layout = computeCareerLayout(SWYMBLE_CAREER);

describe('parseDateKey', () => {
  it('reads a bare year as January, not as the previous December', () => {
    // Months are 1-based, so a naive `year * 12` makes '2021' equal '12-2020'. That collision put
    // both on one row and let the commit log group 2020 above 2021.
    expect(parseDateKey('2021')).toBe(parseDateKey('01-2021'));
    expect(parseDateKey('2021')).toBeGreaterThan(parseDateKey('12-2020'));
  });

  it('orders months within and across years', () => {
    expect(parseDateKey('01-2026')).toBeLessThan(parseDateKey('02-2026'));
    expect(parseDateKey('12-2025')).toBeLessThan(parseDateKey('01-2026'));
  });

  it('round-trips through dateKeyToYearMonth', () => {
    for (const [date, year, month] of [
      ['2019', 2019, 1],
      ['01-2026', 2026, 1],
      ['12-2020', 2020, 12],
      ['08-2024', 2024, 8],
    ] as const) {
      expect(dateKeyToYearMonth(parseDateKey(date)), date).toEqual({ year, month });
    }
  });
});

describe('career swimlane layout', () => {
  it('places every node exactly once', () => {
    const expected = SWYMBLE_CAREER.reduce((total, branch) => total + branch.nodes.length, 0);
    expect(layout.nodesById.size).toBe(expected);
    expect(layout.orderedNodes).toHaveLength(expected);
  });

  it('orders nodes down the page newest first, like git log', () => {
    for (let index = 1; index < layout.orderedNodes.length; index += 1) {
      const previous = layout.orderedNodes[index - 1];
      const current = layout.orderedNodes[index];
      expect(current.y).toBeGreaterThanOrEqual(previous.y);
      // Further down the page must mean further back in time, never forward.
      expect(parseDateKey(current.node.date)).toBeLessThanOrEqual(parseDateKey(previous.node.date));
    }
  });

  it('puts the year ruler in the same descending order as the nodes', () => {
    const years = layout.yearTicks.map((tick) => tick.year);
    expect(years).toEqual([...years].sort((a, b) => b - a));
    for (let index = 1; index < layout.yearTicks.length; index += 1) {
      expect(layout.yearTicks[index].y).toBeGreaterThan(layout.yearTicks[index - 1].y);
    }
  });

  it('never draws two nodes on top of each other', () => {
    const seen = new Set<string>();
    for (const layoutNode of layout.orderedNodes) {
      const point = `${layoutNode.x}:${layoutNode.y}`;
      expect(seen.has(point), `${layoutNode.node.id} collides at ${point}`).toBe(false);
      seen.add(point);
    }
  });

  it('keeps nodes on the same branch vertically separated, oldest lowest', () => {
    for (const layoutBranch of layout.branches) {
      // Authored oldest first, drawn oldest at the bottom, so y must decrease along the array.
      for (let index = 1; index < layoutBranch.nodes.length; index += 1) {
        const rise = layoutBranch.nodes[index - 1].y - layoutBranch.nodes[index].y;
        expect(rise, `${layoutBranch.branch.id} nodes ${index - 1}->${index}`).toBeGreaterThanOrEqual(
          SAME_DATE_STACK_Y,
        );
      }
    }
  });

  it('never overlaps two branches in the same lane', () => {
    const byLane = new Map<number, typeof layout.branches>();
    for (const layoutBranch of layout.branches) {
      byLane.set(layoutBranch.lane, [...(byLane.get(layoutBranch.lane) ?? []), layoutBranch]);
    }

    for (const [lane, laneBranches] of byLane) {
      for (let a = 0; a < laneBranches.length; a += 1) {
        for (let b = a + 1; b < laneBranches.length; b += 1) {
          const first = laneBranches[a];
          const second = laneBranches[b];
          const disjoint = first.endY < second.startY || first.startY > second.endY;
          expect(
            disjoint,
            `lane ${lane}: ${first.branch.id} [${first.startY}, ${first.endY}] overlaps ${second.branch.id} [${second.startY}, ${second.endY}]`,
          ).toBe(true);
        }
      }
    }
  });

  it('reuses lanes rather than giving every branch its own column', () => {
    // Nine branches must fit in meaningfully fewer tracks, otherwise the graph outgrows the
    // space it shares with the commit log and the whole two-panel layout stops fitting.
    expect(layout.branches.length).toBeGreaterThan(layout.laneCount);
    expect(layout.width).toBeLessThan(900);
  });

  it('parks every branch pill clear of the lanes', () => {
    // Pills sit in the right gutter, past the last lane. Anything at or left of the final lane's
    // centre could land on a line or a node, which is what they used to do.
    const lastLaneX = RULER_WIDTH + (layout.laneCount - 1) * LANE_WIDTH + LANE_WIDTH / 2;
    expect(layout.labelX).toBeGreaterThan(lastLaneX);

    for (const layoutBranch of layout.branches) {
      const pillWidth = layoutBranch.branch.label.length * LABEL_CHAR_WIDTH + LABEL_PADDING_X;
      expect(layout.labelX + pillWidth, `${layoutBranch.branch.id} pill overflows`).toBeLessThanOrEqual(
        layout.width,
      );
    }
  });

  it('never overlaps two branch pills', () => {
    const ys = layout.branches.map((layoutBranch) => layoutBranch.labelY).sort((a, b) => a - b);
    for (let index = 1; index < ys.length; index += 1) {
      expect(ys[index] - ys[index - 1]).toBeGreaterThanOrEqual(LABEL_MIN_GAP_Y);
    }
  });

  it('keeps every pill inside the canvas', () => {
    for (const layoutBranch of layout.branches) {
      expect(layoutBranch.labelY, layoutBranch.branch.id).toBeGreaterThan(0);
      expect(layoutBranch.labelY, layoutBranch.branch.id).toBeLessThan(layout.height);
    }
  });

  it('keeps the trunk in lane 0', () => {
    const trunk = layout.branches.find((layoutBranch) => !layoutBranch.branch.parentBranchId);
    expect(trunk?.lane).toBe(0);
    expect(trunk?.x).toBe(RULER_WIDTH + LANE_WIDTH / 2);
  });

  it('emits one year tick per year covered, inside the canvas', () => {
    const years = layout.yearTicks.map((tick) => tick.year);
    expect(uniqueLength(years)).toBe(years.length);
    for (const tick of layout.yearTicks) {
      expect(tick.y).toBeGreaterThan(0);
      expect(tick.y).toBeLessThan(layout.height);
    }
  });

  it('runs every ongoing branch off the top edge and stops merged ones short of it', () => {
    for (const layoutBranch of layout.branches) {
      if (layoutBranch.branch.status === 'merged') {
        expect(layoutBranch.startY, layoutBranch.branch.id).toBeGreaterThan(OPEN_END_Y);
      } else {
        expect(layoutBranch.startY, layoutBranch.branch.id).toBe(OPEN_END_Y);
      }
    }
  });

  it('draws a path for every branch that stays inside the canvas', () => {
    for (const layoutBranch of layout.branches) {
      expect(layoutBranch.path, layoutBranch.branch.id).toMatch(/^M /);
      expect(layoutBranch.startY).toBeLessThanOrEqual(layoutBranch.endY);
      expect(layoutBranch.endY).toBeLessThanOrEqual(layout.height);
      for (const layoutNode of layoutBranch.nodes) {
        expect(layoutNode.x).toBeLessThan(layout.width);
        expect(layoutNode.y).toBeLessThan(layout.height);
      }
    }
  });
});

function uniqueLength(values: number[]) {
  return new Set(values).size;
}
