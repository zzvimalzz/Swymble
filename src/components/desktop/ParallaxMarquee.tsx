import { motion, useAnimationFrame, useMotionValue, useTransform, wrap } from 'framer-motion';
import { useEffect } from 'react';

type ParallaxMarqueeProps = {
  text: string;
  setIsHovering: (value: boolean) => void;
};

export default function ParallaxMarquee({ text, setIsHovering }: ParallaxMarqueeProps) {
  const baseX = useMotionValue(0);
  const mouseVelocity = useMotionValue(0);

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
    const moveBy = mouseVelocity.get() * 0.02 * (delta / 16);
    baseX.set(baseX.get() + moveBy);
  });

  const x = useTransform(baseX, (value) => `${wrap(-25, -50, value)}%`);

  return (
    <div
      className="marquee-container"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <motion.div className="marquee-content" style={{ x }}>
        {Array.from({ length: 8 }).map((_, index) => (
          <span key={index}>{text}</span>
        ))}
      </motion.div>
    </div>
  );
}
