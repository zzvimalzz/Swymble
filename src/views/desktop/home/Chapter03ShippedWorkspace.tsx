import { motion, useReducedMotion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import SmartImage from '../../../components/SmartImage';
import SystemWindow from '../../../components/system/SystemWindow';
import { EASE, MOTION, staggerDelay } from '../../../components/motion/motionTokens';
import { SHIPPED_LIVE_COUNT, SWYMBLE_SHIPPED } from '../../../data/shipped';
import type { SwymbleShippedItem } from '../../../data/shipped';

/**
 * Chapter 03 — NOW RUNNING. Three live products in window chrome — one glance
 * of evidence, not a catalogue. The full project/lab catalogues live on their
 * own pages; the journey row below is the door. (The six-window workspace was
 * cut in the Phase-6 pacing review: the homepage carries identity and story,
 * the catalogue carries depth.)
 */

const STRIP_SIZE = 3;

const stripItems = SWYMBLE_SHIPPED
  .filter((item) => item.status === 'Live' && !item.restricted && item.kind !== 'client')
  .slice(0, STRIP_SIZE);

function StripWindow({ item, index }: { item: SwymbleShippedItem; index: number }) {
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();

  const open = () => {
    if (item.href.external) {
      window.open(item.href.url, '_blank', 'noopener,noreferrer');
      return;
    }
    navigate(item.href.url);
  };

  return (
    <motion.button
      type="button"
      className="workspace-window"
      data-cursor="hover"
      onClick={open}
      aria-label={`Open ${item.title}${item.href.external ? ' (opens in new tab)' : ''}`}
      initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 28 }}
      whileInView={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ delay: staggerDelay(index), duration: MOTION.scene, ease: EASE.outExpo }}
    >
      <SystemWindow
        title={item.title}
        status={item.status}
        category={item.category}
        categoryColor={item.categoryColor}
        meta={item.updatedAt ? `UPD ${item.updatedAt.toUpperCase()}` : undefined}
      >
        <SmartImage src={item.poster ?? item.image} alt="" className="workspace-window-image" draggable="false" />
      </SystemWindow>
    </motion.button>
  );
}

export default function Chapter03ShippedWorkspace() {
  return (
    <section className="workspace-section" aria-label="Live products">
      <div className="section-header">
        <h2>NOW RUNNING</h2>
        <span className="workspace-readout">{SHIPPED_LIVE_COUNT} live products</span>
      </div>

      <div className="workspace-grid">
        {stripItems.map((item, index) => (
          <StripWindow key={item.id} item={item} index={index} />
        ))}
      </div>

      <div className="workspace-journeys">
        <Link to="/projects" className="workspace-journey" data-cursor="hover">
          <span aria-hidden="true">›</span> CLIENT WORK
        </Link>
        <Link to="/labs" className="workspace-journey" data-cursor="hover">
          <span aria-hidden="true">›</span> ENTER THE LAB
        </Link>
      </div>
    </section>
  );
}
