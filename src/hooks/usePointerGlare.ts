import { useEffect, useRef } from 'react';

/**
 * Writes `--mouse-x`, `--mouse-y` and `--prox` onto an element as the pointer moves near it, so a
 * card can light up on approach with no React re-render per mouse event — the same trick
 * ProximityCard uses on the home page, minus the tilt (a resume that wobbles reads as a toy).
 *
 * One window listener is shared by every subscriber rather than one per card: the resume renders
 * a dozen-plus of these, and a dozen independent pointermove handlers all doing their own
 * getBoundingClientRect is exactly the kind of thing that makes a page feel heavy on a phone.
 */

type Subscriber = (clientX: number, clientY: number) => void;

const subscribers = new Set<Subscriber>();
let lastX = Number.NEGATIVE_INFINITY;
let lastY = Number.NEGATIVE_INFINITY;

const emit = () => {
  subscribers.forEach((notify) => notify(lastX, lastY));
};

const handlePointerMove = (event: PointerEvent) => {
  lastX = event.clientX;
  lastY = event.clientY;
  emit();
};

// Scroll and resize move the *element* under a stationary pointer, so the glare has to be
// recomputed from the last known position or it sticks to the wrong spot on the card.
const handleViewportChange = () => emit();

const subscribe = (notify: Subscriber) => {
  if (subscribers.size === 0) {
    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('scroll', handleViewportChange, { passive: true });
    window.addEventListener('resize', handleViewportChange, { passive: true });
  }
  subscribers.add(notify);

  return () => {
    subscribers.delete(notify);
    if (subscribers.size === 0) {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('scroll', handleViewportChange);
      window.removeEventListener('resize', handleViewportChange);
    }
  };
};

/** Distance (px) from the element's centre at which it stops reacting at all. */
const MAX_DIST = 460;

export default function usePointerGlare<T extends HTMLElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) {
      return;
    }

    // Nothing hovers on a touchscreen, so there is no proximity to track and no reason to run a
    // listener; the CSS falls back to its --prox: 0 resting state.
    if (window.matchMedia('(pointer: coarse)').matches) {
      return;
    }

    return subscribe((clientX, clientY) => {
      const rect = element.getBoundingClientRect();
      const distance = Math.hypot(
        clientX - (rect.left + rect.width / 2),
        clientY - (rect.top + rect.height / 2),
      );
      const proximity = Math.max(0, 1 - distance / MAX_DIST) ** 2;

      element.style.setProperty('--mouse-x', `${clientX - rect.left}px`);
      element.style.setProperty('--mouse-y', `${clientY - rect.top}px`);
      element.style.setProperty('--prox', `${proximity}`);
    });
  }, []);

  return ref;
}
