import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent, PointerEvent as ReactPointerEvent } from 'react';
import SmartImage from '../../SmartImage';
import type { SwymbleLab } from '../../../data/types';
import { STATUS_MODIFIER } from './labPresentation';
import { labDisplayName } from '../../../utils/labSeo';
import { arrived, step, stepToward, type Bubble, type Bounds, type Rect, type Target } from './bubblePhysics';
import { radiusFor, rowTargets, seedBubbles, visibleFloor } from './bubbleLayout';
import '../../../styles/desktop-labs-bubbles.css';

/**
 * The labs, as a field of bubbles you can shove around.
 *
 * Three things are kept apart on purpose:
 *   - bubblePhysics.ts decides where circles go, and is testable without a browser;
 *   - this file owns the frame loop and writes transforms straight onto the DOM nodes;
 *   - React renders each bubble exactly once, and never again for motion.
 *
 * That last point is the whole architecture. Seven bubbles at 60fps through useState would
 * re-render this subtree sixty times a second in order to move some circles.
 */

/** Velocity samples older than this are ignored when a throw is released — a flick should carry
 *  the speed your hand just had, not the average of the whole drag. */
const FLICK_WINDOW_MS = 90;

/** Softer than the solver's default, so the row assembles over about a second rather than
 *  snapping into place. Critically damped either way — see stepToward(). */
const ROW_STIFFNESS = 42;

