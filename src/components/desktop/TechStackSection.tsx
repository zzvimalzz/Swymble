import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import { useMemo } from 'react';
import type { CSSProperties } from 'react';
import Reveal from '../motion/Reveal';
import SmartImage from '../SmartImage';
import type { SwymbleTechStack } from '../../data/config';

const EASE = [0.16, 1, 0.3, 1] as const;

// The site's three brand accents — each chip's hover glow is assigned one of these
// at random (once per mount, not per hover) so the row isn't monochrome.
const BRAND_GLOW_COLORS = ['var(--accent-volt)', 'var(--accent-neon)', 'var(--accent-cyan)'];

const buildsContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};

const buildItemVariants: Variants = {
  hidden: { opacity: 0, x: 24 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.5, ease: EASE } },
};

type TechStackSectionProps = {
  techStack: SwymbleTechStack;
};

export default function TechStackSection({ techStack }: TechStackSectionProps) {
  const { headingLead, headingLines, toolsLabel, tools, builds } = techStack;

  const chipGlowColors = useMemo(
    () => tools.map(() => BRAND_GLOW_COLORS[Math.floor(Math.random() * BRAND_GLOW_COLORS.length)]),
    [tools],
  );

  const pickBuildGlow = () => BRAND_GLOW_COLORS[Math.floor(Math.random() * BRAND_GLOW_COLORS.length)];

  return (
    <section className="techstack-section" aria-label="Tech stack and what I build">
      <Reveal className="techstack-left">
        <h2 className="techstack-heading">
          <span className="techstack-heading-lead">{headingLead}</span>
          {headingLines.map((line, index) => {
            const words = line.split(' ');
            const lastWord = words.pop();
            const rest = words.join(' ');
            return (
              <span key={line} className="techstack-heading-strong">
                {rest ? `${rest} ` : ''}
                <span
                  className={`techstack-heading-highlight techstack-heading-highlight-${index % 2 === 0 ? 'a' : 'b'}`}
                >
                  {lastWord}
                </span>
              </span>
            );
          })}
        </h2>

        <div className="techstack-tools">
          <p className="techstack-tools-label">{toolsLabel}</p>
          <div className="techstack-chip-grid">
            {tools.map((tool, index) => {
              const chipStyle = { '--chip-glow': chipGlowColors[index] } as CSSProperties;
              return (
                <span key={tool.id} className="techstack-chip" style={chipStyle}>
                  <SmartImage src={tool.icon} alt={tool.name} className="techstack-chip-icon" padding="0.55rem" />
                  <span className="techstack-chip-tooltip" aria-hidden="true">
                    {tool.name}
                  </span>
                </span>
              );
            })}
          </div>
        </div>
      </Reveal>

      <motion.ul
        className="techstack-builds"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-80px' }}
        variants={buildsContainerVariants}
      >
        {builds.map((build) => {
          const Icon = build.icon;
          return (
            <motion.li
              key={build.id}
              className="techstack-build-item"
              variants={buildItemVariants}
              onMouseEnter={(event) => event.currentTarget.style.setProperty('--build-glow', pickBuildGlow())}
            >
              <span className="techstack-build-icon">
                <Icon size={20} aria-hidden="true" />
              </span>
              <span className="techstack-build-label">{build.label}</span>
            </motion.li>
          );
        })}
      </motion.ul>
    </section>
  );
}
