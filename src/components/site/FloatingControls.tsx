import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, Rocket } from 'lucide-react';

type FloatingControlsProps = {
  showBack: boolean;
  onBack: () => void;
  showRocket: boolean;
  onRocket: () => void;
};

/**
 * Back and scroll-to-top, stacked above the nav trigger in the bottom-right corner.
 *
 * Positions come from CSS custom properties rather than the measured layout the old mobile-only
 * version computed on every scroll and resize: the trigger is a fixed size at a fixed offset, so
 * the stack can be laid out with plain `calc` and costs nothing to keep in place.
 */
export default function FloatingControls({ showBack, onBack, showRocket, onRocket }: FloatingControlsProps) {
  return (
    <div className="floating-controls" data-has-back={showBack || undefined}>
      <AnimatePresence>
        {showRocket && (
          <motion.button
            key="rocket"
            type="button"
            className="floating-controls__btn floating-controls__btn--rocket"
            initial={{ opacity: 0, y: 12, scale: 0.85 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.85 }}
            transition={{ duration: 0.24 }}
            onClick={onRocket}
            aria-label="Scroll to top"
          >
            <Rocket size={22} style={{ transform: 'rotate(-45deg)' }} />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showBack && (
          <motion.button
            key="back"
            type="button"
            className="floating-controls__btn floating-controls__btn--back"
            initial={{ opacity: 0, y: 12, scale: 0.85 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.85 }}
            transition={{ duration: 0.24 }}
            onClick={onBack}
            aria-label="Go back"
          >
            <ChevronLeft size={22} />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
