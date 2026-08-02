import type { SwymbleCareerBranch, SwymbleCareerNode } from '../../../data/types';
import {
  CURVE_RUN_Y,
  GUTTER_RIGHT,
  LABEL_GUTTER_PAD,
  LABEL_MIN_GAP_Y,
  LANE_REUSE_SLACK_MONTHS,
  LANE_WIDTH,
  MAX_DATE_GAP_Y,
  MIN_DATE_GAP_Y,
  OPEN_END_Y,
  PADDING_BOTTOM,
  PADDING_TOP,
  PX_PER_MONTH,
  RULER_WIDTH,
  SAME_DATE_STACK_Y,
} from './constants';

export type LayoutNode = {
  node: SwymbleCareerNode;
  branchId: string;
  /** Index of the owning branch in topological order — the key its color is derived from. */
  colorIndex: number;
  x: number;
  y: number;
};

export type LayoutBranch = {
  branch: SwymbleCareerBranch;
  lane: number;
  colorIndex: number;
  x: number;
  /** SVG path `d` for the branch line, including fork-in and merge-back curves. Authored from the
   *  top of the graph downward so the scroll-linked draw runs with the scroll, not against it. */
  path: string;
  nodes: LayoutNode[];
  /** The point on the branch the label refers to: its fork node, the way a git graph labels a
   *  branch where it starts rather than in a separate legend. The leader line runs from here. */
  labelAnchorX: number;
  labelAnchorY: number;
  /** Where the pill itself is drawn. Parked in the right gutter and nudged apart from its
   *  neighbours, so a label can never land on top of a line or a node. */
  labelY: number;
  /** Vertical extent of the rendered path. Always startY <= endY (top to bottom on screen). */
  startY: number;
  endY: number;
};

export type YearTick = {
  year: number;
  y: number;
};

export type CareerLayout = {
  branches: LayoutBranch[];
  /** x where every branch pill starts, just right of the last lane. */
  labelX: number;
  nodesById: Map<string, LayoutNode>;
  /** Newest first, the order `git log` prints in and the order the log panel renders. */
  orderedNodes: LayoutNode[];
  yearTicks: YearTick[];
  laneCount: number;
  width: number;
  height: number;
};

/** Parses 'YYYY' or 'MM-YYYY' into a sortable month-resolution number.
 *
 *  A bare 'YYYY' is read as January of that year, NOT as `year * 12`. Months are 1-based here, so
 *  `year * 12` is the same number '12-(year-1)' produces: '2021' and '12-2020' collided on one key,
 *  landed on one row, and sorted arbitrarily against each other — which is how the commit log ended
 *  up printing a 2020 group above a 2021 one. */
export const parseDateKey = (date: string): number => {
  const parts = date.split('-').map(Number);
  if (parts.length === 1) {
    return parts[0] * 12 + 1;
  }
  const [month, year] = parts;
  return year * 12 + month;
};

/** Inverse of parseDateKey: the calendar year and 1-based month a key falls in. */
export const dateKeyToYearMonth = (key: number): { year: number; month: number } => ({
  year: Math.floor((key - 1) / 12),
  month: ((key - 1) % 12) + 1,
});

/** Orders branches so every branch comes after its parent, regardless of the order files were
 *  discovered in: this is what lets a new branch file just declare `parentBranchId` and work,
 *  with no index to hand-edit or ordering to get right. */
const topologicalOrder = (branches: SwymbleCareerBranch[]): SwymbleCareerBranch[] => {
  const byId = new Map(branches.map((branch) => [branch.id, branch]));
  const ordered: SwymbleCareerBranch[] = [];
  const placed = new Set<string>();

  const place = (branch: SwymbleCareerBranch, guard = 0) => {
    if (placed.has(branch.id) || guard > branches.length) return;
    const parent = branch.parentBranchId ? byId.get(branch.parentBranchId) : undefined;
    if (parent && !placed.has(parent.id)) {
      place(parent, guard + 1);
    }
    placed.add(branch.id);
    ordered.push(branch);
  };

  branches.forEach((branch) => place(branch));
  return ordered;
};

