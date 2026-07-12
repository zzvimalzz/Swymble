import { animate, useInView, useReducedMotion } from 'framer-motion';
import { useEffect, useRef } from 'react';
import { EASE, MOTION } from './motionTokens';

/**
 * ScrollCounter — a numeral that counts 0→value once, when it first enters the
 * viewport. The true final value is always present for assistive tech (and for
 * the prerender snapshot) via aria-label; the animation is a visual layer only.
 * Reduced motion renders the final value immediately.
 */

type ScrollCounterProps = {
  value: number;
  suffix?: string;
  className?: string;
};

export default function ScrollCounter({ value, suffix = '', className }: ScrollCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    const node = ref.current;
    if (!inView || prefersReducedMotion || !node) {
      return;
    }

    const controls = animate(0, value, {
      duration: MOTION.hero,
      ease: EASE.outExpo,
      onUpdate: (latest) => {
        node.textContent = `${Math.round(latest)}${suffix}`;
      },
    });

    return () => controls.stop();
  }, [inView, prefersReducedMotion, value, suffix]);

  // The true value is server/snapshot-visible from the start; the count-up only
  // rewrites textContent while it plays, so crawlers and reduced-motion users
  // always see the real number.
  return (
    <span className={className} aria-label={`${value}${suffix}`}>
      <span ref={ref} aria-hidden="true">{`${value}${suffix}`}</span>
    </span>
  );
}
