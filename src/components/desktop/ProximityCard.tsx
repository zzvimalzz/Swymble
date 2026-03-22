import { motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import type { SwymbleWhatIDo } from '../../data/config';

type ProximityCardProps = {
  service: SwymbleWhatIDo;
  index: number;
  mousePos: { x: number; y: number };
};

type MouseMetric = {
  x: number;
  y: number;
  dist: number;
};

export default function ProximityCard({ service, index, mousePos }: ProximityCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [metric, setMetric] = useState<MouseMetric>({ x: 0, y: 0, dist: 1000 });
  const [isHovered, setIsHovered] = useState(false);
  const titleClassName = service.title.length > 14 ? 'service-card-title service-card-title-tight' : 'service-card-title';

  useEffect(() => {
    const updateMetric = () => {
      if (!cardRef.current) {
        return;
      }

      const rect = cardRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const dist = Math.hypot(mousePos.x - centerX, mousePos.y - centerY);

      setMetric({
        x: mousePos.x - rect.left,
        y: mousePos.y - rect.top,
        dist,
      });
    };

    updateMetric();
    window.addEventListener('scroll', updateMetric, { passive: true });
    return () => window.removeEventListener('scroll', updateMetric);
  }, [mousePos]);

  const maxDist = 420;
  const proximity = Math.max(0, 1 - metric.dist / maxDist);
  const powerProximity = Math.pow(proximity, 2);
  const activePower = isHovered ? powerProximity : powerProximity * 0.18;

  const cardHeight = cardRef.current?.offsetHeight ?? 0;
  const cardWidth = cardRef.current?.offsetWidth ?? 0;

  const rotateX = activePower * ((metric.y - cardHeight / 2) / 14);
  const rotateY = activePower * -((metric.x - cardWidth / 2) / 14);

  const cardStyle = {
    transformPerspective: 1000,
    rotateX,
    rotateY,
    scale: 1 + activePower * 0.03,
    '--mouse-x': `${metric.x}px`,
    '--mouse-y': `${metric.y}px`,
    '--prox': proximity,
    '--power': activePower,
    '--card-color': service.colorHex,
    '--card-color-rgb': service.colorRgb,
  } as CSSProperties;

  return (
    <motion.div
      ref={cardRef}
      className="service-card proxy-card"
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ delay: index * 0.15, duration: 0.6, ease: 'easeOut' }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
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
