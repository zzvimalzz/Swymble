import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent, PointerEvent as ReactPointerEvent } from 'react';
import SmartImage from '../../SmartImage';
import type { SwymbleLab } from '../../../data/types';
import { STATUS_MODIFIER } from './labPresentation';
import { labDisplayName } from '../../../utils/labSeo';
import { arrived, step, stepToward, type Bubble, type Bounds, type Rect, type Target } from './bubblePhysics';
import { radiusFor, rowTargets, seedBubbles, visibleFloor } from './bubbleLayout';
import {
  BURST_LIFE,
  ageBurst,
  applyFusion,
  burstProgress,
  startBurst,
  type Burst,
  deepestPair,
  fusedId,
  isFused,
  membersOf,
  readyToFuse,
  splitAll,
  splitBubble,
  strainOf,
  trackSqueeze,
  type Squeeze,
} from './bubbleFusion';
import { neckEdge, neckPath } from './fusionNeck';
import { specimenFor } from './fusionLore';
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
  /**
   * The fused bubble's id while one exists, null the rest of the time, and the way to break it
   * again. The page draws the specimen card from the id and calls `dismiss` when the card is
   * closed — the two labs come apart at that moment and not before. See DesktopLabs.
   */
  onFusion?: (id: string | null, dismiss?: () => void) => void;
};

/** 'field' is the loose pile you can throw around; 'row' is the carousel strip above the open
 *  card. The same seven DOM nodes are used for both — they are never unmounted and remounted,
 *  which is what lets a bubble travel from wherever it was to its slot. */
type FieldMode = 'field' | 'row';

type PointerSample = { x: number; y: number; time: number };

