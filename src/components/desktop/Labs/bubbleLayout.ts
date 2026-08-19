/**
 * Where the bubbles start, and where they go when one is chosen.
 *
 * Pure and deterministic — no Math.random(). Two loads of /labs must produce the same opening
 * arrangement, or a prerendered snapshot and the hydrated page disagree about where seven circles
 * are, and the first frame jumps.
 */

import type { Bounds, Bubble } from './bubblePhysics';

export type Placement = { x: number; y: number; r: number };

/** Radius that lets `count` circles sit in `bounds` with room to move. Derived from the area each
 *  bubble gets rather than a fixed number, so the field does not overflow a short stage. */
/** Share of the stage the bubbles themselves occupy. At 0.2 there is room to drift and to throw;
 *  past ~0.3 the field is a jammed pile that cannot be relaxed into a non-overlapping start. */
const FILL = 0.2;

export const radiusFor = (count: number, bounds: Bounds): number => {
  if (count <= 0) return 0;
  const fromArea = Math.sqrt((bounds.width * bounds.height * FILL) / (count * Math.PI));
  return Math.max(30, Math.min(88, fromArea));
};

const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

/**
 * Opening positions: a phyllotaxis spiral (the sunflower-seed arrangement) fitted to the stage.
 * It is even without being a grid, and it is a closed form — no packing loop, no randomness, the
 * same answer every time for the same inputs.
 */
export const seedPositions = (count: number, bounds: Bounds, radius: number): Placement[] => {
  const centreX = bounds.width / 2;
  const centreY = bounds.height / 2;
  const maxRadius = Math.max(0, Math.min(centreX, centreY) - radius);
  const placements: Placement[] = [];

  for (let index = 0; index < count; index += 1) {
    // sqrt spreads the seeds evenly by area rather than crowding the rim.
    const t = count === 1 ? 0 : Math.sqrt((index + 0.5) / count);
    const angle = index * GOLDEN_ANGLE;
    // The stage is wider than it is tall, so the spiral is stretched to match rather than
    // leaving two empty columns at the sides.
    const spreadX = Math.min(maxRadius * (bounds.width / bounds.height), centreX - radius);
    placements.push({
      x: centreX + Math.cos(angle) * t * spreadX,
      y: centreY + Math.sin(angle) * t * maxRadius,
      r: radius,
    });
  }

  return relax(placements, bounds);
};

/**
 * Pushes a seeded arrangement apart until nothing intersects. The spiral is even, not packed —
 * two neighbouring seeds can still overlap at the radius the stage allows — and the field must
 * open with clean circles rather than resolving itself visibly in the first half second.
 *
 * Positions only: no velocity, no restitution. This is not the solver.
 */
const relax = (placements: Placement[], bounds: Bounds, iterations = 240): Placement[] => {
  const result = placements.map((placement) => ({ ...placement }));

  for (let pass = 0; pass < iterations; pass += 1) {
    let worst = 0;

    for (let i = 0; i < result.length; i += 1) {
      for (let j = i + 1; j < result.length; j += 1) {
        const a = result[i];
        const b = result[j];
        let dx = b.x - a.x;
        let dy = b.y - a.y;
        const minDistance = a.r + b.r;
        let distance = Math.hypot(dx, dy);
        if (distance >= minDistance) continue;

        if (distance === 0) {
          const angle = (i * GOLDEN_ANGLE + j) % (Math.PI * 2);
          dx = Math.cos(angle);
          dy = Math.sin(angle);
          distance = 0.0001;
        }

        const overlap = minDistance - distance;
        worst = Math.max(worst, overlap);
        // Half the correction each, plus a hair extra so a pass actually clears the contact
        // instead of leaving it exactly touching and re-triggering next iteration.
        const push = (overlap / distance) * 0.5 * 1.02;
        a.x -= dx * push;
        a.y -= dy * push;
        b.x += dx * push;
        b.y += dy * push;
      }
    }

    for (const placement of result) {
      placement.x = Math.min(Math.max(placement.x, placement.r), bounds.width - placement.r);
      placement.y = Math.min(Math.max(placement.y, placement.r), bounds.height - placement.r);
    }

    if (worst < 0.0005) break;
  }

  return result;
};

/** Seeded bubbles, at rest, ready for the first frame. */
export const seedBubbles = (ids: readonly string[], bounds: Bounds, radius = radiusFor(ids.length, bounds)): Bubble[] =>
  seedPositions(ids.length, bounds, radius).map((placement, index) => ({
    id: ids[index],
    x: placement.x,
    y: placement.y,
    vx: 0,
    vy: 0,
    r: placement.r,
  }));

export type RowOptions = {
  /** Centre line of the row, measured from the top of the stage. */
  top?: number;
  /** Gap between bubble edges. */
  gap?: number;
  /** Radius in the row. Smaller than the field: the row is a control strip, not the content. */
  radius?: number;
  /** The chosen bubble is drawn larger. */
  selectedScale?: number;
};

/**
 * Where each bubble lands when the field collapses into the carousel row. Order is the order the
 * labs are given in — the page's own newest-first sequence — not wherever physics left them, so
 * the row is stable across visits.
 *
 * Overflows the stage on purpose when the labs outgrow the width: the row scrolls horizontally,
 * and squeezing eight bubbles into a viewport is what makes a carousel stop looking like one.
 */
export const rowTargets = (count: number, bounds: Bounds, options: RowOptions = {}): Placement[] => {
  if (count <= 0) return [];

  // Width only. The strip animates its height open from zero, and a radius derived from that
  // height is zero on the first frame — the bubbles shrink to invisible dots and never recover,
  // because the targets are not recomputed once the animation finishes.
  const radius = options.radius ?? Math.min(48, (bounds.width / count) * 0.34);
  const gap = options.gap ?? radius * 0.55;
  const top = options.top ?? bounds.height / 2;
  const selectedScale = options.selectedScale ?? 1;

  const stride = radius * 2 + gap;
  const totalWidth = count * radius * 2 + (count - 1) * gap;
  const startX = Math.max(radius, (bounds.width - totalWidth) / 2) + radius;

  return Array.from({ length: count }, (_unused, index) => ({
    x: startX + index * stride,
    y: top,
    r: radius * selectedScale,
  }));
};

/**
 * How far down the field a bubble may go: the bottom of what the reader can actually see.
 *
 * The page is deliberately taller than one screen, so without this a fresh load lets bubbles drift
 * below the fold and someone who never scrolls sees two of seven. It tracks the viewport in both
 * directions — scrolling down opens the field up, scrolling back up closes it again and shoves the
 * bubbles along ahead of it, which is the point: the field is always the part of the page you are
 * looking at.
 */
export const visibleFloor = ({
  stageTop,
  stageHeight,
  scrollY,
  viewportHeight,
}: {
  /** The stage's offset from the top of the document. */
  stageTop: number;
  stageHeight: number;
  scrollY: number;
  viewportHeight: number;
}): number => {
  const seen = scrollY + viewportHeight - stageTop;
  // Never so shallow that there is no room to move at all, whatever the viewport is doing.
  const smallest = Math.min(stageHeight, 320);
  return Math.min(stageHeight, Math.max(smallest, seen));
};
