import type { SwymbleCareerBranch, SwymbleCareerNode } from '../../../data/types';
import { COLUMN_SPACING_X, MIN_FORK_GAP, PADDING_X, PADDING_Y, ROW_SPACING_Y } from './constants';

export type LayoutNode = {
  node: SwymbleCareerNode;
  branchId: string;
  x: number;
  y: number;
};

export type LayoutBranch = {
  branch: SwymbleCareerBranch;
  lane: number;
  x: number;
  /** SVG path `d` for the branch line, including fork-in and merge-back curves. */
  path: string;
  nodes: LayoutNode[];
};

export type CareerLayout = {
  branches: LayoutBranch[];
  nodesById: Map<string, LayoutNode>;
  width: number;
  height: number;
};

/** Parses 'YYYY' or 'YYYY-MM' into a sortable month-resolution number. */
const parseDateKey = (date: string): number => {
  const [year, month] = date.split('-').map(Number);
  return year * 12 + (month ?? 1);
};

const assignLanes = (branches: SwymbleCareerBranch[]): Map<string, number> => {
  const lanes = new Map<string, number>();
  branches.forEach((branch, index) => {
    lanes.set(branch.id, branch.id === 'main' ? 0 : index);
  });
  return lanes;
};

/** Assigns each node a row by chronological rank, MOST RECENT FIRST (row 0 = top) — the graph
 *  reads top-to-bottom as now-to-past, so scrolling down moves back through history. */
const assignNodeRows = (branches: SwymbleCareerBranch[]): Map<string, number> => {
  const entries = branches.flatMap((branch) =>
    branch.nodes.map((node) => ({ branchId: branch.id, node })),
  );
  entries.sort((a, b) => parseDateKey(b.node.date) - parseDateKey(a.node.date));

  const rowById = new Map<string, number>();
  entries.forEach(({ node }, index) => {
    rowById.set(node.id, index);
  });
  return rowById;
};

/** Straight line within a column; a vertical S-curve (bulging through a mid-row control point)
 *  when jogging sideways into a different column — the standard commit-graph fork/merge shape. */
const smoothSegment = (x1: number, y1: number, x2: number, y2: number): string => {
  if (x1 === x2) {
    return `L ${x2} ${y2}`;
  }
  const midY = (y1 + y2) / 2;
  return `C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`;
};

export function computeCareerLayout(branches: SwymbleCareerBranch[]): CareerLayout {
  const lanes = assignLanes(branches);
  const laneX = (lane: number) => PADDING_X + lane * COLUMN_SPACING_X;
  const rawRow = assignNodeRows(branches);
  const minGapRows = Math.max(1, Math.ceil(MIN_FORK_GAP / ROW_SPACING_Y));

  const nodesById = new Map<string, LayoutNode>();
  const layoutBranches: LayoutBranch[] = [];

  for (const branch of branches) {
    const lane = lanes.get(branch.id) ?? 0;
    const x = laneX(lane);

    const forkNode = branch.splitAfterNodeId ? nodesById.get(branch.splitAfterNodeId) : undefined;
    // branch.nodes is authored oldest-first; nodes[0] is the branch's earliest event — the one
    // nearest in time to the fork point, so it must land strictly closer to "now" (smaller row)
    // than the fork node by at least a minimum gap.
    const maxFirstRow = forkNode ? rawRow.get(forkNode.node.id)! - minGapRows : Infinity;

    const nodes: LayoutNode[] = branch.nodes.map((node, index) => {
      const row = Math.min(rawRow.get(node.id) ?? 0, index === 0 ? maxFirstRow : Infinity);
      const layoutNode: LayoutNode = { node, branchId: branch.id, x, y: PADDING_Y + row * ROW_SPACING_Y };
      nodesById.set(node.id, layoutNode);
      return layoutNode;
    });

    // nodes[] is authored oldest→newest; ensure y strictly decreases in that direction (each
    // later/more-recent node sits further up than the one before it).
    for (let i = 1; i < nodes.length; i++) {
      if (nodes[i].y >= nodes[i - 1].y) {
        nodes[i].y = nodes[i - 1].y - ROW_SPACING_Y;
      }
    }

    let d = '';

    if (branch.mergesBackAfterNodeId) {
      const parentLane = branch.parentBranchId ? lanes.get(branch.parentBranchId) : undefined;
      const newest = nodes[nodes.length - 1]; // most recent own node (smallest y)
      if (newest && parentLane !== undefined) {
        const parentX = laneX(parentLane);
        d = `M ${parentX} ${newest.y} ${smoothSegment(parentX, newest.y, newest.x, newest.y)}`;
      }
    } else if (nodes.length > 0) {
      d = `M ${nodes[nodes.length - 1].x} ${nodes[nodes.length - 1].y}`;
    }

    // Draw newest-to-oldest (top to bottom) through the branch's own nodes.
    for (let i = nodes.length - 2; i >= 0; i--) {
      d += ` ${smoothSegment(nodes[i + 1].x, nodes[i + 1].y, nodes[i].x, nodes[i].y)}`;
    }

    if (forkNode && nodes.length > 0) {
      const oldestOwn = nodes[0];
      d += ` ${smoothSegment(oldestOwn.x, oldestOwn.y, forkNode.x, forkNode.y)}`;
    }

    layoutBranches.push({ branch, lane, x, path: d.trim(), nodes });
  }

  const maxY = Math.max(PADDING_Y, ...[...nodesById.values()].map((n) => n.y));
  const maxLane = Math.max(0, ...layoutBranches.map((b) => b.lane));

  return {
    branches: layoutBranches,
    nodesById,
    width: maxLane * COLUMN_SPACING_X + PADDING_X * 2,
    height: maxY + PADDING_Y,
  };
}
