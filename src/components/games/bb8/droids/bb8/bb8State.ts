// BB-8 movement state — ported from the same ProcessingJS sketch's BB8.move(),
// see shared/pen.ts for the port's approach.
import { pcolor } from '../../shared/pen';
import { computeSteeringSpeed, lerp } from '../../shared/steering';

export const BB8_COLOR_THEMES = {
  orange: {
    main: pcolor(205, 118, 64),
    lightGray: pcolor(175, 170, 165),
    darkGray: pcolor(144, 147, 150),
    white: pcolor(245),
  },
  red: {
    main: pcolor(176, 69, 55),
    lightGray: pcolor(175, 170, 165),
    darkGray: pcolor(144, 147, 150),
    white: pcolor(245),
  },
  black: {
    main: pcolor(52, 54, 52),
    lightGray: pcolor(175, 170, 165),
    darkGray: pcolor(144, 147, 150),
    white: pcolor(77, 76, 76),
  },
} as const;

export type BB8ThemeName = keyof typeof BB8_COLOR_THEMES;
export const BB8_THEME_ORDER: BB8ThemeName[] = ['orange', 'red', 'black'];

export function createBB8State() {
  const diameter = 205;
  const radius = diameter / 2;
  return {
    x: 295,
    y: 443,
    colors: BB8_COLOR_THEMES.orange as (typeof BB8_COLOR_THEMES)[BB8ThemeName],
    head: { min: 0, max: 50, x: 0 },
    speed: 0,
    prevSpeed: 0,
    /** Degrees the head leans this frame — amplified & acceleration-kicked version of speed, see moveBB8. */
    headTilt: 0,
    diameter,
    radius,
    circumference: 2 * Math.PI * radius,
    angle: 0,
  };
}

export type BB8State = ReturnType<typeof createBB8State>;

const MAX_HEAD_TILT = 35;

/**
 * `pointerX`/`referenceX` are both in the same screen-pixel space (BB8.tsx
 * passes BB-8's current on-canvas center as referenceX). See
 * shared/steering.ts for the dead-zone/decay/mapRange steering math, shared
 * with every other droid in the scene.
 */
export function moveBB8(state: BB8State, pointerX: number | null, referenceX: number, controlRange: number) {
  state.speed = computeSteeringSpeed(state.speed, pointerX, referenceX, controlRange);
  state.angle += (state.speed / state.circumference) * 360;
  state.head.x = lerp(state.head.x, state.speed < 0 ? state.head.min : state.head.max, 0.05);

  // Head leans harder than a 1:1 tilt would, plus a brief extra kick on the
  // frames where speed is changing fastest — reads as BB-8 snapping its head
  // toward the new direction the moment it starts accelerating, not just
  // leaning proportionally to whatever speed it happens to be holding.
  const acceleration = state.speed - state.prevSpeed;
  state.headTilt = Math.max(-MAX_HEAD_TILT, Math.min(MAX_HEAD_TILT, state.speed * 1.4 + acceleration * 2));
  state.prevSpeed = state.speed;
}
