import { motion, useScroll, useSpring } from 'framer-motion';
import { useMemo } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import ResumeHeader from '../../components/desktop/Resume/ResumeHeader';
import ResumeJumpRow from '../../components/desktop/Resume/ResumeJumpRow';
import type { ResumeJumpTarget } from '../../components/desktop/Resume/ResumeJumpRow';
import ResumeSection from '../../components/desktop/Resume/ResumeSection';
import ResumeSkills from '../../components/desktop/Resume/ResumeSkills';
import ResumeTimeline from '../../components/desktop/Resume/ResumeTimeline';
import usePointerGlare from '../../hooks/usePointerGlare';
import { SWYMBLE_DATA } from '../../data/config';
import { buildResumeModel } from '../../utils/resumeModel';
import '../../styles/desktop-resume.css';

const JUMP_TARGETS: ResumeJumpTarget[] = [
  { id: 'resume-experience', label: 'Experience' },
  { id: 'resume-education', label: 'Education' },
  { id: 'resume-skills', label: 'Skills' },
  { id: 'resume-work', label: 'Work' },
  { id: 'resume-contact', label: 'Contact' },
];

const plural = (count: number, noun: string) => `${count} ${noun}${count === 1 ? '' : 's'}`;

/**
 * The employer view: everything the rest of the site says, condensed onto one page and ordered
 * the way a resume is read. Nothing here is a second copy of the content — the roles, degrees and
 * projects are derived from the same career data the About page draws its graph from (see
 * utils/resumeModel.ts), so the two can't drift apart.
 */
export default function DesktopResume() {
  const { about, career, resume, socials, name } = SWYMBLE_DATA;
  const model = useMemo(() => buildResumeModel(career, resume), [career, resume]);

  const ctaGlareRef = usePointerGlare<HTMLDivElement>();

  // Read-progress bar. Pinned to the whole document rather than a container so it measures the
  // page the reader is actually scrolling.
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 140, damping: 32, restDelta: 0.001 });

  return (
    <section className="layout-content desktop-page-layout desktop-resume-page">
      <motion.div className="resume-progress" style={{ scaleX: progress }} aria-hidden="true" />

      <ResumeHeader
        about={about}
        resume={resume}
        model={model}
        socials={socials}
        brandName={name}
      />

      <ResumeJumpRow targets={JUMP_TARGETS} />

      <ResumeSection
        id="resume-experience"
        index="01"
        title="Experience"
        meta={plural(model.experience.length, 'role')}
      >
        <ResumeTimeline entries={model.experience} />
      </ResumeSection>

      <ResumeSection
        id="resume-education"
        index="02"
        title="Education"
        meta={plural(model.education.length, 'qualification')}
      >
        <ResumeTimeline entries={model.education} variant="compact" />
      </ResumeSection>

      <ResumeSection
        id="resume-skills"
        index="03"
        title="Skills"
        meta={plural(resume.skillGroups.length, 'group')}
      >
        <ResumeSkills groups={resume.skillGroups} />
      </ResumeSection>

      <ResumeSection
        id="resume-work"
        index="04"
        title="Selected work"
        meta={plural(model.projects.length, 'build')}
      >
        <ResumeTimeline entries={model.projects} variant="compact" />
      </ResumeSection>

      <ResumeSection id="resume-contact" index="05" title="Contact">
        <motion.div
          className="resume-cta"
          initial={{ opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-70px' }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="resume-cta__surface" ref={ctaGlareRef}>
            <span className="resume-entry__glare" aria-hidden="true" />

            <div className="resume-cta__copy">
              <p className={`resume-cta__status resume-cta__status--${about.availability.state}`}>
                {about.availability.label}
              </p>
              <p className="resume-cta__line">{about.location}</p>
            </div>

            <div className="resume-cta__links">
              {socials.map((social) => {
                const Icon = social.icon;
                const isMailto = social.link.startsWith('mailto:');
                return (
                  <a
                    key={social.id}
                    className="resume-cta__link"
                    href={social.link}
                    {...(isMailto ? {} : { target: '_blank', rel: 'noopener noreferrer' })}
                  >
                    <Icon size={18} aria-hidden="true" />
                    {social.name}
                  </a>
                );
              })}
            </div>
          </div>
        </motion.div>

        <p className="resume-footnote">
          This is the condensed version.
          <Link className="resume-footnote__link" to="/about">
            The long one lives on the About page
            <ArrowUpRight size={14} aria-hidden="true" />
          </Link>
        </p>
      </ResumeSection>
    </section>
  );
}
