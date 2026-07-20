import type { SwymbleCareerBranch, SwymbleCareerNode } from '../../../data/types';
import { CURVE_RUN_X, LANE_SPACING_Y, MIN_FORK_GAP, NODE_SPACING_X, PADDING_X, PADDING_Y } from './constants';

export type LayoutNode = {
  node: SwymbleCareerNode;
  branchId: string;
  x: number;
  y: number;
};

export type LayoutBranch = {
  branch: SwymbleCareerBranch;
  lane: number;
  y: number;
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

/** Assigns each node an x slot by chronological sequence (git-log style: position reflects
 *  commit order, not literal elapsed time — otherwise a decade-spanning education branch would
 *  crush a few-month client engagement into an unreadable cluster). */
const assignNodeSequence = (branches: SwymbleCareerBranch[]): Map<string, number> => {
  const entries = branches.flatMap((branch) =>
    branch.nodes.map((node) => ({ branchId: branch.id, node })),
  );
  entries.sort((a, b) => parseDateKey(a.node.date) - parseDateKey(b.node.date));

  const xById = new Map<string, number>();
  entries.forEach(({ node }, index) => {
    xById.set(node.id, PADDING_X + index * NODE_SPACING_X);
  });
  return xById;
};

const smoothSegment = (x1: number, y1: number, x2: number, y2: number): string => {
  if (y1 === y2) {
    return `L ${x2} ${y2}`;
  }
  const midX = (x1 + x2) / 2;
  return `C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`;
};

export function computeCareerLayout(branches: SwymbleCareerBranch[]): CareerLayout {
  const lanes = assignLanes(branches);
  const laneY = (lane: number) => PADDING_Y + lane * LANE_SPACING_Y;
  const rawX = assignNodeSequence(branches);
  // Multiple branches can fork from the very same commit (e.g. a client branch and several
  // product branches all splitting off "First Client") — without staggering them, their curves
  // land on top of each other right at the fork point. Each subsequent sibling gets a bit more
  // run-up so they fan out instead of overlapping.
  const forkSiblingIndex = new Map<string, number>();

  const nodesById = new Map<string, LayoutNode>();
  const layoutBranches: LayoutBranch[] = [];

  for (const branch of branches) {
    const lane = lanes.get(branch.id) ?? 0;
    const y = laneY(lane);

    const forkNode = branch.splitAfterNodeId ? nodesById.get(branch.splitAfterNodeId) : undefined;
    const parentLane = branch.parentBranchId ? lanes.get(branch.parentBranchId) : undefined;
    const laneDistance = forkNode && parentLane !== undefined ? Math.abs(lane - parentLane) : 0;

    let siblingIndex = 0;
    if (forkNode) {
      siblingIndex = forkSiblingIndex.get(forkNode.node.id) ?? 0;
      forkSiblingIndex.set(forkNode.node.id, siblingIndex + 1);
    }
    const curveRun = CURVE_RUN_X + laneDistance * 16 + siblingIndex * 30;
    const minFirstX = forkNode ? forkNode.x + MIN_FORK_GAP + siblingIndex * 30 : PADDING_X;

    const nodes: LayoutNode[] = branch.nodes.map((node, index) => {
      const x = Math.max(rawX.get(node.id) ?? PADDING_X, index === 0 ? minFirstX : 0);
      const layoutNode: LayoutNode = { node, branchId: branch.id, x, y };
      nodesById.set(node.id, layoutNode);
      return layoutNode;
    });

    // Ensure strictly increasing x along the branch even if two nodes shared a date slot.
    for (let i = 1; i < nodes.length; i++) {
      if (nodes[i].x <= nodes[i - 1].x) {
        nodes[i].x = nodes[i - 1].x + NODE_SPACING_X;
      }
    }

    let d = '';
    if (forkNode) {
      const firstOwn = nodes[0];
      const bendX = Math.min(forkNode.x + curveRun, firstOwn ? firstOwn.x - curveRun : forkNode.x + curveRun);
      d = `M ${forkNode.x} ${forkNode.y} ${smoothSegment(forkNode.x, forkNode.y, Math.max(bendX, forkNode.x), y)}`;
      if (firstOwn && firstOwn.x > forkNode.x) {
        d += ` L ${firstOwn.x} ${firstOwn.y}`;
      }
    } else if (nodes.length > 0) {
      d = `M ${nodes[0].x} ${nodes[0].y}`;
    }

    for (let i = 1; i < nodes.length; i++) {
      d += ` ${smoothSegment(nodes[i - 1].x, nodes[i - 1].y, nodes[i].x, nodes[i].y)}`;
    }

    if (branch.mergesBackAfterNodeId) {
      const mergeNode = nodesById.get(branch.mergesBackAfterNodeId);
      if (mergeNode && parentLane !== undefined) {
        const parentY = laneY(parentLane);
        const mergeX = mergeNode.x + curveRun;
        d += ` ${smoothSegment(mergeNode.x, mergeNode.y, mergeX, parentY)}`;
      }
    }

    layoutBranches.push({ branch, lane, y, path: d.trim(), nodes });
  }

  const maxX = Math.max(PADDING_X, ...[...nodesById.values()].map((n) => n.x));
  const maxLane = Math.max(0, ...layoutBranches.map((b) => b.lane));

  return {
    branches: layoutBranches,
    nodesById,
    width: maxX + PADDING_X,
    height: maxLane * LANE_SPACING_Y + PADDING_Y * 2,
  };
}
