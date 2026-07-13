import { useEffect, useMemo, useRef } from 'react';
import { useReducedMotion } from 'framer-motion';

type HeroWordmarkProps = {
  text: string;
};

// Distance (px) at which a letter starts feeling the cursor's field, how far it can be
// pushed at the center of that field, and the spring constants pulling it back home.
const REPEL_RADIUS = 380;
const MAX_DISPLACEMENT = 1000;
const STIFFNESS = 150;
const DAMPING = 16;

type LetterState = {
  el: HTMLSpanElement;
  restX: number;
  restY: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
};

export default function HeroWordmark({ text }: HeroWordmarkProps) {
  const containerRef = useRef<HTMLSpanElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const letters = useMemo(() => Array.from(text), [text]);

  useEffect(() => {
    const container = containerRef.current;
    // The desktop view itself is already gated to (hover: hover) and (pointer: fine)
    // devices (see useDeviceView) — this check is a second, cheap line of defense in
    // case that ever changes, mirroring the same guard in GlitchCursor.
    const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (!container || prefersReducedMotion || !canHover) {
      return;
    }

    const letterEls = Array.from(container.querySelectorAll<HTMLSpanElement>('[data-letter]'));
    if (!letterEls.length) {
      return;
    }

    const states: LetterState[] = letterEls.map((el) => ({
      el,
      restX: 0,
      restY: 0,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
    }));

    // Reads each letter's current painted center and backs out its untransformed
    // ("rest") position by subtracting whatever offset is already applied. That lets
    // us re-measure after scroll/resize without ever reading a rect *after* writing a
    // transform in the same frame, which would create a feedback loop.
    const measure = () => {
      for (const state of states) {
        const rect = state.el.getBoundingClientRect();
        state.restX = rect.left + rect.width / 2 - state.x;
        state.restY = rect.top + rect.height / 2 - state.y;
      }
    };

    measure();

    let pointerX = -9999;
    let pointerY = -9999;
    let pointerActive = false;

    const handlePointerMove = (event: PointerEvent) => {
      pointerX = event.clientX;
      pointerY = event.clientY;
      pointerActive = true;
    };

    const handlePointerLeave = () => {
      pointerActive = false;
    };

    const handleResize = () => measure();

    let scrollFrame = 0;
    const handleScroll = () => {
      if (scrollFrame) {
        return;
      }
      scrollFrame = window.requestAnimationFrame(() => {
        scrollFrame = 0;
        measure();
      });
    };

    let rafId = 0;
    let lastTime = performance.now();

    const tick = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.05);
      lastTime = time;

      for (const state of states) {
        let targetX = 0;
        let targetY = 0;

        if (pointerActive) {
          const centerX = state.restX + state.x;
          const centerY = state.restY + state.y;
          const dx = centerX - pointerX;
          const dy = centerY - pointerY;
          const dist = Math.hypot(dx, dy) || 1;

          if (dist < REPEL_RADIUS) {
            const pull = (1 - dist / REPEL_RADIUS) ** 1.1;
            targetX = (dx / dist) * MAX_DISPLACEMENT * pull;
            targetY = (dy / dist) * MAX_DISPLACEMENT * pull;
          }
        }

        const ax = (targetX - state.x) * STIFFNESS - state.vx * DAMPING;
        const ay = (targetY - state.y) * STIFFNESS - state.vy * DAMPING;
        state.vx += ax * dt;
        state.vy += ay * dt;
        state.x += state.vx * dt;
        state.y += state.vy * dt;

        state.el.style.transform = `translate3d(${state.x.toFixed(2)}px, ${state.y.toFixed(2)}px, 0)`;
      }

      rafId = window.requestAnimationFrame(tick);
    };

    rafId = window.requestAnimationFrame(tick);

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerleave', handlePointerLeave, { passive: true });
    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.cancelAnimationFrame(rafId);
      if (scrollFrame) {
        window.cancelAnimationFrame(scrollFrame);
      }
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerleave', handlePointerLeave);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll);

      for (const state of states) {
        state.el.style.transform = '';
      }
    };
  }, [letters, prefersReducedMotion]);

  return (
    <span className="hero-wordmark" ref={containerRef} aria-hidden="true">
      {letters.map((char, index) =>
        char === ' ' ? (
          <span key={index} className="hero-letter-space">&nbsp;</span>
        ) : (
          <span key={index} data-letter={char} className="hero-letter">
            {char}
          </span>
        ),
      )}
    </span>
  );
}
