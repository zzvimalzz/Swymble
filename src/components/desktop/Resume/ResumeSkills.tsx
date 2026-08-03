import { motion } from 'framer-motion';
import usePointerGlare from '../../../hooks/usePointerGlare';
import type { SwymbleResumeSkillGroup } from '../../../data/types';

type ResumeSkillsProps = {
  groups: SwymbleResumeSkillGroup[];
};

function SkillGroup({ group, index }: { group: SwymbleResumeSkillGroup; index: number }) {
  const glareRef = usePointerGlare<HTMLDivElement>();

  return (
    <motion.div
      className="resume-skills__group"
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-70px' }}
      transition={{ delay: index * 0.07, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="resume-skills__surface" ref={glareRef} data-cursor="hover">
        <span className="resume-entry__glare" aria-hidden="true" />
        <h3 className="resume-skills__label">{group.label}</h3>
        <ul className="resume-skills__items">
          {group.items.map((item) => (
            <li key={item} className="resume-skills__chip">
              {item}
            </li>
          ))}
        </ul>
      </div>
    </motion.div>
  );
}

export default function ResumeSkills({ groups }: ResumeSkillsProps) {
  return (
    <div className="resume-skills">
      {groups.map((group, index) => (
        <SkillGroup key={group.id} group={group} index={index} />
      ))}
    </div>
  );
}
