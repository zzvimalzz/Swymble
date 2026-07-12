import { motion, useReducedMotion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import SmartImage from '../../../components/SmartImage';
import SystemWindow from '../../../components/system/SystemWindow';
import { EASE, MOTION } from '../../../components/motion/motionTokens';
import { staggerDelay } from '../../../components/motion/motionTokens';
import { SHIPPED_LIVE_COUNT, SHIPPED_WORKSPACE } from '../../../data/shipped';
import type { SwymbleShippedItem } from '../../../data/shipped';

/**
 * Chapter 03 — the shipped workspace. Client work and lab products on one proof
 * surface: real products in SystemWindow chrome. Windows enter slightly fanned
 * (rotated/offset) and settle into the grid — the workspace being arranged for
 * you — then hold still so it scans like a grid and behaves like apps.
 * Restricted work (CORTEX, Territory) renders redacted: secrecy as theatre,
 * not absence.
 */

function windowEntrance(index: number, reduced: boolean) {
  if (reduced) {
    return {
      initial: { opacity: 0 },
      whileInView: { opacity: 1 },
    };
  }

  const fanRotation = index % 2 === 0 ? -2 : 2;
  return {
    initial: { opacity: 0, y: 32, rotate: fanRotation },
    whileInView: { opacity: 1, y: 0, rotate: 0 },
  };
}

function WorkspaceWindow({ item, index }: { item: SwymbleShippedItem; index: number }) {
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();
  const entrance = windowEntrance(index, prefersReducedMotion ?? false);

  const open = () => {
    if (item.href.external) {
      window.open(item.href.url, '_blank', 'noopener,noreferrer');
      return;
    }
    navigate(item.href.url);
  };

  const meta = item.client ?? (item.updatedAt ? `UPD ${item.updatedAt.toUpperCase()}` : undefined);

  return (
    <motion.button
      type="button"
      className={`workspace-window ${item.featured ? 'workspace-window--featured' : ''}`.trim()}
      data-cursor="hover"
      onClick={open}
      aria-label={`Open ${item.title}${item.href.external ? ' (opens in new tab)' : ''}`}
      {...entrance}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ delay: staggerDelay(index), duration: MOTION.scene, ease: EASE.outExpo }}
    >
      <SystemWindow
        title={item.title}
        status={item.status}
        category={item.category}
        categoryColor={item.categoryColor}
        meta={meta}
        redacted={item.restricted}
        size={item.featured ? 'featured' : 'standard'}
      >
        <SmartImage src={item.poster ?? item.image} alt="" className="workspace-window-image" draggable="false" />
      </SystemWindow>
    </motion.button>
  );
}

export default function Chapter03ShippedWorkspace() {
  return (
    <section className="workspace-section" aria-label="Shipped work">
      <div className="section-header">
        <h2>SHIPPED</h2>
        <span className="workspace-readout">~/workspace · {SHIPPED_LIVE_COUNT} running</span>
      </div>

      <div className="workspace-grid">
        {SHIPPED_WORKSPACE.map((item, index) => (
          <WorkspaceWindow key={item.id} item={item} index={index} />
        ))}
      </div>
    </section>
  );
}
