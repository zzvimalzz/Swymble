import type { SwymbleCareerNode, SwymbleCareerNodeType } from '../../../data/types';

// The graph is a swimlane chart, not a uniform-spacing tree: x is a branch lane, y is real
// elapsed time reading top (newest) to bottom (oldest), the same order `git log` prints in — so
// the present sits at the top and scrolling down walks back through history.

/** Left gutter holding the year ruler (tick labels + rule). */
export const RULER_WIDTH = 76;
/** Right gutter. Branch-name pills live entirely inside it (see LABEL_* below), so it has to be
 *  wide enough for the longest label plus its leader line. */
export const GUTTER_RIGHT = 172;

/** Branch pills are parked in the gutter rather than floating beside their fork node, where they
 *  sat on top of whatever line or node happened to be to the right. Each is joined to its branch
 *  by a faint leader line instead. */
export const LABEL_GUTTER_PAD = 14;
/** Minimum vertical gap between two pills, so branches forking at similar times don't stack up. */
export const LABEL_MIN_GAP_Y = 26;
export const LABEL_CHAR_WIDTH = 5.9;
export const LABEL_PADDING_X = 22;
export const PADDING_TOP = 54;
export const PADDING_BOTTOM = 54;
export const LANE_WIDTH = 88;

/** Base vertical scale. Real gaps between consecutive dates are drawn at this rate, then clamped
 *  to [MIN_DATE_GAP_Y, MAX_DATE_GAP_Y] — a purely linear time axis would waste ~800px on the
 *  empty 2021-2023 stretch and then cram ten 2026 nodes into 80px. Clamping keeps the axis
 *  monotonic and still visibly proportional (a long gap stays taller than a short one) without
 *  either failure mode. */
export const PX_PER_MONTH = 9;
export const MIN_DATE_GAP_Y = 74;
export const MAX_DATE_GAP_Y = 190;

/** Two nodes on the SAME branch can share a date (e.g. the Masters start and the Present marker,
 *  both 10-2026). They stack at this tighter offset rather than a full MIN_DATE_GAP_Y: they really
 *  did happen at the same time, so they should read as a pair, and a full-gap push would shove the
 *  second one level with the genuinely later nodes on the next row down. */
export const SAME_DATE_STACK_Y = 44;

/** Vertical run a fork/merge S-curve takes to jog between lanes, wide enough that the join reads
 *  as a smooth diagonal rather than a right-angle jog. */
export const CURVE_RUN_Y = 46;

/** Where a still-open branch's line stops at the top of the canvas. Ongoing work runs up past its
 *  newest commit and off the top edge, rather than stopping dead at the last thing that happened. */
export const OPEN_END_Y = 10;

/** Hover card geometry. The card is pinned beside its node, never over it, so it can't steal the
 *  pointer that opened it. CARD_HALF_HEIGHT is only used to clamp the card's centre away from the
 *  canvas edges — it's the cap from CSS `max-height`, not a measurement. */
export const CARD_WIDTH = 340;
export const CARD_GAP_X = 26;
export const CARD_HALF_HEIGHT = 190;

/** Months of slack added either side of a branch's span when testing whether a lane is free.
 *  Without it a branch could be assigned a lane whose previous occupant merged out on the very
 *  same row, and the two would visually collide at the hand-off. */
export const LANE_REUSE_SLACK_MONTHS = 4;

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
 *  for interactive hover state and stay out of this palette. Cycles if there are more branches.
 *  Note this is keyed on the branch's topological index, NOT its lane — lanes are reused by
 *  successive branches, so lane-keyed colors would make two unrelated branches share one. */
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

/** Conventional-commit type used for each node kind in the `git log --oneline` panel. */
export const COMMIT_VERB_BY_TYPE: Record<SwymbleCareerNodeType, string> = {
  education: 'feat',
  employment: 'feat',
  milestone: 'chore',
  project: 'feat',
  award: 'perf',
  future: 'wip',
};
