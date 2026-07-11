import { motion, useAnimationFrame, useMotionValue, useScroll, useTransform, useVelocity, wrap } from 'framer-motion';
import { useEffect, useRef } from 'react';

type ParallaxMarqueeProps = {
  text: string;
};

// Scroll velocity (px/s) mapped to extra marquee displacement, clamped so a
// fast flick never overpowers the drift. Eased toward its target each frame
// so the drag settles smoothly instead of snapping when scrolling stops.
// Tuned to be a subtle nudge, not a sprint: a large divisor keeps the target
// small even for a fast fling, a tight clamp caps how far it can ever push,
// and a low ease constant makes it glide toward that target and settle
// gently rather than snapping.
const SCROLL_VELOCITY_DIVISOR = 4000;
const SCROLL_DRAG_CLAMP = 0.8;
const SCROLL_DRAG_EASE = 0.05;

export default function ParallaxMarquee({ text }: ParallaxMarqueeProps) {
  const baseX = useMotionValue(0);
  const mouseVelocity = useMotionValue(0);
  const { scrollY } = useScroll();
  const scrollVelocity = useVelocity(scrollY);
  const scrollDrag = useRef(0);

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
    const scrollTarget = Math.max(
      -SCROLL_DRAG_CLAMP,
      Math.min(SCROLL_DRAG_CLAMP, scrollVelocity.get() / SCROLL_VELOCITY_DIVISOR),
    );
    scrollDrag.current += (scrollTarget - scrollDrag.current) * SCROLL_DRAG_EASE;

    const moveBy = (mouseVelocity.get() * 0.02 + scrollDrag.current) * (delta / 16);
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
