import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import type { CSSProperties } from 'react';
import { X } from 'lucide-react';
import type { SwymbleCareerNode } from '../../../data/types';
import { formatDateRange } from './commitMessage';

/** How long after opening to ignore a dismissal, to swallow the browser's post-tap ghost click. */
const GHOST_CLICK_MS = 350;

type CommitCardProps = {
  node: SwymbleCareerNode;
  x: number;
  y: number;
  color: string;
  /** Which side of the node the card hangs off. It is never centred on the node: a card sitting
   *  under the pointer steals the hover it was opened by, and the resulting
   *  enter/leave/enter loop is what made it flicker and re-run its entrance animation. */
  side: 'left' | 'right';
  /** Narrow screens get a real modal instead, since there is no room beside a node for a card. */
  asModal?: boolean;
  onClose?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
};

export default function CommitCard({
  node,
  x,
  y,
  color,
  side,
  asModal = false,
  onClose,
  onMouseEnter,
  onMouseLeave,
}: CommitCardProps) {
  const description = Array.isArray(node.description) ? node.description : node.description ? [node.description] : [];

  // After a tap the browser synthesises a click at the original coordinates, and it arrives once
  // this modal is already up. If those coordinates fall outside the centred panel it lands on the
  // backdrop and dismisses the modal instantly — which is why tapping a node near the top or
  // bottom of the screen appeared to do nothing, while the same node in the middle (where the
  // ghost click hits the panel) worked. Dismissal is ignored until that ghost has passed.
  const openedAt = useRef(0);
  useEffect(() => {
    openedAt.current = Date.now();
  }, [node.id]);

  const dismiss = () => {
    if (Date.now() - openedAt.current < GHOST_CLICK_MS) return;
    onClose?.();
  };

  // Escape to close, and the page behind the modal must not scroll while it is open.
  useEffect(() => {
    if (!asModal) return;

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose?.();
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKey);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKey);
    };
  }, [asModal, onClose]);

  const body = (
    <>
      {node.image && <img className="career-commit-card__image" src={node.image} alt="" />}
      <div className="career-commit-card__date">{formatDateRange(node)}</div>
      <h3 className="career-commit-card__title">{node.title}</h3>
      {node.org && <div className="career-commit-card__org">{node.org}</div>}
      {node.results && <div className="career-commit-card__results">{node.results}</div>}
      {description.length === 1 ? (
        <p className="career-commit-card__description">{description[0]}</p>
      ) : description.length > 1 ? (
        <ul className="career-commit-card__description-list">
          {description.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      ) : null}
      {node.tech && node.tech.length > 0 && (
        <div className="career-commit-card__tech">
          {node.tech.map((tech) => (
            <span key={tech} className="career-commit-card__tech-chip">
              {tech}
            </span>
          ))}
        </div>
      )}
      {node.links && node.links.length > 0 && (
        <div className="career-commit-card__links">
          {node.links.map((link) => (
            <a
              key={link.href}
              className="career-commit-card__link"
              href={link.href}
              target={link.href.startsWith('http') ? '_blank' : undefined}
              rel={link.href.startsWith('http') ? 'noreferrer' : undefined}
            >
              {link.label} →
            </a>
          ))}
        </div>
      )}
    </>
  );

  if (asModal) {
    // Portalled to <body> so no transformed or clipping ancestor in the graph can affect a
    // fixed-position overlay, and so it can sit above the floating controls.
    return createPortal(
      <motion.div
        className="commit-modal"
        style={{ '--branch-color': color } as CSSProperties}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
        role="dialog"
        aria-modal="true"
        aria-label={node.title}
      >
        <button
          type="button"
          className="commit-modal__backdrop"
          aria-label="Close"
          onClick={(event) => {
            event.stopPropagation();
            dismiss();
          }}
        />

        <motion.div
          className="commit-modal__dialog"
          initial={{ opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          onClick={(event) => event.stopPropagation()}
        >
          {/* Sits above the panel rather than inside it, so it never crowds the first line of
              content or has to be scrolled around. */}
          <button
            type="button"
            className="commit-modal__close"
            aria-label="Close"
            onClick={(event) => {
              event.stopPropagation();
              dismiss();
            }}
          >
            <X size={18} />
          </button>

          <div className="commit-modal__panel">
            <div className="commit-modal__scroll career-commit-card">{body}</div>
          </div>
        </motion.div>
      </motion.div>,
      document.body,
    );
  }

  return (
    // Two elements on purpose. The anchor owns the CSS `transform` that positions the card
    // relative to its node; the motion element inside owns the entrance. Framer Motion writes its
    // own inline `transform`, so animating this element directly would silently clobber the
    // positioning transform.
    <div className={`career-commit-anchor career-commit-anchor--${side}`} style={{ left: x, top: y } as CSSProperties}>
      <motion.div
        className="career-commit-card"
        style={{ '--branch-color': color } as CSSProperties}
        initial={{ opacity: 0, x: side === 'right' ? -6 : 6 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-label={node.title}
      >
        {body}
      </motion.div>
    </div>
  );
}
