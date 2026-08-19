import { useCallback, useEffect, useRef, useState } from 'react';
import { areaOf, makeBody, pointInBody, stepWorld, worldAtRest, type Body, type World } from './rigidBody';

/**
 * Gravity mode: the /labs page falls over, and then you can pick the pieces up.
 *
 * The elements are the *real* ones — the wordmark, each nav link, each word of the heading, the
 * bubbles, the footer, the buttons in the corner. They are moved with a transform and nothing
 * else, which is the whole trick: a transform does not take an element out of the document, so
 * every link still navigates, every button still fires, and a screen reader still reads the page
 * in its proper order while it lies in a heap.
 *
 * Cloning the page into a canvas would have been easier and would have produced a picture of a
 * page rather than a page.
 *
 * Scoped to /labs by construction: only DesktopLabs mounts this, and leaving the route unmounts
 * it, which puts everything back. That is the reset a reader gets by navigating away and
 * returning.
 */

/** Everything that falls whole. A selector that matches nothing is skipped, so this list can name
 *  things that only exist while a card is open. */
const FALLING = [
  '.desktop-nav .nav-brand',
  '.desktop-nav .nav-link',
  '.lab-deck__card.is-front',
  // The specimen card is deliberately *not* here. It falls, but it is picked up by captureDeck
  // along with the lab deck, because like the deck it needs a world of its own for its contents —
  // collected here it would drop as one sealed slab.
  '.site-footer .footer-logo-full-centered',
  '.site-footer .footer-copyright',
  '.site-footer .footer-status',
  '.site-footer .footer-legal',
  '.floating-controls__btn',
];

/** Falls a word at a time. A headline that drops as one 500px slab looks like a falling billboard;
 *  broken into words it looks like the page coming apart. */
const FALLING_WORDS = ['.desktop-labs-page .section-header h1', '.desktop-labs-page .labs-subtitle'];

/** The bubbles fall too, as circles rather than boxes. */
const BUBBLES = '.lab-bubble';

const GRAVITY = 2100;

/** Bubble sizes while a card is open, matching what the row does when gravity is off: the others
 *  shrink out of the way and the chosen one is drawn larger. */
const BUBBLE_ROW_SIZE = 96;
const BUBBLE_ROW_SELECTED_SIZE = 124;

/** How far a pointer may move before a press counts as a drag rather than a click. Below this, a
 *  fallen nav link still navigates. */
const DRAG_SLOP = 5;

type Tracked = {
  body: Body;
  element: HTMLElement;
  /**
   * The centre of the element's *untransformed* box.
   *
   * For an element in the flow this is in document coordinates and never changes. For a fixed one
   * — the nav, the corner buttons — it is in viewport coordinates, and the document-space origin
   * is recomputed from the scroll position every frame.
   *
   * It is not the centre the element is drawn at: a bubble is laid out at the corner of its stage
   * and put in place entirely by a transform, so whatever translation an element already carries
   * is subtracted here, once, when it is collected.
   */
  originX: number;
  originY: number;
  fixed: boolean;
  /** Drawn smaller than it is laid out. Folded into the transform and into the body's size. */
  scale?: number;
  previousTransform: string;
  previousTransition: string;
  previousWillChange: string;
};

/** An element whose innards were replaced by per-word spans, and the markup to put back. */
type SplitElement = { element: HTMLElement; html: string };

/**
 * A container with its own little world inside it.
 *
 * An open lab card falls into the pile like everything else, and its contents fall *within it* —
 * in the card's own coordinates, with "down" rotated into the card's frame, so tilting the card
 * slides its text into the low corner. The card's `overflow: hidden` is what keeps them in.
 */
type Nest = {
  container: Tracked;
  items: Tracked[];
  width: number;
  height: number;
};

/** True when this element or any ancestor is `position: fixed` — i.e. it is anchored to the
 *  viewport rather than to the document, and scrolling does not move it. */
const isViewportAnchored = (element: HTMLElement): boolean => {
  let node: HTMLElement | null = element;
  while (node && node !== document.body) {
    if (getComputedStyle(node).position === 'fixed') return true;
    node = node.parentElement;
  }
  return false;
};

