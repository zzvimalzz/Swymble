import { describe, expect, it } from 'vitest';
import { MAX_DT, arrived, atRest, maxOverlap, step, stepToward, type Bubble, type Bounds, type Rect } from './bubblePhysics';
import { radiusFor, rowTargets, seedBubbles, seedPositions, visibleFloor } from './bubbleLayout';

const BOUNDS: Bounds = { width: 900, height: 520 };
const IDS = ['cortex', 'mybirth', 'mydompet', 'oglets', 'territory', 'watchpaintdry', 'what2watch'];

/** Runs the solver the way the loop will, at a fixed 60fps. */
const run = (bubbles: Bubble[], frames: number, options = {}) => {
  let current = bubbles;
  for (let frame = 0; frame < frames; frame += 1) {
    current = step(current, BOUNDS, 1 / 60, options);
  }
  return current;
};

describe('bubble physics', () => {
  it('never lets a bubble leave the stage, however hard it is thrown', () => {
    const thrown = seedBubbles(IDS, BOUNDS).map((bubble, index) =>
      index === 0 ? { ...bubble, vx: 9000, vy: -7000 } : bubble,
    );

    for (const bubble of run(thrown, 600)) {
      expect(bubble.x - bubble.r).toBeGreaterThanOrEqual(-0.001);
      expect(bubble.y - bubble.r).toBeGreaterThanOrEqual(-0.001);
      expect(bubble.x + bubble.r).toBeLessThanOrEqual(BOUNDS.width + 0.001);
      expect(bubble.y + bubble.r).toBeLessThanOrEqual(BOUNDS.height + 0.001);
    }
  });

  it('separates bubbles that start stacked on the same point', () => {
    const stacked: Bubble[] = IDS.map((id) => ({ id, x: 450, y: 260, vx: 0, vy: 0, r: 52 }));
    expect(maxOverlap(run(stacked, 400))).toBeLessThan(1);
  });

  it('comes to rest when nothing is touching it', () => {
    const nudged = seedBubbles(IDS, BOUNDS).map((bubble) => ({ ...bubble, vx: 400, vy: -260 }));
    expect(atRest(nudged)).toBe(false);
    expect(atRest(run(nudged, 600))).toBe(true);
  });

  it('keeps the direction of a throw', () => {
    const alone: Bubble[] = [{ id: 'thrown', x: 200, y: 260, vx: 300, vy: -120, r: 50 }];
    const moved = run(alone, 12)[0];

    expect(moved.x).toBeGreaterThan(200);
    expect(moved.y).toBeLessThan(260);
    expect(moved.vx).toBeGreaterThan(0);
    expect(moved.vy).toBeLessThan(0);
  });

  it('travels the same distance per wall-clock second at 30fps and at 120fps', () => {
    // One bubble, no contacts: this is about the damping being time-based rather than
    // per-frame. A 60fps machine and a 144fps one must not drift at different speeds.
    const start: Bubble[] = [{ id: 'a', x: 200, y: 260, vx: 300, vy: 0, r: 40 }];

    let slow = start;
    for (let frame = 0; frame < 30; frame += 1) slow = step(slow, BOUNDS, 1 / 30);

    let fast = start;
    for (let frame = 0; frame < 120; frame += 1) fast = step(fast, BOUNDS, 1 / 120);

    // Integration error over a simulated second, not a behavioural difference.
    expect(Math.abs(slow[0].x - fast[0].x)).toBeLessThan(3);
    expect(Math.abs(slow[0].vx - fast[0].vx)).toBeLessThan(3);
  });

  it('clamps a long frame instead of tunnelling through a wall', () => {
    const one: Bubble[] = [{ id: 'a', x: 450, y: 260, vx: 1800, vy: 0, r: 50 }];
    const afterStall = step(one, BOUNDS, 4);
    const afterClamped = step(one, BOUNDS, MAX_DT);

    expect(afterStall[0].x).toBeCloseTo(afterClamped[0].x, 6);
    expect(afterStall[0].x + afterStall[0].r).toBeLessThanOrEqual(BOUNDS.width + 0.001);
  });

  it('moves a held bubble to the pointer and pushes its neighbours out of the way', () => {
    const pair: Bubble[] = [
      { id: 'held', x: 200, y: 260, vx: 0, vy: 0, r: 50 },
      { id: 'other', x: 320, y: 260, vx: 0, vy: 0, r: 50 },
    ];

    // A pointer dragged across, one frame at a time — not teleported, which would give the
    // held bubble a four-figure velocity and tell us nothing about the feel.
    let dragged = pair;
    let pointerX = 200;
    for (let frame = 0; frame < 24; frame += 1) {
      pointerX += 6;
      dragged = step(dragged, BOUNDS, 1 / 60, { heldId: 'held', heldTo: { x: pointerX, y: 260 } });
    }

    const held = dragged.find((bubble) => bubble.id === 'held');
    const other = dragged.find((bubble) => bubble.id === 'other');

    // The held bubble is exactly where the pointer is — it is not negotiated with.
    expect(held && held.x).toBeCloseTo(pointerX, 3);
    // And the one in its way has been shoved along ahead of it.
    expect(other && other.x).toBeGreaterThan(320);
    expect(maxOverlap(dragged)).toBeLessThan(1);
  });

  it('lets a big bubble shove a small one rather than the two splitting it evenly', () => {
    // Mass is area, so the fused bubble — √2 wider than a lab — pushes like it. Every bubble in
    // the loose field is the same size, so this changes nothing for the ordinary case; the test
    // above ('separates bubbles that start stacked') is what pins that.
    const pair: Bubble[] = [
      { id: 'big', x: 440, y: 260, vx: 0, vy: 0, r: 90 },
      { id: 'small', x: 540, y: 260, vx: 0, vy: 0, r: 40 },
    ];

    const settled = run(pair, 1);
    const big = settled.find((bubble) => bubble.id === 'big')!;
    const small = settled.find((bubble) => bubble.id === 'small')!;

    // Both move apart, but the small one does most of the moving — 90² against 40² is a little
    // over five to one, and that is the ratio they separate in.
    expect(small.x).toBeGreaterThan(540);
    expect(big.x).toBeLessThan(440);
    expect((small.x - 540) / (440 - big.x)).toBeCloseTo((90 * 90) / (40 * 40), 3);
  });

  it('splits a contact evenly when the two are the same size', () => {
    // The mass rule has to reduce to the old equal-share behaviour exactly, or the whole field
    // changes feel the day a radius is tweaked.
    const pair: Bubble[] = [
      { id: 'left', x: 450, y: 260, vx: 0, vy: 0, r: 60 },
      { id: 'right', x: 550, y: 260, vx: 0, vy: 0, r: 60 },
    ];

    const settled = run(pair, 1);
    const left = settled.find((bubble) => bubble.id === 'left')!;
    const right = settled.find((bubble) => bubble.id === 'right')!;

    expect(450 - left.x).toBeCloseTo(right.x - 550, 9);
  });

  it('does not wedge a bubble under a box that appeared on top of it', () => {
    // The specimen card is wide, solid, and sits with the floor not far below it. A bubble the
    // card opens on top of used to be pushed down — the nearest edge — into a gap it did not fit
    // in, where the wall pass put it straight back inside. It sat there half-buried for as long as
    // the card was open. The way out has to be one it fits through.
    const card: Rect = { x: 60, y: 200, width: 780, height: 260 };
    const trapped: Bubble[] = [{ id: 'caught', x: 450, y: 430, vx: 0, vy: 0, r: 60 }];

    let current = trapped;
    for (let frame = 0; frame < 90; frame += 1) {
      current = step(current, BOUNDS, 1 / 60, { obstacles: [card] });
    }

    const [bubble] = current;
    const clear =
      bubble.y + bubble.r <= card.y + 0.5 ||
      bubble.y - bubble.r >= card.y + card.height - 0.5 ||
      bubble.x + bubble.r <= card.x + 0.5 ||
      bubble.x - bubble.r >= card.x + card.width - 0.5;

    expect(clear).toBe(true);
    // And it is on the stage, not shoved through the floor to get there.
    expect(bubble.y + bubble.r).toBeLessThanOrEqual(BOUNDS.height + 0.001);
    expect(bubble.y - bubble.r).toBeGreaterThanOrEqual(-0.001);
  });

  it('does not mutate the bubbles it is given', () => {
    const original = seedBubbles(IDS, BOUNDS).map((bubble) => ({ ...bubble, vx: 500 }));
    const snapshot = JSON.stringify(original);
    step(original, BOUNDS, 1 / 60);
    expect(JSON.stringify(original)).toBe(snapshot);
  });
});

