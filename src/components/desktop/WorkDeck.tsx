import { useMemo, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import type { CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import SmartImage from '../SmartImage';
import type { SwymbleLab, SwymbleProject } from '../../data/types';

const EASE = [0.16, 1, 0.3, 1] as const;
/** How far a card has to be dragged (or how fast flicked) before it counts as a dismissal. */
const SWIPE_DISTANCE = 100;
const SWIPE_VELOCITY = 440;
/** Pointer movement under this is a click, not a drag. Without it every tap-to-flip that wobbled
 *  a pixel would be swallowed by the drag handler. */
const CLICK_SLOP = 6;
const VISIBLE_DEPTH = 5;

/** Per-depth scatter, so the pile looks casually thrown down rather than machine-stacked. Fixed
 *  values rather than random ones: the same card must land in the same place on every render, or
 *  the stack reshuffles itself every time React re-renders. */
const SCATTER = [
  { rotate: -2, x: 0, y: 0 },
  { rotate: 5.5, x: 18, y: 11 },
  { rotate: -7, x: -16, y: 21 },
  { rotate: 3.5, x: 22, y: 30 },
  { rotate: -5, x: -9, y: 38 },
];

type WorkItem = {
  id: string;
  title: string;
  kind: string;
  blurb: string;
  image: string;
  status: 'Live' | 'In Development' | 'Private Beta' | 'Pending';
  accent: string;
  highlights: string[];
  href: string;
  external: boolean;
  cta: string;
};

/** Reuses the Labs page status colours. */
const STATUS_MODIFIER: Record<WorkItem['status'], string> = {
  Live: 'live',
  'In Development': 'development',
  'Private Beta': 'beta',
  Pending: 'development',
};

type WorkDeckProps = {
  projects: SwymbleProject[];
  labs: SwymbleLab[];
};

const buildItems = (projects: SwymbleProject[], labs: SwymbleLab[]): WorkItem[] =>
  [
    ...projects.map((project) => ({
      id: `project-${project.title}`,
      title: project.title,
      kind: project.category,
      blurb: project.description,
      image: project.landingImage ?? project.image,
      status: (project.status ?? 'Live') as WorkItem['status'],
      accent: project.categoryColor ?? '#00F0FF',
      highlights: project.outcomes ?? [],
      href: project.link ?? '/projects',
      external: Boolean(project.link),
      cta: project.link ? 'Visit site' : 'See more',
    })),
    ...labs
      .filter((lab) => lab.visibility !== 'private')
      .map((lab) => {
        const action = lab.actions?.[0] ?? lab.primaryAction;
        return {
          id: `lab-${lab.id}`,
          title: lab.title,
          kind: lab.category,
          blurb: lab.publicSummary,
          image: lab.image,
          status: lab.status as WorkItem['status'],
          accent: lab.categoryColor ?? '#00F0FF',
          highlights: lab.safeHighlights,
          href: action?.href ?? '/labs',
          external: Boolean(action?.href.startsWith('http')),
          cta: action ? action.label : 'See the lab',
        };
      }),
  ].sort((a, b) => Number(b.status === 'Live') - Number(a.status === 'Live'));

/**
 * A loose pile of everything that has been built, sitting beside the studio statement.
 *
 * It replaces two things at once: a full-width grid section that cost most of a screen to say
 * this, and a decorative radar that filled the same space without carrying any content.
 *
 * Drag the top card away to reach the one under it, or click it to turn it over. Everything is
 * derived from the projects and labs data, so shipping something new adds a card by itself.
 */
export default function WorkDeck({ projects, labs }: WorkDeckProps) {
  const items = useMemo(() => buildItems(projects, labs), [projects, labs]);
  const [order, setOrder] = useState<string[]>(() => items.map((item) => item.id));
  const [flippedId, setFlippedId] = useState<string | null>(null);
  const [seen, setSeen] = useState(1);
  const pressPoint = useRef({ x: 0, y: 0 });
  const prefersReducedMotion = useReducedMotion();

  const byId = useMemo(() => new Map(items.map((item) => [item.id, item])), [items]);
  const stack = order.map((id) => byId.get(id)).filter((item): item is WorkItem => Boolean(item));

  const sendToBack = () => {
    setFlippedId(null);
    setOrder((current) => (current.length < 2 ? current : [...current.slice(1), current[0]]));
    // Counts position in the pile, wrapping back to 1 after a full pass.
    setSeen((current) => (current % items.length) + 1);
  };

  return (
    <div className="workdeck">
      <div className="workdeck__head">
        <span className="workdeck__label">The work</span>
        <span className="workdeck__counter">
          {String(seen).padStart(2, '0')} / {String(items.length).padStart(2, '0')}
        </span>
      </div>

      <div className="workdeck__stage">
        {stack.slice(0, VISIBLE_DEPTH).map((item, depth) => {
          const isTop = depth === 0;
          const isFlipped = flippedId === item.id;
          const scatter = SCATTER[depth % SCATTER.length];
          const style = { '--work-accent': item.accent } as CSSProperties;

          return (
            <motion.article
              key={item.id}
              className={`workdeck__card${isTop ? ' workdeck__card--top' : ''}`}
              style={{ ...style, zIndex: VISIBLE_DEPTH - depth }}
              animate={{
                // A flipped card straightens up so it can actually be read.
                rotate: isFlipped ? 0 : scatter.rotate,
                x: scatter.x,
                y: scatter.y,
                scale: 1 - depth * 0.018,
                rotateY: isFlipped ? 180 : 0,
              }}
              transition={{ duration: prefersReducedMotion ? 0 : 0.45, ease: EASE }}
              drag={isTop && !isFlipped && stack.length > 1}
              dragSnapToOrigin
              dragElastic={0.6}
              // Recorded on every press, not just drags. Reading it from onDragStart left a stale
              // point behind after the first swipe, so every later click measured against where
              // that old drag began, blew past CLICK_SLOP, and was discarded as drag residue.
              onPointerDown={(event) => {
                pressPoint.current = { x: event.clientX, y: event.clientY };
              }}
              onDragEnd={(_, info) => {
                const thrown =
                  Math.hypot(info.offset.x, info.offset.y) > SWIPE_DISTANCE ||
                  Math.hypot(info.velocity.x, info.velocity.y) > SWIPE_VELOCITY;
                if (thrown) sendToBack();
              }}
              onClick={(event) => {
                if (!isTop) return;
                const moved = Math.hypot(
                  event.clientX - pressPoint.current.x,
                  event.clientY - pressPoint.current.y,
                );
                if (moved > CLICK_SLOP) return;
                setFlippedId((current) => (current === item.id ? null : item.id));
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  setFlippedId((current) => (current === item.id ? null : item.id));
                }
                if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
                  event.preventDefault();
                  sendToBack();
                }
              }}
              tabIndex={isTop ? 0 : -1}
              aria-hidden={!isTop}
              role="button"
              aria-label={`${item.title}. ${item.kind}. Enter to see details, arrow keys for the next one.`}
              data-cursor="hover"
            >
              <div className="workdeck__face workdeck__face--front">
                <div className="workdeck__media">
                  <SmartImage src={item.image} alt="" className="workdeck__image" />
                  <span
                    className={`lab-status-badge lab-status-badge--${STATUS_MODIFIER[item.status]} workdeck__status`}
                  >
                    {item.status.toUpperCase()}
                  </span>
                </div>
                <div className="workdeck__body">
                  <span className="workdeck__kind">{item.kind}</span>
                  <h3 className="workdeck__title">{item.title}</h3>
                  <p className="workdeck__blurb">{item.blurb}</p>
                </div>
              </div>

              <div className="workdeck__face workdeck__face--back">
                <span className="workdeck__kind">{item.kind}</span>
                <h3 className="workdeck__title">{item.title}</h3>
                {item.highlights.length > 0 && (
                  <ul className="workdeck__highlights">
                    {item.highlights.slice(0, 3).map((highlight) => (
                      <li key={highlight}>{highlight}</li>
                    ))}
                  </ul>
                )}
                <div className="workdeck__actions">
                  {item.external ? (
                    <a
                      className="workdeck__button"
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(event) => event.stopPropagation()}
                    >
                      {item.cta} <span aria-hidden="true">↗</span>
                    </a>
                  ) : (
                    <Link
                      className="workdeck__button"
                      to={item.href}
                      onClick={(event) => event.stopPropagation()}
                    >
                      {item.cta} <span aria-hidden="true">→</span>
                    </Link>
                  )}
                </div>
              </div>
            </motion.article>
          );
        })}
      </div>

      <p className="workdeck__hint">Throw the top card aside, or click it to turn it over.</p>
    </div>
  );
}