/** Branch id → its index in topological order, which is the key `branchColor` is written against.
 *  Exported so anything else drawing from the career data (the About page's contribution mosaic)
 *  colors a branch identically to the graph without recomputing a whole layout. */
export const branchColorIndexes = (branches: SwymbleCareerBranch[]): Map<string, number> =>
  new Map(topologicalOrder(branches).map((branch, index) => [branch.id, index]));

type TimeScale = {
  /** y for a date key that a node actually sits on. */
  keyToY: Map<number, number>;
  /** y for an arbitrary key (year ticks), interpolated within the same piecewise scale. */
  yForKey: (key: number) => number;
};

/**
 * Builds the vertical time axis, running BACKWARDS: the newest date sits at the top and y grows
 * as the dates get older, matching `git log` order. Consecutive occupied dates are spaced by
 * their real gap, then clamped — see the PX_PER_MONTH comment in constants.ts for why a raw
 * linear axis fails on this data. The result is monotonic and still proportional within the clamp
 * band, so a two-year gap reads as visibly taller than a one-month gap without running to 800px.
 */
const buildTimeScale = (keys: number[]): TimeScale => {
  // Descending: index 0 is the most recent date and lands at the top of the canvas.
  const sorted = [...new Set(keys)].sort((a, b) => b - a);
  const ys: number[] = [];
  let y = PADDING_TOP;

  sorted.forEach((key, index) => {
    if (index > 0) {
      const gapMonths = sorted[index - 1] - key;
      y += Math.min(MAX_DATE_GAP_Y, Math.max(MIN_DATE_GAP_Y, gapMonths * PX_PER_MONTH));
    }
    ys.push(y);
  });

  const yForKey = (key: number): number => {
    if (sorted.length === 0) return PADDING_TOP;
    // Newer than anything on record: extrapolate upward, off the top.
    if (key >= sorted[0]) return ys[0] - (key - sorted[0]) * PX_PER_MONTH;

    const oldest = sorted.length - 1;
    if (key <= sorted[oldest]) return ys[oldest] + (sorted[oldest] - key) * PX_PER_MONTH;

    let index = 1;
    while (index < sorted.length && sorted[index] > key) index += 1;
    const keySpan = sorted[index - 1] - sorted[index];
    const progress = keySpan === 0 ? 0 : (sorted[index - 1] - key) / keySpan;
    return ys[index - 1] + progress * (ys[index] - ys[index - 1]);
  };

  return { keyToY: new Map(sorted.map((key, index) => [key, ys[index]])), yForKey };
};

/** Straight line within a lane; a vertical S-curve (bulging through a mid-row control point) when
 *  jogging sideways into a different lane. */
const smoothSegment = (x1: number, y1: number, x2: number, y2: number): string => {
  if (x1 === x2) {
    return `L ${x2} ${y2}`;
  }
  const midY = (y1 + y2) / 2;
  return `C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`;
};

type Span = { top: number; bottom: number };

/**
 * Assigns lanes the way a real git graph renderer does: a lane is a reusable track, not a
 * permanent column per branch. A branch takes the leftmost lane that is vertically free for its
 * whole span, so branches whose lifetimes don't overlap can share one track instead of each
 * reserving a column for the entire height of the graph.
 *
 * Branches stay unambiguous despite sharing tracks because each keeps its own color (keyed on
 * topological index, not lane) and is labelled with a pill at its fork point.
 */
