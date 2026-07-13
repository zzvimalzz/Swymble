import { useEffect, useRef } from 'react';

/**
 * WaveField — the wave logo made physical. Particles flow along the same
 * curve family as the brand swooshes (three sinusoidal lanes), part around
 * the pointer, and carry the system's light (cyan, with electric-blue deep
 * notes). Canvas 2D on purpose: ~1k particles at 60fps without a WebGL
 * context, DPR-capped, paused off-screen, and reduced-motion renders a
 * single static frame of the curves instead.
 *
 * Doctrine: this is the machine's light — no volt in here, ever.
 */

type WaveFieldProps = {
  variant?: 'hero' | 'finale';
  className?: string;
};

const CYAN = [0, 240, 255] as const;
const ELECTRIC = [47, 107, 255] as const;
const POINTER_RADIUS = 120;

export default function WaveField({ variant = 'hero', className }: WaveFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const host = canvas?.parentElement;
    if (!canvas || !host) {
      return;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let width = 0;
    let height = 0;

    const resize = () => {
      const rect = host.getBoundingClientRect();
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    // Static frame for reduced motion: the three brand curves, faint, once.
    const drawStaticCurves = () => {
      ctx.clearRect(0, 0, width, height);
      for (let lane = 0; lane < 3; lane++) {
        ctx.beginPath();
        ctx.strokeStyle = `rgba(${CYAN[0]}, ${CYAN[1]}, ${CYAN[2]}, ${0.14 - lane * 0.03})`;
        ctx.lineWidth = 1.5;
        const baseY = height * (0.35 + lane * 0.14);
        for (let x = 0; x <= width; x += 8) {
          const y = baseY + Math.sin(x * 0.006 + lane * 1.4) * height * 0.06;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    };

    if (reducedMotion) {
      drawStaticCurves();
      const onResize = () => {
        resize();
        drawStaticCurves();
      };
      window.addEventListener('resize', onResize);
      return () => window.removeEventListener('resize', onResize);
    }

    // Particle count scales with viewport but stays bounded.
    const count = Math.min(1200, Math.max(400, Math.floor(window.innerWidth * 0.6)));
    const px = new Float32Array(count);
    const py = new Float32Array(count);
    const phase = new Float32Array(count);
    const speed = new Float32Array(count);
    const lane = new Uint8Array(count);

    for (let i = 0; i < count; i++) {
      px[i] = Math.random() * width;
      py[i] = Math.random() * height;
      phase[i] = Math.random() * Math.PI * 2;
      speed[i] = 0.4 + Math.random() * 0.9;
      lane[i] = i % 3;
    }

    const pointer = { x: -9999, y: -9999 };
    const onPointerMove = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = event.clientX - rect.left;
      pointer.y = event.clientY - rect.top;
    };
    const onPointerLeave = () => {
      pointer.x = -9999;
      pointer.y = -9999;
    };
    host.addEventListener('pointermove', onPointerMove, { passive: true });
    host.addEventListener('pointerleave', onPointerLeave, { passive: true });

    let raf = 0;
    let running = false;
    let t = 0;

    const frame = () => {
      t += 0.008;
      // Trail fade — ink-coloured wash so trails dissolve into the ground.
      ctx.fillStyle = 'rgba(5, 5, 5, 0.16)';
      ctx.fillRect(0, 0, width, height);

      for (let i = 0; i < count; i++) {
        // Flow: horizontal drift with a sinusoidal vertical current per lane —
        // the swoosh curves as a velocity field.
        const vy = Math.sin(px[i] * 0.006 + t * 2 + phase[i] + lane[i] * 1.4) * 0.6;
        px[i] += speed[i];
        py[i] += vy * speed[i];

        // Pointer repulsion: the sea parts for the hand.
        const dx = px[i] - pointer.x;
        const dy = py[i] - pointer.y;
        const distSq = dx * dx + dy * dy;
        if (distSq < POINTER_RADIUS * POINTER_RADIUS && distSq > 0.01) {
          const dist = Math.sqrt(distSq);
          const force = (1 - dist / POINTER_RADIUS) * 2.2;
          px[i] += (dx / dist) * force;
          py[i] += (dy / dist) * force;
        }

        // Wrap horizontally, drift back vertically.
        if (px[i] > width + 4) {
          px[i] = -4;
          py[i] = Math.random() * height;
        }
        if (py[i] < -4) py[i] = height + 4;
        if (py[i] > height + 4) py[i] = -4;

        const deep = i % 7 === 0;
        const [r, g, b] = deep ? ELECTRIC : CYAN;
        const alpha = deep ? 0.5 : 0.22 + (speed[i] - 0.4) * 0.4;
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
        ctx.fillRect(px[i], py[i], 1.6, 1.6);
      }

      raf = requestAnimationFrame(frame);
    };

    const start = () => {
      if (!running) {
        running = true;
        ctx.clearRect(0, 0, width, height);
        raf = requestAnimationFrame(frame);
      }
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };

    // Only burn frames while actually visible.
    const io = new IntersectionObserver(
      ([entry]) => (entry.isIntersecting ? start() : stop()),
      { rootMargin: '80px' },
    );
    io.observe(host);

    const onResize = () => resize();
    window.addEventListener('resize', onResize);

    return () => {
      stop();
      io.disconnect();
      window.removeEventListener('resize', onResize);
      host.removeEventListener('pointermove', onPointerMove);
      host.removeEventListener('pointerleave', onPointerLeave);
    };
  }, [variant]);

  return <canvas ref={canvasRef} className={`wave-field ${className ?? ''}`.trim()} aria-hidden="true" />;
}
