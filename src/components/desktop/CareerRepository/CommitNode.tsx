import { motion, useReducedMotion, type Variants } from 'framer-motion';
import type { CSSProperties } from 'react';
import type { SwymbleCareerNode } from '../../../data/types';
import { getNodeShape, NODE_RADIUS_BY_SHAPE } from './constants';

type CommitNodeProps = {
  node: SwymbleCareerNode;
  x: number;
  y: number;
  isActive: boolean;
  isDimmed: boolean;
  delay: number;
  color: string;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
};

const buildVariants = (delay: number): Variants => ({
  hidden: { opacity: 0, scale: 0.4 },
  shown: { opacity: 1, scale: 1, transition: { delay, duration: 0.45, ease: [0.16, 1, 0.3, 1] } },
  hover: { scale: 1.4, transition: { duration: 0.18, ease: 'easeOut' } },
});

export default function CommitNode({ node, x, y, isActive, isDimmed, delay, color, onHover, onSelect }: CommitNodeProps) {
  const prefersReducedMotion = useReducedMotion();
  const shape = getNodeShape(node);
  const radius = NODE_RADIUS_BY_SHAPE[shape];
  const hollow = node.isFuture;
  const variants = buildVariants(delay);
  const style = { '--branch-color': color } as CSSProperties;

  const shapeEl =
    shape === 'square' ? (
      <rect x={-radius} y={-radius} width={radius * 2} height={radius * 2} rx={2} />
    ) : (
      <rect x={-radius} y={-radius} width={radius * 2} height={radius * 2} rx={1} transform="rotate(45)" />
    );

  return (
    // Static positioning lives on this plain <g>: Framer Motion writes its own CSS `transform`
    // for the animated inner group, which would silently clobber an SVG `transform` attribute
    // placed on the same animated element.
    <g transform={`translate(${x}, ${y})`} style={style}>
      <motion.g
        className={`career-node career-node--${shape}${isDimmed ? ' career-node--dimmed' : ''}${isActive ? ' career-node--active' : ''}`}
        variants={prefersReducedMotion ? undefined : variants}
        initial={prefersReducedMotion ? undefined : 'hidden'}
        whileInView={prefersReducedMotion ? undefined : 'shown'}
        animate={prefersReducedMotion ? 'shown' : undefined}
        whileHover="hover"
        whileFocus="hover"
        viewport={{ once: true, margin: '-40px' }}
        onMouseEnter={() => onHover(node.id)}
        onMouseLeave={() => onHover(null)}
        onFocus={() => onHover(node.id)}
        onBlur={() => onHover(null)}
        onClick={(event) => {
          event.stopPropagation();
          onSelect(node.id);
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            event.stopPropagation();
            onSelect(node.id);
          }
        }}
        tabIndex={0}
        role="button"
        aria-label={`${node.title}${node.org ? `, ${node.org}` : ''}, ${node.date}`}
      >
        {/* Generous invisible hit area: the painted shape alone (~16-18px) is an easy target to
            lose track of while moving the mouse toward the card that just appeared. */}
        <circle className="career-node__hit-area" r={radius + 14} />
        <motion.g
          animate={
            node.isFuture && !prefersReducedMotion
              ? { opacity: [0.45, 0.85, 0.45], scale: [1, 1.12, 1] }
              : undefined
          }
          transition={
            node.isFuture && !prefersReducedMotion
              ? { repeat: Infinity, duration: 2.8, ease: 'easeInOut' }
              : undefined
          }
        >
          <circle className="career-node__halo" r={radius + 6} />
          <g className={`career-node__shape${hollow ? ' career-node__shape--hollow' : ''}`}>{shapeEl}</g>
        </motion.g>
        {node.tags?.map((tag, i) => (
          <g key={tag.label} className="career-node__tag" transform={`translate(${radius + 10}, ${-14 + i * 18})`}>
            <rect
              className="career-node__tag-pill"
              x={0}
              y={-8}
              rx={7}
              ry={7}
              width={tag.label.length * 5.6 + 16}
              height={16}
            />
            <text className="career-node__tag-text" x={8} y={3}>
              {tag.label}
            </text>
          </g>
        ))}
      </motion.g>
    </g>
  );
}