describe('bubble layout', () => {
  it('seeds every lab inside the stage without overlaps', () => {
    const seeded = seedBubbles(IDS, BOUNDS);

    expect(seeded).toHaveLength(IDS.length);
    expect(maxOverlap(seeded)).toBeLessThanOrEqual(0.001);

    for (const bubble of seeded) {
      expect(bubble.x - bubble.r).toBeGreaterThanOrEqual(-0.001);
      expect(bubble.x + bubble.r).toBeLessThanOrEqual(BOUNDS.width + 0.001);
      expect(bubble.y - bubble.r).toBeGreaterThanOrEqual(-0.001);
      expect(bubble.y + bubble.r).toBeLessThanOrEqual(BOUNDS.height + 0.001);
    }
  });

  it('seeds identically twice — the prerendered frame and the hydrated one must agree', () => {
    expect(seedPositions(7, BOUNDS, 60)).toEqual(seedPositions(7, BOUNDS, 60));
  });

  it('shrinks the radius as labs are added rather than overflowing the stage', () => {
    expect(radiusFor(12, BOUNDS)).toBeLessThan(radiusFor(4, BOUNDS));
    expect(maxOverlap(seedBubbles([...IDS, 'eight', 'nine', 'ten'], BOUNDS))).toBeLessThanOrEqual(0.001);
  });

  it('lays the row out left to right, evenly spaced, in the order given', () => {
    const targets = rowTargets(IDS.length, BOUNDS);
    const gaps = targets.slice(1).map((target, index) => target.x - targets[index].x);

    expect(targets.every((target) => target.y === targets[0].y)).toBe(true);
    for (const gap of gaps) expect(gap).toBeCloseTo(gaps[0], 6);
    expect(targets[0].x).toBeLessThan(targets[targets.length - 1].x);
  });

  it('keeps the row on the stage for the current roster', () => {
    const targets = rowTargets(IDS.length, BOUNDS);
    expect(targets[0].x - targets[0].r).toBeGreaterThanOrEqual(-0.001);
    expect(targets[targets.length - 1].x + targets[0].r).toBeLessThanOrEqual(BOUNDS.width + 0.001);
  });
});

