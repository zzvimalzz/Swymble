import { motion } from 'framer-motion';
import type { CSSProperties } from 'react';
import type { SwymbleCareerNode } from '../../../data/types';

type CommitCardProps = {
  node: SwymbleCareerNode;
  x: number;
  y: number;
  color: string;
  /** Render below the node instead of above, used for the topmost lane, where there's no room
   *  above the graph's scroll container for the card to sit without being clipped. */
  flip?: boolean;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
};

const formatDate = (node: SwymbleCareerNode): string =>
  node.endDate ? `${node.date} to ${node.endDate}` : node.date;

export default function CommitCard({ node, x, y, color, flip = false, onMouseEnter, onMouseLeave }: CommitCardProps) {
  const description = Array.isArray(node.description) ? node.description : node.description ? [node.description] : [];
  const style = { left: x, top: y, '--branch-color': color } as CSSProperties;

  return (
    <motion.div
      className={`career-commit-card${flip ? ' career-commit-card--below' : ''}`}
      style={style}
      initial={{ opacity: 0, y: 8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.97 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      role="dialog"
      aria-label={node.title}
    >
      {node.image && <img className="career-commit-card__image" src={node.image} alt="" />}
      <div className="career-commit-card__date">{formatDate(node)}</div>
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
    </motion.div>
  );
}