export default function BubbleField({ labs, selectedId, onSelect, paused = false, onFusion }: BubbleFieldProps) {
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

  // THE FUSION EGG. Squeeze one bubble into another that has nowhere to go and the two merge.
  // Nothing in the solver knows about any of this — see bubbleFusion.ts for why it needs nothing
  // from it. The refs are read by the loop; the one piece of state exists because a fused bubble
  // is a DOM node React has to mount, and that happens once per merge rather than once a frame.
  const squeezeRef = useRef<Squeeze | null>(null);
  const fusionRef = useRef<string | null>(null);
  const [fusion, setFusion] = useState<string | null>(null);
  const neckFillRef = useRef<SVGPathElement | null>(null);
  const neckEdgeRef = useRef<SVGPathElement | null>(null);
  const burstRingRef = useRef<SVGCircleElement | null>(null);
  /** A specimen coming apart. Lives for BURST_LIFE and is then forgotten. */
  const burstRef = useRef<Burst | null>(null);
  /** The labs currently inside the fused bubble — their own buttons are hidden while it holds. */
  const swallowed = useMemo(() => new Set(fusion ? membersOf(fusion) : []), [fusion]);

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
      // Written every frame rather than toggled on a threshold: the strain drives a glow and a
      // wobble in CSS, and a number that ramps reads as pressure where a class that flips reads
      // as a state change.
      node.style.setProperty('--bubble-strain', '0');
    }

    const squeeze = squeezeRef.current;
    const strain = strainOf(squeeze);
    if (squeeze) {
      for (const id of [squeeze.a, squeeze.b]) {
        nodeRefs.current.get(id)?.style.setProperty('--bubble-strain', `${strain}`);
      }
    }

    // The skin between two bubbles being pressed together. Only ever one pair at a time, so one
    // path element is enough and nothing has to be created or destroyed while the loop runs.
    const fill = neckFillRef.current;
    const edge = neckEdgeRef.current;
    if (!fill || !edge) return;

    const left = squeeze ? bubblesRef.current.find((bubble) => bubble.id === squeeze.a) : null;
    const right = squeeze ? bubblesRef.current.find((bubble) => bubble.id === squeeze.b) : null;
    const path = left && right ? neckPath(left, right, strain) : null;

    fill.setAttribute('d', path ?? '');
    edge.setAttribute('d', path ? neckEdge(left!, right!, strain) ?? '' : '');

    // The rupture. A ring leaving the place the specimen let go, thinning as it goes — the only
    // thing on the page that says the two labs did not simply stop being one.
    const shock = burstRingRef.current;
    if (!shock) return;

    const burst = burstRef.current;
    if (!burst) {
      shock.setAttribute('r', '0');
      shock.setAttribute('opacity', '0');
      return;
    }

    const progress = burstProgress(burst);
    shock.setAttribute('cx', `${burst.x}`);
    shock.setAttribute('cy', `${burst.y}`);
    // Out fast, then easing — a shock, not a bubble of its own. It goes well past the specimen's
    // own radius and stays thick most of the way: a thin ring that barely clears the bubble is
    // over before anyone has registered that anything happened.
    shock.setAttribute('r', `${burst.r * (0.8 + 2.6 * (1 - (1 - progress) ** 3))}`);
    shock.setAttribute('opacity', `${(1 - progress) ** 1.2}`);
    shock.setAttribute('stroke-width', `${2 + 14 * (1 - progress) ** 2}`);
  }, []);

  /**
   * Breaks the specimen and gives the labs back.
   *
   * Every way out goes through here — closing the card, pressing the bubble, Escape, opening a
   * lab, gravity being switched on. A fused bubble that outlives any of those is a bubble with no
   * DOM node, or a card describing something that is no longer on the page.
   *
   * Note what is *not* on that list: a resize. Calling this from reseed() meant the merge was
   * undone in the same frame it happened, because the layout effect that calls reseed re-runs on
   * every render and setting the fusion state is itself a render. Nothing ever appeared.
   */
  const breakFusion = useCallback(() => {
    if (!fusionRef.current) return;

    // Where it was standing when it gave, for the shockwave to start from. Taken before the split,
    // because after it there is no specimen left to ask.
    const giving = bubblesRef.current.find((bubble) => bubble.id === fusionRef.current);
    if (giving) {
      burstRef.current = startBurst(giving);
      // The two labs are thrown clear rather than set down. They spin for as long as the rupture
      // is drawn — written straight onto the nodes, like every other bit of motion in this file.
      for (const id of membersOf(giving.id)) {
        const node = nodeRefs.current.get(id);
        if (!node) continue;
        node.classList.add('is-flung');
        window.setTimeout(() => node.classList.remove('is-flung'), BURST_LIFE * 1000);
      }
    }

    bubblesRef.current = splitAll(bubblesRef.current, radiusFor(ids.length, boundsRef.current));
    squeezeRef.current = null;
    fusionRef.current = null;
    setFusion(null);
    onFusion?.(null);
  }, [ids.length, onFusion]);

  /**
   * The merge itself: the two squeezed bubbles are replaced by the one they become.
   *
   * The hold is dropped at the same time. The bubble under the pointer has just stopped existing
   * — its id is gone and its button is about to be hidden — and pointer capture belongs to that
   * button, so there is no way to keep dragging the thing that replaced it. Letting go reads as
   * the squeeze giving way, which is what happened.
   */
  const mergeSqueezed = useCallback(() => {
    const squeeze = squeezeRef.current;
    if (!squeeze) return;

    const merged = applyFusion(bubblesRef.current, squeeze, ids);
    squeezeRef.current = null;
    if (!merged) return;

    const id = fusedId([...membersOf(squeeze.a), ...membersOf(squeeze.b)], ids);
    const radius = radiusFor(ids.length, boundsRef.current);
    // One specimen at a time. A second would need a second card, and two cards make the joke a
    // user interface.
    bubblesRef.current = merged.flatMap((bubble) =>
      isFused(bubble.id) && bubble.id !== id ? splitBubble(bubble, radius) : [bubble],
    );

    const held = heldRef.current;
    if (held) {
      const node = nodeRefs.current.get(held.id);
      if (node?.hasPointerCapture(held.pointerId)) node.releasePointerCapture(held.pointerId);
    }
    heldRef.current = null;
    pointerRef.current = null;
    samplesRef.current = [];
    // A merge ends with the pointer up over a bubble, which the browser also calls a click.
    // Opening a lab because two of them fused would be a strange reward.
    draggedRef.current = true;

    fusionRef.current = id;
    setFusion(id);
    onFusion?.(id, breakFusion);
  }, [breakFusion, ids, onFusion]);

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
    //
    // A specimen is left strictly alone. It makes the field one bubble short of the lab count,
    // which is exactly the condition the first branch treats as "the field needs building" — so a
    // resize during a merge would quietly seed seven fresh bubbles over the top of it. Its radius
    // is not the field radius either, so the second branch would shrink it back to a single.
    if (fusionRef.current) {
      measureObstacles();
      paint();
      return;
    }

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
  }, [breakFusion, ids, measureFloor, measureObstacles, paint, retarget]);

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

      // THE EGG. Read after the solver has had its say, because the overlap that matters is the
      // one that *survives* a frame — see bubbleFusion.ts.
      squeezeRef.current = trackSqueeze(
        squeezeRef.current,
        deepestPair(bubblesRef.current, held ? held.id : null),
        dt,
      );
      if (readyToFuse(squeezeRef.current)) mergeSqueezed();

      burstRef.current = ageBurst(burstRef.current, dt);

      paint();

      frameRef.current = requestAnimationFrame(tick);
    },
    [breakFusion, measureObstacles, mergeSqueezed, paint, retarget],
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
      // The specimen falls with everything else — it is a `.lab-bubble` and its card is in
      // useGravityMode's FALLING list. Its two members are `hidden` and so have no box, which
      // that hook already skips, so they are simply not in the world while it holds.
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
  }, [breakFusion, paint, paused, startLoop, stopLoop]);

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
    // The row is one lab per slot. A specimen has no slot of its own and its members have no
    // bubble, so opening a lab card gives them back first.
    //
    // Guarded on the mode, and it must stay guarded: this effect depends on `startLoop`, which
    // depends on `paused`, so it re-runs every time gravity is switched on or off. Breaking
    // unconditionally meant turning gravity on destroyed the specimen — and because paint() is
    // suppressed while paused, the rupture was never drawn either. The card simply vanished, and
    // the two labs turned up already separated when the page came back.
    if (mode === 'row') breakFusion();

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
    if (event.key === 'Escape' && fusionRef.current) {
      event.preventDefault();
      breakFusion();
      paint();
      return;
    }

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

  const specimen = fusion ? specimenFor(fusion, labs) : null;

  return (
    <div className="lab-bubble-stage" ref={stageRef}>
      {/* The skin between two bubbles being pressed together. Behind the buttons, so their logos
          stay crisp — a filter over the bubbles themselves would blur the artwork into paste.
          Two paths because the filled patch closes through a line that runs under the circles,
          and their background is not quite opaque enough to hide a stroke on it. */}
      <svg className="lab-bubble-goo" aria-hidden="true" focusable="false">
        <path className="lab-bubble-goo__fill" ref={neckFillRef} d="" />
        <path className="lab-bubble-goo__edge" ref={neckEdgeRef} d="" />
        <circle className="lab-bubble-goo__shock" ref={burstRingRef} cx="0" cy="0" r="0" opacity="0" />
      </svg>

      <ul className="lab-bubble-list">
        {labs.map((lab, index) => {
          const name = labDisplayName(lab);

          return (
            // Hidden, not unmounted: the button keeps its ref and its place, and comes straight
            // back when the specimen breaks. Its accessible name is on the fused bubble meanwhile.
            <li key={lab.id} hidden={swallowed.has(lab.id)}>
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

      {/* The specimen. Outside the list because it is not a lab — it is two of them, briefly, and
          it has no place in a list of the studio's work. Registered in nodeRefs under its own
          fused id, so the loop moves it exactly like any other bubble. */}
      {specimen && (
        <button
          type="button"
          className="lab-bubble lab-bubble--fused"
          data-cursor="hover"
          ref={(node) => {
            if (node) nodeRefs.current.set(specimen.id, node);
            else nodeRefs.current.delete(specimen.id);
          }}
          onPointerDown={(event) => onPointerDown(event, specimen.id)}
          onPointerMove={onPointerMove}
          onPointerUp={releasePointer}
          onPointerCancel={releasePointer}
          onClick={() => {
            if (draggedRef.current) {
              draggedRef.current = false;
              return;
            }
            // Pressing it lets it go early. It was going to come apart anyway.
            breakFusion();
            paint();
          }}
        >
          {/* The drawn mark for this exact pairing — a wallet with an eye in it, a brain melting
              into drips. Every pair on the page has one; the stitched-together halves below are
              the fallback for a lab that has been added but not yet drawn against the others. */}
          {specimen.image ? (
            <span className="lab-bubble__art lab-bubble__art--merged">
              <SmartImage src={specimen.image} alt="" fit="contain" padding={0} />
            </span>
          ) : (
            <span className="lab-bubble__art lab-bubble__art--chimera">
              <span className="lab-chimera lab-chimera--left">
                <SmartImage src={specimen.members[0].image} alt="" fit="contain" padding={0} />
              </span>
              <span className="lab-chimera lab-chimera--right">
                <SmartImage src={specimen.members.at(-1)!.image} alt="" fit="contain" padding={0} />
              </span>
            </span>
          )}
          <span className="lab-bubble__reader">
            {specimen.name}. {specimen.status}. {specimen.tagline} Press to separate them.
          </span>
        </button>
      )}
    </div>
  );
}
