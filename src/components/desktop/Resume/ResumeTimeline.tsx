import { motion, useScroll, useSpring } from 'framer-motion';
import { useRef } from 'react';
import ResumeEntry from './ResumeEntry';
import type { ResumeEntry as ResumeEntryData } from '../../../utils/resumeModel';

type ResumeTimelineProps = {
  entries: ResumeEntryData[];
  variant?: 'full' | 'compact';
};

/**
 * A stack of entries with a rail down the left that fills as you scroll through it — the
 * condensed descendant of the About page's scroll-drawn career graph, which is the piece of that
 * page most worth keeping when everything has to fit on one screenful at a time.
 */
export default function ResumeTimeline({ entries, variant = 'full' }: ResumeTimelineProps) {
  const listRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: listRef,
    // Starts filling when the list's top reaches 80% down the viewport and completes when its
    // bottom passes 40% — so the rail tracks reading position, not raw element position.
    offset: ['start 80%', 'end 40%'],
  });

  const railScale = useSpring(scrollYProgress, { stiffness: 120, damping: 30, restDelta: 0.001 });

  return (
    <div className={`resume-timeline resume-timeline--${variant}`} ref={listRef}>
      <div className="resume-timeline__rail" aria-hidden="true">
        <motion.span className="resume-timeline__rail-fill" style={{ scaleY: railScale }} />
      </div>

      <div className="resume-timeline__entries">
        {entries.map((entry, index) => (
          <ResumeEntry key={entry.node.id} entry={entry} index={index} variant={variant} />
        ))}
      </div>
    </div>
  );
}
