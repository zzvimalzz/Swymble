import { useEffect, useRef } from 'react';

const HOVER_SELECTOR = 'a, button, input, select, textarea, label, [data-cursor]';
const HOVER_COLORS = ['var(--sw-accent-volt)', 'var(--sw-accent-neon)', 'var(--sw-accent-cyan)'];
const IDLE_COLOR = 'var(--sw-accent-volt)';

let innerElement: HTMLDivElement | null = null;
let hoveringNow = false;
let colorIndex = 0;

const applyHoverState = (hovering: boolean) => {
  if (!innerElement || hovering === hoveringNow) {
    return;
  }

  hoveringNow = hovering;
  innerElement.classList.toggle('hovering', hovering);

  if (hovering) {
    colorIndex = (colorIndex + 1) % HOVER_COLORS.length;
    innerElement.style.backgroundColor = HOVER_COLORS[colorIndex];
  } else {
    innerElement.style.backgroundColor = IDLE_COLOR;
  }
};

/**
 * Imperative API for consumers outside this component's own DOM listeners
 * (e.g. the Three.js canvas raycaster). Safe no-op when the cursor is unmounted.
 */
export function setCursorHover(hovering: boolean) {
  applyHoverState(hovering);
}

export default function GlitchCursor() {
  const innerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (!canHover) {
      return;
    }

    const inner = innerRef.current;
    if (!inner) {
      return;
    }

    innerElement = inner;
    hoveringNow = false;
    colorIndex = 0;

    let lastX = window.innerWidth / 2;
    let lastY = window.innerHeight / 2;
    let hasMoved = false;
    let scrollFrame = 0;

    // `.glitch-cursor` is itself `position: fixed` and owns its own `transform` (position +
    // self-centering offset combined into one value) rather than being positioned by a
    // separate `position: fixed` wrapper around a plain inner element. That two-div split is
    // the more "obvious" way to compose "move to point" (outer) with "center on point" (inner),
    // but a plain (non-positioned) descendant of a `position: fixed` ancestor does not correctly
    // composite `mix-blend-mode` against the rest of the page in Chromium/Edge — it paints as a
    // flat, non-blending shape instead. Making the blended element itself the `position: fixed`
    // one (confirmed by isolated before/after screenshots) fixes the blend; the trade-off is
    // that the centering offset (circle vs. social-hover polygon) has to be picked in JS instead
    // of living in a CSS class rule, since this element's `transform` is now JS-owned.
    const applyTransform = () => {
      const centerOffset = inner.classList.contains('social-hover') ? '-10%, -10%' : '-50%, -50%';
      inner.style.transform = `translate3d(${lastX}px, ${lastY}px, 0) translate(${centerOffset})`;
    };

    const setSocialHover = (isSocial: boolean) => {
      inner.classList.toggle('social-hover', isSocial);
      applyTransform();
    };

    const evaluateTarget = (target: Element | null) => {
      if (!target) {
        applyHoverState(false);
        setSocialHover(false);
        return;
      }

      applyHoverState(Boolean(target.closest(HOVER_SELECTOR)));
      setSocialHover(Boolean(target.closest('.social-link')));
    };

    const handlePointerMove = (event: PointerEvent) => {
      lastX = event.clientX;
      lastY = event.clientY;

      applyTransform();

      if (!hasMoved) {
        hasMoved = true;
        inner.classList.remove('is-hidden');
      }
    };

    const handlePointerOver = (event: PointerEvent) => {
      evaluateTarget(event.target as Element | null);
    };

    const handleMouseLeaveWindow = () => {
      inner.classList.add('is-hidden');
    };

    const handleMouseEnterWindow = () => {
      if (hasMoved) {
        inner.classList.remove('is-hidden');
      }
    };

    const handleScroll = () => {
      if (scrollFrame) {
        return;
      }

      scrollFrame = window.requestAnimationFrame(() => {
        scrollFrame = 0;
        evaluateTarget(document.elementFromPoint(lastX, lastY));
      });
    };

    inner.classList.add('is-hidden');

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    document.addEventListener('pointerover', handlePointerOver, { passive: true });
    window.addEventListener('scroll', handleScroll, { passive: true });
    document.documentElement.addEventListener('mouseleave', handleMouseLeaveWindow);
    document.documentElement.addEventListener('mouseenter', handleMouseEnterWindow);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerover', handlePointerOver);
      window.removeEventListener('scroll', handleScroll);
      document.documentElement.removeEventListener('mouseleave', handleMouseLeaveWindow);
      document.documentElement.removeEventListener('mouseenter', handleMouseEnterWindow);
      if (scrollFrame) {
        window.cancelAnimationFrame(scrollFrame);
      }
      innerElement = null;
    };
  }, []);

  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    return null;
  }

  return <div ref={innerRef} className="glitch-cursor is-hidden" />;
}
