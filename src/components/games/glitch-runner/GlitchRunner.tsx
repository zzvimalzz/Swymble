import { useEffect, useRef } from 'react';

import './GlitchRunner.css';

/**
 * GLITCH RUNNER — self-contained Chrome-dino-style canvas mini game for the 404 page.
 * No external dependencies. All game state lives in refs so React never re-renders
 * mid-game; the canvas is the only thing that updates per frame.
 */

const BEST_SCORE_KEY = 'swymble-glitch-runner-best';

const COLOR_VOLT = '#EFFF04';
const COLOR_NEON = '#FF003C';
const COLOR_CYAN = '#00F0FF';

const MAX_WIDTH = 720;
const STAGE_HEIGHT = 200;
const GROUND_OFFSET = 28;
const RUNNER_SIZE = 26;
const RUNNER_X = 36;
const GRAVITY = 2500;
const JUMP_VELOCITY = -770;
const BASE_SPEED = 300;
const MAX_SPEED = 640;
const SPEED_PER_SCORE = 0.11;
const HIT_FORGIVENESS = 4;

type Phase = 'idle' | 'running' | 'gameover';

interface Obstacle {
  x: number;
  width: number;
  height: number;
}

export default function GlitchRunner() {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const wrapperEl = wrapperRef.current;
    const canvasEl = canvasRef.current;
    if (!wrapperEl || !canvasEl) return;
    const ctx2d = canvasEl.getContext('2d');
    if (!ctx2d) return;

    // Non-null local aliases so TS narrowing survives into nested closures below.
    const stage: HTMLDivElement = wrapperEl;
    const canvas: HTMLCanvasElement = canvasEl;
    const ctx: CanvasRenderingContext2D = ctx2d;

    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    let reducedMotion = reducedMotionQuery.matches;

    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let cssWidth = MAX_WIDTH;
    let cssHeight = STAGE_HEIGHT;
    let groundY = cssHeight - GROUND_OFFSET;

    const best = { value: Number(window.localStorage.getItem(BEST_SCORE_KEY)) || 0 };

    const runner = {
      y: groundY - RUNNER_SIZE,
      vy: 0,
      grounded: true,
    };

    let obstacles: Obstacle[] = [];
    let phase: Phase = 'idle';
    let score = 0;
    let distanceSinceSpawn = 0;
    let nextGap = 260 + Math.random() * 200;
    let flashTimeout: number | null = null;
    let mainRaf: number | null = null;
    let idleRaf: number | null = null;
    let lastTime = performance.now();
    let destroyed = false;

    function resetGame() {
      obstacles = [];
      score = 0;
      distanceSinceSpawn = 0;
      nextGap = 260 + Math.random() * 200;
      runner.y = groundY - RUNNER_SIZE;
      runner.vy = 0;
      runner.grounded = true;
      phase = 'running';
    }

    function jump() {
      if (phase === 'running' && runner.grounded) {
        runner.vy = JUMP_VELOCITY;
        runner.grounded = false;
      }
    }

    function handleInput() {
      if (phase === 'gameover') {
        resetGame();
      } else if (phase === 'idle') {
        stopIdleLoop();
        phase = 'running';
      }
      if (phase === 'running') {
        jump();
      }
      ensureMainLoop();
    }

    function currentSpeed() {
      return Math.min(BASE_SPEED + score * SPEED_PER_SCORE, MAX_SPEED);
    }

    function updatePhysics(dt: number) {
      runner.vy += GRAVITY * dt;
      runner.y += runner.vy * dt;
      const restY = groundY - RUNNER_SIZE;
      if (runner.y >= restY) {
        runner.y = restY;
        runner.vy = 0;
        runner.grounded = true;
      }
    }

    function updateObstacles(dt: number) {
      const speed = currentSpeed();
      distanceSinceSpawn += speed * dt;
      if (distanceSinceSpawn >= nextGap) {
        distanceSinceSpawn = 0;
        nextGap = 240 + Math.random() * 260;
        const height = 26 + Math.random() * 40;
        const width = 16 + Math.random() * 22;
        obstacles.push({ x: cssWidth + width, width, height });
      }
      for (const obstacle of obstacles) {
        obstacle.x -= speed * dt;
      }
      obstacles = obstacles.filter((obstacle) => obstacle.x + obstacle.width > -4);
      score += speed * dt * 0.05;
    }

    function checkCollisions() {
      const runnerBox = {
        x: RUNNER_X + HIT_FORGIVENESS,
        y: runner.y + HIT_FORGIVENESS,
        w: RUNNER_SIZE - HIT_FORGIVENESS * 2,
        h: RUNNER_SIZE - HIT_FORGIVENESS * 2,
      };
      for (const obstacle of obstacles) {
        const obstacleBox = {
          x: obstacle.x + HIT_FORGIVENESS * 0.6,
          y: groundY - obstacle.height + HIT_FORGIVENESS * 0.6,
          w: obstacle.width - HIT_FORGIVENESS * 1.2,
          h: obstacle.height - HIT_FORGIVENESS * 0.6,
        };
        const overlap =
          runnerBox.x < obstacleBox.x + obstacleBox.w &&
          runnerBox.x + runnerBox.w > obstacleBox.x &&
          runnerBox.y < obstacleBox.y + obstacleBox.h &&
          runnerBox.y + runnerBox.h > obstacleBox.y;
        if (overlap) {
          handleGameOver();
          return;
        }
      }
    }

    function handleGameOver() {
      phase = 'gameover';
      const finalScore = Math.floor(score);
      if (finalScore > best.value) {
        best.value = finalScore;
        window.localStorage.setItem(BEST_SCORE_KEY, String(finalScore));
      }
      stage.classList.remove('is-glitching');
      // Force reflow so the animation can retrigger on consecutive deaths.
      void stage.offsetWidth;
      stage.classList.add('is-glitching');
      if (flashTimeout) window.clearTimeout(flashTimeout);
      flashTimeout = window.setTimeout(() => {
        stage.classList.remove('is-glitching');
      }, 280);
    }

    function drawGround() {
      ctx.strokeStyle = 'rgba(255,255,255,0.16)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, groundY + 0.5);
      ctx.lineTo(cssWidth, groundY + 0.5);
      ctx.stroke();
    }

    function drawObstacles() {
      ctx.fillStyle = COLOR_NEON;
      for (const obstacle of obstacles) {
        ctx.fillRect(obstacle.x, groundY - obstacle.height, obstacle.width, obstacle.height);
      }
    }

    function drawRunner() {
      // Subtle glitch trail behind the runner.
      const trailColors = [COLOR_CYAN, COLOR_NEON, COLOR_VOLT];
      for (let i = 1; i <= 3; i += 1) {
        ctx.globalAlpha = 0.12 / i;
        ctx.fillStyle = trailColors[i - 1];
        ctx.fillRect(RUNNER_X - i * 6, runner.y, RUNNER_SIZE, RUNNER_SIZE);
      }
      ctx.globalAlpha = 1;
      ctx.fillStyle = COLOR_VOLT;
      ctx.fillRect(RUNNER_X, runner.y, RUNNER_SIZE, RUNNER_SIZE);
    }

    function drawScore() {
      ctx.fillStyle = COLOR_CYAN;
      ctx.font = '600 13px "JetBrains Mono", monospace';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText(String(Math.floor(score)).padStart(5, '0'), cssWidth - 10, 20);
    }

    function drawIdle(now: number) {
      let alpha = 1;
      if (!reducedMotion) {
        alpha = 0.55 + 0.45 * Math.sin(now * 0.004);
      }
      ctx.fillStyle = `rgba(255,255,255,${alpha})`;
      ctx.font = '600 13px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('PRESS SPACE OR TAP TO RUN', cssWidth / 2, cssHeight / 2);
    }

    function drawGameOver() {
      ctx.fillStyle = 'rgba(5,5,8,0.55)';
      ctx.fillRect(0, 0, cssWidth, cssHeight);

      ctx.textAlign = 'center';
      ctx.fillStyle = COLOR_NEON;
      ctx.font = '700 18px "JetBrains Mono", monospace';
      ctx.textBaseline = 'middle';
      ctx.fillText('GAME OVER', cssWidth / 2, cssHeight / 2 - 26);

      ctx.fillStyle = COLOR_CYAN;
      ctx.font = '600 13px "JetBrains Mono", monospace';
      ctx.fillText(
        `SCORE ${String(Math.floor(score)).padStart(5, '0')}   BEST ${String(best.value).padStart(5, '0')}`,
        cssWidth / 2,
        cssHeight / 2 + 4,
      );

      ctx.fillStyle = COLOR_VOLT;
      ctx.font = '600 12px "JetBrains Mono", monospace';
      ctx.fillText('TAP TO RETRY', cssWidth / 2, cssHeight / 2 + 30);
    }

    function render(now: number) {
      ctx.clearRect(0, 0, cssWidth, cssHeight);
      drawGround();
      drawObstacles();
      drawRunner();
      drawScore();
      if (phase === 'idle') drawIdle(now);
      if (phase === 'gameover') drawGameOver();
    }

    function mainLoop(now: number) {
      if (destroyed) return;
      const dt = Math.min((now - lastTime) / 1000, 0.032);
      lastTime = now;
      if (phase === 'running') {
        updatePhysics(dt);
        updateObstacles(dt);
        checkCollisions();
      }
      render(now);
      // Only keep looping while actively running — the idle and gameover screens
      // are static, so a single render is enough until the next input or resize.
      if (phase === 'running') {
        mainRaf = window.requestAnimationFrame(mainLoop);
      } else {
        mainRaf = null;
      }
    }

    function ensureMainLoop() {
      if (mainRaf === null && !destroyed) {
        lastTime = performance.now();
        mainRaf = window.requestAnimationFrame(mainLoop);
      }
    }

    function idleLoop(now: number) {
      if (destroyed) return;
      render(now);
      if (phase === 'idle' && !reducedMotion) {
        idleRaf = window.requestAnimationFrame(idleLoop);
      } else {
        idleRaf = null;
      }
    }

    function stopIdleLoop() {
      if (idleRaf !== null) {
        window.cancelAnimationFrame(idleRaf);
        idleRaf = null;
      }
    }

    function stopMainLoop() {
      if (mainRaf !== null) {
        window.cancelAnimationFrame(mainRaf);
        mainRaf = null;
      }
    }

    function resize() {
      const rect = stage.getBoundingClientRect();
      cssWidth = Math.max(240, Math.min(rect.width || MAX_WIDTH, MAX_WIDTH));
      cssHeight = STAGE_HEIGHT;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      groundY = cssHeight - GROUND_OFFSET;
      canvas.width = Math.round(cssWidth * dpr);
      canvas.height = Math.round(cssHeight * dpr);
      canvas.style.width = `${cssWidth}px`;
      canvas.style.height = `${cssHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (runner.grounded) {
        runner.y = groundY - RUNNER_SIZE;
      }
      render(performance.now());
    }

    // -- input handlers --
    // Space/ArrowUp are handled on `window` (not the stage element) so the game
    // responds immediately on landing on the 404 page — no click-to-focus required.
    // This listener is only attached while GlitchRunner is mounted (removed on
    // unmount below), so preventDefault-ing page scroll here is naturally scoped
    // to when the game is actually on screen.
    function onKeyDown(event: KeyboardEvent) {
      if (event.repeat) return;
      if (event.code === 'Space' || event.key === ' ' || event.code === 'ArrowUp' || event.key === 'ArrowUp') {
        event.preventDefault();
        handleInput();
      }
    }

    function onPointerDown() {
      stage.focus();
      handleInput();
    }

    function onVisibilityChange() {
      if (document.hidden) {
        stopMainLoop();
        stopIdleLoop();
      } else {
        lastTime = performance.now();
        if (phase === 'running') {
          ensureMainLoop();
        } else if (phase === 'idle' && !reducedMotion) {
          idleRaf = window.requestAnimationFrame(idleLoop);
        } else {
          render(performance.now());
        }
      }
    }

    function onReducedMotionChange(event: MediaQueryListEvent) {
      reducedMotion = event.matches;
      if (reducedMotion) {
        stopIdleLoop();
        render(performance.now());
      } else if (phase === 'idle') {
        idleRaf = window.requestAnimationFrame(idleLoop);
      }
    }

    let resizeRaf: number | null = null;
    function onResize() {
      if (resizeRaf !== null) return;
      resizeRaf = window.requestAnimationFrame(() => {
        resizeRaf = null;
        resize();
      });
    }

    resize();
    window.addEventListener('keydown', onKeyDown);
    stage.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('resize', onResize);
    if (reducedMotionQuery.addEventListener) {
      reducedMotionQuery.addEventListener('change', onReducedMotionChange);
    }

    // Idle state: only animate the shimmer if motion is allowed. Otherwise a single
    // static render (already done via resize()) is enough until the user acts.
    if (!reducedMotion) {
      idleRaf = window.requestAnimationFrame(idleLoop);
    }

    return () => {
      destroyed = true;
      stopMainLoop();
      stopIdleLoop();
      if (flashTimeout) window.clearTimeout(flashTimeout);
      if (resizeRaf !== null) window.cancelAnimationFrame(resizeRaf);
      window.removeEventListener('keydown', onKeyDown);
      stage.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('resize', onResize);
      if (reducedMotionQuery.removeEventListener) {
        reducedMotionQuery.removeEventListener('change', onReducedMotionChange);
      }
      stage.classList.remove('is-glitching');
    };
  }, []);

  return (
    <div className="glitch-runner">
      <p className="glitch-runner__caption">WHILE YOU'RE HERE: GLITCH RUNNER</p>
      <div
        ref={wrapperRef}
        className="glitch-runner__stage"
        tabIndex={0}
        role="application"
        aria-label="Glitch Runner mini game. Press space to jump."
      >
        <canvas ref={canvasRef} className="glitch-runner__canvas" />
      </div>
    </div>
  );
}
