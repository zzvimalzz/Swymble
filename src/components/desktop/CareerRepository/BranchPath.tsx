import { motion, useReducedMotion } from 'framer-motion';
import { useState, type CSSProperties } from 'react';
import type { SwymbleCareerBranch } from '../../../data/types';

type BranchPathProps = {
  branch: SwymbleCareerBranch;
  d: string;
  pathId: string;
  isDimmed: boolean;
  color: string;
};

export default function BranchPath({ branch, d, pathId, isDimmed, color }: BranchPathProps) {
  const prefersReducedMotion = useReducedMotion();
  const [drawn, setDrawn] = useState(prefersReducedMotion ?? false);
  const style = { '--branch-color': color } as CSSProperties;

  return (
    <g
      className={`career-branch career-branch--${branch.category}${isDimmed ? ' career-branch--dimmed' : ''}`}
      style={style}
    >
      <motion.path
        id={pathId}
        className="career-branch-path__draw"
        d={d}
        fill="none"
        initial={prefersReducedMotion ? false : { pathLength: 0 }}
        whileInView={{ pathLength: 1 }}
        viewport={{ once: true, amount: 0, margin: '0px 0px -30% 0px' }}
        transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
        onAnimationComplete={() => setDrawn(true)}
      />
      {drawn && !prefersReducedMotion && (
        <motion.path
          className="career-branch-path__pulse"
          d={d}
          fill="none"
          animate={{ opacity: [0.15, 0.4, 0.15] }}
          transition={{ repeat: Infinity, duration: 3.4, ease: 'easeInOut' }}
        />
      )}
    </g>
  );
}
