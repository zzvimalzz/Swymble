import { motion, MotionValue } from 'framer-motion';
import StatusLine from '../../../components/system/StatusLine';
import { MOTION, EASE } from '../../../components/motion/motionTokens';
import { SWYMBLE_DATA } from '../../../data/config';

/**
 * Chapter 01 — the hero console. The wordmark keeps its glitch identity; the
 * decorative background logo image is gone (the wave returns as a living canvas
 * in a later pass). New: an honest StatusLine (place · MYT clock · build ·
 * availability) grounding the OS frame, and a mono scroll cue.
 */

type Chapter01HeroConsoleProps = {
  heroY: MotionValue<number>;
  heroOpacity: MotionValue<number>;
};

export default function Chapter01HeroConsole({ heroY, heroOpacity }: Chapter01HeroConsoleProps) {
  return (
    <motion.section className="hero-section" style={{ y: heroY, opacity: heroOpacity }}>
      <h1
        className="hero-title glitch-mega"
        data-text={SWYMBLE_DATA.name}
        data-cursor="hover"
      >
        {SWYMBLE_DATA.name}
      </h1>

      <motion.p
        className="hero-tagline"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: MOTION.hero, ease: EASE.outExpo }}
      >
        {SWYMBLE_DATA.tagline}
      </motion.p>

      <motion.div
        className="hero-status-row"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9, duration: MOTION.scene }}
      >
        <StatusLine variant="hero" />
        <span className="hero-scroll-cue" aria-hidden="true">
          SCROLL <span className="hero-scroll-cue-arrow">▾</span>
        </span>
      </motion.div>
    </motion.section>
  );
}
