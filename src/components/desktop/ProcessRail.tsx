import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import type { SwymbleProcessStep } from '../../data/config';

// Scroll-triggered entrance for the "WORK WITH ME" process steps. The rail is the
// scroll trigger and orchestrates its children, so the four steps always play as one
// staggered sequence (instead of each step firing off its own viewport margin, which
// made them pop in near-simultaneously). Each step rises along a diagonal with a
// slight scale/blur settle for depth; transforms and filter are compositor-friendly,
// and MotionConfig reducedMotion="user" (set in App.tsx) reduces this to a plain
// fade for users who prefer reduced motion.
const railVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.14, delayChildren: 0.1 },
  },
};

const stepVariants: Variants = {
  hidden: { opacity: 0, x: -32, y: 48, scale: 0.96, filter: 'blur(5px)' },
  visible: {
    opacity: 1,
    x: 0,
    y: 0,
    scale: 1,
    filter: 'blur(0px)',
    transition: { duration: 0.75, ease: [0.16, 1, 0.3, 1] },
  },
};

type ProcessRailProps = {
  process: SwymbleProcessStep[];
};

export default function ProcessRail({ process }: ProcessRailProps) {
  return (
    <motion.div
      className="process-rail"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-120px' }}
      variants={railVariants}
    >
      {process.map((step) => (
        <motion.div key={step.id} className="process-step" variants={stepVariants}>
          <span className="process-step-number">{step.step}</span>
          <h3 className="process-step-title">{step.title}</h3>
          <p className="process-step-desc">{step.desc}</p>
        </motion.div>
      ))}
    </motion.div>
  );
}
