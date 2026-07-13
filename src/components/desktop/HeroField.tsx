import { useEffect, useRef } from 'react';
import { useReducedMotion } from 'framer-motion';

// Kept deliberately small — this mounts eagerly (it's above the fold), unlike
// TechUniverse's lazy WebGL scene, so the field is plain canvas 2D with a low
// element count rather than another Three.js instance on the critical path.
const STAR_COUNT = 500;
const NODE_COUNT = 16;
const LINK_DISTANCE = 150;
const NODE_REPEL_RADIUS = 200;
const NODE_REPEL_STRENGTH = 2600;
const NODE_MAX_SPEED = 260;
const NODE_EASE_RATE = 3;
const STAR_REPEL_RADIUS = 170;
const STAR_REPEL_STRENGTH = 1100;
const STAR_MAX_SPEED = 500;
const STAR_EASE_RATE = 4.5;
const MAX_DPR = 1.5;

type Star = {
  x: number;
  y: number;
  r: number;
  baseAlpha: number;
  twinkleSpeed: number;
  twinklePhase: number;
  vx: number;
  vy: number;
  driftVX: number;
  driftVY: number;
};

type Node = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  driftVX: number;
  driftVY: number;
};

export default function HeroField() {
  const fieldRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    const field = fieldRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!field || !canvas || !ctx) {
      return;
    }

    let width = 0;
    let height = 0;
    let fieldRect = field.getBoundingClientRect();
    let stars: Star[] = [];
    let nodes: Node[] = [];

    const seedField = () => {
      stars = Array.from({ length: STAR_COUNT }, () => {
        const driftVX = (Math.random() - 0.5) * 22;
        const driftVY = (Math.random() - 0.5) * 22;
        return {
          x: Math.random() * width,
          y: Math.random() * height,
          r: Math.random() * 1.4 + 0.3,
          baseAlpha: Math.random() * 0.5 + 0.25,
          twinkleSpeed: Math.random() * 0.8 + 0.3,
          twinklePhase: Math.random() * Math.PI * 2,
          vx: driftVX,
          vy: driftVY,
          driftVX,
          driftVY,
        };
      });

      nodes = Array.from({ length: NODE_COUNT }, () => {
        const driftVX = (Math.random() - 0.5) * 26;
        const driftVY = (Math.random() - 0.5) * 26;
        return {
          x: Math.random() * width,
          y: Math.random() * height,
          vx: driftVX,
          vy: driftVY,
          driftVX,
          driftVY,
        };
      });
    };

    const resize = () => {
      fieldRect = field.getBoundingClientRect();
      width = fieldRect.width;
      height = fieldRect.height;
      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seedField();
    };

    resize();

    // Raw pointer position is captured on every move (cheap number assignment); the
    // relatively expensive parts — bounding-rect math, canvas draws, style writes —
    // all happen once per animation frame in the loop below, not once per event.
    let lastClientX = -9999;
    let lastClientY = -9999;
    let parallaxX = 0;
    let parallaxY = 0;

    const handlePointerMove = (event: PointerEvent) => {
      lastClientX = event.clientX;
      lastClientY = event.clientY;
    };

    let resizeFrame = 0;
    const scheduleResize = () => {
      if (resizeFrame) {
        return;
      }
      resizeFrame = window.requestAnimationFrame(() => {
        resizeFrame = 0;
        resize();
      });
    };

    let scrollFrame = 0;
    const handleScroll = () => {
      if (scrollFrame) {
        return;
      }
      scrollFrame = window.requestAnimationFrame(() => {
        scrollFrame = 0;
        fieldRect = field.getBoundingClientRect();
      });
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('resize', scheduleResize);
    window.addEventListener('scroll', handleScroll, { passive: true });

    let rafId = 0;
    let lastTime = performance.now();

    const draw = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.05);
      lastTime = time;

      const pointerX = lastClientX - fieldRect.left;
      const pointerY = lastClientY - fieldRect.top;
      const pointerActive = lastClientX > -9999;

      ctx.clearRect(0, 0, width, height);

      const margin = 40;

      for (const star of stars) {
        if (pointerActive) {
          const dx = star.x - pointerX;
          const dy = star.y - pointerY;
          const dist = Math.hypot(dx, dy) || 1;

          if (dist < STAR_REPEL_RADIUS) {
            const force = (1 - dist / STAR_REPEL_RADIUS) * STAR_REPEL_STRENGTH;
            star.vx += (dx / dist) * force * dt;
            star.vy += (dy / dist) * force * dt;
          }
        }

        // Ease back toward its own ambient drift fast (never toward a stop, so the
        // field keeps drifting continuously) — a high rate here is what keeps a
        // cursor-cleared patch from staying empty: pushed stars shed their outward
        // velocity quickly instead of coasting away for a second or two.
        star.vx += (star.driftVX - star.vx) * STAR_EASE_RATE * dt;
        star.vy += (star.driftVY - star.vy) * STAR_EASE_RATE * dt;

        const starSpeed = Math.hypot(star.vx, star.vy);
        if (starSpeed > STAR_MAX_SPEED) {
          const scale = STAR_MAX_SPEED / starSpeed;
          star.vx *= scale;
          star.vy *= scale;
        }

        star.x += star.vx * dt;
        star.y += star.vy * dt;

        if (star.x < -margin) star.x = width + margin;
        if (star.x > width + margin) star.x = -margin;
        if (star.y < -margin) star.y = height + margin;
        if (star.y > height + margin) star.y = -margin;

        const twinkle = 0.5 + 0.5 * Math.sin(time * 0.001 * star.twinkleSpeed + star.twinklePhase);
        ctx.globalAlpha = star.baseAlpha * (0.5 + 0.5 * twinkle);
        ctx.fillStyle = '#f0f0f0';
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
        ctx.fill();
      }

      for (const node of nodes) {
        if (pointerActive) {
          const dx = node.x - pointerX;
          const dy = node.y - pointerY;
          const dist = Math.hypot(dx, dy) || 1;

          if (dist < NODE_REPEL_RADIUS) {
            const force = (1 - dist / NODE_REPEL_RADIUS) * NODE_REPEL_STRENGTH;
            node.vx += (dx / dist) * force * dt;
            node.vy += (dy / dist) * force * dt;
          }
        }

        // Ease velocity back toward each node's own ambient drift rather than to a
        // full stop, so the field keeps drifting continuously at rest too.
        node.vx += (node.driftVX - node.vx) * NODE_EASE_RATE * dt;
        node.vy += (node.driftVY - node.vy) * NODE_EASE_RATE * dt;

        const nodeSpeed = Math.hypot(node.vx, node.vy);
        if (nodeSpeed > NODE_MAX_SPEED) {
          const scale = NODE_MAX_SPEED / nodeSpeed;
          node.vx *= scale;
          node.vy *= scale;
        }

        node.x += node.vx * dt;
        node.y += node.vy * dt;

        if (node.x < -margin) node.x = width + margin;
        if (node.x > width + margin) node.x = -margin;
        if (node.y < -margin) node.y = height + margin;
        if (node.y > height + margin) node.y = -margin;
      }

      ctx.globalAlpha = 1;
      for (let i = 0; i < nodes.length; i += 1) {
        for (let j = i + 1; j < nodes.length; j += 1) {
          const a = nodes[i];
          const b = nodes[j];
          const dist = Math.hypot(a.x - b.x, a.y - b.y);
          if (dist < LINK_DISTANCE) {
            ctx.strokeStyle = `rgba(0, 240, 255, ${0.22 * (1 - dist / LINK_DISTANCE)})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      for (const node of nodes) {
        ctx.fillStyle = 'rgba(0, 240, 255, 0.55)';
        ctx.beginPath();
        ctx.arc(node.x, node.y, 1.8, 0, Math.PI * 2);
        ctx.fill();
      }

      if (pointerActive) {
        const targetPX = (lastClientX / window.innerWidth - 0.5) * 2;
        const targetPY = (lastClientY / window.innerHeight - 0.5) * 2;
        parallaxX += (targetPX * 18 - parallaxX) * Math.min(dt * 2, 1);
        parallaxY += (targetPY * 14 - parallaxY) * Math.min(dt * 2, 1);
        field.style.setProperty('--hero-parallax-x', parallaxX.toFixed(2));
        field.style.setProperty('--hero-parallax-y', parallaxY.toFixed(2));
      }

      rafId = window.requestAnimationFrame(draw);
    };

    const handleVisibility = () => {
      if (document.hidden) {
        window.cancelAnimationFrame(rafId);
        rafId = 0;
      } else if (!rafId && !prefersReducedMotion) {
        lastTime = performance.now();
        rafId = window.requestAnimationFrame(draw);
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);

    if (prefersReducedMotion) {
      // One static frame: the field stays visible for depth, just not animating —
      // continuous ambient motion and cursor reactivity are what reduced-motion asks
      // us to drop, not the decoration itself.
      draw(performance.now());
    } else {
      rafId = window.requestAnimationFrame(draw);
    }

    return () => {
      window.cancelAnimationFrame(rafId);
      if (resizeFrame) {
        window.cancelAnimationFrame(resizeFrame);
      }
      if (scrollFrame) {
        window.cancelAnimationFrame(scrollFrame);
      }
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('resize', scheduleResize);
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [prefersReducedMotion]);

  return (
    <div className="hero-field" ref={fieldRef} aria-hidden="true">
      <canvas ref={canvasRef} className="hero-field-canvas" />
      <div className="hero-field-nebula" />
    </div>
  );
}
