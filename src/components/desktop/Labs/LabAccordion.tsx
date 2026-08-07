import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import SmartImage from '../../SmartImage';
import { LabActions, STATUS_MODIFIER } from './labPresentation';
import { getCategoryAccentStyle } from '../../../utils/categoryAccent';
import type { SwymbleLab } from '../../../data/types';

type LabAccordionProps = {
  labs: SwymbleLab[];
  /** Null when everything is collapsed. Owned by the page so only one can ever be open. */
  openId: string | null;
  onToggle: (id: string) => void;
};

/**
 * The phone rendering of the labs list. The desktop card puts a 16:9 image, a summary, three
 * highlights, tags and a button row on screen at once — stacked one-up on a phone that is five
 * or six screenfuls to get past six labs, and there is no way to see what else exists without
 * scrolling through all of it. Collapsed to a logo and a title, the whole list fits on one
 * screen and the detail is one tap away.
 */
export default function LabAccordion({ labs, openId, onToggle }: LabAccordionProps) {
  return (
    <div className="labs-accordion">
      {labs.map((lab, index) => {
        const isOpen = openId === lab.id;
        const panelId = `lab-panel-${lab.id}`;

        return (
          <motion.div
            key={lab.id}
            className={`lab-row${isOpen ? ' lab-row--open' : ''}`}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ delay: Math.min(index, 5) * 0.06, duration: 0.45 }}
          >
            <button
              type="button"
              className="lab-row__header"
              onClick={() => onToggle(lab.id)}
              aria-expanded={isOpen}
              aria-controls={panelId}
            >
              <span className="lab-row__thumb">
                <SmartImage src={lab.image} alt="" aria-hidden="true" />
              </span>

              <span className="lab-row__identity">
                <span className="lab-row__title">{lab.title}</span>
                <span
                  className="lab-row__category category-accent-text"
                  style={getCategoryAccentStyle(lab.category, lab.categoryColor)}
                >
                  {lab.category}
                </span>
                <span
                  className={`lab-status-badge lab-status-badge--${STATUS_MODIFIER[lab.status]} lab-row__status`}
                >
                  {lab.status.toUpperCase()}
                </span>
              </span>

              <motion.span
                className="lab-row__chevron"
                aria-hidden="true"
                animate={{ rotate: isOpen ? 180 : 0 }}
                transition={{ duration: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
              >
                <ChevronDown size={20} />
              </motion.span>
            </button>

            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  id={panelId}
                  className="lab-row__panel"
                  role="region"
                  key="panel"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{
                    height: { duration: 0.34, ease: [0.2, 0.8, 0.2, 1] },
                    // Fades faster than it opens and later than it closes, so the text never
                    // shows itself against a panel that has not finished making room for it.
                    opacity: { duration: 0.22, ease: 'easeOut' },
                  }}
                >
                  <div className="lab-row__panel-inner">
                    <span className={`lab-visibility-badge visibility-${lab.visibility}`}>
                      {lab.visibility.toUpperCase()}
                    </span>

                    <p className="lab-desc">{lab.publicSummary}</p>

                    <ul className="lab-highlights">
                      {lab.safeHighlights.map((highlight) => (
                        <li key={`${lab.id}-${highlight}`} className="lab-highlight-item">
                          {highlight}
                        </li>
                      ))}
                    </ul>

                    <div className="lab-tags">
                      {lab.tags.map((tag) => (
                        <span key={`${lab.id}-${tag}`} className="lab-tag">
                          #{tag}
                        </span>
                      ))}
                    </div>

                    <div className="lab-updated">UPDATED {lab.updatedAt.toUpperCase()}</div>

                    <LabActions lab={lab} showDetailLink />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
}
