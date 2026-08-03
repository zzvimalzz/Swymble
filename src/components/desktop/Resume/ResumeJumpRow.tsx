import { useEffect, useState } from 'react';

export type ResumeJumpTarget = {
  id: string;
  label: string;
};

type ResumeJumpRowProps = {
  targets: ResumeJumpTarget[];
};

/** How far down the viewport the "you are here" line sits. */
const ACTIVE_LINE_RATIO = 0.35;

/**
 * The one-pager's table of contents. Tracks the active section from scroll position rather than
 * an IntersectionObserver: a section that is taller than the viewport never fully intersects, and
 * two short ones can intersect at once, so "the last section whose top is above the line" is the
 * rule that actually matches what a reader would call the current section.
 */
export default function ResumeJumpRow({ targets }: ResumeJumpRowProps) {
  const [activeId, setActiveId] = useState(targets[0]?.id ?? '');

  useEffect(() => {
    let frame = 0;

    const update = () => {
      frame = 0;
      const line = window.innerHeight * ACTIVE_LINE_RATIO;
      let current = targets[0]?.id ?? '';

      for (const target of targets) {
        const element = document.getElementById(target.id);
        if (element && element.getBoundingClientRect().top <= line) {
          current = target.id;
        }
      }

      setActiveId(current);
    };

    const onScroll = () => {
      if (frame) {
        return;
      }
      frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (frame) {
        window.cancelAnimationFrame(frame);
      }
    };
  }, [targets]);

  const jumpTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <nav className="resume-jump" aria-label="Resume sections">
      <ul className="resume-jump__list">
        {targets.map((target) => (
          <li key={target.id}>
            <button
              type="button"
              className={`resume-jump__item${activeId === target.id ? ' resume-jump__item--active' : ''}`}
              onClick={() => jumpTo(target.id)}
              aria-current={activeId === target.id ? 'true' : undefined}
            >
              {target.label}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