describe('the transition into the row', () => {
  const targets = new Map(
    rowTargets(IDS.length, BOUNDS).map((target, index) => [IDS[index], target]),
  );

  it('brings every bubble to its slot and stops', () => {
    let current = seedBubbles(IDS, BOUNDS).map((bubble) => ({ ...bubble, vx: 600, vy: -400 }));
    for (let frame = 0; frame < 240; frame += 1) {
      current = stepToward(current, targets, 1 / 60);
    }

    expect(arrived(current, targets)).toBe(true);
    for (const bubble of current) {
      const target = targets.get(bubble.id);
      expect(target && Math.hypot(target.x - bubble.x, target.y - bubble.y)).toBeLessThan(0.6);
    }
  });

  it('does not overshoot on the way there', () => {
    const start: Bubble[] = [{ id: 'a', x: 100, y: 260, vx: 0, vy: 0, r: 60 }];
    const single = new Map([['a', { x: 700, y: 100, r: 40 }]]);

    let current = start;
    let furthest = 0;
    for (let frame = 0; frame < 240; frame += 1) {
      current = stepToward(current, single, 1 / 60);
      furthest = Math.max(furthest, current[0].x);
    }

    // A critically damped spring arrives from one side only.
    expect(furthest).toBeLessThanOrEqual(700.5);
    expect(arrived(current, single)).toBe(true);
  });

  it('is a no-op for a bubble with no slot', () => {
    const orphan: Bubble[] = [{ id: 'ghost', x: 10, y: 20, vx: 5, vy: 5, r: 30 }];
    expect(stepToward(orphan, targets, 1 / 60)[0]).toEqual(orphan[0]);
  });
});

