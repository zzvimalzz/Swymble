import { motion, useMotionValue, useSpring } from 'framer-motion';
import type { MotionStyle } from 'framer-motion';
import { useEffect, useRef } from 'react';

// Structural shape needed by this card — both SwymbleWhatIDo and SwymbleService satisfy it,
// so either data source can be rendered through the same proximity-tilt card.
export type ProximityCardCopy = {
  title: string;
  colorHex: string;
  colorRgb: string;
  desc: string;
};

type ProximityCardProps = {
  service: ProximityCardCopy;
  index: number;
};

const MAX_DIST = 420;
const IDLE_MULTIPLIER = 0.18;

export default function ProximityCard({ service, index }: ProximityCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const isHoveredRef = useRef(false);
  const titleClassName = service.title.length > 14 ? 'service-card-title service-card-title-tight' : 'service-card-title';

  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const scale = useMotionValue(1);
  const springRotateX = useSpring(rotateX, { stiffness: 300, damping: 30 });
  const springRotateY = useSpring(rotateY, { stiffness: 300, damping: 30 });

  useEffect(() => {
    const updateFromPoint = (clientX: number, clientY: number) => {
      const card = cardRef.current;
      if (!card) {
        return;
      }

      const rect = card.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const dist = Math.hypot(clientX - centerX, clientY - centerY);

      const mouseX = clientX - rect.left;
      const mouseY = clientY - rect.top;

      const proximity = Math.max(0, 1 - dist / MAX_DIST);
      const powerProximity = Math.pow(proximity, 2);
      const activePower = isHoveredRef.current ? powerProximity : powerProximity * IDLE_MULTIPLIER;

      rotateX.set(activePower * ((mouseY - rect.height / 2) / 14));
      rotateY.set(activePower * -((mouseX - rect.width / 2) / 14));
      scale.set(1 + activePower * 0.03);

      card.style.setProperty('--mouse-x', `${mouseX}px`);
      card.style.setProperty('--mouse-y', `${mouseY}px`);
      card.style.setProperty('--prox', `${proximity}`);
      card.style.setProperty('--power', `${activePower}`);
    };

    let lastX = 0;
    let lastY = 0;

    const handlePointerMove = (event: PointerEvent) => {
      lastX = event.clientX;
      lastY = event.clientY;
      updateFromPoint(lastX, lastY);
    };

    const handleScroll = () => {
      updateFromPoint(lastX, lastY);
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [rotateX, rotateY, scale]);

  const handlePointerEnter = () => {
    isHoveredRef.current = true;
  };

  const handlePointerLeave = () => {
    isHoveredRef.current = false;
  };

  const cardStyle = {
    transformPerspective: 1000,
    rotateX: springRotateX,
    rotateY: springRotateY,
    scale,
    '--card-color': service.colorHex,
    '--card-color-rgb': service.colorRgb,
  } as MotionStyle;

  return (
    <motion.div
      ref={cardRef}
      className="service-card proxy-card"
      data-cursor="hover"
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ delay: index * 0.15, duration: 0.6, ease: 'easeOut' }}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      style={cardStyle}
    >
      <div className="card-glare" />
      <div className="card-inner-border" />
      <div className="card-content-inner">
        <h3 className={titleClassName}>{service.title}</h3>
        <p className="service-desc">{service.desc}</p>
      </div>
    </motion.div>
  );
}
