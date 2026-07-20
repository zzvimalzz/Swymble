import type { SwymbleCareerNode, SwymbleCareerNodeType } from '../../../data/types';

// The graph reads top (most recent) to bottom (oldest) — columns are branches (x), rows are
// chronological position (y), and scrolling down moves back through time.
export const PADDING_X = 60;
export const PADDING_Y = 60;
export const COLUMN_SPACING_X = 140;
export const ROW_SPACING_Y = 110;
/** Vertical run an S-curve takes to jog sideways into a different column. */
export const CURVE_RUN_Y = 60;
/** Minimum row gap enforced between a branch's fork point and its nearest own row. */
export const MIN_FORK_GAP = 50;

export type NodeShape = 'diamond' | 'square';

export const NODE_SHAPE_BY_TYPE: Record<SwymbleCareerNodeType, NodeShape> = {
  education: 'diamond',
  employment: 'square',
  milestone: 'square',
  project: 'square',
  future: 'square',
};

export const NODE_RADIUS_BY_SHAPE: Record<NodeShape, number> = {
  diamond: 9,
  square: 8,
};

/** Only two shapes exist: diamond marks education, square marks everything else. Future/ghost
 *  commits reuse their underlying shape but render hollow (see CommitNode) rather than adding a
 *  third shape. */
export const getNodeShape = (node: SwymbleCareerNode): NodeShape => NODE_SHAPE_BY_TYPE[node.type];