describe('the page as an obstacle course', () => {
  const heading = { x: 60, y: 40, width: 520, height: 120 };

  it('never leaves a bubble inside the title', () => {
    let current: Bubble[] = [{ id: 'a', x: 320, y: 400, vx: 0, vy: -900, r: 46 }];
    for (let frame = 0; frame < 400; frame += 1) {
      current = step(current, BOUNDS, 1 / 60, { obstacles: [heading] });
      const bubble = current[0];
      const insideX = bubble.x > heading.x && bubble.x < heading.x + heading.width;
      const insideY = bubble.y > heading.y && bubble.y < heading.y + heading.height;
      expect(insideX && insideY).toBe(false);
    }
  });

  it('bounces off a heading instead of passing through it', () => {
    let current: Bubble[] = [{ id: 'a', x: 320, y: 320, vx: 0, vy: -400, r: 40 }];
    for (let frame = 0; frame < 40; frame += 1) {
      current = step(current, BOUNDS, 1 / 60, { obstacles: [heading] });
    }
    expect(current[0].vy).toBeGreaterThan(0);
    expect(current[0].y).toBeGreaterThan(heading.y + heading.height);
  });

  it('pushes a bubble that starts inside a box back out of it', () => {
    const trapped: Bubble[] = [{ id: 'a', x: 320, y: 100, vx: 0, vy: 0, r: 40 }];
    const freed = step(trapped, BOUNDS, 1 / 60, { obstacles: [heading] })[0];
    const insideX = freed.x > heading.x && freed.x < heading.x + heading.width;
    const insideY = freed.y > heading.y && freed.y < heading.y + heading.height;
    expect(insideX && insideY).toBe(false);
  });
});

describe('the idle drift', () => {
  it('keeps a still field moving, slowly, forever', () => {
    let current = seedBubbles(IDS, BOUNDS);
    let time = 0;
    for (let frame = 0; frame < 900; frame += 1) {
      time += 1 / 60;
      current = step(current, BOUNDS, 1 / 60, { wander: { time } });
    }

    expect(atRest(current)).toBe(false);
    for (const bubble of current) {
      // Drifting, not flying: fast enough to notice over seconds, slow enough to ignore.
      expect(Math.hypot(bubble.vx, bubble.vy)).toBeLessThan(140);
    }
    expect(maxOverlap(current)).toBeLessThan(1);
  });

  it('drifts identically for the same inputs', () => {
    const runOnce = () => {
      let current = seedBubbles(IDS, BOUNDS);
      let time = 0;
      for (let frame = 0; frame < 120; frame += 1) {
        time += 1 / 60;
        current = step(current, BOUNDS, 1 / 60, { wander: { time } });
      }
      return current.map((bubble) => [Math.round(bubble.x), Math.round(bubble.y)]);
    };

    expect(runOnce()).toEqual(runOnce());
  });
});

describe('dragging a bubble against a heading', () => {
  const heading = { x: 60, y: 200, width: 520, height: 120 };

  it('never pops it out of the far side', () => {
    // The pointer starts above the heading and is dragged straight down through it.
    let current: Bubble[] = [{ id: 'held', x: 320, y: 120, vx: 0, vy: 0, r: 44 }];
    let pointerY = 120;

    for (let frame = 0; frame < 60; frame += 1) {
      pointerY += 6;
      current = step(current, BOUNDS, 1 / 60, {
        heldId: 'held',
        heldTo: { x: 320, y: pointerY },
        obstacles: [heading],
      });

      // It may press against the top edge, but it must never appear underneath.
      expect(current[0].y).toBeLessThanOrEqual(heading.y + 0.001);
    }
  });

  it('keeps it below when it was dragged up from below', () => {
    let current: Bubble[] = [{ id: 'held', x: 320, y: 480, vx: 0, vy: 0, r: 44 }];
    for (let frame = 0; frame < 40; frame += 1) {
      current = step(current, BOUNDS, 1 / 60, {
        heldId: 'held',
        heldTo: { x: 320, y: 400 - frame * 2 },
        obstacles: [heading],
      });
    }
    // Approached from below, it stays below.
    expect(current[0].y).toBeGreaterThanOrEqual(heading.y + heading.height - 0.001);
  });
});

