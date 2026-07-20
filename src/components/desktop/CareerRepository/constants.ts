import type { SwymbleCareerNode, SwymbleCareerNodeType } from '../../../data/types';

// The graph reads top (most recent) to bottom (oldest): columns are branches (x), rows are
// chronological position (y), and scrolling down moves back through time.
export const PADDING_X = 60;
export const PADDING_Y = 60;
export const COLUMN_SPACING_X = 140;
export const ROW_SPACING_Y = 110;
/** Vertical run a fork/merge S-curve takes to jog sideways into a different column, wider than
 *  a single row so the join reads as a smooth diagonal rather than a right-angle jog. */
export const CURVE_RUN_Y = 90;
/** Extra vertical run added per sibling that shares a fork/merge point on the same parent, so
 *  several branches forking close together fan out instead of overlapping. */
export const SIBLING_STAGGER_Y = 26;

export type NodeShape = 'diamond' | 'square';

export const NODE_SHAPE_BY_TYPE: Record<SwymbleCareerNodeType, NodeShape> = {
  education: 'diamond',
  employment: 'square',
  milestone: 'square',
  project: 'square',
  award: 'square',
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

/** One color per branch, assigned by position in topological order (main first). Muted/desaturated
 *  to stay in the site's "instrument panel, not neon city" register; volt and cyan are reserved
 *  for interactive hover state and stay out of this palette. Cycles if there are more branches. */
export const BRANCH_COLOR_PALETTE = [
  '#9aa0e0', // soft periwinkle
  '#e0a05c', // warm amber
  '#5cb8e0', // sky blue
  '#e08fc0', // rose
  '#8fd0a0', // sage green
  '#d0c05c', // soft gold
  '#b08fe0', // lavender
  '#e08f70', // coral
  '#5cd0c0', // teal
];

export const branchColor = (index: number): string => BRANCH_COLOR_PALETTE[index % BRANCH_COLOR_PALETTE.length];
