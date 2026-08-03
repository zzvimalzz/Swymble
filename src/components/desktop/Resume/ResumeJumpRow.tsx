import { motion } from 'framer-motion';
import { useCallback, useEffect, useRef, useState } from 'react';

export type ResumeJumpTarget = {
  id: string;
  label: string;
};

type ResumeJumpRowProps = {
  targets: ResumeJumpTarget[];
};

/** How far down the viewport the "you are here" line sits. */
const ACTIVE_LINE_RATIO = 0.35;

/** Slack (px) before the strip counts as scrollable in a direction, to absorb sub-pixel widths. */
const EDGE_SLACK = 2;

/**
 * The one-pager's table of contents. Tracks the active section from scroll position rather than
 * an IntersectionObserver: a section that is taller than the viewport never fully intersects, and
 * two short ones can intersect at once, so "the last section whose top is above the line" is the
 * rule that actually matches what a reader would call the current section.
 *
 * The highlight is a single shared element (`layoutId`) that framer-motion transitions between
 * buttons, so it slides from section to section instead of blinking out of one pill and into the
 * next. On a narrow screen the strip scrolls sideways and keeps the active pill centred, which is
 * what makes the last section reachable without a wrap to a second row.
 */
export default function ResumeJumpRow({ targets }: ResumeJumpRowProps) {
  const [activeId, setActiveId] = useState(targets[0]?.id ?? '');
  const [edges, setEdges] = useState({ start: false, end: false });
  const listRef = useRef<HTMLUListElement>(null);

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

  // Which edges have more strip behind them. Drives the fades, so a phone user can see there is
  // something past the edge instead of the last section just being invisible.
  const syncEdges = useCallback(() => {
    const list = listRef.current;
    if (!list) {
      return;
    }
    const maxScroll = list.scrollWidth - list.clientWidth;
    setEdges({
      start: list.scrollLeft > EDGE_SLACK,
      end: list.scrollLeft < maxScroll - EDGE_SLACK,
    });
  }, []);

  useEffect(() => {
    const list = listRef.current;
    if (!list) {
      return;
    }

    syncEdges();
    list.addEventListener('scroll', syncEdges, { passive: true });
    window.addEventListener('resize', syncEdges, { passive: true });

    return () => {
      list.removeEventListener('scroll', syncEdges);
      window.removeEventListener('resize', syncEdges);
    };
  }, [syncEdges]);

  // Keep the active pill in view as the page scrolls past sections. Scrolls the strip itself
  // rather than calling scrollIntoView, which would also drag the page vertically.
  useEffect(() => {
    const list = listRef.current;
    const active = list?.querySelector<HTMLElement>('[data-active="true"]');
    if (!list || !active || list.scrollWidth <= list.clientWidth + EDGE_SLACK) {
      return;
    }

    list.scrollTo({
      left: Math.max(0, active.offsetLeft - (list.clientWidth - active.offsetWidth) / 2),
      behavior: 'smooth',
    });
  }, [activeId]);

  const jumpTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <nav className="resume-jump" aria-label="Resume sections">
      <div
        className={`resume-jump__bar${edges.start ? ' resume-jump__bar--fade-start' : ''}${
          edges.end ? ' resume-jump__bar--fade-end' : ''
        }`}
      >
        <ul className="resume-jump__list" ref={listRef}>
          {targets.map((target) => {
            const isActive = activeId === target.id;

            return (
              <li key={target.id}>
                <button
                  type="button"
                  className={`resume-jump__item${isActive ? ' resume-jump__item--active' : ''}`}
                  onClick={() => jumpTo(target.id)}
                  data-active={isActive}
                  aria-current={isActive ? 'true' : undefined}
                >
                  {isActive && (
                    <motion.span
                      className="resume-jump__indicator"
                      layoutId="resume-jump-indicator"
                      aria-hidden="true"
                      transition={{ type: 'spring', stiffness: 420, damping: 38, mass: 0.7 }}
                    />
                  )}
                  <span className="resume-jump__label">{target.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