export function useGravityMode(enabled: boolean) {
  const [active, setActive] = useState(false);
  const trackedRef = useRef<Tracked[]>([]);
  const splitRef = useRef<SplitElement[]>([]);
  const frameRef = useRef<number | null>(null);
  const lastTimeRef = useRef(0);
  const worldRef = useRef<World>({ width: 0, height: 0, gravity: GRAVITY });
  const nestsRef = useRef<Nest[]>([]);
  /**
   * What the pointer has hold of, and where on it — the anchor is in the body's own unrotated
   * frame, see StepOptions.held. A grab can land on a body in the page's world or on one of a
   * card's contents, which live in that card's world instead.
   */
  const heldRef = useRef<
    | {
        pointerId: number;
        anchorX: number;
        anchorY: number;
        target: { kind: 'body'; index: number } | { kind: 'nest'; nestIndex: number; itemIndex: number };
      }
    | null
  >(null);
  const pointerRef = useRef<{ x: number; y: number } | null>(null);
  const draggedRef = useRef(false);
  const frameCountRef = useRef(0);
  /** Where the page was when it fell over. It stays there until it is put back. */
  const frozenScrollRef = useRef({ x: 0, y: 0 });
  /** Each bubble's diameter when gravity took it, so it can be given back. */
  const bubbleSizeRef = useRef(new Map<HTMLElement, number>());

  /** Where a tracked element's untransformed centre sits in document space right now. */
  const originOf = useCallback(
    (tracked: Tracked) => ({
      x: tracked.originX + (tracked.fixed ? window.scrollX : 0),
      y: tracked.originY + (tracked.fixed ? window.scrollY : 0),
    }),
    [],
  );

  /**
   * A document-space point in a card's own coordinates.
   *
   * The card is drawn as translate → rotate → scale about its centre, so this undoes exactly that,
   * which is what lets a word inside a tilted card be picked up where it actually appears.
   */
  const toNestLocal = useCallback((nest: Nest, x: number, y: number) => {
    const body = nest.container.body;
    const scale = nest.container.scale ?? 1;
    const cos = Math.cos(body.angle);
    const sin = Math.sin(body.angle);
    const dx = x - body.x;
    const dy = y - body.y;

    return {
      x: nest.width / 2 + (dx * cos + dy * sin) / scale,
      y: nest.height / 2 + (-dx * sin + dy * cos) / scale,
    };
  }, []);

  const paint = useCallback(() => {
    for (const tracked of trackedRef.current) {
      const origin = originOf(tracked);
      const dx = tracked.body.x - origin.x;
      const dy = tracked.body.y - origin.y;
      const scale = tracked.scale && tracked.scale !== 1 ? ` scale(${tracked.scale})` : '';
      tracked.element.style.transform = `translate(${dx}px, ${dy}px) rotate(${tracked.body.angle}rad)${scale}`;
    }

    // Nested items are laid out inside their container and move in its coordinates, so their
    // transforms need no scroll or scale — the container's own transform already carries both.
    for (const nest of nestsRef.current) {
      for (const item of nest.items) {
        const dx = item.body.x - item.originX;
        const dy = item.body.y - item.originY;
        item.element.style.transform = `translate(${dx}px, ${dy}px) rotate(${item.body.angle}rad)`;
      }
    }
  }, [originOf]);

  const restore = useCallback(() => {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
    lastTimeRef.current = 0;
    heldRef.current = null;
    pointerRef.current = null;

    for (const tracked of trackedRef.current) {
      // Ease back rather than snap: the page reassembling itself is half the joke.
      tracked.element.style.transition = 'transform 0.65s cubic-bezier(0.16, 1, 0.3, 1)';
      tracked.element.style.transform = tracked.previousTransform;
      tracked.element.style.willChange = tracked.previousWillChange;
      tracked.element.removeAttribute('draggable');
      // The bubble field writes its own width and height every frame once it has them back.
      tracked.element.style.width = '';
      tracked.element.style.height = '';

      const element = tracked.element;
      const previousTransition = tracked.previousTransition;
      window.setTimeout(() => {
        element.style.transition = previousTransition;
      }, 700);
    }

    for (const nest of nestsRef.current) {
      for (const item of nest.items) {
        item.element.style.transform = item.previousTransform;
        item.element.style.transition = item.previousTransition;
        item.element.style.willChange = item.previousWillChange;
      }
    }

    const split = splitRef.current;
    bubbleSizeRef.current = new Map();
    trackedRef.current = [];
    nestsRef.current = [];
    splitRef.current = [];

    // The words go back into their headings only once they have flown home, or the text snaps
    // back into place while the spans are still mid-air.
    window.setTimeout(() => {
      for (const entry of split) entry.element.innerHTML = entry.html;
    }, 700);

    document.documentElement.classList.remove('is-gravity');
    setActive(false);
  }, []);

  /** Replaces a heading's text with one inline-block span per word, and hands them back. */
  const splitIntoWords = useCallback((element: HTMLElement): HTMLElement[] => {
    const text = element.textContent ?? '';
    const words = text.split(/\s+/).filter(Boolean);
    if (words.length < 2) return [element];

    splitRef.current.push({ element, html: element.innerHTML });
    element.textContent = '';

    return words.map((word, index) => {
      const span = document.createElement('span');
      span.className = 'gravity-word';
      span.textContent = word;
      element.append(span);
      if (index < words.length - 1) element.append(document.createTextNode(' '));
      return span;
    });
  }, []);

  const collect = useCallback(() => {
    const tracked: Tracked[] = [];
    const seen = new Set<Element>();

    const add = (element: HTMLElement, shape: 'box' | 'circle', index: number) => {
      if (seen.has(element)) return;
      const box = element.getBoundingClientRect();
      if (box.width < 8 || box.height < 8) return;
      seen.add(element);

      // A nav link is `position: static` inside a `position: fixed` bar, so asking the element
      // alone gets the wrong answer — and then the whole nav drifted whenever the page scrolled.
      // What matters is whether anything above it pins it to the viewport.
      const fixed = isViewportAnchored(element);
      const existing = new DOMMatrixReadOnly(getComputedStyle(element).transform);
      const centreX = box.left + box.width / 2;
      const centreY = box.top + box.height / 2;
      const radius = Math.min(box.width, box.height) / 2;

      tracked.push({
        element,
        // Fixed elements are anchored to the viewport, everything else to the document.
        originX: centreX - existing.m41 + (fixed ? 0 : window.scrollX),
        originY: centreY - existing.m42 + (fixed ? 0 : window.scrollY),
        fixed,
        previousTransform: element.style.transform,
        previousTransition: element.style.transition,
        previousWillChange: element.style.willChange,
        body: makeBody({
          id: `g${index}-${tracked.length}`,
          shape,
          // The body starts where the element is *drawn*, in document space.
          x: centreX + window.scrollX,
          y: centreY + window.scrollY,
          hw: shape === 'circle' ? radius : box.width / 2,
          hh: shape === 'circle' ? radius : box.height / 2,
          // A shove sideways and a spin, so the page comes apart rather than sliding down a lift
          // shaft. Deterministic per element: the same page always falls the same way.
          vx: (index % 2 === 0 ? 1 : -1) * (40 + (index % 5) * 26),
          av: ((index % 3) - 1) * 0.7,
        }),
      });
    };

    FALLING.forEach((selector, index) => {
      document.querySelectorAll<HTMLElement>(selector).forEach((element) => add(element, 'box', index));
    });

    FALLING_WORDS.forEach((selector, index) => {
      document.querySelectorAll<HTMLElement>(selector).forEach((element) => {
        for (const word of splitIntoWords(element)) add(word, 'box', FALLING.length + index);
      });
    });

    document
      .querySelectorAll<HTMLElement>(BUBBLES)
      .forEach((element) => add(element, 'circle', FALLING.length + FALLING_WORDS.length));

    return tracked;
  }, [splitIntoWords]);

  /**
   * The world, remeasured every frame.
   *
   * It is the *visible* part of the page and nothing more: the floor is the bottom of the viewport
   * and the ceiling is the top of it, so nothing can ever be scrolled out of sight. The page still
   * scrolls its full height; scrolling moves the box, and the pile is pushed along inside it.
   */
  const measureWorld = useCallback(() => {
    worldRef.current = {
      width: document.documentElement.clientWidth,
      // Closed at the top too. The floor rises as the reader scrolls back up, and with an open
      // ceiling the pile is simply squeezed off the top of the screen.
      top: window.scrollY,
      // clientHeight, not innerHeight: the latter counts the horizontal scrollbar's strip, which
      // put the floor a few pixels below the last row of visible pixels.
      height: window.scrollY + document.documentElement.clientHeight,
      gravity: GRAVITY,
    };
  }, []);

  /**
   * Re-reads how big each element actually is.
   *
   * Sizes are not fixed for the duration: the nav bar compacts when the reader scrolls past 72px,
   * and its wordmark and links shrink with it. A body still carrying the old extents is clamped
   * to the wrong box, and the nav ended up hanging a dozen pixels below the bottom of the screen.
   *
   * The same is true of *where* they are laid out: the nav's links slide down as its padding
   * grows, and an origin captured while it was compact leaves them hanging past the bottom of the
   * screen by exactly the difference. Both are re-read here.
   *
   * offsetWidth/offsetHeight rather than getBoundingClientRect for the size: they report the
   * untransformed box, which is what the body wants and what a rotated rect cannot tell us. The
   * origin does need the rect, with the transform this loop wrote subtracted back off.
   */
  const remeasureBodies = useCallback(() => {
    for (const tracked of trackedRef.current) {
      const width = tracked.element.offsetWidth;
      const height = tracked.element.offsetHeight;
      if (width < 4 || height < 4) continue;

      const box = tracked.element.getBoundingClientRect();
      const applied = new DOMMatrixReadOnly(getComputedStyle(tracked.element).transform);
      tracked.originX = box.left + box.width / 2 - applied.m41 + (tracked.fixed ? 0 : window.scrollX);
      tracked.originY = box.top + box.height / 2 - applied.m42 + (tracked.fixed ? 0 : window.scrollY);

      if (tracked.body.shape === 'circle') {
        const radius = Math.min(width, height) / 2;
        tracked.body.hw = radius;
        tracked.body.hh = radius;
      } else {
        tracked.body.hw = width / 2;
        tracked.body.hh = height / 2;
      }
    }
  }, []);

  const tick = useCallback(
    (time: number) => {
      const dt = lastTimeRef.current === 0 ? 1 / 60 : (time - lastTimeRef.current) / 1000;
      lastTimeRef.current = time;

      // The box follows wherever the page actually is. It cannot be scrolled deliberately, but it
      // can still shift underneath: turning gravity on changes the layout slightly (the footer
      // loses some padding), the document gets shorter, and a page sitting at the very bottom is
      // clamped up by a few pixels. Measuring every frame means the floor goes with it instead of
      // leaving the pile hanging below the last visible row.
      measureWorld();

      // Sizes and origins are re-read often in the first second and rarely afterwards: elements
      // are still settling into their final size then (the nav compacts, buttons finish animating
      // in), and a body built from a stale box is clamped to the wrong place — which is how some
      // items ended up below the bottom of the screen right after switching gravity on.
      frameCountRef.current += 1;
      const settling = frameCountRef.current < 90;
      if (frameCountRef.current % (settling ? 5 : 15) === 0) remeasureBodies();

      const held = heldRef.current;
      const pointer = pointerRef.current;
      const heldBody =
        held && pointer && held.target.kind === 'body' ? trackedRef.current[held.target.index] : null;

      const bodies = stepWorld(
        trackedRef.current.map((tracked) => tracked.body),
        worldRef.current,
        dt,
        heldBody && pointer
          ? {
              held: {
                id: heldBody.body.id,
                x: pointer.x,
                y: pointer.y,
                anchorX: held?.anchorX,
                anchorY: held?.anchorY,
              },
            }
          : {},
      );
      trackedRef.current.forEach((tracked, index) => {
        tracked.body = bodies[index];
      });

      // Each nest is its own little world, tilted with its container: "down" for a card's contents
      // is the screen's down expressed in the card's frame, which is why tipping a card pours its
      // text into the low corner.
      let nestsResting = true;
      for (const [nestIndex, nest] of nestsRef.current.entries()) {
        const angle = nest.container.body.angle;
        // A word held inside a card is pulled in that card's coordinates, so it follows the
        // pointer wherever the card has been tipped to.
        const heldItem =
          held && pointer && held.target.kind === 'nest' && held.target.nestIndex === nestIndex
            ? { item: nest.items[held.target.itemIndex], local: toNestLocal(nest, pointer.x, pointer.y) }
            : null;

        const nested = stepWorld(
          nest.items.map((item) => item.body),
          {
            width: nest.width,
            height: nest.height,
            gravity: GRAVITY * Math.cos(angle),
            gravityX: GRAVITY * Math.sin(angle),
          },
          dt,
          heldItem?.item
            ? {
                held: {
                  id: heldItem.item.body.id,
                  x: heldItem.local.x,
                  y: heldItem.local.y,
                  anchorX: held?.anchorX,
                  anchorY: held?.anchorY,
                },
              }
            : {},
        );
        nest.items.forEach((item, index) => {
          item.body = nested[index];
        });
        if (heldItem || !worldAtRest(nested)) nestsResting = false;
      }

      paint();

      // Nothing held, nothing moving anywhere: stop drawing frames.
      if (!held && nestsResting && worldAtRest(bodies)) {
        frameRef.current = null;
        lastTimeRef.current = 0;
        return;
      }

      frameRef.current = requestAnimationFrame(tick);
    },
    [measureWorld, paint, remeasureBodies],
  );

  const startLoop = useCallback(() => {
    if (frameRef.current !== null) return;
    lastTimeRef.current = 0;
    frameRef.current = requestAnimationFrame(tick);
  }, [tick]);

  const start = useCallback(() => {
    if (trackedRef.current.length > 0) return;

    const tracked = collect();
    if (tracked.length === 0) return;

    for (const entry of tracked) {
      // The loop owns transform from here; a CSS transition on it would fight every frame.
      entry.element.style.transition = 'none';
      entry.element.style.willChange = 'transform';
      // Belt and braces with the preventDefault in the pointer handler: links and images are
      // natively draggable, and a native drag cannot be picked up by a physics engine.
      entry.element.setAttribute('draggable', 'false');
    }

    trackedRef.current = tracked;
    measureWorld();
    // Once before the first frame, so nothing spends its first quarter second sized from a box
    // that was still animating when it was collected.
    remeasureBodies();
    // The page does not scroll while it is in a heap. Scrolling meant the floor, the ceiling and
    // every origin moved underneath the simulation at once, and most of the bugs in this feature
    // came from that. The world is one screen, fixed at the moment it is switched on.
    frozenScrollRef.current = { x: window.scrollX, y: window.scrollY };
    document.documentElement.classList.add('is-gravity');
    setActive(true);
    startLoop();
  }, [collect, measureWorld, remeasureBodies, startLoop]);

  /**
   * The bubbles shrink while a card is open and the chosen one grows, exactly as they do in the
   * row when gravity is off — the difference is that here they stay in the pile, and shove their
   * neighbours around as they change size.
   *
   * Width and height are transitioned rather than snapped; `remeasureBodies` re-reads each element
   * several times a second, so the bodies follow the animation on their own.
   */
  const resizeBubbles = useCallback(
    (cardOpen: boolean) => {
      for (const tracked of trackedRef.current) {
        const element = tracked.element;
        if (!element.classList.contains('lab-bubble')) continue;

        if (!bubbleSizeRef.current.has(element)) {
          bubbleSizeRef.current.set(element, element.offsetWidth);
        }

        const natural = bubbleSizeRef.current.get(element) ?? element.offsetWidth;
        const size = !cardOpen
          ? natural
          : element.classList.contains('is-selected')
            ? BUBBLE_ROW_SELECTED_SIZE
            : BUBBLE_ROW_SIZE;

        // Only the size is transitioned. The transform belongs to the loop, and a transition on
        // that would fight it every frame.
        element.style.transition =
          'width 0.38s cubic-bezier(0.16, 1, 0.3, 1), height 0.38s cubic-bezier(0.16, 1, 0.3, 1)';
        element.style.width = `${size}px`;
        element.style.height = `${size}px`;
      }

      startLoop();
    },
    [startLoop],
  );

  /**
   * Takes the lab deck into the simulation, whenever it appears or changes.
   *
   * The card is not there when gravity is switched on — it exists only once a bubble has been
   * pressed — so it cannot be part of the initial sweep. Exactly one card is in play at a time:
   * pressing another bubble unmounts this one, which is pruned here, and the new one drops in.
   */
  const captureDeck = useCallback(
    (open: boolean) => {
      if (trackedRef.current.length === 0) return;

      // Anything that has since unmounted goes first, or the pile keeps shoving invisible boxes
      // around where a closed card used to be.
      trackedRef.current = trackedRef.current.filter((tracked) => document.contains(tracked.element));
      nestsRef.current = nestsRef.current.filter((nest) => document.contains(nest.container.element));

      // Bubbles can appear and disappear mid-fall too. Closing a specimen's card while the page is
      // down unmounts the fused bubble — pruned above — and gives back the two labs that were
      // inside it, which were `hidden` and so had no box when the world was first collected. They
      // are adopted here, or they hang in the air while everything around them falls.
      for (const element of document.querySelectorAll<HTMLElement>(BUBBLES)) {
        if (trackedRef.current.some((tracked) => tracked.element === element)) continue;

        const box = element.getBoundingClientRect();
        if (box.width < 8 || box.height < 8) continue;

        const existing = new DOMMatrixReadOnly(getComputedStyle(element).transform);
        const centreX = box.left + box.width / 2;
        const centreY = box.top + box.height / 2;
        const radius = Math.min(box.width, box.height) / 2;

        element.style.transition = 'none';
        element.style.willChange = 'transform';

        trackedRef.current.push({
          element,
          originX: centreX - existing.m41 + window.scrollX,
          originY: centreY - existing.m42 + window.scrollY,
          fixed: false,
          previousTransform: element.style.transform,
          previousTransition: element.style.transition,
          previousWillChange: element.style.willChange,
          body: makeBody({
            id: `late-${trackedRef.current.length}`,
            shape: 'circle',
            x: centreX + window.scrollX,
            y: centreY + window.scrollY,
            hw: radius,
            hh: radius,
            // Thrown clear, the way the rupture throws them when the page is the right way up.
            vx: (trackedRef.current.length % 2 === 0 ? 1 : -1) * 180,
            vy: -140,
            av: 0.6,
          }),
        });
      }

      // Whether a card is open comes from the page's own state, not from the DOM: the card is kept
      // mounted through its exit animation, so a closed one is still there to be counted.
      resizeBubbles(open);

      const known = new Set(trackedRef.current.map((tracked) => tracked.element));
      // Both kinds of card get a world of their own. The lab deck exists only while one is open;
      // a specimen has its own life and is here whenever somebody has made one — which is why
      // this can no longer return early when no lab card is open.
      const cards = [
        ...(open ? document.querySelectorAll<HTMLElement>('.lab-deck__card') : []),
        ...document.querySelectorAll<HTMLElement>('.lab-specimen'),
      ];

      for (const card of cards) {
        if (known.has(card)) continue;

        const box = card.getBoundingClientRect();
        const width = card.offsetWidth;
        const height = card.offsetHeight;
        if (width < 8 || height < 8) continue;

        const centreX = box.left + box.width / 2 + window.scrollX;
        const centreY = box.top + box.height / 2 + window.scrollY;

        card.style.transition = 'none';
        card.style.willChange = 'transform';
        card.setAttribute('draggable', 'false');

        const tracked: Tracked = {
          element: card,
          originX: centreX,
          originY: centreY,
          fixed: false,
          previousTransform: '',
          previousTransition: '',
          previousWillChange: '',
          body: makeBody({
            id: `deck-${trackedRef.current.length}`,
            shape: 'box',
            x: centreX,
            y: centreY,
            hw: width / 2,
            hh: height / 2,
            // A card arrives from above rather than materialising in the pile.
            vy: 220,
            av: 0.25,
          }),
        };

        trackedRef.current.push(tracked);

        // The card gets a world of its own for its contents.
        const items: Tracked[] = [];

        // Prose falls a word at a time inside the card, the same way the page heading does; the
        // badge row, the title and the buttons stay whole, because those hold React-managed
        // children and rewriting their innards under React invites a reconciliation crash.
        const pieces: HTMLElement[] = [];
        // `.lab-btn` is picked up by selector rather than by attribute: the buttons come from the
        // shared LabActions component, which knows nothing about gravity and should not have to.
        card.querySelectorAll<HTMLElement>('[data-gravity-item], .lab-btn').forEach((item) => {
          if (item.hasAttribute('data-gravity-words')) pieces.push(...splitIntoWords(item));
          else pieces.push(item);
        });

        pieces.forEach((item, index) => {
          if (item.offsetWidth < 8 || item.offsetHeight < 8) return;

          item.style.transition = 'none';
          item.style.willChange = 'transform';

          // Laid out inside the card, so offsetLeft/offsetTop are already in the card's own
          // coordinates — no rects, no scroll, nothing to go stale.
          const localX = item.offsetLeft + item.offsetWidth / 2;
          const localY = item.offsetTop + item.offsetHeight / 2;

          items.push({
            element: item,
            originX: localX,
            originY: localY,
            fixed: false,
            previousTransform: item.style.transform,
            previousTransition: item.style.transition,
            previousWillChange: item.style.willChange,
            body: makeBody({
              id: `nest-${index}`,
              shape: 'box',
              x: localX,
              y: localY,
              hw: item.offsetWidth / 2,
              hh: item.offsetHeight / 2,
              vx: (index % 2 === 0 ? 1 : -1) * (20 + index * 8),
              av: ((index % 3) - 1) * 0.5,
            }),
          });
        });

        if (items.length > 0) {
          nestsRef.current.push({
            container: tracked,
            items,
            width: card.offsetWidth,
            height: card.offsetHeight,
          });
        }
      }

      startLoop();
    },
    [resizeBubbles, splitIntoWords, startLoop],
  );

  const toggle = useCallback(() => {
    if (trackedRef.current.length > 0) restore();
    else start();
  }, [restore, start]);

  // Picking things up. One listener on the document rather than one per element: the tracked set
  // changes with the page, and half of it is markup this hook created a moment ago.
  useEffect(() => {
    if (!active) return undefined;

    /**
     * What is under the pointer, according to the physics rather than the DOM.
     *
     * The DOM answer is wrong here in three ways: the pieces overlap, a bubble is a square element
     * with a round face and transparent corners, and the footer's own box lies on top of whatever
     * has fallen onto it — which is why nothing in the footer area could be picked up at all. The
     * smallest body wins, so a word lying on a card is grabbed rather than the card under it.
     */
    const findTracked = (x: number, y: number) => {
      // A card's contents are checked first and in the card's own coordinates: they sit on top of
      // it, so a word is picked up rather than the card it is lying in. Dragging the card itself
      // still works — grab it anywhere its contents are not.
      for (const [nestIndex, nest] of nestsRef.current.entries()) {
        const local = toNestLocal(nest, x, y);
        let bestItem = -1;
        let smallestItem = Infinity;

        nest.items.forEach((item, itemIndex) => {
          if (!pointInBody(local, item.body)) return;
          const area = areaOf(item.body);
          if (area < smallestItem) {
            smallestItem = area;
            bestItem = itemIndex;
          }
        });

        if (bestItem >= 0) {
          return { kind: 'nest' as const, nestIndex, itemIndex: bestItem, body: nest.items[bestItem].body, point: local };
        }
      }

      let best = -1;
      let smallest = Infinity;

      trackedRef.current.forEach((tracked, index) => {
        if (!pointInBody({ x, y }, tracked.body)) return;
        const area = areaOf(tracked.body);
        if (area < smallest) {
          smallest = area;
          best = index;
        }
      });

      return best < 0
        ? null
        : { kind: 'body' as const, index: best, body: trackedRef.current[best].body, point: { x, y } };
    };

    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0) return;

      const pointerX = event.clientX + window.scrollX;
      const pointerY = event.clientY + window.scrollY;
      const found = findTracked(pointerX, pointerY);
      if (!found) return;

      // Without this the browser starts its own drag: an <a> or an <img> is draggable by
      // default, the native drag swallows the pointer stream, and the element stays put while a
      // ghost of the link follows the cursor. That is the "I can only grab the link" bug.
      event.preventDefault();

      // Where the grab landed, in the body's own unrotated frame — measured in whichever world the
      // body lives in. Pulling there rather than at the centre is what lets you spin something
      // around the cursor by its corner.
      const cos = Math.cos(found.body.angle);
      const sin = Math.sin(found.body.angle);
      const dx = found.point.x - found.body.x;
      const dy = found.point.y - found.body.y;

      draggedRef.current = false;
      heldRef.current = {
        pointerId: event.pointerId,
        anchorX: dx * cos + dy * sin,
        anchorY: -dx * sin + dy * cos,
        target:
          found.kind === 'nest'
            ? { kind: 'nest', nestIndex: found.nestIndex, itemIndex: found.itemIndex }
            : { kind: 'body', index: found.index },
      };
      pointerRef.current = { x: pointerX, y: pointerY };
      startLoop();
    };

    const onPointerMove = (event: PointerEvent) => {
      const held = heldRef.current;
      if (!held || held.pointerId !== event.pointerId) return;

      const next = { x: event.clientX + window.scrollX, y: event.clientY + window.scrollY };
      const previous = pointerRef.current;
      if (previous && Math.hypot(next.x - previous.x, next.y - previous.y) > DRAG_SLOP) {
        draggedRef.current = true;
      }
      pointerRef.current = next;
      startLoop();
    };

    const onPointerUp = (event: PointerEvent) => {
      const held = heldRef.current;
      if (!held || held.pointerId !== event.pointerId) return;

      // A press that did not turn into a drag is a click on whatever was grabbed. The browser will
      // send its own click to whatever is topmost in the DOM — which in the footer area is the
      // footer itself, lying over everything that fell onto it — so the click is re-aimed at the
      // element the simulation says was pressed.
      const tracked = held.target.kind === 'body' ? trackedRef.current[held.target.index] : null;
      if (!draggedRef.current && tracked) {
        const under = document.elementFromPoint(event.clientX, event.clientY);
        if (!under || !tracked.element.contains(under)) {
          const control =
            tracked.element.matches('a, button')
              ? tracked.element
              : tracked.element.querySelector<HTMLElement>('a, button');
          window.setTimeout(() => (control ?? tracked.element).click(), 0);
        }
      }

      heldRef.current = null;
      pointerRef.current = null;
      startLoop();
    };

    // A drag that ends over a link would otherwise navigate. A press that never moved still does.
    const onClick = (event: MouseEvent) => {
      if (!draggedRef.current) return;
      draggedRef.current = false;
      event.preventDefault();
      event.stopPropagation();
    };

    document.addEventListener('pointerdown', onPointerDown, true);
    document.addEventListener('pointermove', onPointerMove, true);
    document.addEventListener('pointerup', onPointerUp, true);
    document.addEventListener('pointercancel', onPointerUp, true);
    document.addEventListener('click', onClick, true);

    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true);
      document.removeEventListener('pointermove', onPointerMove, true);
      document.removeEventListener('pointerup', onPointerUp, true);
      document.removeEventListener('pointercancel', onPointerUp, true);
      document.removeEventListener('click', onClick, true);
    };
  }, [active, startLoop]);

  // The page cannot scroll while it is down, but it can still be resized.
  useEffect(() => {
    if (!active) return undefined;

    const onResize = () => {
      measureWorld();
      startLoop();
    };

    // The scroll is frozen by refusing the *inputs*, not with `overflow: hidden`.
    //
    // Hiding the overflow makes the document unscrollable, and Chrome then clamps scrollY back
    // towards zero — so the page silently jumped while the world had already been measured for the
    // view it was leaving, and the pile settled below the bottom of the screen. Keeping the
    // document scrollable and declining every scroll gesture keeps scrollY exactly where it was.
    const refuse = (event: Event) => event.preventDefault();
    const refuseKeys = (event: KeyboardEvent) => {
      const keys = ['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '];
      if (keys.includes(event.key)) event.preventDefault();
    };
    const onScroll = () => {
      const frozen = frozenScrollRef.current;
      if (window.scrollX === frozen.x && window.scrollY === frozen.y) return;

      window.scrollTo(frozen.x, frozen.y);
      // If the document has since become too short to scroll back that far, the old position is
      // unreachable — take the new one as the truth rather than fighting the browser every frame.
      if (Math.abs(window.scrollY - frozen.y) > 2) {
        frozenScrollRef.current = { x: window.scrollX, y: window.scrollY };
      }
      startLoop();
    };

    window.addEventListener('resize', onResize);
    window.addEventListener('wheel', refuse, { passive: false });
    window.addEventListener('touchmove', refuse, { passive: false });
    window.addEventListener('keydown', refuseKeys);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('wheel', refuse);
      window.removeEventListener('touchmove', refuse);
      window.removeEventListener('keydown', refuseKeys);
      window.removeEventListener('scroll', onScroll);
    };
  }, [active, measureWorld, startLoop]);

  useEffect(() => {
    if (!enabled) return undefined;

    const onTrigger = () => toggle();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && trackedRef.current.length > 0) restore();
    };

    window.addEventListener('swymble:gravity', onTrigger);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('swymble:gravity', onTrigger);
      window.removeEventListener('keydown', onKey);
    };
  }, [enabled, restore, toggle]);

  // Leaving /labs unmounts this, which is what resets the page for the reader's return.
  useEffect(() => restore, [restore]);

  return { active, toggle, captureDeck };
}
