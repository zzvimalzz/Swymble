import { motion, useReducedMotion, useTransform, type MotionValue } from 'framer-motion';
import type { CSSProperties } from 'react';
import type { SwymbleCareerBranch } from '../../../data/types';

type BranchPathProps = {
  branch: SwymbleCareerBranch;
  d: string;
  pathId: string;
  isDimmed: boolean;
  color: string;
  /** Shared across every branch (one scroll subscription for the whole graph); each branch just
   *  maps its own slice of it to a 0-1 draw progress. */
  scrollYProgress: MotionValue<number>;
  /** This branch's own vertical extent, as a fraction of the graph's total height. */
  startFraction: number;
  endFraction: number;
};

export default function BranchPath({
  branch,
  d,
  pathId,
  isDimmed,
  color,
  scrollYProgress,
  startFraction,
  endFraction,
}: BranchPathProps) {
  const prefersReducedMotion = useReducedMotion();
  const pathLength = useTransform(scrollYProgress, [startFraction, endFraction], [0, 1], { clamp: true });
  const style = { '--branch-color': color } as CSSProperties;

  return (
    <g className={`career-branch career-branch--${branch.category}${isDimmed ? ' career-branch--dimmed' : ''}`} style={style}>
      <motion.path
        id={pathId}
        className="career-branch-path__draw"
        d={d}
        fill="none"
        style={prefersReducedMotion ? undefined : { pathLength }}
        pathLength={prefersReducedMotion ? 1 : undefined}
      />
      {/* Same scroll-linked pathLength, so the pulse only glows the portion already drawn; a
          plain CSS keyframe handles the breathing opacity, no extra JS animation loop needed. */}
      <motion.path
        className="career-branch-path__pulse"
        d={d}
        fill="none"
        style={prefersReducedMotion ? { display: 'none' } : { pathLength }}
      />
    </g>
  );
}
