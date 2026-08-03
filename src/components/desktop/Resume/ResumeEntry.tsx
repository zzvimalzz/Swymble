import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import usePointerGlare from '../../../hooks/usePointerGlare';
import type { ResumeEntry as ResumeEntryData } from '../../../utils/resumeModel';

type ResumeEntryProps = {
  entry: ResumeEntryData;
  index: number;
  /** Compact entries drop the tech chips — used for education and the project strip. */
  variant?: 'full' | 'compact';
};

const isInternal = (href: string) => href.startsWith('/');

/**
 * One role, degree or project. The card lights up as the pointer approaches (see
 * usePointerGlare) and rises in on scroll — the same reactive language as the rest of the site,
 * kept to a single subtle gesture per card so a page an employer is skimming stays readable.
 */
export default function ResumeEntry({ entry, index, variant = 'full' }: ResumeEntryProps) {
  const glareRef = usePointerGlare<HTMLDivElement>();
  const { node, dateRange, bullets, tech } = entry;

  return (
    <motion.article
      className={`resume-entry resume-entry--${variant}`}
      initial={{ opacity: 0, y: 26 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-70px' }}
      transition={{ delay: Math.min(index, 5) * 0.07, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="resume-entry__surface" ref={glareRef} data-cursor="hover">
        <span className="resume-entry__glare" aria-hidden="true" />
        <span className="resume-entry__marker" aria-hidden="true" />

        <div className="resume-entry__meta">
          <span className="resume-entry__date">{dateRange}</span>
          {node.isFuture && <span className="resume-entry__tag">Incoming</span>}
        </div>

        <div className="resume-entry__body">
          <h3 className="resume-entry__title">{node.title}</h3>
          {node.org && <p className="resume-entry__org">{node.org}</p>}
          {node.results && <p className="resume-entry__results">{node.results}</p>}

          {bullets.length > 0 && (
            <ul className="resume-entry__bullets">
              {bullets.map((bullet) => (
                <li key={bullet}>{bullet}</li>
              ))}
            </ul>
          )}

          {variant === 'full' && tech.length > 0 && (
            <ul className="resume-entry__tech" aria-label="Technologies">
              {tech.map((item) => (
                <li key={item} className="resume-entry__chip">
                  {item}
                </li>
              ))}
            </ul>
          )}

          {node.links && node.links.length > 0 && (
            <div className="resume-entry__links">
              {node.links.map((link) =>
                isInternal(link.href) ? (
                  <Link key={link.href} className="resume-entry__link" to={link.href}>
                    {link.label}
                    <ArrowUpRight size={14} aria-hidden="true" />
                  </Link>
                ) : (
                  <a
                    key={link.href}
                    className="resume-entry__link"
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {link.label}
                    <ArrowUpRight size={14} aria-hidden="true" />
                  </a>
                ),
              )}
            </div>
          )}
        </div>
      </div>
    </motion.article>
  );
}
