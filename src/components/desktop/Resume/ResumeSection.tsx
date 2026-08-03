import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

type ResumeSectionProps = {
  /** Doubles as the anchor the jump row scrolls to. */
  id: string;
  /** Two-digit marker, e.g. '01'. */
  index: string;
  title: string;
  /** Right-aligned count or note, e.g. '4 roles'. */
  meta?: string;
  children: ReactNode;
};

/** One band of the one-pager: numbered marker, title, hairline, optional count. */
export default function ResumeSection({ id, index, title, meta, children }: ResumeSectionProps) {
  return (
    <section className="resume-section" id={id}>
      <motion.div
        className="resume-section__head"
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      >
        <span className="resume-section__index" aria-hidden="true">
          {index}
        </span>
        <h2 className="resume-section__title">{title}</h2>
        <span className="resume-section__rule" aria-hidden="true" />
        {meta && <span className="resume-section__meta">{meta}</span>}
      </motion.div>

      {children}
    </section>
  );
}
