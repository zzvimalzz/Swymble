import { motion, useAnimationFrame, useMotionValue, useReducedMotion, useTransform, wrap } from 'framer-motion';
import { useEffect } from 'react';

type ParallaxMarqueeProps = {
  text: string;
};

// Constant autonomous crawl speed, independent of scrolling — the marquee
// should always drift at the same steady pace whether or not the page is
// being scrolled. Mouse position still adds a small nudge on top (speeds up,
// slows down, or reverses depending on which half of the screen the cursor
// is on) purely as a hover-interaction flourish.
//
// Pacing: one full copy of the marquee text crosses in ~6.5s at the base
// speed — slow enough to actually read, fast enough that the band never
// feels static. The mouse nudge tops out well below the base speed so it
// can't flip the crawl into a fast scrub.
const BASE_MARQUEE_SPEED = 0.03;
const MOUSE_DRIFT_FACTOR = 0.012;

export default function ParallaxMarquee({ text }: ParallaxMarqueeProps) {
  const baseX = useMotionValue(0);
  const mouseVelocity = useMotionValue(0);
  // MotionConfig's reducedMotion only covers declarative animations, not this
  // useAnimationFrame loop — honor the preference here and hold the band still.
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      const screenCenterX = window.innerWidth / 2;
      const positionPct = (event.clientX - screenCenterX) / screenCenterX;
      mouseVelocity.set(positionPct);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseVelocity]);

  useAnimationFrame((_, delta) => {
    if (prefersReducedMotion) {
      return;
    }

    const moveBy = (BASE_MARQUEE_SPEED + mouseVelocity.get() * MOUSE_DRIFT_FACTOR) * (delta / 16);
    baseX.set(baseX.get() + moveBy);
  });

  const x = useTransform(baseX, (value) => `${wrap(-25, -50, value)}%`);

  return (
    <div className="marquee-container" data-cursor="hover">
      <motion.div className="marquee-content" style={{ x }} aria-hidden="true">
        {Array.from({ length: 8 }).map((_, index) => (
          <span key={index}>{text}</span>
        ))}
      </motion.div>
    </div>
  );
}
