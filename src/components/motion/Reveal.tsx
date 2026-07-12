import { motion } from 'framer-motion';
import type { CSSProperties, ReactNode } from 'react';

/** Index-based stagger delay (seconds) shared by list-style Reveal usages. */
export const REVEAL_STAGGER = 0.12;

type RevealAs = 'div' | 'section' | 'article' | 'li';

type RevealProps = {
  children: ReactNode;
  delay?: number;
  y?: number;
  /** Optional horizontal entrance offset (px) for diagonal reveals; 0 keeps the classic rise. */
  x?: number;
  once?: boolean;
  margin?: string;
  className?: string;
  as?: RevealAs;
  style?: CSSProperties;
  /** Forwarded to the DOM node — needed for anchor-scroll targets on some call sites. */
  id?: string;
};

const REVEAL_EASE = [0.2, 0.8, 0.2, 1] as const;

const REVEAL_COMPONENTS = {
  div: motion.div,
  section: motion.section,
  article: motion.article,
  li: motion.li,
} as const;

export default function Reveal({
  children,
  delay = 0,
  y = 32,
  x = 0,
  once = true,
  margin = '-60px',
  className,
  as = 'div',
  style,
  id,
}: RevealProps) {
  const MotionComponent = REVEAL_COMPONENTS[as];

  return (
    <MotionComponent
      id={id}
      className={className}
      style={style}
      initial={{ opacity: 0, y, x }}
      whileInView={{ opacity: 1, y: 0, x: 0 }}
      viewport={{ once, margin }}
      transition={{ delay, duration: 0.6, ease: REVEAL_EASE }}
    >
      {children}
    </MotionComponent>
  );
}
