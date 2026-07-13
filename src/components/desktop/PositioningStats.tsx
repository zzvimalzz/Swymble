import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import type { SwymblePositioning } from '../../data/config';

const EASE = [0.16, 1, 0.3, 1] as const;

const statsContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.12, delayChildren: 0.15 } },
};

const statVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
};

type PositioningStatsProps = {
  positioning: SwymblePositioning;
};

function renderParagraph(paragraph: string, link: SwymblePositioning['statementLink']) {
  if (!link || !paragraph.includes(link.label)) {
    return paragraph;
  }

  const [before, after] = paragraph.split(link.label);
  return (
    <>
      {before}
      <a href={link.href} target="_blank" rel="noopener noreferrer" data-cursor="hover" className="positioning-link">
        {link.label}
      </a>
      {after}
    </>
  );
}

export default function PositioningStats({ positioning }: PositioningStatsProps) {
  const [headline, ...paragraphs] = positioning.statement;

  return (
    <section className="positioning-section" aria-label="What Swymble is">
      <motion.div
        className="positioning-statement"
        initial={{ opacity: 0, y: 32 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.7, ease: EASE }}
      >
        {headline && <h2>{headline}</h2>}
        {paragraphs.map((paragraph) => (
          <p key={paragraph.slice(0, 24)}>{renderParagraph(paragraph, positioning.statementLink)}</p>
        ))}
      </motion.div>

      <motion.div
        className="positioning-stats"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-80px' }}
        variants={statsContainerVariants}
      >
        {positioning.stats.map((stat) => (
          <motion.div className="positioning-stat" key={stat.id} variants={statVariants}>
            <span className="positioning-stat-value">{stat.value}</span>
            <span className="positioning-stat-label">{stat.label}</span>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
