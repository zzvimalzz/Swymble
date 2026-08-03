import { animate, motion, useInView, useMotionValue, useReducedMotion, useTransform } from 'framer-motion';
import { useEffect, useRef } from 'react';
import usePointerGlare from '../../../hooks/usePointerGlare';
import type { SwymbleAbout, SwymbleResume, SwymbleSocial } from '../../../data/types';
import type { ResumeModel } from '../../../utils/resumeModel';

type ResumeHeaderProps = {
  about: SwymbleAbout;
  resume: SwymbleResume;
  model: ResumeModel;
  socials: SwymbleSocial[];
  /** Used when the resume overlay doesn't override the name. */
  brandName: string;
};

/** Counts up to `value` the first time it scrolls into view; static under reduced motion. */
function CountUp({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const reduceMotion = useReducedMotion();
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => Math.round(latest).toString());

  useEffect(() => {
    if (!inView) {
      return;
    }
    if (reduceMotion) {
      count.set(value);
      return;
    }
    const controls = animate(count, value, { duration: 0.9, ease: [0.16, 1, 0.3, 1] });
    return () => controls.stop();
  }, [count, inView, reduceMotion, value]);

  return <motion.span ref={ref}>{rounded}</motion.span>;
}

export default function ResumeHeader({ about, resume, model, socials, brandName }: ResumeHeaderProps) {
  const glareRef = usePointerGlare<HTMLDivElement>();

  const skillCount = resume.skillGroups.reduce((total, group) => total + group.items.length, 0);
  // Derived rather than typed in, the same way the About header's stats are: a number that has to
  // be hand-updated every January is a number that will be wrong every January.
  const yearsShipping = Math.max(1, new Date().getFullYear() - model.firstRoleYear);

  const stats = [
    { id: 'years', value: yearsShipping, suffix: '+', label: 'Years shipping', hint: `since ${model.firstRoleYear}` },
    { id: 'roles', value: model.experience.length, label: 'Roles', hint: 'including current' },
    { id: 'builds', value: model.projects.length, label: 'Builds shipped', hint: 'client work and own products' },
    { id: 'stack', value: skillCount, label: 'Tools and technologies', hint: 'across the stack' },
  ];

  const email = socials.find((social) => social.link.startsWith('mailto:'));

  return (
    <header className="resume-header">
      <div className="resume-hero" ref={glareRef}>
        <span className="resume-hero__glare" aria-hidden="true" />

        <p className="resume-hero__kicker">Resume · the quick read</p>

        <motion.h1
          className="resume-hero__name"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          {resume.name ?? brandName}
        </motion.h1>

        <p className="resume-hero__headline">{resume.headline}</p>

        <ul className="resume-hero__facts">
          <li className={`resume-hero__fact resume-hero__fact--${about.availability.state}`}>
            {about.availability.label}
          </li>
          <li className="resume-hero__fact">{about.location}</li>
          {email && (
            <li className="resume-hero__fact">
              <a className="resume-hero__fact-link" href={email.link}>
                {email.link.replace('mailto:', '')}
              </a>
            </li>
          )}
        </ul>

        <div className="resume-hero__summary">
          {resume.summary.map((paragraph, index) => (
            <motion.p
              key={paragraph}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + index * 0.12, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              {paragraph}
            </motion.p>
          ))}
        </div>
      </div>

      <dl className="resume-stats">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.id}
            className="resume-stats__item"
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ delay: index * 0.07, duration: 0.5 }}
          >
            <dt className="resume-stats__value">
              <CountUp value={stat.value} />
              {stat.suffix}
            </dt>
            <dd className="resume-stats__label">
              {stat.label}
              <span className="resume-stats__hint">{stat.hint}</span>
            </dd>
          </motion.div>
        ))}
      </dl>
    </header>
  );
}