const assignLanes = (
  ordered: SwymbleCareerBranch[],
  spanByBranchId: Map<string, Span>,
): Map<string, number> => {
  const laneByBranchId = new Map<string, number>();
  const occupancy = new Map<number, Span[]>();
  const slack = LANE_REUSE_SLACK_MONTHS * PX_PER_MONTH;

  const occupy = (lane: number, span: Span) => {
    const spans = occupancy.get(lane) ?? [];
    spans.push(span);
    occupancy.set(lane, spans);
  };

  const isFree = (lane: number, span: Span): boolean =>
    (occupancy.get(lane) ?? []).every(
      (taken) => span.bottom + slack < taken.top || span.top - slack > taken.bottom,
    );

  ordered.forEach((branch) => {
    const span = spanByBranchId.get(branch.id);
    if (!span) {
      laneByBranchId.set(branch.id, 0);
      return;
    }

    // The trunk always owns lane 0 so the spine of the graph stays put.
    if (!branch.parentBranchId) {
      laneByBranchId.set(branch.id, 0);
      occupy(0, span);
      return;
    }

    let lane = 1;
    while (!isFree(lane, span)) lane += 1;
    laneByBranchId.set(branch.id, lane);
    occupy(lane, span);
  });

  return laneByBranchId;
};

export function computeCareerLayout(branches: SwymbleCareerBranch[]): CareerLayout {
  const ordered = topologicalOrder(branches);
  const colorIndexByBranchId = new Map(ordered.map((branch, index) => [branch.id, index]));

  const allKeys = ordered.flatMap((branch) => branch.nodes.map((node) => parseDateKey(node.date)));
  const scale = buildTimeScale(allKeys);

  // Pass 1 — place every node on the time axis, then lift any same-branch collision upward.
  // `nodes` is authored oldest first and the axis runs oldest-at-the-bottom, so y must strictly
  // DECREASE along that array. Two nodes sharing a date across *different* branches is meaningful
  // (same moment, parallel tracks) and is left alone; two on the same branch would just overlap.
  const yByNodeId = new Map<string, number>();
  ordered.forEach((branch) => {
    let previousY = Number.POSITIVE_INFINITY;
    branch.nodes.forEach((node) => {
      const scaled = scale.keyToY.get(parseDateKey(node.date)) ?? PADDING_TOP;
      const y = scaled >= previousY ? previousY - SAME_DATE_STACK_Y : scaled;
      yByNodeId.set(node.id, y);
      previousY = y;
    });
  });

  // Pass 2 — vertical spans, needed before lanes can be assigned. An unmerged branch stays open
  // to the TOP of the graph (it continues into the present), so it holds its track across
  // everything more recent than its newest commit; a merged one releases its track above the
  // merge curve.
  const spanByBranchId = new Map<string, Span>();
  ordered.forEach((branch) => {
    const ys = branch.nodes.map((node) => yByNodeId.get(node.id) ?? PADDING_TOP);
    if (ys.length === 0) return;
    const isOpen = branch.status !== 'merged';
    spanByBranchId.set(branch.id, {
      top: isOpen ? OPEN_END_Y : Math.min(...ys) - CURVE_RUN_Y,
      bottom: Math.max(...ys) + CURVE_RUN_Y,
    });
  });

  const laneByBranchId = assignLanes(ordered, spanByBranchId);
  const laneX = (lane: number) => RULER_WIDTH + lane * LANE_WIDTH + LANE_WIDTH / 2;

  // Pass 3 — build the drawn paths, top (newest) to bottom (oldest).
  const nodesById = new Map<string, LayoutNode>();
  const layoutBranches: LayoutBranch[] = [];
  let maxY = PADDING_TOP;

  ordered.forEach((branch) => {
    const lane = laneByBranchId.get(branch.id) ?? 0;
    const colorIndex = colorIndexByBranchId.get(branch.id) ?? 0;
    const x = laneX(lane);

    const nodes: LayoutNode[] = branch.nodes.map((node) => {
      const layoutNode: LayoutNode = {
        node,
        branchId: branch.id,
        colorIndex,
        x,
        y: yByNodeId.get(node.id) ?? PADDING_TOP,
      };
      nodesById.set(node.id, layoutNode);
      return layoutNode;
    });

    const parentLane = branch.parentBranchId ? laneByBranchId.get(branch.parentBranchId) : undefined;
    const parentX = parentLane === undefined ? undefined : laneX(parentLane);
    // nodes[] is authored oldest first; on a newest-at-the-top axis that means the LAST entry is
    // the highest on screen and the first is the lowest.
    const oldest = nodes[0];
    const newest = nodes[nodes.length - 1];

    let d = '';
    let startY = newest?.y ?? PADDING_TOP;
    let endY = oldest?.y ?? PADDING_TOP;

    if (newest) {
      if (branch.status === 'merged' && parentX !== undefined) {
        // Merge back: start on the parent's line one curve-run above the newest commit and
        // curve down into this branch's lane.
        const mergeY = newest.y - CURVE_RUN_Y;
        d = `M ${parentX} ${mergeY} ${smoothSegment(parentX, mergeY, newest.x, newest.y)}`;
        startY = mergeY;
      } else if (branch.status !== 'merged') {
        // Still open: run down from the top edge so ongoing work visibly continues into now.
        d = `M ${newest.x} ${OPEN_END_Y} L ${newest.x} ${newest.y}`;
        startY = OPEN_END_Y;
      } else {
        d = `M ${newest.x} ${newest.y}`;
      }
    }

    for (let index = nodes.length - 2; index >= 0; index -= 1) {
      d += ` ${smoothSegment(nodes[index + 1].x, nodes[index + 1].y, nodes[index].x, nodes[index].y)}`;
    }

    if (parentX !== undefined && oldest) {
      // Fork in: curve out of the parent's lane one curve-run below the oldest commit.
      const forkY = oldest.y + CURVE_RUN_Y;
      d += ` ${smoothSegment(oldest.x, oldest.y, parentX, forkY)}`;
      endY = forkY;
    }

    maxY = Math.max(maxY, endY);

    layoutBranches.push({
      branch,
      lane,
      colorIndex,
      x,
      path: d.trim(),
      nodes,
      // The label marks where the branch begins, which on this axis is its lowest point.
      labelAnchorX: oldest?.x ?? x,
      labelAnchorY: oldest?.y ?? PADDING_TOP,
      labelY: oldest?.y ?? PADDING_TOP,
      startY,
      endY,
    });
  });

  // Pass 4 — park the pills. Sorting by anchor and pushing each one below the last means labels
  // never overlap each other, and because they all sit in the gutter they can't overlap a lane
  // either. The leader line drawn in RepositoryGraph is what keeps them attached to their branch.
  const byAnchor = [...layoutBranches].sort((a, b) => a.labelAnchorY - b.labelAnchorY);
  let lastLabelY = Number.NEGATIVE_INFINITY;
  for (const layoutBranch of byAnchor) {
    layoutBranch.labelY = Math.max(layoutBranch.labelAnchorY, lastLabelY + LABEL_MIN_GAP_Y);
    lastLabelY = layoutBranch.labelY;
    maxY = Math.max(maxY, layoutBranch.labelY);
  }

  const orderedNodes = [...nodesById.values()].sort(
    (a, b) => a.y - b.y || parseDateKey(b.node.date) - parseDateKey(a.node.date),
  );

  const laneCount = Math.max(1, ...layoutBranches.map((layoutBranch) => layoutBranch.lane + 1));

  // Ticks mark January of each year, which is `year * 12 + 1` on this 1-based-month scale.
  const firstYear = dateKeyToYearMonth(Math.min(...allKeys)).year;
  const lastYear = dateKeyToYearMonth(Math.max(...allKeys)).year;
  const yearTicks: YearTick[] = [];
  for (let year = lastYear; year >= firstYear; year -= 1) {
    yearTicks.push({ year, y: scale.yForKey(year * 12 + 1) });
  }

  return {
    branches: layoutBranches,
    labelX: RULER_WIDTH + laneCount * LANE_WIDTH + LABEL_GUTTER_PAD,
    nodesById,
    orderedNodes,
    yearTicks,
    laneCount,
    width: RULER_WIDTH + laneCount * LANE_WIDTH + GUTTER_RIGHT,
    height: maxY + PADDING_BOTTOM,
  };
}