type BubbleFieldProps = {
  labs: SwymbleLab[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  /** Set while gravity mode owns the bubbles' transforms. */
  paused?: boolean;
};

/** 'field' is the loose pile you can throw around; 'row' is the carousel strip above the open
 *  card. The same seven DOM nodes are used for both — they are never unmounted and remounted,
 *  which is what lets a bubble travel from wherever it was to its slot. */
type FieldMode = 'field' | 'row';

type PointerSample = { x: number; y: number; time: number };

export default function BubbleField({ labs, selectedId, onSelect, paused = false }: BubbleFieldProps) {
  const mode: FieldMode = selectedId ? 'row' : 'field';
  const stageRef = useRef<HTMLDivElement | null>(null);
  const nodeRefs = useRef(new Map<string, HTMLElement>());
  const bubblesRef = useRef<Bubble[]>([]);
  const boundsRef = useRef<Bounds>({ width: 0, height: 0 });
  const frameRef = useRef<number | null>(null);
  const lastTimeRef = useRef(0);
  const heldRef = useRef<{ id: string; pointerId: number; offsetX: number; offsetY: number } | null>(null);
  const pointerRef = useRef<{ x: number; y: number } | null>(null);
  const samplesRef = useRef<PointerSample[]>([]);
  const draggedRef = useRef(false);
  const obstaclesRef = useRef<Rect[]>([]);
  const clockRef = useRef(0);
  const frameCountRef = useRef(0);
  /** Read inside paint(): while gravity owns these nodes, nothing here may write a transform.
   *  Turning gravity on hides the scrollbar, which resizes the stage, which fired the field's own
   *  ResizeObserver — and two bubbles snapped back to their seeded positions mid-fall. */
  const pausedRef = useRef(paused);
  pausedRef.current = paused;
  /** How far down the field currently reaches. Grows as the reader scrolls, never shrinks. */
  const floorRef = useRef(0);

  const ids = useMemo(() => labs.map((lab) => lab.id), [labs]);
  const modeRef = useRef<FieldMode>(mode);
  /** null until the first mode effect has run. The field opens as it was seeded — the outward
   *  push below belongs to *leaving the row*, and firing it on mount drops every bubble on the
   *  floor before anyone has touched anything. */
  const previousModeRef = useRef<FieldMode | null>(null);
  const targetsRef = useRef<Map<string, Target>>(new Map());
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(query.matches);
    const onChange = (event: MediaQueryListEvent) => setReducedMotion(event.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  /** Where the row wants each bubble. Recomputed on selection and on resize; the spring reads it
   *  every frame, so a stage that is still collapsing is followed rather than fought. */
  const retarget = useCallback(() => {
    const stage = stageRef.current;
    const bounds = boundsRef.current;
    if (!stage || mode !== 'row' || bounds.width === 0) {
      targetsRef.current = new Map();
      return;
    }

    // The row lives in the strip the page reserves for it, not in the middle of a full-page
    // field. Measured, so the strip can be moved or resized in CSS alone.
    const band = stage.parentElement?.querySelector('[data-bubble-band]');
    const origin = stage.getBoundingClientRect();
    const box = band ? band.getBoundingClientRect() : null;
    const area = box
      ? { x: box.left - origin.left, y: box.top - origin.top, width: box.width, height: box.height }
      : { x: 0, y: 0, width: bounds.width, height: Math.min(bounds.height, 180) };

    const slots = rowTargets(ids.length, { width: area.width, height: area.height }).map((slot) => ({
      ...slot,
      x: slot.x + area.x,
      y: slot.y + area.y,
    }));
    targetsRef.current = new Map(
      ids.map((id, index) => {
        const slot = slots[index];
        // The open lab is drawn larger, the way the Watch's centre app is.
        return [id, id === selectedId ? { ...slot, r: slot.r * 1.28 } : slot];
      }),
    );
  }, [ids, mode, selectedId]);

  /**
   * The boxes on the page the bubbles have to get around. Measured from the DOM rather than
   * hard-coded, so the heading can change size, the open card can appear, and the field simply
   * finds them in the way — see [data-bubble-obstacle] in DesktopLabs.tsx.
   */
  /** The field is as deep as the reader has seen. See visibleFloor() for why it only ever grows. */
  const measureFloor = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const box = stage.getBoundingClientRect();
    floorRef.current = visibleFloor({
      stageTop: box.top + window.scrollY,
      stageHeight: stage.clientHeight,
      scrollY: window.scrollY,
      viewportHeight: window.innerHeight,
    });
    boundsRef.current = { width: stage.clientWidth, height: floorRef.current };
  }, []);

  const measureObstacles = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const origin = stage.getBoundingClientRect();
    // The nav is `position: fixed` and changes height when it compacts, so it is measured with
    // everything else on every scroll rather than once — its box moves relative to the field.
    const solid = [...document.querySelectorAll('[data-bubble-obstacle], .desktop-nav')];
    obstaclesRef.current = solid.map((node) => {
      const box = node.getBoundingClientRect();
      // A little padding: a logo grazing a headline's exact glyph box still reads as a collision.
      const inset = -6;
      return {
        x: box.left - origin.left + inset,
        y: box.top - origin.top + inset,
        width: box.width - inset * 2,
        height: box.height - inset * 2,
      };
    });
  }, []);

  const paint = useCallback(() => {
    if (pausedRef.current) return;

    for (const bubble of bubblesRef.current) {
      const node = nodeRefs.current.get(bubble.id);
      if (!node) continue;
      node.style.width = `${bubble.r * 2}px`;
      node.style.height = `${bubble.r * 2}px`;
      node.style.transform = `translate3d(${bubble.x - bubble.r}px, ${bubble.y - bubble.r}px, 0)`;
    }
  }, []);

  /** Seeds the field for the stage's current size. Called on mount and on resize — the arrangement
   *  is deterministic, so a resize re-lays it out rather than scattering everything anew. */
  const reseed = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return;

    if (stage.clientWidth === 0 || stage.clientHeight === 0) return;

    measureFloor();
    const bounds = boundsRef.current;

    // Only the loose field gets re-seeded. Re-seeding while the row is open would teleport every
    // bubble out of its slot the moment the stage finished collapsing.
    if (modeRef.current === 'field' && bubblesRef.current.length !== ids.length) {
      bubblesRef.current = seedBubbles(ids, bounds, radiusFor(ids.length, bounds));
    } else if (modeRef.current === 'field') {
      const radius = radiusFor(ids.length, bounds);
      bubblesRef.current = bubblesRef.current.map((bubble) => ({
        ...bubble,
        r: radius,
        x: Math.min(Math.max(bubble.x, radius), Math.max(radius, bounds.width - radius)),
        y: Math.min(Math.max(bubble.y, radius), Math.max(radius, bounds.height - radius)),
      }));
    }

    measureObstacles();
    retarget();
    paint();
  }, [ids, measureFloor, measureObstacles, paint, retarget]);

  // First fill: nothing exists yet, so this is the one place the field is built from scratch.
  useLayoutEffect(() => {
    const stage = stageRef.current;
    if (!stage || bubblesRef.current.length > 0) return;
    if (stage.clientWidth === 0 || stage.clientHeight === 0) return;
    measureFloor();
    const bounds = boundsRef.current;
    bubblesRef.current = seedBubbles(ids, bounds, radiusFor(ids.length, bounds));
    paint();
  }, [ids, measureFloor, paint]);

  useLayoutEffect(() => {
    reseed();
    const stage = stageRef.current;
    if (!stage || typeof ResizeObserver === 'undefined') return undefined;

    const observer = new ResizeObserver(reseed);
    observer.observe(stage);
    return () => observer.disconnect();
  }, [reseed]);

  const tick = useCallback(
    (time: number) => {
      const dt = lastTimeRef.current === 0 ? 1 / 60 : (time - lastTimeRef.current) / 1000;
      lastTimeRef.current = time;

      // Re-measured a few times a second, not every frame: the open card animates in and out over
      // ~340ms, and a stale box left behind after it closes is a wall the bubbles cannot see.
      // That bug looked exactly like the scatter not firing.
      frameCountRef.current += 1;
      if (frameCountRef.current % 10 === 0) measureObstacles();

      if (modeRef.current === 'row') {
        // Re-aimed every frame: the strip animates its height open underneath them, so a target
        // computed once is a target that was right for a single frame.
        retarget();
        bubblesRef.current = stepToward(bubblesRef.current, targetsRef.current, dt, ROW_STIFFNESS);
        paint();

        if (arrived(bubblesRef.current, targetsRef.current)) {
          // Land exactly on the slots rather than a fraction of a pixel short, so the row is
          // pixel-even at rest however it was approached.
          bubblesRef.current = bubblesRef.current.map((bubble) => {
            const target = targetsRef.current.get(bubble.id);
            return target ? { ...bubble, ...target, vx: 0, vy: 0 } : bubble;
          });
          paint();
          frameRef.current = null;
          lastTimeRef.current = 0;
          return;
        }

        frameRef.current = requestAnimationFrame(tick);
        return;
      }

      const held = heldRef.current;
      clockRef.current += Math.min(dt, 1 / 30);
      bubblesRef.current = step(bubblesRef.current, boundsRef.current, dt, {
        heldId: held ? held.id : null,
        heldTo: held && pointerRef.current ? pointerRef.current : null,
        obstacles: obstaclesRef.current,
        // The field is never still: left alone it keeps drifting, which is why this loop has no
        // at-rest exit. It is stopped by the tab being hidden or the page being scrolled away.
        wander: { time: clockRef.current },
      });
      paint();

      frameRef.current = requestAnimationFrame(tick);
    },
    [measureObstacles, paint, retarget],
  );

  const startLoop = useCallback(() => {
    if (reducedMotion || paused || frameRef.current !== null) return;
    lastTimeRef.current = 0;
    frameRef.current = requestAnimationFrame(tick);
  }, [paused, reducedMotion, tick]);

  const stopLoop = useCallback(() => {
    if (frameRef.current === null) return;
    cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
    lastTimeRef.current = 0;
  }, []);

  useEffect(() => stopLoop, [stopLoop]);

  // Handing the bubbles over to gravity and taking them back. On the way back the field picks up
  // from wherever they landed rather than teleporting them home.
  useEffect(() => {
    if (paused) {
      stopLoop();
      return;
    }

    const stage = stageRef.current;
    if (!stage || bubblesRef.current.length === 0) return;

    const origin = stage.getBoundingClientRect();
    bubblesRef.current = bubblesRef.current.map((bubble) => {
      const node = nodeRefs.current.get(bubble.id);
      if (!node) return bubble;
      const box = node.getBoundingClientRect();
      return {
        ...bubble,
        x: box.left + box.width / 2 - origin.left,
        y: box.top + box.height / 2 - origin.top,
        vx: 0,
        vy: -120,
      };
    });
    paint();
    startLoop();
  }, [paint, paused, startLoop, stopLoop]);

  // Scrolling moves the fixed nav relative to the field, and compacting it changes its height.
  // Coalesced into one measurement per frame; the loop reads the result, never the DOM.
  useEffect(() => {
    let queued = false;
    const onScroll = () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => {
        queued = false;
        measureFloor();
        measureObstacles();
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [measureFloor, measureObstacles]);

  useEffect(() => {
    modeRef.current = mode;
    measureObstacles();
    retarget();

    // A bubble held when the row opens would keep following a pointer that is no longer down.
    heldRef.current = null;
    pointerRef.current = null;

    if (previousModeRef.current === null) {
      previousModeRef.current = mode;
      paint();
      return;
    }

    const cameFromRow = previousModeRef.current === 'row' && mode === 'field';
    previousModeRef.current = mode;

    if (reducedMotion) {
      // No spring, no throw: put everything where it belongs in one frame.
      bubblesRef.current =
        mode === 'row'
          ? bubblesRef.current.map((bubble) => {
              const target = targetsRef.current.get(bubble.id);
              return target ? { ...bubble, ...target, vx: 0, vy: 0 } : bubble;
            })
          : seedBubbles(ids, boundsRef.current, radiusFor(ids.length, boundsRef.current));
      paint();
      return;
    }

    // Leaving the row hands the bubbles back to physics with a small outward push, so the field
    // opens up again instead of unsticking from a straight line.
    if (cameFromRow) {
      const bounds = boundsRef.current;
      // Fired off in seven different directions rather than pushed straight outward, so closing a
      // card breaks the line up instead of leaving a row that slowly sags. Deterministic angles:
      // the same close always scatters the same way, and no two bubbles take the same heading.
      bubblesRef.current = bubblesRef.current.map((bubble, index) => {
        const angle = index * 2.399963229728653 + 0.6;
        const speed = 380 + (index % 3) * 120;
        return {
          ...bubble,
          r: radiusFor(ids.length, bounds),
          vx: Math.cos(angle) * speed,
          // Fanned around the full circle with a downward bias. Straight down at speed put most of
          // them below the fold; the ones sent upward bounce off the subtitle and come back into
          // the middle of the field, which is where the mixing happens.
          vy: Math.sin(angle) * speed * 0.8 + 200,
        };
      });
    }

    startLoop();
  }, [ids, measureObstacles, mode, paint, reducedMotion, retarget, startLoop]);

  // The loop has no at-rest exit any more, so these two are the only things that stop it: the tab
  // going away, and the field being scrolled off the screen.
  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) stopLoop();
      else startLoop();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [startLoop, stopLoop]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || typeof IntersectionObserver === 'undefined') {
      startLoop();
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) startLoop();
        else stopLoop();
      },
      { threshold: 0 },
    );
    observer.observe(stage);
    return () => observer.disconnect();
  }, [startLoop, stopLoop]);

  const stagePoint = (event: ReactPointerEvent<HTMLElement>) => {
    const stage = stageRef.current;
    if (!stage) return { x: 0, y: 0 };
    const rect = stage.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };

  const onPointerDown = (event: ReactPointerEvent<HTMLButtonElement>, id: string) => {
    // While gravity has them, the bubbles are dragged by that solver, not this one.
    if (reducedMotion || paused || mode === 'row' || event.button !== 0) return;

    const bubble = bubblesRef.current.find((entry) => entry.id === id);
    if (!bubble) return;

    const point = stagePoint(event);
    event.currentTarget.setPointerCapture(event.pointerId);
    draggedRef.current = false;
    heldRef.current = {
      id,
      pointerId: event.pointerId,
      offsetX: bubble.x - point.x,
      offsetY: bubble.y - point.y,
    };
    pointerRef.current = { x: bubble.x, y: bubble.y };
    samplesRef.current = [{ x: bubble.x, y: bubble.y, time: performance.now() }];
    startLoop();
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const held = heldRef.current;
    if (!held || held.pointerId !== event.pointerId) return;

    const point = stagePoint(event);
    const next = { x: point.x + held.offsetX, y: point.y + held.offsetY };
    const previous = pointerRef.current;
    if (previous && Math.hypot(next.x - previous.x, next.y - previous.y) > 3) draggedRef.current = true;

    pointerRef.current = next;
    const now = performance.now();
    samplesRef.current.push({ x: next.x, y: next.y, time: now });
    samplesRef.current = samplesRef.current.filter((sample) => now - sample.time <= FLICK_WINDOW_MS);
    startLoop();
  };

  const releasePointer = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const held = heldRef.current;
    if (!held || held.pointerId !== event.pointerId) return;

    // Hand the bubble the velocity of the last few milliseconds of the drag, so a flick throws
    // it and a slow drop leaves it where it was put.
    const samples = samplesRef.current;
    const first = samples[0];
    const last = samples[samples.length - 1];
    if (first && last && last.time > first.time) {
      const seconds = (last.time - first.time) / 1000;
      bubblesRef.current = bubblesRef.current.map((bubble) =>
        bubble.id === held.id
          ? { ...bubble, vx: (last.x - first.x) / seconds, vy: (last.y - first.y) / seconds }
          : bubble,
      );
    }

    heldRef.current = null;
    pointerRef.current = null;
    samplesRef.current = [];
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    startLoop();
  };

  /** The field is a pile of circles with no reading order, so Tab alone is a poor way through it.
   *  Arrows move along the labs in the page's own order — the same order the row uses. */
  const onKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>, index: number) => {
    if (event.key === 'Escape' && selectedId) {
      event.preventDefault();
      onSelect(null);
      return;
    }

    const step = event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1 : event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 0;
    if (step === 0) return;

    event.preventDefault();
    const nextId = ids[(index + step + ids.length) % ids.length];
    const node = nodeRefs.current.get(nextId);
    if (node instanceof HTMLElement) node.focus();
  };

  return (
    <div className="lab-bubble-stage" ref={stageRef}>
      <ul className="lab-bubble-list">
        {labs.map((lab, index) => {
          const name = labDisplayName(lab);

          return (
            <li key={lab.id}>
              <button
                type="button"
                className={`lab-bubble lab-bubble--${STATUS_MODIFIER[lab.status]}${
                  selectedId === lab.id ? ' is-selected' : ''
                }`}
                data-cursor="hover"
                aria-pressed={selectedId === lab.id}
                ref={(node) => {
                  if (node) nodeRefs.current.set(lab.id, node);
                  else nodeRefs.current.delete(lab.id);
                }}
                onPointerDown={(event) => onPointerDown(event, lab.id)}
                onPointerMove={onPointerMove}
                onPointerUp={releasePointer}
                onPointerCancel={releasePointer}
                onKeyDown={(event) => onKeyDown(event, index)}
                onClick={() => {
                  // A bubble is still a control while the page is down: pressing one drops its card
                  // into the pile, contents and all. See useGravityMode.captureDeck.
                  // A throw ends with a pointerup over the bubble, which the browser also calls a
                  // click. Opening a lab because someone flung it would be maddening.
                  if (draggedRef.current) {
                    draggedRef.current = false;
                    return;
                  }
                  // Pressing the bubble whose card is open closes it — the card carries no close
                  // button, the bubble is the control.
                  onSelect(selectedId === lab.id ? null : lab.id);
                }}
              >
                <span className="lab-bubble__art">
                  <SmartImage src={lab.image} alt="" fit="contain" padding={0} />
                </span>
                {/* Nothing is drawn on the bubble but the logo. This text is the button's
                    accessible name and the only thing a crawler can read on a page of circles —
                    it is in the DOM, and only ever hidden visually. */}
                <span className="lab-bubble__reader">
                  {name}. {lab.status}. {lab.publicSummary}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