describe('the floor follows the reader', () => {
  const stage = { stageTop: 120, stageHeight: 2000, viewportHeight: 900 };

  it('starts at the bottom of the first screen, not the bottom of the page', () => {
    expect(visibleFloor({ ...stage, scrollY: 0 })).toBe(780);
  });

  it('opens up as the reader scrolls down', () => {
    expect(visibleFloor({ ...stage, scrollY: 600 })).toBe(1380);
  });

  it('closes again on the way back up, pushing the bubbles along with it', () => {
    expect(visibleFloor({ ...stage, scrollY: 900 })).toBe(1680);
    expect(visibleFloor({ ...stage, scrollY: 200 })).toBe(980);
    expect(visibleFloor({ ...stage, scrollY: 0 })).toBe(780);
  });

  it('never exceeds the stage, and never collapses to nothing', () => {
    expect(visibleFloor({ ...stage, scrollY: 5000 })).toBe(2000);
    expect(visibleFloor({ ...stage, scrollY: -5000 })).toBe(320);
  });
});

describe('the row at any band height', () => {
  it('sizes the bubbles from the width, so a strip still opening does not shrink them away', () => {
    const opening = rowTargets(7, { width: 1280, height: 0 });
    const open = rowTargets(7, { width: 1280, height: 176 });

    expect(opening[0].r).toBeGreaterThan(20);
    expect(opening[0].r).toBe(open[0].r);
  });
});

describe('a gap too small to sit in', () => {
  // The real geometry off /labs: the nav, then the page heading 81px below it, against a bubble
  // 176px across. Resolved one box at a time, it ping-pongs between them and looks frozen.
  const nav = { x: -6, y: -6, width: 1452, height: 111 };
  const heading = { x: 86, y: 186, width: 1268, height: 112 };

  it('pushes a wedged bubble clear of both boxes', () => {
    let current: Bubble[] = [{ id: 'a', x: 500, y: 98, vx: 0, vy: 0, r: 88 }];
    for (let frame = 0; frame < 30; frame += 1) {
      current = step(current, { width: 1440, height: 900 }, 1 / 60, { obstacles: [nav, heading] });
    }

    // Below the heading, not stuck in the slot between the two.
    expect(current[0].y).toBeGreaterThanOrEqual(heading.y + heading.height + current[0].r - 0.001);
  });

  it('does not move a bubble that is clear of both', () => {
    const free: Bubble[] = [{ id: 'a', x: 500, y: 600, vx: 0, vy: 0, r: 88 }];
    const after = step(free, { width: 1440, height: 900 }, 1 / 60, { obstacles: [nav, heading] });
    expect(after[0].y).toBeCloseTo(600, 3);
  });
});

describe('a barrier that moves into a bubble propels it', () => {
  it('kicks a resting bubble off a rising floor instead of carrying it', () => {
    const resting: Bubble[] = [{ id: 'a', x: 400, y: 700 - 88, vx: 0, vy: 0, r: 88 }];

    // The floor comes up 40px, the way it does while the reader scrolls back up the page.
    const pushed = step(resting, { width: 900, height: 660 }, 1 / 60)[0];

    expect(pushed.y).toBeLessThanOrEqual(660 - 88 + 0.001);
    expect(pushed.vy).toBeLessThan(-100);
  });

  it('leaves a bubble already at rest against a wall alone', () => {
    let current: Bubble[] = [{ id: 'a', x: 400, y: 660 - 88, vx: 0, vy: 0, r: 88 }];
    for (let frame = 0; frame < 12; frame += 1) {
      current = step(current, { width: 900, height: 660 }, 1 / 60);
    }
    // No jitter: a resting contact is not a shove.
    expect(Math.abs(current[0].vy)).toBeLessThan(30);
  });
});

