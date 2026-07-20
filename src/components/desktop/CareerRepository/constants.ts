import type { SwymbleCareerNode, SwymbleCareerNodeType } from '../../../data/types';

export const PADDING_X = 90;
export const PADDING_Y = 70;
export const NODE_SPACING_X = 160;
export const LANE_SPACING_Y = 130;
/** Horizontal distance a fork/merge S-curve takes to transition between lanes. */
export const CURVE_RUN_X = 70;
/** Minimum x gap enforced between a branch's fork point and its first own-lane node. */
export const MIN_FORK_GAP = 70;

export type NodeShape = 'diamond' | 'square' | 'circle' | 'small-circle' | 'hollow-circle';

export const NODE_SHAPE_BY_TYPE: Record<SwymbleCareerNodeType, NodeShape> = {
  education: 'diamond',
  employment: 'square',
  milestone: 'circle',
  project: 'small-circle',
  future: 'hollow-circle',
};

export const NODE_RADIUS_BY_SHAPE: Record<NodeShape, number> = {
  diamond: 9,
  square: 8,
  circle: 8,
  'small-circle': 6,
  'hollow-circle': 7,
};

/** Future/ghost commits are always hollow, regardless of their underlying type. */
export const getNodeShape = (node: SwymbleCareerNode): NodeShape =>
  node.isFuture ? 'hollow-circle' : NODE_SHAPE_BY_TYPE[node.type];
