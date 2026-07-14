import { useEffect, useRef } from 'react';
import './BB8.css';
import { Pen } from './shared/pen';
import { createBB8State, moveBB8, BB8_COLOR_THEMES, BB8_THEME_ORDER } from './droids/bb8/bb8State';
import { drawBB8 } from './droids/bb8/bb8DrawHead';
import { createBB8World, updateBB8World, WORLD_CANVAS_H, WORLD_GROUND_Y } from './world/bb8World';
import {
  drawSky,
  drawStars,
  drawSuns,
  drawFarPeaks,
  drawFarDunes,
  drawNearDunes,
  drawLandmarks,
  drawGround,
  drawGroundProps,
  drawDust,
} from './world/bb8WorldDraw';
import { WORLD_THEMES } from './world/worldThemes';

// BB-8 — ported from a ProcessingJS sketch (Gray Wolf / Khan Academy, itself
// based on codepen.io/bullerb/pen/gMpxNZ): move the pointer to steer BB-8
// (speed follows how far the pointer is from BB-8's own current screen
// position). Click/tap cycles BB-8's color theme and re-rolls the world to a
// random one of the four biomes in world/worldThemes.ts.
//
// The scene is infinite: BB-8's on-screen x position is fixed (it never
// approaches an edge), and instead world/bb8World.ts scrolls its own layers
// underneath it by exactly its speed every frame — it can roll in either
// direction forever. See shared/pen.ts for how the Processing-style draw
// calls were carried over, and shared/steering.ts for the pointer-follow
// math.

const OFFSET_Y = -221;
/** BB-8 is drawn centered on this local x (see bb8State.x). */
const DROID_CENTER_X = 295;

function pickRandomThemeIndex(excludeIndex: number) {
  if (WORLD_THEMES.length <= 1) return 0;
  let next = Math.floor(Math.random() * WORLD_THEMES.length);
  while (next === excludeIndex) next = Math.floor(Math.random() * WORLD_THEMES.length);
  return next;
}

export default function BB8() {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const stageEl = stageRef.current;
    const canvasEl = canvasRef.current;
    if (!stageEl || !canvasEl) return;
    const ctx2d = canvasEl.getContext('2d');
    if (!ctx2d) return;

    const stage: HTMLDivElement = stageEl;
    const canvas: HTMLCanvasElement = canvasEl;
    const ctx: CanvasRenderingContext2D = ctx2d;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const state = createBB8State();
    let colorThemeIndex = 0;
    let worldThemeIndex = 0;

    let pointerActive = false;
    let pointerCanvasX = 0;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let raf: number | null = null;
    let destroyed = false;

    let canvasW = 900;
    // Fixed screen position — BB-8 never moves relative to the canvas; the
    // world scrolls under it instead, so there's no edge to reach.
    let travelX = canvasW / 2 - DROID_CENTER_X;

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = stage.getBoundingClientRect();
      canvasW = Math.max(320, Math.min(rect.width || 900, 2400));
      travelX = canvasW / 2 - DROID_CENTER_X;
      canvas.width = Math.round(canvasW * dpr);
      canvas.height = Math.round(WORLD_CANVAS_H * dpr);
      canvas.style.width = `${canvasW}px`;
      canvas.style.height = `${WORLD_CANVAS_H}px`;
    }

    // Measure the real (often full-page-width) stage before seeding the
    // world — creating it against the 900px placeholder above would only
    // populate stars/dunes/props across the left slice of a much wider
    // canvas, leaving the rest of the sky empty until slow parallax
    // scrolling gradually wrapped enough elements into view.
    resize();
    const world = createBB8World(canvasW);

    function frame() {
      const theme = WORLD_THEMES[worldThemeIndex];

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, canvasW, WORLD_CANVAS_H);

      drawSky(ctx, canvasW, WORLD_GROUND_Y, theme);
      drawStars(ctx, world, theme);
      drawSuns(ctx, world, theme);
      drawFarPeaks(ctx, world, WORLD_GROUND_Y, theme);
      drawFarDunes(ctx, world, WORLD_GROUND_Y, theme);
      drawNearDunes(ctx, world, WORLD_GROUND_Y, theme);
      drawLandmarks(ctx, world, WORLD_GROUND_Y, theme);
      drawGround(ctx, canvasW, WORLD_CANVAS_H, WORLD_GROUND_Y, theme);
      drawGroundProps(ctx, world, WORLD_GROUND_Y, WORLD_CANVAS_H, theme);
      drawDust(ctx, world);

      ctx.save();
      ctx.translate(travelX, OFFSET_Y);
      drawBB8(new Pen(ctx), state);
      ctx.restore();

      const referenceX = travelX + DROID_CENTER_X;
      moveBB8(state, pointerActive ? pointerCanvasX : null, referenceX, canvasW * 0.5);

      updateBB8World(world, canvasW, state.speed, referenceX);
    }

    function loop() {
      if (destroyed) return;
      frame();
      raf = window.requestAnimationFrame(loop);
    }

    function onPointerMove(event: PointerEvent) {
      const rect = canvas.getBoundingClientRect();
      pointerCanvasX = ((event.clientX - rect.left) / rect.width) * canvasW;
      pointerActive = true;
    }

    function onPointerLeave() {
      pointerActive = false;
    }

    function onActivate() {
      colorThemeIndex = (colorThemeIndex + 1) % BB8_THEME_ORDER.length;
      state.colors = BB8_COLOR_THEMES[BB8_THEME_ORDER[colorThemeIndex]];
      worldThemeIndex = pickRandomThemeIndex(worldThemeIndex);
      if (reducedMotion) frame();
    }

    window.addEventListener('resize', resize);
    stage.addEventListener('pointerdown', onActivate);
    if (!reducedMotion) {
      stage.addEventListener('pointermove', onPointerMove);
      stage.addEventListener('pointerleave', onPointerLeave);
      raf = window.requestAnimationFrame(loop);
    } else {
      frame();
    }

    return () => {
      destroyed = true;
      if (raf !== null) window.cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      stage.removeEventListener('pointerdown', onActivate);
      stage.removeEventListener('pointermove', onPointerMove);
      stage.removeEventListener('pointerleave', onPointerLeave);
    };
  }, []);

  return (
    <div className="bb8">
      <p className="bb8__caption">WHILE YOU'RE HERE — MOVE YOUR MOUSE TO STEER, CLICK TO CHANGE COLOR & WORLD</p>
      <div
        ref={stageRef}
        className="bb8__stage"
        role="img"
        aria-label="Animated BB-8 droid that rolls across an endless scene toward the cursor"
      >
        <canvas ref={canvasRef} className="bb8__canvas" />
      </div>
    </div>
  );
}
