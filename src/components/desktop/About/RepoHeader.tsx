import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { SwymbleAbout, SwymbleCareerRepository } from '../../../data/types';
import { parseDateKey } from '../CareerRepository/layout';
import ContributionMosaic from './ContributionMosaic';

type RepoHeaderProps = {
  about: SwymbleAbout;
  career: SwymbleCareerRepository;
  /** Client projects plus labs that are actually live. */
  shippedCount: number;
  /** Labs that are NOT live yet: still being built, or in private beta. */
  labCount: number;
};

export default function RepoHeader({ about, career, shippedCount, labCount }: RepoHeaderProps) {
  const commitCount = career.reduce((total, branch) => total + branch.nodes.length, 0);
  const firstYear = Math.floor(
    Math.min(...career.flatMap((branch) => branch.nodes.map((node) => parseDateKey(node.date)))) / 12,
  );
  // Derived, not typed in, so it can never go stale — the same approach positioning.ts takes.
  const yearsTracked = new Date().getFullYear() - firstYear;

  // Each stat gets a hint saying what it actually counts. "9 branches" means nothing on its own;
  // "9 branches / parallel threads of work" does.
  const stats = [
    { id: 'years', label: 'Years tracked', hint: `since ${firstYear}`, value: yearsTracked },
    {
      id: 'commits',
      label: 'Career commits',
      hint: 'jobs, degrees, awards, launches',
      value: commitCount,
    },
    { id: 'branches', label: 'Branches', hint: 'parallel threads of work', value: career.length },
    {
      id: 'shipped',
      label: 'Shipped and live',
      hint: 'client work plus live products',
      value: shippedCount,
    },
    { id: 'labs', label: 'Still building', hint: 'not public yet', value: labCount },
  ];

  return (
    <header className="about-header">
      <div className="about-header__grid">
        <div className="about-header__identity">
          <p className="about-header__prompt">
            <span className="about-header__path">~/swymble</span> whoami
          </p>

          <motion.h1
            className="about-header__repo"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            {about.repo}
          </motion.h1>

          <p className="about-header__role">{about.role}</p>

          <div className="about-header__meta">
            <span className={`about-header__status about-header__status--${about.availability.state}`}>
              {about.availability.label}
            </span>
            <span className="about-header__location">{about.location}</span>
          </div>

          {/* This page is the long version on purpose. Anyone who only has two minutes — an
              employer, usually — should not have to scroll a git graph to find the facts. */}
          <Link className="about-header__resume" to="/resume">
            Short on time? Read the one-page resume
            <ArrowUpRight size={15} aria-hidden="true" />
          </Link>

          <div className="about-header__intro">
            {about.intro.map((line, index) => (
              <motion.p
                key={line}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + index * 0.12, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              >
                {line}
              </motion.p>
            ))}
          </div>
        </div>

        <div className="about-header__mosaic">
          <ContributionMosaic career={career} />
        </div>
      </div>

      <dl className="about-stats">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.id}
            className="about-stats__item"
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ delay: index * 0.07, duration: 0.5 }}
          >
            <dt className="about-stats__value">{stat.value}</dt>
            <dd className="about-stats__label">
              {stat.label}
              <span className="about-stats__hint">{stat.hint}</span>
            </dd>
          </motion.div>
        ))}
      </dl>
    </header>
  );
}
