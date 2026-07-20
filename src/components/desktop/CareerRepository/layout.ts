import type { SwymbleCareerBranch, SwymbleCareerNode } from '../../../data/types';
import { COLUMN_SPACING_X, CURVE_RUN_Y, PADDING_X, PADDING_Y, ROW_SPACING_Y, SIBLING_STAGGER_Y } from './constants';

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
  /** Vertical extent of the rendered path (including any fork/merge curve past the nodes
   *  themselves), used to scroll-scrub the draw-in animation. */
  startY: number;
  endY: number;
};

export type CareerLayout = {
  branches: LayoutBranch[];
  nodesById: Map<string, LayoutNode>;
  width: number;
  height: number;
};

/** Parses 'YYYY' or 'MM-YYYY' into a sortable month-resolution number. */
const parseDateKey = (date: string): number => {
  const parts = date.split('-').map(Number);
  if (parts.length === 1) {
    return parts[0] * 12;
  }
  const [month, year] = parts;
  return year * 12 + month;
};

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

/** Assigns each node a row by chronological rank, MOST RECENT FIRST (row 0 = top): the graph
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

/** Straight line within a column; a wide vertical S-curve (bulging through a mid-row control
 *  point) when jogging sideways into a different column. */
const smoothSegment = (x1: number, y1: number, x2: number, y2: number): string => {
  if (x1 === x2) {
    return `L ${x2} ${y2}`;
  }
  const midY = (y1 + y2) / 2;
  return `C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`;
};

export function computeCareerLayout(branches: SwymbleCareerBranch[]): CareerLayout {
  const ordered = topologicalOrder(branches);
  const columnByBranchId = new Map(ordered.map((branch, index) => [branch.id, index]));
  const laneX = (column: number) => PADDING_X + column * COLUMN_SPACING_X;
  const rawRow = assignNodeRows(ordered);

  // How many branches have already forked from / merged into a given parent, so later siblings
  // get pushed a bit further along the parent's timeline instead of landing on the same point.
  const forkCountByParent = new Map<string, number>();
  const mergeCountByParent = new Map<string, number>();

  const nodesById = new Map<string, LayoutNode>();
  const layoutBranches: LayoutBranch[] = [];
  let maxYExtent = PADDING_Y;

  for (const branch of ordered) {
    const lane = columnByBranchId.get(branch.id) ?? 0;
    const x = laneX(lane);

    const nodes: LayoutNode[] = branch.nodes.map((node) => {
      const row = rawRow.get(node.id) ?? 0;
      const layoutNode: LayoutNode = { node, branchId: branch.id, x, y: PADDING_Y + row * ROW_SPACING_Y };
      nodesById.set(node.id, layoutNode);
      return layoutNode;
    });

    // nodes[] is authored oldest→newest; ensure y strictly decreases in that direction (each
    // later/more-recent node sits further up than the one before it) even if two shared a date.
    for (let i = 1; i < nodes.length; i++) {
      if (nodes[i].y >= nodes[i - 1].y) {
        nodes[i].y = nodes[i - 1].y - ROW_SPACING_Y;
      }
    }

    const parentBranch = branch.parentBranchId ? ordered.find((b) => b.id === branch.parentBranchId) : undefined;
    const parentX = parentBranch ? laneX(columnByBranchId.get(parentBranch.id) ?? 0) : undefined;
    const oldestOwn = nodes[0];
    const newestOwn = nodes[nodes.length - 1];

    let d = '';
    let startY = newestOwn?.y ?? PADDING_Y;
    let endY = oldestOwn?.y ?? PADDING_Y;

    if (branch.status === 'merged' && parentX !== undefined && newestOwn) {
      const siblingIndex = mergeCountByParent.get(branch.parentBranchId!) ?? 0;
      mergeCountByParent.set(branch.parentBranchId!, siblingIndex + 1);
      const mergeY = newestOwn.y - CURVE_RUN_Y - siblingIndex * SIBLING_STAGGER_Y;
      d = `M ${parentX} ${mergeY} ${smoothSegment(parentX, mergeY, newestOwn.x, newestOwn.y)}`;
      startY = mergeY;
    } else if (newestOwn) {
      d = `M ${newestOwn.x} ${newestOwn.y}`;
    }

    for (let i = nodes.length - 2; i >= 0; i--) {
      d += ` ${smoothSegment(nodes[i + 1].x, nodes[i + 1].y, nodes[i].x, nodes[i].y)}`;
    }

    if (parentX !== undefined && oldestOwn) {
      const siblingIndex = forkCountByParent.get(branch.parentBranchId!) ?? 0;
      forkCountByParent.set(branch.parentBranchId!, siblingIndex + 1);
      const forkY = oldestOwn.y + CURVE_RUN_Y + siblingIndex * SIBLING_STAGGER_Y;
      d += ` ${smoothSegment(oldestOwn.x, oldestOwn.y, parentX, forkY)}`;
      endY = forkY;
      maxYExtent = Math.max(maxYExtent, forkY);
    }

    if (newestOwn) maxYExtent = Math.max(maxYExtent, newestOwn.y);
    if (oldestOwn) maxYExtent = Math.max(maxYExtent, oldestOwn.y);

    layoutBranches.push({ branch, lane, x, path: d.trim(), nodes, startY, endY });
  }

  const maxLane = Math.max(0, ...layoutBranches.map((b) => b.lane));

  return {
    branches: layoutBranches,
    nodesById,
    width: maxLane * COLUMN_SPACING_X + PADDING_X * 2,
    height: maxYExtent + PADDING_Y,
  };
}
