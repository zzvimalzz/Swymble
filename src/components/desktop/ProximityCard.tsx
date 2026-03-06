import { motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import type { SwymbleService } from '../../data/config';

type ProximityCardProps = {
  service: SwymbleService;
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

  const maxDist = 600;
  const proximity = Math.max(0, 1 - metric.dist / maxDist);
  const powerProximity = Math.pow(proximity, 2);

  const cardHeight = cardRef.current?.offsetHeight ?? 0;
  const cardWidth = cardRef.current?.offsetWidth ?? 0;

  const rotateX = powerProximity * ((metric.y - cardHeight / 2) / 10);
  const rotateY = powerProximity * -((metric.x - cardWidth / 2) / 10);

  const cardStyle = {
    transformPerspective: 1000,
    rotateX,
    rotateY,
    scale: 1 + powerProximity * 0.05,
    '--mouse-x': `${metric.x}px`,
    '--mouse-y': `${metric.y}px`,
    '--prox': proximity,
    '--power': powerProximity,
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
      style={cardStyle}
    >
      <div className="card-glare" />
      <div className="card-inner-border" />
      <div className="card-content-inner">
        <h3>{service.title}</h3>
        <p className="service-desc">{service.desc}</p>
      </div>
    </motion.div>
  );
}
